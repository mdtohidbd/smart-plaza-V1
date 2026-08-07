import React from 'react';
import { Button, ButtonGroup, Tooltip, Box } from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Reusable component for exporting list data
 * 
 * @param {Array} data - The array of objects to export
 * @param {Array} columns - Column configuration: [{ label: 'Name', accessor: 'name' | (row) => row.name }]
 * @param {String} filename - The name of the downloaded file (without extension)
 * @param {String} title - The title printed on the PDF/Print layout
 */
const ExportButtons = ({ data = [], columns = [], filename = 'export', title = 'Report' }) => {
  
  // Excel Exporter
  const handleExportExcel = async () => {
    if (!data.length || !columns.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.substring(0, 31) || 'Data'); // Excel sheet names max 31 chars

    // Define columns
    worksheet.columns = columns.map(col => ({
      header: col.label,
      key: col.label,
      width: Math.max(col.label.length, 15) // Dynamic width base
    }));

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D5F99' } // Dark blue theme
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    data.forEach(row => {
      const rowData = {};
      columns.forEach(col => {
        let val = '';
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else if (col.accessor) {
          val = row[col.accessor];
        }
        rowData[col.label] = val === null || val === undefined ? '' : val;
      });
      worksheet.addRow(rowData);
    });

    // Auto-fit columns somewhat based on content length
    worksheet.columns.forEach(column => {
      // Force text format for Contact Number or Phone columns to prevent scientific notation
      if (column.header && (column.header.toLowerCase().includes('number') || column.header.toLowerCase().includes('phone'))) {
        column.numFmt = '@';
      }

      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        let columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }

        // If this is a data row and the value looks like a large number (phone/invoice), force it as string
        if (rowNumber > 1 && cell.value) {
          const strVal = cell.value.toString();
          if (/^\d{9,15}$/.test(strVal)) {
            cell.value = strVal;
            cell.numFmt = '@';
          }
        }
      });
      // Increase minimum width to 14 to avoid ######## for dates
      column.width = maxLength < 14 ? 14 : maxLength > 50 ? 50 : maxLength + 2;
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: false }, row => {
      row.eachCell({ includeEmpty: false }, cell => {
        cell.border = {
          top: {style:'thin', color: {argb:'FFE2E8F0'}},
          left: {style:'thin', color: {argb:'FFE2E8F0'}},
          bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
          right: {style:'thin', color: {argb:'FFE2E8F0'}}
        };
        // Alternate row colors for better readability
        if (row.number > 1 && row.number % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Browser Print / Save PDF Exporter
  const handlePrint = () => {
    if (!data.length || !columns.length) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this app to print reports.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; padding: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { font-size: 22px; font-weight: bold; color: #1e3a8a; font-family: 'Outfit', sans-serif; }
            .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
            .meta { font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f8fafc; color: #1e293b; font-weight: bold; font-size: 10px; text-transform: uppercase; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; color: #334155; }
            tr:nth-child(even) td { background-color: #fdfdfd; }
            .footer { margin-top: 45px; text-align: center; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print {
              body { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${title}</div>
              <div class="meta">Generated: ${new Date().toLocaleString()} | Total Items: ${data.length}</div>
            </div>
            <div class="logo">Demo ERP</div>
          </div>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => {
                    let val = '';
                    if (typeof col.accessor === 'function') {
                      val = col.accessor(row);
                    } else if (col.accessor) {
                      val = row[col.accessor];
                    }
                    if (val === null || val === undefined) val = '';
                    return `<td>${val}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Demo ERP Business ERP - Confidential Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <ButtonGroup size="small" variant="contained" color="primary">
        <Tooltip title="Download Excel Spreadsheet">
          <Button 
            startIcon={<DownloadIcon />} 
            onClick={handleExportExcel}
            sx={{
              backgroundColor: '#107c41',
              '&:hover': { backgroundColor: '#0b592e' },
              textTransform: 'none',
              borderRadius: '6px 0 0 6px',
              fontWeight: 600,
              fontSize: '0.8125rem'
            }}
          >
            Excel / CSV
          </Button>
        </Tooltip>
        
        <Tooltip title="Print List or Save as PDF">
          <Button 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{
              backgroundColor: '#1d4ed8',
              '&:hover': { backgroundColor: '#1e40af' },
              textTransform: 'none',
              borderRadius: '0 6px 6px 0',
              fontWeight: 600,
              fontSize: '0.8125rem'
            }}
          >
            Print
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};

export default ExportButtons;
