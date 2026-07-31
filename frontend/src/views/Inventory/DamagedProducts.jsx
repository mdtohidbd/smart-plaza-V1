import React, { useState } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress, Chip, Divider,
  useTheme, useMediaQuery
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import ExportButtons from '../../components/ExportButtons';

const fieldSx = {
  '& .MuiInputBase-root': { fontSize: '0.82rem', height: '36px' },
  '& .MuiInputLabel-root': { fontSize: '0.8rem' },
  '& .MuiInputLabel-shrink': { fontSize: '0.8rem' },
};

const DamagedProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    product: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    reason: '',
    note: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data: inventoryData } = useQuery(
    'inventory-current',
    async () => { const r = await api.get('/api/inventory/current'); return r.data.data; },
    { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  );

  const products = inventoryData?.map(item => ({
    _id: item.product._id,
    name: item.product.name,
    model: item.product?.model || 'N/A',
    currentQuantity: item.currentQuantity || 0,
  })) || [];

  const { data: damagedProducts, isLoading: isLoadingDamaged } = useQuery(
    'damagedProducts',
    async () => { const r = await api.get('/api/inventory/damaged'); return r.data.data; }
  );

  const recordDamagedMutation = useMutation(
    (data) => api.post('/api/inventory/damaged', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('damagedProducts');
        queryClient.invalidateQueries('inventory');
        queryClient.invalidateQueries('inventory-current');
        setFormData({ product: '', quantity: 1, date: new Date().toISOString().split('T')[0], reason: '', note: '' });
        setSuccess('Recorded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (err) => {
        setError(err.response?.data?.message || err.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity || formData.quantity <= 0) {
      setError('Product and quantity are required.'); return;
    }
    const sel = products.find(p => p._id === formData.product);
    if (sel) {
      if (sel.currentQuantity <= 0) { setError(`"${sel.name}" is out of stock.`); return; }
      if (formData.quantity > sel.currentQuantity) {
        setError(`Only ${sel.currentQuantity} available — cannot damage ${formData.quantity}.`); return;
      }
    }
    recordDamagedMutation.mutate(formData);
  };

  const totalQty = damagedProducts?.reduce((s, i) => s + Math.abs(i.quantity), 0) || 0;
  const totalRecords = damagedProducts?.length || 0;

  const columns = [
    { label: 'Product Name', accessor: (row) => row.product?.name || 'N/A' },
    { label: 'Model', accessor: (row) => row.product?.model || '—' },
    { label: 'Quantity', accessor: (row) => Math.abs(row.quantity) },
    { label: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
    { label: 'Reason / Note', accessor: (row) => row.note || '—' }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>

        {/* ── Header bar ── */}
        <Box sx={{
          px: 2, py: 1.1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #fff8f5 0%, #fff 100%)',
          flexWrap: 'wrap', gap: 1,
        }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#E57141', fontFamily: '"Outfit", sans-serif' }}>
            Damaged Products
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <ExportButtons 
              data={damagedProducts || []} 
              columns={columns} 
              filename="damaged_products" 
              title="Damaged Products Report" 
            />
            <Chip label={`${totalRecords} Records`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, backgroundColor: '#fff3e0', color: '#e65100', border: '1px solid #ffccbc' }} />
            <Chip label={`${totalQty} Total Qty`} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} />
          </Box>
        </Box>

        {/* ── Alerts ── */}
        {(error || success) && (
          <Box sx={{ px: 2, pt: 1 }}>
            {error && <Alert severity="error" sx={{ py: 0.25, fontSize: '0.78rem', mb: 0.5 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ py: 0.25, fontSize: '0.78rem', mb: 0.5 }} onClose={() => setSuccess('')}>{success}</Alert>}
          </Box>
        )}

        {/* ── Form ── */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Record Damaged Item
          </Typography>
          <Grid container spacing={1}>
            {/* Product */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" sx={fieldSx} required>
                <InputLabel>Product *</InputLabel>
                <Select name="product" value={formData.product} onChange={handleChange} label="Product *">
                  {products.map((p) => {
                    const qty = p.currentQuantity;
                    const out = qty <= 0;
                    const low = qty > 0 && qty <= 10;
                    return (
                      <MenuItem key={p._id} value={p._id} disabled={out} sx={{ fontSize: '0.8rem', color: out ? '#999' : 'inherit' }}>
                        {p.name} {p.model ? `(${p.model})` : ''} —{' '}
                        <span style={{ color: out ? '#dc2626' : low ? '#d97706' : '#16a34a', fontWeight: 600, marginLeft: 4 }}>
                          {out ? 'Out of Stock' : `${qty} avail.`}
                        </span>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" label="Quantity *" type="number" name="quantity"
                value={formData.quantity} onChange={handleChange} inputProps={{ min: 1 }} sx={fieldSx} />
            </Grid>

            {/* Date */}
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" label="Date *" type="date" name="date"
                value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>

            {/* Reason */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Reason for Damage *" name="reason"
                value={formData.reason} onChange={handleChange} sx={fieldSx} />
            </Grid>

            {/* Note + Submit on same row */}
            <Grid item xs={12} sm={9}>
              <TextField fullWidth size="small" label="Note (optional)" name="note"
                value={formData.note} onChange={handleChange} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth variant="contained" size="small"
                onClick={handleSubmit}
                disabled={recordDamagedMutation.isLoading}
                sx={{
                  height: '36px', fontSize: '0.78rem', fontWeight: 700,
                  textTransform: 'none', borderRadius: '7px',
                  backgroundColor: '#E57141',
                  '&:hover': { backgroundColor: '#c9603a' },
                }}
              >
                {recordDamagedMutation.isLoading
                  ? <><CircularProgress size={14} sx={{ mr: 0.75, color: '#fff' }} />Recording…</>
                  : 'Record Damage'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* ── Records List ── */}
        {isLoadingDamaged ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : isMobile ? (
          /* ============ MOBILE CARD VIEW ============ */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
            {(!damagedProducts || damagedProducts.length === 0) ? (
              <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  No damaged products recorded yet.
                </Typography>
              </Paper>
            ) : (
              damagedProducts.map((item) => {
                const rawNote = item.note || '';
                const reasonMatch = rawNote.match(/^Damage:\s*(.*?)\s*-\s*(.*)$/s);
                const displayReason = reasonMatch ? reasonMatch[1] || '—' : rawNote;
                const displayNote = reasonMatch ? reasonMatch[2]?.trim() || '' : '';

                return (
                  <Paper
                    key={item._id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    {/* Header: Product Name + Quantity */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', fontFamily: '"Outfit", sans-serif' }}>
                        {item.product?.name || 'N/A'}
                      </Typography>
                      <span style={{
                        fontSize: '12px',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontWeight: 700,
                        border: '1px solid #fecaca',
                        fontFamily: '"Outfit", sans-serif'
                      }}>
                        Qty: {Math.abs(item.quantity)}
                      </span>
                    </Box>

                    {/* Info Row: SKU + Date */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        fontWeight: 600,
                        border: '1px solid #e0f2fe',
                        fontFamily: 'monospace'
                      }}>
                        {item.product?.model || '—'}
                      </span>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                        {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </Typography>
                    </Box>

                    {/* Reason */}
                    {displayReason && (
                      <Box sx={{ p: 1.25, backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                        <Typography variant="caption" sx={{ color: '#92400e', display: 'block', mb: 0.25, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Outfit", sans-serif' }}>
                          Reason
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.8rem', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                          {displayReason}
                        </Typography>
                        {displayNote && (
                          <Typography variant="caption" sx={{ color: '#a16207', fontSize: '0.72rem', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                            Note: {displayNote}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })
            )}
          </Box>
        ) : (
          /* ============ DESKTOP TABLE VIEW ============ */
          <TableContainer>
            <Table size="small" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  {['Product', 'Model', 'Qty', 'Date', 'Reason / Note'].map(col => (
                    <TableCell key={col} sx={{
                      fontSize: '0.68rem', fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      py: 0.75, px: 1.5, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(!damagedProducts || damagedProducts.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#94a3b8', fontSize: '0.8rem' }}>
                      No damaged products recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  damagedProducts.map((item) => {
                    const rawNote = item.note || '';
                    const reasonMatch = rawNote.match(/^Damage:\s*(.*?)\s*-\s*(.*)$/s);
                    const displayReason = reasonMatch ? reasonMatch[1] || '—' : rawNote;
                    const displayNote = reasonMatch ? reasonMatch[2]?.trim() || '' : '';

                    return (
                      <TableRow key={item._id} sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                        '&:hover': { backgroundColor: '#fff5f2' },
                        '& .MuiTableCell-root': { py: 0.55, px: 1.5, fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
                      }}>
                        <TableCell sx={{ fontWeight: 500, color: '#1e293b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product?.name || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.73rem !important' }}>
                          {item.product?.model || '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#dc2626' }}>
                          {Math.abs(item.quantity)}
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>
                          {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </TableCell>
                        <TableCell sx={{ color: '#475569', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 500 }}>{displayReason}</span>
                          {displayNote && <span style={{ color: '#94a3b8', marginLeft: 4 }}>— {displayNote}</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default DamagedProducts;