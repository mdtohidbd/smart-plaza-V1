const cron = require('node-cron');
const moment = require('moment');
const EMIInvoice = require('../models/EMIInvoice');
const smsService = require('../utils/smsService');
const Notification = require('../models/Notification'); // Assuming a Notification model exists or we just console.log for now

const checkOverdueEMIs = async () => {
  try {
    const today = moment().startOf('day').toDate();
    
    // Find EMIs that are pending and due date has passed within instalments array
    const invoices = await EMIInvoice.find({ 
      'instalments': {
        $elemMatch: {
          status: 'pending',
          dueDate: { $lt: today }
        }
      }
    });

    let modifiedCount = 0;
    
    for (const invoice of invoices) {
      let isModified = false;
      invoice.instalments.forEach(inst => {
        if (inst.status === 'pending' && inst.dueDate < today) {
          inst.status = 'overdue';
          isModified = true;
        }
      });
      if (isModified) {
        await invoice.save();
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      console.log(`[EMI Job] Updated ${modifiedCount} EMI invoices with overdue instalments.`);
    } else {
      console.log(`[EMI Job] No new overdue EMIs found.`);
    }
  } catch (error) {
    console.error(`[EMI Job] Error checking overdue EMIs:`, error);
  }
};

const sendEMIReminders = async () => {
  try {
    // Send message exactly 2 days before deadline
    const twoDaysFromNowStart = moment().add(2, 'days').startOf('day').toDate();
    const twoDaysFromNowEnd = moment().add(2, 'days').endOf('day').toDate();

    // Find EMIs with an instalment due in exactly 2 days
    const upcomingEMIs = await EMIInvoice.find({
      'instalments': {
        $elemMatch: {
          status: 'pending',
          dueDate: { $gte: twoDaysFromNowStart, $lte: twoDaysFromNowEnd }
        }
      }
    });

    if (upcomingEMIs.length > 0) {
      console.log(`[EMI Job] Found ${upcomingEMIs.length} EMIs due in 2 days. Sending reminders...`);
      for (const emi of upcomingEMIs) {
        // Find the specific instalment due
        const dueInstalment = emi.instalments.find(inst => 
          inst.status === 'pending' && 
          moment(inst.dueDate).isBetween(twoDaysFromNowStart, twoDaysFromNowEnd, null, '[]')
        );

        if (dueInstalment && emi.customerPhone) {
          const formattedDate = moment(dueInstalment.dueDate).format('DD MMM YYYY');
          const message = `Reminder: Dear ${emi.customerName}, your upcoming EMI instalment of ৳${dueInstalment.amount} for Invoice ${emi.invoiceNumber} is due on ${formattedDate}. Please pay on time. Thank you!`;
          
          const smsResult = await smsService.sendSingleSms(emi.customerPhone, message);
          if (smsResult.success) {
            console.log(`[EMI Job] Sent reminder to ${emi.customerPhone} for invoice ${emi.invoiceNumber}`);
          } else {
            console.error(`[EMI Job] Failed to send reminder to ${emi.customerPhone}: ${smsResult.error}`);
          }
        }
      }
    } else {
      console.log(`[EMI Job] No EMIs due in exactly 2 days.`);
    }
    
    // Also remind for overdue
    const todayStart = moment().startOf('day').toDate();
    const overdueEMIs = await EMIInvoice.find({
      'instalments': {
        $elemMatch: {
          status: 'overdue'
        }
      }
    });

    if (overdueEMIs.length > 0) {
      console.log(`[EMI Job] Found ${overdueEMIs.length} invoices with overdue EMIs. Sending alerts...`);
      // Optional: limit spam by only sending overdue alerts once a week, or logic here
    }

  } catch (error) {
    console.error(`[EMI Job] Error sending EMI reminders:`, error);
  }
};

const scheduleEMIJobs = () => {
  // Run every day at 12:05 AM (0 5 0 * * *)
  cron.schedule('5 0 * * *', () => {
    console.log('[Cron] Running daily EMI job...');
    checkOverdueEMIs();
    sendEMIReminders();
  });
  
  console.log('[Cron] EMI jobs scheduled.');
};

module.exports = {
  scheduleEMIJobs,
  checkOverdueEMIs,
  sendEMIReminders
};
