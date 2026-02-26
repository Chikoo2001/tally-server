const LedgerGroup = require('../models/LedgerGroup');
const Company = require('../models/Company');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

exports.getGroups = async (req, res) => {
  try {
    const { company } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const groups = await LedgerGroup.find({ company }).populate('parent', 'name').sort({ sortOrder: 1, name: 1 });
    res.json(groups);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getGroupTree = async (req, res) => {
  try {
    const { company } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const groups = await LedgerGroup.find({ company }).sort({ sortOrder: 1, name: 1 }).lean();
    const map = {};
    const roots = [];
    for (const g of groups) {
      map[g._id.toString()] = { ...g, children: [] };
    }
    for (const g of Object.values(map)) {
      if (g.parent) {
        const pid = g.parent.toString();
        if (map[pid]) map[pid].children.push(g);
      } else {
        roots.push(g);
      }
    }
    res.json(roots);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { company } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const group = await LedgerGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await LedgerGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(group.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (group.isSystem)
      return res.status(400).json({ message: 'System groups cannot be modified' });

    Object.assign(group, req.body);
    await group.save();
    res.json(group);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await LedgerGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(group.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (group.isSystem)
      return res.status(400).json({ message: 'System groups cannot be deleted' });

    await group.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
};
