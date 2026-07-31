const pdfMake = require('pdfmake');
const path = require('path');
const fs = require('fs');

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
      return `data:image/png;base64,${fs.readFileSync(fullPath).toString('base64')}`;
    }
  } catch (e) {
    console.error(`Error loading asset ${relativePath}:`, e);
  }
  return null;
};

const generateTransferInvoicePDF = async (transfer, companyInfo) => {
  try {
    pdfMake.setFonts(standardFonts);

    // Use logo-alternate.png like QuotationDetail
    const logoBase64 = getAssetAsBase64('public/logo-alternate.png') || getAssetAsBase64('../frontend/public/logo-alternate.png');

    const primaryColor = '#14B8A6'; // Teal
    const darkAccent = '#222222';
    const lightBg = '#F8FAFC';
    const borderColor = '#E2E8F0';
    const textColor = '#1E293B';
    const mutedColor = '#64748B';

    let statusColor = primaryColor;
    if (transfer.status === 'Completed') statusColor = '#10B981';
    else if (transfer.status === 'Partial') statusColor = '#F59E0B';
    else if (transfer.status === 'Pending') statusColor = '#EF4444';

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 160, 40, 80], // Top margin 160 for header, Bottom 80 for footer
      header: function(currentPage, pageCount) {
        return {
          stack: [
            {
              canvas: [
                // Dark accent background
                {
                  type: 'polyline',
                  closePath: true,
                  color: darkAccent,
                  points: [{ x: 360, y: 0 }, { x: 595.28, y: 0 }, { x: 595.28, y: 130 }, { x: 300, y: 130 }]
                },
                // Main Teal Polygon
                {
                  type: 'polyline',
                  closePath: true,
                  color: primaryColor,
                  points: [{ x: 375, y: 0 }, { x: 595.28, y: 0 }, { x: 595.28, y: 130 }, { x: 315, y: 130 }]
                }
              ],
              absolutePosition: { x: 0, y: 0 }
            },
            {
              columns: [
                {
                  width: '50%',
                  stack: [
                    {
                      columns: [
                        logoBase64 ? { image: logoBase64, width: 80, margin: [0, 0, 10, 0] } : {},
                        {
                          stack: [
                            {
                              text: [
                                { text: 'SMART ', color: '#f59e0b', fontSize: 24, bold: true },
                                { text: 'PLAZA', color: primaryColor, fontSize: 24, bold: true }
                              ]
                            },
                            { text: 'Electronics • Smartphones • Gadgets', fontSize: 8, color: '#4b5563', bold: true, margin: [0, 2, 0, 0] }
                          ],
                          margin: [0, 15, 0, 0] // Vertically center text with logo
                        }
                      ]
                    }
                  ],
                  margin: [40, 20, 0, 0]
                },
                {
                  width: '50%',
                  stack: [
                    { text: 'PRODUCT TRANSFER', fontSize: 22, bold: true, color: '#ffffff', alignment: 'right', margin: [0, 50, 40, 0], characterSpacing: 2 }
                  ]
                }
              ],
              height: 130
            }
          ]
        };
      },
      footer: function(currentPage, pageCount) {
        return {
          stack: [
            {
              canvas: [
                // Dark background full width
                { type: 'rect', x: 0, y: 0, w: 595.28, h: 60, color: darkAccent },
                // Teal overlap on left
                { type: 'polyline', closePath: true, color: primaryColor, points: [{x: 0, y: 0}, {x: 420, y: 0}, {x: 450, y: 60}, {x: 0, y: 60}] }
              ],
              absolutePosition: { x: 0, y: 0 }
            },
            {
              columns: [
                { text: `Phone: ${companyInfo?.phone || '01842-144844'}`, color: '#ffffff', fontSize: 10, margin: [40, 22, 0, 0], width: 'auto' },
                { text: `Email: ${companyInfo?.email || 'smartplazabd@gmail.com'}`, color: '#ffffff', fontSize: 10, margin: [20, 22, 0, 0], width: 'auto' },
                { text: `Address: ${companyInfo?.companyAddress || '1, KDA Avenue, Khulna'}`, color: '#ffffff', fontSize: 10, margin: [0, 22, 40, 0], width: '*', alignment: 'right' }
              ]
            }
          ]
        };
      },
      content: [
        // Top Info Row (Date & Transfer No)
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: [ { text: 'Date: ', bold: true }, new Date(transfer.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) ] },
                { text: 'To,', bold: true, margin: [0, 8, 0, 0] },
                transfer.contact?.businessName ? { text: transfer.contact.businessName, fontSize: 12, bold: true, color: textColor } : null,
                transfer.contact?.contactName ? { text: transfer.contact.contactName, fontSize: transfer.contact?.businessName ? 10 : 12, bold: !transfer.contact?.businessName, color: textColor } : null,
                transfer.contact?.address ? { text: transfer.contact.address, margin: [0, 2, 0, 0] } : null,
                transfer.contact?.contactNumber ? { text: transfer.contact.contactNumber } : null
              ].filter(Boolean),
              fontSize: 10
            },
            {
              width: '50%',
              stack: [
                { text: [ { text: 'Transfer No: ', bold: true }, transfer.referenceNumber ] },
                { text: [ { text: 'Status: ', bold: true }, { text: transfer.status.toUpperCase(), color: statusColor, bold: true } ] }
              ],
              alignment: 'right',
              fontSize: 10
            }
          ],
          margin: [0, 0, 0, 25]
        },

        // Transfer Status description
        { text: `Subject: Transfer of products. Current status is ${transfer.status}.`, fontSize: 11, bold: true, margin: [0, 0, 0, 15] },

        // Products Given Table
        { text: 'PRODUCTS GIVEN', fontSize: 11, bold: true, color: primaryColor, margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: [
              [
                { text: 'SL', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] },
                { text: 'PRODUCT DESCRIPTION', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, margin: [5, 5, 5, 5] },
                { text: 'SERIAL NUMBER(S)', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] },
                { text: 'QTY TAKEN', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] }
              ],
              ...transfer.items.map((item, index) => {
                const serials = (item.serialNumbers && item.serialNumbers.length > 0) 
                  ? item.serialNumbers.join(', ') 
                  : '-';
                  
                return [
                  { text: (index + 1).toString(), fontSize: 9, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] },
                  { 
                    stack: [
                      { text: item.product?.name || 'Unknown Product', color: textColor },
                      { text: `Model: ${item.modelName || item.product?.model || '-'}`, fontSize: 8, color: '#444', margin: [0, 2, 0, 0] }
                    ],
                    fontSize: 9, margin: [5, 5, 5, 5] 
                  },
                  { text: serials, fontSize: 9, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] },
                  { text: item.quantityTaken.toString(), fontSize: 9, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] }
                ];
              })
            ]
          },
          layout: {
            hLineWidth: (i, node) => 1,
            vLineWidth: (i, node) => 1,
            hLineColor: () => borderColor,
            vLineColor: () => borderColor
          },
          margin: [0, 0, 0, 25]
        },

        // Products Returned Table (if any)
        ...(transfer.returnTransactions && transfer.returnTransactions.length > 0 ? [
          { text: 'PRODUCTS RETURNED', fontSize: 11, bold: true, color: primaryColor, margin: [0, 0, 0, 8] },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', '*', '*', 'auto', 'auto'],
              body: [
                [
                  { text: 'SL', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] },
                  { text: 'DATE', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, margin: [5, 5, 5, 5] },
                  { text: 'ORIGINAL PRODUCT', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, margin: [5, 5, 5, 5] },
                  { text: 'RETURNED PRODUCT', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, margin: [5, 5, 5, 5] },
                  { text: 'SERIAL NUMBER(S)', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] },
                  { text: 'QTY', bold: true, fontSize: 9, color: '#FFFFFF', fillColor: primaryColor, alignment: 'center', margin: [5, 5, 5, 5] }
                ],
                ...transfer.returnTransactions.flatMap((tx, txIndex) => {
                  let startIdx = 1;
                  return tx.itemsReturned.map((item, index) => {
                    const serials = (item.serialNumbers && item.serialNumbers.length > 0) ? item.serialNumbers.join(', ') : '-';
                    const dateText = new Date(tx.date).toLocaleDateString('en-GB');

                    return [
                      { text: (startIdx + index).toString(), fontSize: 8, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] },
                      { text: dateText, fontSize: 8, color: textColor, margin: [5, 5, 5, 5] },
                      { text: item.originalProduct?.name || 'N/A', fontSize: 8, color: textColor, margin: [5, 5, 5, 5] },
                      { text: item.returnedProduct?.name || 'N/A', fontSize: 8, color: textColor, margin: [5, 5, 5, 5] },
                      { text: serials, fontSize: 8, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] },
                      { text: item.quantity.toString(), fontSize: 8, alignment: 'center', color: textColor, margin: [5, 5, 5, 5] }
                    ];
                  });
                })
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => borderColor,
              vLineColor: () => borderColor
            },
            margin: [0, 0, 0, 25]
          }
        ] : []),

        // Conditions & Notes Section
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Terms & Conditions', bold: true, fontSize: 10, color: primaryColor, margin: [0, 0, 0, 5], decoration: 'underline' },
                { text: transfer.conditions || 'No special conditions provided.', fontSize: 9, italics: true, color: textColor }
              ],
              margin: [0, 0, 10, 0]
            },
            {
              width: '*',
              stack: [
                { text: 'Additional Notes:', bold: true, fontSize: 10, color: primaryColor, margin: [0, 0, 0, 5], decoration: 'underline' },
                { text: transfer.note || 'None', fontSize: 9, color: textColor }
              ],
              margin: [10, 0, 0, 0]
            }
          ],
          margin: [0, 0, 0, 40]
        },

        // Footer Signatures
        {
          columns: [
            {
              stack: [
                { text: 'Thanks for doing business with us!', color: primaryColor, bold: true, fontSize: 12, margin: [0, 0, 0, 5] },
                { text: 'Best regards,', fontSize: 10 },
                { text: transfer.createdBy?.name || 'Smart Plaza Team', fontSize: 10, bold: true, margin: [0, 2, 0, 0] }
              ],
              width: '*'
            },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1, lineColor: textColor }], alignment: 'center' },
                { text: 'Received By', alignment: 'center', fontSize: 9, bold: true, color: textColor, margin: [0, 5, 0, 0] }
              ],
              width: 150,
              margin: [0, 30, 0, 0]
            },
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: textColor }], alignment: 'center' },
                { text: 'Stamp and Signature from Authority', alignment: 'center', fontSize: 9, bold: true, color: textColor, margin: [0, 5, 0, 0] }
              ],
              width: 180,
              margin: [20, 30, 0, 0]
            }
          ],
          margin: [0, 40, 0, 0]
        }
      ]
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  } catch (err) {
    console.error('PDF generation failed:', err);
    throw err;
  }
};

module.exports = {
  generateTransferInvoicePDF
};

