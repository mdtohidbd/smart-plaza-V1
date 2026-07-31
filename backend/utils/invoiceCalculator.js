/**
 * Invoice calculation utility for Retail Sales.
 * Generates the 4 distinct invoices (Customer Sales, Customer Tax, Fabricated Sales, Fabricated Tax)
 */

/**
 * Common Fabricated Price Logic
 * If original selling price < 50,000 BDT -> Purchase Price + 500
 * If original selling price >= 50,000 BDT -> Purchase Price + 1000
 */
const getFabricatedPrice = (sellingPrice, purchasePrice) => {
  if (sellingPrice < 50000) {
    return purchasePrice + 500;
  }
  return purchasePrice + 1000;
};

/**
 * Invoice 1 - Customer Sales Invoice
 */
const buildCustomerSalesInvoice = (saleData, productsDetails) => {
  const items = productsDetails.map(item => ({
    productId: item.productId,
    productName: item.productName,
    serialNumber: item.serialNumber || '',
    model: item.model || '',
    warranty: item.warranty || '',
    mrp: item.mrp || 0,
    unitPrice: item.unitPrice,
    discount: item.discount || 0,
    quantity: item.quantity,
    total: (item.unitPrice - (item.discount || 0)) * item.quantity
  }));

  const subTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalItemDiscounts = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  let discount = saleData.discount || 0;
  const deliveryCharge = parseFloat(saleData.deliveryCharge) || 0;
  const installationCost = parseFloat(saleData.installationCost) || 0;
  const additionalExpense = parseFloat(saleData.additionalExpense) || 0;
  const isOperatingExpense = saleData.isOperatingExpense === true;
  const isOperatingDelivery = saleData.isOperatingDelivery === true;
  const isOperatingInstallation = saleData.isOperatingInstallation === true;
  
  // Use saleData.total as the payableAmount directly (this is the actual grand total of the sale)
  let payableAmount = saleData.total || (subTotal - totalItemDiscounts - discount + 
    (isOperatingDelivery ? 0 : deliveryCharge) + 
    (isOperatingInstallation ? 0 : installationCost) + 
    (isOperatingExpense ? 0 : additionalExpense));

  // Ensure discount is calculated correctly if payableAmount is set from saleData.total
  const calculatedWithoutDiscount = subTotal - totalItemDiscounts + 
    (isOperatingDelivery ? 0 : deliveryCharge) + 
    (isOperatingInstallation ? 0 : installationCost) + 
    (isOperatingExpense ? 0 : additionalExpense);
  
  // If we have saleData.total, adjust the discount to match the difference
  if (saleData.total) {
    discount = Math.max(0, calculatedWithoutDiscount - saleData.total);
  }

  const isEmi = saleData.isEmi === true;

  let cashPaid = 0;
  let cardPaid = 0;
  let amountPaid = saleData.paidAmount || 0;

  if (saleData.payments && Array.isArray(saleData.payments) && saleData.payments.length > 0) {
    cashPaid = saleData.payments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    cardPaid = saleData.payments.filter(p => p.method !== 'Cash').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  } else {
    cashPaid = saleData.paymentMethod === 'Cash' ? saleData.paidAmount : 0;
    cardPaid = saleData.paymentMethod === 'Card' ? saleData.paidAmount : 0;
  }

  return {
    items,
    subTotal,
    totalItemDiscounts,
    discount,
    deliveryCharge,
    installationCost,
    additionalExpense,
    payableAmount,
    cashPaid,
    cardPaid,
    amountPaid,
    paidAmount: amountPaid,
    dueAmount: isEmi ? 0 : (saleData.dueAmount || 0),
    ...(isEmi && saleData.emiOption && {
      emiDetails: {
        downPayment: saleData.emiOption.downPayment || 0,
        duration: saleData.emiOption.duration || 12,
        interestRate: saleData.emiOption.interestRate || 0,
        monthlyInstalment: saleData.emiOption.monthlyInstalment || 
          (((payableAmount + (payableAmount * (saleData.emiOption.interestRate || 0) / 100)) - (saleData.emiOption.downPayment || 0)) / (saleData.emiOption.duration || 12)),
        totalPayable: (payableAmount + (payableAmount * (saleData.emiOption.interestRate || 0) / 100)) - (saleData.emiOption.downPayment || 0)
      }
    })
  };
};

/**
 * Invoice 2 - Customer Tax Invoice (VAT)
 */
