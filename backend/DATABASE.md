# Database Documentation

## Database Name
`inventory_and_sales_management`

## Database Type
MySQL

## Multi-Tenant Architecture
This system uses a shared-database multi-tenant architecture. Each business (tenant) has its own records but shares the same database tables. Every business-related table includes a `tenant_id` field to isolate data between tenants.

---

## Tables

### 1. TENANTS
Stores information about each business/organization using the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique tenant identifier |
| name | VARCHAR(255) | NOT NULL | Business/organization name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Business contact email |
| phone | VARCHAR(20) | NULLABLE | Business phone number |
| address | TEXT | NULLABLE | Business physical address |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Purpose:** Central table for multi-tenancy. All other tables reference this table to ensure data isolation.

---

### 2. USERS
Stores user accounts for each tenant with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| tenant_id | BIGINT UNSIGNED | FOREIGN KEY, NOT NULL | References tenants(id) |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL | User's email address |
| role | ENUM | NOT NULL, DEFAULT 'cashier' | User role: admin, manager, cashier |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| remember_token | VARCHAR(100) | NULLABLE | Token for "remember me" functionality |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

**Roles:**
- **admin**: Full system access, can manage users, settings, and all operations
- **manager**: Can manage inventory, view reports, process sales and purchases
- **cashier**: Can process sales transactions and view basic inventory

**Purpose:** Manages user authentication and authorization within each tenant.

---

### 3. CATEGORIES
Stores product categories for organizing inventory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| tenant_id | BIGINT UNSIGNED | FOREIGN KEY, NOT NULL | References tenants(id) |
| name | VARCHAR(255) | NOT NULL | Category name |
| description | TEXT | NULLABLE | Category description |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

**Purpose:** Allows tenants to organize products into logical categories (e.g., Electronics, Clothing, Food).

---

### 4. SUPPLIERS
Stores supplier/vendor information for each tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique supplier identifier |
| tenant_id | BIGINT UNSIGNED | FOREIGN KEY, NOT NULL | References tenants(id) |
| name | VARCHAR(255) | NOT NULL | Supplier/vendor name |
| contact | VARCHAR(20) | NULLABLE | Supplier contact number |
| email | VARCHAR(255) | NULLABLE | Supplier email address |
| address | TEXT | NULLABLE | Supplier physical address |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

**Purpose:** Manages supplier information for tracking where products are purchased from.

---

## Relationships

```
TENANTS (1) ──────< (Many) USERS
TENANTS (1) ──────< (Many) CATEGORIES
TENANTS (1) ──────< (Many) SUPPLIERS
```

---

## Data Isolation Strategy

Each tenant's data is isolated using the `tenant_id` column:

1. All queries must filter by `tenant_id`
2. Foreign key constraints ensure referential integrity
3. CASCADE deletion ensures when a tenant is deleted, all related data is removed
4. Application middleware will automatically scope queries to the authenticated user's tenant

---

## Security Considerations

1. **Password Storage**: User passwords are hashed using bcrypt
2. **Tenant Isolation**: All queries must include tenant_id filtering
3. **Foreign Key Constraints**: Prevent orphaned records and maintain data integrity
4. **Cascade Deletion**: Automatically clean up related data when tenant is removed

---

## Future Tables (Not Yet Implemented)

The following tables will be added in future phases:
- products
- sales
- sale_items
- purchases
- purchase_items
- stock_movements

---

## Migration Files

Located in: `database/migrations/`

1. `2024_01_01_000001_create_tenants_table.php`
2. `2024_01_01_000002_create_users_table.php`
3. `2024_01_01_000003_create_categories_table.php`
4. `2024_01_01_000004_create_suppliers_table.php`

Run migrations with: `php artisan migrate`

---

## SQL Schema Creation

If creating tables manually in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS inventory_and_sales_management;
USE inventory_and_sales_management;

-- See individual table definitions in the Tables section above
```

---

**Last Updated:** March 10, 2026
**Database Version:** 1.0
**Status:** Initial Setup - 4 Core Tables Implemented
