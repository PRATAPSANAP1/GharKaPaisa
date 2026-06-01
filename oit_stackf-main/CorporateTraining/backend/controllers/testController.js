const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const { updateLeaderboard } = require('./leaderboardController');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getTests = async (req, res) => {
  try {
    const { category, subcategory, difficulty } = req.query;
    const filter = { isActive: true };

    if (req.user && req.user.role === 'admin') {
      delete filter.isActive;
    }

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (difficulty) filter.difficulty = difficulty;

    const tests = await Test.find(filter)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Tests retrieved successfully', tests);
  } catch (error) {
    console.error('Get tests error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving tests');
  }
};

const getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name');

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    if (req.user.role !== 'admin') {
      const studentTestView = test.toObject();
      delete studentTestView.questions; // Strip questions to prevent inspecting answers
      return successResponse(res, 200, 'Test details retrieved successfully', studentTestView);
    }

    const adminTest = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate('questions');

    return successResponse(res, 200, 'Test details retrieved successfully', adminTest);
  } catch (error) {
    console.error('Get test error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving test');
  }
};

const createTest = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      questions,
      totalQuestions,
      totalTime,
      passingMarks,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions,
      shuffleOptions,
      difficulty,
      isActive,
      startDate,
      endDate,
    } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return errorResponse(res, 400, 'A test must have at least one question');
    }

    const test = await Test.create({
      name,
      description,
      category,
      subcategory,
      questions,
      totalQuestions: totalQuestions || questions.length,
      totalTime,
      passingMarks: passingMarks || 0,
      negativeMarking: negativeMarking || false,
      negativeMarkValue: negativeMarkValue || 0,
      randomizeQuestions: randomizeQuestions !== undefined ? randomizeQuestions : true,
      shuffleOptions: shuffleOptions || false,
      difficulty: difficulty || 'mixed',
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Test created successfully', test);
  } catch (error) {
    console.error('Create test error:', error.message);
    return errorResponse(res, 500, 'Server error creating test');
  }
};

const updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    return successResponse(res, 200, 'Test updated successfully', test);
  } catch (error) {
    console.error('Update test error:', error.message);
    return errorResponse(res, 500, 'Server error updating test');
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    return successResponse(res, 200, 'Test deleted successfully');
  } catch (error) {
    console.error('Delete test error:', error.message);
    return errorResponse(res, 500, 'Server error deleting test');
  }
};

const startTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('category', 'name type')
      .populate('subcategory', 'name')
      .populate({
        path: 'questions',
        select: '-correctAnswer -explanation', // Exclude answers and explanations
      });

    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    if (!test.isActive) {
      return errorResponse(res, 403, 'This test is currently inactive');
    }

    const now = new Date();
    if (test.startDate && now < new Date(test.startDate)) {
      return errorResponse(res, 400, `This test has not started yet. It opens on ${new Date(test.startDate).toLocaleString()}`);
    }
    if (test.endDate && now > new Date(test.endDate)) {
      return errorResponse(res, 400, `This test has ended on ${new Date(test.endDate).toLocaleString()}`);
    }

    let testQuestions = [];

    if (test.isDynamic && test.dynamicConfig && test.dynamicConfig.length > 0) {
      // Dynamic Test: Fetch questions according to rules
      for (const config of test.dynamicConfig) {
        const query = { isActive: true };
        if (config.category) query.category = config.category;
        if (config.subcategory) query.subcategory = config.subcategory;
        if (config.difficulty && config.difficulty !== 'mixed') query.difficulty = config.difficulty;

        // Fetch matching questions
        const matchingQuestions = await Question.find(query).select('-correctAnswer -explanation');
        
        // Randomly sample 'count' questions
        const shuffled = matchingQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, config.count);
        testQuestions = testQuestions.concat(selected);
      }
    } else {
      // Static Test: Use pre-defined questions
      testQuestions = [...test.questions];
    }

    if (test.randomizeQuestions) {
      for (let i = testQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [testQuestions[i], testQuestions[j]] = [testQuestions[j], testQuestions[i]];
      }
    }

    const testData = test.toObject();
    testData.questions = testQuestions;

    // Check if there is already an in_progress session
    let result = await Result.findOne({ user: req.user._id, test: test._id, status: 'in_progress' });
    
    if (!result) {
      // Create a draft Result session for this attempt
      result = await Result.create({
        user: req.user._id,
        test: test._id,
        status: 'in_progress',
        answers: [],
      });
    }

    return successResponse(res, 200, 'Test started successfully', {
      test: testData,
      resultId: result._id,
      existingAnswers: result.answers || []
    });
  } catch (error) {
    console.error('Start test error:', error.message);
    return errorResponse(res, 500, 'Server error starting test');
  }
};

