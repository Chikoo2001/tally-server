const mongoose = require('mongoose');
const ledgerGroupSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  alias: { type: String, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerGroup', default: null },
  nature: { type: String, enum: ['assets', 'liabilities', 'income', 'expenses'], required: true },
  affectsGrossProfit: { type: Boolean, default: false },
  isPrimary: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
ledgerGroupSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('LedgerGroup', ledgerGroupSchema);
