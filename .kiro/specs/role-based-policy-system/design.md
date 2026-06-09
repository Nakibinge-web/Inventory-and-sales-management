# Design Document: Role-Based Policy System

## Overview

This design document specifies the implementation of a role-based access control (RBAC) system using Laravel policies for a multi-tenant inventory management application. The system enforces authorization rules based on four predefined roles (owner, manager, admin, cashier) while maintaining strict tenant isolation.

### Design Goals

1. **Separation of Concerns**: Isolate authorization logic from business logic using Laravel's policy system
2. **Tenant Security**: Enforce tenant boundaries before role-based checks to prevent cross-tenant access
3. **Role-Based Access**: Implement granular permissions based on user roles with clear permission matrices
4. **Laravel Conventions**: Follow Laravel's authorization patterns for seamless integration with existing code
5. **Maintainability**: Create reusable patterns and clear abstractions for policy logic

### Key Design Decisions

**Policy-Based Authorization**: We use Laravel policies rather than middleware or controller-based checks because:
- Policies centralize authorization logic in dedicated classes
- They integrate seamlessly with Laravel's `authorize()` and `@can` directives
- They support automatic model binding and resource-level checks
- They provide a consistent interface across all resources

**Tenant-First Checking**: All policies verify tenant ownership before role permissions because:
- Tenant isolation is a security requirement that supersedes role permissions
- Early tenant checks prevent unnecessary role evaluation for cross-tenant requests
- This pattern ensures no authorization path can bypass tenant boundaries

**Role Name Constants**: We use string-based role names ('owner', 'manager', 'admin', 'cashier') because:
- The existing Role model uses name-based lookups
- The User model's `hasRole()` method expects string role names
- This maintains consistency with the existing codebase

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Laravel Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────────────────────┐  │
│  │ Controllers  │────────▶│   Authorization Layer        │  │
│  └──────────────┘         │  (Gate/Policy Resolution)    │  │
│                           └──────────────────────────────┘  │
│                                      │                       │
│                                      ▼                       │
│                           ┌──────────────────────────────┐  │
│                           │   Policy Classes             │  │
│                           │  ┌────────────────────────┐  │  │
│                           │  │ ProductPolicy          │  │  │
│                           │  │ CategoryPolicy         │  │  │
│                           │  │ SupplierPolicy         │  │  │
│                           │  │ PurchasePolicy         │  │  │
│                           │  │ SalePolicy             │  │  │
│                           │  │ StockMovementPolicy    │  │  │
│                           │  │ UserPolicy             │  │  │
│                           │  └────────────────────────┘  │  │
│                           └──────────────────────────────┘  │
│                                      │                       │
│                                      ▼                       │
│                           ┌──────────────────────────────┐  │
│                           │   Authorization Logic        │  │
│                           │  ┌────────────────────────┐  │  │
│                           │  │ 1. Tenant Check        │  │  │
│                           │  │ 2. Role Check          │  │  │
│                           │  │ 3. Return Boolean      │  │  │
│                           │  └────────────────────────┘  │  │
│                           └──────────────────────────────┘  │
│                                      │                       │
│                                      ▼                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Layer (Models)                      │  │
│  │  User, Role, Product, Category, Supplier, etc.       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Authorization Flow

```
Request → Controller → authorize() call
                           │
                           ▼
                    Gate Resolution
                           │
                           ▼
                    Policy Method
                           │
                           ├─▶ Tenant Check
                           │   (resource.tenant_id == user.tenant_id)
                           │        │
                           │        ├─▶ false → Deny (403)
                           │        │
                           │        └─▶ true → Continue
                           │
                           ├─▶ Role Check
                           │   (user.hasRole('role_name'))
                           │        │
                           │        ├─▶ false → Deny (403)
                           │        │
                           │        └─▶ true → Allow
                           │
                           ▼
                    Return Boolean
                           │
                           ├─▶ true → Continue to Business Logic
                           │
                           └─▶ false → 403 Forbidden Response
```

### Permission Matrix

