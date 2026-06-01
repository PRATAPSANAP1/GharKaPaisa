const User = require('../models/User');
const Result = require('../models/Result');
const CodingSubmission = require('../models/CodingSubmission');
const Leaderboard = require('../models/Leaderboard');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = { role: 'student' }; // Only list students by default
    if (req.query.includeAdmins === 'true') {
      delete filter.role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return successResponse(res, 200, 'Students retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving students');
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Get user error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving user');
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, role, phone, college, branch, year } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (year) user.year = year;

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return successResponse(res, 200, 'User updated successfully', updatedUser);
  } catch (error) {
    console.error('Update user error:', error.message);
    return errorResponse(res, 500, 'Server error updating user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await Leaderboard.deleteOne({ user: req.params.id });

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error.message);
    return errorResponse(res, 500, 'Server error deleting user');
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(res, 400, 'Invalid User ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const testsCount = await Result.countDocuments({ user: userId });

    const avgPercentageResult = await Result.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);
    const avgPercentage = (avgPercentageResult.length > 0 && typeof avgPercentageResult[0].avg === 'number') ? avgPercentageResult[0].avg : 0;

    const passedCount = await Result.countDocuments({ user: userId, passed: true });
    const failedCount = testsCount - passedCount;

    const solvedProblems = await CodingSubmission.find({
      user: userId,
      status: 'accepted'
    }).distinct('problem');
    const solvedCount = solvedProblems.length;

    const codingSubmissionsCount = await CodingSubmission.countDocuments({ user: userId });

    const leaderboardEntry = await Leaderboard.findOne({ user: userId });

    return successResponse(res, 200, 'User statistics retrieved successfully', {
      testsCompleted: testsCount,
      averagePercentage: parseFloat(avgPercentage.toFixed(2)),
      passRate: testsCount > 0 ? parseFloat(((passedCount / testsCount) * 100).toFixed(2)) : 0,
      passedCount,
      failedCount,
      codingProblemsSolved: solvedCount,
      codingSubmissionsCount,
      score: leaderboardEntry ? leaderboardEntry.totalScore : 0,
      rank: leaderboardEntry ? leaderboardEntry.rank : 'Unranked',
    });
  } catch (error) {
    console.error('Get user stats error:', error.message);
    return errorResponse(res, 500, 'Server error retrieving user statistics');
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
};

