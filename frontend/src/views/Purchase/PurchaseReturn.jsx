import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const PurchaseReturn = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    purchase: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ product: '', quantity: 1, unitPrice: '', reason: '' }],
    note: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  // Fetch purchases
  const { data: purchases } = useQuery('purchases', async () => {
    const response = await api.get('/api/purchases');
    return response.data.data;
  });

  // Fetch products
  const { data: products } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data.data;
  });

  // Mutation for creating purchase return
  const createReturnMutation = useMutation(
    (returnData) => api.post('/api/purchases/returns', returnData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('purchase-returns');
        queryClient.invalidateQueries('dashboardData');
        setFormData({
          purchase: '',
          supplier: '',
          date: new Date().toISOString().split('T')[0],
          items: [{ product: '', quantity: 1, unitPrice: '', reason: '' }],
          note: ''
        });
        setSuccess('Purchase return created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-populate unit price when product is selected
    if (field === 'product' && value) {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        if (newItems[index].unitPrice === 0 || newItems[index].unitPrice === '') {
          newItems[index].unitPrice = selectedProduct.purchasePrice || '';
        }
      }
    }

    setFormData({
      ...formData,
      items: newItems
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: '', reason: '' }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.items.some(item => !item.product || !item.quantity || item.quantity <= 0)) {
      setError('Please fill in all required fields for items');
      return;
    }

    const formattedItems = formData.items.map(item => ({
      ...item,
      quantity: parseInt(item.quantity) || 1,
      unitPrice: parseFloat(item.unitPrice) || 0
    }));

    createReturnMutation.mutate({
      ...formData,
      items: formattedItems
    });
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 1.5 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              backgroundColor: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem' }}>
                  Purchase Return
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Process returns for purchased items.
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Purchase</InputLabel>
                    <Select
                      name="purchase"
                      value={formData.purchase}
                      onChange={handleInputChange}
                      label="Purchase"
                      sx={{ borderRadius: '6px' }}
                    >
                      {purchases?.map((purchase) => (
                        <MenuItem key={purchase._id} value={purchase._id}>
                          {purchase.purchaseNumber} - {purchase.supplier?.name || 'N/A'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: '6px' }
                    }}
                    required
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 600 }}>Return Items</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    sx={{
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      borderRadius: '6px',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#1D5F99',
                        color: 'white',
                        borderColor: '#1D5F99'
                      }
                    }}
                  >
                    Add Item
                  </Button>
                </Box>

                {isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.items.map((item, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>Item {index + 1}</Typography>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Product *</InputLabel>
                              <Select
                                value={item.product}
                                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                label="Product *"
                                sx={{ borderRadius: '6px' }}
                              >
                                {products?.map((product) => (
                                  <MenuItem key={product._id} value={product._id}>
                                    {product.name} - ৳{product.purchasePrice}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Quantity *"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || '')}
                              inputProps={{ min: 1 }}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Unit Price (৳) *"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Reason for Return"
                              size="small"
                              value={item.reason}
                              onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                              placeholder="Reason..."
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <TableContainer sx={{ overflow: 'auto', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                    <Table
                      sx={{
                        minWidth: 800,
                        tableLayout: 'auto'
                      }}
                    >
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                          <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 200 }}>Product *</TableCell>
                          <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 100 }}>Quantity *</TableCell>
                          <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>Unit Price (৳) *</TableCell>
                          <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 250 }}>Reason for Return</TableCell>
                          <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 80 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:hover': {
                                backgroundColor: '#f8fafc',
                              }
                            }}
                          >
                            <TableCell sx={{ py: 1 }}>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={item.product}
                                  onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                  sx={{ borderRadius: '6px' }}
                                >
                                  {products?.map((product) => (
                                    <MenuItem key={product._id} value={product._id}>
                                      {product.name} - ৳{product.purchasePrice}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || '')}
                                inputProps={{ min: 1 }}
                                InputProps={{ sx: { borderRadius: '6px' } }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1 }}>
                              <TextField
                                type="number"
                                size="small"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                InputProps={{ sx: { borderRadius: '6px' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <TextField
                                size="small"
                                value={item.reason}
                                onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                                InputProps={{ sx: { borderRadius: '6px' } }}
                                placeholder="Reason..."
                                fullWidth
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => removeItem(index)}
                                disabled={formData.items.length === 1}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    InputProps={{
                      sx: { borderRadius: '6px' }
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  type="submit"
                  disabled={createReturnMutation.isLoading}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '6px',
                    backgroundColor: '#1D5F99',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#42A2C2'
                    }
                  }}
                >
                  {createReturnMutation.isLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                      Processing...
                    </>
                  ) : 'Create Purchase Return'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseReturn;