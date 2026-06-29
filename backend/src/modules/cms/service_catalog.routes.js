const express = require('express');
const router = express.Router();
const serviceCatalogCtrl = require('./service_catalog.controller.js');
const jwtAuth = require('../../middleware/authentication/jwtAuth.middleware.js');
const roleCheck = require('../../middleware/authorization/role.middleware.js');

// Public routes (Admin can see all, Public sees active only)
router.get('/', serviceCatalogCtrl.listServices);
router.post('/:id/click', serviceCatalogCtrl.trackClick);

// Protected Admin routes
router.use(jwtAuth, roleCheck('SUPER_ADMIN', 'ADMIN'));
router.post('/', serviceCatalogCtrl.createService);
router.put('/:id', serviceCatalogCtrl.updateService);
router.delete('/:id', serviceCatalogCtrl.deleteService);

module.exports = router;
