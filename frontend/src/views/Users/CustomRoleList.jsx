import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    MenuItem,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Store as StoreIcon,
    LocalShipping as DeliveryIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import RequirePermission from '../../components/RequirePermission';

const CustomRoleList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]); // For table display
    const [potentialUsers, setPotentialUsers] = useState([]); // For dropdown
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch all custom role users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            let url = '/api/sr-assign/custom-roles';
            const params = {};

            if (search) {
                params.search = search;
            }

            const queryString = new URLSearchParams(params).toString();
            const response = await api.get(`${url}?${queryString}`);

            setUsers(response.data.data);
        } catch (err) {
            console.error('Error fetching custom role users:', err);
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all potential custom role users (for dropdown)
    const fetchPotentialUsers = async () => {
        try {
            const response = await api.get('/api/sr-assign/potential-custom-roles');
            setPotentialUsers(response.data.data);
        } catch (err) {
            console.error('Error fetching potential Custom Role users:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPotentialUsers();
    }, [search]);

    return (
        <RequirePermission module="contacts" action="read">
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2,
                    mb: 3
                }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            Custom Roles
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                            View custom role users
                        </Typography>
                    </Box>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: '#94A3B8' }} />
                            }}
                            sx={{ flexGrow: 1, minWidth: 250 }}
                        />
                    </Box>
                </Paper>

                {/* Success/Error Messages */}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Compact List View */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : users.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eaeef3', borderRadius: '8px', boxShadow: 'none' }}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                No users found
                            </Typography>
                        </Paper>
                    ) : (
                        users.map((userItem, index) => (
                            <Paper key={userItem._id} sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid #eaeef3', borderRadius: '8px', boxShadow: 'none', transition: 'all 0.2s ease', '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                        <Box sx={{
                                            width: 28, height: 28, borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2, mb: 0.5 }}>
                                                {userItem.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                {userItem.email} &bull; {userItem.phone}
                                            </Typography>

                                            <Box sx={{ mt: 0.5 }}>
                                                <Typography variant="caption" sx={{
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0284c7',
                                                    px: 1, py: 0.25,
                                                    borderRadius: '4px',
                                                    fontWeight: 600
                                                }}>
                                                    {userItem.role}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', alignSelf: { xs: 'flex-start', sm: 'center' }, pl: { xs: 5, sm: 0 }, mt: { xs: 1, sm: 0 } }}>
                                        <Chip
                                            label={userItem.isActive ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={userItem.isActive ? 'success' : 'default'}
                                            variant={userItem.isActive ? 'contained' : 'outlined'}
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                        />
                                    </Box>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Box>
            </Box>
        </RequirePermission>
    );
};

export default CustomRoleList;
