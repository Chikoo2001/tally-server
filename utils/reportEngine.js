const Ledger = require('../models/Ledger');
const LedgerGroup = require('../models/LedgerGroup');
const Voucher = require('../models/Voucher');
const mongoose = require('mongoose');

async function getTrialBalance(companyId, asOfDate) {
  const endDate = new Date(asOfDate);
  endDate.setHours(23, 59, 59, 999);

  const ledgers = await Ledger.find({ company: companyId, isActive: true })
    .populate('group')
    .lean();

  const aggResult = await Voucher.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(companyId),
        date: { $lte: endDate },
        isDeleted: false,
      },
    },
    { $unwind: '$entries' },
    {
      $group: {
        _id: { ledger: '$entries.ledger', type: '$entries.type' },
        total: { $sum: '$entries.amount' },
      },
    },
  ]);

  const movementMap = {};
  for (const row of aggResult) {
    const lid = row._id.ledger.toString();
    if (!movementMap[lid]) movementMap[lid] = { Dr: 0, Cr: 0 };
    movementMap[lid][row._id.type] = row.total;
  }

  const result = [];
  let totalDr = 0;
  let totalCr = 0;

  for (const ledger of ledgers) {
    const lid = ledger._id.toString();
    const txn = movementMap[lid] || { Dr: 0, Cr: 0 };

    const obDr = ledger.openingBalanceType === 'Dr' ? ledger.openingBalance : 0;
    const obCr = ledger.openingBalanceType === 'Cr' ? ledger.openingBalance : 0;

    const closingDr = obDr + txn.Dr;
    const closingCr = obCr + txn.Cr;
    const net = closingDr - closingCr;

    let closingBalance = Math.abs(net);
    let closingType = net >= 0 ? 'Dr' : 'Cr';
    if (closingBalance === 0) closingType = 'Dr';

    if (closingType === 'Dr') totalDr += closingBalance;
    else totalCr += closingBalance;

    result.push({
      ledger: { _id: ledger._id, name: ledger.name, group: ledger.group },
      openingBalance: ledger.openingBalance,
      openingBalanceType: ledger.openingBalanceType,
      debitTotal: txn.Dr,
      creditTotal: txn.Cr,
      closingBalance,
      closingType,
    });
  }

  return { entries: result, totalDr, totalCr, balanced: Math.abs(totalDr - totalCr) < 0.01 };
}

async function buildGroupTree(companyId, ledgerBalances) {
  const groups = await LedgerGroup.find({ company: companyId }).lean();
  const groupLedgerMap = {};
  for (const entry of ledgerBalances) {
    const gid = entry.ledger.group ? entry.ledger.group._id.toString() : null;
    if (!gid) continue;
    if (!groupLedgerMap[gid]) groupLedgerMap[gid] = [];
    groupLedgerMap[gid].push(entry);
  }

  const groupMap = {};
  for (const g of groups) {
    groupMap[g._id.toString()] = { ...g, children: [], ledgers: [], balance: 0 };
  }

  for (const [gid, entries] of Object.entries(groupLedgerMap)) {
    if (groupMap[gid]) {
      groupMap[gid].ledgers = entries;
      let bal = 0;
      for (const e of entries) {
        bal += e.closingType === 'Dr' ? e.closingBalance : -e.closingBalance;
      }
      groupMap[gid].balance = bal;
    }
  }

  const roots = [];
  for (const g of Object.values(groupMap)) {
    if (g.parent) {
      const pid = g.parent.toString();
      if (groupMap[pid]) groupMap[pid].children.push(g);
    } else {
      roots.push(g);
    }
  }

  function rollUp(node) {
    for (const child of node.children) {
      rollUp(child);
      node.balance += child.balance;
    }
  }
  for (const root of roots) rollUp(root);

  return { roots, groupMap };
}

