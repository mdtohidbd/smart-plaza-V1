import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import { 
  Tv, AcUnit, Kitchen, Iron, Wash, KitchenOutlined,
  Microwave, SpeakerGroup, KitchenTwoTone, Computer, Smartphone, ChevronRight,
  Checkroom, Chair, Watch, Headphones, Cable, Print, CameraAlt
} from '@mui/icons-material';

// Category icons mapping
const CATEGORY_ICONS = {
  'Computer': <Computer />,
  'Smartphone': <Smartphone />,
  'Television': <Tv />,
  'Air Conditioner': <AcUnit />,
  'Refrigerator': <Kitchen />,
  'Deep Freezer': <KitchenTwoTone />,
  'Washing Machine': <Wash />,
  'Microwave': <Microwave />,
  'Small Appliances': <Iron />,
  'Air Fryer': <KitchenOutlined />,
  'Audio & Speaker': <SpeakerGroup />,
  'Headphones': <Headphones />,
  'Smartwatch': <Watch />,
  'Clothing': <Checkroom />,
  'Furniture': <Chair />,
  'Accessories': <Cable />,
  'Printer': <Print />,
  'Camera': <CameraAlt />
};

const CATEGORY_COLORS = [
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CategoryCard = ({ category, index = 0, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const imgSrc = category.image || (category.images?.[0]) || null;
  const hasValidImage = !!imgSrc && !imageError;
  const hasProducts = category.hasProducts !== false;
  
  const iconElement = (category.icon && CATEGORY_ICONS[category.icon]) 
    ? CATEGORY_ICONS[category.icon] 
    : <Computer />;

  const baseColor = hasProducts ? CATEGORY_COLORS[index % CATEGORY_COLORS.length] : '#9CA3AF';

  return (
    <Box
      onClick={hasProducts ? onClick : undefined}
      onMouseEnter={() => hasProducts && setHovered(true)}
      onMouseLeave={() => hasProducts && setHovered(false)}
      sx={{
        cursor: hasProducts ? 'pointer' : 'default',
        opacity: hasProducts ? 1 : 0.6,
        textAlign: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#FFFFFF',
        borderRadius: { xs: '12px', md: '16px' },
        border: '1px solid #E2E8F0',
        p: { xs: 1.5, sm: 2, md: 2.5 },
        boxShadow: hovered 
          ? `0 8px 24px -8px ${hexToRgba(baseColor, 0.2)}` 
          : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        '&:active': hasProducts ? { transform: 'translateY(-2px)' } : {},
        pointerEvents: hasProducts ? 'auto' : 'none',
      }}
    >
      {/* Icon / Image area */}
      <Box sx={{
        width: { xs: 50, sm: 70, md: 80 },
        height: { xs: 50, sm: 70, md: 80 },
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'visible', mb: { xs: 1, md: 2 },
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {hasValidImage ? (
          <Box component="img" src={imgSrc} alt={category.name}
            sx={{
              width: '100%', height: '100%', objectFit: 'contain',
              filter: hovered ? `brightness(1.1) drop-shadow(0 8px 12px ${hexToRgba(baseColor, 0.3)})` : (hasProducts ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' : 'grayscale(100%) opacity(70%)'),
              transition: 'all 0.4s ease',
              transform: hovered ? 'scale(1.08) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Box sx={{ 
            width: '100%', height: '100%', 
            borderRadius: '50%',
            background: baseColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: `0 8px 16px -4px ${hexToRgba(baseColor, 0.5)}`,
            '& svg': { 
               fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.2rem' },
               transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
               transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)'
            },
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {iconElement}
          </Box>
        )}
      </Box>

      {/* Text */}
      <Typography sx={{
        fontFamily: 'Outfit, sans-serif', fontWeight: 800,
        fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
        color: '#0F172A',
        transition: 'color 0.3s ease',
        textAlign: 'center', lineHeight: 1.2,
        maxWidth: '100%',
        letterSpacing: '0.02em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {category.name}
      </Typography>
    </Box>
  );
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getPublicApiBase()}/categories`);
      const parentCategories = response.data.data.filter(cat => !cat.parent);
      setCategories(parentCategories.slice(0, 8));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && categories.length === 0) return null;

  return (
    <Box sx={{ 
      py: { xs: 3, md: 6 }, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      position: 'relative',
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, #14B8A6, transparent)', opacity: 0.3
      }
    }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 2.5, md: 4 }, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              color: '#14B8A6', letterSpacing: '0.15em', textTransform: 'uppercase', mb: 0.5,
            }}>Browse</Typography>
            <Typography sx={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: { xs: '1.25rem', md: '2rem' }, color: '#0F172A',
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>Featured Categories</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: '#14B8A6' }} />
              <Box sx={{ width: 8, height: 2, bgcolor: '#475569' }} />
            </Box>
          </Box>
          <Box onClick={() => navigate('/shop/products')} sx={{
            display: 'flex', alignItems: 'center', gap: 0.5, color: '#14B8A6',
            fontSize: { xs: '0.78rem', md: '0.85rem' }, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', borderBottom: '1px solid transparent',
            '&:hover': { borderBottomColor: '#14B8A6', gap: 1 }, transition: 'all 0.3s ease',
          }}>
            View All <ChevronRight sx={{ fontSize: '1rem' }} />
          </Box>
        </Box>

        {/* Categories Grid — mobile: 4 columns, like Electronics BD */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(4, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(8, 1fr)',
          },
          gap: { xs: 1, sm: 1.5, md: 2 },
        }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  bgcolor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', p: { xs: 1.5, md: 2.5 },
                }}>
                  <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: '10px', bgcolor: '#F1F5F9' }} />
                  <Skeleton width={50} height={14} sx={{ bgcolor: '#F1F5F9', borderRadius: '4px' }} />
                </Box>
              ))
            : categories.map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index}
                  onClick={() => navigate(`/shop/products?category=${category._id}`)} />
              ))
          }
        </Box>
      </Container>
    </Box>
  );
};

export default Categories;
