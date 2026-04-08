# Inventory & Sales Management System

A modern, full-stack inventory and sales management system built with Laravel (backend) and React (frontend). Perfect for small to medium businesses to manage their inventory, sales, purchases, and generate reports.

## 🚀 Features

### Backend (Laravel 12)
- **Multi-tenant Architecture** - Multiple businesses on one platform
- **RESTful API** - Complete API with 35+ endpoints
- **Authentication** - Laravel Sanctum token-based auth
- **Role-based Access** - Admin, Manager, Cashier roles
- **Database** - MySQL with proper relationships and constraints
- **Inventory Management** - Products, categories, suppliers
- **Sales Processing** - Complete POS transaction handling
- **Purchase Management** - Supplier order tracking
- **Stock Movements** - Complete audit trail
- **Reports** - Daily sales, monthly purchases

### Frontend (React 19)
- **Modern Dashboard** - Clean, responsive UI
- **Authentication** - Login/Register with persistent sessions
- **Real-time Data** - Live inventory and sales data
- **Interactive Forms** - Add products, process sales
- **Responsive Design** - Works on desktop and mobile
- **Data Visualization** - Stats cards, tables, reports
- **Low Stock Alerts** - Automatic reorder notifications

## 📋 Requirements

- **PHP** 8.2+
- **Composer** 2.0+
- **Node.js** 16+
- **MySQL** 8.0+
- **Web Server** (Apache/Nginx)

## 🛠️ Installation

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Configure environment**
   ```bash
   # .env file is already created with proper settings
   # Update database credentials if needed
   ```

4. **Generate application key**
   ```bash
   php artisan key:generate
   ```

5. **Create database**
   ```sql
   CREATE DATABASE inventory_and_sales_management;
   ```

6. **Run migrations**
   ```bash
   php artisan migrate
   ```

7. **Start Laravel server**
   ```bash
   php artisan serve
   # Runs on http://localhost:8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start React development server**
   ```bash
   npm start
   # Runs on http://localhost:3001
   ```

## 🎯 Usage

### Getting Started

1. **Register a Business**
   - Open http://localhost:3001
   - Click "Register Business"
   - Enter business name, email, and password
   - System creates tenant and admin user automatically

2. **Login**
   - Use your registered email and password
   - Access the modern dashboard

### Dashboard Features

#### Overview Tab
- **Statistics Cards** - Total products, sales, purchases, low stock
- **Recent Sales** - Latest 5 sales transactions
- **Low Stock Alerts** - Products needing reorder

#### Products Tab
- **Product List** - All products with stock levels
- **Add Products** - Click "+ Add Product" button
- **Stock Monitoring** - Red highlighting for low stock

#### Categories Tab
- **Category Management** - Organize products
- **Category Cards** - Visual category display

#### Suppliers Tab
- **Supplier Directory** - Contact information
- **Supplier Cards** - Easy-to-read format

#### Sales Tab
- **Sales History** - All sales transactions
- **Payment Methods** - Cash, card, mobile money, bank transfer

#### Purchases Tab
- **Purchase History** - All supplier purchases
- **Stock Increases** - Automatic inventory updates

#### Reports Tab
- **Financial Summary** - Revenue calculations
- **Inventory Summary** - Stock statistics

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - Register new business
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Products
- `GET /api/products?tenant_id=1` - List products
- `POST /api/products` - Add product
- `GET /api/products/low-stock?tenant_id=1` - Low stock items

### Sales
- `GET /api/sales?tenant_id=1` - List sales
- `POST /api/sales` - Process sale
- `GET /api/sales/daily-report?tenant_id=1` - Daily report

### Full API documentation available in `backend/API_ENDPOINTS.md`

## 🏗️ Architecture

### Multi-Tenant Design
- **Shared Database** - All tenants share tables
- **Data Isolation** - `tenant_id` filtering on all queries
- **Automatic Scoping** - Middleware ensures data security

### Database Schema
- **10 Core Tables** - Tenants, Users, Products, Sales, etc.
- **Proper Relationships** - Foreign keys with cascade deletion
- **Audit Trail** - Stock movements track all changes

### Security Features
- **Token Authentication** - Sanctum API tokens
- **Password Hashing** - Bcrypt with 12 rounds
- **CORS Protection** - Configured for frontend
- **Input Validation** - Comprehensive validation rules

## 🎨 UI/UX Features

### Modern Design
- **Clean Interface** - Professional business look
- **Responsive Layout** - Works on all screen sizes
- **Intuitive Navigation** - Easy-to-use sidebar menu
- **Visual Feedback** - Loading states, error messages

### User Experience
- **Persistent Login** - localStorage session management
- **Real-time Updates** - Live data refresh
- **Form Validation** - Client and server-side validation
- **Error Handling** - Graceful error messages

## 📊 Business Logic

### Inventory Management
- **Stock Tracking** - Real-time inventory levels
- **Reorder Alerts** - Automatic low stock notifications
- **Category Organization** - Logical product grouping
- **Supplier Management** - Vendor relationship tracking

### Sales Processing
- **Transaction Handling** - Complete sale workflow
- **Stock Deduction** - Automatic inventory updates
- **Payment Methods** - Multiple payment options
- **Receipt Generation** - Transaction records

### Purchase Management
- **Supplier Orders** - Purchase order tracking
- **Stock Increases** - Automatic inventory updates
- **Cost Tracking** - Purchase price recording
- **Vendor Management** - Supplier relationship management

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS allows frontend URL
   - Check `backend/config/cors.php`

2. **Database Connection**
   - Verify MySQL is running
   - Check `.env` database credentials

3. **API Token Issues**
   - Clear localStorage and re-login
   - Check token expiration

4. **Build Errors**
   - Use `npm install --legacy-peer-deps`
   - Clear npm cache if needed

## 📈 Future Enhancements

- **Advanced Reporting** - Charts and graphs
- **Barcode Scanning** - Product identification
- **Multi-location** - Multiple store support
- **Mobile App** - React Native version
- **Email Notifications** - Automated alerts
- **Backup System** - Data backup and restore

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@inventory-system.com or create an issue in the repository.

---

**Built with ❤️ for small businesses worldwide**