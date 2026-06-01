const mongoose = require('mongoose');

const codingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      required: [true, 'Difficulty is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    constraints: {
      type: String,
    },
    inputFormat: {
      type: String,
    },
    outputFormat: {
      type: String,
    },
    examples: [
      {
        input: {
          type: String,
        },
        output: {
          type: String,
        },
        explanation: {
          type: String,
        },
      },
    ],
    testCases: [
      {
        input: {
          type: String,
        },
        expectedOutput: {
          type: String,
        },
        isHidden: {
          type: Boolean,
          default: false,
        },
      },
    ],
    starterCode: {
      c: {
        type: String,
      },
      cpp: {
        type: String,
      },
      java: {
        type: String,
      },
      python: {
        type: String,
      },
      javascript: {
        type: String,
      },
    },
    timeLimit: {
      type: Number,
      default: 2, // seconds
    },
    memoryLimit: {
      type: Number,
      default: 256, // MB
    },
    points: {
      type: Number,
      default: 100,
    },
    tags: {
      type: [String],
    },
    companies: {
      type: [String],
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

const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);

module.exports = CodingProblem;

