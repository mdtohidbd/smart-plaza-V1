import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Alert,
} from '@mui/material';
import { Check as ApproveIcon, Close as RejectIcon, Payments } from '@mui/icons-material';
import api from '../../utils/api';
import { format } from 'date-fns';
import {
  InvestorPage, PageHeader, SectionCard, EmptyState, LoadingState,
  colors, formatCurrency, btnSx, tableHeadSx,
} from './investorUi';

const statusColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Pending') return 'warning';
  return 'error';
};

const WithdrawalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/investors/withdrawals');
      setRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching withdrawal requests:', err);
      setError('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (investorId, reqId, action) => {
    if (!investorId) {
      setError('Missing investor reference for this request');
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.put(`/api/investors/withdraw/${investorId}/${reqId}`, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
      });
      setSuccess(`Request ${action}d successfully`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  if (loading) return <InvestorPage><LoadingState label="Loading withdrawal requests…" /></InvestorPage>;

  return (
    <InvestorPage maxWidth={1200}>
      <PageHeader
        icon={<Payments sx={{ fontSize: 20 }} />}
        title="Withdrawal Requests"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} awaiting review`
            : 'Manage and approve investor withdrawal requests'
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <SectionCard bodySx={{ p: 0 }}>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Investor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right" width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState message="No withdrawal requests found." icon={<Payments />} />
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req._id} hover sx={{ '& td': { py: 1.25, fontSize: '0.8125rem', borderColor: colors.borderLight } }}>
                    <TableCell sx={{ color: colors.textSecondary }}>
                      {req.requestDate ? format(new Date(req.requestDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: colors.text }}>{req.investor?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={req.type}
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          borderColor: req.type === 'Profit' ? '#A7F3D0' : colors.border,
                          color: req.type === 'Profit' ? colors.success : colors.info,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: colors.text }}>{formatCurrency(req.amount)}</TableCell>
                    <TableCell sx={{ color: colors.textMuted, fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.note || '—'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={req.status}
                        color={statusColor(req.status)}
                        sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {req.status === 'Pending' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                          <Tooltip title="Approve">
                            <IconButton size="small" sx={{ color: colors.success }} onClick={() => handleAction(req.investor?._id, req._id, 'approve')}>
                              <ApproveIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleAction(req.investor?._id, req._id, 'reject')}>
                              <RejectIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1.5 }}>
          {requests.length === 0 ? (
            <EmptyState message="No withdrawal requests found." icon={<Payments />} />
          ) : (
            requests.map((req) => (
              <Box key={req._id} sx={{ p: 1.5, border: `1px solid ${colors.borderLight}`, borderRadius: '8px', bgcolor: colors.bg }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: colors.text }}>{req.investor?.name || 'Unknown'}</Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.textMuted }}>
                      {req.requestDate ? format(new Date(req.requestDate), 'dd MMM yyyy') : '-'}
                    </Typography>
                  </Box>
                  <Chip size="small" label={req.status} color={statusColor(req.status)} sx={{ height: 22, fontSize: '0.6875rem' }} />
                </Box>
                <Grid container spacing={1} sx={{ mb: req.status === 'Pending' ? 1.5 : 0 }}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Type</Typography>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{req.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Amount</Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.text }}>{formatCurrency(req.amount)}</Typography>
                  </Grid>
                  {req.note && (
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, fontStyle: 'italic' }}>{req.note}</Typography>
                    </Grid>
                  )}
                </Grid>
                {req.status === 'Pending' && (
                  <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: `1px solid ${colors.borderLight}` }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ApproveIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleAction(req.investor?._id, req._id, 'approve')}
                      sx={{ ...btnSx, flex: 1, bgcolor: colors.success, '&:hover': { bgcolor: '#047857' } }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RejectIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleAction(req.investor?._id, req._id, 'reject')}
                      sx={{ ...btnSx, flex: 1, borderColor: colors.error, color: colors.error }}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      </SectionCard>
    </InvestorPage>
  );
};

export default WithdrawalRequests;
