const mongoose = require('mongoose');
const stockItemSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'StockGroup' },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: 'StockUnit' },
  hsnCode: { type: String },
  gstRate: { type: Number, default: 0 },
  taxability: { type: String, enum: ['Taxable', 'Nil Rated', 'Exempt', 'Non-GST'], default: 'Taxable' },
  costingMethod: { type: String, enum: ['FIFO', 'Average', 'LIFO'], default: 'Average' },
  standardRate: { type: Number, default: 0 },
  openingQuantity: { type: Number, default: 0 },
  openingRate: { type: Number, default: 0 },
  openingValue: { type: Number, default: 0 },
  salesLedger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
  purchaseLedger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
stockItemSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('StockItem', stockItemSchema);