const saveAnswer = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { questionId, selectedAnswer, timeTaken } = req.body;

    const result = await Result.findOne({ _id: resultId, user: req.user._id, status: 'in_progress' });
    if (!result) {
      return errorResponse(res, 404, 'Active test session not found');
    }

    // Find if answer already exists
    const existingIndex = result.answers.findIndex(ans => ans.question.toString() === questionId);
    
    if (existingIndex > -1) {
      result.answers[existingIndex].selectedAnswer = selectedAnswer;
      result.answers[existingIndex].timeTaken = (result.answers[existingIndex].timeTaken || 0) + (timeTaken || 0);
    } else {
      result.answers.push({
        question: questionId,
        selectedAnswer,
        timeTaken: timeTaken || 0,
      });
    }

    await result.save();
    return successResponse(res, 200, 'Answer saved successfully');
  } catch (error) {
    console.error('Save answer error:', error.message);
    return errorResponse(res, 500, 'Server error saving answer');
  }
};

const submitTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const { resultId, answers, timeTaken, autoSubmitted } = req.body; // answers: [{ question: id, selectedAnswer: index, timeTaken: seconds }]

    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return errorResponse(res, 404, 'Test not found');
    }

    let obtainedMarks = 0;
    let totalMarks = 0;
    const processedAnswers = [];

    const answerMap = {};
    if (answers && Array.isArray(answers)) {
      answers.forEach(ans => {
        answerMap[ans.question] = ans;
      });
    }

    test.questions.forEach(question => {
      totalMarks += question.marks;

      const userAnswer = answerMap[question._id.toString()];
      let selectedAnswer = null;
      let isCorrect = false;
      let qTimeTaken = 0;

      if (userAnswer) {
        selectedAnswer = userAnswer.selectedAnswer;
        qTimeTaken = userAnswer.timeTaken || 0;

        if (selectedAnswer !== null && selectedAnswer !== undefined) {
          if (selectedAnswer === question.correctAnswer) {
            isCorrect = true;
            obtainedMarks += question.marks;
          } else {
            if (test.negativeMarking) {
              const penalty = test.negativeMarkValue || question.negativeMark || 0;
              obtainedMarks -= penalty;
            }
          }
        }
      }

      processedAnswers.push({
        question: question._id,
        selectedAnswer,
        isCorrect,
        timeTaken: qTimeTaken,
      });
    });

    if (obtainedMarks < 0) obtainedMarks = 0;

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const passed = obtainedMarks >= (test.passingMarks || 0);

    // If a result draft was passed, use it, else create one
    let result;
    if (resultId) {
      result = await Result.findOne({ _id: resultId, user: req.user._id });
      if (result) {
        result.answers = processedAnswers;
        result.totalMarks = totalMarks;
        result.obtainedMarks = obtainedMarks;
        result.percentage = percentage;
        result.passed = passed;
        result.timeTaken = timeTaken || 0;
        result.autoSubmitted = autoSubmitted || false;
        result.status = 'completed';
        result.submittedAt = Date.now();
        await result.save();
      }
    }

    if (!result) {
      result = await Result.create({
        user: req.user._id,
        test: testId,
        answers: processedAnswers,
        totalMarks,
        obtainedMarks,
        percentage,
        passed,
        timeTaken: timeTaken || 0,
        autoSubmitted: autoSubmitted || false,
        status: 'completed'
      });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      const today = new Date().toDateString();
      const lastActive = user.streak.lastActiveDate
        ? new Date(user.streak.lastActiveDate).toDateString()
        : null;

      if (lastActive !== today) {
        let currentStreak = user.streak.currentStreak || 0;
        let longestStreak = user.streak.longestStreak || 0;

        if (lastActive) {
          const diffTime = Math.abs(new Date(today) - new Date(lastActive));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }

        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        user.streak.currentStreak = currentStreak;
        user.streak.longestStreak = longestStreak;
        user.streak.lastActiveDate = new Date();
        await user.save();
      }
    }

    await updateLeaderboard(req.user._id);

    return successResponse(res, 201, 'Test submitted successfully', result);
  } catch (error) {
    console.error('Submit test error:', error.message);
    return errorResponse(res, 500, 'Server error submitting test');
  }
};

module.exports = {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  startTest,
  saveAnswer,
  submitTest,
};

