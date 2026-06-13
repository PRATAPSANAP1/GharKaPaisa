// ── application.routes.js ─────────────────────────────────────────────────────
const express = require('express');
const appRouter = express.Router();
const appCtrl = require('../controllers/application.controller');
const { authenticate, authorize, requireApprovedPartner } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');
const { applicationRules, validate } = require('../middleware/validation.middleware');

appRouter.use(authenticate);

appRouter.get('/', appCtrl.listApplications);
appRouter.get('/:id', appCtrl.getApplication);
appRouter.post('/', authorize('Partner'), requireApprovedPartner, applicationRules, validate, appCtrl.submitApplication);
appRouter.patch('/:id/status', authorize('admin', 'super_admin', 'employee'), appCtrl.updateStatus);
appRouter.post('/:id/documents', authorize('Partner', 'admin', 'super_admin'), upload.single('document'), appCtrl.uploadApplicationDoc);


// ── wallet.routes.js ──────────────────────────────────────────────────────────
const walletRouter = express.Router();
const walletCtrl = require('../controllers/wallet.controller');
const { selfOrAdmin } = require('../middleware/auth.middleware');
const { withdrawalRules } = require('../middleware/validation.middleware');

walletRouter.use(authenticate);

// Admin: list/process withdrawals
walletRouter.get('/withdrawals', authorize('super_admin', 'admin'), walletCtrl.listWithdrawals);
walletRouter.patch('/withdrawals/:id/process', authorize('super_admin'), walletCtrl.processWithdrawalRequest);

// Partner self or admin
walletRouter.get('/:PartnerId', selfOrAdmin('PartnerId'), walletCtrl.getWallet);
walletRouter.get('/:PartnerId/transactions', selfOrAdmin('PartnerId'), walletCtrl.getTransactions);
walletRouter.get('/:PartnerId/case-summary', selfOrAdmin('PartnerId'), walletCtrl.getCaseSummary);
walletRouter.post('/:PartnerId/withdraw', selfOrAdmin('PartnerId'), requireApprovedPartner, withdrawalRules, validate, walletCtrl.requestWithdrawal);


// ── product.routes.js ─────────────────────────────────────────────────────────
const productRouter = express.Router();
const productCtrl = require('../controllers/product.controller');
const { commissionRules } = require('../middleware/validation.middleware');

productRouter.use(authenticate);

productRouter.get('/categories', productCtrl.getProductsByCategory);
productRouter.get('/banks', productCtrl.listBanks);
productRouter.get('/', productCtrl.listProducts);
productRouter.get('/:id', productCtrl.getProduct);
productRouter.post('/', authorize('admin', 'super_admin'), productCtrl.createProduct);
productRouter.put('/:id', authorize('admin', 'super_admin'), productCtrl.updateProduct);
productRouter.post('/commission', authorize('super_admin'), commissionRules, validate, productCtrl.setCommission);


// ── notification.routes.js ────────────────────────────────────────────────────
const notifRouter = express.Router();
const notifCtrl = require('../controllers/notification.controller');

notifRouter.use(authenticate);
notifRouter.get('/', notifCtrl.getNotifications);
notifRouter.patch('/read-all', notifCtrl.markAllRead);
notifRouter.patch('/:id/read', notifCtrl.markRead);


// ── report.routes.js ──────────────────────────────────────────────────────────
const reportRouter = express.Router();
const reportCtrl = require('../controllers/report.controller');

reportRouter.use(authenticate);
reportRouter.use(authorize('admin', 'super_admin'));

reportRouter.get('/overview', reportCtrl.getOverview);
reportRouter.get('/applications-by-product', reportCtrl.applicationsByProduct);
reportRouter.get('/top-Partners', reportCtrl.topPartners);
reportRouter.get('/monthly-trend', reportCtrl.monthlyTrend);

module.exports = {
  appRouter,
  walletRouter,
  productRouter,
  notifRouter,
  reportRouter
};
