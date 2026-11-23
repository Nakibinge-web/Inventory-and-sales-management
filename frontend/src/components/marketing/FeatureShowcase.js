import React from 'react';
import {
  CheckIcon,
  InventoryIcon,
  PosIcon,
  CategoryIcon,
  InvoiceIcon,
  PurchaseIcon,
  CustomersIcon,
  ReportsIcon,
  ShieldIcon,
  StockMovementsIcon,
  SuppliersIcon,
  SparklesIcon,
  SettingsIcon,
} from './Icons';
import productsScreenshot from '../../assets/screenshots/products.png';
import posScreenshot from '../../assets/screenshots/pos.png';
import categoriesScreenshot from '../../assets/screenshots/categories.png';
import salesScreenshot from '../../assets/screenshots/sales.png';
import purchasesScreenshot from '../../assets/screenshots/purchases.png';
import usersScreenshot from '../../assets/screenshots/users.png';
import stockMovementsScreenshot from '../../assets/screenshots/stock-movements.png';
import reportsScreenshot from '../../assets/screenshots/reports.png';
import customersScreenshot from '../../assets/screenshots/customers.png';
import suppliersScreenshot from '../../assets/screenshots/suppliers.png';
import aiScreenshot from '../../assets/screenshots/ai.png';
import settingsScreenshot from '../../assets/screenshots/settings.png';