async function getProfitAndLoss(companyId, fromDate, toDate) {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const ledgers = await Ledger.find({ company: companyId, isActive: true })
    .populate({ path: 'group', populate: { path: 'parent' } })
    .lean();

  const aggResult = await Voucher.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(companyId),
        date: { $gte: from, $lte: to },
        isDeleted: false,
      },
    },
    { $unwind: '$entries' },
    {
      $group: {
        _id: { ledger: '$entries.ledger', type: '$entries.type' },
        total: { $sum: '$entries.amount' },
      },
    },
  ]);

  const movementMap = {};
  for (const row of aggResult) {
    const lid = row._id.ledger.toString();
    if (!movementMap[lid]) movementMap[lid] = { Dr: 0, Cr: 0 };
    movementMap[lid][row._id.type] = row.total;
  }

  const tradingIncome = [];
  const otherIncome = [];
  const tradingExpenses = [];
  const otherExpenses = [];

  for (const ledger of ledgers) {
    if (!ledger.group) continue;
    const nature = ledger.group.nature;
    if (nature !== 'income' && nature !== 'expenses') continue;

    const lid = ledger._id.toString();
    const txn = movementMap[lid] || { Dr: 0, Cr: 0 };
    const affectsGP = ledger.group.affectsGrossProfit;

    if (nature === 'income') {
      const amount = txn.Cr - txn.Dr;
      (affectsGP ? tradingIncome : otherIncome).push({ name: ledger.name, amount });
    } else {
      const amount = txn.Dr - txn.Cr;
      (affectsGP ? tradingExpenses : otherExpenses).push({ name: ledger.name, amount });
    }
  }

  const grossIncome = tradingIncome.reduce((s, i) => s + i.amount, 0);
  const grossExpense = tradingExpenses.reduce((s, i) => s + i.amount, 0);
  const grossProfit = grossIncome - grossExpense;
  const totalOtherIncome = otherIncome.reduce((s, i) => s + i.amount, 0);
  const totalOtherExpense = otherExpenses.reduce((s, i) => s + i.amount, 0);
  const netProfit = grossProfit + totalOtherIncome - totalOtherExpense;

  return { tradingIncome, tradingExpenses, grossProfit, otherIncome, otherExpenses, netProfit };
}

async function getBalanceSheet(companyId, asOfDate) {
  const tb = await getTrialBalance(companyId, asOfDate);

  const date = new Date(asOfDate);
  const fyYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const fyStart = new Date(fyYear, 3, 1);
  const pl = await getProfitAndLoss(companyId, fyStart, asOfDate);

  const { roots } = await buildGroupTree(companyId, tb.entries);

  const assets = roots.filter(r => r.nature === 'assets');
  const liabilities = roots.filter(r => r.nature === 'liabilities');

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

  return { assets, liabilities, totalAssets, totalLiabilities, netProfit: pl.netProfit };
}

async function getDayBook(companyId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return Voucher.find({
    company: companyId,
    date: { $gte: start, $lte: end },
    isDeleted: false,
  })
    .populate('entries.ledger', 'name')
    .populate('partyLedger', 'name')
    .sort({ voucherType: 1, serialNumber: 1 })
    .lean();
}

async function getCashBankBook(companyId, ledgerId, fromDate, toDate) {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const obDate = new Date(fromDate);
  obDate.setDate(obDate.getDate() - 1);
  const tb = await getTrialBalance(companyId, obDate);
  const obEntry = tb.entries.find(e => e.ledger._id.toString() === ledgerId.toString());
  let openingBalance = obEntry
    ? obEntry.closingType === 'Dr' ? obEntry.closingBalance : -obEntry.closingBalance
    : 0;

  const vouchers = await Voucher.find({
    company: companyId,
    date: { $gte: from, $lte: to },
    isDeleted: false,
    'entries.ledger': ledgerId,
  })
    .populate('entries.ledger', 'name')
    .sort({ date: 1, serialNumber: 1 })
    .lean();

  let runningBalance = openingBalance;
  const transactions = [];

  for (const v of vouchers) {
    for (const entry of v.entries) {
      if (entry.ledger._id.toString() === ledgerId.toString()) {
        const amount = entry.type === 'Dr' ? entry.amount : -entry.amount;
        runningBalance += amount;
        transactions.push({
          date: v.date,
          voucherNumber: v.voucherNumber,
          voucherType: v.voucherType,
          narration: v.narration,
          debit: entry.type === 'Dr' ? entry.amount : 0,
          credit: entry.type === 'Cr' ? entry.amount : 0,
          balance: runningBalance,
        });
      }
    }
  }

  return { openingBalance, transactions, closingBalance: runningBalance };
}

async function getLedgerStatement(companyId, ledgerId, fromDate, toDate) {
  return getCashBankBook(companyId, ledgerId, fromDate, toDate);
}

module.exports = {
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getDayBook,
  getCashBankBook,
  getLedgerStatement,
  buildGroupTree,
};
