import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService';

export const fetchDashboardStats = createAsyncThunk('admin/fetchDashboardStats', async (_, { rejectWithValue }) => {
  try {
    const response = await adminService.getDashboardStats();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
  }
});

export const fetchStudents = createAsyncThunk('admin/fetchStudents', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getStudents(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
  }
});

export const fetchQuestions = createAsyncThunk('admin/fetchQuestions', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getQuestions(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
  }
});

export const fetchTests = createAsyncThunk('admin/fetchTests', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getTests(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tests');
  }
});

export const fetchCategories = createAsyncThunk('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await adminService.getCategories();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchResults = createAsyncThunk('admin/fetchResults', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getResults(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch results');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboardStats: null,
    students: { data: [], total: 0, page: 1, pages: 1 },
    questions: { data: [], total: 0, page: 1, pages: 1 },
    tests: { data: [], total: 0, page: 1, pages: 1 },
    codingProblems: { data: [], total: 0, page: 1, pages: 1 },
    categories: [],
    subcategories: [],
    results: { data: [], total: 0, page: 1, pages: 1 },
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => { state.error = null; },
    setCategories: (state, action) => { state.categories = action.payload; },
    setSubcategories: (state, action) => { state.subcategories = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.isLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchStudents.pending, (state) => { state.isLoading = true; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuestions.pending, (state) => { state.isLoading = true; })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTests.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tests = action.payload;
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategories.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.categories || action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchResults.pending, (state) => { state.isLoading = true; })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError, setCategories, setSubcategories } = adminSlice.actions;
export default adminSlice.reducer;