| Resource       | Owner | Manager | Admin | Cashier |
|----------------|-------|---------|-------|---------|
| Product        | CRUD  | CRUD    | ✗     | ✗       |
| Category       | CRUD  | CRUD    | ✗     | ✗       |
| Supplier       | CRUD  | CRUD    | ✗     | ✗       |
| Purchase       | CRUD  | CRUD    | ✗     | ✗       |
| Sale           | CRUD  | ✗       | ✗     | R + C   |
| StockMovement  | CRUD  | CRUD    | ✗     | ✗       |
| User           | CRUD  | ✗       | CRUD  | ✗       |

**Legend**: CRUD = Create, Read, Update, Delete; R = Read only; C = Create only; ✗ = No access

## Components and Interfaces

### Policy Classes

Each policy class implements the standard Laravel policy interface with five core methods:

#### Base Policy Structure

```php
class ResourcePolicy
{
    /**
     * Determine if the user can view any resources.
     */
    public function viewAny(User $user): bool;

    /**
     * Determine if the user can view the resource.
     */
    public function view(User $user, Resource $resource): bool;

    /**
     * Determine if the user can create resources.
     */
    public function create(User $user): bool;

    /**
     * Determine if the user can update the resource.
     */
    public function update(User $user, Resource $resource): bool;

    /**
     * Determine if the user can delete the resource.
     */
    public function delete(User $user, Resource $resource): bool;
}
```

### Policy Implementations

#### 1. ProductPolicy

**Location**: `app/Policies/ProductPolicy.php`

**Responsibilities**:
- Authorize product viewing, creation, updating, and deletion
- Enforce tenant isolation for all product operations
- Grant access to owner and manager roles only

**Authorization Rules**:
- `viewAny()`: Owner or Manager
- `view()`: Owner or Manager + same tenant
- `create()`: Owner or Manager
- `update()`: Owner or Manager + same tenant
- `delete()`: Owner or Manager + same tenant

#### 2. CategoryPolicy

**Location**: `app/Policies/CategoryPolicy.php`

**Responsibilities**:
- Authorize category viewing, creation, updating, and deletion
- Enforce tenant isolation for all category operations
- Grant access to owner and manager roles only

**Authorization Rules**:
- `viewAny()`: Owner or Manager
- `view()`: Owner or Manager + same tenant
- `create()`: Owner or Manager
- `update()`: Owner or Manager + same tenant
- `delete()`: Owner or Manager + same tenant

#### 3. SupplierPolicy

**Location**: `app/Policies/SupplierPolicy.php`

**Responsibilities**:
- Authorize supplier viewing, creation, updating, and deletion
- Enforce tenant isolation for all supplier operations
- Grant access to owner and manager roles only

**Authorization Rules**:
- `viewAny()`: Owner or Manager
- `view()`: Owner or Manager + same tenant
- `create()`: Owner or Manager
- `update()`: Owner or Manager + same tenant
- `delete()`: Owner or Manager + same tenant

#### 4. PurchasePolicy

**Location**: `app/Policies/PurchasePolicy.php`

**Responsibilities**:
- Authorize purchase viewing, creation, updating, and deletion
- Enforce tenant isolation for all purchase operations
- Grant access to owner and manager roles only

**Authorization Rules**:
- `viewAny()`: Owner or Manager
- `view()`: Owner or Manager + same tenant
- `create()`: Owner or Manager
- `update()`: Owner or Manager + same tenant
- `delete()`: Owner or Manager + same tenant

#### 5. SalePolicy

**Location**: `app/Policies/SalePolicy.php`

**Responsibilities**:
- Authorize sale viewing, creation, updating, and deletion
- Enforce tenant isolation for all sale operations
- Grant different access levels to owner and cashier roles

**Authorization Rules**:
- `viewAny()`: Owner or Cashier
- `view()`: Owner or Cashier + same tenant
- `create()`: Owner or Cashier
- `update()`: Owner only + same tenant
- `delete()`: Owner only + same tenant

#### 6. StockMovementPolicy

**Location**: `app/Policies/StockMovementPolicy.php`

**Responsibilities**:
- Authorize stock movement viewing, creation, updating, and deletion
- Enforce tenant isolation for all stock movement operations
- Grant access to owner and manager roles only

**Authorization Rules**:
- `viewAny()`: Owner or Manager
- `view()`: Owner or Manager + same tenant
- `create()`: Owner or Manager
- `update()`: Owner or Manager + same tenant
- `delete()`: Owner or Manager + same tenant

#### 7. UserPolicy

**Location**: `app/Policies/UserPolicy.php`

