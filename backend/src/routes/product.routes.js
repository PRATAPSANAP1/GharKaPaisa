const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/product.controller');
const { authenticate, syncUser, authorize } = require('../middleware/auth.middleware');
const { commissionRules, validate } = require('../middleware/validation.middleware');

// Public Routes for Homepage Lead Generation
router.get('/categories', productCtrl.getProductsByCategory);
router.get('/banks', productCtrl.listBanks);
router.get('/cards', productCtrl.getCards);
router.get('/loans', productCtrl.getLoans);
router.get('/insurance', productCtrl.getInsurance);
router.get('/', productCtrl.listProducts);
router.get('/:id', productCtrl.getProduct);

// Protected Routes
router.use(authenticate, syncUser);
router.post('/create', authorize('admin', 'super_admin'), productCtrl.createProduct);
router.post('/', authorize('admin', 'super_admin'), productCtrl.createProduct);
router.put('/:id', authorize('admin', 'super_admin'), productCtrl.updateProduct);
router.post('/commission', authorize('super_admin'), commissionRules, validate, productCtrl.setCommission);

module.exports = router;
