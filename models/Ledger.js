const mongoose = require('mongoose');
const ledgerSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerGroup', required: true },
  name: { type: String, required: true, trim: true },
  alias: { type: String, trim: true },
  openingBalance: { type: Number, default: 0 },
  openingBalanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  partyType: { type: String, enum: ['customer', 'vendor', 'both', ''], default: '' },
  address: { type: String },
  state: { type: String },
  phone: { type: String },
  email: { type: String },
  pan: { type: String, uppercase: true },
  gstin: { type: String, uppercase: true },
  gstRegistrationType: { type: String, enum: ['Regular', 'Composition', 'Unregistered', 'Consumer', 'Overseas', ''], default: '' },
  bankAccountNumber: { type: String },
  bankName: { type: String },
  ifscCode: { type: String, uppercase: true },
  taxType: { type: String, enum: ['GST', 'TDS', 'TCS', ''], default: '' },
  gstRate: { type: Number, default: 0 },
  hsnCode: { type: String },
  sacCode: { type: String },
  isBillwiseMaintained: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
ledgerSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Ledger', ledgerSchema);
