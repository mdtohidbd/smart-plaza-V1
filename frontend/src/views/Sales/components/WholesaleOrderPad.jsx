import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
  Chip,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Inventory2Outlined as StockIcon,
} from '@mui/icons-material';

// ── Colour tokens for the Wholesale module ─────────────────────────
const WS = {
  blue:       '#2563EB',
  blueDark:   '#1D4ED8',
  blueBg:     '#EFF6FF',
  blueBorder: '#BFDBFE',
  surface:    '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border:     '#E2E8F0',
  textPrim:   '#0F172A',
  textSec:    '#64748B',
  textMuted:  '#94A3B8',
  green:      '#16A34A',
  greenBg:    '#DCFCE7',
  yellow:     '#92400E',
  yellowBg:   '#FEF3C7',
  red:        '#B91C1C',
  redBg:      '#FEE2E2',
};

const headerCellSx = {
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.6px',
  color: WS.textSec,
  backgroundColor: WS.surfaceAlt,
  py: 1,
  borderBottom: `2px solid ${WS.blueBorder}`,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const inputSx = (accent = false) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px',
    fontSize: '12px',
    backgroundColor: accent ? WS.blueBg : WS.surface,
    '& fieldset': { borderColor: accent ? WS.blueBorder : WS.border },
    '&:hover fieldset': { borderColor: WS.blue },
    '&.Mui-focused fieldset': { borderColor: WS.blue, borderWidth: '2px' },
  },
});

// ── Stock badge ─────────────────────────────────────────────────────
const StockBadge = ({ qty }) => {
  const isOut  = qty <= 0;
  const isLow  = qty > 0 && qty <= 5;
  return (
    <Chip
      label={isOut ? 'Out' : qty}
      size="small"
      sx={{
        height: 18,
        minWidth: 32,
        fontSize: '10px',
        fontWeight: 700,
        backgroundColor: isOut ? WS.redBg : isLow ? WS.yellowBg : WS.blueBg,
        color: isOut ? WS.red : isLow ? WS.yellow : WS.blue,
        border: 'none',
      }}
    />
  );
};

// ── Inline number input ─────────────────────────────────────────────
const InlineInput = ({ value, onChange, width, align = 'right', accent = false, min = 0 }) => (
  <TextField
    value={value}
    onChange={onChange}
    size="small"
    type="number"
    inputProps={{
      min,
      style: { textAlign: align, fontSize: '12px', fontWeight: 600, padding: '4px 8px' },
    }}
    sx={{ width, ...inputSx(accent) }}
  />
);

