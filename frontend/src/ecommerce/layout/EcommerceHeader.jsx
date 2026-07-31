import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Badge, InputBase,
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Avatar, Menu, MenuItem, Fade, Popover, Button, Container,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon, Search as SearchIcon, ShoppingCart as CartIcon,
  AccountCircle, Logout, PersonAdd, Login, ExpandMore,
  CardGiftcard as GiftIcon, CompareArrows as CompareIcon,
  PersonOutline as PersonOutlineIcon, KeyboardArrowRight,
  Close as CloseIcon, ExpandLess, ExpandMore as ExpandMoreIcon,
  LocalShipping as LocalShippingIcon,
  Tv as TvIcon,
  AcUnit as AcIcon,
  Kitchen as KitchenIcon,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
  SpeakerGroup as SpeakerIcon,
  Iron as SmallApplianceIcon,
  Microwave as KitchenApplianceIcon,
  SettingsSuggestOutlined as AccessoriesIcon
} from '@mui/icons-material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { BRAND_PRIMARY } from '../../theme/brandColors';
import CartDrawer from './CartDrawer';
import giftGif from '../../assets/gift.gif';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const CATEGORY_DRAWER_ICONS = {
  'default': <LaptopIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'television': <TvIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'tv': <TvIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'air conditioner': <AcIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'ac': <AcIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'refrigerator': <KitchenIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'fridge': <KitchenIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'deep freezer': <KitchenIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'washing machine': <KitchenApplianceIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'kitchen appliances': <KitchenApplianceIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'small appliances': <SmallApplianceIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'electronics': <SmartphoneIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'mobile phones': <SmartphoneIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'smartphones': <SmartphoneIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'laptops': <LaptopIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'computers': <LaptopIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'audio': <SpeakerIcon fontSize="small" sx={{ color: '#14B8A6' }} />,
  'accessories': <AccessoriesIcon fontSize="small" sx={{ color: '#14B8A6' }} />
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return CATEGORY_DRAWER_ICONS.default;
  const name = categoryName.toLowerCase();
  const matchedEntry = Object.entries(CATEGORY_DRAWER_ICONS).find(([key]) => name.includes(key));
  return matchedEntry ? matchedEntry[1] : <LaptopIcon fontSize="small" sx={{ color: '#14B8A6' }} />;
};

const EcommerceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState({});
  
  // Category dropdown states
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [hoveredCategoryName, setHoveredCategoryName] = useState('');
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const hoverTimeout = useRef(null);

  const currentCategory = new URLSearchParams(location.search).get('category');
  const isAllCategoriesActive = location.pathname === '/shop/products' && !currentCategory;

  useEffect(() => {
    fetchCategories();
    updateCartCount();
    const handleStorageChange = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    
    const handleToggleDrawer = () => setMobileOpen(prev => !prev);
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener('toggle-mobile-drawer', handleToggleDrawer);
    window.addEventListener('open-cart-drawer', handleOpenCart);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('toggle-mobile-drawer', handleToggleDrawer);
      window.removeEventListener('open-cart-drawer', handleOpenCart);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${getPublicApiBase()}/categories`);
      const allCategories = response.data.data || [];
      const topLevelCategories = allCategories.filter(cat => !cat.parent);
      
      const subCats = {};
      topLevelCategories.forEach(parent => {
        const children = allCategories.filter(cat => 
          cat.parent && (cat.parent._id === parent._id || cat.parent === parent._id)
        );
        if (children.length > 0) {
          subCats[parent.name] = children;
        }
      });

      setCategories(topLevelCategories);
      setSubCategories(subCats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const handleLogout = () => { authLogout(); navigate('/'); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop/products?search=${searchQuery}`);
      setMobileSearchOpen(false);
    }
  };
  const handleAccountClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseAccountMenu = () => setAnchorEl(null);
  const isStaffUser = ['Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Investor'].includes(user?.role);
  const handleDashboardClick = () => {
    handleCloseAccountMenu();
    if (isStaffUser) { window.location.href = '/dashboard'; } else { navigate('/shop/account/profile'); }
  };
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleCategoryHover = (event, categoryId, categoryName) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredCategoryId(categoryId);
    setHoveredCategoryName(categoryName);
    setCategoryAnchorEl(event.currentTarget);
  };
  const handleCategoryLeave = () => {
    const timeout = setTimeout(() => {
      setCategoryAnchorEl(null);
      setHoveredCategoryId(null);
      setHoveredCategoryName('');
    }, 400);
    hoverTimeout.current = timeout;
  };
  const handlePopoverEnter = () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); };
  const handleCategoryClick = (category) => {
    navigate(`/shop/products?category=${category._id}`);
    handleCategoryLeave();
    setMobileOpen(false);
  };

  const primaryColor = BRAND_PRIMARY;

  const drawer = (
    <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
      {/* Drawer Header */}
      <Box sx={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 2.5, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Logo 
            variant="ecommerce"
            height={36}
            fontSize="1rem"
            color="#14B8A6"
          />
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#64748B' }}><CloseIcon /></IconButton>
      </Box>

      {/* Mobile Search inside drawer */}
      <Box component="form" onSubmit={handleSearch} sx={{ px: 2.5, py: 2 }}>
        <Box sx={{ 
          display: 'flex', alignItems: 'center', bgcolor: '#F1F5F9', 
          borderRadius: '8px', px: 1.5, border: '1px solid #E2E8F0' 
        }}>
          <InputBase
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ color: '#1E293B', fontSize: '0.88rem', flex: 1, py: 0.8 }}
          />
          <IconButton type="submit" size="small" sx={{ color: '#14B8A6' }}><SearchIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#E2E8F0' }} />

      {/* Nav Links */}
      <List sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {[
          { label: 'Home', path: '/' }, 
          { label: 'Shop', path: '/shop/products' }, 
          { label: 'Track Order', path: isAuthenticated && !isStaffUser ? '/shop/account/track-order' : '/shop/orders/tracking' }, 
          { label: 'About Us', path: '/about' }, 
          { label: 'Contact', path: '/contact' }
        ].map(item => {
          const isActive = location.pathname === item.path || (item.path === '/shop/products' && location.pathname.startsWith('/shop/products'));
          return (
            <ListItem 
              key={item.label} 
              button 
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{ 
                py: 1.2, 
                px: 3, 
                borderLeft: '4px solid',
                borderColor: isActive ? '#14B8A6' : 'transparent',
                bgcolor: isActive ? 'rgba(20,184,166,0.04)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' } 
              }}
            >
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  sx: { 
                    color: isActive ? '#14B8A6' : '#1E293B', 
                    fontWeight: 600, 
                    fontSize: '0.92rem' 
                  } 
                }} 
              />
            </ListItem>
          );
        })}

        <Divider sx={{ borderColor: '#E2E8F0', my: 1.5 }} />

        {/* Categories Section Header (Highly Visible!) */}
        <ListItem sx={{ py: 1, px: 3 }}>
          <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Categories
          </Typography>
        </ListItem>
        {categories.map((cat) => (
          <React.Fragment key={cat._id}>
            <ListItem 
              button 
              sx={{ 
                py: 1, 
                px: 3, 
                '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' } 
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {getCategoryIcon(cat.name)}
              </ListItemIcon>
              <ListItemText
                primary={cat.name}
                onClick={() => handleCategoryClick(cat)}
                primaryTypographyProps={{ sx: { color: cat.hasProducts === false ? '#9CA3AF' : '#334155', fontWeight: 600, fontSize: '0.88rem' } }}
              />
              {subCategories[cat.name] && (
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); setExpandedCategory(expandedCategory === cat._id ? null : cat._id); }}
                  sx={{ color: '#64748B', p: 0.5 }}
                >
                  {expandedCategory === cat._id ? <ExpandLess fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              )}
            </ListItem>
            {subCategories[cat.name] && (
              <Collapse in={expandedCategory === cat._id}>
                {subCategories[cat.name].map(sub => (
                  <ListItem 
                    key={sub._id} 
                    button 
                    onClick={() => handleCategoryClick(sub)}
                    sx={{ 
                      py: 0.8, 
                      pl: 7, 
                      pr: 3, 
                      opacity: sub.hasProducts === false ? 0.6 : 1,
                      '&:hover': { bgcolor: sub.hasProducts === false ? 'transparent' : 'rgba(20,184,166,0.02)' } 
                    }}
                  >
                    <ListItemText 
                      primary={sub.name} 
                      primaryTypographyProps={{ sx: { color: sub.hasProducts === false ? '#9CA3AF' : '#64748B', fontSize: '0.82rem', fontWeight: 500 } }} 
                    />
                  </ListItem>
                ))}
              </Collapse>
            )}
          </React.Fragment>
        ))}

        <Divider sx={{ borderColor: '#E2E8F0', my: 1.5 }} />

        {!isAuthenticated ? (
          <>
            <ListItem button onClick={() => { navigate('/shop/login'); setMobileOpen(false); }}
              sx={{ py: 1.2, px: 3, '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' } }}>
              <ListItemIcon sx={{ minWidth: 32, color: '#14B8A6' }}><Login fontSize="small" /></ListItemIcon>
              <ListItemText primary="Login" primaryTypographyProps={{ sx: { color: '#334155', fontWeight: 600, fontSize: '0.9rem' } }} />
            </ListItem>
            <ListItem button onClick={() => { navigate('/shop/register'); setMobileOpen(false); }}
              sx={{ py: 1.2, px: 3, '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' } }}>
              <ListItemIcon sx={{ minWidth: 32, color: '#14B8A6' }}><PersonAdd fontSize="small" /></ListItemIcon>
              <ListItemText primary="Sign Up" primaryTypographyProps={{ sx: { color: '#334155', fontWeight: 600, fontSize: '0.9rem' } }} />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => { handleDashboardClick(); setMobileOpen(false); }}
              sx={{ py: 1.2, px: 3, '&:hover': { bgcolor: 'rgba(20,184,166,0.04)' } }}>
              <ListItemIcon sx={{ minWidth: 32, color: '#14B8A6' }}><AccountCircle fontSize="small" /></ListItemIcon>
              <ListItemText primary={isStaffUser ? "Admin Dashboard" : "My Account"} primaryTypographyProps={{ sx: { color: '#334155', fontWeight: 600, fontSize: '0.9rem' } }} />
            </ListItem>
            {!isStaffUser && (
              <>
                <ListItem button onClick={() => { navigate('/shop/account/orders'); setMobileOpen(false); }}
                  sx={{ py: 1, pl: 7, pr: 3, '&:hover': { bgcolor: 'rgba(20,184,166,0.02)' } }}>
                  <ListItemText primary="My Orders" primaryTypographyProps={{ sx: { color: '#64748B', fontSize: '0.84rem', fontWeight: 500 } }} />
                </ListItem>
                <ListItem button onClick={() => { navigate('/shop/account/wishlist'); setMobileOpen(false); }}
                  sx={{ py: 1, pl: 7, pr: 3, '&:hover': { bgcolor: 'rgba(20,184,166,0.02)' } }}>
                  <ListItemText primary="Wishlist" primaryTypographyProps={{ sx: { color: '#64748B', fontSize: '0.84rem', fontWeight: 500 } }} />
                </ListItem>
              </>
            )}
            <ListItem button onClick={() => { handleLogout(); setMobileOpen(false); }}
              sx={{ py: 1.2, px: 3, '&:hover': { bgcolor: 'rgba(239,68,68,0.04)' } }}>
              <ListItemIcon sx={{ minWidth: 32, color: '#EF4444' }}><Logout fontSize="small" /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ sx: { color: '#EF4444', fontWeight: 600, fontSize: '0.9rem' } }} />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      bgcolor: '#ffffff', color: '#151d19',
      borderBottom: '1px solid #dce5dd',
      zIndex: (theme) => theme.zIndex.appBar
    }}>
      {/* Main Top Bar */}
      <Box sx={{ borderBottom: '1px solid #dce5dd', bgcolor: '#f3fcf4' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ 
            minHeight: { xs: 56, md: 80 }, gap: { xs: 0.5, md: 2 },
            display: 'flex', justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>

              {/* Logo */}
              <Logo 
                variant="ecommerce"
                height={40}
                fontSize="1.4rem"
                color="#006c48"
              />
            </Box>

            {/* Desktop Search */}
            <Box component="form" onSubmit={handleSearch} sx={{
              display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: '#e7f0e9',
              borderRadius: '30px', px: 2.5, flexGrow: 1, maxWidth: '650px', mx: 3, height: '44px',
              transition: 'all 0.3s ease', border: '1px solid transparent',
              '&:focus-within': { borderColor: '#0bd593', bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(11, 213, 147, 0.1)' }
            }}>
              <IconButton type="submit" size="small" sx={{ color: '#006c48', mr: 1, '&:hover': { bgcolor: 'transparent' } }}>
                <SearchIcon />
              </IconButton>
              <InputBase placeholder="Search tech..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ color: '#151d19', fontSize: '0.95rem', flex: 1, fontFamily: 'Inter, sans-serif' }} />
            </Box>

            {/* Right Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, lg: 3 } }}>
              {/* Offers */}
              <Box onClick={() => navigate('/shop/offers')}
                sx={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, cursor: 'pointer', 
                  background: 'transparent',
                  px: { xs: 0, sm: 1.5 }, py: { xs: 0, sm: 0.8 }, 
                  width: { xs: '40px', sm: 'auto' }, height: { xs: '40px', sm: 'auto' },
                  borderRadius: '20px', 
                  boxShadow: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    transform: 'scale(1.05)',
                  }
                }}>
                <img src={giftGif} alt="Offers" style={{ width: '34px', height: '34px', display: 'block' }} />
                <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 700, fontSize: { xs: '0.95rem', md: '1.05rem' }, color: '#151d19' }}>Offers</Typography>
              </Box>

              {/* Cart */}
              <IconButton onClick={() => setCartOpen(true)} sx={{ 
                display: { xs: 'none', md: 'inline-flex' },
                color: '#151d19', border: 'none',
                borderRadius: '50%', p: { xs: 0.8, md: 1.2 }, transition: 'all 0.2s',
                '&:hover': { bgcolor: '#e7f0e9' }
              }}>
                <Badge badgeContent={cartCount} sx={{ 
                  '& .MuiBadge-badge': { bgcolor: '#0bd593', color: '#151d19', fontWeight: 700, right: -2, top: 4, border: '2px solid #ffffff', fontSize: '0.65rem', minWidth: 18, height: 18 }
                }}>
                  <ShoppingCartOutlinedIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />
                </Badge>
              </IconButton>

              {/* User Account */}
              <IconButton onClick={handleAccountClick} sx={{ 
                display: { xs: 'none', md: 'inline-flex' },
                color: '#151d19', bgcolor: 'transparent', border: 'none',
                borderRadius: '50%', p: { xs: 0.8, md: 1.2 }, transition: 'all 0.2s',
                '&:hover': { bgcolor: '#e7f0e9' }
              }}>
                {user?.avatar ? <Avatar src={user.avatar} sx={{ width: 28, height: 28 }} /> : <PersonOutlineIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />}
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </Box>

      {/* Mobile Search Bar - always visible */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, bgcolor: '#f3fcf4', px: 2, pb: 1.5, pt: 0.5, borderBottom: '1px solid #dce5dd' }}>
        <Box component="form" onSubmit={handleSearch} sx={{
          display: 'flex', alignItems: 'center', bgcolor: '#e7f0e9', borderRadius: '30px', height: '42px', overflow: 'hidden'
        }}>
          <IconButton type="submit" sx={{ color: '#006c48', borderRadius: 0, px: 2, height: '100%' }}>
            <SearchIcon />
          </IconButton>
          <InputBase placeholder="Search tech..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ color: '#151d19', fontSize: '0.85rem', flex: 1, pr: 1.5, py: 1 }} />
        </Box>
      </Box>

      {/* Categories Sub Bar - Desktop */}
      <Box sx={{ bgcolor: '#ffffff', color: '#151d19', display: { xs: 'none', md: 'block' }, borderBottom: '1px solid #dce5dd' }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            overflowX: 'auto', py: 0.8, textAlign: 'center',
            cursor: 'grab', '&:active': { cursor: 'grabbing' },
            '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none'
          }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0, 
              bgcolor: '#f3fcf4', p: 0.5, borderRadius: '30px', border: '1px solid #dce5dd'
            }}>
              <Box
                onClick={() => navigate('/shop/products')}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', whiteSpace: 'nowrap',
                  px: 2.5, py: 0.8, borderRadius: '24px',
                  color: isAllCategoriesActive ? '#ffffff' : '#3c4a41', 
                  bgcolor: isAllCategoriesActive ? '#006c48' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    color: isAllCategoriesActive ? '#ffffff' : '#006c48',
                    bgcolor: isAllCategoriesActive ? '#006c48' : '#e7f0e9',
                    transform: isAllCategoriesActive ? 'none' : 'translateY(-1px)'
                  }
                }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                  All Categories
                </Typography>
              </Box>
              {categories.map((category) => {
                const isHovered = hoveredCategoryId === category._id;
                const isActive = currentCategory === category._id;
                return (
                  <Box key={category._id}
                    onMouseEnter={(e) => handleCategoryHover(e, category._id, category.name)}
                    onMouseLeave={handleCategoryLeave}
                    onClick={() => handleCategoryClick(category)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', whiteSpace: 'nowrap',
                      px: 2.5, py: 0.8, borderRadius: '24px',
                      color: isActive ? '#ffffff' : (category.hasProducts === false ? '#9CA3AF' : '#3c4a41'), 
                      bgcolor: isActive ? '#006c48' : (isHovered && category.hasProducts !== false ? '#e7f0e9' : 'transparent'),
                      transform: isHovered && !isActive && category.hasProducts !== false ? 'translateY(-1px)' : 'none',
                      opacity: category.hasProducts === false ? 0.6 : 1,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { color: isActive ? '#ffffff' : (category.hasProducts === false ? '#9CA3AF' : '#006c48') }
                    }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                      {category.name}
                    </Typography>
                    {subCategories[category.name] && subCategories[category.name].length > 0 && (
                      <ExpandMore sx={{ fontSize: '0.95rem', color: isActive ? '#ffffff' : (isHovered && category.hasProducts !== false ? '#006c48' : '#999'), transform: isHovered && category.hasProducts !== false ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                    )}
                  </Box>
                );
              })}
              {categories.length === 0 && (
                ['Audio', 'Electronics', 'Home Appliances', 'Kitchen Appliances', 'Laptops', 'Smartphones'].map(name => {
                  const isHovered = hoveredCategoryId === name;
                  const isActive = currentCategory === name;
                  return (
                    <Box key={name}
                      onMouseEnter={(e) => handleCategoryHover(e, name, name)}
                      onMouseLeave={handleCategoryLeave}
                      onClick={() => navigate(`/shop/products?search=${name}`)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', whiteSpace: 'nowrap',
                        px: 2.5, py: 0.8, borderRadius: '24px',
                        color: isActive ? '#ffffff' : '#3c4a41', 
                        bgcolor: isActive ? '#006c48' : (isHovered ? '#e7f0e9' : 'transparent'),
                        transform: isHovered && !isActive ? 'translateY(-1px)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { color: isActive ? '#ffffff' : '#006c48' }
                      }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{name}</Typography>
                      {subCategories[name] && subCategories[name].length > 0 && (
                        <ExpandMore sx={{ fontSize: '0.95rem', color: isActive ? '#ffffff' : (isHovered ? '#006c48' : '#999'), transform: isHovered ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Categories Submenu Popover */}
      <Popover
        open={Boolean(categoryAnchorEl) && Boolean(subCategories[hoveredCategoryName])}
        anchorEl={categoryAnchorEl} 
        onClose={handleCategoryLeave} 
        disableScrollLock
        sx={{ 
          pointerEvents: 'none',
          '& .MuiPaper-root': { 
            pointerEvents: 'auto', 
            mt: 0.5, 
            backgroundColor: '#ffffff !important', 
            borderRadius: '12px', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
            width: 250, 
            maxHeight: 480, 
            overflow: 'hidden', 
            border: '1px solid #e8e8e8',
            fontFamily: 'Inter, sans-serif'
          }
        }}
        PaperProps={{
          onMouseEnter: handlePopoverEnter,
          onMouseLeave: handleCategoryLeave
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableRestoreFocus>
        <Box 
          onMouseLeave={handleCategoryLeave} 
          onMouseEnter={handlePopoverEnter} 
          sx={{ 
            display: 'flex', 
            backgroundColor: '#fff',
            minHeight: 180
          }}>
          
          {/* Subcategories Column */}
          <Box sx={{ flex: 1, p: 2.5 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', mb: 1.5, textTransform: 'uppercase' }}>
              Subcategories
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {hoveredCategoryName && subCategories[hoveredCategoryName] && subCategories[hoveredCategoryName].length > 0 ? (
                subCategories[hoveredCategoryName].map((item) => (
                  <Box key={item._id}
                    onClick={() => { 
                      handleCategoryClick(item); 
                      setCategoryAnchorEl(null); 
                      setHoveredCategoryName(''); 
                      setHoveredCategoryId(null); 
                    }}
                    sx={{ 
                      px: 1.5, py: 1, borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 600, color: item.hasProducts === false ? '#9CA3AF' : '#334155',
                      opacity: item.hasProducts === false ? 0.6 : 1,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: item.hasProducts === false ? 'transparent' : '#f1f5f9', color: item.hasProducts === false ? '#9CA3AF' : primaryColor }
                    }}>
                    {item.name}
                    <KeyboardArrowRight sx={{ fontSize: '1rem', opacity: 0.5 }} />
                  </Box>
                ))
              ) : (
                <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', py: 1 }}>
                  No subcategories
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* Account Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseAccountMenu}
        TransitionComponent={Fade} PaperProps={{ elevation: 3, sx: { minWidth: 200, mt: 1.5 } }}>
        {!isAuthenticated ? (
          <>
            <MenuItem onClick={() => { handleCloseAccountMenu(); navigate('/shop/login'); }}>
              <ListItemIcon><Login fontSize="small" /></ListItemIcon>Login
            </MenuItem>
            <MenuItem onClick={() => { handleCloseAccountMenu(); navigate('/shop/register'); }}>
              <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>Sign Up
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={handleDashboardClick}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>{user?.name?.charAt(0) || user?.email?.charAt(0)}</Avatar>
              {isStaffUser ? 'Admin Dashboard' : (user?.name || 'My Account')}
            </MenuItem>
            {!isStaffUser && (
              <>
                <Divider />
                <MenuItem onClick={() => { handleCloseAccountMenu(); navigate('/shop/account/orders'); }}>My Orders</MenuItem>
                <MenuItem onClick={() => { handleCloseAccountMenu(); navigate('/shop/account/wishlist'); }}>Wishlist</MenuItem>
              </>
            )}
            <Divider />
            <MenuItem onClick={() => { handleCloseAccountMenu(); handleLogout(); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>Logout
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Mobile Drawer */}
      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300, bgcolor: '#FFFFFF', border: 'none' } }}>
        {drawer}
      </Drawer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </AppBar>
  );
};

export default EcommerceHeader;
