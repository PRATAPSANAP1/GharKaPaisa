const express = require('express');
const router = express.Router();
const productCtrl = require('../../controllers/product/product.controller.js');
const { authenticate, syncUser, authorize } = require('../../middleware/auth.middleware.js');
const { commissionRules, validate } = require('../../middleware/validation.middleware.js');

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
const { upload } = require('../../services/partner/s3.service.js');
router.post('/create', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.updateProduct);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.deleteProduct);
router.post('/commission', authorize('SUPER_ADMIN'), commissionRules, validate, productCtrl.setCommission);

module.exports = router;
