const express = require('express');
const router = express.Router();
const productCtrl = require('./controller.js');
const subEntityCtrl = require('./sub-entity.controller.js');
const engagementCtrl = require('./engagement.controller.js');
const { authenticate, syncUser, authorize, optionalAuth } = require('../../middleware/authentication/auth.middleware.js');
const { commissionRules, validate, applicationSettingsRules } = require('../../middleware/validation/validation.middleware.js');

const linkCtrl = require('./link-management.controller.js');

// ═══════════════════════════════════════════════════════════════════
// Public Routes (no auth required)
// ═══════════════════════════════════════════════════════════════════
router.get('/categories', productCtrl.getProductsByCategory);
router.get('/banks', productCtrl.listBanks);
router.get('/cards', productCtrl.getCards);
router.get('/loans', productCtrl.getLoans);
router.get('/insurance', productCtrl.getInsurance);
router.post('/click', optionalAuth, linkCtrl.logClick);
router.get('/links', optionalAuth, linkCtrl.listProductLinks);
router.get('/link/:id', optionalAuth, linkCtrl.getProductLink);
router.get('/', optionalAuth, productCtrl.listProducts);
router.get('/:id/apply', optionalAuth, productCtrl.resolveApplication);

// Public sub-entity endpoints (read-only)
router.get('/:id/faqs', subEntityCtrl.getProductFaqs);
router.get('/:id/videos', subEntityCtrl.getProductVideos);
router.get('/:id/documents', subEntityCtrl.getProductDocuments);
router.get('/:id/offers', subEntityCtrl.getProductOffers);
router.get('/:id/ratings', subEntityCtrl.getProductRatings);

router.get('/:id', optionalAuth, productCtrl.getProduct);

// ═══════════════════════════════════════════════════════════════════
// Protected Routes (auth required)
// ═══════════════════════════════════════════════════════════════════
router.use(authenticate, syncUser);
const { upload } = require('../../services/aws/s3.service.js');

// ── Partner Engagement Endpoints ─────────────────────────────────
router.post('/bookmark', engagementCtrl.bookmarkProduct);
router.get('/bookmarks', engagementCtrl.getBookmarks);
router.get('/recent', engagementCtrl.getRecentlyViewed);
router.post('/compare', engagementCtrl.compareProducts);
router.post('/share', engagementCtrl.shareProduct);
router.post('/check-eligibility', engagementCtrl.checkEligibility);
router.get('/recommendations', engagementCtrl.getRecommendations);

// ── Partner Ratings ──────────────────────────────────────────────
router.post('/:id/ratings', subEntityCtrl.submitProductRating);

// ── Admin/Super Admin Product Management ─────────────────────────
router.get('/analytics/clicks', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.getClickAnalytics);
router.post('/create', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.createProduct);
router.get('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.getApplicationSettings);
router.put('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), applicationSettingsRules, validate, productCtrl.upsertApplicationSettings);
router.delete('/:id/application-settings', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.deleteApplicationSettings);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('image'), productCtrl.updateProduct);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), productCtrl.deleteProduct);
router.post('/commission', authorize('SUPER_ADMIN'), commissionRules, validate, productCtrl.setCommission);

// ── Admin Sub-Entity CRUD ────────────────────────────────────────
// FAQs
router.post('/:id/faqs', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.upsertProductFaq);
router.delete('/:id/faqs/:faqId', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.deleteProductFaq);

// Videos
router.post('/:id/videos', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.upsertProductVideo);
router.delete('/:id/videos/:videoId', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.deleteProductVideo);

// Documents
router.post('/:id/documents', authorize('ADMIN', 'SUPER_ADMIN'), upload.single('document'), subEntityCtrl.uploadProductDocument);
router.delete('/:id/documents/:docId', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.deleteProductDocument);

// Offers
router.post('/:id/offers', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.upsertProductOffer);
router.delete('/:id/offers/:offerId', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.deleteProductOffer);

// Analytics (Admin only)
router.get('/:id/analytics', authorize('ADMIN', 'SUPER_ADMIN'), subEntityCtrl.getProductAnalytics);

module.exports = router;
