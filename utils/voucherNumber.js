const Voucher = require('../models/Voucher');

const TYPE_CODES = {
  Contra: 'CON',
  Payment: 'PAY',
  Receipt: 'RCP',
  Journal: 'JRN',
  Sales: 'SALES',
  Purchase: 'PURCH',
  CreditNote: 'CN',
  DebitNote: 'DN',
};

function getFinancialYear(date) {
  const d = new Date(date);
  const month = d.getMonth();
  const year = d.getFullYear();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

async function getNextVoucherNumber(companyId, voucherType, date) {
  const fy = getFinancialYear(date);
  const typeCode = TYPE_CODES[voucherType] || voucherType.toUpperCase();

  const [startYearStr] = fy.split('-');
  const startYear = parseInt(startYearStr);
  const fyStart = new Date(startYear, 3, 1);
  const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);

  const last = await Voucher.findOne({
    company: companyId,
    voucherType,
    date: { $gte: fyStart, $lte: fyEnd },
    isDeleted: false,
  }).sort({ serialNumber: -1 }).select('serialNumber');

  const serial = last ? last.serialNumber + 1 : 1;
  const voucherNumber = `${typeCode}/${fy}/${String(serial).padStart(4, '0')}`;
  return { voucherNumber, serialNumber: serial, financialYear: fy };
}

module.exports = { getNextVoucherNumber, getFinancialYear };
