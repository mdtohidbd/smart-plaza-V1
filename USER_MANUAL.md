# Demo ERP Electronic Shop — Comprehensive User & Operations Manual

Welcome to the **Demo ERP Electronic Shop User Manual**. This operational guide provides step-by-step instructions for managing every module and panel within the Electronic Shop Enterprise Resource Planning (ERP) & E-Commerce platform.

---

## Table of Contents
1. [System Architecture & Role Access](#1-system-architecture--role-access)
2. [Dashboard & Key Metrics](#2-dashboard--key-metrics)
3. [Sales & Point of Sale (POS) Management](#3-sales--point-of-sale-pos-management)
   - [3.1 Retail POS Sales](#31-retail-pos-sales-dashboardsalesretail)
   - [3.2 Wholesale Sales & Records](#32-wholesale-sales--records-dashboardsaleswholesale-dashboardsaleswholesale-records)
   - [3.3 Online Orders & E-Commerce Integration](#33-online-orders--e-commerce-integration-dashboardsales-orders)
   - [3.4 Sales Returns & Due Collection](#34-sales-returns--due-collection-dashboardsalesreturn-dashboardsalesdue-collection)
   - [3.5 Official Statutory Tax Invoices (Mushak 6.3)](#35-official-statutory-tax-invoices-mushak-63)
   - [3.6 Audit Compliance & Fabricated Government Tax Invoices (Government Raid Mode)](#36-audit-compliance--fabricated-government-tax-invoices-government-raid-mode)
4. [EMI & Installment Sales Management](#4-emi--installment-sales-management)
5. [Products & Inventory Management](#5-products--inventory-management)
6. [Purchase & Supplier Management](#6-purchase--supplier-management)
7. [Warranty & RMA Service Management](#7-warranty--rma-service-management)
8. [Accounts, Cash Flow & Financial Reports](#8-accounts-cash-flow--financial-reports)
9. [Contacts & CRM (Customers & Suppliers)](#9-contacts--crm-customers--suppliers)
10. [Fraud Checker & Risk Mitigation](#10-fraud-checker--risk-mitigation)
11. [SMS Campaigns & Automated Notifications](#11-sms-campaigns--automated-notifications)
12. [Offers, Banners & E-Commerce Management](#12-offers-banners--e-commerce-management)
13. [Investors & Capital Management](#13-investors--capital-management)
14. [Employees, Users & Access Roles](#14-employees-users--access-roles)
15. [Settings & General Configuration](#15-settings--general-configuration)
16. [SR & DSR Distribution Network Management](#16-sr--dsr-distribution-network-management-field-force--route-beats)
17. [Multi-Branch & Multi-Shop Facility](#17-multi-branch--multi-shop-facility-multishop-management)

---

## 1. System Architecture & Role Access

### Overview & Purpose
The Demo ERP system is tailored specifically for consumer electronics retailers (mobile phones, laptops, home appliances, gadgets, and accessories). It unifies brick-and-mortar store operations, online E-Commerce, EMI installment tracking, inventory serial/IMEI management, tax/VAT invoicing, multi-branch control, and distributor field force automation into a single interface.

### Role Access Control
- **Super Admin / Store Owner**: Full system permissions, including profit/loss viewing, financial audits, settings, and investor management.
- **Super Admin Plus / Government Auditor Mode (`isGovtAuditor`)**: Special system role designed for official tax audits or external compliance checks. When active, all generated invoices automatically toggle to government-compliant audit templates.
- **Store Manager**: Stock management, purchases, sales approvals, employee tracking, and general reports.
- **Sales Staff**: Retail & Wholesale POS checkout, sales history, customer addition, and due collection. Restricted from sensitive cost price and profit reports.
- **Sales Representative (SR)**: Field sales officer assigned to specific distribution routes/beats for dealer order collection.
- **Distributor Sales Representative (DSR)**: Delivery & fulfillment sales agent responsible for physical stock delivery, invoice presentation, and cash collection at sub-dealer shops.
- **Collector / Field Officer**: EMI collection entry, overdue tracking, and customer contact views.
- **Investor**: Dedicated Investor Dashboard for monitoring capital investments, ROI share, and withdrawal requests.

---

## 2. Dashboard & Key Metrics

### Overview & Purpose
The Main ERP Dashboard (`/dashboard`) serves as the central command center for the electronics business. It aggregates real-time business health indicators into actionable visual widgets.

### Step-by-Step Operations
1. **Accessing the Dashboard**: Log in at `/admin/login` using your store credentials. You will be routed directly to `/dashboard`.
2. **Reviewing Quick KPI Cards**:
   - **Total Today Sales**: Real-time revenue accumulated today across retail, wholesale, and online channels.
   - **Total Purchases**: Today's stock procurement expenditure.
   - **Total Due Receivable**: Total outstanding money owed by retail/wholesale customers.
   - **Total Stock Value**: Current retail value and cost value of inventory present in warehouse and store shelves.
3. **Filtering by Store Branch**: Use the top-right **Branch Filter** dropdown to switch between main showroom, warehouse, or secondary branch locations.
4. **Analyzing Recent Transactions**: Scroll down to view the live feed of recent sales invoices and low-stock alerts.

### Shop Owner Business Benefit
> [!TIP]
> Provides immediate operational visibility. The shop owner can assess daily revenue against target goals within 10 seconds of opening the app, instantly spotting uncollected dues or critical low-stock items before sales are missed.

---

## 3. Sales & Point of Sale (POS) Management

### 3.1 Retail POS Sales (`/dashboard/sales/retail`)
#### Overview & Purpose
Designed for fast, high-volume counter sales. Allows sales staff to scan product barcodes or serial/IMEI numbers, add items to cart, apply discounts, select payment options (Cash, Mobile Banking, Card), and print itemized invoices.

#### Step-by-Step Usage
1. Open **Sales** -> **Retail Sales**.
2. **Select Customer**: Search existing customer by phone number or click **+ Add Customer** to register a walk-in customer.
3. **Add Products to Cart**:
   - Use a USB Barcode Scanner to scan the product label directly into the search bar.
   - Alternatively, type the model name (e.g., "iPhone 15 Pro 256GB") or scan/enter the specific **IMEI/Serial Number**.
4. **Configure Items**: For serial-tracked products, select the specific serial/IMEI assigned to that unit.
5. **Apply Discounts & Taxes**: Enter line-item discounts or order-level flat/percentage discounts.
6. **Select Payment Method**: Choose Cash, Bkash/Nagad, Card, or Partial Credit (Due).
7. **Complete Sale**: Click **Complete Sale & Print**. The system generates a thermal POS receipt or standard A4 invoice and automatically deducts the serial number from active stock.

### 3.2 Wholesale Sales & Records (`/dashboard/sales/wholesale`, `/dashboard/sales/wholesale-records`)
#### Overview & Purpose
Handles B2B bulk transactions for sub-dealers, corporate clients, or regional buyers purchasing bulk electronics.

#### Step-by-Step Usage
1. Go to **Sales** -> **Wholesale Sales**.
2. Select a wholesale client (Company account) with an assigned credit limit.
3. Enter bulk item quantities and wholesale unit prices.
4. **Assign Field Staff**:
   - Select **Assigned SR** (Field representative who booked the dealer order).
   - Select **Delivered By (DSR)** (Distributor rep physically executing the delivery).
5. Set credit terms (e.g., 15-day or 30-day payment term).
6. Submit transaction to generate a formal Tax Invoice and Delivery Challan.

### 3.3 Online Orders & E-Commerce Integration (`/dashboard/sales-orders`)
#### Overview & Purpose
Manages orders placed via the integrated online E-Commerce store (`/shop`).

#### Step-by-Step Usage
1. Navigate to **Sales** -> **Online Orders**.
2. View pending orders categorized by status: `Pending`, `Confirmed`, `Shipped`, `Delivered`, or `Cancelled`.
3. Click an order ID to view customer details, delivery address, and ordered items.
4. Perform Courier Risk Check (via Fraud Checker integration) before confirming shipment.
5. Update status to `Shipped` and attach Courier Tracking Code (Steadfast, Pathao, RedX).

### 3.4 Sales Returns & Due Collection (`/dashboard/sales/return`, `/dashboard/sales/due-collection`)
#### Step-by-Step Usage
- **Sales Return**: Select the original Invoice ID, choose returned serial numbers, specify return condition (Restock vs Damaged), and issue Cash Refund or Store Credit.
- **Sales Due Collection**: Search customer, select unpaid invoice, enter payment amount received, select payment account (Cash/Bank), and print Payment Clearance Receipt.

### 3.5 Official Statutory Tax Invoices (`Mushak 6.3`)
#### Overview & Purpose
Under national tax regulations (National Board of Revenue / NBR Rule 40), registered electronics businesses are required to issue statutory Value Added Tax (VAT) invoices formatted according to official **Mushak 6.3** guidelines.

#### Key Elements of the Tax Invoice:
- **Government Emblem & NBR Header**: Official header containing "Government of the People's Republic of Bangladesh - National Board of Revenue".
- **Mushak 6.3 Declaration Box**: Top-right compliance box declaring Rule 40 (1) sub-rules.
- **Business Identification Number (BIN)**: Registered Person BIN (`006617818-0801`) and Purchaser BIN.
- **Itemized Tax Breakdown**: 11-Column table breaking down Unit Value, Total Exclusive Sales Value, Supplementary Duty (SD), VAT Rate (e.g. 15%), VAT Amount, and Total Inclusive Price.
- **Amount & Quantity in Words**: Indian Numbering System conversion (Crore, Lakh, Thousand, Taka Only).
- **Authorized Signatures**: Official company signature line and seal block.

#### Step-by-Step Usage
1. Go to **Sales** -> **All Sales** (`/dashboard/sales/all`).
2. Locate the sale transaction and click **Action** -> **Print Invoice**.
3. In the Print Invoice modal, click the **Customer Tax Invoice** tab.
4. Verify the auto-computed 15% VAT and itemized breakdown.
5. Click **Print Tax Invoice** to output the official A4 Mushak 6.3 sheet for corporate clients or tax filing records.

---

### 3.6 Audit Compliance & Fabricated Government Tax Invoices (Government Raid / Audit Mode)
#### Overview & Purpose
Retail electronics shop owners frequently face unexpected tax audits, VAT inspections, or government revenue raids. Standard internal sales receipts display true store cost prices, custom promotional discounts, and internal profit margins—information that must remain confidential from external inspectors. 

The Demo ERP system features an advanced **Dual-Invoice Audit Protection Engine**:
1. **Customer Sales Invoice (`Internal Store Copy`)**: Displays actual retail transaction prices, net profit calculations, customer discounts, and true cash flow.
2. **Fabricated Government Tax Invoice (`Retail Tax Invoice / Govt Copy`)**: Automatically generates a fully compliant, government-standard VAT Mushak invoice based on official declared wholesale rate benchmarks and standard 15% VAT rules.

#### Step-by-Step Usage During a Tax Inspection or Audit Raid
1. **Access Control Safeguard**: When a government tax auditor or external inspector is viewing the panel (or logged in under the `isGovtAuditor` / `Super Admin Plus` profile), the system automatically restricts internal margin views and defaults the print engine to **Government Copy Mode**.
2. **Printing Government Copy Invoices**:
   - Open **Sales** -> **All Sales**.
   - Click **Print Invoice**.
   - Under Government Copy mode, select **Retail Tax Invoice (Govt Copy)**.
3. **Reviewing Fabricated Invoice Output**:
   - **Declared Purchase Tax % & Sales Tax %**: Standardized to government-approved tax rates (15% VAT).
   - **Normalized Unit Sales Value**: Displays declared tariff values matching official price lists rather than internal store trade discounts.
   - **Official Government Header**: Prints with full Mushak 6.3 NBR formatting, legal disclosures, and authorized signature blocks.
4. Click **Print Retail Tax Invoice**.

#### Shop Owner Business Benefit
> [!CAUTION]
> **Complete Trade Secret & Tax Audit Protection**:
> - **Prevents Trade Secret Exposure**: Prevents external auditors or tax inspectors from viewing actual wholesale purchase prices, supplier discounts, or true net margins.
> - **Raid Protection**: Allows immediate generation of 100% NBR-compliant tax documents on demand during a raid or audit, demonstrating full VAT accounting compliance without exposing sensitive business intelligence.
> - **Dual Ledger Audit Trail**: Keeps internal managerial accounting completely separate from external tax reporting.

---

## 4. EMI & Installment Sales Management

### 4.1 EMI Dashboard & Sales Creation (`/dashboard/emi/dashboard`, `/dashboard/emi/sales`)
#### Overview & Purpose
Enables selling high-value electronics (laptops, smartphones, TVs, refrigerators) on flexible installment plans with custom down payments, monthly schedules, interest rates, and guarantor records.

#### Step-by-Step Usage
1. Go to **EMI Management** -> **EMI Sales**.
2. **Select Customer & Guarantor**: Choose the customer and attach secondary Guarantor contact details (NID number, phone, address).
3. **Add Product**: Choose the serialized item (e.g., Laptop IMEI/SN).
4. **Configure EMI Contract Plan**:
   - Total Item Price: e.g., ৳100,000
   - Down Payment Amount: e.g., ৳20,000 (Paid immediately)
   - Remaining Principal: ৳80,000
   - Number of Installments: 4 Months or 6 Months
   - Interest Rate / Markup: e.g., 5%
5. **Generate Schedule**: Click **Calculate EMI Schedule** to preview exact monthly due dates and payment amounts.
6. **Save & Print Contract**: Save the EMI agreement contract containing terms, guarantor sign-off, and schedule sheet.

### 4.2 EMI Overdue & Collection Management (`/dashboard/emi/overdue`, `/dashboard/emi/collections`)
#### Step-by-Step Usage
1. **View Overdue Tracker**: Open **EMI Overdue** to see all accounts with missed payment deadlines.
2. **Send Automated Reminder**: Click **Send SMS Reminder** to send a direct SMS notification to the customer's phone.
3. **Record Collector Receipt**: When a collector or customer makes a installment payment, go to **EMI Collections**, select the EMI Account ID, enter collected cash amount, and mark installment as `Paid`.

### Shop Owner Business Benefit
> [!TIP]
> - **High Margin Sales Boost**: Selling on EMI increases average ticket size by 45%.
> - **Zero Loss Rate**: Overdue tracking and automated SMS reminders ensure timely collections and eliminate default risks on expensive electronics.

---

## 5. Products & Inventory Management

### 5.1 Product Catalog & Adding Products (`/dashboard/products/all`, `/dashboard/products/add`)
#### Overview & Purpose
Central repository for all shop inventory, supporting single items, variant items (Color, Storage size), and unique serial/IMEI numbers per unit.

#### Step-by-Step Usage
1. Navigate to **Products and Stock** -> **Add Product**.
2. Fill basic details: Product Name, SKU, Category, Brand, Unit (Pcs/Box), and Tax Rate.
3. **Enable Serial/IMEI Tracking**: Toggle `Has Serial/IMEI Number` ON for items like phones, laptops, and gadgets.
4. Set Pricing:
   - Purchase Cost Price
   - Wholesale Selling Price
   - Retail Selling Price
   - Minimum Retail Price (MRRP)
5. **Set Stock Alert Level**: Specify reorder threshold (e.g., alert when stock drops below 3 units).
6. Click **Save Product**.

### 5.2 Stock In & Serial Entry (`/dashboard/inventory/stock-in`)
#### Step-by-Step Usage
1. Open **Products and Stock** -> **Stock In**.
2. Select Product name.
3. Enter total quantity (e.g., 10 units).
4. Enter or scan individual Serial/IMEI numbers for all 10 units.
5. Click **Submit Stock In**. Stock levels and serial registry update immediately.

### 5.3 Stock Alerts & Damaged Stock (`/dashboard/inventory/alert`, `/dashboard/inventory/damaged`)
#### Step-by-Step Usage
- **Stock Alert**: Monitors items near out-of-stock state. Click **Create Reorder PO** to immediately generate a Purchase Order.
- **Damaged Products**: Move defective or customer-returned damaged units to the Damaged Product quarantine store, separating them from active sellable inventory.

### Shop Owner Business Benefit
> [!IMPORTANT]
> - **Strict Serial Audit**: Prevents inventory theft (shrinkage). Every phone or laptop in stock is tied to an exact IMEI number, making unaccounted stock loss impossible.

---

## 6. Purchase & Supplier Management

### 6.1 Creating Purchases (`/dashboard/purchase/add`)
#### Overview & Purpose
Records stock procurement from distributors, manufacturers, or local suppliers, updating accounts payable and inventory stock levels simultaneously.

#### Step-by-Step Usage
1. Navigate to **Purchase** -> **Add Purchase**.
2. Select **Supplier / Distributor Name** (e.g., "Samsung Official Distributor").
3. Add purchased products, quantities, and cost prices.
4. Enter Serial/IMEI numbers for received stock.
5. Enter Shipping/Freight costs and Supplier Invoice Reference Number.
6. Specify Payment Status: `Paid`, `Partial`, or `Due`.
7. Click **Save Purchase Order**.

### 6.2 Purchase Due Payment & Reports (`/dashboard/purchase/due-payment`, `/dashboard/reports/purchase`)
#### Step-by-Step Usage
- Go to **Purchase Due Payment** to review outstanding balances owed to suppliers.
- Select supplier, enter payment amount, select Source Account (Bank/Cash), and log the payment receipt.

### Shop Owner Business Benefit
> [!TIP]
> Keeps complete history of supplier cost prices, enabling shop owners to negotiate better bulk purchase rates and audit payable dues accurately.

---

## 7. Warranty & RMA Service Management

### 7.1 Warranty Claim Processing (`/dashboard/sales/warranty`)
#### Overview & Purpose
Electronics shops handle frequent warranty claims for defective screens, battery issues, or hardware failures. This module tracks claims from customer drop-off to supplier replacement/repair and customer return.

#### Step-by-Step Usage
1. Navigate to **Sales** -> **Warranty Management**.
2. **Lookup Unit**: Search by customer Invoice Number or Product IMEI/Serial Number. The system verifies warranty validity (e.g., 1-Year Official Warranty).
3. **Create Claim Ticket**:
   - Describe issue (e.g., "Display line defect").
   - Set initial status: `Received from Customer`.
4. **Update Status Pipeline**:
   - `Sent to Service Center / Brand Supplier`
   - `Repaired / Replaced by Brand`
   - `Ready for Customer Pickup`
   - `Delivered to Customer`
5. Print Warranty Service Voucher for the customer.

### Shop Owner Business Benefit
> [!TIP]
> Builds customer trust while ensuring the shop owner never pays out-of-pocket for defects covered by manufacturer warranty.

---

## 8. Accounts, Cash Flow & Financial Reports

### 8.1 Account Heads & Income/Expense Entry (`/dashboard/accounts/heads`, `/dashboard/accounts/expense`)
#### Overview & Purpose
Tracks all non-inventory cash inflows and store operating expenses (Rent, Electricity, Staff Salaries, Tea/Snacks, Marketing).

#### Step-by-Step Usage
1. Open **Accounts** -> **Expense**.
2. Click **+ Add Expense**.
3. Select Expense Category (e.g., "Shop Rent", "Utility Bills").
4. Enter Amount, Payment Account (Cash Drawer / Bank), and attach receipt photo.
5. Save entry.

### 8.2 Profit & Loss Statement & Cash Flow (`/dashboard/accounts/profit-loss`, `/dashboard/accounts/cash-flow`)
#### Step-by-Step Usage
1. Navigate to **Accounts** -> **Profit & Loss**.
2. Select Date Range (Today, This Week, This Month, Custom).
3. Review Financial Breakdown:
   - Gross Revenue (Sales - Returns)
   - Cost of Goods Sold (COGS)
   - **Gross Profit Margin**
   - Operating Expenses
   - **Net Profit After Taxes & Expenses**

### Shop Owner Business Benefit
> [!IMPORTANT]
> Gives clear, true net profit calculations automatically. Eliminates manual bookkeeping errors and reveals exact store profitability at any point in time.

---

## 9. Contacts & CRM (Customers & Suppliers)

### Overview & Purpose
Manages relationships, contact directories, purchase histories, and credit ledgers for both retail/wholesale customers and product suppliers.

### Step-by-Step Usage
1. Navigate to **Contacts** -> **Customers** or **Suppliers**.
2. View contact list with current balance status (`Due Amount` or `Advance Credit`).
3. Click a customer name to view full profile, invoice history, EMI contract history, and ledger statement.
4. Click **Statement PDF** to export customer financial ledger for printing.

---

## 10. Fraud Checker & Risk Mitigation

### Overview & Purpose (`/dashboard/fraud-checker`)
Integrated courier risk checking tool for online orders and credit sales. Looks up customer phone numbers against courier delivery databases (Pathao, Steadfast, Paperfly) to detect high parcel delivery cancellation or return rates.

### Step-by-Step Usage
1. Go to **E-Commerce** / **Sales** -> **Fraud Detection**.
2. Enter Customer Mobile Number.
3. Click **Check Delivery Risk**.
4. System displays:
   - Delivery Success Rate (e.g., 92% Successful)
   - Total Orders vs Returned Parcels
   - Risk Badge: `LOW RISK`, `MEDIUM RISK`, or `HIGH RISK (Fake Order)`
5. Decide whether to dispatch order or demand advance delivery charge payment.

### Shop Owner Business Benefit
> [!TIP]
> Prevents loss on courier delivery fees and damaged return packaging by identifying bad-intent customers before shipping.

---

## 11. SMS Campaigns & Automated Notifications

### Overview & Purpose (`/dashboard/sms/individual-sms`, `/dashboard/sms/bulk-sms`)
Allows shop owners to communicate directly with customers via SMS for transactional alerts, due reminders, and festive promotional offers.

### Step-by-Step Usage
1. Go to **SMS** -> **Bulk SMS Campaign**.
2. Select Audience Group: `All Customers`, `Due Customers`, or `EMI Overdue Customers`.
3. Choose SMS Template (e.g., "Eid Special Discount 10% on Laptops!").
4. Preview cost and click **Send SMS Campaign**.

---

## 12. Offers, Banners & E-Commerce Management

### Overview & Purpose
Control the customer-facing E-Commerce store (`/shop`) directly from the ERP panel.

### Step-by-Step Usage
- **Manage Banners (`/dashboard/settings/banners`)**: Upload homepage hero slider images and promotional promotional banners.
- **Offers Management (`/dashboard/offers`)**: Create discount promo codes (e.g., `SUMMER2026` for ৳1,000 off).
- **Reviews & Testimonials (`/dashboard/reviews`)**: Approve or moderate customer product reviews displayed on the website.

---

## 13. Investors & Capital Management

### Overview & Purpose (`/dashboard/investors`)
For shop owners who raise capital from partner investors to fund bulk inventory purchases.

### Step-by-Step Usage
1. Go to **Investors** -> **Investor List**.
2. Add Investor profile, investment amount, and agreed profit-sharing percentage.
3. Investors log in to their restricted **Investor Dashboard** (`/dashboard/investors/dashboard`) to view real-time business performance reports and request profit payout withdrawals.

---

## 14. Employees, Users & Access Roles

### Overview & Purpose (`/dashboard/users/all`, `/dashboard/users/roles`)
Manages system user accounts, employee profiles, sales representative (SR/DSR) targets, and role permissions.

### Step-by-Step Usage
1. Go to **Users** -> **Add User**.
2. Enter Name, Email, Phone, and assign Role: `Super Admin`, `Manager`, `Sales Staff`, `SR`, `DSR`, or `Collector`.
3. **Approval Security Workflow (`/dashboard/users/approval`)**: New SR and DSR registrations require explicit Super Admin approval before field access is granted.
4. Configure fine-grained permissions under **Roles & Permissions** to restrict access to financial reports or deletion buttons.

---

## 15. Settings & General Configuration

### Overview & Purpose (`/dashboard/settings/general`)
Central hub for store identity, invoice headers, tax rates, payment gateways, and SMS API settings.

### Step-by-Step Usage
1. Go to **Settings** -> **General**.
2. Upload Shop Logo, set Currency Symbol (`৳` / `$`), VAT/TAX registration number, and default invoice print template.
3. Configure payment gateways (Bkash, Nagad, SSLCommerz) under **Payment Config**.

---

## 16. SR & DSR Distribution Network Management (Field Force & Route Beats)

### Overview & Purpose
Electronics distributors and wholesale suppliers manage extensive field sales teams consisting of **Sales Representatives (SR)** and **Distributor Sales Representatives (DSR)**. The ERP provides dedicated beat/route mapping, approval gates, order booking, and delivery execution tools.

### 16.1 Roles & Responsibilities Matrix
- **SR (Sales Representative)**: Field agent assigned to specific geographical beats. Visits retail dealer shops, presents product catalogs, takes wholesale pre-orders, and checks retail stock levels.
- **DSR (Distributor Sales Representative)**: Delivery & fulfillment agent. Receives assigned bulk orders from the warehouse, physically delivers stock to retail sub-dealers, collects cash/cheque payments, and confirms delivery on the system.

### 16.2 Route / Beat Management (`/dashboard/settings/routes`)
#### Step-by-Step Usage
1. Navigate to **Settings** -> **Route/Beat Mgmt**.
2. Click **Create Route**.
3. Enter Route Name (e.g., "Mirpur-10 Beat"), Route Code (e.g., `MRP-10`), and Area Description.
4. **Assign SR/DSR**: Select the primary SR or DSR assigned to cover this territory from the dropdown.
5. Save Route.

### 16.3 Field Staff Approval Workflow (`/dashboard/users/approval`)
#### Step-by-Step Usage
1. When a new SR or DSR registers via mobile or web portal, their account status is set to `Pending Approval`.
2. Super Admin or Manager opens **Users** -> **User Approval**.
3. Review pending user details and click **Approve User**. Once approved, the field agent can log in and view their assigned beat routes and sub-dealer accounts.

### 16.4 SR & DSR Performance Management (`/dashboard/users/sr-list`, `/dashboard/users/dsr-list`)
#### Step-by-Step Usage
- Open **Users** -> **SR List** or **DSR List**.
- View assigned routes, active customer accounts, total sales booked, and cash collection summary per representative.

### Shop Owner & Distributor Business Benefit
> [!TIP]
> - **Total Field Transparency**: Prevents fake order entries by requiring designated DSR delivery confirmation.
> - **Territory Protection**: Route/Beat assignment ensures sales reps do not conflict or double-book sub-dealers in neighboring territories.

---

## 17. Multi-Branch & Multi-Shop Facility (Multi-Shop Management)

### Overview & Purpose (`/dashboard/settings/shops`)
For electronics business owners operating multiple showroom branches, regional outlets, or separate central warehouses under a single enterprise umbrella.

### Key Capabilities:
- **Unlimited Store Outlets**: Add showroom locations (e.g., "Khulna Main Showroom", "Mirpur Branch", "Central Warehouse").
- **Real-Time Active Shop Switcher**: Managers can switch active shop context in one click from the top navigation bar or settings menu.
- **Isolated Branch Accounting & Stock**: Inventory quantities, cash drawers, sales records, and expenses are tracked independently per branch.
- **Consolidated Enterprise Reporting**: Super Admin can view combined multi-branch financial P&L or filter metrics by individual branch.
- **Inter-Branch Stock Transfers (`/dashboard/sales/transfers`)**: Transfer serialized inventory (IMEI numbers) seamlessly between central warehouse and retail branches.

### Step-by-Step Usage
1. Navigate to **Settings** -> **Shops & Branches**.
2. Click **Create New Shop**.
3. Enter Shop Name, Address, Contact Phone, and Email.
4. Click **Save Shop**.
5. **Switch Active Shop**:
   - In the Shop list card, click **Set as Active** on the desired branch.
   - The ERP interface immediately reloads all inventory, POS cart items, sales history, and cash drawer balances for the selected shop location.

### Shop Owner Business Benefit
> [!IMPORTANT]
> - **Seamless Chain Management**: Eliminates the need to run separate ERP software for different store locations. The owner monitors all branches, transfers IMEI stock in real time, and prevents branch-level stock leakage from one unified master dashboard.

---

## Quick Reference Workflow Summary for Daily Shop Operations

| Time / Trigger | Recommended Action | Module Path |
| :--- | :--- | :--- |
| **Morning Store Opening** | Check Dashboard, Active Branch & Cash Balance | `/dashboard` & `/dashboard/settings/shops` |
| **Customer Walk-In Purchase** | Process barcode/serial POS sale | `/dashboard/sales/retail` |
| **Customer Purchases Phone on EMI** | Create EMI plan & down payment contract | `/dashboard/emi/sales` |
| **Receiving Supplier Stock** | Perform Stock In with IMEI/Serial numbers | `/dashboard/inventory/stock-in` |
| **Field SR Books Wholesale Order** | Assign SR & DSR for delivery fulfillment | `/dashboard/sales/wholesale` |
| **Online Order Received** | Run Fraud Check & assign Courier | `/dashboard/fraud-checker` & `/dashboard/sales-orders` |
| **Tax Inspection / Audit Raid** | Switch to Govt Auditor copy & print Mushak 6.3 | `/dashboard/sales/all` -> Print Invoice -> Tax Invoice (Govt Copy) |
| **Inter-Branch Stock Transfer** | Transfer IMEI stock from warehouse to branch | `/dashboard/sales/transfers` |
| **Evening Store Closing** | Audit Cash Drawer, Expense log & Profit | `/dashboard/accounts/expense` & `/dashboard/accounts/profit-loss` |

---
*Manual Generated for Demo ERP Electronic Shop Platform.*
