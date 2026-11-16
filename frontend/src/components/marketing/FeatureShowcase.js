import React from 'react';
import {
  CheckIcon,
  InventoryIcon,
  PosIcon,
  PurchaseIcon,
  CustomersIcon,
  ReportsIcon,
  ShieldIcon,
  StockMovementsIcon,
  SuppliersIcon,
  SparklesIcon,
  SettingsIcon,
} from './Icons';

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

  // Default layout with live tables for LandingPage
  return (
    <div id="features" aria-label="System Capabilities">
      {/* 01: REAL-TIME INVENTORY */}
      {activeId === '01' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Inventory Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <InventoryIcon size={14} />
                  <span>01 / Real-Time Inventory</span>
                </div>
                <h2 className="sp-editorial-title">
                  Know what you have. Know what needs attention.
                </h2>
                <p className="sp-editorial-body">
                  StockPro links every physical product unit directly to counter sales and incoming supplier restock orders. When a cashier completes a sale, stock decrements instantly. When a delivery arrives, catalog quantities update with zero manual recount delay.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Automated SKU Conventions:</strong> Auto-generate structured SKUs categorized by brand, department, and package size.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Continuous Movement Audit Trail:</strong> Every addition, sale deduction, or damaged-stock write-off is logged with staff name and reason.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Proactive Threshold Warnings:</strong> Set minimum stock warning levels per product so managers receive alerts before shelves empty.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    CENTRAL CATALOG &bull; STOCK MANAGEMENT
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#93C5FD' }}>
                    Live Ledger
                  </span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--sp-off-white)' }}>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>Product &amp; SKU</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Cost Price</th>
                        <th style={{ textAlign: 'right' }}>Retail Price</th>
                        <th style={{ textAlign: 'center' }}>Stock Level</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Samsung Galaxy A54 128GB</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>TEL-7721</div>
                        </td>
                        <td><span className="sp-preview-badge">Smartphones</span></td>
                        <td className="sp-num text-right" style={{ color: '#64748B' }}>820,000</td>
                        <td className="sp-num text-right bold">UGX 980,000</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sp-num" style={{ color: '#DC2626', fontWeight: 700 }}>2 units</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>min: 10</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 10.5 }}>
                            Low Stock
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>HP LaserJet Toner 85A</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>ACC-3042</div>
                        </td>
                        <td><span className="sp-preview-badge">Printers &amp; Ink</span></td>
                        <td className="sp-num text-right" style={{ color: '#64748B' }}>140,000</td>
                        <td className="sp-num text-right bold">UGX 195,000</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sp-num" style={{ color: '#DC2626', fontWeight: 700 }}>3 units</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>min: 8</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 10.5 }}>
                            Low Stock
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Logitech MX Master 3S</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>PER-4109</div>
                        </td>
                        <td><span className="sp-preview-badge">Peripherals</span></td>
                        <td className="sp-num text-right" style={{ color: '#64748B' }}>310,000</td>
                        <td className="sp-num text-right bold">UGX 420,000</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="sp-num" style={{ color: '#059669', fontWeight: 700 }}>14 units</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>min: 5</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>
                            Healthy
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 02: POINT OF SALE */}
      {activeId === '02' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Point of Sale Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <PosIcon size={14} />
                  <span>02 / Point of Sale</span>
                </div>
                <h2 className="sp-editorial-title">
                  Move customers through checkout without losing track of stock.
                </h2>
                <p className="sp-editorial-body">
                  Keep counter lines moving with an intuitive checkout interface built for speed. Barcode scanning, immediate search by name, multi-tender payment processing, and instant receipt generation allow cashiers to complete sales in seconds while stock levels stay accurate in real time.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Multi-Tender Flexibility:</strong> Accept Cash, MTN/Airtel Mobile Money, or Card payments per transaction.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Thermal Receipt Generation:</strong> Standard 80mm and 58mm thermal receipt printing with store branding.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Shift Reconciliation:</strong> Cashier drawer opening float and end-of-shift cash sign-offs prevent discrepancy.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    POS REGISTER #01 &bull; CASHIER TERMINAL
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#A5F3FC' }}>
                    Shift: Sarah N.
                  </span>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--sp-white)' }}>
                  <div style={{ backgroundColor: 'var(--sp-surface-soft)', border: '1px solid var(--sp-border)', borderRadius: 0, padding: '8px 12px', fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: '#64748B' }}>Scan barcode or search product...</span>
                    <span className="sp-num" style={{ color: 'var(--sp-navy-700)', fontWeight: 700 }}>[F4]</span>
                  </div>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>Cart Item</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Rate</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Logitech MX Master 3S</strong></td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>1</td>
                        <td className="sp-num text-right">420,000</td>
                        <td className="sp-num text-right bold">UGX 420,000</td>
                      </tr>
                      <tr>
                        <td><strong>USB-C Braided Heavy Cable 2M</strong></td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>2</td>
                        <td className="sp-num text-right">35,000</td>
                        <td className="sp-num text-right bold">UGX 70,000</td>
                      </tr>
                      <tr>
                        <td><strong>SanDisk Ultra Dual 128GB Flash</strong></td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>1</td>
                        <td className="sp-num text-right">65,000</td>
                        <td className="sp-num text-right bold">UGX 65,000</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Net Payable (Incl. 18% VAT)</div>
                      <div className="sp-num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--sp-navy-950)' }}>
                        UGX 555,000
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="sp-tender-btn active" style={{ padding: '6px 10px', fontSize: 11 }}>Cash [F1]</span>
                      <span className="sp-tender-btn" style={{ padding: '6px 10px', fontSize: 11 }}>M-Money [F2]</span>
                      <span className="sp-tender-btn" style={{ padding: '6px 10px', fontSize: 11 }}>Card [F3]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 03: PURCHASES & SUPPLIERS */}
      {activeId === '03' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Purchases Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <PurchaseIcon size={14} />
                  <span>03 / Purchases &amp; Suppliers</span>
                </div>
                <h2 className="sp-editorial-title">
                  Keep purchasing activity connected to the inventory it affects.
                </h2>
                <p className="sp-editorial-body">
                  Eliminate lost paper delivery notes and undocumented supplier deliveries. StockPro provides an auditable procurement ledger that connects purchase costs against selling prices, automatically updates catalog inventory upon receipt, and tracks vendor dues.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Vendor Directory &amp; History:</strong> Maintain supplier contacts, historical orders, and pricing terms.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Direct Stock Ingestion:</strong> Inbound items transfer directly into active catalog quantities upon delivery verification.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Accurate Cost &amp; Profit Margins:</strong> Monitor purchase price changes to preserve healthy profit spreads.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    PURCHASE ORDERS &bull; VENDOR DELIVERIES
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#93C5FD' }}>
                    Procurement
                  </span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--sp-off-white)' }}>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>PO Ref</th>
                        <th>Supplier Name</th>
                        <th>Items Received</th>
                        <th style={{ textAlign: 'right' }}>Total Cost</th>
                        <th style={{ textAlign: 'right' }}>Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="sp-num bold">PO-2026-081</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>East Africa Tech Supplies</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Kampala Industrial Area</div>
                        </td>
                        <td style={{ fontSize: 11.5 }}>15x HP LaserJet 85A</td>
                        <td className="sp-num text-right bold">UGX 2,100,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10 }}>
                            Received &amp; Stocked
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="sp-num bold">PO-2026-082</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Kampala Power Importers</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Nakawa Business Park</div>
                        </td>
                        <td style={{ fontSize: 11.5 }}>20x 65W GaN Chargers</td>
                        <td className="sp-num text-right bold">UGX 1,100,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-warning" style={{ fontSize: 10 }}>
                            Pending Delivery
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="sp-num bold">PO-2026-079</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Prime Electronics Dist.</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Downtown Depot</div>
                        </td>
                        <td style={{ fontSize: 11.5 }}>5x Galaxy A54 128GB</td>
                        <td className="sp-num text-right bold">UGX 4,100,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10 }}>
                            Received &amp; Stocked
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 04: CUSTOMERS */}
      {activeId === '04' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Customers Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <CustomersIcon size={14} />
                  <span>04 / Customers &amp; Accounts</span>
                </div>
                <h2 className="sp-editorial-title">
                  Build repeat business with client histories and credit ledgers.
                </h2>
                <p className="sp-editorial-body">
                  Track individual buyer balances, transaction frequency, and contact details from POS checkout to commercial invoicing. Never lose track of outstanding receivables or which clients drive your highest store revenue.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Client Purchase Ledgers:</strong> Complete transaction history with running balances, total spend, and visit count.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Credit &amp; Invoicing:</strong> Issue custom invoices, manage payment terms, and prevent overdue debts.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Fast Checkout Tagging:</strong> Link a customer at the POS register with instant phone number or name lookup.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    CUSTOMER DIRECTORY &bull; CREDIT LEDGER
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#93C5FD' }}>
                    Client Records
                  </span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--sp-off-white)' }}>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>Customer &amp; Contact</th>
                        <th>Account Type</th>
                        <th style={{ textAlign: 'right' }}>Total Spend</th>
                        <th style={{ textAlign: 'right' }}>Balance</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Kampala Tech Solutions</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>+256 701 442 890</div>
                        </td>
                        <td><span className="sp-preview-badge">Wholesale</span></td>
                        <td className="sp-num text-right bold">UGX 14,800,000</td>
                        <td className="sp-num text-right" style={{ color: '#059669', fontWeight: 700 }}>UGX 0</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>
                            Good Standing
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Nakasero Medical Clinic</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>+256 772 119 045</div>
                        </td>
                        <td><span className="sp-preview-badge">Corporate</span></td>
                        <td className="sp-num text-right bold">UGX 8,450,000</td>
                        <td className="sp-num text-right" style={{ color: '#DC2626', fontWeight: 700 }}>UGX 650,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 10.5 }}>
                            Overdue (14d)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Sarah Namubiru</div>
                          <div className="sp-num" style={{ fontSize: 10.5, color: '#64748B' }}>+256 754 883 201</div>
                        </td>
                        <td><span className="sp-preview-badge">Retail VIP</span></td>
                        <td className="sp-num text-right bold">UGX 3,120,000</td>
                        <td className="sp-num text-right" style={{ color: '#059669', fontWeight: 700 }}>UGX 0</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>
                            Good Standing
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 05: REPORTS & ANALYTICS */}
      {activeId === '05' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Reports Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <ReportsIcon size={14} />
                  <span>05 / Reports &amp; Analytics</span>
                </div>
                <h2 className="sp-editorial-title">
                  Know your profit, margins, and sales without manual spreadsheets.
                </h2>
                <p className="sp-editorial-body">
                  Replace guesswork with automated end-of-day reconciliation. StockPro generates clean profit-and-loss summaries, inventory valuation audits, and cashier performance breakdowns so you always know the true financial health of your store.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>True Profit &amp; Margins:</strong> Automated calculations deducting supplier purchase cost from sales revenue.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Shift Reconciliation:</strong> Audit cash drawers against cash, Mobile Money, and card settlement totals.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Exportable Compliance:</strong> Generate one-click PDF summaries and CSV data sheets for accounting audits.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    DAILY AUDIT REPORT &bull; REVENUE &amp; MARGINS
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#93C5FD' }}>
                    Financial Audit
                  </span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--sp-off-white)' }}>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>Department / Category</th>
                        <th style={{ textAlign: 'center' }}>Units Sold</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                        <th style={{ textAlign: 'right' }}>Net Margin</th>
                        <th style={{ textAlign: 'right' }}>Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Smartphones &amp; Tablets</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Primary hardware sales</div>
                        </td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>18</td>
                        <td className="sp-num text-right bold">UGX 12,450,000</td>
                        <td className="sp-num text-right" style={{ color: '#059669', fontWeight: 700 }}>UGX 2,610,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>21.0%</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Printers &amp; Ink Supplies</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Consumables restock</div>
                        </td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>32</td>
                        <td className="sp-num text-right bold">UGX 4,200,000</td>
                        <td className="sp-num text-right" style={{ color: '#059669', fontWeight: 700 }}>UGX 1,220,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>29.0%</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Computer Peripherals</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>High-margin accessories</div>
                        </td>
                        <td className="sp-num" style={{ textAlign: 'center' }}>45</td>
                        <td className="sp-num text-right bold">UGX 1,800,000</td>
                        <td className="sp-num text-right" style={{ color: '#059669', fontWeight: 700 }}>UGX 630,000</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>35.0%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 06: TEAM ACCESS & PERMISSIONS */}
      {activeId === '06' && (
        <section className="sp-section sp-section-white sp-capability-panel" role="tabpanel" aria-label="Team Access Capability">
          <div className="sp-container">
            <div className="sp-editorial-row">
              <div className="sp-editorial-text" data-aos="fade-right">
                <div className="sp-editorial-eyebrow">
                  <ShieldIcon size={14} />
                  <span>06 / Team Access &amp; Permissions</span>
                </div>
                <h2 className="sp-editorial-title">
                  Control staff permissions while protecting sensitive store data.
                </h2>
                <p className="sp-editorial-body">
                  Give cashiers, store managers, and accountants exactly the access they need without exposing supplier costs, net profit totals, or store-wide administrative controls. Every transaction and stock count is stamped with staff accountability.
                </p>
                <ul className="sp-editorial-checklist">
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Role-Based Access:</strong> Preset Owner, Manager, and Cashier permission tiers.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Sensitive Data Masking:</strong> Hide supplier purchase prices, discounts, and margins from counter staff.</span>
                  </li>
                  <li className="sp-editorial-check-item">
                    <span className="sp-check-bullet"><CheckIcon size={12} /></span>
                    <span><strong>Full Action Attribution:</strong> Every receipt, sale void, and inventory recount is logged with user stamps.</span>
                  </li>
                </ul>
              </div>

              <div className="sp-editorial-visual" data-aos="fade-left" data-aos-delay="120">
                <div style={{ backgroundColor: 'var(--sp-navy-900)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sp-navy-800)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    STAFF ACCESS CONTROL &bull; ROLE PERMISSIONS
                  </span>
                  <span className="sp-num" style={{ fontSize: 11, color: '#93C5FD' }}>
                    Security Matrix
                  </span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--sp-off-white)' }}>
                  <table className="sp-preview-table">
                    <thead>
                      <tr>
                        <th>Staff Member</th>
                        <th>Assigned Role</th>
                        <th>Register Terminal</th>
                        <th>Permission Scope</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Collins N.</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Store Owner</div>
                        </td>
                        <td><span className="sp-preview-badge">Super Admin</span></td>
                        <td>All Terminals</td>
                        <td style={{ fontSize: 11.5, color: '#475569' }}>Unrestricted System Access</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>Active</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>Sarah N.</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Front Cashier</div>
                        </td>
                        <td><span className="sp-preview-badge">Cashier Tier</span></td>
                        <td>POS Register #01</td>
                        <td style={{ fontSize: 11.5, color: '#475569' }}>Checkout &amp; Receipts Only</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 10.5 }}>On Shift</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>David M.</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Store Manager</div>
                        </td>
                        <td><span className="sp-preview-badge">Manager</span></td>
                        <td>Main Counter &amp; Stock</td>
                        <td style={{ fontSize: 11.5, color: '#475569' }}>Catalog, Restocks &amp; Shifts</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="sp-badge sp-badge-success" style={{ fontSize: 10.5 }}>Active</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
