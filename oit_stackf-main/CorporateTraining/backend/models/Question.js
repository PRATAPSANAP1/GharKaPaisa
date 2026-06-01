const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (v) {
          return v.length >= 2 && v.length <= 6;
        },
        message: 'Options must have between 2 and 6 choices',
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
    },
    explanation: {
      type: String,
    },
    marks: {
      type: Number,
      default: 1,
    },
    negativeMark: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: 'medium',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
    timeLimit: {
      type: Number,
      default: 60, // seconds
    },
    type: {
      type: String,
      enum: {
        values: ['mcq', 'true-false'],
        message: 'Type must be mcq or true-false',
      },
      default: 'mcq',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ category: 1, difficulty: 1, isActive: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;

