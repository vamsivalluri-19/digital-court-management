const getInitialAuth = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      return {
        token,
        user: JSON.parse(userStr),
        isAuthenticated: true,
        loading: false,
      };
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  return {
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false,
  };
};

import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuth(),
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      state.loading = false;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    loginFailure: (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateProfileSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
