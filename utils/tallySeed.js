const LedgerGroup = require('../models/LedgerGroup');
const Ledger = require('../models/Ledger');
const StockGroup = require('../models/StockGroup');
const StockUnit = require('../models/StockUnit');

async function seedCompanyData(companyId) {
  const primaryGroups = [
    { name: 'Capital Account', nature: 'liabilities', isPrimary: true, sortOrder: 1 },
    { name: 'Loans (Liability)', nature: 'liabilities', isPrimary: true, sortOrder: 2 },
    { name: 'Current Liabilities', nature: 'liabilities', isPrimary: true, sortOrder: 3 },
    { name: 'Branch/Divisions', nature: 'liabilities', isPrimary: true, sortOrder: 4 },
    { name: 'Suspense A/c', nature: 'liabilities', isPrimary: true, sortOrder: 5 },
    { name: 'Fixed Assets', nature: 'assets', isPrimary: true, sortOrder: 6 },
    { name: 'Investments', nature: 'assets', isPrimary: true, sortOrder: 7 },
    { name: 'Loans & Advances (Asset)', nature: 'assets', isPrimary: true, sortOrder: 8 },
    { name: 'Current Assets', nature: 'assets', isPrimary: true, sortOrder: 9 },
    { name: 'Misc. Expenses (Asset)', nature: 'assets', isPrimary: true, sortOrder: 10 },
    { name: 'Sales Accounts', nature: 'income', isPrimary: true, affectsGrossProfit: true, sortOrder: 11 },
    { name: 'Direct Income', nature: 'income', isPrimary: true, affectsGrossProfit: true, sortOrder: 12 },
    { name: 'Indirect Income', nature: 'income', isPrimary: true, sortOrder: 13 },
    { name: 'Purchase Accounts', nature: 'expenses', isPrimary: true, affectsGrossProfit: true, sortOrder: 14 },
    { name: 'Direct Expenses', nature: 'expenses', isPrimary: true, affectsGrossProfit: true, sortOrder: 15 },
    { name: 'Indirect Expenses', nature: 'expenses', isPrimary: true, sortOrder: 16 },
  ];

  const createdPrimary = {};
  for (const g of primaryGroups) {
    const doc = await LedgerGroup.create({ company: companyId, ...g, isSystem: true });
    createdPrimary[g.name] = doc._id;
  }

  const subGroups = [
    { name: 'Duties & Taxes', nature: 'liabilities', parent: 'Current Liabilities', sortOrder: 1 },
    { name: 'Provisions', nature: 'liabilities', parent: 'Current Liabilities', sortOrder: 2 },
    { name: 'Sundry Creditors', nature: 'liabilities', parent: 'Current Liabilities', sortOrder: 3 },
    { name: 'Bank OD Accounts', nature: 'liabilities', parent: 'Loans (Liability)', sortOrder: 1 },
    { name: 'Secured Loans', nature: 'liabilities', parent: 'Loans (Liability)', sortOrder: 2 },
    { name: 'Unsecured Loans', nature: 'liabilities', parent: 'Loans (Liability)', sortOrder: 3 },
    { name: 'Cash-in-Hand', nature: 'assets', parent: 'Current Assets', sortOrder: 1 },
    { name: 'Bank Accounts', nature: 'assets', parent: 'Current Assets', sortOrder: 2 },
    { name: 'Sundry Debtors', nature: 'assets', parent: 'Current Assets', sortOrder: 3 },
    { name: 'Stock-in-Hand', nature: 'assets', parent: 'Current Assets', sortOrder: 4 },
    { name: 'Reserves & Surplus', nature: 'liabilities', parent: 'Capital Account', sortOrder: 1 },
  ];

  const createdSub = {};
  for (const g of subGroups) {
    const doc = await LedgerGroup.create({
      company: companyId,
      name: g.name,
      nature: g.nature,
      parent: createdPrimary[g.parent],
      affectsGrossProfit: false,
      isSystem: true,
      sortOrder: g.sortOrder,
    });
    createdSub[g.name] = doc._id;
  }

  const allGroups = { ...createdPrimary, ...createdSub };

  const defaultLedgers = [
    { name: 'Cash', group: 'Cash-in-Hand', openingBalanceType: 'Dr' },
    { name: 'Capital Account', group: 'Capital Account', openingBalanceType: 'Cr' },
    { name: 'Sales (Local-Taxable)', group: 'Sales Accounts', openingBalanceType: 'Cr', taxType: 'GST' },
    { name: 'Purchase (Local-Taxable)', group: 'Purchase Accounts', openingBalanceType: 'Dr', taxType: 'GST' },
    { name: 'CGST', group: 'Duties & Taxes', openingBalanceType: 'Cr', taxType: 'GST' },
    { name: 'SGST/UTGST', group: 'Duties & Taxes', openingBalanceType: 'Cr', taxType: 'GST' },
    { name: 'IGST', group: 'Duties & Taxes', openingBalanceType: 'Cr', taxType: 'GST' },
    { name: 'TDS Payable', group: 'Duties & Taxes', openingBalanceType: 'Cr' },
    { name: 'Salary', group: 'Indirect Expenses', openingBalanceType: 'Dr' },
    { name: 'Office Expenses', group: 'Indirect Expenses', openingBalanceType: 'Dr' },
    { name: 'Freight & Forwarding', group: 'Direct Expenses', openingBalanceType: 'Dr' },
    { name: 'Closing Stock', group: 'Stock-in-Hand', openingBalanceType: 'Dr' },
  ];

  for (const l of defaultLedgers) {
    await Ledger.create({
      company: companyId,
      group: allGroups[l.group],
      name: l.name,
      openingBalance: 0,
      openingBalanceType: l.openingBalanceType,
      taxType: l.taxType || '',
      isSystem: true,
    });
  }

  const units = [
    { name: 'Numbers', symbol: 'Nos' },
    { name: 'Kilograms', symbol: 'Kg' },
    { name: 'Litres', symbol: 'Ltr' },
    { name: 'Metres', symbol: 'Mtr' },
    { name: 'Box', symbol: 'Box' },
    { name: 'Pieces', symbol: 'Pcs' },
    { name: 'Set', symbol: 'Set' },
  ];
  for (const u of units) {
    await StockUnit.create({ company: companyId, ...u, isSystem: true });
  }

  await StockGroup.create({ company: companyId, name: 'Primary', isPrimary: true, isSystem: true });

  return { groups: allGroups };
}

module.exports = { seedCompanyData };
