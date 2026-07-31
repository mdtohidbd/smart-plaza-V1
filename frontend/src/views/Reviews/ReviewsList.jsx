import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Rating
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Snackbar, Alert } from '@mui/material';
import api from '../../utils/api';

const ReviewsList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Delete Dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [page, rowsPerPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/reviews?page=${page + 1}&limit=${rowsPerPage}`);
      setReviews(response.data.data);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setSnackbar({ open: true, message: 'Failed to fetch reviews', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/reviews/${id}`, { status });
      setSnackbar({ open: true, message: `Review ${status} successfully`, severity: 'success' });
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      setSnackbar({ open: true, message: 'Failed to update review status', severity: 'error' });
    }
  };

  const handleDeleteClick = (review) => {
    setReviewToDelete(review);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;
    try {
      await api.delete(`/api/reviews/${reviewToDelete._id}`);
      setSnackbar({ open: true, message: 'Review deleted successfully', severity: 'success' });
      setOpenDeleteDialog(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      setSnackbar({ open: true, message: 'Failed to delete review', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B' }}>
          Reviews Management
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Reviewer</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Comment</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Verified</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#F8FAFC' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">No reviews found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((row) => (
                  <TableRow hover key={row._id}>
                    <TableCell>
                      {row.product ? (
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{row.product.name}</Typography>
                          <Typography variant="caption" color="textSecondary">Model: {row.product?.model || 'N/A'}</Typography>
                        </Box>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{row.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Rating value={row.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Tooltip title={row.comment}>
                        <span>{row.comment}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {row.isVerified ? (
                        <Chip icon={<VerifiedUserIcon />} label="Yes" size="small" color="success" variant="outlined" />
                      ) : (
                        <Chip label="No" size="small" color="default" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status.charAt(0).toUpperCase() + row.status.slice(1)} size="small" color={getStatusColor(row.status)} />
                    </TableCell>
                    <TableCell align="right">
                      {row.status !== 'approved' && (
                        <Tooltip title="Approve">
                          <IconButton size="small" color="success" onClick={() => handleUpdateStatus(row._id, 'approved')}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {row.status !== 'rejected' && (
                        <Tooltip title="Reject">
                          <IconButton size="small" color="warning" onClick={() => handleUpdateStatus(row._id, 'rejected')}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the review from {reviewToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewsList;
