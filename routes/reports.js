const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/reportController');

router.use(protect);
router.get('/trial-balance', c.getTrialBalance);
router.get('/balance-sheet', c.getBalanceSheet);
router.get('/profit-loss', c.getProfitLoss);
router.get('/day-book', c.getDayBook);
router.get('/cash-book', c.getCashBook);
router.get('/bank-book', c.getBankBook);
router.get('/ledger', c.getLedgerReport);

module.exports = router;
