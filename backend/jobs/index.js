const { scheduleEMIJobs } = require('./emiJobs');

const startCronJobs = () => {
  console.log('Initializing scheduled jobs...');
  
  // Schedule EMI jobs (overdue checks and reminders)
  scheduleEMIJobs();
  
  // Add more jobs here as needed in the future
};

module.exports = startCronJobs;
