const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

const router = express.Router();

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('type').isIn(['aptitude', 'technical', 'coding']).withMessage('Type must be aptitude, technical, or coding'),
];

const subcategoryValidation = [
  body('name').trim().notEmpty().withMessage('Subcategory name is required'),
];

router.get('/', auth, getCategories);
router.get('/:id', auth, getCategory);
router.get('/:categoryId/subcategories', auth, getSubcategories);

router.post('/', auth, admin, validate(categoryValidation), createCategory);
router.put('/:id', auth, admin, updateCategory);
router.delete('/:id', auth, admin, deleteCategory);

router.post('/:categoryId/subcategories', auth, admin, validate(subcategoryValidation), createSubcategory);
router.put('/subcategories/:id', auth, admin, updateSubcategory);
router.delete('/subcategories/:id', auth, admin, deleteSubcategory);

module.exports = router;

