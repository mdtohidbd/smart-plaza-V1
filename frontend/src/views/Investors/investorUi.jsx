import React from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, alpha, Skeleton } from '@mui/material';

export const colors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#0F766E',
  accentSoft: '#CCFBF1',
  success: '#059669',
  successSoft: '#ECFDF5',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  warning: '#D97706',
  info: '#0284C7',
};

export const formatCurrency = (amount) =>
  `৳${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatCompact = (amount) => {
  const val = amount || 0;
  if (Math.abs(val) >= 1000) return `${val >= 0 ? '+' : ''}${(val / 1000).toFixed(1)}k`;
  return `${val >= 0 ? '+' : ''}${formatCurrency(val)}`;
};

export const cardSx = {
  bgcolor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  boxShadow: 'none',
};

export const cardProps = { elevation: 0, sx: cardSx };

export const tableHeadSx = {
  bgcolor: colors.bg,
  '& .MuiTableCell-head': {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    py: 1.25,
    borderBottom: `1px solid ${colors.border}`,
  },
};

export const InvestorPage = ({ children, maxWidth = 1440 }) => (
  <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, maxWidth, mx: 'auto', width: '100%' }}>
    {children}
  </Box>
);

export const PageHeader = ({ title, subtitle, action, icon }) => (
  <Box
    sx={{
      mb: 2.5,
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'stretch', sm: 'flex-start' },
      gap: 2,
    }}
  >
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
      {icon && (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: colors.accentSoft,
            color: colors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{ fontSize: { xs: '1.25rem', sm: '1.375rem' }, fontWeight: 700, color: colors.text, lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.8125rem', color: colors.textSecondary, mt: 0.25, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

export const StatCard = ({ label, value, icon, tone = 'neutral', compact = false, isLoading = false }) => {
  const toneMap = {
    neutral: { iconBg: colors.bg, iconColor: colors.textSecondary },
    accent: { iconBg: colors.accentSoft, iconColor: colors.accent },
    success: { iconBg: colors.successSoft, iconColor: colors.success },
    error: { iconBg: colors.errorSoft, iconColor: colors.error },
    info: { iconBg: alpha(colors.info, 0.1), iconColor: colors.info },
  };
  const t = toneMap[tone] || toneMap.neutral;

  return (
    <Paper sx={{ ...cardSx, p: compact ? 1.75 : 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '9px',
              bgcolor: t.iconBg,
              color: t.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& svg': { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.3,
              mb: 0.25,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? '1rem' : '1.125rem',
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? (
              <Skeleton variant="text" width="60%" sx={{ fontSize: compact ? '1rem' : '1.125rem' }} />
            ) : (
              value
            )}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const StatGrid = ({ items, spacing = 1.5, compact = false, isLoading = false }) => (
  <Grid container spacing={spacing} sx={{ mb: 2.5 }}>
    {items.map((item, i) => (
      <Grid item xs={6} md={3} key={item.key || i}>
        <StatCard {...item} compact={compact} isLoading={isLoading || item.isLoading} />
      </Grid>
    ))}
  </Grid>
);

export const SectionCard = ({ title, action, children, sx = {}, bodySx = {} }) => (
  <Paper sx={{ ...cardSx, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
    {(title || action) && (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${colors.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        {title && (
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>{title}</Typography>
        )}
        {action}
      </Box>
    )}
    <Box sx={{ p: 2, flex: 1, minHeight: 0, ...bodySx }}>{children}</Box>
  </Paper>
);

export const EmptyState = ({ message, icon }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      color: colors.textMuted,
      gap: 1,
    }}
  >
    {icon && <Box sx={{ opacity: 0.4, '& svg': { fontSize: 32 } }}>{icon}</Box>}
    <Typography sx={{ fontSize: '0.8125rem' }}>{message}</Typography>
  </Box>
);

export const LoadingState = ({ label = 'Loading…' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 1.5 }}>
    <CircularProgress size={32} thickness={3} sx={{ color: colors.accent }} />
    <Typography sx={{ fontSize: '0.8125rem', color: colors.textSecondary }}>{label}</Typography>
  </Box>
);

export const btnSx = {
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8125rem',
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none' },
};
