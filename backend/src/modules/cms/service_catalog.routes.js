const express = require('express');
const router = express.Router();
const serviceCatalogCtrl = require('./service_catalog.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Public routes (Admin can see all, Public sees active only)
router.get('/', serviceCatalogCtrl.listServices);
router.post('/:id/click', serviceCatalogCtrl.trackClick);

// Protected Admin routes (require auth + role)
const adminAuth = [jwtAuth, roleCheck('SUPER_ADMIN', 'ADMIN')];

router.post('/', adminAuth, serviceCatalogCtrl.createService);
router.put('/:id', adminAuth, serviceCatalogCtrl.updateService);
router.delete('/:id', adminAuth, serviceCatalogCtrl.deleteService);

module.exports = router;