**Responsibilities**:
- Authorize user viewing, creation, updating, and deletion
- Enforce tenant isolation for all user operations
- Grant access to owner and admin roles only

**Authorization Rules**:
- `viewAny()`: Owner or Admin
- `view()`: Owner or Admin + same tenant
- `create()`: Owner or Admin
- `update()`: Owner or Admin + same tenant
- `delete()`: Owner or Admin + same tenant

### AuthServiceProvider

**Location**: `app/Providers/AuthServiceProvider.php`

**Responsibilities**:
- Register all policy classes with Laravel's Gate
- Map model classes to their corresponding policy classes
- Enable automatic policy discovery for authorization checks

**Policy Registration**:
```php
protected $policies = [
    Product::class => ProductPolicy::class,
    Category::class => CategoryPolicy::class,
    Supplier::class => SupplierPolicy::class,
    Purchase::class => PurchasePolicy::class,
    Sale::class => SalePolicy::class,
    StockMovement::class => StockMovement::class,
    User::class => UserPolicy::class,
];
```

### Helper Methods

Each policy will implement two private helper methods for code reuse:

#### `belongsToTenant(User $user, Model $resource): bool`

Verifies that a resource belongs to the user's tenant.

**Parameters**:
- `$user`: The authenticated user
- `$resource`: The model instance being accessed

**Returns**: `true` if `$resource->tenant_id === $user->tenant_id`, `false` otherwise

**Usage**: Called in all resource-specific methods (view, update, delete) before role checks

#### `hasAnyRole(User $user, array $roles): bool`

Checks if the user has any of the specified roles.

**Parameters**:
- `$user`: The authenticated user
- `$roles`: Array of role names to check

**Returns**: `true` if user has at least one of the roles, `false` otherwise

**Implementation**:
```php
private function hasAnyRole(User $user, array $roles): bool
{
    foreach ($roles as $role) {
        if ($user->hasRole($role)) {
            return true;
        }
    }
    return false;
}
```

## Data Models

### Existing Models (No Changes Required)

The design leverages existing models without modification:

#### User Model
- **Location**: `app/Models/User.php`
- **Key Attributes**: `id`, `tenant_id`, `name`, `email`
- **Key Relationships**: 
  - `roles()`: Many-to-many with Role model
  - `tenant()`: Belongs to Tenant model
- **Key Methods**: `hasRole(string $role): bool`

#### Role Model
- **Location**: `app/Models/Role.php`
- **Key Attributes**: `id`, `tenant_id`, `name`, `description`, `is_default`
- **Key Relationships**: 
  - `users()`: Many-to-many with User model
  - `permissions()`: Many-to-many with Permission model

#### Resource Models
All resource models use the `BelongsToTenant` trait and have a `tenant_id` attribute:
- **Product**: `app/Models/Product.php`
- **Category**: `app/Models/Category.php`
- **Supplier**: `app/Models/Supplier.php`
- **Purchase**: `app/Models/Purchase.php`
- **Sale**: `app/Models/Sale.php`
- **StockMovement**: `app/Models/StockMovement.php`

### Role Names

The system uses four predefined role names (stored in the `roles.name` column):
- `'owner'`: Full access to all resources
- `'manager'`: Full access to inventory resources (products, categories, suppliers, purchases, stock movements)
- `'admin'`: Full access to user management only
- `'cashier'`: Limited access to sales (view and create only)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

1. **Requirements 1.2-1.8** are specific instances of the general owner access rule (1.1). Testing that owners have access to all operations on all resources comprehensively covers these individual resource permissions.

2. **Requirement 8.2** is the logical inverse of 8.1. Testing tenant isolation with cross-tenant access attempts automatically validates both criteria.

3. **Requirement 9.8** is automatically satisfied if policies are properly registered (9.1-9.7). Laravel's Gate system handles routing once registration is complete.

4. **Manager inventory access (2.1-2.20)** can be consolidated into a single property that tests manager access across all inventory resources rather than separate properties per resource type.

5. **Admin denial properties (5.1-5.6)** can be consolidated into a single property that tests admin denial across all non-user resources.

6. **Cashier denial properties (7.3-7.8)** can be consolidated into a single property that tests cashier denial across all non-sale resources.

The following properties provide complete coverage while eliminating redundancy:

