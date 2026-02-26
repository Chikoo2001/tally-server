const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/stockController');

router.use(protect);

// Stock Groups
router.get('/groups', c.getStockGroups);
router.post('/groups', c.createStockGroup);
router.put('/groups/:id', c.updateStockGroup);
router.delete('/groups/:id', c.deleteStockGroup);

// Stock Units
router.get('/units', c.getStockUnits);
router.post('/units', c.createStockUnit);
router.put('/units/:id', c.updateStockUnit);
router.delete('/units/:id', c.deleteStockUnit);

// Stock Items
router.get('/items', c.getStockItems);
router.post('/items', c.createStockItem);
router.get('/items/:id/movement', c.getStockMovement);
router.get('/items/:id', c.getStockItem);
router.put('/items/:id', c.updateStockItem);
router.delete('/items/:id', c.deleteStockItem);

module.exports = router;
