import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ArrowBack, ArrowForward, CheckCircleOutline } from '@mui/icons-material';
import Logo from '../components/Logo';
import api from '../utils/api';


// Shared input sx — Refined Industrial Sleek Light
const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    borderRadius: '4px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.925rem',
    color: '#0F172A',
    '& fieldset': { borderColor: '#E2E8F0' },
    '&:hover fieldset': { borderColor: '#94A3B8' },
    '&.Mui-focused fieldset': { borderColor: '#14B8A6', borderWidth: '1px' },
  },
  '& .MuiInputLabel-root': {
    color: '#64748B',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#14B8A6' },
  '& .MuiInputBase-input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 100px #FFFFFF inset',
    WebkitTextFillColor: '#0F172A',
  },
};

const FieldLabel = ({ children }) => (
  <Typography sx={{
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    mb: 0.75,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }}>
    {children}
  </Typography>
);

const Register = ({ isEcommerce = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isEcommerce ? '/api/ecommerce/auth/register' : '/api/auth/register';
      const payload = { name, email, phone, password };
      if (!isEcommerce) {
        payload.role = 'Pending';
      }

      const response = await api.post(endpoint, payload);
      if (response.data.token) {
        const loginResult = await login(email, password, isEcommerce);
        if (loginResult.success) {
          navigate(isEcommerce ? '/account' : '/dashboard', { replace: true });
        } else {
          setError(loginResult.message || 'Registration successful but login failed.');
        }
      } else {
        setError(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      bgcolor: '#FFFFFF',
      position: 'relative',
    }}>

      {/* ── Left panel: branding ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: '0 0 45%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { md: 6, lg: 8 },
        bgcolor: '#0B1915',
        color: '#FFFFFF',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <Logo 
          height={40}
          fontSize="1.1rem"
          color="#1E293B"
        />

        {/* Center content */}
        <Box>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            border: '1px solid #14B8A6', borderRadius: '4px',
            px: 1.5, py: 0.5, mb: 4,
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#14B8A6' }} />
            <Typography sx={{
              color: '#14B8A6', fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}>
              {isEcommerce ? 'Customer Registration' : 'New Account'}
            </Typography>
          </Box>

          <Typography sx={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '3rem',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            mb: 2,
          }}>
            {isEcommerce ? 'Join ' : 'Join the '}
            <Box component="span" sx={{ color: '#14B8A6' }}>Demo ERP</Box>
            {isEcommerce ? '' : ' team'}
          </Typography>
          <Typography sx={{
            fontFamily: 'Inter, sans-serif',
            color: '#94A3B8', fontSize: '1.05rem', lineHeight: 1.7,
            maxWidth: '340px',
          }}>
            {isEcommerce ? 'Create an account to track your orders, save your wishlist, and check out faster.' : 'Create your administrator account to manage the DemoERP business operations.'}
          </Typography>

          {/* Steps */}
          <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', label: 'Fill in your details', done: name && email && phone },
              { step: '02', label: 'Set a secure password', done: passwordLongEnough },
              { step: '03', label: 'Confirm & create account', done: false },
            ].map(({ step, label, done }, i) => (
              <Box key={step} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {/* Connector */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{
                    width: 32, height: 32, minWidth: 32,
                    border: done ? 'none' : '1px solid #334155',
                    borderRadius: '4px',
                    bgcolor: done ? '#14B8A6' : '#E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    {done
                      ? <CheckCircleOutline sx={{ fontSize: '1rem', color: '#FFFFFF' }} />
                      : <Typography sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '0.7rem', fontWeight: 700,
                          color: '#94A3B8',
                        }}>{step}</Typography>
                    }
                  </Box>
                  {i < 2 && (
                    <Box sx={{ width: 1, flex: 1, minHeight: 24, bgcolor: '#334155', my: 0.5 }} />
                  )}
                </Box>
                <Box sx={{ pt: 0.6, pb: i < 2 ? 3 : 0 }}>
                  <Typography sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.875rem',
                    color: done ? '#FFFFFF' : '#94A3B8',
                    fontWeight: done ? 600 : 400,
                    transition: 'color 0.2s ease',
                  }}>
                    {label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography sx={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8rem', color: '#64748B',
          position: 'relative', zIndex: 1
        }}>
          © {new Date().getFullYear()} {settings?.companyName || 'Demo Electronics ERP'}. All rights reserved.
        </Typography>
      </Box>

      {/* ── Right panel: form ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, md: 6 },
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        <Box sx={{ width: '100%', maxWidth: 440, py: 4 }}>

          {/* Mobile logo */}
          <Logo 
            height={36}
            fontSize="1rem"
            color="#0F172A"
            sx={{ mb: 5, display: { xs: 'flex', md: 'none' } }}
          />

          {/* Header */}
          <Box sx={{ mb: 5 }}>
            <Typography sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: '1.75rem',
              color: '#0F172A',
              letterSpacing: '-0.02em',
              mb: 0.75,
            }}>
              Create account
            </Typography>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif',
              color: '#64748B', fontSize: '0.875rem',
            }}>
              All fields are required to register
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '4px',
                color: '#FCA5A5',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                '& .MuiAlert-icon': { color: '#EF4444' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>

            {/* Row: Full Name + Phone */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              <Box>
                <FieldLabel>Full Name</FieldLabel>
                <TextField
                  required fullWidth
                  id="name" name="name"
                  placeholder="John Doe"
                  autoComplete="name" autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={inputSx}
                />
              </Box>
              <Box>
                <FieldLabel>Phone</FieldLabel>
                <TextField
                  required fullWidth
                  id="phone" name="phone"
                  placeholder="+880 1XXX XXXXXX"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  sx={inputSx}
                />
              </Box>
            </Box>

            {/* Email */}
            <Box sx={{ mb: 2.5 }}>
              <FieldLabel>Email Address</FieldLabel>
              <TextField
                required fullWidth
                id="email" name="email" type="email"
                placeholder="admin@DemoERP.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={inputSx}
              />
            </Box>

            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Security
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
            </Box>

            {/* Password */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <FieldLabel>Password</FieldLabel>
                {password.length > 0 && (
                  <Typography sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    color: passwordLongEnough ? '#14B8A6' : '#FBBF24',
                    fontWeight: 600,
                  }}>
                    {passwordLongEnough ? '✓ Strong enough' : 'Min. 6 characters'}
                  </Typography>
                )}
              </Box>
              <TextField
                required fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: '#475569', '&:hover': { color: '#14B8A6' } }}
                      >
                        {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </Box>

            {/* Confirm Password */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <FieldLabel>Confirm Password</FieldLabel>
                {confirmPassword.length > 0 && (
                  <Typography sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    color: passwordsMatch ? '#14B8A6' : '#EF4444',
                    fontWeight: 600,
                  }}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Does not match'}
                  </Typography>
                )}
              </Box>
              <TextField
                required fullWidth
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: '#475569', '&:hover': { color: '#14B8A6' } }}
                      >
                        {showConfirmPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  ...inputSx,
                  ...(confirmPassword.length > 0 ? {
                    '& .MuiOutlinedInput-root': {
                      ...inputSx['& .MuiOutlinedInput-root'],
                      '& fieldset': {
                        borderColor: passwordsMatch ? 'rgba(20,184,166,0.5)' : 'rgba(239,68,68,0.5)',
                      },
                    },
                  } : {}),
                }}
              />
            </Box>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForward />}
              sx={{
                bgcolor: '#14B8A6',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 700,
                py: 1.5,
                borderRadius: '4px',
                textTransform: 'none',
                boxShadow: 'none',
                mb: 2,
                '&:hover': {
                  bgcolor: '#0F766E',
                  boxShadow: 'none',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: '#E2E8F0',
                  border: '1px solid #CBD5E1',
                  color: '#94A3B8',
                },
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#475569' }} /> : 'Create Account'}
            </Button>

            {/* Links */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                href="/"
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  color: '#64748B',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  '&:hover': { color: '#14B8A6' },
                  transition: 'color 0.15s ease',
                }}
              >
                <ArrowBack sx={{ fontSize: '0.9rem' }} />
                Back to Home
              </Link>
              <Typography sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem', color: '#64748B',
              }}>
                Have an account?{' '}
                <Link
                  href={isEcommerce ? "/shop/login" : "/admin/login"}
                  sx={{
                    color: '#14B8A6', fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;