const Company = require('../models/Company');
const Ledger = require('../models/Ledger');
const { getTrialBalance, getProfitAndLoss, getBalanceSheet, getDayBook, getCashBankBook } = require('../utils/reportEngine');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

exports.getTrialBalance = async (req, res) => {
  try {
    const { company, date } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const result = await getTrialBalance(company, date || new Date());
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getBalanceSheet = async (req, res) => {
  try {
    const { company, date } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const result = await getBalanceSheet(company, date || new Date());
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getProfitLoss = async (req, res) => {
  try {
    const { company, from, to } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const toDate = to || new Date();
    const fromDate = from || new Date(new Date(toDate).getFullYear(), 3, 1);
    const result = await getProfitAndLoss(company, fromDate, toDate);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getDayBook = async (req, res) => {
  try {
    const { company, date } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const result = await getDayBook(company, date || new Date());
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getCashBook = async (req, res) => {
  try {
    const { company, from, to } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    // Find Cash ledger
    const cashLedger = await Ledger.findOne({ company, name: 'Cash' });
    if (!cashLedger) return res.status(404).json({ message: 'Cash ledger not found' });

    const toDate = to || new Date();
    const fromDate = from || (() => {
      const d = new Date(toDate);
      d.setDate(1);
      return d;
    })();

    const result = await getCashBankBook(company, cashLedger._id, fromDate, toDate);
    res.json({ ...result, ledger: cashLedger });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getBankBook = async (req, res) => {
  try {
    const { company, ledger: ledgerId, from, to } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

    const toDate = to || new Date();
    const fromDate = from || (() => {
      const d = new Date(toDate);
      d.setDate(1);
      return d;
    })();

    const result = await getCashBankBook(company, ledgerId, fromDate, toDate);
    res.json({ ...result, ledger });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getLedgerReport = async (req, res) => {
  try {
    const { company, ledger: ledgerId, from, to } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const ledger = await Ledger.findById(ledgerId).populate('group', 'name');
    if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

    const toDate = to || new Date();
    const fromDate = from || (() => {
      const d = new Date(toDate);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    })();

    const result = await getCashBankBook(company, ledgerId, fromDate, toDate);
    res.json({ ...result, ledger });
  } catch (err) {
    sendError(res, err);
  }
};
