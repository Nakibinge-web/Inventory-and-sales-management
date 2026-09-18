-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 31, 2026 at 10:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventory_and_sales_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `tenant_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Phones', NULL, '2026-07-16 12:22:19', '2026-07-16 12:22:19'),
(2, 2, 'Beddings', NULL, '2026-07-28 17:15:18', '2026-07-28 17:15:18'),
(3, 2, 'Curtains', 'All curtain requirements', '2026-07-28 17:22:25', '2026-07-28 17:22:25'),
(4, 3, 'Clothes', NULL, '2026-07-29 07:21:46', '2026-07-29 07:21:46'),
(5, 3, '4x6 matresses', NULL, '2026-07-31 09:22:55', '2026-07-31 09:22:55'),
(6, 3, '5x6 matresses', NULL, '2026-07-31 09:23:06', '2026-07-31 09:23:06'),
(7, 4, 'Watches', NULL, '2026-08-01 05:26:46', '2026-08-01 05:26:46'),
(8, 4, 'Electronics', NULL, '2026-08-04 13:02:30', '2026-08-04 13:02:30'),
(9, 5, 'Duvets', NULL, '2026-08-07 19:13:51', '2026-08-07 19:13:51'),
(11, 5, 'Bed Sheets', NULL, '2026-08-09 10:17:36', '2026-08-09 10:17:36'),
(12, 5, 'Blankets', NULL, '2026-08-09 10:45:40', '2026-08-09 10:45:40'),
(13, 6, 'Jeans', NULL, '2026-08-11 06:12:03', '2026-08-11 06:12:03'),
(14, 6, 'Shirts', NULL, '2026-08-11 06:12:36', '2026-08-11 06:12:36');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `tenant_id`, `name`, `phone`, `email`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 'Nakibinge Collins', '0704567890', NULL, 'active', '2026-08-04 13:05:13', '2026-08-04 13:05:13'),
(2, 5, 'Jane', '0708902390', NULL, 'active', '2026-08-09 10:57:48', '2026-08-09 10:57:48'),
(3, 6, 'jane', '0700998877', NULL, 'active', '2026-08-11 06:20:32', '2026-08-11 06:20:32');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `source_ref` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_address` varchar(255) DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_status` varchar(255) NOT NULL DEFAULT 'paid',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`items`)),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `tenant_id`, `user_id`, `invoice_number`, `invoice_date`, `due_date`, `source_ref`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `amount_paid`, `payment_status`, `items`, `notes`, `created_at`, `updated_at`) VALUES
(2, 5, 14, 'INV/26-27/0002', '2026-08-08', '2026-08-14', 'S00599', 'Serner', '0789009292', NULL, NULL, 30000.00, 0.00, 0.00, 30000.00, 30000.00, 'paid', '[{\"description\":\"Pillows\",\"quantity\":2,\"price\":15000,\"subtotal\":30000}]', NULL, '2026-08-08 12:24:05', '2026-08-08 12:24:05'),
(3, 5, 14, 'INV/26-27/0003', '2026-08-08', '2026-08-08', 'S00125', 'Denis', '0782334455', NULL, NULL, 80000.00, 0.00, 0.00, 80000.00, 80000.00, 'paid', '[{\"description\":\"Matress\",\"quantity\":1,\"price\":80000,\"subtotal\":80000}]', NULL, '2026-08-08 13:01:13', '2026-08-08 13:01:13'),
(4, 5, 14, 'INV/26-27/0004', '2026-08-08', '2026-08-22', 'S00889', 'Asherman', '0703456788', NULL, NULL, 160000.00, 0.00, 0.00, 160000.00, 120000.00, 'partial', '[{\"description\":\"Pillows\",\"quantity\":4,\"price\":15000,\"subtotal\":60000},{\"description\":\"Duvet\",\"quantity\":1,\"price\":50000,\"subtotal\":50000},{\"description\":\"4x6 bedsheets\",\"quantity\":2,\"price\":25000,\"subtotal\":50000}]', NULL, '2026-08-08 13:03:56', '2026-08-08 13:07:18'),
(5, 5, 14, 'INV/26-27/0005', '2026-08-08', '2026-08-29', 'S00415', 'Peter', '0704353514', NULL, NULL, 20000.00, 0.00, 0.00, 20000.00, 10000.00, 'partial', '[{\"description\":\"Duvet\",\"quantity\":1,\"price\":20000,\"subtotal\":20000}]', 'Mr.Peter should pay the amount due by the due date otherwise a fine of 15% will be incurred and he has accepted without anyone forcing him\nPayment details: 0708223488', '2026-08-08 13:16:20', '2026-08-08 13:16:20'),
(6, 5, 14, 'INV/26-27/0006', '2026-08-09', '2026-08-18', 'S00562', 'Jane', '0708902390', NULL, NULL, 110000.00, 0.00, 0.00, 110000.00, 80000.00, 'partial', '[{\"description\":\"pillows\",\"quantity\":4,\"price\":15000,\"subtotal\":60000},{\"description\":\"Duvet\",\"quantity\":1,\"price\":50000,\"subtotal\":50000}]', 'The client will use my bank account \nAccount number:123456789', '2026-08-09 17:17:04', '2026-08-09 17:17:04'),
(7, 5, 14, 'INV/26-27/0007', '2026-08-09', '2026-08-09', 'S00644', 'Jane', '0708902390', NULL, NULL, 333.00, 0.00, 0.00, 333.00, 0.00, 'due', '[{\"description\":\"xxxxxx\",\"quantity\":1,\"price\":333,\"subtotal\":333}]', 'dess', '2026-08-09 17:18:03', '2026-08-09 17:18:03'),
(8, 5, 14, 'INV/26-27/0008', '2026-08-22', '2026-08-22', 'S00351', 'Jane', '0708902390', NULL, NULL, 50000.00, 0.00, 0.00, 50000.00, 40000.00, 'partial', '[{\"description\":\"4X6 Bedsheets\",\"quantity\":2,\"price\":25000,\"subtotal\":50000}]', NULL, '2026-08-22 12:59:31', '2026-08-22 13:01:56'),
(9, 5, 14, 'INV/26-27/0009', '2020-09-17', '2024-11-12', 'Dolore a dolor reici', 'Jane', '0708902390', NULL, NULL, 89.00, 0.00, 0.00, 89.00, 89.00, 'paid', '[{\"description\":\"Ratione debitis cons\",\"quantity\":89,\"price\":1,\"subtotal\":89}]', 'Non explicabo Nesci', '2026-08-22 13:54:36', '2026-08-22 13:54:36');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2024_01_01_000001_create_tenants_table', 1),
(2, '2024_01_01_000002_create_users_table', 1),
(3, '2024_01_01_000003_create_categories_table', 1),
(4, '2024_01_01_000004_create_suppliers_table', 1),
(5, '2026_03_11_000005_create_purchases_table', 1),
(6, '2026_03_11_082317_create_cache_table', 1),
(7, '2026_03_11_082348_create_jobs_table', 1),
(8, '2026_03_15_005124_create_products_table', 1),
(9, '2026_03_15_005745_create_sales_table', 1),
(10, '2026_03_15_010337_create_sale_items_table', 1),
(11, '2026_03_15_010710_create_purchase_items_table', 1),
(12, '2026_03_15_011148_create_stock_movements_table', 1),
(13, '2026_03_24_135048_create_sessions_table', 1),
(14, '2026_03_24_165753_create_personal_access_tokens_table', 1),
(15, '2026_04_08_000001_add_owner_role_to_users_table', 1),
(16, '2026_04_16_000001_create_roles_table', 1),
(17, '2026_04_16_000002_create_role_user_table', 1),
(18, '2026_04_16_000003_drop_role_column_from_users_table', 1),
(19, '2026_04_16_000004_create_permissions_table', 1),
(20, '2026_04_16_000005_create_permission_role_table', 1),
(21, '2026_04_28_000001_add_fields_to_products_table', 1),
(22, '2026_05_05_000001_add_expiry_fields_to_products_table', 1),
(23, '2026_05_14_000001_create_customers_table', 1),
(24, '2026_05_17_000001_add_customer_id_to_sales_table', 1),
(25, '2026_05_17_000002_add_discount_to_sales_table', 1),
(26, '2026_06_01_000001_add_tax_amount_to_sales_table', 1),
(27, '2026_06_01_000002_add_notes_to_sales_table', 1),
(28, '2026_06_01_000003_add_reason_to_stock_movements_table', 1),
(29, '2026_07_12_000001_add_customer_permissions', 1),
(30, '2026_07_12_000002_add_purchase_edit_delete_permissions', 1),
(31, '2026_07_18_173537_add_created_by_to_users_table', 2),
(32, '2026_07_18_180950_update_sales_user_id_to_set_null_on_delete', 3),
(33, '2026_08_04_000001_add_adjustment_to_stock_movements_type_enum', 4),
(34, '2026_08_04_000002_make_supplier_id_nullable_on_purchases_table', 5),
(35, '2026_08_08_000001_create_invoices_table', 6),
(36, '2026_08_08_000001_add_reference_type_to_stock_movements_table', 7),
(37, '2026_08_14_100000_increase_decimal_precision_for_amounts', 7),
(38, '2026_08_22_164753_add_contacts_to_tenants_table', 7),
(39, '2026_08_22_213030_change_sale_date_to_datetime_in_sales_table', 8);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `group` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `tenant_id`, `name`, `display_name`, `group`, `is_default`, `created_at`, `updated_at`) VALUES
(1, NULL, 'products.view', 'View Products', 'products', 1, '2026-07-16 09:56:44', '2026-07-16 09:56:44'),
(2, NULL, 'products.create', 'Create Products', 'products', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(3, NULL, 'products.edit', 'Edit Products', 'products', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(4, NULL, 'products.delete', 'Delete Products', 'products', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(5, NULL, 'categories.view', 'View Categories', 'categories', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(6, NULL, 'categories.create', 'Create Categories', 'categories', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(7, NULL, 'categories.edit', 'Edit Categories', 'categories', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(8, NULL, 'categories.delete', 'Delete Categories', 'categories', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(9, NULL, 'customers.view', 'View Customers', 'customers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(10, NULL, 'customers.create', 'Create Customers', 'customers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(11, NULL, 'customers.edit', 'Edit Customers', 'customers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(12, NULL, 'customers.delete', 'Delete Customers', 'customers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(13, NULL, 'suppliers.view', 'View Suppliers', 'suppliers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(14, NULL, 'suppliers.create', 'Create Suppliers', 'suppliers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(15, NULL, 'suppliers.edit', 'Edit Suppliers', 'suppliers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(16, NULL, 'suppliers.delete', 'Delete Suppliers', 'suppliers', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(17, NULL, 'sales.view', 'View Sales', 'sales', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(18, NULL, 'sales.create', 'Create Sales', 'sales', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(19, NULL, 'sales.edit', 'Edit Sales', 'sales', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(20, NULL, 'sales.delete', 'Delete Sales', 'sales', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(21, NULL, 'sales.report', 'Sales Reports', 'sales', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(22, NULL, 'purchases.view', 'View Purchases', 'purchases', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(23, NULL, 'purchases.create', 'Create Purchases', 'purchases', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(24, NULL, 'purchases.edit', 'Edit Purchases', 'purchases', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(25, NULL, 'purchases.delete', 'Delete Purchases', 'purchases', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(26, NULL, 'purchases.report', 'Purchase Reports', 'purchases', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(27, NULL, 'stock.view', 'View Stock Movements', 'stock', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(28, NULL, 'users.view', 'View Users', 'users', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(29, NULL, 'users.create', 'Create Users', 'users', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(30, NULL, 'users.edit', 'Edit Users', 'users', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(31, NULL, 'users.delete', 'Delete Users', 'users', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(32, NULL, 'roles.view', 'View Roles', 'roles', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(33, NULL, 'roles.create', 'Create Roles', 'roles', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(34, NULL, 'roles.edit', 'Edit Roles', 'roles', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45'),
(35, NULL, 'roles.delete', 'Delete Roles', 'roles', 1, '2026-07-16 09:56:45', '2026-07-16 09:56:45');

-- --------------------------------------------------------

--
-- Table structure for table `permission_role`
--

CREATE TABLE `permission_role` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permission_role`
--

