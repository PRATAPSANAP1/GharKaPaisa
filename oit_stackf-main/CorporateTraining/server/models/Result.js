const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: [true, 'Test is required'],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'completed',
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedAnswer: {
          type: Number,
        },
        isCorrect: {
          type: Boolean,
        },
        timeTaken: {
          type: Number, // seconds
        },
      },
    ],
    totalMarks: {
      type: Number,
    },
    obtainedMarks: {
      type: Number,
    },
    percentage: {
      type: Number,
    },
    passed: {
      type: Boolean,
    },
    timeTaken: {
      type: Number, // total seconds
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ user: 1, test: 1 });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;

