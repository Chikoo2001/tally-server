const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/voucherController');

router.use(protect);
router.get('/next-number', c.getNextNumber);
router.get('/', c.getVouchers);
router.post('/', c.createVoucher);
router.get('/:id', c.getVoucher);
router.put('/:id', c.updateVoucher);
router.delete('/:id', c.deleteVoucher);

module.exports = router;
