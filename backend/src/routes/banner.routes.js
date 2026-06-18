const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/banner.controller');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { upload } = require('../services/s3.service');

// Public route to view active banners on Homepage
router.get('/', ctrl.listBanners);

// Protected routes (require auth)
router.use(jwtAuth);

// Get all banners (Admin / SuperAdmin)
router.get('/all', roleCheck('admin', 'super_admin'), ctrl.listAllBanners);

// CRUD operations (Admin / SuperAdmin)
router.post('/', roleCheck('admin', 'super_admin'), upload.single('image'), ctrl.createBanner);
router.put('/:id', roleCheck('admin', 'super_admin'), upload.single('image'), ctrl.updateBanner);
router.delete('/:id', roleCheck('admin', 'super_admin'), ctrl.deleteBanner);

module.exports = router;
