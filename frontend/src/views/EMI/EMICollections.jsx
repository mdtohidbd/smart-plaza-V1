import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Skeleton
} from '@mui/material';
import {
  Payments as PaymentsIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  List as ListIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import EMICollectionModal from './EMICollectionModal';

const FILTERS = [
  { key: 'all',      label: 'All',       icon: <ListIcon sx={{ fontSize: 15 }} />,     color: '#0284C7', bg: '#F0F9FF', border: '#E0F2FE' },
  { key: 'upcoming', label: 'Upcoming',  icon: <ScheduleIcon sx={{ fontSize: 15 }} />, color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  { key: 'today',    label: "Today's Due", icon: <TodayIcon sx={{ fontSize: 15 }} />,    color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  { key: 'overdue',  label: 'Overdue',   icon: <WarningIcon sx={{ fontSize: 15 }} />,  color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' },
];

const getCardColors = (filter) => {
  if (filter === 'all')      return { bg: '#F0F9FF', border: '#E0F2FE', hover: '#BAE6FD', avatarBg: '#E0F2FE', avatarColor: '#0284C7' };
  if (filter === 'overdue')  return { bg: '#FEF2F2', border: '#FEE2E2', hover: '#FCA5A5', avatarBg: '#FCA5A5', avatarColor: '#7F1D1D' };
  if (filter === 'today')    return { bg: '#FFFBEB', border: '#FEF3C7', hover: '#FCD34D', avatarBg: '#FDE68A', avatarColor: '#92400E' };
  return                            { bg: '#ECFDF5', border: '#D1FAE5', hover: '#6EE7B7', avatarBg: 'rgba(16,185,129,0.15)', avatarColor: '#047857' };
};

const getChipStyle = (filter) => {
  if (filter === 'all')     return { bg: '#E0F2FE', color: '#0284C7', label: 'All' };
  if (filter === 'overdue') return { bg: '#FEE2E2', color: '#EF4444', label: 'Overdue' };
  if (filter === 'today')   return { bg: '#FEF3C7', color: '#D97706', label: 'Due Today' };
  return                           { bg: '#D1FAE5', color: '#059669', label: 'Upcoming' };
};

const EMICollections = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' for default, 'asc', 'desc'
  
  const LIMIT = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const showMessage = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/api/emi/collections/installments?filter=${filter}&page=${page}&limit=${LIMIT}&search=${searchQuery}&sort=${sortOrder}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setInstallments(res.data.data);
        setTotalRows(res.data.total || 0);
        setTotalPages(Math.ceil((res.data.total || 0) / LIMIT) || 1);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      showMessage('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInputValue) {
        setSearchQuery(searchInputValue);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInputValue, searchQuery]);

  useEffect(() => {
    fetchInstallments();
    // eslint-disable-next-line
  }, [filter, page, searchQuery, sortOrder]);

  const handleFilterChange = (key) => {
    setFilter(key);
    setPage(1);
  };

  const handleCollectClick = (inst) => {
    setSelectedInstallment(inst);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedInstallment(null);
  };

  const handleCollectionSuccess = () => {
    showMessage('Collection recorded successfully', 'success');
    fetchInstallments();
  };

  // colors and chip are now dynamically determined per item instead of globally

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            EMI Collections
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {totalRows} installment{totalRows !== 1 ? 's' : ''} · {FILTERS.find(f => f.key === filter)?.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search name or invoice..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 220 },
              '& .MuiOutlinedInput-root': {
                bgcolor: '#F8FAFC',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#0F766E' },
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              displayEmpty
              sx={{
                bgcolor: '#F8FAFC',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0F766E' },
              }}
            >
              <MenuItem value="">Default Sort</MenuItem>
              <MenuItem value="asc">Date (Ascending)</MenuItem>
              <MenuItem value="desc">Date (Descending)</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchInstallments} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', p: 1, bgcolor: '#FFFFFF' }}>
              <RefreshIcon sx={{ fontSize: 20, color: '#64748B' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Filter Pills ── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Chip
              key={f.key}
              icon={f.icon}
              label={f.label}
              onClick={() => handleFilterChange(f.key)}
              sx={{
                px: 1.5,
                py: 2.5,
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                borderRadius: '50px',
                cursor: 'pointer',
                border: '1.5px solid',
                borderColor: active ? f.border : '#E2E8F0',
                bgcolor: active ? f.bg : '#FFFFFF',
                color: active ? f.color : '#64748B',
                transition: 'all 0.2s',
                '& .MuiChip-icon': { color: active ? f.color : '#94A3B8' },
                '&:hover': { borderColor: f.border, bgcolor: f.bg, color: f.color, '& .MuiChip-icon': { color: f.color } },
              }}
            />
          );
        })}
      </Box>

      {/* ── Content ── */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3].map((item) => (
              <Box
                key={item}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: '16px',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                  <Skeleton variant="circular" width={46} height={46} />
                  <Box sx={{ flexGrow: 1, maxWidth: 200 }}>
                    <Skeleton variant="text" width="90%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ml: 'auto' }}>
                  <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                    <Skeleton variant="text" width="80%" height={24} sx={{ ml: 'auto' }} />
                    <Skeleton variant="text" width="60%" height={16} sx={{ ml: 'auto' }} />
                  </Box>
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '10px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : installments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }}>
              No installments found for this filter.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(() => {
              const sortedInstallments = searchQuery.trim() ? [...installments].sort((a, b) => {
                const term = searchQuery.toLowerCase();
                const aStarts = (a.invoiceNumber || '').toLowerCase().startsWith(term) ||
                                (a.customerName || '').toLowerCase().startsWith(term) ||
                                (a.customerPhone || '').startsWith(term);
                const bStarts = (b.invoiceNumber || '').toLowerCase().startsWith(term) ||
                                (b.customerName || '').toLowerCase().startsWith(term) ||
                                (b.customerPhone || '').startsWith(term);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
              }) : installments;
              
              return sortedInstallments.map((inst, idx) => {
              const remaining = inst.amount - (inst.paidAmount || 0);
              const initials = inst.customerName
                ? inst.customerName.split(' ').map(n => n?.[0] ?? '').join('').slice(0, 2)
                : '?';
                
              let itemType = filter;
              if (filter === 'all' && inst.dueDate) {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (dueDate.getTime() === today.getTime()) {
                  itemType = 'today';
                } else if (dueDate < today) {
                  itemType = 'overdue';
                } else {
                  itemType = 'upcoming';
                }
              }

              const colors = getCardColors(itemType);
              const chip = getChipStyle(itemType);

              const chipStyle = inst.status === 'partially_paid'
                ? { bg: '#EFF6FF', color: '#3B82F6', label: 'Partial' }
                : chip;

              return (
                <Box
                  key={`${inst.invoice}-${inst.instalmentNumber}-${idx}`}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: '16px',
                    bgcolor: colors.bg,
                    border: '1px solid',
                    borderColor: colors.border,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: colors.hover, transform: 'scale(1.003)', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
                  }}
                >
                  {/* Left: Avatar + Customer Info */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 46, height: 46, flexShrink: 0,
                        bgcolor: colors.avatarBg, color: colors.avatarColor,
                        fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: '#0F172A', fontWeight: 700, fontSize: '0.975rem',
                          fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                          '&:hover': { color: '#0F766E', textDecoration: 'underline' },
                        }}
                        onClick={() => navigate(`/dashboard/emi/invoice/${inst.invoice}`)}
                      >
                        {inst.customerName}
                        <Typography component="span" sx={{ ml: 1, color: '#64748B', fontWeight: 500, fontSize: '0.8rem' }}>
                          #{inst.invoiceNumber}
                        </Typography>
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: '#64748B', fontSize: '0.825rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                          {inst.customerPhone || 'N/A'}
                        </Typography>
                        {inst.customerPhone && (
                          <Tooltip title={copiedId === `ph-${idx}` ? 'Copied!' : 'Copy'}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(inst.customerPhone, `ph-${idx}`)}
                              sx={{ p: 0.25, color: copiedId === `ph-${idx}` ? '#10B981' : '#94A3B8', '&:hover': { color: '#64748B' } }}
                            >
                              {copiedId === `ph-${idx}` ? <CheckIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                            </IconButton>
                          </Tooltip>
                        )}
                        {filter === 'overdue' && inst.daysOverdue != null && (
                          <Chip
                            label={`${inst.daysOverdue}d overdue`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#FEE2E2', color: '#EF4444', borderRadius: '6px' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Right: Amount + Due Info + Actions */}
                  <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: 'center', flexWrap: 'wrap', ml: 'auto' }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>
                        ৳{remaining.toLocaleString()}
                      </Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.74rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        Due: {inst.dueDate ? format(new Date(inst.dueDate), 'dd MMM') : 'N/A'} · Inst. #{inst.instalmentNumber}
                      </Typography>
                      {inst.paidAmount > 0 && (
                        <Typography sx={{ color: '#10B981', fontSize: '0.72rem', fontWeight: 600 }}>
                          Paid: ৳{inst.paidAmount.toLocaleString()}
                        </Typography>
                      )}
                    </Box>

                    <Chip
                      label={chipStyle.label}
                      size="small"
                      sx={{
                        bgcolor: chipStyle.bg, color: chipStyle.color,
                        fontWeight: 700, borderRadius: '8px', px: 1.5, py: 1.75,
                        fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                      }}
                    />

                    <Tooltip title="Record Collection">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PaymentsIcon sx={{ fontSize: 15 }} />}
                        onClick={() => handleCollectClick(inst)}
                        sx={{
                          textTransform: 'none', borderRadius: '10px', px: 2, py: 0.8,
                          fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                          bgcolor: '#0F766E', boxShadow: '0 3px 10px rgba(15,118,110,0.25)',
                          '&:hover': { bgcolor: '#0D9488', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' },
                        }}
                      >
                        Collect
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>
              );
            });
            })()}
          </Box>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              color="primary"
              sx={{ '& .MuiPaginationItem-root': { fontFamily: 'Inter, sans-serif', fontWeight: 600 } }}
            />
          </Box>
        )}
      </Paper>

      {/* Collection Modal */}
      {modalOpen && selectedInstallment && (
        <EMICollectionModal
          open={modalOpen}
          onClose={handleModalClose}
          installment={selectedInstallment}
          onSuccess={handleCollectionSuccess}
        />
      )}

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EMICollections;
