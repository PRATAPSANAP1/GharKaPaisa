const express = require('express');
const router = express.Router();
const serviceCatalogCtrl = require('../controllers/service_catalog.controller');
const jwtAuth = require('../middleware/jwtAuth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Public routes (Admin can see all, Public sees active only)
router.get('/', serviceCatalogCtrl.listServices);
router.post('/:id/click', serviceCatalogCtrl.trackClick);

// Protected Admin routes
router.use(jwtAuth, roleCheck('SUPER_ADMIN', 'ADMIN'));
router.post('/', serviceCatalogCtrl.createService);
router.put('/:id', serviceCatalogCtrl.updateService);
router.delete('/:id', serviceCatalogCtrl.deleteService);

module.exports = router;
