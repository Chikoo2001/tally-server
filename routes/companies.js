const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/companyController');

router.use(protect);
router.get('/', c.getCompanies);
router.post('/', c.createCompany);
router.get('/:id/summary', c.getCompanySummary);
router.get('/:id', c.getCompany);
router.put('/:id', c.updateCompany);
router.delete('/:id', c.deleteCompany);

module.exports = router;
