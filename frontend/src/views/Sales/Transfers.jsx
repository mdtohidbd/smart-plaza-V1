import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Autocomplete, InputAdornment, Grid,
  Divider, Card
} from '@mui/material';
import { Add as AddIcon, AssignmentReturn as ReturnIcon, Search as SearchIcon, Print as PrintIcon, Delete as DeleteIcon, AddCircle as AddCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import TransferInvoiceModal from '../../components/TransferInvoiceModal';
import ExportButtons from '../../components/ExportButtons';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnDate, setReturnDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // Success Modal State
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [completedTransfer, setCompletedTransfer] = useState(null);

  const navigate = useNavigate();
  const { currentShop } = useAuth();

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
  }, [currentShop]);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/api/transfers');
      setTransfers(res.data.data);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const filteredTransfers = useMemo(() => {
    const filtered = transfers.filter(t => 
      t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contact?.contactName && t.contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!searchTerm) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.sort((a, b) => {
      const aStarts = a.referenceNumber.toLowerCase().startsWith(term) || 
                      (a.contact?.contactName && a.contact.contactName.toLowerCase().startsWith(term));
      const bStarts = b.referenceNumber.toLowerCase().startsWith(term) || 
                      (b.contact?.contactName && b.contact.contactName.toLowerCase().startsWith(term));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [transfers, searchTerm]);

  const openReturnModal = (transfer) => {
    setSelectedTransfer(transfer);
    // Setup initial return state for items that still need returning
    const initialReturns = transfer.items
      .filter(item => item.returnedQuantity < item.quantityTaken)
      .map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        originalProduct: item.product,
        returnedProduct: item.product, // Default to returning same product
        serialNumbers: [],
        quantity: '',
        maxQty: item.quantityTaken - item.returnedQuantity
      }));
    setReturnItems(initialReturns);
    setReturnDate(dayjs().format('YYYY-MM-DD'));
    setReturnModalOpen(true);
  };

  const handleReturnItemChange = (id, field, value) => {
    setReturnItems(returnItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleAddReturnRow = (originalProduct, maxQty) => {
    setReturnItems([
      ...returnItems,
      {
        id: Math.random().toString(36).substr(2, 9),
        originalProduct,
        returnedProduct: originalProduct,
        serialNumbers: [],
        quantity: '',
        maxQty
      }
    ]);
  };

  const handleRemoveReturnRow = (id) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const submitReturn = async () => {

    const itemsToProcess = returnItems
      .filter(i => parseInt(i.quantity, 10) > 0)
      .map(i => ({
        originalProduct: i.originalProduct._id,
        returnedProduct: i.returnedProduct._id,
        serialNumbers: Array.isArray(i.serialNumbers) ? i.serialNumbers.filter(Boolean) : [],
        quantity: parseInt(i.quantity, 10)
      }));

    if (itemsToProcess.length === 0) {
      alert('Please enter a quantity for at least one item to return.');
      return;
    }

    try {
      const response = await api.post(`/api/transfers/${selectedTransfer._id}/return`, { 
        itemsReturned: itemsToProcess,
        date: returnDate
      });
      setReturnModalOpen(false);
      
      setCompletedTransfer(response.data.data);
      setSuccessModalOpen(true);

      fetchTransfers();
    } catch (err) {
      alert('Error processing return: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Partial': return 'info';
      case 'Completed': return 'success';
      default: return 'default';
    }
  };

  const handlePrint = (transferId) => {
    const token = localStorage.getItem('token');
    if (token) {
      window.open(`${api.defaults.baseURL}/api/transfers/${transferId}/invoice?action=view&token=${encodeURIComponent(token)}`, '_blank');
    } else {
      alert('No authorization token found. Please log in again.');
    }
  };

  const columns = [
    { label: 'Date', accessor: (row) => dayjs(row.date).format('DD MMM, YYYY') },
    { label: 'Return Date', accessor: (row) => row.returnTransactions && row.returnTransactions.length > 0 ? row.returnTransactions.map(tx => dayjs(tx.date).format('DD MMM, YYYY')).join(', ') : '—' },
    { label: 'Reference', accessor: (row) => row.referenceNumber || '' },
    { label: 'Contact / Shop', accessor: (row) => row.contact?.businessName ? `${row.contact.businessName} (${row.contact.contactName})` : (row.contact?.contactName || 'Unknown') },
    { label: 'Items Taken', accessor: (row) => row.items.map(i => `${i.product?.name || 'Unknown'} (${i.quantityTaken} taken / ${i.returnedQuantity} returned)`).join('; ') },
    { label: 'Status', accessor: (row) => row.status }
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>Product Transfers</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportButtons
            data={filteredTransfers || []}
            columns={columns}
            filename="product_transfers"
            title="Product Transfers Report"
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => navigate('/dashboard/sales/transfers/add')}
            sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: '"Outfit", sans-serif' }}
          >
            Create Transfer
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search reference or contact..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 300 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            sx: { borderRadius: '8px' }
          }}
        />
      </Paper>

      {/* Desktop View - Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #eaeef3', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow sx={{
                '& .MuiTableCell-head': {
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  fontFamily: '"Outfit", sans-serif',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #eaeef3',
                  padding: '10px 16px',
                }
              }}>
                <TableCell>Transfer Date</TableCell>
                <TableCell>Return Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Contact / Shop</TableCell>
                <TableCell>Items Taken</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransfers.map((t) => (
                <TableRow key={t._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                    {dayjs(t.date).format('DD MMM, YYYY')}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                    {t.returnTransactions && t.returnTransactions.length > 0 ? (
                      t.returnTransactions.map((tx, idx) => (
                        <Typography key={idx} sx={{ fontSize: '0.825rem', color: '#059669', fontWeight: 500 }}>
                          {dayjs(tx.date).format('DD MMM, YYYY')}
                        </Typography>
                      ))
                    ) : (
                      <Typography sx={{ fontSize: '0.825rem', color: '#94a3b8' }}>-</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#334155', fontFamily: '"Outfit", sans-serif' }}>{t.referenceNumber}</TableCell>
                  <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                    {t.contact?.businessName ? (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>{t.contact.businessName}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{t.contact.contactName}</Typography>
                      </Box>
                    ) : (
                      t.contact?.contactName || 'Unknown'
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                    {t.items.map(i => (
                      <Typography key={i._id} variant="body2" sx={{ fontSize: '0.825rem', fontFamily: '"Outfit", sans-serif' }}>
                        {i.product?.name} ({i.quantityTaken} taken / {i.returnedQuantity} returned)
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small" color={getStatusColor(t.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {t.status !== 'Completed' && (
                        <Tooltip title="Return Items">
                          <IconButton 
                            color="primary" 
                            onClick={() => openReturnModal(t)}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(29, 95, 153, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(29, 95, 153, 0.2)'
                              }
                            }}
                          >
                            <ReturnIcon sx={{ color: '#1D5F99', fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Print Transfer Invoice">
                        <IconButton 
                          color="info" 
                          onClick={() => handlePrint(t._id)}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(2, 132, 199, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(2, 132, 199, 0.2)'
                            }
                          }}
                        >
                          <PrintIcon sx={{ color: '#0284C7', fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>No transfers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile View - Cards */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {filteredTransfers.map((t) => (
          <Card 
            key={t._id} 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              {/* Header: Reference and Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D5F99', fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif' }}>
                  {t.referenceNumber}
                </Typography>
                <Chip label={t.status} size="small" color={getStatusColor(t.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>

              {/* Info Rows */}
              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Contact / Shop</Typography>
                  {t.contact?.businessName ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
                        {t.contact.businessName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
                        {t.contact.contactName}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
                      {t.contact?.contactName || 'Unknown'}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Dates</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
                    Trf: {dayjs(t.date).format('DD MMM, YYYY')}
                  </Typography>
                  {t.returnTransactions && t.returnTransactions.map((tx, idx) => (
                    <Typography key={idx} variant="caption" sx={{ color: '#059669', display: 'block', fontSize: '0.725rem', fontFamily: '"Outfit", sans-serif', mt: 0.25 }}>
                      Ret: {dayjs(tx.date).format('DD MMM, YYYY')}
                    </Typography>
                  ))}
                </Grid>
              </Grid>

              <Divider sx={{ borderStyle: 'dashed', mb: 1.5 }} />

              {/* Items Taken */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem', mb: 0.75 }}>Items Taken</Typography>
                <Box sx={{ backgroundColor: '#F8FAFC', p: 1.5, borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                  {t.items.map(i => (
                    <Typography key={i._id} variant="body2" sx={{ fontSize: '0.8rem', color: '#334155', fontFamily: '"Outfit", sans-serif', mb: 0.5, '&:last-child': { mb: 0 } }}>
                      • <strong>{i.product?.name}</strong> ({i.quantityTaken} taken / {i.returnedQuantity} returned)
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              {/* Actions Footer */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                {t.status !== 'Completed' && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<ReturnIcon sx={{ fontSize: '1rem !important' }} />}
                    onClick={() => openReturnModal(t)}
                    sx={{
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0.5,
                      px: 1.5,
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      '&:hover': {
                        borderColor: '#154A78',
                        backgroundColor: 'rgba(29, 95, 153, 0.04)'
                      }
                    }}
                  >
                    Return Items
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<PrintIcon sx={{ fontSize: '1rem !important' }} />}
                  onClick={() => handlePrint(t._id)}
                  sx={{
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5,
                    borderColor: '#0284C7',
                    color: '#0284C7',
                    '&:hover': {
                      borderColor: '#0369A1',
                      backgroundColor: 'rgba(2, 132, 199, 0.04)'
                    }
                  }}
                >
                  Print
                </Button>
              </Box>
            </Box>
          </Card>
        ))}
        {filteredTransfers.length === 0 && (
          <Box sx={{ py: 3, textAlign: 'center', color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
            No transfers found
          </Box>
        )}
      </Box>

      {/* Return Modal */}
      <Dialog open={returnModalOpen} onClose={() => setReturnModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Process Transfer Return - {selectedTransfer?.referenceNumber}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can return the exact same item, or select a different item of equivalent value/quantity to satisfy the return condition.
          </Typography>

          <TextField
            label="Return Date"
            type="date"
            size="small"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 3, width: 220 }}
          />
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={1} sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.875rem' }}>
            <Grid item xs={2.5}>Original Item</Grid>
            <Grid item xs={1.5}>Price(Orig)</Grid>
            <Grid item xs={1}>Pend</Grid>
            <Grid item xs={2.5}>Item Returned</Grid>
            <Grid item xs={1.5}>Serial(s)</Grid>
            <Grid item xs={1}>Qty</Grid>
            <Grid item xs={1} align="center">Price</Grid>
            <Grid item xs={1} align="center">Action</Grid>
          </Grid>
          
          {returnItems.map((item, index) => {
            // Check if there are other rows with the same original product
            const duplicateRowsCount = returnItems.filter(r => r.originalProduct._id === item.originalProduct._id).length;
            
            // Find first index of row for this original product
            const firstIdx = returnItems.findIndex(r => r.originalProduct._id === item.originalProduct._id);
            const isFirst = firstIdx === index;
            
            return (
              <Grid container spacing={1} key={item.id} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid item xs={2.5}>
                  <Typography variant="body2" sx={{ fontWeight: isFirst ? 600 : 'normal', lineHeight: 1.2 }}>
                    {isFirst ? item.originalProduct?.name : ""}
                  </Typography>
                </Grid>
                <Grid item xs={1.5}>
                  {isFirst ? (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ৳{(item.originalProduct?.sellingPrice || item.originalProduct?.mrp || 0).toLocaleString()}
                    </Typography>
                  ) : ""}
                </Grid>
                <Grid item xs={1}>
                  {isFirst ? (
                    <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>{item.maxQty}</Typography>
                  ) : ""}
                </Grid>
                <Grid item xs={2.5}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => option.name || ''}
                    value={item.returnedProduct}
                    onChange={(e, val) => handleReturnItemChange(item.id, 'returnedProduct', val || item.originalProduct)}
                    renderInput={(params) => <TextField {...params} size="small" />}
                    disableClearable
                  />
                </Grid>
                <Grid item xs={1.5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {Array.from({ length: item.quantity || 0 }, (_, idx) => {
                      const serialsArr = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];
                      return (
                        <TextField
                          key={idx}
                          size="small"
                          placeholder={`Serial #${idx + 1}`}
                          value={serialsArr[idx] || ''}
                          onChange={(e) => {
                            const newArr = [...serialsArr];
                            newArr[idx] = e.target.value;
                            handleReturnItemChange(item.id, 'serialNumbers', newArr);
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '11px', p: '2px 6px', minHeight: '28px' } }}
                        />
                      );
                    })}
                    {(!item.quantity || item.quantity === 0) && (
                      <Typography variant="caption" color="text.secondary">Enter Qty</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === '') {
                        handleReturnItemChange(item.id, 'quantity', '');
                        return;
                      }
                      val = parseInt(val, 10);
                      if (isNaN(val) || val < 0) val = 0;
                      handleReturnItemChange(item.id, 'quantity', val);
                    }}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={1} align="center">
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#10B981' }}>
                    ৳{(item.returnedProduct?.sellingPrice || item.returnedProduct?.mrp || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={1} align="center">
                  <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                    <Tooltip title="Add Product Split">
                      <IconButton 
                        color="primary" 
                        size="small" 
                        onClick={() => handleAddReturnRow(item.originalProduct, item.maxQty)}
                      >
                        <AddCircleIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    {duplicateRowsCount > 1 && (
                      <Tooltip title="Remove Row">
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleRemoveReturnRow(item.id)}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
              </Grid>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReturnModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitReturn} color="primary">Confirm Return</Button>
        </DialogActions>
      </Dialog>

      <TransferInvoiceModal 
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        transfer={completedTransfer}
        isReturn={true}
      />
    </Box>
  );
};

export default Transfers;
