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
  Card,
  CardHeader,
  CardContent,
  Divider,
  InputAdornment,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const OpeningStock = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    items: [{ product: '', quantity: 0, purchasePrice: 0, sellingPrice: 0 }]
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch products
  const { data: products } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data.data;
  });

  const queryClient = useQueryClient();

  // Mutation for creating opening stock
  const createOpeningStockMutation = useMutation(
    (data) => api.post('/api/inventory/opening-stock', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currentStock');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          items: [{ product: '', quantity: 0, purchasePrice: 0, sellingPrice: 0 }]
        });
        setSuccess('Opening stock recorded successfully!');
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
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 0, purchasePrice: 0, sellingPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return; // Don't remove the last item
    
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createOpeningStockMutation.mutate(formData);
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.2rem', mb: 0.25 }}>
                  Opening Stock
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                  Record initial stock quantities for products.
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
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader 
              title="Opening Stock Information" 
              subheader="Fill in the opening stock details below"
              sx={{ 
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                },
                '& .MuiCardHeader-subheader': {
                  color: '#666'
                }
              }}
            />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1D5F99', fontWeight: 600 }}>Items</Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={addItem}
                      sx={{
                        borderColor: '#1D5F99',
                        color: '#1D5F99',
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
                  
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #eaeef3',
                          padding: '10px 16px',
                        }
                      }}
                    >
                          <TableCell>Product</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Purchase Price</TableCell>
                          <TableCell>Selling Price</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow 
                            key={index}
                            sx={{
                              '&:nth-of-type(even)': { backgroundColor: '#f9fbfd' },
                              '&:hover': { backgroundColor: '#f0f7ff' },
                            }}
                          >
                            <TableCell>
                              <FormControl fullWidth>
                                <Select
                                  value={item.product}
                                  onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                  size="small"
                                  sx={{ borderRadius: '8px' }}
                                >
                                  {products?.map((product) => (
                                    <MenuItem key={product._id} value={product._id}>
                                      {product.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                size="small"
                                sx={{ width: '100px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.purchasePrice}
                                onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                size="small"
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                }}
                                sx={{ width: '120px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.sellingPrice}
                                onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                size="small"
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                                }}
                                sx={{ width: '120px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                color="error" 
                                onClick={() => removeItem(index)}
                                disabled={formData.items.length === 1}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    type="submit"
                    disabled={createOpeningStockMutation.isLoading}
                    sx={{ 
                      px: 4,
                      py: 1,
                      borderRadius: '8px',
                      backgroundColor: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#42A2C2'
                      }
                    }}
                  >
                    {createOpeningStockMutation.isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Recording Stock...
                      </>
                    ) : 'Record Opening Stock'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OpeningStock;