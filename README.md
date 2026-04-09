# Inventory and Sales Management System

A comprehensive multi-tenant web application for managing inventory, sales, suppliers, and business operations for small and medium enterprises.

## 🚀 Project Overview

This system provides a complete solution for businesses to:
- Manage inventory with real-time stock tracking
- Process sales transactions with automatic stock updates
- Handle supplier relationships and purchase orders
- Generate comprehensive reports and analytics
- Support multiple businesses (multi-tenant architecture)

## 🏗️ Architecture

- **Frontend:** React.js (In Development)
- **Backend:** Laravel 12 (Complete)
- **Database:** MySQL with multi-tenant architecture
- **API:** RESTful API with 35+ endpoints

## 📁 Project Structure

```
Inventory-and-sales-management/
├── backend/                    # Laravel API Backend
│   ├── app/
│   │   ├── Http/Controllers/   # 8 Complete Controllers
│   │   └── Models/            # 10 Eloquent Models
│   ├── database/
│   │   └── migrations/        # Database Schema
│   ├── routes/
│   │   └── api.php           # API Endpoints
│   ├── API_ENDPOINTS.md      # Complete API Documentation
│   └── CONTROLLERS.md        # Controllers Documentation
├── frontend/                  # React.js Frontend (Basic Setup)
└── docs/                     # Project Documentation
```

## 🗄️ Database Schema

### Multi-Tenant Architecture
- **tenants** - Business organizations
- **users** - Employee accounts with roles
- **categories** - Product categories
- **suppliers** - Vendor information
- **products** - Inventory items
- **sales** - Sales transactions
- **sale_items** - Individual sale line items
- **purchases** - Purchase orders
- **purchase_items** - Purchase line items
- **stock_movements** - Complete audit trail

## 🔧 Backend Features (Complete)

### ✅ Implemented Controllers
1. **TenantController** - Business management
2. **UserController** - Employee management with roles
3. **CategoryController** - Product categorization
4. **SupplierController** - Vendor management
5. **ProductController** - Inventory management
6. **SaleController** - Sales transaction processing
7. **PurchaseController** - Purchase order management
8. **StockMovementController** - Inventory tracking

### ✅ Key Features
- **Multi-tenant data isolation** - Each business has separate data
- **Role-based access control** - Admin, Manager, Cashier roles
- **Automatic stock management** - Real-time inventory updates
- **Complex transaction processing** - Sales and purchases with validation
- **Comprehensive API** - 35+ RESTful endpoints
- **Database transactions** - Data consistency guaranteed
- **Input validation** - Security and data integrity
- **Relationship management** - Proper foreign key constraints

## 🌐 API Endpoints

### Base URL: `http://localhost:8000/api`

#### Business Management
- `GET /tenants` - List all businesses
- `POST /tenants` - Register new business
- `GET /tenants/{id}` - Get business details
- `PUT /tenants/{id}` - Update business info
- `DELETE /tenants/{id}` - Delete business

#### User Management
- `GET /users?tenant_id=1` - List users for business
- `POST /users` - Create new employee
- `GET /users/by-role?tenant_id=1&role=cashier` - Filter by role
- `PUT /users/{id}` - Update user info
- `DELETE /users/{id}` - Remove employee

#### Inventory Management
- `GET /products?tenant_id=1` - List products
- `POST /products` - Add new product
- `GET /products/low-stock?tenant_id=1` - Low stock alerts
- `PUT /products/{id}` - Update product/stock
- `DELETE /products/{id}` - Remove product

#### Sales Processing
- `POST /sales` - Process sale transaction
- `GET /sales?tenant_id=1` - List sales
- `GET /sales/daily-report?tenant_id=1&date=2026-03-18` - Daily reports
- `GET /sales/{id}` - Sale details

#### Purchase Management
- `POST /purchases` - Record purchase
- `GET /purchases?tenant_id=1` - List purchases
- `GET /purchases/monthly-report?tenant_id=1&month=2026-03` - Monthly reports
- `GET /purchases/{id}` - Purchase details

#### Stock Tracking
- `GET /stock-movements?tenant_id=1` - All movements
- `GET /stock-movements/product/{id}?tenant_id=1` - Product history
- `GET /stock-movements/by-type?tenant_id=1&type=IN` - Filter by type
- `GET /stock-movements/date-range?tenant_id=1&start_date=2026-03-01&end_date=2026-03-31` - Date range

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Composer
- MySQL (XAMPP recommended)
- Node.js & npm

### Backend Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nakibinge-web/Inventory-and-sales-management.git
   cd Inventory-and-sales-management/backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database configuration:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=inventory_and_sales_management
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Run migrations:**
   ```bash
   php artisan migrate
   ```

6. **Start development server:**
   ```bash
   php artisan serve
   ```

7. **Test API:**
   ```bash
   curl http://127.0.0.1:8000/api/health
   ```

### Frontend Setup
1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The app runs at `http://localhost:3000`

4. **What's available:**
   - Login form — hits `POST /api/login`, returns a Sanctum token on success
   - Register form — hits `POST /api/register`, creates a tenant + user and returns a token
   - Toggle between login and register with the link at the bottom of the form
   - Raw JSON response is displayed on screen for easy testing

> Make sure the backend is running on `http://localhost:8000` before using the frontend.

## 📖 Documentation

- **[API Endpoints](backend/API_ENDPOINTS.md)** - Complete API documentation with examples
- **[Controllers](backend/CONTROLLERS.md)** - Detailed controller explanations
- **[Database Schema](backend/DATABASE.md)** - Database structure and relationships

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:8000/api/health

# Create a business
curl -X POST http://localhost:8000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Store","email":"test@store.com"}'

# List products
curl "http://localhost:8000/api/products?tenant_id=1"
```

### Using Postman
1. Import endpoints from `backend/API_ENDPOINTS.md`
2. Set base URL: `http://localhost:8000/api`
3. Test with sample data provided in documentation

## 🔒 Security Features

- **Password hashing** with bcrypt
- **Input validation** on all endpoints
- **SQL injection protection** via Eloquent ORM
- **Multi-tenant data isolation** - Automatic tenant filtering
- **Role-based access control** - Admin, Manager, Cashier permissions
- **Database transactions** - Atomic operations for data consistency

## 📊 Business Logic

### Sales Transaction Flow
1. Validate product availability
2. Check stock levels
3. Create sale record
4. Create sale items
5. Update product stock (decrement)
6. Record stock movements
7. Calculate totals
8. Return transaction details

### Purchase Transaction Flow
1. Validate supplier and products
2. Create purchase record
3. Create purchase items
4. Update product stock (increment)
5. Record stock movements
6. Calculate totals
7. Return purchase details

## 🎯 Current Status

### ✅ Completed (Backend)
- Database design and migrations
- All Eloquent models with relationships
- 8 comprehensive controllers
- Complete API with 35+ endpoints
- Multi-tenant architecture
- Automatic stock management
- Transaction processing
- Comprehensive documentation
- Git repository with proper commits

### 🚧 In Progress (Frontend)
- React.js application setup ✅
- Login & Register UI with API integration ✅
- Component development
- API integration
- User interface design

### 📋 Upcoming Features
- Authentication middleware
- API rate limiting
- Advanced reporting
- Email notifications
- File uploads
- Backup system

## 👥 Team

- **Backend Developer:** [Your Name]
- **Frontend Team:** [Team Members]
- **Database:** MySQL with multi-tenant design

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in `/docs`
- Review API documentation in `backend/API_ENDPOINTS.md`

---

**Status:** Backend Complete ✅ | Frontend In Development 🚧 | Ready for Production 🚀