// ── Main Component ──────────────────────────────────────────────────
const WholesaleOrderPad = ({
  cart,
  products,          // raw inventory array [{product, currentQuantity, batches, sellingPrice}]
  addToCart,
  updateQuantity,
  removeFromCart,
  updateDiscount,
  updateUnitPrice,
  isMobile = false,
}) => {
  const [quickValue, setQuickValue] = useState(null);
  const [quickInput, setQuickInput] = useState('');

  const handleQuickAdd = (item) => {
    if (item) {
      addToCart(item);
      setQuickValue(null);
      setQuickInput('');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <TableContainer sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
        <Table
          size="small"
          stickyHeader
          sx={{ tableLayout: 'fixed', minWidth: isMobile ? 640 : 'auto' }}
        >
          <colgroup>
            <col style={{ width: 32 }} />
            {!isMobile && <col style={{ width: 30 }} />}
            <col style={{ minWidth: 160 }} />
            <col style={{ width: 60 }} />
            <col style={{ width: isMobile ? 72 : 80 }} />
            <col style={{ width: isMobile ? 100 : 110 }} />
            <col style={{ width: isMobile ? 80 : 90 }} />
            <col style={{ width: isMobile ? 90 : 100 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>#</TableCell>
              {!isMobile && <TableCell sx={headerCellSx} />}
              <TableCell sx={headerCellSx}>Product / SKU</TableCell>
              <TableCell align="center" sx={headerCellSx}>Stock</TableCell>
              <TableCell align="center" sx={headerCellSx}>Qty</TableCell>
              <TableCell align="right"  sx={headerCellSx}>Unit Price</TableCell>
              <TableCell align="right"  sx={headerCellSx}>Disc/Unit</TableCell>
              <TableCell align="right"  sx={headerCellSx}>Line Total</TableCell>
              <TableCell sx={headerCellSx} />
            </TableRow>
          </TableHead>

          <TableBody>
            {/* ── Empty state ── */}
            {cart.length === 0 && (
              <TableRow>
                <TableCell colSpan={isMobile ? 8 : 9} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <StockIcon sx={{ fontSize: 32, color: WS.textMuted }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: WS.textSec }}>
                      No order lines yet
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: WS.textMuted }}>
                      Use the search row below to add products
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* ── Line items ── */}
            {cart.map((item, idx) => {
              const lineTotal  = (item.unitPrice * item.quantity) - ((item.discount || 0) * item.quantity);
              const stockLevel = item.currentQuantity ?? 0;

              return (
                <TableRow
                  key={item.product._id}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? WS.surface : WS.surfaceAlt,
                    '&:hover': { backgroundColor: WS.blueBg },
                    transition: 'background-color 0.1s',
                  }}
                >
                  {/* Row # */}
                  <TableCell sx={{ fontSize: '11px', color: WS.textMuted, py: 0.75, fontWeight: 700 }}>
                    {idx + 1}
                  </TableCell>

                  {/* Offer badge column (desktop only) */}
                  {!isMobile && (
                    <TableCell sx={{ py: 0.75, pr: 0 }}>
                      {item.offer && (
                        <Tooltip title="Active promotional offer applied" arrow>
                          <Chip
                            label="Offer"
                            size="small"
                            sx={{ height: 14, fontSize: '9px', backgroundColor: WS.greenBg, color: WS.green, fontWeight: 700 }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  )}

                  {/* Product name / model */}
                  <TableCell sx={{ py: 0.75, pr: 1 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: WS.textPrim, lineHeight: 1.3 }}>
                      {item.product.name}
                    </Typography>
                    {item.product.model && (
                      <Typography sx={{ fontSize: '10px', color: WS.textMuted }}>
                        {item.product.model}
                        {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Stock */}
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <StockBadge qty={stockLevel} />
                  </TableCell>

                  {/* Quantity */}
                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <InlineInput
                      value={item.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v > 0) updateQuantity(item.product._id, v);
                      }}
                      width={isMobile ? 64 : 72}
                      align="center"
                      accent
                      min={1}
                    />
                  </TableCell>

                  {/* Unit Price */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <InlineInput
                      value={item.unitPrice}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 0) updateUnitPrice(item.product._id, v);
                      }}
                      width={isMobile ? 90 : 100}
                      align="right"
                      min={0}
                    />
                  </TableCell>

                  {/* Discount per unit */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <InlineInput
                      value={item.discount === undefined ? '' : item.discount}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateDiscount(item.product._id, isNaN(v) ? 0 : v);
                      }}
                      width={isMobile ? 72 : 80}
                      align="right"
                      min={0}
                    />
                  </TableCell>

                  {/* Line Total */}
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: WS.blue }}>
                      ৳{lineTotal.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                    </Typography>
                  </TableCell>

                  {/* Remove */}
                  <TableCell sx={{ py: 0.75, pl: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.product._id)}
                      sx={{ color: WS.textMuted, p: 0.5, '&:hover': { color: WS.red, backgroundColor: WS.redBg } }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* ── Quick-add product row ── */}
            <TableRow sx={{ backgroundColor: WS.blueBg, '&:hover': { backgroundColor: WS.blueBg } }}>
              <TableCell sx={{ py: 1, color: WS.blue, verticalAlign: 'middle' }}>
                <AddIcon sx={{ fontSize: 16, display: 'block' }} />
              </TableCell>
              {!isMobile && <TableCell sx={{ py: 1 }} />}
              <TableCell colSpan={7} sx={{ py: 0.75, pr: 1.5 }}>
                <Autocomplete
                  value={quickValue}
                  inputValue={quickInput}
                  onInputChange={(_, v) => setQuickInput(v)}
                  onChange={(_, item) => handleQuickAdd(item)}
                  options={products || []}
                  getOptionLabel={(item) => {
                    const p = item?.product;
                    return p ? `${p.name}${p.model ? ' — ' + p.model : ''}` : '';
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const s = inputValue.trim().toLowerCase();
                    if (!s) return [];
                    return options
                      .filter((item) => {
                        const p = item?.product;
                        return (
                          p &&
                          (p.name?.toLowerCase().includes(s) ||
                            p.model?.toLowerCase().includes(s) ||
                            p.color?.toLowerCase().includes(s))
                        );
                      })
                      .slice(0, 25);
                  }}
                  renderOption={(props, item) => {
                    const p = item.product;
                    const stock = item.currentQuantity ?? 0;
                    return (
                      <Box
                        component="li"
                        {...props}
                        sx={{ py: '6px !important', px: '12px !important' }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: WS.textPrim }}>
                              {p.name}
                            </Typography>
                            {p.model && (
                              <Typography sx={{ fontSize: '10px', color: WS.textMuted }}>
                                {p.model}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0 }}>
                            <Chip
                              label={`Stock: ${stock}`}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '9px',
                                fontWeight: 700,
                                backgroundColor: stock <= 0 ? WS.redBg : stock <= 5 ? WS.yellowBg : WS.blueBg,
                                color: stock <= 0 ? WS.red : stock <= 5 ? WS.yellow : WS.blue,
                              }}
                            />
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: WS.blue }}>
                              ৳{(item.sellingPrice || p.sellingPrice || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText={
                    quickInput.length < 1
                      ? 'Start typing to search…'
                      : 'No matching products found'
                  }
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="⌕  Search by product name or model to add an order line…"
                      sx={inputSx(false)}
                    />
                  )}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WholesaleOrderPad;
