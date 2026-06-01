const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    isDynamic: {
      type: Boolean,
      default: false,
    },
    dynamicConfig: [
      {
        category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
        count: { type: Number, required: true },
      }
    ],
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions count is required'],
    },
    totalTime: {
      type: Number,
      required: [true, 'Total time (in minutes) is required'],
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    negativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkValue: {
      type: Number,
      default: 0,
    },
    randomizeQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard', 'mixed'],
        message: 'Difficulty must be easy, medium, hard, or mixed',
      },
      default: 'mixed',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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

const Test = mongoose.model('Test', testSchema);

module.exports = Test;

