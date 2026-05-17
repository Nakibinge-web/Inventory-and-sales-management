# Implementation Plan: Role-Based Policy System

## Overview

This plan implements a Laravel policy-based authorization system for role-based access control (RBAC) in a multi-tenant inventory management application. The implementation follows a tenant-first security model where tenant isolation is enforced before role-based permissions. The system supports four roles (owner, manager, admin, cashier) with distinct permission matrices across seven resource types.

## Tasks

- [x] 1. Create base policy structure and helper methods
  - Create `app/Policies` directory if it doesn't exist
  - Implement `belongsToTenant()` helper method for tenant isolation checks
  - Implement `hasAnyRole()` helper method for role validation
  - Establish the tenant-first checking pattern for all policies
  - _Requirements: 8.1, 8.2, 8.3, 10.6_

- [ ] 2. Implement ProductPolicy
  - [x] 2.1 Create ProductPolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or manager access)
    - Implement `view()` method (owner or manager + tenant check)
    - Implement `create()` method (owner or manager access)
    - Implement `update()` method (owner or manager + tenant check)
    - Implement `delete()` method (owner or manager + tenant check)
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 2.2 Write property test for ProductPolicy
    - **Property 1: Owner Universal Access**
    - **Property 2: Manager Inventory Resource Access**
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4**
  
  - [ ]* 2.3 Write unit tests for ProductPolicy
    - Test owner access to all operations
    - Test manager access to all operations
    - Test admin denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - Test null tenant_id handling
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 8.1, 8.2_

- [ ] 3. Implement CategoryPolicy
  - [x] 3.1 Create CategoryPolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or manager access)
    - Implement `view()` method (owner or manager + tenant check)
    - Implement `create()` method (owner or manager access)
    - Implement `update()` method (owner or manager + tenant check)
    - Implement `delete()` method (owner or manager + tenant check)
    - _Requirements: 1.3, 2.5, 2.6, 2.7, 2.8, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 3.2 Write property test for CategoryPolicy
    - **Property 1: Owner Universal Access**
    - **Property 2: Manager Inventory Resource Access**
    - **Validates: Requirements 1.1, 1.3, 2.5, 2.6, 2.7, 2.8**
  
  - [ ]* 3.3 Write unit tests for CategoryPolicy
    - Test owner access to all operations
    - Test manager access to all operations
    - Test admin denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.3, 2.5, 2.6, 2.7, 2.8, 8.1, 8.2_

- [x] 4. Implement SupplierPolicy
  - [x] 4.1 Create SupplierPolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or manager access)
    - Implement `view()` method (owner or manager + tenant check)
    - Implement `create()` method (owner or manager access)
    - Implement `update()` method (owner or manager + tenant check)
    - Implement `delete()` method (owner or manager + tenant check)
    - _Requirements: 1.4, 2.9, 2.10, 2.11, 2.12, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 4.2 Write property test for SupplierPolicy
    - **Property 1: Owner Universal Access**
    - **Property 2: Manager Inventory Resource Access**
    - **Validates: Requirements 1.1, 1.4, 2.9, 2.10, 2.11, 2.12**
  
  - [ ]* 4.3 Write unit tests for SupplierPolicy
    - Test owner access to all operations
    - Test manager access to all operations
    - Test admin denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.4, 2.9, 2.10, 2.11, 2.12, 8.1, 8.2_

- [ ] 5. Implement PurchasePolicy
  - [x] 5.1 Create PurchasePolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or manager access)
    - Implement `view()` method (owner or manager + tenant check)
    - Implement `create()` method (owner or manager access)
    - Implement `update()` method (owner or manager + tenant check)
    - Implement `delete()` method (owner or manager + tenant check)
    - _Requirements: 1.5, 2.13, 2.14, 2.15, 2.16, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 5.2 Write property test for PurchasePolicy
    - **Property 1: Owner Universal Access**
    - **Property 2: Manager Inventory Resource Access**
    - **Validates: Requirements 1.1, 1.5, 2.13, 2.14, 2.15, 2.16**
  
  - [ ]* 5.3 Write unit tests for PurchasePolicy
    - Test owner access to all operations
    - Test manager access to all operations
    - Test admin denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.5, 2.13, 2.14, 2.15, 2.16, 8.1, 8.2_

- [x] 6. Checkpoint - Verify inventory policies
  - Ensure all tests pass for Product, Category, Supplier, and Purchase policies
  - Verify tenant isolation is working correctly
  - Ask the user if questions arise

- [x] 7. Implement StockMovementPolicy
  - [x] 7.1 Create StockMovementPolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or manager access)
    - Implement `view()` method (owner or manager + tenant check)
    - Implement `create()` method (owner or manager access)
    - Implement `update()` method (owner or manager + tenant check)
    - Implement `delete()` method (owner or manager + tenant check)
    - _Requirements: 1.7, 2.17, 2.18, 2.19, 2.20, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 7.2 Write property test for StockMovementPolicy
    - **Property 1: Owner Universal Access**
    - **Property 2: Manager Inventory Resource Access**
    - **Validates: Requirements 1.1, 1.7, 2.17, 2.18, 2.19, 2.20**
  
  - [ ]* 7.3 Write unit tests for StockMovementPolicy
    - Test owner access to all operations
    - Test manager access to all operations
    - Test admin denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.7, 2.17, 2.18, 2.19, 2.20, 8.1, 8.2_

