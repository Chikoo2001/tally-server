const StockGroup = require('../models/StockGroup');
const StockUnit = require('../models/StockUnit');
const StockItem = require('../models/StockItem');
const Company = require('../models/Company');
const Voucher = require('../models/Voucher');
const { sendError } = require('../utils/errorResponse');

async function verifyCompany(companyId, userId) {
  const company = await Company.findOne({ _id: companyId, user: userId });
  return !!company;
}

// Stock Groups
exports.getStockGroups = async (req, res) => {
  try {
    const { company } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const groups = await StockGroup.find({ company }).populate('parent', 'name').sort({ name: 1 });
    res.json(groups);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createStockGroup = async (req, res) => {
  try {
    const { company } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const group = await StockGroup.create(req.body);
    res.status(201).json(group);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateStockGroup = async (req, res) => {
  try {
    const group = await StockGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(group.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (group.isSystem) return res.status(400).json({ message: 'System groups cannot be modified' });
    Object.assign(group, req.body);
    await group.save();
    res.json(group);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteStockGroup = async (req, res) => {
  try {
    const group = await StockGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(group.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (group.isSystem) return res.status(400).json({ message: 'System groups cannot be deleted' });
    await group.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

// Stock Units
exports.getStockUnits = async (req, res) => {
  try {
    const { company } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const units = await StockUnit.find({ company }).sort({ name: 1 });
    res.json(units);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createStockUnit = async (req, res) => {
  try {
    const { company } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const unit = await StockUnit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateStockUnit = async (req, res) => {
  try {
    const unit = await StockUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(unit.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (unit.isSystem) return res.status(400).json({ message: 'System units cannot be modified' });
    Object.assign(unit, req.body);
    await unit.save();
    res.json(unit);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteStockUnit = async (req, res) => {
  try {
    const unit = await StockUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(unit.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    if (unit.isSystem) return res.status(400).json({ message: 'System units cannot be deleted' });
    await unit.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

// Stock Items
exports.getStockItems = async (req, res) => {
  try {
    const { company, search } = req.query;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const query = { company, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    const items = await StockItem.find(query)
      .populate('group', 'name')
      .populate('unit', 'name symbol')
      .sort({ name: 1 });
    res.json(items);
  } catch (err) {
    sendError(res, err);
  }
};

exports.getStockItem = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id)
      .populate('group', 'name')
      .populate('unit', 'name symbol');
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(item.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    res.json(item);
  } catch (err) {
    sendError(res, err);
  }
};

exports.createStockItem = async (req, res) => {
  try {
    const { company } = req.body;
    if (!await verifyCompany(company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    const item = await StockItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateStockItem = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(item.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteStockItem = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(item.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    item.isActive = false;
    await item.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
};

exports.getStockMovement = async (req, res) => {
  try {
    const item = await StockItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (!await verifyCompany(item.company, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const vouchers = await Voucher.find({
      company: item.company,
      isDeleted: false,
      'entries.stockItem': item._id,
    })
      .populate('entries.ledger', 'name')
      .sort({ date: 1 })
      .lean();

    const movements = [];
    for (const v of vouchers) {
      for (const e of v.entries) {
        if (e.stockItem && e.stockItem.toString() === req.params.id) {
          movements.push({
            date: v.date,
            voucherNumber: v.voucherNumber,
            voucherType: v.voucherType,
            type: e.type,
            quantity: e.quantity,
            rate: e.rate,
            amount: e.amount,
          });
        }
      }
    }
    res.json(movements);
  } catch (err) {
    sendError(res, err);
  }
};
