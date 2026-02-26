const mongoose = require('mongoose');
const stockUnitSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  symbol: { type: String, trim: true },
  isCompound: { type: Boolean, default: false },
  conversionFactor: { type: Number, default: 1 },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });
stockUnitSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('StockUnit', stockUnitSchema);
