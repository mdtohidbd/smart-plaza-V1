import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Chip,
  Paper,
  Grid,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { 
  ArrowBack, 
  ArrowForward, 
  AdminPanelSettings, 
  Work, 
  ShoppingCart, 
  TrendingUp, 
  Security, 
  Person,
  FlashOn
} from '@mui/icons-material';
import Logo from '../components/Logo';

// Shared input sx — matches Refined Industrial Sleek theme but light
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

const DEMO_ROLES = [
  {
    role: 'Super Admin',
    email: 'admin@smartplazabd.com',
    password: 'admin123',
    badge: 'Full Access',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    icon: <AdminPanelSettings fontSize="small" />,
    desc: 'Full Dashboard, Financials, Users & Settings'
  },
  {
    role: 'Manager',
    email: 'manager@smartplazabd.com',
    password: 'manager123',
    badge: 'Management',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    icon: <Work fontSize="small" />,
    desc: 'Products, Inventory, Sales & Reports'
  },
  {
    role: 'Sales Staff',
    email: 'sales@smartplazabd.com',
    password: 'sales123',
    badge: 'POS & Counter',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    icon: <ShoppingCart fontSize="small" />,
    desc: 'Retail POS Checkout, Customer & Warranty'
  },
  {
    role: 'Investor',
    email: 'investor@smartplazabd.com',
    password: 'investor123',
    badge: 'Investor Portal',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.08)',
    icon: <TrendingUp fontSize="small" />,
    desc: 'Capital Portfolio & Profit Distributions'
  },
  {
    role: 'Super Admin Plus',
    email: 'adminplus@smartplazabd.com',
    password: 'adminplus123',
    badge: 'Master Role',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.08)',
    icon: <Security fontSize="small" />,
    desc: 'System Configuration & Extended Access'
  },
  {
    role: 'Customer',
    email: 'customer@smartplazabd.com',
    password: 'customer123',
    badge: 'E-Commerce',
    color: '#14B8A6',
    bgColor: 'rgba(20, 184, 166, 0.08)',
    icon: <Person fontSize="small" />,
    desc: 'Customer Store Profile, Orders & EMI'
  }
];

