const asyncHandler = require('express-async-handler');
const smsService = require('../utils/smsService');

// @desc    Test SMS configuration
// @route   POST /api/sms/test-config
// @access  Private
const testSmsConfig = asyncHandler(async (req, res) => {
  const isConfigured = smsService.areCredentialsConfigured();
  
  res.status(200).json({
    success: true,
    isConfigured,
    message: isConfigured ? 'SMS configuration is valid' : 'SMS configuration is missing required credentials'
  });
});

// @desc    Send single SMS
// @route   POST /api/sms/send
// @access  Private
const sendSms = asyncHandler(async (req, res) => {
  const { phoneNumber, message, transactionType } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and message are required'
    });
  }

  try {
    const result = await smsService.sendSingleSms(phoneNumber, message, transactionType);
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Send bulk SMS
// @route   POST /api/sms/send-bulk
// @access  Private
const sendBulkSms = asyncHandler(async (req, res) => {
  const { phoneNumbers, message, transactionType } = req.body;

  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0 || !message) {
    return res.status(400).json({
      success: false,
      message: 'Phone numbers array and message are required'
    });
  }

  try {
    const result = await smsService.sendBulkSms(phoneNumbers, message, transactionType);
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Send dynamic SMS
// @route   POST /api/sms/send-dynamic
// @access  Private
const sendDynamicSms = asyncHandler(async (req, res) => {
  const { recipients } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Recipients array is required'
    });
  }

  // Validate recipients format
  for (const recipient of recipients) {
    if (!recipient.phoneNumber || !recipient.message) {
      return res.status(400).json({
        success: false,
        message: 'Each recipient must have phoneNumber and message'
      });
    }
  }

  try {
    const result = await smsService.sendDynamicSms(recipients);
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Check SMS balance
// @route   GET /api/sms/balance
// @access  Private
const checkSmsBalance = asyncHandler(async (req, res) => {
  try {
    const result = await smsService.checkBalance();
    
    res.status(result.success ? 200 : 500).json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update SMS configuration
// @route   PUT /api/sms/config
// @access  Private
const updateSmsConfig = asyncHandler(async (req, res) => {
  const { username, apikey, senderName, baseUrl } = req.body;

  // Validate required fields
  if (!username || !apikey || !senderName) {
    return res.status(400).json({
      success: false,
      message: 'Username, API key, and sender name are required'
    });
  }

  try {
    // Update environment variables in memory
    process.env.MIM_SMS_USERNAME = username;
    process.env.MIM_SMS_APIKEY = apikey;
    process.env.MIM_SMS_SENDER_NAME = senderName;
    if (baseUrl) {
      process.env.MIM_SMS_API_BASE_URL = baseUrl;
    }

    // Update the SMS service instance with new credentials
    smsService.username = username;
    smsService.apikey = apikey;
    smsService.senderName = senderName;
    if (baseUrl) {
      smsService.baseUrl = baseUrl;
    }

    // Try to update the .env file if it exists
    const envPath = require('path').join(__dirname, '../../.env');
    if (require('fs').existsSync(envPath)) {
      let envContent = require('fs').readFileSync(envPath, 'utf8');
      
      // Update or add the SMS configuration variables
      envContent = envContent.replace(/MIM_SMS_USERNAME=.*/, `MIM_SMS_USERNAME=${username}`);
      envContent = envContent.replace(/MIM_SMS_APIKEY=.*/, `MIM_SMS_APIKEY=${apikey}`);
      envContent = envContent.replace(/MIM_SMS_SENDER_NAME=.*/, `MIM_SMS_SENDER_NAME=${senderName}`);
      
      if (baseUrl) {
        if (envContent.includes('MIM_SMS_API_BASE_URL=')) {
          envContent = envContent.replace(/MIM_SMS_API_BASE_URL=.*/, `MIM_SMS_API_BASE_URL=${baseUrl}`);
        } else {
          envContent += `\nMIM_SMS_API_BASE_URL=${baseUrl}`;
        }
      } else if (!envContent.includes('MIM_SMS_API_BASE_URL=')) {
        envContent += `\nMIM_SMS_API_BASE_URL=https://api.mimsms.com`;
      }
      
      require('fs').writeFileSync(envPath, envContent);
    }

    res.status(200).json({
      success: true,
      message: 'SMS configuration updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get current SMS configuration (without sensitive data)
// @route   GET /api/sms/config
// @access  Private
const getSmsConfig = asyncHandler(async (req, res) => {
  const isConfigured = smsService.areCredentialsConfigured();
  
  res.status(200).json({
    success: true,
    data: {
      isConfigured,
      hasUsername: !!process.env.MIM_SMS_USERNAME,
      hasApikey: !!process.env.MIM_SMS_APIKEY,
      hasSenderName: !!process.env.MIM_SMS_SENDER_NAME,
      baseUrl: process.env.MIM_SMS_API_BASE_URL || 'https://api.mimsms.com'
    }
  });
});

module.exports = {
  testSmsConfig,
  sendSms,
  sendBulkSms,
  sendDynamicSms,
  checkSmsBalance,
  updateSmsConfig,
  getSmsConfig
};