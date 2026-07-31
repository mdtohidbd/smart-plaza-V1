import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';



const WholesaleReports = () => {
  const navigate = useNavigate();

  const reportItems = [
    {
      title: 'All Sales',
      description: 'View all sales transactions and details',
      path: '/dashboard/sales/all?view=table',
      color: '#4F46E5'
    },
    {
      title: 'All Wholesale',
      description: 'View all wholesale sales reports',
      path: '/dashboard/reports/all-sales-reports/all',
      color: '#1D5F99'
    },
    {
      title: 'All Retail Reports',
      description: 'View and analyze retail sales performance data',
      path: '/dashboard/reports/retail',
      color: '#9C27B0'
    },
    {
      title: 'Product Wise Sale',
      description: 'View sales reports by product',
      path: '/dashboard/reports/all-sales-reports/product-wise',
      color: '#42A2C2'
    },
    {
      title: 'Customer Ledger',
      description: 'View customer transaction ledger',
      path: '/dashboard/reports/all-sales-reports/customer-ledger',
      color: '#009688'
    },
    {
      title: 'Sales Due Report',
      description: 'View outstanding sales due reports',
      path: '/dashboard/reports/all-sales-reports/sales-due',
      color: '#FF9800'
    },
    {
      title: 'Sales Return Report',
      description: 'View sales return reports',
      path: '/dashboard/reports/all-sales-reports/sales-return',
      color: '#795548'
    }
  ];

  const handleReportClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',
    }}>
      
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            fontFamily: '"Outfit", sans-serif',
            fontSize: { xs: '1.3rem', sm: '1.6rem' },
            letterSpacing: '-0.3px',
          }}
        >
          Sale Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
          Overview of all sales report categories
        </Typography>
      </Box>
      <Grid container spacing={1.5} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Grid container spacing={1.5}>
            {reportItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eaeef3',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: item.color,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: item.color, fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.1rem' }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', padding: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleReportClick(item.path)}
                      sx={{
                        backgroundColor: item.color,
                        '&:hover': {
                          backgroundColor: `${item.color}CC`,
                        },
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      View Report
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WholesaleReports;