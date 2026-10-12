import React, { createContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';

export const AuthContext = createContext();

const TOKEN_KEY = 'brocode_admin_token';

const initialState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const verifyUserSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const response = await apiService.getProfile();
        dispatch({ type: 'SET_USER', payload: response.data });
      } catch (error) {
        console.warn('Session verification failed, clearing token');
        localStorage.removeItem(TOKEN_KEY);
        dispatch({ type: 'LOGOUT' });
      }
    };

    verifyUserSession();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const bootstrapAdmin = async (adminData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.bootstrapAdmin(adminData);
      const { token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        login,
        bootstrapAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
