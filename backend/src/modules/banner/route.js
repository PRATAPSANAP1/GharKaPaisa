const express = require('express');
const router = express.Router();
const ctrl = require('./controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');
const { upload } = require('../../services/aws/s3.service.js');

// Public route to view active banners on Homepage
router.get('/', ctrl.listBanners);

// Protected routes (require auth)
router.use(jwtAuth);

// Get all banners (Admin / SuperAdmin)
router.get('/all', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.listAllBanners);

// CRUD operations (Admin / SuperAdmin)
router.post('/', roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('image'), ctrl.createBanner);
router.put('/:id', roleCheck('ADMIN', 'SUPER_ADMIN'), upload.single('image'), ctrl.updateBanner);
router.delete('/:id', roleCheck('ADMIN', 'SUPER_ADMIN'), ctrl.deleteBanner);

module.exports = router;