const buildCustomerTaxInvoice = (saleData, productsDetails) => {
  const SALES_TAX_PERCENTAGE = 0.15; // 15% hardcoded for now, global setting later

  const items = productsDetails.map(item => {
    const salesValue = item.unitPrice * item.quantity;
    const purchaseValue = item.purchasePrice * item.quantity;
    const vatAmount = (salesValue - purchaseValue) * SALES_TAX_PERCENTAGE;
    const grandTotal = salesValue + vatAmount;

    return {
      productId: item.productId,
      goodsDescription: `${item.productName} ${item.model || ''}`.trim(),
      unit: item.unit || 'pcs',
      quantity: item.quantity,
      unitValue: item.unitPrice,
      salesValue,
      totalPurchaseValue: purchaseValue,
      totalSalesValue: salesValue,
      purchaseTaxPercent: item.purchaseTax || 0,
      salesTaxPercent: SALES_TAX_PERCENTAGE * 100,
      vatAmount,
      grandTotal
    };
  });

  const totalSalesValue = items.reduce((sum, item) => sum + item.salesValue, 0);
  const totalPurchaseValue = items.reduce((sum, item) => sum + item.totalPurchaseValue, 0);
  const totalVatAmount = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.grandTotal, 0);

  return {
    items,
    totalSalesValue,
    totalPurchaseValue,
    totalVatAmount,
    grandTotal
  };
};

/**
 * Invoice 3 - Fabricated Sales Invoice
 */
const buildFabricatedSalesInvoice = (saleData, productsDetails) => {
  const items = productsDetails.map(item => {
    const fabricatedPrice = getFabricatedPrice(item.unitPrice, item.purchasePrice);
    
    return {
      productId: item.productId,
      productName: item.productName,
      serialNumber: item.serialNumber || '',
      model: item.model || '',
      warranty: item.warranty || '',
      mrp: item.mrp || 0,
      unitPrice: fabricatedPrice,
      offerPrice: fabricatedPrice,
      quantity: item.quantity,
      total: fabricatedPrice * item.quantity
    };
  });

  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = 0; 
  
  const deliveryCharge = parseFloat(saleData.deliveryCharge) || 0;
  const installationCost = parseFloat(saleData.installationCost) || 0;
  const additionalExpense = parseFloat(saleData.additionalExpense) || 0;
  const isOperatingExpense = saleData.isOperatingExpense === true;
  const isOperatingDelivery = saleData.isOperatingDelivery === true;
  const isOperatingInstallation = saleData.isOperatingInstallation === true;
  const payableAmount = subTotal - discount + 
    (isOperatingDelivery ? 0 : deliveryCharge) + 
    (isOperatingInstallation ? 0 : installationCost) + 
    (isOperatingExpense ? 0 : additionalExpense);

  return {
    items,
    subTotal,
    discount,
    deliveryCharge,
    installationCost,
    additionalExpense,
    payableAmount,
    cashPaid: payableAmount, // Fabricated invoices usually show fully paid
    cardPaid: 0,
    amountPaid: payableAmount,
    paidAmount: payableAmount,
    dueAmount: 0
  };
};

/**
 * Invoice 4 - Fabricated Tax Invoice (Government)
 */
const buildFabricatedTaxInvoice = (saleData, productsDetails) => {
  const SALES_TAX_PERCENTAGE = 0.15; // 15%

  const items = productsDetails.map(item => {
    const fabricatedPrice = getFabricatedPrice(item.unitPrice, item.purchasePrice);
    const salesValue = fabricatedPrice * item.quantity;
    const purchaseValue = item.purchasePrice * item.quantity;
    const vatAmount = (salesValue - purchaseValue) * SALES_TAX_PERCENTAGE;
    const grandTotal = salesValue + vatAmount;

    return {
      productId: item.productId,
      goodsDescription: `${item.productName} ${item.model || ''}`.trim(),
      unit: item.unit || 'pcs',
      quantity: item.quantity,
      unitValue: fabricatedPrice,
      salesValue,
      totalPurchaseValue: purchaseValue,
      totalSalesValue: salesValue,
      purchaseTaxPercent: item.purchaseTax || 0,
      salesTaxPercent: SALES_TAX_PERCENTAGE * 100,
      vatAmount,
      grandTotal
    };
  });

  const totalSalesValue = items.reduce((sum, item) => sum + item.salesValue, 0);
  const totalPurchaseValue = items.reduce((sum, item) => sum + item.totalPurchaseValue, 0);
  const totalVatAmount = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.grandTotal, 0);

  return {
    items,
    totalSalesValue,
    totalPurchaseValue,
    totalVatAmount,
    grandTotal
  };
};

module.exports = {
  buildCustomerSalesInvoice,
  buildCustomerTaxInvoice,
  buildFabricatedSalesInvoice,
  buildFabricatedTaxInvoice
};
