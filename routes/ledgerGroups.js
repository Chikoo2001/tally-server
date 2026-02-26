const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/ledgerGroupController');

router.use(protect);
router.get('/tree', c.getGroupTree);
router.get('/', c.getGroups);
router.post('/', c.createGroup);
router.put('/:id', c.updateGroup);
router.delete('/:id', c.deleteGroup);

module.exports = router;
