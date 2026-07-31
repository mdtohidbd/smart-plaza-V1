import React from 'react';
import {
  Grid,
  Box,
  TextField,
  Button,
  Switch,
  Typography
} from '@mui/material';
import SplitPaymentPanel from './SplitPaymentPanel';

/**
 * PaymentDetails — wraps discount/EMI controls + SplitPaymentPanel.
 * The legacy paymentMethod / paidAmount props are still accepted for backward compat
 * but the actual values are derived from the new SplitPaymentPanel.
 */
const PaymentDetails = ({
  isEmi,
  setIsEmi,
  paidAmount,
  setPaidAmount,
  setHasManuallyEditedPaidAmount,
  emiDuration,
  setEmiDuration,
  emiInterestRate,
  setEmiInterestRate,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  // New split-payment props
  grandTotal,
  onPaymentsChange,
  disabled,
  // Other Charges
  expense,
  setExpense,
  delivery,
  setDelivery,
  installation,
  setInstallation,
  isOperatingExpense,
  setIsOperatingExpense,
  isOperatingDelivery,
  setIsOperatingDelivery,
  isOperatingInstallation,
  setIsOperatingInstallation
}) => {
  return (
    <>
      {/* EMI toggle row sits above the split panel */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            label={isEmi ? 'Down Payment' : 'Paid Amount (auto from split)'}
            type="number"
            value={paidAmount}
            onChange={(e) => {
              const value = e.target.value;
              setPaidAmount(value === '' ? '' : (parseFloat(value) || 0));
              setHasManuallyEditedPaidAmount(true);
            }}
            size="small"
            disabled
            InputProps={{
              sx: { borderRadius: '8px', backgroundColor: '#F8FAFC' }
            }}
            helperText="Calculated from payment entries below"
            FormHelperTextProps={{ sx: { fontSize: '10px', mt: 0.25 } }}
          />
          <Button
            variant={isEmi ? 'contained' : 'outlined'}
            color={isEmi ? 'secondary' : 'primary'}
            onClick={() => {
              setIsEmi(!isEmi);
              setPaidAmount('');
              setHasManuallyEditedPaidAmount(true);
            }}
            sx={{ minWidth: '110px', height: '40px', borderRadius: '8px', textTransform: 'none' }}
          >
            {isEmi ? 'EMI Active' : 'Sell as EMI'}
          </Button>
        </Box>
      </Grid>

      {/* EMI Configuration */}
      {isEmi && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Duration (Months)"
              type="number"
              value={emiDuration}
              onChange={(e) => setEmiDuration(e.target.value)}
              size="small"
              inputProps={{ min: 1 }}
              InputProps={{ sx: { borderRadius: '8px' } }}
            />
            <TextField
              fullWidth
              label="Interest Rate (%)"
              type="number"
              value={emiInterestRate}
              onChange={(e) => setEmiInterestRate(e.target.value)}
              size="small"
              inputProps={{ min: 0 }}
              InputProps={{ sx: { borderRadius: '8px' } }}
            />
          </Box>
        </Grid>
      )}



      {/* Additional Charges (Expense, Delivery, Installation) */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Expense (৳)"
              type="number"
              value={expense}
              onChange={(e) => {
                const value = e.target.value;
                setExpense(value === '' ? '' : (parseFloat(value) || 0));
                if (value && parseFloat(value) > 0) setIsOperatingExpense(true);
              }}
              size="small"
              inputProps={{ min: 0 }}
              InputProps={{ sx: { borderRadius: '8px' } }}
            />
            <TextField
              fullWidth
              label="Delivery (৳)"
              type="number"
              value={delivery}
              onChange={(e) => {
                const value = e.target.value;
                setDelivery(value === '' ? '' : (parseFloat(value) || 0));
                if (value && parseFloat(value) > 0) setIsOperatingDelivery(true);
              }}
              size="small"
              inputProps={{ min: 0 }}
              InputProps={{ sx: { borderRadius: '8px' } }}
            />
            <TextField
              fullWidth
              label="Installation (৳)"
              type="number"
              value={installation}
              onChange={(e) => {
                const value = e.target.value;
                setInstallation(value === '' ? '' : (parseFloat(value) || 0));
                if (value && parseFloat(value) > 0) setIsOperatingInstallation(true);
              }}
              size="small"
              inputProps={{ min: 0 }}
              InputProps={{ sx: { borderRadius: '8px' } }}
            />
          </Box>
          {(expense > 0 || delivery > 0 || installation > 0) && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              mt: 0.5,
              p: 1,
              borderRadius: '10px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
            }}>
              {expense > 0 && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  '&:not(:last-child)': { borderBottom: '1px solid #E2E8F0' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      Expense
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                      Operating
                    </Typography>
                  </Box>
                  <Switch
                    checked={isOperatingExpense}
                    onChange={(e) => setIsOperatingExpense(e.target.checked)}
                    size="small"
                    sx={{
                      width: 34, height: 18, padding: '2px',
                      '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                      '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                      '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                    }}
                  />
                </Box>
              )}
              {delivery > 0 && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  '&:not(:last-child)': { borderBottom: '1px solid #E2E8F0' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      Delivery
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                      Operating
                    </Typography>
                  </Box>
                  <Switch
                    checked={isOperatingDelivery}
                    onChange={(e) => setIsOperatingDelivery(e.target.checked)}
                    size="small"
                    sx={{
                      width: 34, height: 18, padding: '2px',
                      '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                      '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                      '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                    }}
                  />
                </Box>
              )}
              {installation > 0 && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      Installation
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                      Operating
                    </Typography>
                  </Box>
                  <Switch
                    checked={isOperatingInstallation}
                    onChange={(e) => setIsOperatingInstallation(e.target.checked)}
                    size="small"
                    sx={{
                      width: 34, height: 18, padding: '2px',
                      '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                      '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                      '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Grid>

      {/* Split Payment Panel — replaces legacy single payment method dropdown */}
      <Grid item xs={12}>
        <SplitPaymentPanel
          grandTotal={grandTotal || 0}
          onPaymentsChange={onPaymentsChange}
          disabled={disabled}
        />
      </Grid>
    </>
  );
};

export default PaymentDetails;
