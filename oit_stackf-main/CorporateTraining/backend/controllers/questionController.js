const Question = require('../models/Question');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { category, subcategory, difficulty, type, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    if (search) {
      filter.question = { $regex: search, $options: 'i' };
    }

    if (req.query.includeInactive === 'true') {
      delete filter.isActive;
    }

    const questions = await Question.find(filter)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(filter);

    return successResponse(res, 200, 'Questions retrieved successfully', {
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get questions error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving questions');
  }
};

const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name');

    if (!question) {
      return errorResponse(res, 404, 'Question not found');
    }

    return successResponse(res, 200, 'Question retrieved successfully', question);
  } catch (error) {
    console.error('Get question error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving question');
  }
};

const createQuestion = async (req, res) => {
  try {
    const {
      question,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMark,
      difficulty,
      category,
      subcategory,
      timeLimit,
      type,
    } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return errorResponse(res, 400, 'Invalid category ID');
    }

    if (subcategory) {
      const subcategoryExists = await Subcategory.findOne({ _id: subcategory, category });
      if (!subcategoryExists) {
        return errorResponse(res, 400, 'Invalid subcategory ID for the selected category');
      }
    }

    const newQuestion = await Question.create({
      question,
      options,
      correctAnswer,
      explanation,
      marks: marks || 1,
      negativeMark: negativeMark || 0,
      difficulty: difficulty || 'medium',
      category,
      subcategory,
      timeLimit: timeLimit || 60,
      type: type || 'mcq',
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Question created successfully', newQuestion);
  } catch (error) {
    console.error('Create question error:', error.message);
    return errorResponse(res, 500, 'Server error creating question');
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { category, subcategory } = req.body;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return errorResponse(res, 400, 'Invalid category ID');
      }
    }

    if (subcategory) {
      const targetCategory = category || (await Question.findById(req.params.id)).category;
      const subcategoryExists = await Subcategory.findOne({ _id: subcategory, category: targetCategory });
      if (!subcategoryExists) {
        return errorResponse(res, 400, 'Invalid subcategory ID for the selected category');
      }
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!question) {
      return errorResponse(res, 404, 'Question not found');
    }

    return successResponse(res, 200, 'Question updated successfully', question);
  } catch (error) {
    console.error('Update question error:', error.message);
    return errorResponse(res, 500, 'Server error updating question');
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!question) {
      return errorResponse(res, 404, 'Question not found');
    }

    return successResponse(res, 200, 'Question soft-deleted successfully');
  } catch (error) {
    console.error('Delete question error:', error.message);
    return errorResponse(res, 500, 'Server error deleting question');
  }
};

const bulkImportQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return errorResponse(res, 400, 'Please provide an array of questions to import');
    }

    const errors = [];
    const validQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const index = i + 1;

      if (!q.question) {
        errors.push(`Row ${index}: Question text is required`);
        continue;
      }
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) {
        errors.push(`Row ${index}: Options must have between 2 and 6 choices`);
        continue;
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        errors.push(`Row ${index}: Correct answer index must be a valid option index (0 to options.length - 1)`);
        continue;
      }
      if (!q.category) {
        errors.push(`Row ${index}: Category ID is required`);
        continue;
      }

      if (!mongoose.Types.ObjectId.isValid(q.category)) {
        errors.push(`Row ${index}: Category ID "${q.category}" must be a valid 24-character hex ObjectId string`);
        continue;
      }

      const categoryExists = await Category.findById(q.category);
      if (!categoryExists) {
        errors.push(`Row ${index}: Category ID "${q.category}" does not exist`);
        continue;
      }

      if (q.subcategory) {
        if (!mongoose.Types.ObjectId.isValid(q.subcategory)) {
          errors.push(`Row ${index}: Subcategory ID "${q.subcategory}" must be a valid 24-character hex ObjectId string`);
          continue;
        }

        const subcategoryExists = await Subcategory.findOne({ _id: q.subcategory, category: q.category });
        if (!subcategoryExists) {
          errors.push(`Row ${index}: Subcategory ID "${q.subcategory}" does not exist or does not belong to the selected category`);
          continue;
        }
      }

      validQuestions.push({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        marks: q.marks || 1,
        negativeMark: q.negativeMark || 0,
        difficulty: q.difficulty || 'medium',
        category: q.category,
        subcategory: q.subcategory || null,
        timeLimit: q.timeLimit || 60,
        type: q.type || 'mcq',
        createdBy: req.user._id,
      });
    }

    if (errors.length > 0) {
      return errorResponse(res, 400, 'Validation failed for some questions', errors);
    }

    const inserted = await Question.insertMany(validQuestions);

    return successResponse(res, 201, `Successfully imported ${inserted.length} questions`, {
      importedCount: inserted.length,
    });
  } catch (error) {
    console.error('Bulk import error:', error.message);
    return errorResponse(res, 500, 'Server error during bulk import');
  }
};

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
};