- [x] 8. Implement SalePolicy with special cashier rules
  - [x] 8.1 Create SalePolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or cashier access)
    - Implement `view()` method (owner or cashier + tenant check)
    - Implement `create()` method (owner or cashier access)
    - Implement `update()` method (owner only + tenant check)
    - Implement `delete()` method (owner only + tenant check)
    - _Requirements: 1.6, 6.1, 6.2, 7.1, 7.2, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 8.2 Write property test for SalePolicy
    - **Property 1: Owner Universal Access**
    - **Property 7: Cashier Sale View and Create Access**
    - **Property 8: Cashier Sale Modification Denial**
    - **Validates: Requirements 1.1, 1.6, 6.1, 6.2, 7.1, 7.2**
  
  - [ ]* 8.3 Write unit tests for SalePolicy
    - Test owner access to all operations
    - Test cashier access to view and create only
    - Test cashier denial for update and delete
    - Test manager denial for all operations
    - Test admin denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.6, 3.5, 3.6, 3.7, 3.8, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2_

- [x] 9. Implement UserPolicy with admin access
  - [x] 9.1 Create UserPolicy class with all CRUD methods
    - Implement `viewAny()` method (owner or admin access)
    - Implement `view()` method (owner or admin + tenant check)
    - Implement `create()` method (owner or admin access)
    - Implement `update()` method (owner or admin + tenant check)
    - Implement `delete()` method (owner or admin + tenant check)
    - _Requirements: 1.8, 4.1, 4.2, 4.3, 4.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 9.2 Write property test for UserPolicy
    - **Property 1: Owner Universal Access**
    - **Property 5: Admin User Management Access**
    - **Validates: Requirements 1.1, 1.8, 4.1, 4.2, 4.3, 4.4**
  
  - [ ]* 9.3 Write unit tests for UserPolicy
    - Test owner access to all operations
    - Test admin access to all operations
    - Test manager denial for all operations
    - Test cashier denial for all operations
    - Test tenant isolation for view, update, delete
    - _Requirements: 1.8, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2_

- [x] 10. Register all policies in AuthServiceProvider
  - [x] 10.1 Update AuthServiceProvider with policy mappings
    - Add ProductPolicy mapping to $policies array
    - Add CategoryPolicy mapping to $policies array
    - Add SupplierPolicy mapping to $policies array
    - Add PurchasePolicy mapping to $policies array
    - Add SalePolicy mapping to $policies array
    - Add StockMovementPolicy mapping to $policies array
    - Add UserPolicy mapping to $policies array
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ]* 10.2 Write unit tests for AuthServiceProvider
    - Test that all seven policies are registered
    - Test Gate::getPolicyFor() returns correct policy instances
    - Test policy methods are callable through Gate facade
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 11. Write comprehensive property-based tests
  - [ ] 11.1 Write property test for manager denial rules
    - **Property 3: Manager User Management Denial**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
  
  - [x]* 11.2 Write property test for admin denial rules
    - **Property 6: Admin Non-User Resource Denial**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
  
  - [x]* 11.3 Write property test for cashier denial rules
    - **Property 9: Cashier Non-Sale Resource Denial**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**
  
  - [x]* 11.4 Write property test for tenant isolation
    - **Property 10: Tenant Isolation Enforcement**
    - **Property 11: Tenant Check Precedence**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [x]* 11.5 Write property test for return types
    - **Property 12: Policy Method Return Type**
    - **Validates: Requirements 10.6**

- [ ] 12. Write integration tests for controller authorization
  - [ ]* 12.1 Write integration tests for ProductController
    - Test authorize() calls properly invoke ProductPolicy
    - Test unauthorized requests return 403 responses
    - Test authorized requests proceed to business logic
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 12.2 Write integration tests for SaleController
    - Test authorize() calls properly invoke SalePolicy
    - Test cashier can create and view sales
    - Test cashier cannot update or delete sales
    - Test unauthorized requests return 403 responses
    - _Requirements: 1.6, 6.1, 6.2, 7.1, 7.2_
  
  - [ ]* 12.3 Write integration tests for UserController
    - Test authorize() calls properly invoke UserPolicy
    - Test admin can manage users
    - Test manager cannot manage users
    - Test unauthorized requests return 403 responses
    - _Requirements: 1.8, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 13. Test edge cases and error scenarios
  - [ ]* 13.1 Write tests for edge cases
    - Test user with no roles (all operations denied)
    - Test user with multiple roles (union of permissions)
    - Test resource with null tenant_id (all operations denied)
    - Test user with null tenant_id (all operations denied)
    - Test cross-tenant access by owner (denied despite owner role)
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 14. Final checkpoint - Complete system verification
  - Run all unit tests and ensure they pass
  - Run all property-based tests and ensure they pass
  - Run all integration tests and ensure they pass
  - Verify all 12 correctness properties are validated
  - Verify no cross-tenant access is possible
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests should run minimum 100 iterations each
- Tenant isolation must be enforced before role checks in all policies
- Helper methods (belongsToTenant, hasAnyRole) should be reused across all policies
- All policy methods must return boolean values
- Integration tests validate end-to-end authorization flow through controllers