INSERT INTO `permission_role` (`id`, `permission_id`, `role_id`, `created_at`, `updated_at`) VALUES
(29, 18, 8, '2026-07-31 10:01:31', '2026-07-31 10:01:31'),
(30, 18, 9, '2026-08-04 09:03:51', '2026-08-04 09:03:51'),
(31, 17, 9, '2026-08-04 09:04:27', '2026-08-04 09:04:27'),
(32, 18, 10, '2026-08-09 10:24:49', '2026-08-09 10:24:49'),
(33, 6, 10, '2026-08-09 10:30:32', '2026-08-09 10:30:32'),
(34, 8, 10, '2026-08-09 10:30:32', '2026-08-09 10:30:32'),
(35, 7, 10, '2026-08-09 10:30:32', '2026-08-09 10:30:32'),
(36, 5, 10, '2026-08-09 10:30:32', '2026-08-09 10:30:32'),
(37, 17, 10, '2026-08-09 10:30:32', '2026-08-09 10:30:32'),
(38, 10, 11, '2026-08-11 06:29:01', '2026-08-11 06:29:01'),
(39, 18, 11, '2026-08-11 06:29:01', '2026-08-11 06:29:01');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'api-token', '127f4d1bc8f93fc27e9373248020deaf641b986c662b443f64a7bbd6e09fab31', '[\"*\"]', '2026-07-16 12:24:12', NULL, '2026-07-16 12:20:32', '2026-07-16 12:24:12'),
(2, 'App\\Models\\User', 2, 'api-token', '24cf25a41f8b6ac9020d33fd6c7e85c8a63d18a952f687c98e7b9f8fd9581b8f', '[\"*\"]', '2026-07-16 12:28:38', NULL, '2026-07-16 12:27:39', '2026-07-16 12:28:38'),
(3, 'App\\Models\\User', 1, 'api-token', '43273dbe8aa1ba2dcfabafcb3db321099c32c30e9362db68bddcf49f23f12666', '[\"*\"]', '2026-07-16 13:02:12', NULL, '2026-07-16 12:29:34', '2026-07-16 13:02:12'),
(4, 'App\\Models\\User', 2, 'api-token', 'bd0192ef26e2075d9f9ee25aa37b5fba63968e5000246d24992c931118b23130', '[\"*\"]', '2026-07-16 13:05:04', NULL, '2026-07-16 13:02:44', '2026-07-16 13:05:04'),
(5, 'App\\Models\\User', 1, 'api-token', '34f4b1e6b9a3afe902c5637938fb3df57e9a129da604a8578d706c805593f1aa', '[\"*\"]', '2026-07-16 13:07:01', NULL, '2026-07-16 13:05:23', '2026-07-16 13:07:01'),
(6, 'App\\Models\\User', 2, 'api-token', '97dec6a3d1837dc3bff010d17fabdf28e6cf4f28fb871caa1b83d1785e276e80', '[\"*\"]', '2026-07-16 13:07:31', NULL, '2026-07-16 13:07:18', '2026-07-16 13:07:31'),
(7, 'App\\Models\\User', 1, 'api-token', '4b9dffdee5b197d22c4c6d3b0c2f223119f1b5d2ce3ae9c641a422d1a5015660', '[\"*\"]', '2026-07-16 13:11:45', NULL, '2026-07-16 13:08:47', '2026-07-16 13:11:45'),
(8, 'App\\Models\\User', 2, 'api-token', 'c0e27aca86cacbf4093b53c799319cd8db71ed64543d078421d80e2a576d3e5a', '[\"*\"]', '2026-07-16 13:12:42', NULL, '2026-07-16 13:12:28', '2026-07-16 13:12:42'),
(9, 'App\\Models\\User', 1, 'api-token', 'a7f028ac27a252214b554bdb344f3b5ca0c23c4bdafea7f51bd5a02ad5be81ed', '[\"*\"]', '2026-07-18 09:33:34', NULL, '2026-07-16 13:38:34', '2026-07-18 09:33:34'),
(10, 'App\\Models\\User', 3, 'api-token', '2a989bd718701d8d284717b780893707189be5100e03b06d86c55d31e1824709', '[\"*\"]', '2026-07-18 09:34:28', NULL, '2026-07-18 09:34:08', '2026-07-18 09:34:28'),
(11, 'App\\Models\\User', 1, 'api-token', '5d673550d7d6f7924f6f7a51cadc066428cc2c56d9ab35d7e7c8ac8374c02f16', '[\"*\"]', '2026-07-18 09:37:55', NULL, '2026-07-18 09:34:42', '2026-07-18 09:37:55'),
(12, 'App\\Models\\User', 3, 'api-token', '662ba5bdafd5d69b2bc83d62cc3de3d6e9ae0cf647c706476e183758b4cc2638', '[\"*\"]', '2026-07-18 09:39:04', NULL, '2026-07-18 09:38:11', '2026-07-18 09:39:04'),
(13, 'App\\Models\\User', 1, 'api-token', 'b46e06b515f714669eb3874bec2a633d4438f8475087b97993fe0f3f6a989543', '[\"*\"]', '2026-07-18 09:41:15', NULL, '2026-07-18 09:40:28', '2026-07-18 09:41:15'),
(14, 'App\\Models\\User', 3, 'api-token', '84f42c471de6179e2e3cb3297e4e2a06bb1e786cfb38d86f86429ef72ae361b0', '[\"*\"]', '2026-07-18 09:42:15', NULL, '2026-07-18 09:41:34', '2026-07-18 09:42:15'),
(15, 'App\\Models\\User', 1, 'api-token', '2ed117fdfadcdf61249fa3393180234226140ec290daad92a25e76a3a09d9911', '[\"*\"]', '2026-07-18 09:44:25', NULL, '2026-07-18 09:42:32', '2026-07-18 09:44:25'),
(16, 'App\\Models\\User', 3, 'api-token', '95e9a533c23bc4f21d321bac005ff908f9177a620e6d45f7acc8dc2c5eb837df', '[\"*\"]', '2026-07-18 09:45:29', NULL, '2026-07-18 09:45:13', '2026-07-18 09:45:29'),
(17, 'App\\Models\\User', 1, 'api-token', 'd43a2896f57f35ec332e55d381b083f7a581e6dc9a9cc10a01279d6e0a3a8b21', '[\"*\"]', '2026-07-18 09:46:15', NULL, '2026-07-18 09:45:49', '2026-07-18 09:46:15'),
(18, 'App\\Models\\User', 3, 'api-token', 'fa07199e90b05b3fdf25c68e6ce1d945ac81ab77ab23c9b96018eac4918f8c63', '[\"*\"]', '2026-07-18 14:40:11', NULL, '2026-07-18 09:46:43', '2026-07-18 14:40:11'),
(19, 'App\\Models\\User', 4, 'api-token', '028ad8f06d940ca6d2befa9281e9a79d03f472e45f4cc68ae5bcfff7246d73a2', '[\"*\"]', '2026-07-18 14:41:27', NULL, '2026-07-18 14:41:08', '2026-07-18 14:41:27'),
(20, 'App\\Models\\User', 3, 'api-token', 'a060537563441956aae8c0ed95cf1b6e76895d60728030e141eb1fd1a1e55dd6', '[\"*\"]', '2026-07-18 14:44:35', NULL, '2026-07-18 14:41:39', '2026-07-18 14:44:35'),
(21, 'App\\Models\\User', 1, 'api-token', 'e58b006987bd784f8d8d5bc297396947707b8c11fbee3bb39f7eca3721b0e271', '[\"*\"]', '2026-07-18 14:45:34', NULL, '2026-07-18 14:45:20', '2026-07-18 14:45:34'),
(22, 'App\\Models\\User', 3, 'api-token', '28f76edd50a3de4ced72349fa9502b913c1f60c5eab7da879299630d33091ba3', '[\"*\"]', '2026-07-18 14:51:07', NULL, '2026-07-18 14:50:08', '2026-07-18 14:51:07'),
(23, 'App\\Models\\User', 1, 'api-token', '09d0597e6596739389ab72dabf4c4ef8cedf47ca467202d6f1f8c04cc538b10c', '[\"*\"]', '2026-07-18 14:54:31', NULL, '2026-07-18 14:53:54', '2026-07-18 14:54:31'),
(24, 'App\\Models\\User', 3, 'api-token', 'e11ffd9913c77ea6286b56a4d506e13234800072cfc4978ab593fb40641b953c', '[\"*\"]', '2026-07-18 14:59:25', NULL, '2026-07-18 14:54:50', '2026-07-18 14:59:25'),
(25, 'App\\Models\\User', 1, 'api-token', 'f62d5e8355a262a502c9a8a740f1e1b1518be3420557c9fbc0845b0df44db653', '[\"*\"]', '2026-07-18 15:02:07', NULL, '2026-07-18 14:59:56', '2026-07-18 15:02:07'),
(26, 'App\\Models\\User', 3, 'api-token', '1f46cd6554ffa203f16f38e6f60aabcfadcdbf4e9312c0ba51b4678b302d9a79', '[\"*\"]', '2026-07-18 15:03:13', NULL, '2026-07-18 15:02:28', '2026-07-18 15:03:13'),
(27, 'App\\Models\\User', 1, 'api-token', 'c0fc149e4201cbd51dc4eabfc965c97c82659565a29e618b0efd7f308ec970f5', '[\"*\"]', '2026-07-19 13:59:19', NULL, '2026-07-18 15:03:32', '2026-07-19 13:59:19'),
(28, 'App\\Models\\User', 6, 'api-token', 'f2b2df690afa0b14d7e4701ec1842e0bc1233024e3c3f4ea3553a43588e4b5c6', '[\"*\"]', '2026-07-19 14:00:49', NULL, '2026-07-19 13:59:38', '2026-07-19 14:00:49'),
(29, 'App\\Models\\User', 7, 'api-token', 'fdaad1270083469efc61b9c2af0148ce8479d51cea186bed6b3dfe8a29453996', '[\"*\"]', '2026-07-19 14:01:56', NULL, '2026-07-19 14:01:14', '2026-07-19 14:01:56'),
(30, 'App\\Models\\User', 1, 'api-token', '682329b47881d391680dbc895ce8080c8bba1adce32dfbe6def6cc201636d5cb', '[\"*\"]', '2026-08-13 04:55:10', NULL, '2026-07-19 14:02:17', '2026-08-13 04:55:10'),
(31, 'App\\Models\\User', 1, 'api-token', 'f0f51c453d64d7eca8e0c0c46becc9f278e80ec87c32ca5240abf97dc5b725d1', '[\"*\"]', '2026-07-28 17:02:24', NULL, '2026-07-20 15:41:44', '2026-07-28 17:02:24'),
(32, 'App\\Models\\User', 1, 'api-token', '9d3bd3c354065e795da40dc9cf77dc8afccd5814f3712a28da1e7a29ba05edb9', '[\"*\"]', '2026-07-28 17:03:36', NULL, '2026-07-28 17:03:22', '2026-07-28 17:03:36'),
(33, 'App\\Models\\User', 8, 'api-token', 'c9f633f9c3241a266b3dd0cf7c2205af2ae708059dd08745c490ce1873f8b26a', '[\"*\"]', '2026-07-28 17:08:55', NULL, '2026-07-28 17:05:51', '2026-07-28 17:08:55'),
(34, 'App\\Models\\User', 8, 'api-token', '8a44b3eb08342ec4b0501ba728543ae7dc0add9b9316f4934f29652026a85a59', '[\"*\"]', '2026-07-29 04:00:29', NULL, '2026-07-28 17:10:38', '2026-07-29 04:00:29'),
(35, 'App\\Models\\User', 9, 'api-token', 'afd089e806b0c166fc4e7d23dbbee568dfce47f03256317f9c8366726b243167', '[\"*\"]', '2026-07-29 07:21:46', NULL, '2026-07-29 07:10:44', '2026-07-29 07:21:46'),
(36, 'App\\Models\\User', 1, 'api-token', '1e58cd5b0cdd83150c6859dab1a61273546cb85715c37b9a2f742ed7174fe6d9', '[\"*\"]', NULL, NULL, '2026-07-29 08:19:19', '2026-07-29 08:19:19'),
(37, 'App\\Models\\User', 1, 'api-token', 'd1c42d5a1798d5ee5c8d1a425d95e7557a839cf0d1ac8b697069034eae7db21e', '[\"*\"]', '2026-07-31 09:18:02', NULL, '2026-07-29 08:58:13', '2026-07-31 09:18:02'),
(38, 'App\\Models\\User', 9, 'api-token', '0a809f82c06f10aa10bc5203fee6a1b3f74c40592ba8a9f135ed446c0dfeb4f4', '[\"*\"]', '2026-07-31 10:01:30', NULL, '2026-07-31 09:19:42', '2026-07-31 10:01:30'),
(39, 'App\\Models\\User', 11, 'api-token', 'a872651a64d6d6ab54a314d569e0aad184358f05a93681ce9edb9d325dd78c49', '[\"*\"]', '2026-07-31 10:03:19', NULL, '2026-07-31 10:02:12', '2026-07-31 10:03:19'),
(40, 'App\\Models\\User', 9, 'api-token', '7fe81ea113df29818940e64383a61f7eff431f782a073dcf179bd53fbbb5352c', '[\"*\"]', '2026-08-01 05:09:13', NULL, '2026-07-31 10:04:42', '2026-08-01 05:09:13'),
(41, 'App\\Models\\User', 12, 'api-token', 'aec5cdf23276b04aea18ab5bfd0b785fde8828f727b844db407772c296b30309', '[\"*\"]', '2026-08-04 08:41:07', NULL, '2026-08-01 05:11:02', '2026-08-04 08:41:07'),
(42, 'App\\Models\\User', 12, 'api-token', '077602219f206a73c867d24b3677727fd293d8fde3ad766d06949e5552f0598f', '[\"*\"]', '2026-08-04 08:49:09', NULL, '2026-08-04 08:48:55', '2026-08-04 08:49:09'),
(43, 'App\\Models\\User', 12, 'api-token', '2f9a4e1f25e3bd008f7384b5db89fcd95ce03f6c1a410f9e838213d39eea0727', '[\"*\"]', '2026-08-04 09:04:29', NULL, '2026-08-04 08:53:30', '2026-08-04 09:04:29'),
(44, 'App\\Models\\User', 13, 'api-token', '0f1fc2f83fecb2c43bcd964f1e63e8cb9fc3dae8ce71e396930f1a21feb78106', '[\"*\"]', '2026-08-04 09:08:10', NULL, '2026-08-04 09:05:22', '2026-08-04 09:08:10'),
(45, 'App\\Models\\User', 12, 'api-token', 'b91561adeee116c38caaf3d84971507b58944db3c4ee64eca58dfc5c274d2a35', '[\"*\"]', '2026-08-07 18:07:10', NULL, '2026-08-04 09:40:46', '2026-08-07 18:07:10'),
(46, 'App\\Models\\User', 14, 'api-token', '0d35318e3967d99cbefb8f31fab42709f3c6ccc9ea351f6c757a20cbe1966f19', '[\"*\"]', '2026-08-08 04:29:12', NULL, '2026-08-07 18:22:14', '2026-08-08 04:29:12'),
(47, 'App\\Models\\User', 14, 'api-token', '1ced4bd2c0ad30900027143dded63c9747c9fb551f3537246cf91f1e3c78d879', '[\"*\"]', '2026-08-08 05:29:19', NULL, '2026-08-08 04:31:05', '2026-08-08 05:29:19'),
(48, 'App\\Models\\User', 14, 'api-token', 'a8b86bbb0c99b4a49d20db0a1a49a1ad2a279f59c6aed9ae0b7ad417df209642', '[\"*\"]', '2026-08-09 10:10:19', NULL, '2026-08-08 10:48:50', '2026-08-09 10:10:19'),
(49, 'App\\Models\\User', 14, 'api-token', '1c5aa04d26eaf9eb9059555af06104ac2940729a889187dea844f0f8cdef3638', '[\"*\"]', '2026-08-09 10:24:48', NULL, '2026-08-09 10:16:15', '2026-08-09 10:24:48'),
(50, 'App\\Models\\User', 15, 'api-token', 'f3671d4d3b4f694f0e49152cd8a29fe0286a1e8a5579a8244b0e67414edccc1c', '[\"*\"]', '2026-08-09 10:25:46', NULL, '2026-08-09 10:25:28', '2026-08-09 10:25:46'),
(51, 'App\\Models\\User', 14, 'api-token', '08dab7121a2e256efd65fb727b33469d150a409461e324f852c507785dea86c3', '[\"*\"]', '2026-08-09 10:30:33', NULL, '2026-08-09 10:28:29', '2026-08-09 10:30:33'),
(52, 'App\\Models\\User', 15, 'api-token', '01b01e36df70896ca82248d572067dd54dfb10b66ceae7caf365a2b43e82142f', '[\"*\"]', '2026-08-09 10:31:50', NULL, '2026-08-09 10:30:51', '2026-08-09 10:31:50'),
(53, 'App\\Models\\User', 14, 'api-token', '982aedc98b9c51f6f9a78437a64a76203ffd2a75ea118d988e157825af3bcfef', '[\"*\"]', '2026-08-10 08:37:50', NULL, '2026-08-09 10:35:41', '2026-08-10 08:37:50'),
(54, 'App\\Models\\User', 14, 'api-token', 'c9c4318ebf608341a6c72e3240bd905303800c85ff31eac98b71e71edd662b18', '[\"*\"]', '2026-08-11 04:11:02', NULL, '2026-08-11 03:32:50', '2026-08-11 04:11:02'),
(55, 'App\\Models\\User', 14, 'api-token', 'ad43bb0a9193959e1cdaafde79449920d82142f06e0a4f7fd0e45111793ab886', '[\"*\"]', '2026-08-11 04:15:36', NULL, '2026-08-11 04:12:57', '2026-08-11 04:15:36'),
(56, 'App\\Models\\User', 14, 'api-token', '0b3b523912c4f75d417456d9567af89100a88672cf26629809bc429dfd291823', '[\"*\"]', '2026-08-11 05:44:56', NULL, '2026-08-11 04:15:42', '2026-08-11 05:44:56'),
(57, 'App\\Models\\User', 16, 'api-token', 'd05cc6b1af8fdc11c1d8c6eeb67b41c017579cba9152c525501dc99b4d095a76', '[\"*\"]', '2026-08-11 06:29:00', NULL, '2026-08-11 06:08:16', '2026-08-11 06:29:00'),
(58, 'App\\Models\\User', 17, 'api-token', '404bc302b312a7b06228bd0a8aa1cbc4efc59f2599099758c4b90577a8984b5f', '[\"*\"]', '2026-08-11 06:30:14', NULL, '2026-08-11 06:29:28', '2026-08-11 06:30:14'),
(59, 'App\\Models\\User', 16, 'api-token', '3c8f9808b12f8e641e0e4b53cee1fead222ae7c179892f2b1a55469044f6cc6a', '[\"*\"]', '2026-08-12 06:26:52', NULL, '2026-08-11 06:32:35', '2026-08-12 06:26:52'),
(60, 'App\\Models\\User', 14, 'api-token', '51fb6ff2db1c0f1c76d4166c8dc2bc7d6ba928ba9dabfa1f3d1d53a549cf80bc', '[\"*\"]', '2026-08-12 06:42:18', NULL, '2026-08-12 06:27:10', '2026-08-12 06:42:18'),
(61, 'App\\Models\\User', 14, 'api-token', '7f0ca240572866969444327e85a8c48a34a3050a74a72d565d8e5ca13087e331', '[\"*\"]', '2026-08-13 10:34:21', NULL, '2026-08-12 06:43:43', '2026-08-13 10:34:21'),
(62, 'App\\Models\\User', 1, 'api-token', 'c6f2bad3156ca5df0e09418422ff1a33a81eaab5d9b93c5834ffdeab839a635e', '[\"*\"]', '2026-08-15 03:23:09', NULL, '2026-08-13 04:55:42', '2026-08-15 03:23:09'),
(63, 'App\\Models\\User', 14, 'api-token', 'b80811ce7e758e3d9efbde3cb9e3c1e22f643c0ed3a63e9ac9059e4de98d77fd', '[\"*\"]', '2026-08-13 15:06:12', NULL, '2026-08-13 10:36:45', '2026-08-13 15:06:12'),
(64, 'App\\Models\\User', 14, 'api-token', 'd30dae384c14c173070b62cb6e20fa467ef763bcf05e784db31e23ec254eec1e', '[\"*\"]', '2026-08-22 18:23:48', NULL, '2026-08-13 15:32:46', '2026-08-22 18:23:48'),
(65, 'App\\Models\\User', 14, 'api-token', '36aaac04d9f203e9eb1d409f3efad4798d8f15120323755b68afc708b868221f', '[\"*\"]', '2026-08-22 18:41:21', NULL, '2026-08-22 18:25:25', '2026-08-22 18:41:21'),
(66, 'App\\Models\\User', 14, 'api-token', '5cc4b5c11d91bd8cab1d14d6e48fe0ab5739a5ce918537ba86315a77b1493c8d', '[\"*\"]', '2026-08-22 23:30:43', NULL, '2026-08-22 19:30:11', '2026-08-22 23:30:43');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `price` decimal(15,2) NOT NULL,
  `cost_price` decimal(15,2) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `track_expiry` tinyint(1) NOT NULL DEFAULT 0,
  `manufacture_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `reorder_level` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `tenant_id`, `name`, `sku`, `barcode`, `unit`, `category_id`, `supplier_id`, `stock`, `price`, `cost_price`, `image_path`, `description`, `track_expiry`, `manufacture_date`, `expiry_date`, `reorder_level`, `created_at`, `updated_at`) VALUES
(1, 1, 'Iphone 15 pro', 'I-001', NULL, 'Pieces (pcs)', 1, NULL, 8, 2300000.00, 1500000.00, NULL, 'Mobile phone from apple', 0, NULL, NULL, 4, '2026-07-16 12:22:19', '2026-07-20 15:54:07'),
(2, 1, 'Iphone 11', 'I-002', NULL, 'Pieces (pcs)', 1, 1, 11, 750000.00, 400000.00, NULL, NULL, 0, NULL, NULL, 4, '2026-07-19 14:14:30', '2026-07-21 16:38:37'),
(3, 1, 'Iphone 17', 'I-003', NULL, 'Pieces (pcs)', 1, 1, 7, 4500000.00, 2000000.00, NULL, NULL, 0, NULL, NULL, 2, '2026-07-19 15:23:24', '2026-07-21 16:38:37'),
(4, 2, 'Spanish Duvet', 'S-001', NULL, 'Pieces (pcs)', 2, NULL, 13, 230000.00, 130000.00, NULL, NULL, 0, NULL, NULL, 4, '2026-07-28 17:15:18', '2026-07-28 17:15:18'),
(5, 2, 'Small Pillow', 'P-001', NULL, 'Pieces (pcs)', 2, NULL, 11, 15000.00, 6000.00, NULL, NULL, 0, NULL, NULL, 4, '2026-07-28 17:19:47', '2026-07-29 03:59:13'),
(6, 2, '4x6 Bed Sheets', 'B-001', NULL, 'Pieces (pcs)', 2, NULL, 8, 25000.00, 15000.00, NULL, NULL, 0, NULL, NULL, 3, '2026-07-28 17:21:24', '2026-07-29 03:59:13'),
(7, 2, 'Foldable curtain', 'F-001', NULL, 'Pieces (pcs)', 3, NULL, 4, 120000.00, 85000.00, NULL, NULL, 0, NULL, NULL, 1, '2026-07-28 17:23:40', '2026-07-28 17:23:40'),
(8, 3, 'Richard Carroll', 'C-001', 'Voluptates saepe ut', NULL, 4, NULL, 68, 718.00, 305.00, NULL, 'Nesciunt veniam do', 0, NULL, NULL, 26, '2026-07-29 07:21:46', '2026-07-29 07:21:46'),
(9, 3, 'matresses', 'M-001', NULL, 'Pieces (pcs)', 6, NULL, 48, 100000.00, 90000.00, NULL, NULL, 0, NULL, NULL, 5, '2026-07-31 09:35:53', '2026-07-31 10:03:19'),
(10, 4, 'Hublot watch', 'Hw-001', NULL, 'Pieces (pcs)', 7, NULL, 10, 80000.00, 45000.00, NULL, NULL, 0, NULL, NULL, 4, '2026-08-01 05:28:40', '2026-08-04 13:41:23'),
(11, 4, 'Apple Smart watch', 'AS-001', NULL, 'Pieces (pcs)', 7, NULL, 26, 150000.00, 70000.00, NULL, NULL, 0, NULL, NULL, 2, '2026-08-01 05:30:38', '2026-08-04 15:11:50'),
(12, 4, 'Montblanc watch', 'Mw-001', NULL, 'Pieces (pcs)', 7, NULL, 8, 100000.00, 50000.00, NULL, NULL, 0, NULL, NULL, 4, '2026-08-01 05:31:56', '2026-08-04 13:14:45'),
(13, 4, 'White watch', 'Ww-001', NULL, 'Pieces (pcs)', 7, NULL, 12, 15000.00, 5000.00, NULL, 'watches for wearing', 0, NULL, NULL, 5, '2026-08-04 09:45:16', '2026-08-04 13:23:55'),
(14, 4, 'airpods', 'ai-001', NULL, 'Pieces (pcs)', 8, NULL, 15, 30000.00, 20000.00, NULL, NULL, 0, NULL, NULL, 8, '2026-08-04 13:03:19', '2026-08-04 13:05:56'),
(15, 4, 'carpet', 'ca-001', NULL, 'Pieces (pcs)', 8, NULL, 12, 2222.00, 1222.00, NULL, NULL, 0, NULL, NULL, 4, '2026-08-06 06:46:21', '2026-08-06 06:46:21'),
(17, 5, '5X6 Duvet', '5D-001', NULL, 'Pieces (pcs)', 9, NULL, 15, 50000.00, 20000.00, NULL, NULL, 0, NULL, NULL, 2, '2026-08-07 19:15:41', '2026-08-15 03:46:03'),
(18, 5, '4X6 Bedsheets', '4B-001', NULL, 'Pairs', 11, NULL, 21, 25000.00, 8000.00, 'products/PBF53fKi5B8ygoMv4z2JjmA4RZbz0QVF4Uqq1qWb.jpg', NULL, 0, NULL, NULL, 3, '2026-08-07 19:25:43', '2026-08-22 12:43:21'),
(19, 5, '3X6 Bedsheets', '3B-001', NULL, 'Pairs', 11, NULL, 40, 18000.00, 5000.00, 'products/LGKnRv1yTHEQOZOGPwrP2HYDwD6xQhEJVwBOZAXm.jpg', NULL, 0, NULL, NULL, 3, '2026-08-07 19:25:43', '2026-08-22 12:28:52'),
(21, 6, 'Blue Jeans', 'BJ-001', NULL, 'Pieces (pcs)', 13, NULL, 2, 1000.00, 800.00, NULL, NULL, 0, NULL, NULL, 5, '2026-08-11 06:14:49', '2026-08-12 05:57:47'),
(22, 6, 'white plain t-shirt', 'wp-001', NULL, 'Pieces (pcs)', 14, NULL, 26, 1000.00, 800.00, NULL, NULL, 0, NULL, NULL, 4, '2026-08-11 06:14:49', '2026-08-11 06:30:14'),
(23, 5, 'Matress covers', 'Mc-001', NULL, 'Pieces (pcs)', 12, NULL, 25, 100000.00, 80000.00, NULL, NULL, 0, NULL, NULL, 5, '2026-08-22 12:38:11', '2026-08-22 18:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `purchase_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `tenant_id`, `supplier_id`, `total_amount`, `purchase_date`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 12000000.00, '2026-07-19', '2026-07-19 15:23:24', '2026-07-19 15:23:24'),
(2, 1, 1, 8900000.00, '2026-07-21', '2026-07-21 16:38:37', '2026-07-21 16:38:37'),
(3, 4, 2, 1000000.00, '2026-08-04', '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(4, 4, NULL, 500.00, '2026-08-04', '2026-08-04 15:11:50', '2026-08-04 15:11:50'),
(5, 6, NULL, 44800.00, '2026-08-11', '2026-08-11 06:22:08', '2026-08-11 06:22:08'),
(6, 5, 3, 4800.00, '2026-08-13', '2026-08-13 10:31:29', '2026-08-13 10:31:29'),
(7, 5, 3, 400000.00, '2026-08-22', '2026-08-22 12:43:21', '2026-08-22 12:43:21');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `cost_price` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`id`, `tenant_id`, `purchase_id`, `product_id`, `quantity`, `cost_price`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 3, 6, 2000000.00, '2026-07-19 15:23:24', '2026-07-19 15:23:24'),
(2, 1, 2, 3, 2, 4000000.00, '2026-07-21 16:38:37', '2026-07-21 16:38:37'),
(3, 1, 2, 2, 2, 450000.00, '2026-07-21 16:38:37', '2026-07-21 16:38:37'),
(4, 4, 3, 11, 20, 30000.00, '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(5, 4, 3, 10, 10, 20000.00, '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(6, 4, 3, 13, 10, 20000.00, '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(7, 4, 4, 11, 1, 500.00, '2026-08-04 15:11:50', '2026-08-04 15:11:50'),
(8, 6, 5, 21, 50, 800.00, '2026-08-11 06:22:08', '2026-08-11 06:22:08'),
(9, 6, 5, 22, 6, 800.00, '2026-08-11 06:22:08', '2026-08-11 06:22:08'),
(10, 5, 6, 17, 6, 800.00, '2026-08-13 10:31:29', '2026-08-13 10:31:29'),
(11, 5, 7, 18, 20, 20000.00, '2026-08-22 12:43:21', '2026-08-22 12:43:21');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `tenant_id`, `name`, `description`, `is_default`, `created_at`, `updated_at`) VALUES
(1, NULL, 'owner', 'Business owner with full access', 1, '2026-07-16 09:56:44', '2026-07-16 09:56:44'),
(2, NULL, 'admin', 'Administrator with broad permissions', 1, '2026-07-16 09:56:44', '2026-07-16 09:56:44'),
(3, NULL, 'manager', 'Manager with operational access', 1, '2026-07-16 09:56:44', '2026-07-16 09:56:44'),
(4, NULL, 'cashier', 'Cashier with sales access only', 1, '2026-07-16 09:56:44', '2026-07-16 09:56:44'),
(8, 3, 'seller', 'sells products', 0, '2026-07-31 10:01:31', '2026-07-31 10:01:31'),
(9, 4, 'Seller', 'can create sales', 0, '2026-08-04 09:03:51', '2026-08-04 09:03:51'),
(10, 5, 'Seller', 'can sell ittems', 0, '2026-08-09 10:24:49', '2026-08-09 10:24:49'),
(11, 6, 'Seller', 'can do sales', 0, '2026-08-11 06:29:01', '2026-08-11 06:29:01');

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_user`
--

INSERT INTO `role_user` (`id`, `user_id`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-07-16 12:20:32', '2026-07-16 12:20:32'),
(8, 8, 1, '2026-07-28 17:05:51', '2026-07-28 17:05:51'),
(9, 9, 1, '2026-07-29 07:10:43', '2026-07-29 07:10:43'),
(10, 10, 4, '2026-07-29 07:18:31', '2026-07-29 07:18:31'),
(11, 11, 8, '2026-07-31 10:01:31', '2026-07-31 10:01:31'),
(12, 12, 1, '2026-08-01 05:11:01', '2026-08-01 05:11:01'),
(13, 13, 9, '2026-08-04 09:03:51', '2026-08-04 09:03:51'),
(14, 14, 1, '2026-08-07 18:22:14', '2026-08-07 18:22:14'),
(15, 15, 10, '2026-08-09 10:24:49', '2026-08-09 10:24:49'),
(16, 16, 1, '2026-08-11 06:08:16', '2026-08-11 06:08:16'),
(17, 17, 11, '2026-08-11 06:29:01', '2026-08-11 06:29:01');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `discount_type` varchar(255) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `tax_amount` decimal(15,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `sale_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `tenant_id`, `user_id`, `customer_id`, `discount_type`, `discount_amount`, `tax_amount`, `notes`, `total_amount`, `payment_method`, `sale_date`, `created_at`, `updated_at`) VALUES
(3, 1, 1, NULL, NULL, NULL, NULL, NULL, 4600000.00, 'cash', '2026-07-16 00:00:00', '2026-07-16 12:59:51', '2026-07-16 12:59:51'),
(5, 1, NULL, NULL, NULL, NULL, NULL, NULL, 4600000.00, 'mobile_money', '2026-07-16 00:00:00', '2026-07-16 13:03:11', '2026-07-16 13:06:07'),
(8, 1, 1, NULL, NULL, NULL, NULL, NULL, 4600000.00, 'mobile_money', '2026-07-18 00:00:00', '2026-07-18 15:01:59', '2026-07-18 15:01:59'),
(9, 1, NULL, NULL, 'fixed', 50000.00, NULL, NULL, 4550000.00, 'cash', '2026-07-19 00:00:00', '2026-07-19 14:00:28', '2026-07-19 14:00:28'),
(10, 1, NULL, NULL, NULL, NULL, 700.00, NULL, 2300700.00, 'mobile_money', '2026-07-19 00:00:00', '2026-07-19 14:00:49', '2026-07-19 14:00:49'),
(11, 1, NULL, NULL, NULL, NULL, NULL, NULL, 2300000.00, 'cash', '2026-07-19 00:00:00', '2026-07-19 14:01:36', '2026-07-19 14:01:36'),
(12, 1, NULL, NULL, NULL, NULL, NULL, NULL, 4600000.00, 'cash', '2026-07-19 00:00:00', '2026-07-19 14:01:56', '2026-07-19 14:01:56'),
(13, 1, 1, NULL, NULL, NULL, NULL, NULL, 5250000.00, 'mobile_money', '2026-07-21 00:00:00', '2026-07-21 16:37:26', '2026-07-21 16:37:26'),
(14, 2, 8, NULL, NULL, NULL, NULL, NULL, 42000.00, 'cash', '2026-07-29 00:00:00', '2026-07-29 03:57:32', '2026-07-29 03:59:13'),
(15, 3, 11, NULL, NULL, NULL, NULL, NULL, 200000.00, 'cash', '2026-07-31 00:00:00', '2026-07-31 10:03:19', '2026-07-31 10:03:19'),
(16, 4, 12, NULL, NULL, NULL, NULL, NULL, 80000.00, 'cash', '2026-08-01 00:00:00', '2026-08-01 05:33:39', '2026-08-01 05:33:39'),
(17, 4, 12, NULL, NULL, NULL, NULL, NULL, 100000.00, 'mobile_money', '2026-08-01 00:00:00', '2026-08-01 16:45:37', '2026-08-01 16:45:37'),
(18, 4, 13, NULL, NULL, NULL, NULL, NULL, 640000.00, 'cash', '2026-08-04 00:00:00', '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(19, 4, 12, NULL, NULL, NULL, NULL, NULL, 195000.00, 'cash', '2026-08-04 00:00:00', '2026-08-04 09:46:07', '2026-08-04 09:46:07'),
(20, 4, 12, NULL, NULL, NULL, NULL, NULL, 80000.00, 'mobile_money', '2026-08-04 00:00:00', '2026-08-04 09:47:39', '2026-08-04 09:47:39'),
(21, 4, 12, 1, 'fixed', 20000.00, NULL, NULL, 220000.00, 'cash', '2026-08-04 00:00:00', '2026-08-04 13:05:56', '2026-08-04 13:05:56'),
(23, 5, 14, NULL, NULL, NULL, NULL, NULL, 165000.00, 'cash', '2026-08-09 00:00:00', '2026-08-09 10:38:08', '2026-08-09 10:40:13'),
(24, 5, 14, NULL, NULL, NULL, NULL, NULL, 26000.00, 'mobile_money', '2026-08-09 00:00:00', '2026-08-09 10:48:28', '2026-08-09 10:50:39'),
(25, 5, 14, 2, NULL, NULL, NULL, NULL, 38000.00, 'mobile_money', '2026-08-09 00:00:00', '2026-08-09 10:58:10', '2026-08-09 10:58:10'),
(26, 5, 14, NULL, NULL, NULL, NULL, NULL, 50000.00, 'cash', '2026-08-11 00:00:00', '2026-08-11 03:33:58', '2026-08-11 03:33:58'),
(27, 5, 14, NULL, NULL, NULL, NULL, NULL, 10000.00, 'mobile_money', '2026-08-11 00:00:00', '2026-08-11 03:46:17', '2026-08-11 03:46:17'),
(28, 6, 16, NULL, 'fixed', 7000.00, NULL, NULL, 51000.00, 'cash', '2026-08-11 00:00:00', '2026-08-11 06:16:09', '2026-08-11 06:17:42'),
(29, 6, 17, NULL, NULL, NULL, NULL, NULL, 2000.00, 'cash', '2026-08-11 00:00:00', '2026-08-11 06:30:14', '2026-08-11 06:30:14'),
(30, 6, 16, NULL, NULL, NULL, NULL, NULL, 37000.00, 'cash', '2026-08-12 00:00:00', '2026-08-12 05:57:47', '2026-08-12 05:57:47'),
(31, 5, 14, NULL, NULL, NULL, NULL, NULL, 400000.00, 'mobile_money', '2026-08-12 00:00:00', '2026-08-12 06:37:38', '2026-08-12 06:37:38'),
(32, 5, 14, NULL, NULL, NULL, NULL, NULL, 20000.00, 'cash', '2026-08-12 00:00:00', '2026-08-12 06:38:51', '2026-08-12 06:38:51'),
(33, 5, 14, NULL, NULL, NULL, NULL, NULL, 18000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 03:32:56', '2026-08-15 03:32:56'),
(34, 5, 14, NULL, NULL, NULL, NULL, NULL, 18000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 03:34:12', '2026-08-15 03:34:12'),
(35, 5, 14, NULL, NULL, NULL, NULL, NULL, 150000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 03:43:18', '2026-08-15 03:43:18'),
(36, 5, 14, NULL, NULL, NULL, NULL, NULL, 50000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 03:46:03', '2026-08-15 03:46:03'),
(37, 5, 14, NULL, NULL, NULL, NULL, NULL, 18000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 03:55:51', '2026-08-15 03:55:51'),
(38, 5, 14, NULL, 'fixed', 5000.00, NULL, NULL, 13000.00, 'cash', '2026-08-15 00:00:00', '2026-08-15 04:00:15', '2026-08-15 04:00:15'),
(39, 5, 14, NULL, NULL, NULL, NULL, NULL, 90000.00, 'cash', '2026-08-22 00:00:00', '2026-08-22 12:28:52', '2026-08-22 12:28:52'),
(40, 5, 14, NULL, NULL, NULL, NULL, NULL, 100000.00, 'cash', '2026-08-22 00:00:00', '2026-08-22 13:57:40', '2026-08-22 13:57:40'),
(41, 5, 14, NULL, NULL, NULL, NULL, NULL, 100000.00, 'cash', '2026-08-22 00:00:00', '2026-08-22 14:53:21', '2026-08-22 14:53:21'),
(42, 5, 14, NULL, NULL, NULL, NULL, NULL, 100000.00, 'mobile_money', '2026-08-22 00:00:00', '2026-08-22 18:13:38', '2026-08-22 18:13:38'),
(43, 5, 14, NULL, NULL, NULL, NULL, NULL, 100000.00, 'mobile_money', '2026-08-22 00:00:00', '2026-08-22 18:14:38', '2026-08-22 18:14:38'),
(44, 5, 14, NULL, NULL, NULL, NULL, NULL, 100000.00, 'mobile_money', '2026-08-22 21:37:27', '2026-08-22 18:37:27', '2026-08-22 18:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `tenant_id`, `sale_id`, `product_id`, `quantity`, `price`, `subtotal`, `created_at`, `updated_at`) VALUES
(3, 1, 3, 1, 2, 2300000.00, 4600000.00, '2026-07-16 12:59:51', '2026-07-16 12:59:51'),
(7, 1, 5, 1, 2, 2300000.00, 4600000.00, '2026-07-16 13:06:07', '2026-07-16 13:06:07'),
(9, 1, 8, 1, 2, 2300000.00, 4600000.00, '2026-07-18 15:01:59', '2026-07-18 15:01:59'),
(10, 1, 9, 1, 2, 2300000.00, 4600000.00, '2026-07-19 14:00:28', '2026-07-19 14:00:28'),
(11, 1, 10, 1, 1, 2300000.00, 2300000.00, '2026-07-19 14:00:49', '2026-07-19 14:00:49'),
(12, 1, 11, 1, 1, 2300000.00, 2300000.00, '2026-07-19 14:01:36', '2026-07-19 14:01:36'),
(13, 1, 12, 1, 2, 2300000.00, 4600000.00, '2026-07-19 14:01:56', '2026-07-19 14:01:56'),
(14, 1, 13, 3, 1, 4500000.00, 4500000.00, '2026-07-21 16:37:26', '2026-07-21 16:37:26'),
(15, 1, 13, 2, 1, 750000.00, 750000.00, '2026-07-21 16:37:26', '2026-07-21 16:37:26'),
(18, 2, 14, 6, 1, 27000.00, 27000.00, '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(19, 2, 14, 5, 1, 15000.00, 15000.00, '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(20, 3, 15, 9, 2, 100000.00, 200000.00, '2026-07-31 10:03:19', '2026-07-31 10:03:19'),
(21, 4, 16, 10, 1, 80000.00, 80000.00, '2026-08-01 05:33:39', '2026-08-01 05:33:39'),
(22, 4, 17, 12, 1, 100000.00, 100000.00, '2026-08-01 16:45:37', '2026-08-01 16:45:37'),
(23, 4, 18, 10, 3, 80000.00, 240000.00, '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(24, 4, 18, 11, 2, 150000.00, 300000.00, '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(25, 4, 18, 12, 1, 100000.00, 100000.00, '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(26, 4, 19, 13, 13, 15000.00, 195000.00, '2026-08-04 09:46:07', '2026-08-04 09:46:07'),
(27, 4, 20, 10, 1, 80000.00, 80000.00, '2026-08-04 09:47:39', '2026-08-04 09:47:39'),
(28, 4, 21, 14, 8, 30000.00, 240000.00, '2026-08-04 13:05:56', '2026-08-04 13:05:56'),
(39, 5, 23, 17, 1, 50000.00, 50000.00, '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(40, 5, 23, 18, 3, 25000.00, 75000.00, '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(44, 5, 25, 19, 1, 18000.00, 18000.00, '2026-08-09 10:58:10', '2026-08-09 10:58:10'),
(50, 6, 28, 21, 47, 1000.00, 47000.00, '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(51, 6, 28, 22, 11, 1000.00, 11000.00, '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(52, 6, 29, 21, 1, 1000.00, 1000.00, '2026-08-11 06:30:14', '2026-08-11 06:30:14'),
(53, 6, 29, 22, 1, 1000.00, 1000.00, '2026-08-11 06:30:14', '2026-08-11 06:30:14'),
(54, 6, 30, 21, 37, 1000.00, 37000.00, '2026-08-12 05:57:47', '2026-08-12 05:57:47'),
(55, 5, 31, 17, 8, 50000.00, 400000.00, '2026-08-12 06:37:38', '2026-08-12 06:37:38'),
(57, 5, 33, 19, 1, 18000.00, 18000.00, '2026-08-15 03:32:56', '2026-08-15 03:32:56'),
(58, 5, 34, 19, 1, 18000.00, 18000.00, '2026-08-15 03:34:12', '2026-08-15 03:34:12'),
(59, 5, 35, 18, 6, 25000.00, 150000.00, '2026-08-15 03:43:18', '2026-08-15 03:43:18'),
(60, 5, 36, 17, 1, 50000.00, 50000.00, '2026-08-15 03:46:03', '2026-08-15 03:46:03'),
(61, 5, 37, 19, 1, 18000.00, 18000.00, '2026-08-15 03:55:51', '2026-08-15 03:55:51'),
(62, 5, 38, 19, 1, 18000.00, 18000.00, '2026-08-15 04:00:15', '2026-08-15 04:00:15'),
(63, 5, 39, 19, 5, 18000.00, 90000.00, '2026-08-22 12:28:52', '2026-08-22 12:28:52'),
(64, 5, 40, 23, 1, 100000.00, 100000.00, '2026-08-22 13:57:40', '2026-08-22 13:57:40'),
(65, 5, 41, 23, 1, 100000.00, 100000.00, '2026-08-22 14:53:21', '2026-08-22 14:53:21'),
(66, 5, 42, 23, 1, 100000.00, 100000.00, '2026-08-22 18:13:38', '2026-08-22 18:13:38'),
(67, 5, 43, 23, 1, 100000.00, 100000.00, '2026-08-22 18:14:38', '2026-08-22 18:14:38'),
(68, 5, 44, 23, 1, 100000.00, 100000.00, '2026-08-22 18:37:27', '2026-08-22 18:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `reference_type` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `tenant_id`, `product_id`, `type`, `quantity`, `reference_id`, `reference_type`, `reason`, `date`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'OUT', 1, '1', NULL, NULL, '2026-07-16', '2026-07-16 12:22:33', '2026-07-16 12:22:33'),
(2, 1, 1, 'OUT', 2, '2', NULL, NULL, '2026-07-16', '2026-07-16 12:28:12', '2026-07-16 12:28:12'),
(3, 1, 1, 'IN', 1, '1', NULL, NULL, '2026-07-16', '2026-07-16 12:51:21', '2026-07-16 12:51:21'),
(4, 1, 1, 'IN', 2, '2', NULL, NULL, '2026-07-16', '2026-07-16 12:58:10', '2026-07-16 12:58:10'),
(5, 1, 1, 'OUT', 2, '3', NULL, NULL, '2026-07-16', '2026-07-16 12:59:51', '2026-07-16 12:59:51'),
(6, 1, 1, 'OUT', 1, '4', NULL, NULL, '2026-07-16', '2026-07-16 13:00:07', '2026-07-16 13:00:07'),
(7, 1, 1, 'IN', 1, '4', NULL, NULL, '2026-07-16', '2026-07-16 13:02:12', '2026-07-16 13:02:12'),
(8, 1, 1, 'OUT', 2, '5', NULL, NULL, '2026-07-16', '2026-07-16 13:03:11', '2026-07-16 13:03:11'),
(9, 1, 1, 'OUT', 1, '6', NULL, NULL, '2026-07-16', '2026-07-16 13:03:26', '2026-07-16 13:03:26'),
(10, 1, 1, 'IN', 1, '6', NULL, NULL, '2026-07-16', '2026-07-16 13:05:04', '2026-07-16 13:05:04'),
(11, 1, 1, 'IN', 2, '5', NULL, NULL, '2026-07-16', '2026-07-16 13:06:07', '2026-07-16 13:06:07'),
(12, 1, 1, 'OUT', 2, '5', NULL, NULL, '2026-07-16', '2026-07-16 13:06:07', '2026-07-16 13:06:07'),
(13, 1, 1, 'OUT', 1, '7', NULL, NULL, '2026-07-18', '2026-07-18 14:59:26', '2026-07-18 14:59:26'),
(14, 1, 1, 'OUT', 2, '8', NULL, NULL, '2026-07-18', '2026-07-18 15:01:59', '2026-07-18 15:01:59'),
(15, 1, 1, 'OUT', 2, '9', NULL, NULL, '2026-07-19', '2026-07-19 14:00:29', '2026-07-19 14:00:29'),
(16, 1, 1, 'OUT', 1, '10', NULL, NULL, '2026-07-19', '2026-07-19 14:00:49', '2026-07-19 14:00:49'),
(17, 1, 1, 'OUT', 1, '11', NULL, NULL, '2026-07-19', '2026-07-19 14:01:36', '2026-07-19 14:01:36'),
(18, 1, 1, 'OUT', 2, '12', NULL, NULL, '2026-07-19', '2026-07-19 14:01:57', '2026-07-19 14:01:57'),
(19, 1, 3, 'IN', 6, '1', NULL, NULL, '2026-07-19', '2026-07-19 15:23:24', '2026-07-19 15:23:24'),
(20, 1, 1, 'IN', 6, 'manual', NULL, 'restocking', '2026-07-20', '2026-07-20 15:54:07', '2026-07-20 15:54:07'),
(21, 1, 3, 'OUT', 1, '13', 'sale', NULL, '2026-07-21', '2026-07-21 16:37:26', '2026-07-21 16:37:26'),
(22, 1, 2, 'OUT', 1, '13', 'sale', NULL, '2026-07-21', '2026-07-21 16:37:26', '2026-07-21 16:37:26'),
(23, 1, 3, 'IN', 2, '2', 'purchase', NULL, '2026-07-21', '2026-07-21 16:38:37', '2026-07-21 16:38:37'),
(24, 1, 2, 'IN', 2, '2', 'purchase', NULL, '2026-07-21', '2026-07-21 16:38:37', '2026-07-21 16:38:37'),
(25, 2, 6, 'OUT', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:57:32', '2026-07-29 03:57:32'),
(26, 2, 5, 'OUT', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:57:32', '2026-07-29 03:57:32'),
(27, 2, 6, 'IN', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(28, 2, 5, 'IN', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(29, 2, 6, 'OUT', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(30, 2, 5, 'OUT', 1, '14', 'sale', NULL, '2026-07-29', '2026-07-29 03:59:13', '2026-07-29 03:59:13'),
(31, 3, 9, 'OUT', 2, '15', 'sale', NULL, '2026-07-31', '2026-07-31 10:03:19', '2026-07-31 10:03:19'),
(32, 4, 10, 'OUT', 1, '16', 'sale', NULL, '2026-08-01', '2026-08-01 05:33:39', '2026-08-01 05:33:39'),
(33, 4, 12, 'OUT', 1, '17', 'sale', NULL, '2026-08-01', '2026-08-01 16:45:37', '2026-08-01 16:45:37'),
(34, 4, 10, 'OUT', 3, '18', 'sale', NULL, '2026-08-04', '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(35, 4, 11, 'OUT', 2, '18', 'sale', NULL, '2026-08-04', '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(36, 4, 12, 'OUT', 1, '18', 'sale', NULL, '2026-08-04', '2026-08-04 09:08:10', '2026-08-04 09:08:10'),
(37, 4, 13, 'OUT', 13, '19', 'sale', NULL, '2026-08-04', '2026-08-04 09:46:07', '2026-08-04 09:46:07'),
(38, 4, 10, 'OUT', 1, '20', 'sale', NULL, '2026-08-04', '2026-08-04 09:47:39', '2026-08-04 09:47:39'),
(39, 4, 14, 'OUT', 8, '21', 'sale', NULL, '2026-08-04', '2026-08-04 13:05:56', '2026-08-04 13:05:56'),
(40, 4, 10, 'OUT', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:09:30', '2026-08-04 13:09:30'),
(41, 4, 11, 'OUT', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:09:30', '2026-08-04 13:09:30'),
(42, 4, 12, 'OUT', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:09:30', '2026-08-04 13:09:30'),
(43, 4, 10, 'IN', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(44, 4, 11, 'IN', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(45, 4, 12, 'IN', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(46, 4, 10, 'OUT', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(47, 4, 11, 'OUT', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(48, 4, 12, 'OUT', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:13:56', '2026-08-04 13:13:56'),
(49, 4, 10, 'IN', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:14:45', '2026-08-04 13:14:45'),
(50, 4, 11, 'IN', 3, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:14:45', '2026-08-04 13:14:45'),
(51, 4, 12, 'IN', 2, '22', 'sale', NULL, '2026-08-04', '2026-08-04 13:14:45', '2026-08-04 13:14:45'),
(52, 4, 11, 'IN', 20, '3', 'purchase', NULL, '2026-08-04', '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(53, 4, 10, 'IN', 10, '3', 'purchase', NULL, '2026-08-04', '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(54, 4, 13, 'IN', 10, '3', 'purchase', NULL, '2026-08-04', '2026-08-04 13:23:55', '2026-08-04 13:23:55'),
(55, 4, 10, 'OUT', 10, 'manual', 'manual', 'stock correction', '2026-08-04', '2026-08-04 13:35:58', '2026-08-04 13:35:58'),
(56, 4, 10, 'IN', 10, 'manual', 'manual', NULL, '2026-08-04', '2026-08-04 13:36:17', '2026-08-04 13:36:17'),
(57, 4, 10, 'ADJUSTMENT', 15, 'manual', 'manual', 'stock correction', '2026-08-04', '2026-08-04 13:41:23', '2026-08-04 13:41:23'),
(58, 4, 11, 'IN', 1, '4', 'purchase', NULL, '2026-08-04', '2026-08-04 15:11:50', '2026-08-04 15:11:50'),
(60, 5, 17, 'OUT', 1, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:38:08', '2026-08-09 10:38:08'),
(61, 5, 18, 'OUT', 2, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:38:08', '2026-08-09 10:38:08'),
(63, 5, 17, 'IN', 1, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(64, 5, 18, 'IN', 2, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(66, 5, 17, 'OUT', 1, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(67, 5, 18, 'OUT', 3, '23', 'sale', NULL, '2026-08-09', '2026-08-09 10:40:13', '2026-08-09 10:40:13'),
(73, 5, 19, 'OUT', 1, '25', 'sale', NULL, '2026-08-09', '2026-08-09 10:58:10', '2026-08-09 10:58:10'),
(77, 6, 21, 'OUT', 47, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:16:10', '2026-08-11 06:16:10'),
(78, 6, 22, 'OUT', 10, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:16:10', '2026-08-11 06:16:10'),
(79, 6, 21, 'IN', 47, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(80, 6, 22, 'IN', 10, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(81, 6, 21, 'OUT', 47, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(82, 6, 22, 'OUT', 11, '28', 'sale', NULL, '2026-08-11', '2026-08-11 06:17:42', '2026-08-11 06:17:42'),
(83, 6, 21, 'IN', 50, '5', 'purchase', NULL, '2026-08-11', '2026-08-11 06:22:08', '2026-08-11 06:22:08'),
(84, 6, 22, 'IN', 6, '5', 'purchase', NULL, '2026-08-11', '2026-08-11 06:22:08', '2026-08-11 06:22:08'),
(85, 6, 21, 'ADJUSTMENT', 13, 'manual', 'manual', 'correction', '2026-08-11', '2026-08-11 06:24:45', '2026-08-11 06:24:45'),
(86, 6, 21, 'OUT', 1, '29', 'sale', NULL, '2026-08-11', '2026-08-11 06:30:14', '2026-08-11 06:30:14'),
(87, 6, 22, 'OUT', 1, '29', 'sale', NULL, '2026-08-11', '2026-08-11 06:30:14', '2026-08-11 06:30:14'),
(88, 6, 21, 'OUT', 37, '30', 'sale', NULL, '2026-08-12', '2026-08-12 05:57:47', '2026-08-12 05:57:47'),
(89, 5, 17, 'OUT', 8, '31', 'sale', NULL, '2026-08-12', '2026-08-12 06:37:38', '2026-08-12 06:37:38'),
(91, 5, 17, 'IN', 6, '6', 'purchase', NULL, '2026-08-13', '2026-08-13 10:31:30', '2026-08-13 10:31:30'),
(92, 5, 19, 'OUT', 1, '33', 'sale', NULL, '2026-08-15', '2026-08-15 03:32:56', '2026-08-15 03:32:56'),
(93, 5, 19, 'OUT', 1, '34', 'sale', NULL, '2026-08-15', '2026-08-15 03:34:12', '2026-08-15 03:34:12'),
(94, 5, 18, 'OUT', 6, '35', 'sale', NULL, '2026-08-15', '2026-08-15 03:43:18', '2026-08-15 03:43:18'),
(95, 5, 17, 'OUT', 1, '36', 'sale', NULL, '2026-08-15', '2026-08-15 03:46:03', '2026-08-15 03:46:03'),
(96, 5, 19, 'OUT', 1, '37', 'sale', NULL, '2026-08-15', '2026-08-15 03:55:51', '2026-08-15 03:55:51'),
(97, 5, 19, 'OUT', 1, '38', 'sale', NULL, '2026-08-15', '2026-08-15 04:00:15', '2026-08-15 04:00:15'),
(98, 5, 19, 'OUT', 5, '39', 'sale', NULL, '2026-08-22', '2026-08-22 12:28:53', '2026-08-22 12:28:53'),
(99, 5, 18, 'IN', 20, '7', 'purchase', NULL, '2026-08-22', '2026-08-22 12:43:21', '2026-08-22 12:43:21'),
(100, 5, 23, 'OUT', 1, '40', 'sale', NULL, '2026-08-22', '2026-08-22 13:57:40', '2026-08-22 13:57:40'),
(101, 5, 23, 'OUT', 1, '41', 'sale', NULL, '2026-08-22', '2026-08-22 14:53:21', '2026-08-22 14:53:21'),
(102, 5, 23, 'OUT', 1, '42', 'sale', NULL, '2026-08-22', '2026-08-22 18:13:38', '2026-08-22 18:13:38'),
(103, 5, 23, 'OUT', 1, '43', 'sale', NULL, '2026-08-22', '2026-08-22 18:14:38', '2026-08-22 18:14:38'),
(104, 5, 23, 'OUT', 1, '44', 'sale', NULL, '2026-08-22', '2026-08-22 18:37:27', '2026-08-22 18:37:27');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `tenant_id`, `name`, `contact`, `email`, `address`, `created_at`, `updated_at`) VALUES
(1, 1, 'AQ distributors', '0700909899', 'aqdist@gmail.com', 'Entebbe Road', '2026-07-18 09:39:04', '2026-07-18 09:39:04'),
(2, 4, 'Kampala Distributors', '0789233345', 'nakibingecollins1@gmail.com', 'Entebbe Road', '2026-08-04 13:04:14', '2026-08-04 13:04:14'),
(3, 5, 'Marvin pillows', '0708901234', 'nakibingecollins1@gmail.com', 'Entebbe Road', '2026-08-09 10:56:26', '2026-08-09 10:56:26'),
(4, 6, 'htyn distributors', '0704345566', 'nakibingecollins1@gmail.com', 'Entebbe Road', '2026-08-11 06:19:59', '2026-08-11 06:19:59');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`contacts`)),
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `email`, `phone`, `contacts`, `address`, `created_at`, `updated_at`) VALUES
(1, 'NK phones', 'nakibingecollins1@gmail.com', '0781327479', '[{\"type\": \"primary\", \"number\": \"0781327479\"}]', 'Entebbe Road', '2026-07-16 12:20:32', '2026-07-16 12:20:32'),
(2, 'MIREMBE BEDDINGS AND CURTAINS', 'mirembe@gmail.com', '0704787479', '[{\"type\": \"primary\", \"number\": \"0704787479\"}]', 'Namulanda, Entebbe Road', '2026-07-28 17:05:50', '2026-07-28 17:05:50'),
(3, 'MEREMENYA BEDDINGS', 'meremenya@gmail.com', '0781327479', '[{\"type\": \"primary\", \"number\": \"0781327479\"}]', 'Kampala', '2026-07-29 07:10:41', '2026-07-29 07:10:41'),
(4, 'Hajarah Smart Watches', 'Hajarah@gmail.com', '0705435811', '[{\"type\": \"primary\", \"number\": \"0705435811\"}]', 'Park view building, Kampala', '2026-08-01 05:11:01', '2026-08-01 05:11:01'),
(5, 'ZZIWA AND SONS BEDDINGS', 'zziwa.biz@gmail.com', '0705364749', '[{\"type\":\"primary\",\"number\":\"0705364749\"},{\"type\":\"mobile\",\"number\":\"0788111823\"}]', 'Mukwano arcade shop AG 84', '2026-08-07 18:22:14', '2026-08-22 14:55:33'),
(6, 'junior store', 'junior@gmail.com', '0705435814', '[{\"type\": \"primary\", \"number\": \"0705435814\"}]', 'kampala', '2026-08-11 06:08:15', '2026-08-11 06:08:15');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tenant_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `created_by`, `name`, `email`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Nakibinge Collins', 'nakibingecollins1@gmail.com', '$2y$12$l.m8mMVSW.Icu87eiK.DYuptOX8MioA4jS0uwNHbPVlYQyPvCyrV.', NULL, '2026-07-16 12:20:32', '2026-07-16 12:20:32'),
(8, 2, NULL, 'MIREMBE', 'mirembe@gmail.com', '$2y$12$uW8k6nJPs9IeOW8zyyw1VOjm0rbtsMrFxtubqTdJVYSaZgLFtnCOi', NULL, '2026-07-28 17:05:51', '2026-07-28 17:05:51'),
(9, 3, NULL, 'MEREMENYA', 'meremenya@gmail.com', '$2y$12$5nIdANl5tY2Z5Qv.vIXZd.RHx7ErkdnivnsnJxxlDto8eqyp1VQOO', NULL, '2026-07-29 07:10:43', '2026-07-29 07:10:43'),
(10, 3, 9, 'hun', 'nakibingecollins2@gmail.com', '$2y$12$J3NsQf8XBVGr4hilsS8hl.5609zkm7RQpa71SkjUVkJzvFuoBOHv.', NULL, '2026-07-29 07:18:31', '2026-07-29 07:18:31'),
(11, 3, NULL, 'Tyron', 'tyron@gmail.com', '$2y$12$nVqIBReKicfqGARhkhm7HudqV3UFA2CPaHLDtvYQC190VTO6pdWEu', NULL, '2026-07-31 10:01:31', '2026-07-31 10:01:31'),
(12, 4, NULL, 'Hajarah', 'Hajarah@gmail.com', '$2y$12$YS2QS5unln00/ToBGCtR5ef8zOdDm1z2wAcaN2eEKr46DjPtRl4Hu', NULL, '2026-08-01 05:11:01', '2026-08-01 05:11:01'),
(13, 4, NULL, 'James', 'james@gmail.com', '$2y$12$ih8h2Unfz9Toi3o8DYS/eegQf3dmbASt4fkTcOQUZmwPvYuYseAeO', NULL, '2026-08-04 09:03:51', '2026-08-04 09:03:51'),
(14, 5, NULL, 'Zziwa', 'zziwa@gmail.com', '$2y$12$y54YC7n/9jIU2sVNPCl.Ve3yjCHDD58yVQOmLlmF1lInHu1eAKCfq', NULL, '2026-08-07 18:22:14', '2026-08-07 18:22:14'),
(15, 5, NULL, 'Fred', 'fred@gmail.com', '$2y$12$7o3dSm/fvhWHi7Tq/2DQV.dgCz14srkto5lmqYVpeTE/fCJmad1UG', NULL, '2026-08-09 10:24:49', '2026-08-09 10:30:34'),
(16, 6, NULL, 'junior', 'junior@gmail.com', '$2y$12$02O4eznXMT09VjXB9pfuve65IEQYFlMLQgUHAuTVZdEjlus9Jo3a2', NULL, '2026-08-11 06:08:16', '2026-08-11 06:08:16'),
(17, 6, NULL, 'kevin', 'kevin@gmail.com', '$2y$12$7viYoQCRHTLj4.Wi.Dx/jOWmEBIWzNfYg38XS90Zs3mtT1AiMrLDe', NULL, '2026-08-11 06:29:01', '2026-08-11 06:29:01');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_tenant_id_index` (`tenant_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `invoices_tenant_id_foreign` (`tenant_id`),
  ADD KEY `invoices_user_id_foreign` (`user_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_tenant_id_name_unique` (`tenant_id`,`name`);

--
-- Indexes for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_role_permission_id_role_id_unique` (`permission_id`,`role_id`),
  ADD KEY `permission_role_role_id_foreign` (`role_id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_tenant_id_foreign` (`tenant_id`),
  ADD KEY `products_category_id_foreign` (`category_id`),
  ADD KEY `products_supplier_id_foreign` (`supplier_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchases_tenant_id_foreign` (`tenant_id`),
  ADD KEY `purchases_supplier_id_foreign` (`supplier_id`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_items_tenant_id_foreign` (`tenant_id`),
  ADD KEY `purchase_items_purchase_id_foreign` (`purchase_id`),
  ADD KEY `purchase_items_product_id_foreign` (`product_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_tenant_id_name_unique` (`tenant_id`,`name`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_user_user_id_role_id_unique` (`user_id`,`role_id`),
  ADD KEY `role_user_role_id_foreign` (`role_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_tenant_id_foreign` (`tenant_id`),
  ADD KEY `sales_customer_id_foreign` (`customer_id`),
  ADD KEY `sales_user_id_foreign` (`user_id`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_items_tenant_id_foreign` (`tenant_id`),
  ADD KEY `sale_items_sale_id_foreign` (`sale_id`),
  ADD KEY `sale_items_product_id_foreign` (`product_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_movements_tenant_id_foreign` (`tenant_id`),
  ADD KEY `stock_movements_product_id_foreign` (`product_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `suppliers_tenant_id_foreign` (`tenant_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenants_email_unique` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `users_tenant_id_foreign` (`tenant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `permission_role`
--
ALTER TABLE `permission_role`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `role_user`
--
ALTER TABLE `role_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchases_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `purchase_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_items_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_items_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_movements_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
