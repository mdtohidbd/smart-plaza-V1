import React from 'react';
import { Button, Tooltip, Box } from '@mui/material';
import {
  Telegram as TelegramIcon,
  Message as MessengerIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const InvoiceShareButtons = (props) => {
  const { sale, companyInfo, invoiceData, customerData, saleData, invoiceType } = props;
  
  // Determine if this is being called with EMI props or standard sale props
  const isEmiProps = invoiceType === 'EMI';
  const customer = isEmiProps ? customerData : sale?.customer;
  const invoiceNum = isEmiProps ? invoiceData?.invoiceNumber : sale?.invoiceNumber;
  const totalAmount = isEmiProps ? saleData?.totalAmount : sale?.totalAmount;
  const dueAmount = isEmiProps ? saleData?.dueAmount : sale?.dueAmount;
  const paidAmount = isEmiProps ? saleData?.paidAmount : sale?.paidAmount;
  const status = isEmiProps ? saleData?.status : sale?.status;
  const date = isEmiProps ? saleData?.date || saleData?.createdAt : sale?.date || sale?.createdAt;
  const items = isEmiProps ? saleData?.items : sale?.items;
  const dateString = date ? new Date(date).toLocaleDateString() : 'N/A';
  
  const handleShareTelegram = () => {
    if (!sale) return;
    
    // Create concise message (optimized for Mac/iOS - no emojis)
    const invoiceMessage = 
      `*INVOICE #${sale.invoiceNumber}*\n\n` +
      `${companyInfo?.companyName || 'Company'}\n` +
      `${companyInfo?.companyAddress || ''}\n` +
      `${companyInfo?.phone || ''}\n\n` +
      `Customer: ${sale.customer?.contactName || 'N/A'}\n` +
      `Date: ${new Date(sale.date || sale.createdAt).toLocaleDateString()}\n\n` +
      `Items: ${sale.items?.length || 0} product(s)\n` +
      `Total: ৳${sale.total?.toFixed(2) || '0.00'}\n` +
      `Paid: ৳${sale.paidAmount?.toFixed(2) || '0.00'}\n` +
      `Due: ৳${sale.dueAmount?.toFixed(2) || '0.00'}\n\n` +
      `Status: ${sale.status || 'Pending'}\n\n` +
      `Thank you!`;

    const encodedMessage = encodeURIComponent(invoiceMessage);
    const telegramUrl = `https://t.me/share/url?url=&text=${encodedMessage}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShareMessenger = () => {
    if (!sale) return;
    
    // Create concise message (optimized for Mac/iOS Messages app - no emojis)
    const invoiceMessage = 
      `INVOICE #${sale.invoiceNumber}\n\n` +
      `${companyInfo?.companyName || 'Company'}\n` +
      `${companyInfo?.companyAddress || ''}\n` +
      `${companyInfo?.phone || ''}\n\n` +
      `Customer: ${sale.customer?.contactName || 'N/A'}\n` +
      `Date: ${new Date(sale.date || sale.createdAt).toLocaleDateString()}\n\n` +
      `Items: ${sale.items?.length || 0} product(s)\n` +
      `Total: ৳${sale.total?.toFixed(2) || '0.00'}\n` +
      `Paid: ৳${sale.paidAmount?.toFixed(2) || '0.00'}\n` +
      `Due: ৳${sale.dueAmount?.toFixed(2) || '0.00'}\n\n` +
      `Status: ${sale.status || 'Pending'}\n\n` +
      `Thank you!`;

    const encodedMessage = encodeURIComponent(invoiceMessage);
    
    try {
      // Try to open Messenger app
      window.open(`fb-messenger://share?text=${encodedMessage}`, '_blank');
      
      // Fallback to web Messenger
      setTimeout(() => {
        window.open(`https://www.messenger.com/t/?text=${encodedMessage}`, '_blank');
      }, 1000);
    } catch (error) {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    }
  };

  const handleShareGeneric = () => {
    if (!sale) return;
    
    // Create simple text for generic sharing
    const invoiceText = `Invoice #${sale.invoiceNumber} - ${companyInfo?.companyName || 'Company'} | Customer: ${sale.customer?.contactName || 'N/A'} | Total: ৳${sale.total?.toFixed(2)} | Status: ${sale.status}`;

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Invoice #${sale.invoiceNumber}`,
        text: invoiceText,
        url: window.location.href
      }).catch((error) => {
        console.log('Error sharing:', error);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(invoiceText).then(() => {
        alert('Invoice info copied to clipboard! You can now paste it anywhere.');
      }).catch((error) => {
        console.error('Error copying to clipboard:', error);
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Tooltip title="Share via Messages & Other Apps">
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShareGeneric}
          sx={{
            borderColor: '#1D5F99',
            color: '#1D5F99',
            '&:hover': {
              backgroundColor: '#f0f7ff',
              borderColor: '#1D5F99'
            },
            borderRadius: '8px',
            px: 2,
            minWidth: 'auto'
          }}
        >
          Messages
        </Button>
      </Tooltip>
    </Box>
  );
};

export default InvoiceShareButtons;