export const GUIDE_FEATURES = [
  {
    id: '01',
    icon: InventoryIcon,
    eyebrow: '01 / Products',
    title: 'Know what you have. Know what needs attention.',
    desc: 'This is where the StockPro user adds and views their products\' information. When the product is added, it automatically appears in the point of sale section. This is where the low stock reorder alert is set from so that the application alerts you when a given product stock runs low',
    subheading: 'How to use Products section Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Products"',
        text: 'After registering your business and logging in, open the sidebar and click on Products to view and add products to your inventory.',
      },
      {
        num: '02',
        title: 'Click on "Add Product" in the products section',
        text: 'To add a product, click on "add product". This will open a form for adding a product and fill in the product details required. You can add a product barcode if the product has one when adding the product',
      },
      {
        num: '03',
        title: 'Set Low Stock Alert Level',
        text: 'When the form for adding a product is opened, there will be a field for setting the low stock alert level. Fill in the low stock alert level for the product so that the application alerts you when stock is below the Low Stock Alert Level.',
      },
      {
        num: '04',
        title: 'Confirm Product Addition',
        text: 'After filling in the product details, click on "add product" at the bottom of the form. The application will show you whether the product is added or not. Once the product is added, it will automatically appear in the point of sale section.',
      },
    ],
  },
  {
    id: '02',
    icon: PosIcon,
    eyebrow: '02 / Point of Sale',
    title: 'This is where sales are recorded without losing track of stock.',
    desc: 'Point Of Sale is where sales are recorded with an easy checkout interface built for speed. Barcode scanning, immediate search by name, multi-tender payment processing and instant receipt generation allow cashiers to complete sales in seconds while stock levels stay accurate in real time.',
    subheading: 'How to use Point of Sale(POS) Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "POS"',
        text: 'Open the sidebar and click on POS to make and record sales. Note that the product to be sold must have been added to the Products first.',
      },
      {
        num: '02',
        title: 'Make the sale',
        text: 'To make a sale, click on the product you want to sell and it will be added to the Sale cart automatically. Incase you have many products, you can scan the product barcode to add it to the sale cart or search for the product\'s name.',
      },
      {
        num: '03',
        title: 'Fill in the sales details',
        text: 'After adding the product to the cart, add the quantity that you are selling from the cart and fill in the other sale details like discount (optional), payment method, amount customer has paid and notes about the sale (optional) ',
      },
      {
        num: '04',
        title: 'Complete sale & generate receipt',
        text: 'After adding the sale details, click on "Complete Sale" at the bottom of the sale cart to complete the sale. When the sale is completed, the printable receipt will be displayed',
      },
    ],
  },
  {
    id: '03',
    icon: PurchaseIcon,
    eyebrow: '03 / Categories',
    title: 'This is the section where you create groups for your products.',
    desc: 'Incase you have very many products but you want to group them into different categories, This section helps you to do so. For example you sell phones and laptops, you can create two categories , phones category and Laptop category. Then you can add all your phones in the phones category and Laptops in the laptop category. This speeds up POS operations because the user can tap on the category in the POS to immediately view relevant products instead of scrolling through uncategorized thousands of products.',
    subheading: 'How to use Categories section Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Categories"',
        text: 'Open the sidebar and click on "Categories" to view and add categories of your products. It is advisable to create categories because it speeds up Point Of Sale operations',
      },
      {
        num: '02',
        title: 'Create Category',
        text: 'To create a product category, click on "Add Category" and a form for adding a category will be displayed and fill in the product category details.',
      },
      {
        num: '03',
        title: 'Confirm Category addition',
        text: 'After filling in the product category details, click on "Add Category" at the bottom of the form. When the category is added, the application will display a success message. You can also edit and delete the category',
      },
      {
        num: '04',
        title: 'How It speeds up Point Of Sale operatins',
        text: 'Instead of scrolling through uncategorized thousands of products, the user can tap on the category in the POS to immediately view relevant products, This speeds up the Point of Sale operations',
      },
    ],
  },
  {
    id: '04',
    icon: CustomersIcon,
    eyebrow: '04 / Sales Feature',
    title: 'View all the history of the sales made with a recipt for each sale',
    desc: 'This is the feature that helps the business owner to see all the sales made by the business. Once a sale is made, you can check in the Sales Section to see the made sales and generate a receipt for the already made sale',
    subheading: 'How to use Sales Feature Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Sales"',
        text: 'Open the sidebar and click on "Sales". A page showing all the sales made in a sales table will be displayed',
      },
      {
        num: '02',
        title: 'View Sales by Period(Daily, Weekly or Monthly)',
        text: 'To view the sales made in either a day, a week or a month, There are four options above the sales table. "Today" for sales made in a day, "This week" for sales in a week and "This Month" for sales in a month',
      },
      {
        num: '03',
        title: 'Get a receipt of the sale made',
        text: 'To get a reciept of the sale made, click on the "eye icon" under the actions column in sales table. A receipt of that specific sale will be displayed and you can print it or save it as a file',
      },
      {
        num: '04',
        title: 'Editting or deleting a sale',
        text: 'If a mistake is made while making a sale, you can edit the sales details by clicking on the "pencil icon" in the actions column of the sales table. For deleting, click on the "dustbin icon" to delete the sale if its unwanted',
      },
    ],
  },
  {
    id: '05',
    icon: ReportsIcon,
    eyebrow: '05 / Purchases',
    title: 'This is where purchased goods or services of the business are recorded.',
    desc: 'Whenever the business owner purchases goods or restocks goods, it is advisable to keep the purchase records in the Purchases section to know how much has been used to purchase new stock. When the Purchase is recorded, the purchased quantity of products is automatically added to the existing quantity before recording the purchase',
    subheading: 'How to use Purchases Feature Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Purchases"',
        text: 'Open the sidebar and click on "Purchases" and the purchases page will be displayed.',
      },
      {
        num: '02',
        title: 'Making the Purchase',
        text: 'In the purchases page, click on "record purchase" in the top right corner to record the purchase',
      },
      {
        num: '03',
        title: 'Fill in the purchase details',
        text: 'when "record purchase" is clicked, a simple section is displayed requiring to fill in the purchase details like product purchased, quantity purchased and unit purchase price',
      },
      {
        num: '04',
        title: 'View Purchases by Period(Daily, Weekly or Monthly)',
        text: 'To view the purchases made in either a day, a week or a month, There are four options above the purchases table. "Today" for purchases made in a day, "This week" for purchases in a week and "This Month" for purchases in a month',
      },
    ],
  },
  {
    id: '06',
    icon: ShieldIcon,
    eyebrow: '06 / Users Control',
    title: 'Manage staff accounts, roles, and access permissions.',
    desc: 'User Control lets business owners and administrators add staff members, assign predefined or custom permission roles, and control who can access sales, inventory, purchases, reports, and system settings. You can also enable, disable, edit, or delete user accounts anytime.',
    subheading: 'How to use User Control Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "User Control"',
        text: 'Open the sidebar under System & Intelligence and click on "User Control" to view all registered staff accounts, their usernames, emails, statuses, and assigned roles.',
      },
      {
        num: '02',
        title: 'Click "+ Add User" and Enter Staff Details',
        text: 'Click "+ Add User" in the top-right corner, enter the Staff Full Name, provide a Staff Username (or Email Address) for login, set Account Access Status to Enabled or Disabled, and assign an 8+ character password (use the eye icon to verify it).',
      },
      {
        num: '03',
        title: 'Assign Predefined or Custom Roles',
        text: 'Pick a predefined role (Owner, Admin, Manager, or Cashier) or switch to "Custom Role" (for owners) to name a new role and select exact permissions across products, sales, purchases, stock, and reports before clicking "Add User".',
      },
      {
        num: '04',
        title: 'Edit, Disable, Enable, or Delete Users & Roles',
        text: 'Use the search bar to find staff, click "Edit" to update user details or custom role permissions, click "Disable" or "Enable" to pause or restore access immediately, or review and remove custom roles in the Roles table below.',
      },
    ],
  },
  {
    id: '07',
    icon: StockMovementsIcon,
    eyebrow: '07 / Stock Movements',
    title: 'Track every unit moving in, out, or adjusted across your store.',
    desc: {
      intro:
        'Stock Movements section is where all stock changes are recorded. There are three types of Stock movements that is "Stock In", "Stock Out" and "Stock Adjustments".',
      points: [
        '"Stock In" means that products are being added to the business(Purchase).',
        '"Stock Out" means that stock is going out of business(sale).',
        '"Stock Adjustment" means setting the level of available stock to a new level.',
      ],
      outro:
        '"Stock Adjustment" helps you to record damaged goods, stock count correction or direct restocks without losing accountability and this is done in the Stock movements section',
    },
    subheading: 'How to use Stock Movements Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Stock Movements"',
        text: 'Open the sidebar under Operations and click on "Stock Movements" to view summary totals (Total Movements, Stock In, Stock Out) and your full inventory movement ledger.',
      },
      {
        num: '02',
        title: 'Search and Filter Movement Records',
        text: 'Search by product name or filter the movement table by type (Stock In, Stock Out, or Adjustment) and specific product to trace the source of any stock change.',
      },
      {
        num: '03',
        title: 'Use the "Adjust Stock" Form',
        text: 'Scroll to the Adjust Stock panel, pick a Product, and select an Adjustment Type: "Stock In" to add units, "Stock Out" to remove units, or "Set Level" to set an exact stock count.',
      },
      {
        num: '04',
        title: 'Enter Quantity, Reason & Apply Adjustment',
        text: 'Fill in the quantity, an optional reason (such as damaged goods or stock count correction) and date, then click "Apply Adjustment". Stock levels and low-stock alerts update immediately.',
      },
    ],
  },
  {
    id: '08',
    icon: ReportsIcon,
    eyebrow: '08 / Reports & Analytics',
    title: 'Understand your revenue, costs, net profit, and top performers.',
    desc: 'Reports & Analytics turns your daily sales, purchases, and inventory into clear financial summaries. View your profit margins, top-selling products, and automate scheduled reports from the Reports and Analytics section.',
    subheading: 'How to use Reports & Analytics Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Analytics & Reports"',
        text: 'Open the sidebar and click on "Analytics & Reports" to view the Overview dashboard showing Total Revenue, Total Costs, Net Profit, Low Stock count, payment breakdowns, and top products and suppliers.',
      },
      {
        num: '02',
        title: 'Generate Period Reports',
        text: 'Switch between Daily Sales, Weekly Sales, Monthly Sales, Yearly Report, and Daily Purchases tabs, select your date, month, or year, and click "Generate Report" to view transactions and profit margins.',
      },
      {
        num: '03',
        title: 'Export Data to CSV Spreadsheets',
        text: 'Use the export buttons in the top-right corner ("Export Overview", "Export Sales", "Export Purchases", and "Export Inventory") to download CSV files for accounting and audits.',
      },
      {
        num: '04',
        title: 'Automate & Review Saved Reports',
        text: 'Click "Automate ... report generation" inside a sales report tab like "Daily Sales" to schedule report generation (interval, daily, weekly, or monthly) and view compiled reports anytime in "Saved Reports".',
      },
    ],
  },
  {
    id: '09',
    icon: CustomersIcon,
    eyebrow: '09 / Customers',
    title: 'Keep customer contacts organized and link buyers directly in the POS.',
    desc: 'The Customers (CRM) section helps you build and maintain a clean directory of regular buyers and business clients. Store phone numbers and emails, control active account status, and keep active customers ready for selection in the POS terminal.',
    subheading: 'How to use Customers Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Customers (CRM)"',
        text: 'Open the sidebar under CRM & Relations and click on "Customers (CRM)" to view all registered customers, their contact details, and how many accounts are active.',
      },
      {
        num: '02',
        title: 'Click on "+ Add Customer"',
        text: 'Click "+ Add Customer" in the top right header to open the customer form, then fill in the Customer Full Name (required), Phone Number, and Email Address.',
      },
      {
        num: '03',
        title: 'Set Account Status & Save Profile',
        text: 'Select "Active" or "Inactive" for Account Status (inactive customers are hidden from POS customer selection) and click "Add Customer" to save the customer record.',
      },
      {
        num: '04',
        title: 'Search, Edit, or Remove Customers',
        text: 'Use the search box to find customers by name, phone, or email. Click "Edit" on any customer card to update contact information or status, or click "Delete" to remove a record.',
      },
    ],
  },
  {
    id: '10',
    icon: SuppliersIcon,
    eyebrow: '10 / Suppliers',
    title: 'Manage all your product vendors and procurement contacts.',
    desc: 'The Suppliers section keeps every vendor\'s company name, phone number, email, and physical address organized for fast restocking. Keeping an updated supplier directory ensures your Purchases records stay accurate and easy to audit.',
    subheading: 'How to use Suppliers Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "Suppliers"',
        text: 'Open the sidebar under Catalog & Inventory and click on "Suppliers" to view all saved vendors with their phone numbers, emails, and physical addresses.',
      },
      {
        num: '02',
        title: 'Click on "+ Add Supplier"',
        text: 'Click "+ Add Supplier" in the top right header to open the supplier form, then enter the Supplier Company Name along with phone number, email, and physical address.',
      },
      {
        num: '03',
        title: 'Search & Connect Vendors to Purchases',
        text: 'Use the search bar to locate a supplier by name, email, or phone. Saved suppliers can then be selected directly when recording a purchase in the Purchases section.',
      },
      {
        num: '04',
        title: 'Edit or Delete Supplier Records',
        text: 'Click "Edit" on a supplier card whenever vendor phone numbers, emails, or addresses change, or click "Delete" to remove vendors you no longer purchase from.',
      },
    ],
  },
  {
    id: '11',
    icon: SparklesIcon,
    eyebrow: '11 / AI Assistant',
    title: 'Ask plain language questions about your live sales, stock, and profits.',
    desc: 'The AI Business Assistant reads a live snapshot of your store\'s sales, purchases, products, transactions, and low-stock alerts so you can get instant performance summaries, revenue forecasts, and reorder advice without manually crunching numbers.',
    subheading: 'How to use AI Assistant Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "AI Assistant"',
        text: 'Open the sidebar under System & Intelligence and click on "AI Assistant" to open the chat assistant alongside your live "Data in Context" business summary panel.',
      },
      {
        num: '02',
        title: 'Pick a Quick Question to Start',
        text: 'Tap any Quick Question shortcut such as Sales performance, Top products, Forecast, Low stock alert, Profit analysis, or Busiest days to generate an instant data backed answer.',
      },
      {
        num: '03',
        title: 'Ask Custom Business Questions',
        text: 'Type your own question in the message input box at the bottom and press Enter (or click the send arrow) to get insights tailored directly to your live store records.',
      },
      {
        num: '04',
        title: 'Follow Up or Clear the Conversation',
        text: 'Review the AI response and ask follow up questions to explore trends further, or click "Clear Chat" in the side panel whenever you want to begin a fresh session.',
      },
    ],
  },
  {
    id: '12',
    icon: SettingsIcon,
    eyebrow: '12 / System Settings',
    title: 'Configure your business profile, contacts, and subscription plan.',
    desc: 'System Settings lets you keep your official business details and billing status up to date. Edit the business name, email, phone contacts, and address shown on invoices and receipts, and renew or upgrade your StockPro subscription via NexumPay.',
    subheading: 'How to use System Settings Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Open Sidebar and click on "System Settings"',
        text: 'Open the sidebar under System & Intelligence and click on "System Settings" to inspect your Business Information card and current Subscription & Billing details.',
      },
      {
        num: '02',
        title: 'Click "Edit Information" to Update Business Details',
        text: 'Click "Edit Information" in the top-right corner to update your Business Name, Business Email, and Business Address that appear on customer invoices and printed documents.',
      },
      {
        num: '03',
        title: 'Manage Multiple Contact Numbers & Save',
        text: 'In edit mode, click "+ Add Contact" to add Mobile, Office, Landline, or WhatsApp numbers, remove old entries if needed, and click "Save Changes" to apply updates everywhere.',
      },
      {
        num: '04',
        title: 'Manage or Renew Your Subscription Plan',
        text: 'Scroll to Subscription & Billing (NexumPay), toggle Monthly or Annual billing, and click Subscribe or Renew on your chosen plan to pay with MTN Mobile Money or Airtel Money.',
      },
    ],
  },
];

