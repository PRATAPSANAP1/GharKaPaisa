const express = require('express');
const router = express.Router();
const productCtrl = require('./controller.js');
const { authenticate, syncUser, authorize, optionalAuth } = require('../../middleware/authentication/auth.middleware.js');
const { commissionRules, validate, applicationSettingsRules } = require('../../middleware/validation/validation.middleware.js');

const linkCtrl = require('./link-management.controller.js');

// Public Routes for Homepage Lead Generation
router.get('/categories', productCtrl.getProductsByCategory);
router.get('/banks', productCtrl.listBanks);
router.get('/cards', productCtrl.getCards);
router.get('/loans', productCtrl.getLoans);
router.get('/insurance', productCtrl.getInsurance);
router.post('/click', optionalAuth, linkCtrl.logClick);
router.get('/links', optionalAuth, linkCtrl.listProductLinks);
router.get('/link/:id', optionalAuth, linkCtrl.getProductLink);
router.get('/', productCtrl.listProducts);
router.get('/:id/apply', optionalAuth, productCtrl.resolveApplication);
router.get('/:id', productCtrl.getProduct);

// Protected Routes
router.use(authenticate, syncUser);
const { upload } = require('../../services/aws/s3.service.js');
router.get('/analytics/clicks', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.getClickAnalytics);
router.post('/create', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.get('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.getApplicationSettings);
router.put('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), applicationSettingsRules, validate, productCtrl.upsertApplicationSettings);
router.delete('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.deleteApplicationSettings);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.updateProduct);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.deleteProduct);
router.post('/commission', authorize('SUPER_ADMIN'), commissionRules, validate, productCtrl.setCommission);

module.exports = router;
