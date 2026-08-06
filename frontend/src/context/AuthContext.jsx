import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

// Create Auth Context
const AuthContext = createContext();

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      // Defensive handling - ensure user object exists and has expected properties
      const user = action.payload.user || {};
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'SET_SHOPS':
      return {
        ...state,
        shops: action.payload
      };
    case 'SET_ACTIVE_SHOP':
      return {
        ...state,
        activeShop: action.payload
      };
    default:
      return state;
  }
};

// Helper function to synchronously load cached active shop on initial load
const getInitialActiveShop = () => {
  try {
    const cachedObj = localStorage.getItem('activeShopObject');
    if (cachedObj) {
      const parsed = JSON.parse(cachedObj);
      if (parsed && parsed._id && parsed.name) return parsed;
    }
    const savedId = localStorage.getItem('activeShop') || localStorage.getItem('activeShopId');
    const savedName = localStorage.getItem('activeShopName');
    if (savedId && /^[0-9a-fA-F]{24}$/.test(savedId)) {
      return { _id: savedId, name: savedName || 'Shop' };
    }
  } catch (e) {}
  return null;
};

// Initial State
const initialState = {
  loading: true, // Start with loading true to check auth status
  isAuthenticated: false,
  user: null,
  shops: [],
  activeShop: getInitialActiveShop(),
  token: localStorage.getItem('token') || null,
  error: null
};