export function GuideFeatureContent({ feature }) {
  if (!feature) return null;
  const IconComp = feature.icon;
  const { desc } = feature;

  return (
    <div className="sp-container">
      <div className="sp-guide-card-content">
        {/* Eyebrow */}
        <div className="sp-editorial-eyebrow">
          <IconComp size={14} />
          <span>{feature.eyebrow}</span>
        </div>

        {/* Title */}
        <h2 className="sp-editorial-title">{feature.title}</h2>

        {/* Description */}
        {typeof desc === 'string' ? (
          <p className="sp-editorial-body">{desc}</p>
        ) : (
          <div className="sp-editorial-body sp-guide-body-structured">
            {desc?.intro && <p className="sp-guide-body-paragraph">{desc.intro}</p>}
            {Array.isArray(desc?.points) && desc.points.length > 0 && (
              <ul className="sp-guide-desc-list">
                {desc.points.map((point, idx) => (
                  <li key={idx} className="sp-guide-desc-item">
                    <span className="sp-guide-desc-marker" aria-hidden="true">&gt;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {desc?.outro && <p className="sp-guide-body-paragraph">{desc.outro}</p>}
          </div>
        )}

        {/* Subheading: How to use [Feature] Step-by-Step */}
        <h3 className="sp-guide-step-subheading">{feature.subheading}</h3>

        {/* 2x2 Grid of Step Cards */}
        <div className="sp-guide-steps-grid">
          {feature.steps.map((step) => (
            <div key={step.num} className="sp-guide-step-card">
              <div className="sp-guide-step-badge">STEP {step.num}</div>
              <h4 className="sp-guide-step-title">{step.title}</h4>
              <p className="sp-guide-step-text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const HOME_FEATURES = [
  {
    id: '01',
    icon: InventoryIcon,
    eyebrow: '01 / Products',
    ariaLabel: 'Products Capability',
    title: 'Know what you have. Know what needs attention.',
    body: 'Manage your full product catalog, SKU codes, barcodes, cost and selling prices, and low-stock reorder alert levels from one screen. Every product you add is immediately available in the Point of Sale register.',
    checklist: [
      {
        label: 'QR-code & barcode scanning:',
        text: 'Scan product QR-codes and barcodes when adding and updating products.',
      },
      {
        label: 'Low Stock Alerts:',
        text: 'Set minimum reorder levels per product so the app alerts you before shelves run empty.',
      },
      {
        label: 'Live POS Synchronization:',
        text: 'New items, stock levels, and price edits reflect instantly in the POS section.',
      },
    ],
    visualTitle: 'PRODUCTS & STOCK >> INVENTORY CATALOG',
    visualBadge: '',
    screenshot: productsScreenshot,
    screenshotAlt: 'StockPro tenant Products & Stock dashboard showing product inventory, SKUs, prices, and low stock status',
  },
  {
    id: '02',
    icon: PosIcon,
    eyebrow: '02 / Point of Sale',
    ariaLabel: 'Point of Sale Capability',
    title: 'Record your sales quickly with auto stock reduction.',
    body: 'Record every counter sale in seconds with the fast POS terminal built for business speed. Choose products by category, scan QR codes and barcodes, process multi-method payments, and print receipts while stock updates automatically.',
    checklist: [
      {
        label: 'Barcode & Category Search:',
        text: 'Scan item barcodes and QR codes, search by name, or filter by category tabs to build carts rapidly.',
      },
      {
        label: 'Flexible Payment Methods:',
        text: 'Accept Cash, Mobile Money, or Card with optional discounts, taxes, and customer linking.',
      },
      {
        label: 'Instant Printable Receipts:',
        text: 'Complete sales in one click and immediately print or save branded customer receipts.',
      },
    ],
    visualTitle: 'POS TERMINAL >> CASHIER CHECKOUT',
    visualBadge: '',
    screenshot: posScreenshot,
    screenshotAlt: 'StockPro tenant Point of Sale terminal with barcode search, category filters, and active checkout cart',
  },
  {
    id: '03',
    icon: CategoryIcon,
    eyebrow: '03 / Categories',
    ariaLabel: 'Categories Capability',
    title: 'Organise your products into clear groups for faster sales.',
    body: 'Group large catalogs into structured categories such as Smartphones, Printers & Ink, or Beverages. Organised categories keep inventory clean and let cashiers tap a group in POS instead of scrolling through thousands of items.',
    checklist: [
      {
        label: 'Faster POS Operations:',
        text: 'Tap any category inside the Point of Sale screen to filter relevant products immediately.',
      },
      {
        label: 'Structured Catalog View:',
        text: 'Keep departments clearly separated so staff locate, audit, and restock products quickly.',
      },
      {
        label: 'Simple Create & Edit:',
        text: 'Add, rename, or remove product categories anytime with real-time updates.',
      },
    ],
    visualTitle: 'PRODUCT CATEGORIES >> CATALOG GROUPS',
    visualBadge: 'Catalog Structure',
    screenshot: categoriesScreenshot,
    screenshotAlt: 'StockPro tenant Categories page showing grouped product categories with edit and delete controls',
  },
  {
    id: '04',
    icon: InvoiceIcon,
    eyebrow: '04 / Sales',
    ariaLabel: 'Sales Capability',
    title: 'View all your sales history with a receipt for every transaction.',
    body: 'Track every completed sale across your store with clear visibility into timestamps, payment methods, linked customers, and staff members. Review past orders, generate invoices, or reprint any sale receipt anytime.',
    checklist: [
      {
        label: 'Daily, Weekly & Monthly Views:',
        text: 'Filter transactions by All Sales, Today, This Week, or This Month in a single click.',
      },
      {
        label: 'Instant Receipt & Invoice Access:',
        text: 'Inspect line items, view printable receipts, or open invoices directly from the sales table.',
      },
      {
        label: 'Clean Record Corrections:',
        text: 'Edit or remove mistaken sales entries with full accountability and automatic totals.',
      },
    ],
    visualTitle: 'SALES HISTORY >> TRANSACTIONS & RECEIPTS',
    visualBadge: 'Revenue Ledger',
    screenshot: salesScreenshot,
    screenshotAlt: 'StockPro tenant Sales History page showing revenue metrics, period filters, and transaction receipts',
  },
  {
    id: '05',
    icon: PurchaseIcon,
    eyebrow: '05 / Purchases',
    ariaLabel: 'Purchases Capability',
    title: 'Keep restocking connected to the inventory it updates.',
    body: 'Record every restock order and supplier delivery so you always know how much was spent on inventory. Recording a purchase automatically adds the purchased quantities straight into your available store stock.',
    checklist: [
      {
        label: 'Automatic Stock Replenishment:',
        text: 'Purchased quantities increment your existing catalog inventory as soon as the purchase is saved.',
      },
      {
        label: 'Supplier & Cost Visibility:',
        text: 'Track unit purchase prices and supplier spend to protect profit margins.',
      },
      {
        label: 'Date & Period Filtering:',
        text: 'Review restocks by Today, This Week, This Month, or pick any specific date or week.',
      },
    ],
    visualTitle: 'PURCHASES • PROCUREMENT & RESTOCKING',
    visualBadge: 'Stock Ingestion',
    screenshot: purchasesScreenshot,
    screenshotAlt: 'StockPro tenant Purchases page showing total spend, supplier deliveries, and period filters',
  },
  {
    id: '06',
    icon: ShieldIcon,
    eyebrow: '06 / Users Control',
    ariaLabel: 'Users Control Capability',
    title: 'Manage staff accounts, roles, and access permissions.',
    body: 'Add staff members and assign predefined roles (Owner, Admin, Manager, Cashier) or create custom roles with exact granular permissions. Enable, disable, edit, or audit user access anytime while protecting sensitive figures.',
    checklist: [
      {
        label: 'Predefined & Custom Roles:',
        text: 'Assign standard roles or tailor custom permission sets across products, sales, purchases, and reports.',
      },
      {
        label: 'Instant Enable / Disable Access:',
        text: 'Pause or restore a staff account immediately without losing historical sales attribution.',
      },
      {
        label: 'Role & Team Overview:',
        text: 'Inspect all active users, assigned roles, and permission scopes from one panel.',
      },
    ],
    visualTitle: 'USER CONTROL • STAFF ROLES & PERMISSIONS',
    visualBadge: 'Access Matrix',
    screenshot: usersScreenshot,
    screenshotAlt: 'StockPro tenant User Management page showing team accounts, predefined roles, and custom roles',
  },
  {
    id: '07',
    icon: StockMovementsIcon,
    eyebrow: '07 / Stock Movements',
    ariaLabel: 'Stock Movements Capability',
    title: 'Track every unit moving in, out, or adjusted across your store.',
    body: 'Monitor a complete audit ledger of Stock In (purchases), Stock Out (sales), and manual Stock Adjustments. Record damaged goods, physical stock count corrections, or direct warehouse transfers with documented reasons.',
    checklist: [
      {
        label: 'Complete Movement Ledger:',
        text: 'Search and filter every movement by product or movement type (IN, OUT, or Adjustment).',
      },
      {
        label: 'Flexible Stock Adjustments:',
        text: 'Add units, deduct damaged goods, or set an exact stock count level cleanly.',
      },
      {
        label: 'Transparent Audit Trail:',
        text: 'Attach reasons and dates to every manual adjustment so stock counts stay accountable.',
      },
    ],
    visualTitle: 'STOCK MOVEMENTS • INVENTORY AUDIT TRAIL',
    visualBadge: 'Movement Ledger',
    screenshot: stockMovementsScreenshot,
    screenshotAlt: 'StockPro tenant Stock Movements page showing IN, OUT, and Adjustment inventory audit records',
  },
  {
    id: '08',
    icon: ReportsIcon,
    eyebrow: '08 / Reports & Analytics',
    ariaLabel: 'Reports & Analytics Capability',
    title: 'Understand your revenue, costs, net profit, and top performers.',
    body: 'Turn daily sales, purchases, and inventory activity into actionable financial charts and summaries. Generate Daily, Weekly, Monthly, or Yearly reports, export CSV/PDF/Word files, and automate scheduled reports.',
    checklist: [
      {
        label: 'Revenue & Gross Profit Clarity:',
        text: 'Compare collected sales against stock costs, net cash flow, and top-performing items.',
      },
      {
        label: 'Multi-Format Exports:',
        text: 'Export Overview, Sales, Purchases, Sold Items, and Inventory reports in CSV, PDF, or Word.',
      },
      {
        label: 'Automated Scheduled Reports:',
        text: 'Configure recurring Daily, Weekly, or Monthly reports and inspect them anytime in Saved Reports.',
      },
    ],
    visualTitle: 'ANALYTICS & REPORTS • FINANCIAL INTELLIGENCE',
    visualBadge: 'Profit & Exports',
    screenshot: reportsScreenshot,
    screenshotAlt: 'StockPro tenant Reports & Analytics dashboard showing financial KPIs, exports, and profit analytics',
  },
  {
    id: '09',
    icon: CustomersIcon,
    eyebrow: '09 / Customers',
    ariaLabel: 'Customers Capability',
    title: 'Keep customer contacts organized and link buyers directly in POS.',
    body: 'Build a clean CRM directory of regular shoppers and business accounts with phone numbers, emails, and active statuses. Active customers appear directly inside the Point of Sale register for fast checkout tagging.',
    checklist: [
      {
        label: 'Organized Client Directory:',
        text: 'Store customer names, phone numbers, email addresses, and account statuses cleanly.',
      },
      {
        label: 'Active / Inactive Status Control:',
        text: 'Toggle customer status to control which accounts remain selectable in POS.',
      },
      {
        label: 'Fast Search & Updates:',
        text: 'Search customers by name, email, or phone and update contact details anytime.',
      },
    ],
    visualTitle: 'CUSTOMERS (CRM) • CLIENT DIRECTORY',
    visualBadge: 'Buyer Profiles',
    screenshot: customersScreenshot,
    screenshotAlt: 'StockPro tenant Customers CRM page showing client contact cards and active status',
  },
  {
    id: '10',
    icon: SuppliersIcon,
    eyebrow: '10 / Suppliers',
    ariaLabel: 'Suppliers Capability',
    title: 'Manage all your product vendors and procurement contacts.',
    body: 'Keep every vendor company name, phone contact, email address, and physical warehouse location organized in one directory. Saved suppliers connect directly into Purchases so restocking stays fast and auditable.',
    checklist: [
      {
        label: 'Complete Vendor Profiles:',
        text: 'Store phone numbers, emails, and physical addresses for every supplier you buy from.',
      },
      {
        label: 'Connected to Purchases:',
        text: 'Select any saved vendor directly when recording incoming stock purchases.',
      },
      {
        label: 'Easy Search & Maintenance:',
        text: 'Find suppliers quickly and edit or remove vendor entries as relationships change.',
      },
    ],
    visualTitle: 'SUPPLIERS • VENDOR DIRECTORY',
    visualBadge: 'Procurement',
    screenshot: suppliersScreenshot,
    screenshotAlt: 'StockPro tenant Suppliers page showing vendor cards with phone, email, and physical addresses',
  },
  {
    id: '11',
    icon: SparklesIcon,
    eyebrow: '11 / AI Assistant',
    ariaLabel: 'AI Assistant Capability',
    title: 'Ask plain language questions about your live sales, stock, and profits.',
    body: 'Chat with a built-in AI business analyst connected to a live snapshot of your sales, purchases, products, transactions, and low-stock alerts. Use one-click Quick Questions or ask custom questions to spot trends immediately.',
    checklist: [
      {
        label: 'Live Data in Context:',
        text: 'Reads real-time sales totals, purchase spend, product counts, and low-stock alerts automatically.',
      },
      {
        label: 'One-Click Quick Questions:',
        text: 'Check sales performance, top products, forecasts, low-stock priorities, and busiest days instantly.',
      },
      {
        label: 'Natural Language Follow-Ups:',
        text: 'Ask follow-up questions in plain English to explore margins and reorder decisions.',
      },
    ],
    visualTitle: 'AI BUSINESS ASSISTANT • LIVE STORE CONTEXT',
    visualBadge: 'Smart Insights',
    screenshot: aiScreenshot,
    screenshotAlt: 'StockPro tenant AI Business Assistant showing chat interface, quick questions, and live data in context',
  },
  {
    id: '12',
    icon: SettingsIcon,
    eyebrow: '12 / System Settings',
    ariaLabel: 'System Settings Capability',
    title: 'Configure your business profile, contacts, modules, and billing plan.',
    body: 'Manage your official business name, email, address, TIN, branding logo, digital signature, multiple contact channels, active workspace modules, and NexumPay subscription plan from one centralized control page.',
    checklist: [
      {
        label: 'Business Profile & Branding:',
        text: 'Set your business logo, signature, TIN, and receipt theme shown on printed customer documents.',
      },
      {
        label: 'Multi-Line Business Contacts:',
        text: 'Add Mobile, WhatsApp, Landline, or Office phone lines for customer invoices and receipts.',
      },
      {
        label: 'Modules & NexumPay Billing:',
        text: 'Enable or hide workspace modules and renew Monthly or Annual plans with Mobile Money.',
      },
    ],
    visualTitle: 'BUSINESS SETTINGS • PROFILE & SUBSCRIPTION',
    visualBadge: 'Store Control',
    screenshot: settingsScreenshot,
    screenshotAlt: 'StockPro tenant System Settings page showing business profile, contacts, and configuration tabs',
  },
];

export default function FeatureShowcase({ activeId = '01', textOnly = false }) {
  // If textOnly mode (StockPro Guide on How It Works page):
  if (textOnly) {
    const guideItem = GUIDE_FEATURES.find((item) => item.id === activeId);
    if (!guideItem) return null;

    return (
      <div id="features" aria-label="System Capabilities">
        <section
          className="sp-section sp-section-white sp-capability-panel"
          role="tabpanel"
          aria-label={guideItem.eyebrow}
        >
          <GuideFeatureContent feature={guideItem} />
        </section>
      </div>
    );
  }

  const feature = HOME_FEATURES.find((item) => item.id === activeId) || HOME_FEATURES[0];
  const IconComp = feature.icon;

  return (
    <div id="features" aria-label="System Capabilities">
      <section
        className="sp-section sp-section-white sp-capability-panel"
        role="tabpanel"
        aria-label={feature.ariaLabel}
      >
        <div className="sp-container">
          <div className="sp-editorial-row">
            <div className="sp-editorial-text" data-aos="fade-right">
              <div className="sp-editorial-eyebrow">
                <IconComp size={14} />
                <span>{feature.eyebrow}</span>
              </div>
              <h2 className="sp-editorial-title">{feature.title}</h2>
              <p className="sp-editorial-body">{feature.body}</p>
              <ul className="sp-editorial-checklist">
                {feature.checklist.map((item) => (
                  <li key={item.label} className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span>
                      <strong>{item.label}</strong> {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
              <div className="sp-feature-screenshot-bar">
                <span className="sp-feature-screenshot-title">
                  {feature.visualTitle}
                </span>
                <span className="sp-num sp-feature-screenshot-badge">
                  {feature.visualBadge}
                </span>
              </div>
              <div className="sp-feature-screenshot-frame">
                <img
                  src={feature.screenshot}
                  alt={feature.screenshotAlt}
                  className="sp-feature-screenshot-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
