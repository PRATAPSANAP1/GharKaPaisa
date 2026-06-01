const Result = require('../models/Result');
const Test = require('../models/Test');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getMyResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const results = await Result.find({ user: req.user._id })
      .populate({
        path: 'test',
        select: 'name totalQuestions totalTime category subcategory',
        populate: [
          { path: 'category', select: 'name type' },
          { path: 'subcategory', select: 'name' }
        ]
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Result.countDocuments({ user: req.user._id });

    return successResponse(res, 200, 'My results retrieved successfully', {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my results error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving results');
  }
};

const getResultDetail = async (req, res) => {
  try {
    const resultId = req.params.id;

    const result = await Result.findById(resultId)
      .populate({
        path: 'test',
        select: 'name totalQuestions totalTime passingMarks negativeMarking negativeMarkValue category',
        populate: { path: 'category', select: 'name type' }
      })
      .populate({
        path: 'answers.question',
        select: 'question options correctAnswer explanation marks difficulty type'
      });

    if (!result) {
      return errorResponse(res, 404, 'Result not found');
    }

    if (result.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Unauthorized access to this result');
    }

    return successResponse(res, 200, 'Result details retrieved successfully', result);
  } catch (error) {
    console.error('Get result detail error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving result details');
  }
};

const getAllResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { studentId, testId, passed } = req.query;
    const filter = {};

    if (studentId) filter.user = studentId;
    if (testId) filter.test = testId;
    if (passed !== undefined) filter.passed = passed === 'true';

    const results = await Result.find(filter)
      .populate('user', 'name email college branch year')
      .populate({
        path: 'test',
        select: 'name totalQuestions category',
        populate: { path: 'category', select: 'name type' }
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Result.countDocuments(filter);

    return successResponse(res, 200, 'All results retrieved successfully', {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all results error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving all results');
  }
};

const getResultStats = async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId);
    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    const results = await Result.find({ test: testId });
    const totalSubmissions = results.length;

    if (totalSubmissions === 0) {
      return successResponse(res, 200, 'No submissions found for this test', {
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0,
        distribution: { pass: 0, fail: 0 }
      });
    }

    let totalMarksObtained = 0;
    let passCount = 0;
    let highestScore = 0;
    let lowestScore = results[0].obtainedMarks || 0;

    results.forEach(r => {
      const marks = r.obtainedMarks || 0;
      totalMarksObtained += marks;
      if (r.passed) passCount++;
      if (marks > highestScore) highestScore = marks;
      if (marks < lowestScore) lowestScore = marks;
    });

    const averageScore = totalMarksObtained / totalSubmissions;
    const passRate = (passCount / totalSubmissions) * 100;

    return successResponse(res, 200, 'Test stats retrieved successfully', {
      totalSubmissions,
      averageScore: parseFloat(averageScore.toFixed(2)),
      passRate: parseFloat(passRate.toFixed(2)),
      highestScore,
      lowestScore,
      distribution: {
        pass: passCount,
        fail: totalSubmissions - passCount
      }
    });
  } catch (error) {
    console.error('Get test stats error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving test statistics');
  }
};

module.exports = {
  getMyResults,
  getResultDetail,
  getAllResults,
  getResultStats
};

