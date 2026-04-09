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
   # create your .env file from .env example and change the database settings 
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
2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start.....usually runs at http://localhost:3001/ OR  http://localhost:3000/
   ```   

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
- React.js application setup
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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@inventory-system.com or create an issue in the repository.

---

**Built with ❤️ for small businesses worldwide**