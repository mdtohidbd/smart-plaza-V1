const fs = require('fs');

let content = fs.readFileSync('frontend/src/views/Sales/RetailSales.jsx', 'utf8');

// 1. Add Imports
content = content.replace(
  "import SaleInvoiceModal from '../../components/sales/SaleInvoiceModal';",
  "import SaleInvoiceModal from '../../components/sales/SaleInvoiceModal';\nimport ProductCatalog from './components/ProductCatalog';\nimport CartTable from './components/CartTable';\nimport CustomerSelection from './components/CustomerSelection';\nimport PaymentDetails from './components/PaymentDetails';\nimport SaleModals from './components/SaleModals';"
);

// 2. Mobile Tab 0 (ProductCatalog)
const mobileTab0Start = content.indexOf('// TAB 0: PRODUCTS CATALOG');
const mobileTab1Start = content.indexOf('// TAB 1: CART REVIEW & CHECKOUT FORM');

if (mobileTab0Start !== -1 && mobileTab1Start !== -1) {
  const replacement = `// TAB 0: PRODUCTS CATALOG
            <ProductCatalog
              isMobile={true}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredProducts={filteredProducts}
              productsLoading={productsLoading}
              addToCart={addToCart}
              cart={cart}
              total={total}
              setMobileTab={setMobileTab}
            />
          ) : (
            `;
  content = content.slice(0, mobileTab0Start) + replacement + content.slice(mobileTab1Start);
}

// 3. Mobile CartTable
const mobileCartStart = content.indexOf('{/* Cart List */}');
const mobileTransactionDetailsStart = content.indexOf('{/* Transaction Config details Card */}');

if (mobileCartStart !== -1 && mobileTransactionDetailsStart !== -1) {
  const replacement = `{/* Cart List */}
              <CartTable
                isMobile={true}
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                toggleWarranty={toggleWarranty}
                warrantyTemplates={warrantyTemplates}
              />

              `;
  content = content.slice(0, mobileCartStart) + replacement + content.slice(mobileTransactionDetailsStart);
}

// 4. Mobile Customer & Payment
const mobileCustomerDropdownStart = content.indexOf('{/* Customer dropdown + Add customer button */}');
const mobileNotesStart = content.indexOf('{/* Notes */}');

if (mobileCustomerDropdownStart !== -1 && mobileNotesStart !== -1) {
  const replacement = `
                      <CustomerSelection
                        customers={customers}
                        customer={customer}
                        setCustomer={setCustomer}
                        openCustomerDialog={openCustomerDialog}
                        setOpenCustomerDialog={setOpenCustomerDialog}
                        newCustomer={newCustomer}
                        setNewCustomer={setNewCustomer}
                        handleCreateCustomer={handleCreateCustomer}
                      />
                      <PaymentDetails
                        isEmi={isEmi}
                        setIsEmi={setIsEmi}
                        paidAmount={paidAmount}
                        setPaidAmount={setPaidAmount}
                        setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                        emiDuration={emiDuration}
                        setEmiDuration={setEmiDuration}
                        emiInterestRate={emiInterestRate}
                        setEmiInterestRate={setEmiInterestRate}
                        discount={discount}
                        setDiscount={setDiscount}
                        discountType={discountType}
                        setDiscountType={setDiscountType}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                      />
                      `;
  // Make sure we are in the mobile section (first occurrence)
  content = content.slice(0, mobileCustomerDropdownStart) + replacement + content.slice(mobileNotesStart);
}

// 5. Desktop ProductCatalog
const desktopCatalogStart = content.indexOf('{/* Catalog Selector */}');
const desktopShoppingCartStart = content.indexOf('{/* Shopping Cart Table */}');

if (desktopCatalogStart !== -1 && desktopShoppingCartStart !== -1) {
  const replacement = `{/* Catalog Selector */}
            <ProductCatalog
              isMobile={false}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredProducts={filteredProducts}
              productsLoading={productsLoading}
              addToCart={addToCart}
              cart={cart}
              total={total}
              setMobileTab={setMobileTab}
            />

            `;
  content = content.slice(0, desktopCatalogStart) + replacement + content.slice(desktopShoppingCartStart);
}

