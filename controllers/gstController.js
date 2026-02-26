const Voucher = require('../models/Voucher');
const Company = require('../models/Company');
const Ledger = require('../models/Ledger');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

function getMonthRange(month, year) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59);
  return { from, to };
}

exports.getGSTR1 = async (req, res) => {
  try {
    const { company, month, year } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { from, to } = getMonthRange(parseInt(month), parseInt(year));

    const vouchers = await Voucher.find({
      company,
      voucherType: { $in: ['Sales', 'CreditNote'] },
      isGSTVoucher: true,
      date: { $gte: from, $lte: to },
      isDeleted: false,
    })
      .populate('partyLedger', 'name gstin state gstRegistrationType')
      .lean();

    const b2b = {};
    const b2cl = [];
    const b2cs = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
    const hsnSummary = {};

    for (const v of vouchers) {
      const gb = v.gstBreakup || {};
      const taxableAmount = gb.taxableAmount || 0;
      const totalGST = (gb.cgstAmount || 0) + (gb.sgstAmount || 0) + (gb.igstAmount || 0);
      const isCredit = v.voucherType === 'CreditNote';
      const sign = isCredit ? -1 : 1;

      const partyGSTIN = v.partyLedger?.gstin;
      const isB2B = partyGSTIN && partyGSTIN.length === 15;

      if (isB2B) {
        if (!b2b[partyGSTIN]) {
          b2b[partyGSTIN] = {
            gstin: partyGSTIN,
            partyName: v.partyLedger?.name || v.partyName || '',
            invoices: [],
          };
        }
        b2b[partyGSTIN].invoices.push({
          voucherNumber: v.voucherNumber,
          date: v.date,
          taxableAmount: sign * taxableAmount,
          cgstAmount: sign * (gb.cgstAmount || 0),
          sgstAmount: sign * (gb.sgstAmount || 0),
          igstAmount: sign * (gb.igstAmount || 0),
          totalAmount: sign * (taxableAmount + totalGST),
          isCredit,
        });
      } else if (taxableAmount > 250000) {
        b2cl.push({
          voucherNumber: v.voucherNumber,
          date: v.date,
          state: v.placeOfSupply || '',
          taxableAmount: sign * taxableAmount,
          igstAmount: sign * (gb.igstAmount || 0),
        });
      } else {
        b2cs.taxableValue += sign * taxableAmount;
        b2cs.cgst += sign * (gb.cgstAmount || 0);
        b2cs.sgst += sign * (gb.sgstAmount || 0);
        b2cs.igst += sign * (gb.igstAmount || 0);
      }

      // HSN summary from entries
      for (const entry of v.entries) {
        if (entry.stockItem && entry.rate && entry.quantity) {
          const hsn = 'N/A'; // Would need to populate stockItem.hsnCode
          if (!hsnSummary[hsn]) hsnSummary[hsn] = { hsnCode: hsn, quantity: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
          hsnSummary[hsn].quantity += sign * (entry.quantity || 0);
          hsnSummary[hsn].taxableValue += sign * entry.amount;
        }
      }
    }

    res.json({
      b2b: Object.values(b2b),
      b2cl,
      b2cs,
      hsnSummary: Object.values(hsnSummary),
      period: { month, year },
    });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getGSTR3B = async (req, res) => {
  try {
    const { company, month, year } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { from, to } = getMonthRange(parseInt(month), parseInt(year));

    const salesVouchers = await Voucher.find({
      company,
      voucherType: { $in: ['Sales', 'CreditNote'] },
      isGSTVoucher: true,
      date: { $gte: from, $lte: to },
      isDeleted: false,
    }).lean();

    const purchaseVouchers = await Voucher.find({
      company,
      voucherType: { $in: ['Purchase', 'DebitNote'] },
      isGSTVoucher: true,
      isReverseCharge: false,
      date: { $gte: from, $lte: to },
      isDeleted: false,
    }).lean();

    function sumGST(vouchers) {
      return vouchers.reduce((acc, v) => {
        const gb = v.gstBreakup || {};
        const sign = v.voucherType === 'CreditNote' || v.voucherType === 'DebitNote' ? -1 : 1;
        acc.taxableValue += sign * (gb.taxableAmount || 0);
        acc.cgst += sign * (gb.cgstAmount || 0);
        acc.sgst += sign * (gb.sgstAmount || 0);
        acc.igst += sign * (gb.igstAmount || 0);
        return acc;
      }, { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 });
    }

    const outward = sumGST(salesVouchers);
    const itc = sumGST(purchaseVouchers);

    const netCGST = outward.cgst - itc.cgst;
    const netSGST = outward.sgst - itc.sgst;
    const netIGST = outward.igst - itc.igst;

    res.json({
      outward,
      itc,
      netPayable: { cgst: netCGST, sgst: netSGST, igst: netIGST, total: netCGST + netSGST + netIGST },
      period: { month, year },
    });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getHSNSummary = async (req, res) => {
  try {
    const { company, from, to } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const vouchers = await Voucher.find({
      company,
      voucherType: 'Sales',
      isGSTVoucher: true,
      date: { $gte: fromDate, $lte: toDate },
      isDeleted: false,
    })
      .populate('entries.stockItem', 'name hsnCode gstRate')
      .lean();

    const summary = {};
    for (const v of vouchers) {
      for (const entry of v.entries) {
        if (entry.stockItem && entry.quantity) {
          const hsnCode = entry.stockItem.hsnCode || 'N/A';
          if (!summary[hsnCode]) {
            summary[hsnCode] = {
              hsnCode,
              description: entry.stockItem.name,
              gstRate: entry.stockItem.gstRate || 0,
              quantity: 0,
              taxableValue: 0,
            };
          }
          summary[hsnCode].quantity += entry.quantity;
          summary[hsnCode].taxableValue += entry.amount;
        }
      }
    }

    res.json(Object.values(summary));
  } catch (err) {
    sendError(res, err);
  }
};
