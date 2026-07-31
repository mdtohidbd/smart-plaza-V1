const axios = require('axios');

// Default config that can be overridden by the controller dynamically
const config = {
  get apiKey() { return process.env.MIM_SMS_APIKEY; },
  get senderId() { return process.env.MIM_SMS_SENDER_NAME; },
  get baseUrl() { return process.env.MIM_SMS_API_BASE_URL || 'https://api.mimsms.com'; }
};

/**
 * Send SMS via MimSMS
 * @param {string} recipient - Phone number
 * @param {string} message - SMS message content
 * @returns {Promise<object>} - SMS API response with detailed error handling
 */
const sendSMS = async (recipient, message) => {
  try {
    const apiKey = config.apiKey;
    const senderId = config.senderId;
    
    if (!apiKey || !senderId) {
      console.error('MimSMS credentials not configured in environment variables');
      return { 
        success: false, 
        error: 'SMS credentials not configured',
        code: 'CONFIG_ERROR',
        details: 'Please add MIM_SMS_APIKEY and MIM_SMS_SENDER_NAME to config'
      };
    }
    
    // Format phone number (remove leading zeros and special characters)
    // Bangladesh format: 01XXXXXXXX → 8801XXXXXXXX
    let formattedNumber = recipient.replace(/\D/g, ''); // Remove all non-digits
    
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '880' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('880')) {
      formattedNumber = '880' + formattedNumber;
    }
    
    // Validate phone number format (Bangladesh mobile: 8801[3-9] followed by 8 digits)
    if (!/^8801[3-9]\d{8}$/.test(formattedNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        code: 'INVALID_NUMBER',
        details: `Phone number ${formattedNumber} is not valid. Expected format: 8801XXXXXXXX`
      };
    }
    
    const url = `${config.baseUrl.replace(/\/$/, '')}/api/sendsms`;
    
    const params = {
      api_key: apiKey,
      senderid: senderId,
      type: 'text',
      contacts: formattedNumber,
      msg: message
    };
    
    console.log('=== SENDING SMS REQUEST ===');
    console.log('URL:', url);
    console.log('Sending SMS to:', formattedNumber);
    console.log('Message:', message);
    
    // Use POST as it's more standard and safer for SMS content
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('=== SMS API RESPONSE ===');
    console.log('Status Code:', response.status);
    console.log('Response Data:', response.data);
    
    // Most standard API responses
    const responseCode = response.data?.code || response.data?.status;
    const responseMsg = response.data?.message || response.data?.msg || '';

    // MimSMS typically returns error strings or JSON
    if (typeof response.data === 'string') {
      if (response.data.includes('1002') || response.data.includes('1003') || response.data.includes('1004') || response.data.includes('1005') || response.data.includes('1006') || response.data.includes('1007') || response.data.includes('1008') || response.data.includes('1009') || response.data.includes('1010') || response.data.includes('1011') || response.data.includes('1012')) {
         return {
            success: false,
            error: response.data,
            code: response.data.trim(),
            rawResponse: response.data
         };
      }
    }

    if (responseCode && (responseCode.toString().startsWith('10') || responseMsg.toLowerCase().includes('error') || responseMsg.toLowerCase().includes('invalid'))) {
      return {
        success: false,
        error: responseMsg || 'SMS failed to send',
        code: responseCode,
        rawResponse: response.data
      };
    }
    
    console.log('✅ SMS sent successfully');
    return {
      success: true,
      message: 'SMS Submitted Successfully',
      code: responseCode || 'SUCCESS',
      data: response.data
    };
    
  } catch (error) {
    console.error('=== SMS REQUEST ERROR ===');
    console.error('Error Message:', error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send SMS',
      code: error.response?.status || 'UNKNOWN_ERROR',
      originalError: error.message
    };
  }
};

/**
 * Send Single SMS (Alias for compatibility)
 */
const sendSingleSms = async (phoneNumber, message) => {
  return await sendSMS(phoneNumber, message);
};

/**
 * Send Bulk SMS
 */
const sendBulkSms = async (phoneNumbers, message) => {
  const results = [];
  for (const number of phoneNumbers) {
    const result = await sendSMS(number, message);
    results.push({ number, ...result });
  }
  return { success: true, results };
};

/**
 * Send Dynamic SMS
 */
const sendDynamicSms = async (recipients) => {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phoneNumber, recipient.message);
    results.push({ recipient, ...result });
  }
  return { success: true, results };
};

/**
 * Send Sale Confirmation SMS
 */
const sendSaleConfirmationSMS = async (customer, sale, type = 'sale') => {
  try {
    if (!customer?.contactNumber && !customer?.phone) {
      console.log('No customer phone number provided for SMS');
      return { success: false, error: 'No phone number' };
    }
    
    const phoneNumber = customer.contactNumber || customer.phone;
    const invoiceNumber = sale.invoiceNumber || sale.orderNumber || 'N/A';
    const totalAmount = sale.total?.toFixed(2) || sale.totalAmount?.toFixed(2) || '0.00';
    const paidAmount = sale.paidAmount?.toFixed(2) || '0.00';
    const dueAmount = sale.dueAmount?.toFixed(2) || sale.outstandingBalance?.toFixed(2) || '0.00';
    const items = sale.items || sale.products || [];
    
    let itemsSummary = '';
    if (items.length > 0) {
      const displayItems = items.slice(0, 3);
      itemsSummary = '\nItems:\n';
      displayItems.forEach((item, index) => {
        const productName = item.product?.name || item.name || `Item ${index + 1}`;
        const shortName = productName.length > 15 ? productName.substring(0, 12) + '...' : productName;
        const qty = item.quantity || 1;
        const price = item.unitPrice || 0;
        itemsSummary += `${shortName} x${qty} ৳${(price * qty).toFixed(0)}\n`;
      });
      if (items.length > 3) {
        itemsSummary += `...and ${items.length - 3} more items\n`;
      }
    }
    
    const customerName = customer.contactName || customer.name || 'Valued Customer';
    
    let message = `
✅ Sale Confirmed!
Dear ${customerName},
Invoice: ${invoiceNumber}
${itemsSummary}
Total: ৳${totalAmount}
Paid: ৳${paidAmount}
Due: ৳${dueAmount}

Thank you for your purchase!
- Smart Plaza BD`.trim();
    
    return await sendSMS(phoneNumber, message);
    
  } catch (error) {
    console.error('Error sending sale confirmation SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get SMS Balance from MimSMS
 */
const getSMSBalance = async () => {
  return checkBalance();
};

const checkBalance = async () => {
  try {
    const apiKey = config.apiKey;
    
    if (!apiKey) {
      return { 
        success: false, 
        error: 'SMS credentials not configured',
        code: 'CONFIG_ERROR'
      };
    }
    
    const url = `${config.baseUrl.replace(/\/$/, '')}/api/balance`;
    
    console.log('=== CHECKING SMS BALANCE ===');
    const response = await axios.get(url, { 
      params: { api_key: apiKey }
    });
    
    const balance = response.data?.balance || response.data?.Balance || response.data;
    
    return {
      success: true,
      balance: isNaN(parseFloat(balance)) ? null : parseFloat(balance),
      currency: 'BDT',
      message: 'Account active',
      status: 'active',
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR',
      balance: null
    };
  }
};

const areCredentialsConfigured = () => {
  return !!config.apiKey && !!config.senderId;
};

module.exports = {
  sendSMS,
  sendSingleSms,
  sendBulkSms,
  sendDynamicSms,
  sendSaleConfirmationSMS,
  getSMSBalance,
  checkBalance,
  areCredentialsConfigured
};
