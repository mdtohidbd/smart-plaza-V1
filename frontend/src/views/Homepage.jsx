import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Link
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';
import WhyChooseUs from '../components/WhyChooseUs';



const Homepage = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { login } = useAuth();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    
    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setLoginError(result.message);
      }
    } catch (error) {
      setLoginError('An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    // Validation
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters');
      return;
    }
    
    setRegisterLoading(true);
    
    try {
      const response = await api.post('/api/auth/register', {
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
        role: 'SR'
      });
      
      if (response.data.token) {
        const loginResult = await login(registerEmail, registerPassword);
        if (loginResult.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setRegisterError('Registration successful but login failed');
        }
      } else {
        setRegisterError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1,  backgroundColor: '#FBFDFB', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#1D5F99', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <Logo 
            variant="admin"
            height={40}
            fontSize="1.1rem"
            color="white"
            sx={{ mr: 2 }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Hero Section */}
        {/* <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ color: '#1D5F99', fontWeight: 'bold', mb: 2 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="h5" sx={{ color: '#666', mb: 2 }}>
            Secure administrative access to business management tools
          </Typography>
        </Box> */}

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Paper 
            elevation={4} 
            sx={{ 
              p: 1.5,
              maxWidth: 500,
              backgroundColor: 'white',
              borderRadius: 1,
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Logo 
                variant="admin"
                height={80}
                fontSize="1.5rem"
                color="#1D5F99"
                sx={{ mb: 2, justifyContent: 'center' }}
              />
              <Typography variant="h5" sx={{ color: '#1D5F99', fontWeight: 'bold', mb: 1 }}>
                Admin Portal
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                Sign in to access administrative controls
              </Typography>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                centered
                sx={{
                  '& .MuiTab-root': {
                    color: '#1D5F99',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  },
                  '& .Mui-selected': {
                    color: '#E57141'
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#E57141'
                  }
                }}
              >
                <Tab label="Sign In" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ minHeight: 300 }}>
              {/* Login Tab */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleLoginSubmit}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="login-email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            {showLoginPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  {loginError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {loginError}
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 1.5, 
                      mb: 1.5,
                      backgroundColor: 'rgb(29, 29, 28)', // Smart Plaza BD logo color
                      '&:hover': {
                        backgroundColor: 'rgb(50, 50, 49)', // Slightly lighter shade
                      }
                    }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? <CircularProgress size={24} /> : 'Sign In'}
                  </Button>
                </Box>
              )}
              
              {/* Register Tab */}
              {activeTab === 1 && (
                <Box component="form" onSubmit={handleRegisterSubmit}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="register-name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    autoFocus
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="register-email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="register-phone"
                    label="Phone Number"
                    name="phone"
                    autoComplete="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    id="register-password"
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          >
                            {showRegisterPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                    id="register-confirm-password"
                    autoComplete="new-password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                          >
                            {showRegisterConfirmPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1D5F99',
                        },
                        '&:hover fieldset': {
                          borderColor: '#42A2C2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E57141',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#1D5F99',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E57141',
                      },
                    }}
                  />
                  {registerError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {registerError}
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 1.5, 
                      mb: 1.5,
                      backgroundColor: 'rgb(29, 29, 28)', // Smart Plaza BD logo color
                      '&:hover': {
                        backgroundColor: 'rgb(50, 50, 49)', // Slightly lighter shade
                      }
                    }}
                    disabled={registerLoading}
                  >
                    {registerLoading ? <CircularProgress size={24} /> : 'Sign Up'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          backgroundColor: '#1D5F99', 
          color: 'white', 
          py: 3,
          mt: 'auto'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1">
              © {new Date().getFullYear()} {settings?.companyName || 'Smart Plaza BD'}. All rights reserved.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              Administrative Portal - Secure Access Only
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;