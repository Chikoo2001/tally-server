const mongoose = require('mongoose');
const entrySchema = new mongoose.Schema({
  ledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true },
  type: { type: String, enum: ['Dr', 'Cr'], required: true },
  amount: { type: Number, required: true, min: 0 },
  stockItem: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem' },
  quantity: { type: Number },
  rate: { type: Number },
  billRef: { type: String },
}, { _id: false });

const gstBreakupSchema = new mongoose.Schema({
  taxableAmount: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
}, { _id: false });

const voucherSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  voucherType: { type: String, enum: ['Contra', 'Payment', 'Receipt', 'Journal', 'Sales', 'Purchase', 'CreditNote', 'DebitNote'], required: true },
  voucherNumber: { type: String },
  serialNumber: { type: Number },
  date: { type: Date, required: true },
  partyLedger: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
  partyName: { type: String },
  narration: { type: String },
  entries: [entrySchema],
  isGSTVoucher: { type: Boolean, default: false },
  supplyType: { type: String, enum: ['B2B', 'B2C', 'Export', 'SEZ', ''], default: '' },
  placeOfSupply: { type: String },
  isReverseCharge: { type: Boolean, default: false },
  gstBreakup: { type: gstBreakupSchema, default: () => ({}) },
  chequeNumber: { type: String },
  chequeDate: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

voucherSchema.index({ company: 1, voucherType: 1, serialNumber: 1 });
voucherSchema.index({ company: 1, date: 1 });
module.exports = mongoose.model('Voucher', voucherSchema);
