import React from 'react';
import {
  CheckIcon,
  InventoryIcon,
  PosIcon,
  PurchaseIcon,
  CustomersIcon,
  ReportsIcon,
  ShieldIcon,
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
    eyebrow: '06 / Team Access & Permissions',
    title: 'Control staff permissions while protecting sensitive store data.',
    desc: 'Give cashiers, store managers, and accountants exactly the access they need without exposing supplier costs, net profit totals, or store-wide administrative controls. Every transaction and stock count is stamped with staff accountability.',
    subheading: 'How to use Team Access & Permissions Step-by-Step',
    steps: [
      {
        num: '01',
        title: 'Invite staff members',
        text: 'Add employee profiles by name, email, and designated store branch or terminal.',
      },
      {
        num: '02',
        title: 'Assign role-based access tiers',
        text: 'Select from preset permission roles (Owner / Super Admin, Store Manager, Cashier) to control system privileges strictly.',
      },
      {
        num: '03',
        title: 'Protect sensitive commercial data',
        text: 'Mask supplier purchase prices, discount limits, and store-wide profit figures from front-counter cashiers.',
      },
      {
        num: '04',
        title: 'Audit user accountability logs',
        text: 'Review timestamps and staff attribution for every receipt, voided sale, price override, and shift handoff.',
      },
    ],
  },
];

export default function FeatureShowcase({ activeId = '01', textOnly = false }) {
  // If textOnly mode (StockPro Guide on How It Works page):
  if (textOnly) {
    const guideItem = GUIDE_FEATURES.find((item) => item.id === activeId);
    if (!guideItem) return null;
    const IconComp = guideItem.icon;

    return (
      <div id="features" aria-label="System Capabilities">
        <section
          className="sp-section sp-section-white sp-capability-panel"
          role="tabpanel"
          aria-label={guideItem.eyebrow}
        >
          <div className="sp-container">
            <div className="sp-guide-card-content">
              {/* Eyebrow */}
              <div className="sp-editorial-eyebrow">
                <IconComp size={14} />
                <span>{guideItem.eyebrow}</span>
              </div>

              {/* Title */}
              <h2 className="sp-editorial-title">{guideItem.title}</h2>

              {/* Description */}
              <p className="sp-editorial-body">{guideItem.desc}</p>

              {/* Subheading: How to use [Feature] Step-by-Step */}
              <h3 className="sp-guide-step-subheading">{guideItem.subheading}</h3>

              {/* 2x2 Grid of Step Cards */}
              <div className="sp-guide-steps-grid">
                {guideItem.steps.map((step) => (
                  <div key={step.num} className="sp-guide-step-card">
                    <div className="sp-guide-step-badge">STEP {step.num}</div>
                    <h4 className="sp-guide-step-title">{step.title}</h4>
                    <p className="sp-guide-step-text">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