### Property 1: Owner Universal Access

*For any* authenticated user with the owner role and any resource within their tenant, all policy methods (viewAny, view, create, update, delete) should return true.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

### Property 2: Manager Inventory Resource Access

*For any* authenticated user with the manager role and any inventory resource (Product, Category, Supplier, Purchase, StockMovement) within their tenant, all policy methods (viewAny, view, create, update, delete) should return true.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20**

### Property 3: Manager User Management Denial

*For any* authenticated user with the manager role and any User resource, all policy methods (viewAny, view, create, update, delete) should return false.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Manager Sales Denial

*For any* authenticated user with the manager role and any Sale resource, all policy methods (viewAny, view, create, update, delete) should return false.

**Validates: Requirements 3.5, 3.6, 3.7, 3.8**

### Property 5: Admin User Management Access

*For any* authenticated user with the admin role and any User resource within their tenant, all policy methods (viewAny, view, create, update, delete) should return true.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Admin Non-User Resource Denial

*For any* authenticated user with the admin role and any non-user resource (Product, Category, Supplier, Purchase, Sale, StockMovement), all policy methods (viewAny, view, create, update, delete) should return false.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 7: Cashier Sale View and Create Access

*For any* authenticated user with the cashier role and any Sale resource within their tenant, the viewAny, view, and create policy methods should return true.

**Validates: Requirements 6.1, 6.2**

### Property 8: Cashier Sale Modification Denial

*For any* authenticated user with the cashier role and any Sale resource, the update and delete policy methods should return false.

**Validates: Requirements 7.1, 7.2**

### Property 9: Cashier Non-Sale Resource Denial

*For any* authenticated user with the cashier role and any non-sale resource (Product, Category, Supplier, Purchase, StockMovement, User), all policy methods (viewAny, view, create, update, delete) should return false.

**Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**

### Property 10: Tenant Isolation Enforcement

*For any* authenticated user and any resource that does not belong to the user's tenant, all resource-specific policy methods (view, update, delete) should return false regardless of the user's role.

**Validates: Requirements 8.1, 8.2**

### Property 11: Tenant Check Precedence

*For any* authenticated user with the owner role and any resource from a different tenant, all resource-specific policy methods (view, update, delete) should return false, demonstrating that tenant checks occur before role checks.

**Validates: Requirements 8.3**

### Property 12: Policy Method Return Type

*For any* policy class and any policy method (viewAny, view, create, update, delete), when invoked with valid parameters, the method should return a boolean value.

**Validates: Requirements 10.6**

## Error Handling

### Authorization Failures

**Scenario**: User attempts an unauthorized operation

**Handling**:
- Policy methods return `false`
- Laravel's authorization system throws `AuthorizationException`
- Exception is caught by Laravel's exception handler
- Returns HTTP 403 Forbidden response with message "This action is unauthorized"

**No Custom Error Handling Required**: Laravel's built-in authorization exception handling is sufficient for this feature.

### Missing Tenant Context

**Scenario**: Resource lacks `tenant_id` or user lacks `tenant_id`

**Handling**:
- Policy methods check for null `tenant_id` values
- Return `false` if either is null
- This prevents authorization when tenant context is missing

**Implementation Pattern**:
```php
private function belongsToTenant(User $user, Model $resource): bool
{
    return $resource->tenant_id !== null 
        && $user->tenant_id !== null 
        && $resource->tenant_id === $user->tenant_id;
}
```

### Missing Role Assignment

**Scenario**: User has no roles assigned

**Handling**:
- `User::hasRole()` returns `false` for all role checks
- Policy methods return `false` for all operations
- User receives 403 Forbidden response

**No Special Handling Required**: The role checking logic naturally handles users with no roles.

### Multiple Role Assignment

**Scenario**: User has multiple roles (e.g., both manager and admin)

**Handling**:
- Policy methods check roles using OR logic via `hasAnyRole()`
- User is granted access if ANY of their roles permits the operation
- This follows the principle of least restriction

**Example**: A user with both manager and admin roles can:
- Manage inventory resources (via manager role)
- Manage users (via admin role)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific role-resource combinations (e.g., "manager can view specific product")
- Test edge cases (null tenant_id, missing roles, multiple roles)
- Test policy registration in AuthServiceProvider
- Test helper method behavior

