const Ledger = require('../models/Ledger');
const Company = require('../models/Company');
const { getTrialBalance, getLedgerStatement } = require('../utils/reportEngine');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

exports.getLedgers = async (req, res) => {
  try {
    const { company, search, nature, group } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const query = { company, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (group) query.group = group;

    let ledgers = await Ledger.find(query)
      .populate({ path: 'group', populate: { path: 'parent' } })
      .sort({ name: 1 });

    // Filter by group nature if requested
    if (nature) {
      ledgers = ledgers.filter(l => l.group && l.group.nature === nature);
    }

    res.json(ledgers);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id).populate('group');
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(ledger.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    res.json(ledger);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createLedger = async (req, res) => {
  try {
    const { company } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const ledger = await Ledger.create(req.body);
    res.status(201).json(ledger);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(ledger.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    Object.assign(ledger, req.body);
    await ledger.save();
    res.json(ledger);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteLedger = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(ledger.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (ledger.isSystem)
      return res.status(400).json({ message: 'System ledgers cannot be deleted' });

    ledger.isActive = false;
    await ledger.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getLedgerBalance = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(ledger.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { to } = req.query;
    const tb = await getTrialBalance(ledger.company, to || new Date());
    const entry = tb.entries.find(e => e.ledger._id.toString() === req.params.id);
    res.json(entry || { closingBalance: 0, closingType: 'Dr' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getLedgerStatement = async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(ledger.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const { from, to } = req.query;
    const result = await getLedgerStatement(ledger.company, req.params.id, from, to || new Date());
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
};
