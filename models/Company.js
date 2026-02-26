const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  alias: { type: String, trim: true },
  address: { type: String },
  state: { type: String },
  stateCode: { type: String },
  pan: { type: String, uppercase: true },
  gstin: { type: String, uppercase: true },
  cin: { type: String },
  financialYearStart: { type: Date, default: () => new Date(new Date().getFullYear(), 3, 1) },
  financialYearEnd: { type: Date, default: () => new Date(new Date().getFullYear() + 1, 2, 31) },
  booksBeginsFrom: { type: Date },
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);