// Helper function to validate token
const validateToken = async (token) => {
  try {
    const response = await api.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    console.log('AuthContext - Token changed, updating axios defaults:', state.token ? 'Yes' : 'No');
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Sync token from localStorage to axios on initial load
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('token');
    if (tokenFromStorage && !state.token) {
      // If there's a token in localStorage but not in state, update the axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
    }
  }, []); // Only run once on initial load

  // Check if user is authenticated on initial load
  useEffect(() => {
    console.log('AuthContext useEffect running');

    let isCancelled = false; // To prevent state updates after component unmounts

    const checkAuth = async () => {
      console.log('Checking authentication on page load');
      const token = localStorage.getItem('token');
      console.log('Token found in localStorage:', token ? 'Yes' : 'No');

      if (token) {
        try {
          console.log('Validating token with profile API...');
          // Ensure axios header is set before making profile request
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userData = await validateToken(token);
          console.log('Profile response:', userData);

          // CRITICAL: Check if user account is active
          if (!userData.isActive) {
            console.warn('User account is INACTIVE:', userData.email, 'Role:', userData.role);
            console.log('Auto-logout triggered for inactive user');
            
            // Auto logout inactive user
            if (!isCancelled) {
              localStorage.removeItem('token');
              delete api.defaults.headers.common['Authorization'];
              dispatch({ type: 'LOGOUT' });
              
              // Show message to user
              alert('Your account is under review. Please contact your administrator.');
              window.location.href = '/admin/login';
            }
            return;
          }

          // CRITICAL: Check approval status for SR and DSR roles
          if (['SR', 'DSR'].includes(userData.role) && userData.approvalStatus !== 'Approved') {
            console.warn('Unapproved user trying to access system:', userData.email, 'Status:', userData.approvalStatus);
            console.log('Auto-logout triggered for unapproved user');
            
            // Auto logout unapproved user
            if (!isCancelled) {
              localStorage.removeItem('token');
              delete api.defaults.headers.common['Authorization'];
              dispatch({ type: 'LOGOUT' });
              
              // Show message to user
              alert(`Your account is under review (${userData.approvalStatus}). Please wait for Super Admin approval.`);
              window.location.href = '/admin/login';
            }
            return;
          }

          // Only update state if component is still mounted and user passed all checks
          if (!isCancelled) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userData,
                token
              }
            });
            console.log('Authentication state updated - User is ACTIVE and APPROVED');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          console.error('Error details:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            url: error.config?.url
          });

          // Only remove token if it's a clear 401 unauthorized or 403 forbidden failure
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Authentication error - removing token and logging out');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            if (!isCancelled) {
              dispatch({ type: 'LOGOUT' });
            }
          } else {
            // For network errors or server 500s during refresh, retry/keep existing token state rather than logging user out
            console.warn('Network or server error during token check, keeping token intact.');
            if (!isCancelled) {
              dispatch({ 
                type: 'LOGIN_ERROR', 
                payload: error.response?.data?.message || 'Server connection error. Retrying...' 
              });
            }
          }
        }
      } else {
        console.log('No token found, user is not authenticated');
        // Explicitly set the state to reflect no authentication
        if (!isCancelled) {
          dispatch({ type: 'LOGOUT' });
        }
      }
    };

    checkAuth();

    // Cleanup function to prevent state updates after component unmounts
    return () => {
      isCancelled = true;
    };
  }, []); // Empty dependency array to ensure this only runs once

  // Login function
  const login = async (email, password, isEcommerce = false) => {
    console.log('Login function called with email:', email, 'isEcommerce:', isEcommerce);
    dispatch({ type: 'LOGIN_START' });
    try {
      const endpoint = isEcommerce ? '/api/ecommerce/auth/login' : '/api/auth/login';
      console.log('Making API call to login endpoint:', endpoint);
      const response = await api.post(endpoint, { email, password });
      console.log('Login response received:', response);

      const { token, ...userData } = response.data;

      // CRITICAL: Check if user is active before allowing login
      if (!userData.isActive) {
        console.warn('Inactive user trying to login:', email);
        dispatch({
          type: 'LOGIN_ERROR',
          payload: 'Your account is under review. Please contact your administrator.'
        });
        return { 
          success: false, 
          message: 'Your account is under review. Please contact your administrator.' 
        };
      }

      // CRITICAL: Check approval status for SR and DSR roles
      if (['SR', 'DSR'].includes(userData.role) && userData.approvalStatus !== 'Approved') {
        console.warn('Unapproved user trying to login:', email, 'Status:', userData.approvalStatus);
        dispatch({
          type: 'LOGIN_ERROR',
          payload: `Your account is ${userData.approvalStatus}. Please wait for Super Admin approval.`
        });
        return { 
          success: false, 
          message: `Your account is ${userData.approvalStatus}. Please wait for Super Admin approval.` 
        };
      }

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Update axios defaults with new token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, token }
      });

      console.log('Login successful - User is ACTIVE and APPROVED');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  // Function to sync token from localStorage to axios
  const syncTokenToAxios = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    return token;
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/api/auth/profile', userData);
      dispatch({
        type: 'SET_USER',
        payload: response.data
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  // Fetch shops list
  const fetchShops = async () => {
    try {
      const response = await api.get('/api/shops');
      if (response.data?.success) {
        const shopList = response.data.data || [];
        dispatch({ type: 'SET_SHOPS', payload: shopList });
        
        // Restore saved shop or pick first available shop
        const savedShopId = localStorage.getItem('activeShop') || localStorage.getItem('activeShopId');
        const userShopId = typeof state.user?.activeShop === 'object' ? state.user?.activeShop?._id : state.user?.activeShop;
        const targetId = (savedShopId && /^[0-9a-fA-F]{24}$/.test(savedShopId)) ? savedShopId : userShopId;

        let currentShop = shopList.find(s => s._id === targetId);
        if (!currentShop && shopList.length > 0) {
          currentShop = shopList[0];
        }
        if (currentShop) {
          dispatch({ type: 'SET_ACTIVE_SHOP', payload: currentShop });
          localStorage.setItem('activeShop', currentShop._id);
          localStorage.setItem('activeShopId', currentShop._id);
          localStorage.setItem('activeShopName', currentShop.name);
          localStorage.setItem('activeShopObject', JSON.stringify(currentShop));
          api.defaults.headers.common['x-shop-id'] = currentShop._id;
        }
        return shopList;
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
    return [];
  };

  // Switch active shop
  const switchShop = async (shopOrId) => {
    try {
      const shopId = typeof shopOrId === 'string' ? shopOrId : shopOrId?._id;
      if (!shopId) return { success: false, message: 'Invalid shop ID' };

      const targetShop = typeof shopOrId === 'object' 
        ? shopOrId 
        : (state.shops || []).find(s => s._id === shopId);

      // Instantly update active shop state & localStorage with 0ms delay!
      if (targetShop && targetShop._id) {
        dispatch({ type: 'SET_ACTIVE_SHOP', payload: targetShop });
        localStorage.setItem('activeShop', targetShop._id);
        localStorage.setItem('activeShopId', targetShop._id);
        localStorage.setItem('activeShopName', targetShop.name);
        localStorage.setItem('activeShopObject', JSON.stringify(targetShop));
        api.defaults.headers.common['x-shop-id'] = targetShop._id;
      }

      // Notify queries to refresh in background without reloading the page or showing Loading Workspace screen
      window.dispatchEvent(new CustomEvent('shopSwitched', { detail: { shopId } }));

      const res = await api.post('/api/shops/switch', { shopId });
      if (res.data?.success) {
        const backendShop = res.data.data || targetShop;
        if (backendShop && backendShop._id) {
          dispatch({ type: 'SET_ACTIVE_SHOP', payload: backendShop });
          localStorage.setItem('activeShop', backendShop._id);
          localStorage.setItem('activeShopId', backendShop._id);
          localStorage.setItem('activeShopName', backendShop.name);
          localStorage.setItem('activeShopObject', JSON.stringify(backendShop));
          api.defaults.headers.common['x-shop-id'] = backendShop._id;
        }
        await fetchShops();
        window.dispatchEvent(new CustomEvent('shopSwitched', { detail: { shopId } }));
        return { success: true, shop: backendShop };
      }
    } catch (error) {
      console.error('Failed to switch shop:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to switch shop' };
    }
  };

  // Auto fetch shops on authentication
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      fetchShops();
    }
  }, [state.isAuthenticated, state.token]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateProfile,
        syncTokenToAxios,
        fetchShops,
        switchShop
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the context itself
export { AuthContext };

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export permission components for easy access
export { default as RequirePermission } from '../components/RequirePermission';
export {
  RequireReadPermission,
  RequireCreatePermission,
  RequireUpdatePermission,
  RequireDeletePermission
} from '../components/RequirePermission';