const Login = ({ isEcommerce = false }) => {
  const [email, setEmail] = useState(isEcommerce ? 'customer@smartplazabd.com' : 'admin@smartplazabd.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState(null);

  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || (isEcommerce ? '/account' : '/dashboard');

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, isEcommerce);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (roleItem) => {
    setActiveQuickRole(roleItem.role);
    setEmail(roleItem.email);
    setPassword(roleItem.password);
    setError('');
    setLoading(true);

    try {
      const isCust = roleItem.role === 'Customer';
      const targetPath = isCust 
        ? '/account' 
        : roleItem.role === 'Investor' 
          ? '/dashboard/investors/my-dashboard' 
          : '/dashboard';

      const result = await login(roleItem.email, roleItem.password, isCust);
      if (result.success) {
        navigate(targetPath, { replace: true });
      } else {
        setError(result.message || `Failed to log in as ${roleItem.role}`);
        setLoading(false);
        setActiveQuickRole(null);
      }
    } catch (err) {
      setError(`Error logging in as ${roleItem.role}`);
      setLoading(false);
      setActiveQuickRole(null);
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

      {/* ── Left panel: branding (desktop only) ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: '0 0 45%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { md: 5, lg: 7 },
        bgcolor: '#0B1915',
        color: '#FFFFFF',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}>
        {/* Logo + back link */}
        <Box>
            <Logo 
              height={40}
              fontSize="1.1rem"
              color="#FFFFFF"
            />
        </Box>

        {/* Center: headline */}
        <Box>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            border: '1px solid #14B8A6',
            borderRadius: '4px',
            px: 1.5, py: 0.5, mb: 3,
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#14B8A6' }} />
            <Typography sx={{
              color: '#14B8A6',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}>
              {isEcommerce ? 'Customer Access' : 'Admin Access'}
            </Typography>
          </Box>

          <Typography sx={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '2.75rem',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            mb: 2,
          }}>
            {isEcommerce ? (
              <>
                Welcome{' '}
                <Box component="span" sx={{ color: '#14B8A6' }}>
                  Back
                </Box>
              </>
            ) : (
              <>
                Business{' '}
                <Box component="span" sx={{ color: '#14B8A6' }}>
                  Management
                </Box>{' '}
                Portal
              </>
            )}
          </Typography>
          <Typography sx={{
            fontFamily: 'Inter, sans-serif',
            color: '#94A3B8',
            fontSize: '1rem',
            lineHeight: 1.6,
            maxWidth: '360px',
          }}>
            {isEcommerce ? 'Access your orders, track shipments, and manage your profile.' : 'Manage inventory, sales, finance, and operations from a single unified dashboard.'}
          </Typography>

          {/* Feature list */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {(isEcommerce ? [
              'Order tracking and history',
              'EMI payment dashboard',
              'Wishlist and saved items',
              'Exclusive offers and deals',
            ] : [
              'Real-time inventory with serial number tracking',
              'Dual invoice system (retail + EMI)',
              'Customer fraud detection',
              'Financial reporting & analytics',
            ]).map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                  width: 18, height: 18, minWidth: 18,
                  border: '1px solid #14B8A6',
                  borderRadius: '3px',
                  bgcolor: 'rgba(20,184,166,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mt: 0.15,
                }}>
                  <Box sx={{ width: 6, height: 6, bgcolor: '#14B8A6', borderRadius: '1px' }} />
                </Box>
                <Typography sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  color: '#CBD5E1',
                  lineHeight: 1.5,
                }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom: copyright */}
        <Typography sx={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8rem',
          color: '#64748B',
          position: 'relative', zIndex: 1
        }}>
          © {new Date().getFullYear()} {settings?.companyName || 'Smart Plaza BD'}. All rights reserved.
        </Typography>
      </Box>

      {/* ── Right panel: login form & role switcher ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2.5, md: 5 },
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto'
      }}>
        <Box sx={{ width: '100%', maxWidth: 540 }}>

          {/* Mobile logo */}
          <Logo 
            height={36}
            fontSize="1rem"
            color="#0F172A"
            sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}
          />

          {/* Form header */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.65rem',
              color: '#0F172A',
              letterSpacing: '-0.02em',
              mb: 0.25,
            }}>
              Sign in
            </Typography>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif',
              color: '#64748B',
              fontSize: '0.825rem',
            }}>
              Select any role below for 1-click instant demo access.
            </Typography>
          </Box>

          {/* Quick Demo Role Switcher Card Grid */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <FlashOn sx={{ color: '#F59E0B', fontSize: '1.1rem' }} />
                <Typography sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  color: '#0F172A',
                  textTransform: 'uppercase'
                }}>
                  ১-ক্লিক রোল লগইন (Quick Role Login)
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#94A3B8' }}>
                Click to switch & login
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {DEMO_ROLES.map((item) => {
                const isLoadingThis = loading && activeQuickRole === item.role;
                const isActive = activeQuickRole === item.role;
                return (
                  <Grid item xs={6} sm={4} key={item.role}>
                    <Paper
                      elevation={0}
                      onClick={() => !loading && handleQuickRoleLogin(item)}
                      sx={{
                        p: 1.15,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isActive ? item.color : '#E2E8F0',
                        bgcolor: isActive ? item.bgColor : '#FAFAFA',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: item.color,
                          bgcolor: item.bgColor,
                          boxShadow: `0 4px 12px ${item.color}22`,
                          transform: 'translateY(-2px)',
                          '& .role-icon-box': {
                            bgcolor: item.color,
                            color: '#FFFFFF'
                          }
                        }
                      }}
                    >
                      {/* Left icon badge */}
                      <Box 
                        className="role-icon-box"
                        sx={{
                          width: 32,
                          height: 32,
                          minWidth: 32,
                          borderRadius: '5px',
                          bgcolor: `${item.color}15`,
                          color: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        {isLoadingThis ? (
                          <CircularProgress size={16} sx={{ color: 'inherit' }} />
                        ) : (
                          item.icon
                        )}
                      </Box>

                      {/* Text info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          color: '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2
                        }}>
                          {item.role}
                        </Typography>
                        <Typography sx={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.65rem',
                          color: item.color,
                          fontWeight: 600,
                          lineHeight: 1.1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.badge}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
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
                color: '#EF4444',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                '& .MuiAlert-icon': { color: '#EF4444' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Manual Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                mb: 0.75,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Or Sign In Manually (Email Address)
              </Typography>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                type="email"
                placeholder="admin@smartplazabd.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={inputSx}
              />
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  Password
                </Typography>
              </Box>
              <TextField
                required
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
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
                py: 1.25,
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
              {loading && !activeQuickRole ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Sign In'}
            </Button>

            {/* Links */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
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
                fontSize: '0.8rem',
                color: '#64748B',
              }}>
                New user?{' '}
                <Link
                  href={isEcommerce ? "/shop/register" : "/admin/register"}
                  sx={{
                    color: '#14B8A6',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Create account
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;