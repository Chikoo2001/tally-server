const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/gstController');

router.use(protect);
router.get('/gstr1', c.getGSTR1);
router.get('/gstr3b', c.getGSTR3B);
router.get('/hsn-summary', c.getHSNSummary);

module.exports = router;
