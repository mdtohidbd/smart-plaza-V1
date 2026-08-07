// pdfmake 0.3.x exports a singleton: use setFonts + createPdf + getBuffer (not `new PdfPrinter()`).
const pdfMake = require('pdfmake');
const path = require('path');
const fs = require('fs');

// Standard fonts configuration for pdfmake
const standardFonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const getAssetAsBase64 = (relativePath) => {
  try {
    const fullPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(fullPath)) {
      return `data:image/jpeg;base64,${fs.readFileSync(fullPath).toString('base64')}`;
    }
  } catch (e) {
    console.error(`Error loading asset ${relativePath}:`, e);
  }
  return null;
};

const generateInvoicePDF = async (saleOrOrder, companyInfo) => {
  try {
    pdfMake.setFonts(standardFonts);

    const isSaleOrder = saleOrOrder.orderNumber !== undefined;
    const invoiceOrOrderNumber = saleOrOrder.invoiceNumber || saleOrOrder.orderNumber || 'N/A';
    const documentType = 'INVOICE';

    const logoBase64 = getAssetAsBase64('public/logo.jpeg') || getAssetAsBase64('../frontend/src/assets/logo.jpeg');
    const qrBase64 = getAssetAsBase64('../frontend/src/assets/qr.png');

    // Logic for dual totals (Customer vs Govt)
    const originalTotal = saleOrOrder.total || 0;
    let customerTotal = originalTotal;
    let govtTotal = originalTotal;
    let extraFee = 0;

    if (originalTotal > 100000) {
      customerTotal = 100000;
      extraFee = 1000;
      govtTotal = originalTotal + extraFee;
    } else if (originalTotal > 50000) {
      customerTotal = 50000;
      extraFee = 500;
      govtTotal = originalTotal + extraFee;
    }

    const docDefinition = {
      content: [
        // Header - Professional Black & White
        {
          columns: [
            {
              stack: [
                logoBase64 ? { image: logoBase64, width: 60 } : {},
                { 
                  text: companyInfo.companyName || 'Demo Electronics ERP', 
                  fontSize: 14, 
                  bold: true, 
                  margin: [0, 3, 0, 0] 
                },
                { 
                  text: companyInfo.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Bangladesh, 9100', 
                  fontSize: 8, 
                  margin: [0, 2, 0, 0],
                  lineHeight: 1.3
                },
                { 
                  text: `Phone: ${companyInfo.phone || companyInfo.contactNumber || '01842-144844'}`, 
                  fontSize: 8, 
                  margin: [0, 2, 0, 0] 
                },
                { 
                  text: `Email: ${companyInfo.email || 'admin@yourskybridge.com'}`, 
                  fontSize: 8,
                  margin: [0, 1, 0, 0]
                }
              ]
            },
            {
              stack: [
                { 
                  text: documentType, 
                  fontSize: 22, 
                  bold: true, 
                  alignment: 'right', 
                  margin: [0, 0, 0, 8] 
                },
                { 
                  table: {
                    widths: ['auto', 'auto'],
                    body: [
                      [
                        { text: 'Invoice #:', bold: true, fontSize: 8 },
                        { text: invoiceOrOrderNumber, fontSize: 8, alignment: 'right' }
                      ],
                      [
                        { text: 'Date:', bold: true, fontSize: 8 },
                        { text: new Date(saleOrOrder.date).toLocaleDateString(), fontSize: 8, alignment: 'right' }
                      ],
                      [
                        { text: 'Status:', bold: true, fontSize: 8 },
                        { text: saleOrOrder.status || saleOrOrder.approvalStatus || 'N/A', fontSize: 8, alignment: 'right' }
                      ]
                    ]
                  },
                  layout: 'noBorders'
                }
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 12]
        },
        
        // Separator Line
        { 
          canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#000000' }], 
          margin: [0, 0, 0, 15] 
        },

        // Bill To Section
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'Bill To:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
                { text: saleOrOrder.customer?.contactName || 'N/A', fontSize: 10, bold: true },
                { text: saleOrOrder.customer?.contactNumber || '', fontSize: 9, margin: [0, 2, 0, 0] },
                { 
                  text: saleOrOrder.customer?.address || saleOrOrder.shippingAddress || '', 
                  fontSize: 9,
                  lineHeight: 1.3,
                  margin: [0, 2, 0, 0]
                }
              ]
            },
            { width: '50%', text: '' }
          ],
          margin: [0, 0, 0, 15]
        },

        // Items Table - Clean Black & White
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Product', bold: true, fontSize: 9 },
                { text: 'Qty', bold: true, fontSize: 9, alignment: 'center' },
                { text: 'Price', bold: true, fontSize: 9, alignment: 'right' },
                { text: 'Disc', bold: true, fontSize: 9, alignment: 'right' },
                { text: 'Tax', bold: true, fontSize: 9, alignment: 'right' },
                { text: 'Total', bold: true, fontSize: 9, alignment: 'right' }
              ],
              ...saleOrOrder.items.map(item => {
                const productName = item.product?.name || (typeof item.product === 'string' ? item.product : 'Product');
                const total = (item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0);
                
                let productCell = { text: productName, fontSize: 9 };
                if (item.warrantyName) {
                  productCell = {
                    stack: [
                      { text: productName, fontSize: 9 },
                      { text: `Warranty: ${item.warrantyName}${item.warrantyDurationMonths ? ` (${item.warrantyDurationMonths} Months)` : ''}`, fontSize: 7, color: '#666666', margin: [0, 2, 0, 0] }
                    ]
                  };
                }

                return [
                  productCell,
                  { text: item.quantity.toString(), fontSize: 9, alignment: 'center' },
                  { text: item.unitPrice.toFixed(2), fontSize: 9, alignment: 'right' },
                  { text: (item.discount || 0).toFixed(2), fontSize: 9, alignment: 'right' },
                  { text: (item.tax || 0).toFixed(2), fontSize: 9, alignment: 'right' },
                  { text: total.toFixed(2), fontSize: 9, alignment: 'right', bold: true }
                ];
              })
            ]
          },
          layout: {
            hLineWidth: function(i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
            vLineWidth: function() { return 0; },
            hLineColor: function() { return '#000000'; },
            paddingLeft: function() { return 4; },
            paddingRight: function() { return 4; },
            paddingTop: function() { return 3; },
            paddingBottom: function() { return 3; }
          },
          margin: [0, 0, 0, 15]
        },

        // Summary - Dual Totals (Customer & Govt)
        {
          columns: [
            { text: '', width: '*' },
            {
              width: 280,
              table: {
                widths: ['*', 'auto', 'auto'],
                body: [
                  [
                    { text: '', border: [false, false, false, true] }, 
                    { text: 'CUSTOMER', bold: true, fontSize: 9, alignment: 'center', border: [false, false, false, true] }, 
                    { text: 'GOVT', bold: true, fontSize: 9, alignment: 'center', border: [false, false, false, true] }
                  ],
                  [
                    { text: 'Subtotal:', fontSize: 9 }, 
                    { text: (saleOrOrder.subTotal || 0).toFixed(2), fontSize: 9, alignment: 'right' }, 
                    { text: (saleOrOrder.subTotal || 0).toFixed(2), fontSize: 9, alignment: 'right' }
                  ],
                  [
                    { text: 'Discount:', fontSize: 9 }, 
                    { text: `-${(saleOrOrder.discount || 0).toFixed(2)}`, fontSize: 9, alignment: 'right' }, 
                    { text: `-${(saleOrOrder.discount || 0).toFixed(2)}`, fontSize: 9, alignment: 'right' }
                  ],
                  [
                    { text: 'Tax:', fontSize: 9 }, 
                    { text: `+${(saleOrOrder.tax || 0).toFixed(2)}`, fontSize: 9, alignment: 'right' }, 
                    { text: `+${(saleOrOrder.tax || 0).toFixed(2)}`, fontSize: 9, alignment: 'right' }
                  ],
                  extraFee > 0 ? [
                    { text: 'Extra Fee:', fontSize: 9 }, 
                    { text: '', fontSize: 9 }, 
                    { text: `+${extraFee.toFixed(2)}`, fontSize: 9, alignment: 'right' }
                  ] : ['', '', ''],
                  [
                    { text: 'Total:', fontSize: 10, bold: true }, 
                    { text: customerTotal.toFixed(2), fontSize: 10, bold: true, alignment: 'right' }, 
                    { text: govtTotal.toFixed(2), fontSize: 10, bold: true, alignment: 'right' }
                  ],
                  ...(saleOrOrder.payments && saleOrOrder.payments.length > 0 ? saleOrOrder.payments.map(p => {
                    let pName = p.method;
                    if (p.method === 'Card' && p.posMachineName) pName += ` (${p.posMachineName})`;
                    if (p.method === 'MFS' && p.mfsProviderName) pName += ` (${p.mfsProviderName})`;
                    if (p.method === 'Bank' && p.bankName) pName += ` (${p.bankName})`;
                    return [
                      { text: `Paid (${pName}):`, fontSize: 9 },
                      { text: (p.amount || 0).toFixed(2), fontSize: 9, alignment: 'right' },
                      { text: (p.amount || 0).toFixed(2), fontSize: 9, alignment: 'right' }
                    ];
                  }) : [[
                    { text: `Paid${saleOrOrder.paymentMethod ? ' (' + saleOrOrder.paymentMethod + ')' : ''}:`, fontSize: 9 }, 
                    { text: (saleOrOrder.paidAmount || 0).toFixed(2), fontSize: 9, alignment: 'right' }, 
                    { text: (saleOrOrder.paidAmount || 0).toFixed(2), fontSize: 9, alignment: 'right' }
                  ]]),
                  [
                    { text: 'Due:', fontSize: 9, bold: true }, 
                    { text: Math.max(0, customerTotal - (saleOrOrder.paidAmount || 0)).toFixed(2), fontSize: 9, bold: true, alignment: 'right' }, 
                    { text: Math.max(0, govtTotal - (saleOrOrder.paidAmount || 0)).toFixed(2), fontSize: 9, bold: true, alignment: 'right' }
                  ]
                ].filter(Boolean)
              },
              layout: {
                hLineWidth: function(i, node) { 
                  if (i === 0 || i === node.table.body.length) return 1;
                  if (i === 1) return 1; // After header
                  return 0.5;
                },
                vLineWidth: function() { return 0.5; },
                hLineColor: function() { return '#000000'; },
                vLineColor: function() { return '#000000'; },
                paddingLeft: function() { return 5; },
                paddingRight: function() { return 5; },
                paddingTop: function() { return 3; },
                paddingBottom: function() { return 3; }
              }
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Footer
        {
          columns: [
            {
              stack: [
                { text: 'Terms & Conditions:', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                { text: '1. Goods once sold are not returnable.', fontSize: 8 },
                { text: '2. This is a computer generated document.', fontSize: 8 }
              ]
            },
            qrBase64 ? { image: qrBase64, width: 60, alignment: 'right' } : { text: '' }
          ]
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
      },
      defaultStyle: {
        fontSize: 10,
        color: '#000000'
      }
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  } catch (err) {
    console.error('PDF generation failed:', err);
    throw err;
  }
};

const buildInvoiceHTML = (saleOrOrder, companyInfo, autoPrint = false) => {
  const isSaleOrder = saleOrOrder.orderNumber !== undefined;
  const invoiceOrOrderNumber = saleOrOrder.invoiceNumber || saleOrOrder.orderNumber || 'N/A';
  const documentType = 'INVOICE';

  // Logic for dual totals (Customer vs Govt)
  const originalTotal = saleOrOrder.total || 0;
  let customerTotal = originalTotal;
  let govtTotal = originalTotal;
  let extraFee = 0;

  if (originalTotal > 100000) {
    customerTotal = 100000;
    extraFee = 1000;
    govtTotal = originalTotal + extraFee;
  } else if (originalTotal > 50000) {
    customerTotal = 50000;
    extraFee = 500;
    govtTotal = originalTotal + extraFee;
  }

  const companyName = companyInfo.companyName || 'Demo Electronics ERP';
  const companyAddress = companyInfo.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Bangladesh, 9100';
  const companyPhone = companyInfo.phone || companyInfo.contactNumber || '01842-144844';
  const companyEmail = companyInfo.email || 'admin@yourskybridge.com';

  const customerName = saleOrOrder.customer?.contactName || 'N/A';
  const customerPhone = saleOrOrder.customer?.contactNumber || '';
  const customerAddress = saleOrOrder.customer?.address || saleOrOrder.shippingAddress || '';

  const dateStr = new Date(saleOrOrder.date).toLocaleDateString();
  const status = saleOrOrder.status || saleOrOrder.approvalStatus || 'N/A';

  // Build items rows
  const itemRowsHtml = saleOrOrder.items.map(item => {
    const productName = item.product?.name || (typeof item.product === 'string' ? item.product : 'Product');
    const total = (item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0);
    
    let productHtml = productName;
    if (item.warrantyName) {
      productHtml += `<br><span style="font-size: 11px; color: #64748B;">Warranty: ${item.warrantyName}${item.warrantyDurationMonths ? ` (${item.warrantyDurationMonths} Months)` : ''}</span>`;
    }

    return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: left; font-size: 13px;">${productHtml}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px;">৳${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px;">৳${(item.discount || 0).toFixed(2)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px;">৳${(item.tax || 0).toFixed(2)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px; font-weight: bold;">৳${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subTotalStr = (saleOrOrder.subTotal || 0).toFixed(2);
  const discountStr = (saleOrOrder.discount || 0).toFixed(2);
  const taxStr = (saleOrOrder.tax || 0).toFixed(2);
  const customerTotalStr = customerTotal.toFixed(2);
  const govtTotalStr = govtTotal.toFixed(2);
  const paidStr = (saleOrOrder.paidAmount || 0).toFixed(2);
  const customerDueStr = Math.max(0, customerTotal - (saleOrOrder.paidAmount || 0)).toFixed(2);
  const govtDueStr = Math.max(0, govtTotal - (saleOrOrder.paidAmount || 0)).toFixed(2);

  let paymentsHtml = '';
  if (saleOrOrder.payments && saleOrOrder.payments.length > 0) {
    paymentsHtml = saleOrOrder.payments.map(p => {
      let pName = p.method;
      if (p.method === 'Card' && p.posMachineName) pName += ` (${p.posMachineName})`;
      if (p.method === 'MFS' && p.mfsProviderName) pName += ` (${p.mfsProviderName})`;
      if (p.method === 'Bank' && p.bankName) pName += ` (${p.bankName})`;
      return `
          <tr>
            <td style="border-right: 1px solid #E2E8F0; font-weight: 500;">Paid (${pName}):</td>
            <td style="text-align: right; color: #059669; border-right: 1px solid #E2E8F0;">৳${(p.amount || 0).toFixed(2)}</td>
            <td style="text-align: right; color: #059669;">৳${(p.amount || 0).toFixed(2)}</td>
          </tr>
      `;
    }).join('');
  } else {
    paymentsHtml = `
          <tr>
            <td style="border-right: 1px solid #E2E8F0; font-weight: 500;">Paid${saleOrOrder.paymentMethod ? ' (' + saleOrOrder.paymentMethod + ')' : ''}:</td>
            <td style="text-align: right; color: #059669; border-right: 1px solid #E2E8F0;">৳${paidStr}</td>
            <td style="text-align: right; color: #059669;">৳${paidStr}</td>
          </tr>
    `;
  }

  const extraFeeRow = extraFee > 0 ? `
    <tr>
      <td style="padding: 6px 8px; text-align: left; border-right: 1px solid #E2E8F0;">Extra Fee:</td>
      <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #E2E8F0; color: #64748B;">-</td>
      <td style="padding: 6px 8px; text-align: right; font-weight: 500;">+৳${extraFee.toFixed(2)}</td>
    </tr>
  ` : '';

  const autoPrintScript = autoPrint ? `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    </script>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Print Invoice - ${invoiceOrOrderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1E293B;
      background-color: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #FFF;
    }
    .no-print-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }
    .print-btn {
      background: linear-gradient(135deg, #1D5F99 0%, #42A2C2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    .print-btn:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .company-details h1 {
      font-size: 26px;
      margin: 0 0 8px 0;
      color: #0F172A;
      font-weight: 800;
    }
    .company-details p {
      font-size: 13px;
      margin: 3px 0;
      color: #475569;
      line-height: 1.4;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 28px;
      margin: 0 0 12px 0;
      color: #0F172A;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .meta-table {
      border-collapse: collapse;
      margin-left: auto;
    }
    .meta-table td {
      padding: 4px 8px;
      font-size: 13px;
      color: #334155;
    }
    .meta-table td.label {
      font-weight: 600;
      color: #475569;
      text-align: right;
    }
    .meta-table td.val {
      text-align: right;
    }
    .divider {
      border-top: 2px solid #0F172A;
      margin: 20px 0;
    }
    .bill-to {
      margin-bottom: 30px;
    }
    .bill-to h3 {
      font-size: 13px;
      margin: 0 0 8px 0;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .bill-to p {
      font-size: 14px;
      margin: 4px 0;
      color: #1E293B;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background-color: #F8FAFC;
      color: #475569;
      font-weight: 700;
      font-size: 12px;
      padding: 12px 8px;
      text-align: right;
      border-bottom: 2px solid #0F172A;
    }
    .items-table th:first-child {
      text-align: left;
    }
    .items-table th:nth-child(2) {
      text-align: center;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .summary-table {
      width: 340px;
      border-collapse: collapse;
      border: 1px solid #E2E8F0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .summary-table th {
      background-color: #F8FAFC;
      font-weight: 700;
      font-size: 12px;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
      padding: 8px;
      text-align: right;
    }
    .summary-table th:first-child {
      text-align: left;
    }
    .summary-table td {
      padding: 8px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #F1F5F9;
    }
    .summary-table tr:last-child td {
      border-bottom: none;
    }
    .terms-section {
      margin-top: 60px;
      border-top: 1px solid #E2E8F0;
      padding-top: 20px;
    }
    .terms-section h4 {
      font-size: 14px;
      margin: 0 0 8px 0;
      color: #334155;
      font-weight: 700;
    }
    .terms-section p {
      font-size: 12px;
      margin: 4px 0;
      color: #64748B;
      line-height: 1.5;
    }
    @media print {
      body {
        padding: 20px;
        background-color: #FFFFFF;
      }
      .no-print-bar {
        display: none;
      }
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Action bar (hidden on print) -->
    <div class="no-print-bar">
      <button class="print-btn" onclick="window.print()">Print Invoice</button>
    </div>

    <!-- Header Section -->
    <div class="header-section">
      <div class="company-details">
        <h1>${companyName}</h1>
        <p>${companyAddress}</p>
        <p>Phone: ${companyPhone}</p>
        <p>Email: ${companyEmail}</p>
      </div>
      <div class="invoice-meta">
        <h2>${documentType}</h2>
        <table class="meta-table">
          <tr>
            <td class="label">Invoice #:</td>
            <td class="val" style="font-weight: 700; color: #1D5F99;">${invoiceOrOrderNumber}</td>
          </tr>
          <tr>
            <td class="label">Date:</td>
            <td class="val">${dateStr}</td>
          </tr>
          <tr>
            <td class="label">Status:</td>
            <td class="val"><span style="background-color: #F1F5F9; color: #334155; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${status}</span></td>
          </tr>
        </table>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Bill To customer details -->
    <div class="bill-to">
      <h3>Bill To</h3>
      <p style="font-weight: 700; font-size: 16px; color: #0F172A;">${customerName}</p>
      <p style="font-weight: 500;">${customerPhone}</p>
      <p style="color: #475569;">${customerAddress}</p>
    </div>

    <!-- Items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 45%;">Product</th>
          <th style="text-align: center; width: 10%;">Qty</th>
          <th style="text-align: right; width: 15%;">Unit Price</th>
          <th style="text-align: right; width: 10%;">Discount</th>
          <th style="text-align: right; width: 10%;">Tax</th>
          <th style="text-align: right; width: 10%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- Totals Summary -->
    <div class="summary-section">
      <table class="summary-table">
        <thead>
          <tr>
            <th style="border-right: 1px solid #E2E8F0;">Summary</th>
            <th style="border-right: 1px solid #E2E8F0; text-align: right;">Customer</th>
            <th style="text-align: right;">Govt</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border-right: 1px solid #E2E8F0; font-weight: 500;">Subtotal:</td>
            <td style="text-align: right; border-right: 1px solid #E2E8F0;">৳${subTotalStr}</td>
            <td style="text-align: right;">৳${subTotalStr}</td>
          </tr>
          <tr>
            <td style="border-right: 1px solid #E2E8F0; font-weight: 500;">Discount:</td>
            <td style="text-align: right; color: #DC2626; border-right: 1px solid #E2E8F0;">-৳${discountStr}</td>
            <td style="text-align: right; color: #DC2626;">-৳${discountStr}</td>
          </tr>
          <tr>
            <td style="border-right: 1px solid #E2E8F0; font-weight: 500;">Tax:</td>
            <td style="text-align: right; border-right: 1px solid #E2E8F0;">+৳${taxStr}</td>
            <td style="text-align: right;">+৳${taxStr}</td>
          </tr>
          ${extraFeeRow}
          <tr style="font-weight: 700; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
            <td style="border-right: 1px solid #E2E8F0;">Total:</td>
            <td style="text-align: right; border-right: 1px solid #E2E8F0; color: #1D5F99;">৳${customerTotalStr}</td>
            <td style="text-align: right; color: #0D9488;">৳${govtTotalStr}</td>
          </tr>
          ${paymentsHtml}
          <tr style="font-weight: 700; border-top: 1px solid #E2E8F0; background-color: #FFF5F5;">
            <td style="border-right: 1px solid #E2E8F0; color: #E53E3E;">Due Amount:</td>
            <td style="text-align: right; color: #E53E3E; border-right: 1px solid #E2E8F0;">৳${customerDueStr}</td>
            <td style="text-align: right; color: #E53E3E;">৳${govtDueStr}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Terms and conditions -->
    <div class="terms-section">
      <h4>Terms & Conditions:</h4>
      <p>1. Goods once sold are not returnable or exchangeable.</p>
      <p>2. Please check and verify all items during reception.</p>
      <p>3. This is a computer generated document, authorized signatures are registered digitally.</p>
    </div>
  </div>

  ${autoPrintScript}
</body>
</html>`;
};

const generateInvoiceHTMLString = async (saleOrOrder, companyInfo) => {
  return buildInvoiceHTML(saleOrOrder, companyInfo, false);
};

const generateInvoiceHTMLForPrint = (saleOrOrder, companyInfo) => {
  return buildInvoiceHTML(saleOrOrder, companyInfo, true);
};

module.exports = {
  generateInvoicePDF,
  generateInvoiceHTMLString,
  generateInvoiceHTMLForPrint
};
