import React from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Payments,
  CreditCard,
  AccountBalanceWallet,
  Schedule,
  LocalShipping,
  CheckCircle
} from '@mui/icons-material';

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  selectedEmiPlan, 
  onEmiPlanChange,
  totalAmount 
}) => {
  
  const emiPlans = [
    { months: 3, interestRate: 5, label: '3 Months', popular: false },
    { months: 6, interestRate: 8, label: '6 Months', popular: true },
    { months: 12, interestRate: 10, label: '12 Months', popular: false }
  ];

  const calculateEMI = (plan) => {
    const downPayment = totalAmount * 0.2; // 20% down payment
    const remainingAmount = totalAmount - downPayment;
    const interestAmount = remainingAmount * (plan.interestRate / 100);
    const totalPayable = remainingAmount + interestAmount;
    const monthlyEMI = totalPayable / plan.months;
    
    return {
      downPayment: Math.round(downPayment),
      monthlyEMI: Math.round(monthlyEMI),
      interestAmount: Math.round(interestAmount),
      totalPayable: Math.round(totalPayable)
    };
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1E293B' }}>
        <Payments sx={{ color: '#6366F1' }} />
        Select Payment Method
      </Typography>

      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={selectedMethod}
          onChange={(e) => onMethodChange(e.target.value)}
        >
          {/* Cash on Delivery */}
          <Card 
            sx={{ 
              mb: 2, 
              border: selectedMethod === 'cod' ? '2px solid #6366F1' : '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: '#6366F1',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }
            }}
          >
            <FormControlLabel
              value="cod"
              control={<Radio sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#6366F1' } }} />}
              label={
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ color: selectedMethod === 'cod' ? '#6366F1' : '#94A3B8' }} />
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ color: '#1E293B' }}>
                      Cash on Delivery (COD)
                    </Typography>
                    <Chip 
                      label="Most Popular" 
                      size="small" 
                      sx={{ ml: 1, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#94A3B8' }}>
                    Pay with cash when your order is delivered to your doorstep
                  </Typography>
                  {selectedMethod === 'cod' && (
                    <Alert severity="success" sx={{ mt: 1.5, py: 0.5, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <Typography variant="caption">
                        ✓ No advance payment required. Pay ৳{totalAmount.toLocaleString()} on delivery.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              }
              sx={{ 
                m: 0, 
                p: { xs: 1.5, sm: 2 }, 
                width: '100%',
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': { width: '100%' }
              }}
            />
          </Card>

          /* EMI Plans (Coming Soon) */
          <Card 
            sx={{ 
              mb: 2, 
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              opacity: 0.6,
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(17, 24, 39, 0.8)',
                zIndex: 1
              }}
            >
              <Chip label="Coming Soon" sx={{ bgcolor: '#E2E8F0', color: '#94A3B8' }} />
            </Box>
            <FormControlLabel
              value="emi"
              disabled
              control={<Radio disabled sx={{ color: '#64748B' }} />}
              label={
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ color: '#64748B' }} />
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ color: '#94A3B8' }}>
                      EMI (Easy Monthly Installments)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#64748B' }}>
                    Pay in easy monthly installments with low interest rates
                  </Typography>
                </Box>
              }
              sx={{ 
                m: 0, 
                p: { xs: 1.5, sm: 2 }, 
                width: '100%',
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': { width: '100%' }
              }}
            />
          </Card>

          {/* Online Payment (Coming Soon) */}
          <Card 
            sx={{ 
              mb: 2, 
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              opacity: 0.6,
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(17, 24, 39, 0.8)',
                zIndex: 1
              }}
            >
              <Chip label="Coming Soon" sx={{ bgcolor: '#E2E8F0', color: '#94A3B8' }} />
            </Box>
            <FormControlLabel
              value="online"
              disabled
              control={<Radio disabled sx={{ color: '#64748B' }} />}
              label={
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCard sx={{ color: '#64748B' }} />
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ color: '#94A3B8' }}>
                      Online Payment (bKash/Nagad/Card)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#64748B' }}>
                    Pay securely online with mobile banking or credit/debit cards
                  </Typography>
                </Box>
              }
              sx={{ 
                m: 0, 
                p: { xs: 1.5, sm: 2 }, 
                width: '100%',
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': { width: '100%' }
              }}
            />
          </Card>
        </RadioGroup>
      </FormControl>

      {/* Payment Summary */}
      {selectedMethod && (
        <Card sx={{ mt: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: '#1E293B' }}>
              Payment Summary
            </Typography>
            
            {selectedMethod === 'cod' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>Amount to pay on delivery:</Typography>
                  <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 'bold' }}>
                    ৳{totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mt: 1, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <Typography variant="caption">
                    💵 Please keep exact change ready for faster delivery
                  </Typography>
                </Alert>
              </Box>
            )}

            {selectedMethod === 'emi' && selectedEmiPlan && (() => {
              const plan = emiPlans.find(p => p.months === selectedEmiPlan);
              const emiDetails = calculateEMI(plan);
              
              return (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>Down Payment (at delivery):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1E293B' }}>
                      ৳{emiDetails.downPayment.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>Monthly EMI ({plan.months} months):</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#6366F1' }}>
                      ৳{emiDetails.monthlyEMI.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>Total Payable:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#F59E0B' }}>
                      ৳{emiDetails.totalPayable.toLocaleString()}
                    </Typography>
                  </Box>
                  <Alert severity="warning" sx={{ mt: 1, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <Typography variant="caption">
                      ⚠️ First EMI due 30 days after delivery. Late payments may incur additional charges.
                    </Typography>
                  </Alert>
                </Box>
              );
            })()}

            {selectedMethod === 'emi' && !selectedEmiPlan && (
              <Alert severity="warning" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Typography variant="caption">
                  Please select an EMI plan above to continue
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PaymentMethodSelector;