// 6. Desktop CartTable
// Note: we need to find the SECOND occurrence of "{/* Shopping Cart Table */}"? No, it's the only one.
const desktopCartStart2 = content.indexOf('{/* Shopping Cart Table */}');
const desktopRemarksStart = content.indexOf('{/* Remarks note textfield tucked here to preserve screen height */}');

if (desktopCartStart2 !== -1 && desktopRemarksStart !== -1) {
  const replacement = `{/* Shopping Cart Table */}
            <Paper sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: 0, 
              p: 1.5, 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', mb: 1 }}>
                Shopping Cart ({cart.length} items)
              </Typography>
              <CartTable
                isMobile={false}
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                toggleWarranty={toggleWarranty}
                warrantyTemplates={warrantyTemplates}
              />
              
              `;
  content = content.slice(0, desktopCartStart2) + replacement + content.slice(desktopRemarksStart);
}

// 7. Desktop Customer & Payment
const desktopCustomerDropdownStart = content.indexOf('{/* Customer dropdown + Add customer button */}'); // This should be the only one left since we replaced the mobile one
const desktopCalculationsCardStart = content.indexOf('{/* Calculations Card Summary & Actions */}');

if (desktopCustomerDropdownStart !== -1 && desktopCalculationsCardStart !== -1) {
  const replacement = `
                  <CustomerSelection
                    customers={customers}
                    customer={customer}
                    setCustomer={setCustomer}
                    openCustomerDialog={openCustomerDialog}
                    setOpenCustomerDialog={setOpenCustomerDialog}
                    newCustomer={newCustomer}
                    setNewCustomer={setNewCustomer}
                    handleCreateCustomer={handleCreateCustomer}
                  />
                  <PaymentDetails
                    isEmi={isEmi}
                    setIsEmi={setIsEmi}
                    paidAmount={paidAmount}
                    setPaidAmount={setPaidAmount}
                    setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                    emiDuration={emiDuration}
                    setEmiDuration={setEmiDuration}
                    emiInterestRate={emiInterestRate}
                    setEmiInterestRate={setEmiInterestRate}
                    discount={discount}
                    setDiscount={setDiscount}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                  />
                </Grid>
              </Paper>

              `;
  content = content.slice(0, desktopCustomerDropdownStart) + replacement + content.slice(desktopCalculationsCardStart);
}

// 8. Modals
const addCustomerDialogStart = content.indexOf('{/* Add Customer Dialog */}');
// Actually, CustomerSelection already has the Add Customer Dialog, so we can just delete it from RetailSales.jsx
// It ends right before Invoice Preview Dialog
const invoicePreviewDialogStart = content.indexOf('{/* Invoice Preview Dialog */}');
if (addCustomerDialogStart !== -1 && invoicePreviewDialogStart !== -1) {
  content = content.slice(0, addCustomerDialogStart) + content.slice(invoicePreviewDialogStart);
}

// 9. Sale Modals
const invoicePreviewDialogStart2 = content.indexOf('{/* Invoice Preview Dialog */}');
const toastNotificationsStart = content.indexOf('{/* TOAST NOTIFICATION SNACKBARS */}');

if (invoicePreviewDialogStart2 !== -1 && toastNotificationsStart !== -1) {
  const replacement = `<SaleModals
        showPreviewDialog={showPreviewDialog}
        setShowPreviewDialog={setShowPreviewDialog}
        previewSaleData={previewSaleData}
        showConfirmDialog={showConfirmDialog}
        handleCancelConfirm={handleCancelConfirm}
        handleConfirmCreateSale={handleConfirmCreateSale}
        pendingSaleData={pendingSaleData}
        customers={customers}
        handleSubmit={handleSubmit}
      />

      `;
  content = content.slice(0, invoicePreviewDialogStart2) + replacement + content.slice(toastNotificationsStart);
}


fs.writeFileSync('frontend/src/views/Sales/RetailSales.jsx', content);
console.log('Refactoring applied.');
