const mongoose = require('mongoose');
const stockGroupSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'StockGroup', default: null },
  isPrimary: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });
stockGroupSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('StockGroup', stockGroupSchema);
