import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Avatar, 
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { 
  OpenInNew as OpenInNewIcon, 
  CreditCard as CreditCardIcon, 
  Timer as TimerIcon, 
  Error as ErrorIcon, 
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PREVIEW_LIMIT = 3;

/* ── Skeleton shimmer for a single payment card ── */
const PaymentCardSkeleton = () => (
  <Box sx={{
    p: 2.5,
    borderRadius: '16px',
    bgcolor: '#F8FAFC',
    border: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 2,
  }}>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
      <Skeleton variant="circular" width={46} height={46} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="55%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="35%" height={16} />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Box sx={{ textAlign: 'right' }}>
        <Skeleton variant="text" width={70} height={24} />
        <Skeleton variant="text" width={90} height={16} />
      </Box>
      <Skeleton variant="rounded" width={72} height={28} sx={{ borderRadius: '8px' }} />
    </Box>
  </Box>
);

/* ── Skeleton for the stats row ── */
const StatCardSkeleton = () => (
  <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#FFFFFF', border: '1px solid #F1F5F9', display: 'flex', gap: 2, alignItems: 'center' }}>
    <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" height={14} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="45%" height={22} />
    </Box>
  </Box>
);

const EMICollectionOverview = ({ dashboardData, isLoading }) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);

  const emiStats = dashboardData?.emiStats || { totalOutstanding: 0, dueThisWeek: 0, dueToday: 0, overdue: 0, collectedToday: 0 };
  const payments = dashboardData?.upcomingEMIs || [];

  const isToday = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const getPaymentStatus = (payment) => {
    if (payment.status === 'overdue') return 'overdue';
    
    const dueDate = new Date(payment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'due_today';
    if (payment.daysUntilDue <= 5) return 'due_soon';
    return 'upcoming';
  };

  const visiblePayments = payments.slice(0, PREVIEW_LIMIT);
  const hasMore = payments.length > PREVIEW_LIMIT;
  
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statItems = [
    { label: 'Total Outstanding', value: emiStats.totalOutstanding, color: '#6366F1', icon: <CreditCardIcon /> },
    { label: 'Due Today',         value: emiStats.dueToday || 0,    color: '#F59E0B', icon: <TimerIcon /> },
    { label: 'Overdue',           value: emiStats.overdue,           color: '#EF4444', icon: <ErrorIcon /> },
    { label: 'Collected Today',   value: emiStats.collectedToday,    color: '#10B981', icon: <CheckCircleIcon /> },
  ];

  return (
    <Paper sx={{ p: 4, mb: 3.5, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            EMI Collection Overview
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            Outstanding and upcoming payments
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/dashboard/emi/sales')}
          sx={{
            bgcolor: '#F0FDFA',
            color: '#0F766E',
            border: '1px solid #99F6E4',
            borderRadius: '12px',
            px: 2.5,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: '#14B8A6',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
              borderColor: '#14B8A6',
            },
          }}
        >
          View All EMI Sales <OpenInNewIcon sx={{ ml: 1, fontSize: 16 }} />
        </Button>
      </Box>

      {/* ── EMI Summary Stats ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {isLoading
          ? [0, 1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))
          : statItems.map((stat, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Box sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.015)',
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 20px rgba(15, 23, 42, 0.04)',
                    borderColor: `${stat.color}30`,
                  },
                }}>
                  <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: `${stat.color}10`, color: stat.color, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>
                      ৳{stat.value.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))
        }
      </Grid>

      {/* ── Payments List ── */}
      <Typography sx={{ color: '#0F172A', fontWeight: 700, fontSize: '1rem', mb: 2, fontFamily: 'Outfit, sans-serif' }}>
        Upcoming &amp; Overdue Payments
      </Typography>

      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {isLoading ? (
            /* Skeleton cards */
            [0, 1, 2].map((i) => <PaymentCardSkeleton key={i} />)
          ) : visiblePayments.length > 0 ? (
            visiblePayments.map((payment, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    backgroundColor: getPaymentStatus(payment) === 'overdue' ? '#FEF2F2' : getPaymentStatus(payment) === 'due_today' ? '#FFFBEB' : getPaymentStatus(payment) === 'due_soon' ? '#F8FAFC' : '#ECFDF5',
                    border: '1px solid',
                    borderColor: getPaymentStatus(payment) === 'overdue' ? '#FEE2E2' : getPaymentStatus(payment) === 'due_today' ? '#FEF3C7' : getPaymentStatus(payment) === 'due_soon' ? '#E2E8F0' : '#D1FAE5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: getPaymentStatus(payment) === 'overdue' ? '#FCA5A5' : getPaymentStatus(payment) === 'due_today' ? '#FCD34D' : getPaymentStatus(payment) === 'due_soon' ? '#CBD5E1' : '#6EE7B7',
                      transform: 'scale(1.005)',
                    },
                  }}
                >
                  {/* Left */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                    <Avatar sx={{
                      width: 46, height: 46,
                      bgcolor: getPaymentStatus(payment) === 'overdue' ? '#FCA5A5' : getPaymentStatus(payment) === 'due_today' ? '#FDE68A' : getPaymentStatus(payment) === 'due_soon' ? '#E2E8F0' : 'rgba(16,185,129,0.15)',
                      color: getPaymentStatus(payment) === 'overdue' ? '#7F1D1D' : getPaymentStatus(payment) === 'due_today' ? '#92400E' : getPaymentStatus(payment) === 'due_soon' ? '#475569' : '#047857',
                      fontWeight: 700, fontSize: '0.95rem',
                    }}>
                    {payment.customerName ? payment.customerName.split(' ').map(n => n ? n[0] : '').join('') : '?'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ color: '#0F172A', fontWeight: 700, fontSize: '0.975rem', fontFamily: 'Outfit, sans-serif' }}>
                      {payment.customerName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.825rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        {payment.contactNumber || 'N/A'}
                      </Typography>
                      {payment.contactNumber && (
                        <Tooltip title={copiedId === `contact-${idx}` ? 'Copied!' : 'Copy Contact'}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(payment.contactNumber, `contact-${idx}`)}
                            sx={{ p: 0.25, color: copiedId === `contact-${idx}` ? '#10B981' : '#94A3B8', '&:hover': { color: '#64748B', bgcolor: '#F1F5F9' } }}
                          >
                            {copiedId === `contact-${idx}` ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Right */}
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'space-between', width: { xs: '100%', sm: 'auto' } }}>
                  <Box>
                    <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                      ৳{payment.amount.toLocaleString()}
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                      Due: {new Date(payment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • Inst. {payment.instalmentNumber}/{payment.totalInstalments}
                    </Typography>
                  </Box>
                    <Chip
                      label={getPaymentStatus(payment) === 'overdue' ? 'Overdue' : getPaymentStatus(payment) === 'due_today' ? 'Due Today' : getPaymentStatus(payment) === 'due_soon' ? 'Due Soon' : 'Upcoming'}
                      size="small"
                      sx={{
                        bgcolor: getPaymentStatus(payment) === 'overdue' ? '#FEE2E2' : getPaymentStatus(payment) === 'due_today' ? '#FEF3C7' : getPaymentStatus(payment) === 'due_soon' ? '#F1F5F9' : '#D1FAE5',
                        color: getPaymentStatus(payment) === 'overdue' ? '#EF4444' : getPaymentStatus(payment) === 'due_today' ? '#D97706' : getPaymentStatus(payment) === 'due_soon' ? '#64748B' : '#059669',
                        fontWeight: 700, borderRadius: '8px', px: 1.5, py: 1.75, fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </Box>
                </Box>
            ))
          ) : (
            <Typography sx={{ color: '#94A3B8', textAlign: 'center', py: 4, fontFamily: 'Inter, sans-serif' }}>
              No pending payments
            </Typography>
          )}
        </Box>

        {/* ── Blur overlay + See All button (when more than 3) ── */}
        {!isLoading && hasMore && (
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.97) 100%)',
            backdropFilter: 'blur(1.5px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pb: 1,
            borderRadius: '0 0 16px 16px',
          }}>
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              onClick={() => navigate('/dashboard/emi/collections')}
              sx={{
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                borderRadius: '50px',
                px: 3,
                py: 1,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 16px rgba(15,118,110,0.3)',
                '&:hover': {
                  bgcolor: '#0D9488',
                  boxShadow: '0 6px 20px rgba(13,148,136,0.35)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s',
              }}
            >
              See All Collections ({payments.length})
            </Button>
          </Box>
        )}
      </Box>

    </Paper>
  );
};

export default EMICollectionOverview;
