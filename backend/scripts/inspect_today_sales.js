require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const inspectSales = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Sale = require('../models/Sale');
    const sales = await Sale.find().lean();
    console.log(`Found ${sales.length} sales in DB:\n`);

    sales.forEach((s, idx) => {
      console.log(`--- SALE #${idx + 1} ---`);
      console.log('ID:', s._id);
      console.log('Invoice:', s.invoiceNumber);
      console.log('Status:', s.status);
      console.log('Date:', s.date || s.createdAt);
      console.log('Total (Selling Price):', s.total);
      console.log('SubTotal:', s.subTotal);
      console.log('Discount:', s.discount);
      console.log('Delivery Charge:', s.deliveryCharge);
      console.log('Installation Cost:', s.installationCost);
      console.log('Additional Expense:', s.additionalExpense);
      console.log('Items:', JSON.stringify(s.items, null, 2));
      console.log('Payments:', JSON.stringify(s.payments, null, 2));
      console.log('CustomerTax / Invoices:', JSON.stringify(s.invoices, null, 2));
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

inspectSales();
