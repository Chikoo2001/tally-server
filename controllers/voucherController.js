const Voucher = require('../models/Voucher');
const Company = require('../models/Company');
const { getNextVoucherNumber } = require('../utils/voucherNumber');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

exports.getVouchers = async (req, res) => {
  try {
    const { company, type, from, to, page = 1, limit = 50 } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const query = { company, isDeleted: false };
    if (type) query.voucherType = type;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    const total = await Voucher.countDocuments(query);
    const vouchers = await Voucher.find(query)
      .populate('entries.ledger', 'name')
      .populate('partyLedger', 'name')
      .sort({ date: -1, serialNumber: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ vouchers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('entries.ledger', 'name')
      .populate('partyLedger', 'name')
      .populate('entries.stockItem', 'name');
    if (!voucher || voucher.isDeleted) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(voucher.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    res.json(voucher);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getNextNumber = async (req, res) => {
  try {
    const { company, type } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const result = await getNextVoucherNumber(company, type, new Date());
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const { company, voucherType, date, entries } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    // Validate Dr = Cr
    if (entries && entries.length > 0) {
      const totalDr = entries.filter(e => e.type === 'Dr').reduce((s, e) => s + e.amount, 0);
      const totalCr = entries.filter(e => e.type === 'Cr').reduce((s, e) => s + e.amount, 0);
      if (Math.abs(totalDr - totalCr) > 0.01) {
        return res.status(400).json({ message: `Voucher not balanced. Dr: ${totalDr.toFixed(2)}, Cr: ${totalCr.toFixed(2)}` });
      }
    }

    const { voucherNumber, serialNumber } = await getNextVoucherNumber(company, voucherType, date || new Date());
    const voucher = await Voucher.create({
      ...req.body,
      voucherNumber,
      serialNumber,
    });

    res.status(201).json(voucher);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher || voucher.isDeleted) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(voucher.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const entries = req.body.entries || voucher.entries;
    const totalDr = entries.filter(e => e.type === 'Dr').reduce((s, e) => s + e.amount, 0);
    const totalCr = entries.filter(e => e.type === 'Cr').reduce((s, e) => s + e.amount, 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
      return res.status(400).json({ message: `Voucher not balanced. Dr: ${totalDr.toFixed(2)}, Cr: ${totalCr.toFixed(2)}` });
    }

    Object.assign(voucher, req.body);
    await voucher.save();
    res.json(voucher);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(voucher.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    voucher.isDeleted = true;
    await voucher.save();
    res.json({ message: 'Voucher deleted' });
  } catch (err) {
    sendError(res, err);
  }
};
