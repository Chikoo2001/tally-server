const Company = require('../models/Company');
const { seedCompanyData } = require('../utils/tallySeed');
const { sendError } = require('../utils/errorResponse');

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ user: req.user._id, isActive: true }).sort({ name: 1 });
    res.json(companies);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create({ ...req.body, user: req.user._id });
    await seedCompanyData(company._id);
    res.status(201).json(company);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, user: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await Company.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false }
    );
    res.json({ message: 'Company deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getCompanySummary = async (req, res) => {
  try {
    const LedgerGroup = require('../models/LedgerGroup');
    const Ledger = require('../models/Ledger');
    const Voucher = require('../models/Voucher');
    const company = await Company.findOne({ _id: req.params.id, user: req.user._id });
    if (!company) return res.status(404).json({ message: 'Not found' });

    const groupCount = await LedgerGroup.countDocuments({ company: company._id });
    const ledgerCount = await Ledger.countDocuments({ company: company._id });
    const voucherCount = await Voucher.countDocuments({ company: company._id, isDeleted: false });

    res.json({ company, groupCount, ledgerCount, voucherCount });
  } catch (err) {
    sendError(res, err);
  }
};