**Property-Based Tests**: Verify universal properties across all inputs
- Test role-based access rules across randomly generated resources
- Test tenant isolation with random tenant assignments
- Test all CRUD operations with random role combinations
- Ensure comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library**: Use `pest-plugin-faker` or `phpunit-quickcheck` for PHP property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property using a comment tag
- Tag format: `// Feature: role-based-policy-system, Property {number}: {property_text}`

**Example Test Structure**:
```php
// Feature: role-based-policy-system, Property 1: Owner Universal Access
test('owner has universal access to all resources', function () {
    // Run 100 iterations with random resources
    for ($i = 0; $i < 100; $i++) {
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('name', 'owner')->first());
        
        $resource = $this->randomResource($user->tenant_id);
        $policy = Gate::getPolicyFor($resource);
        
        expect($policy->viewAny($user))->toBeTrue();
        expect($policy->view($user, $resource))->toBeTrue();
        expect($policy->create($user))->toBeTrue();
        expect($policy->update($user, $resource))->toBeTrue();
        expect($policy->delete($user, $resource))->toBeTrue();
    }
});
```

### Unit Test Coverage

**Policy Method Tests** (per policy class):
- Test each CRUD method with authorized roles
- Test each CRUD method with unauthorized roles
- Test tenant isolation for resource-specific methods
- Test with null tenant_id values
- Test with users having multiple roles

**AuthServiceProvider Tests**:
- Verify all seven policies are registered
- Verify Gate::getPolicyFor() returns correct policy instances
- Verify policy methods are callable through Gate facade

**Helper Method Tests**:
- Test `belongsToTenant()` with same tenant
- Test `belongsToTenant()` with different tenants
- Test `belongsToTenant()` with null tenant_id
- Test `hasAnyRole()` with single role
- Test `hasAnyRole()` with multiple roles
- Test `hasAnyRole()` with no roles

### Test Data Generators

For property-based tests, implement generators for:
- Random users with random role assignments
- Random resources (Product, Category, Supplier, Purchase, Sale, StockMovement, User)
- Random tenant assignments
- Random CRUD operations

### Integration Testing

**Controller Integration**:
- Test that `authorize()` calls in controllers properly invoke policies
- Test that unauthorized requests return 403 responses
- Test that authorized requests proceed to business logic

**Blade Directive Integration**:
- Test that `@can` directives properly check policies
- Test UI elements are hidden/shown based on authorization

### Edge Cases to Test

1. **User with no roles**: All operations should be denied
2. **User with multiple roles**: Should have union of all role permissions
3. **Resource with null tenant_id**: All operations should be denied
4. **User with null tenant_id**: All operations should be denied
5. **Cross-tenant access by owner**: Should be denied despite owner role
6. **Policy method with null resource**: Should handle gracefully (for create operations)

### Test Organization

```
tests/
├── Unit/
│   ├── Policies/
│   │   ├── ProductPolicyTest.php
│   │   ├── CategoryPolicyTest.php
│   │   ├── SupplierPolicyTest.php
│   │   ├── PurchasePolicyTest.php
│   │   ├── SalePolicyTest.php
│   │   ├── StockMovementPolicyTest.php
│   │   └── UserPolicyTest.php
│   └── Providers/
│       └── AuthServiceProviderTest.php
└── Feature/
    ├── PropertyBased/
    │   ├── OwnerAccessPropertyTest.php
    │   ├── ManagerAccessPropertyTest.php
    │   ├── AdminAccessPropertyTest.php
    │   ├── CashierAccessPropertyTest.php
    │   └── TenantIsolationPropertyTest.php
    └── Authorization/
        ├── ProductAuthorizationTest.php
        ├── CategoryAuthorizationTest.php
        ├── SupplierAuthorizationTest.php
        ├── PurchaseAuthorizationTest.php
        ├── SaleAuthorizationTest.php
        ├── StockMovementAuthorizationTest.php
        └── UserAuthorizationTest.php
```

### Success Criteria

The implementation is complete when:
1. All unit tests pass (100% coverage of policy methods)
2. All property-based tests pass (minimum 100 iterations each)
3. All 12 correctness properties are validated
4. Integration tests confirm controller and blade directive integration
5. Edge cases are handled correctly
6. No cross-tenant access is possible regardless of role
