const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/ledgerController');

router.use(protect);
router.get('/', c.getLedgers);
router.post('/', c.createLedger);
router.get('/:id/balance', c.getLedgerBalance);
router.get('/:id/statement', c.getLedgerStatement);
router.get('/:id', c.getLedger);
router.put('/:id', c.updateLedger);
router.delete('/:id', c.deleteLedger);

module.exports = router;
