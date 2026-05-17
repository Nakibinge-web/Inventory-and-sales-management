<?php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;

/**
 * PurchasePolicy
 * 
 * Authorizes purchase operations based on role-based access control.
 * Grants full CRUD access to owner and manager roles only.
 * Enforces tenant isolation for all resource-specific operations.
 */
class PurchasePolicy extends BasePolicy
{
    /**
     * Determine if the user can view any purchases.
     * 
     * @param User $user The authenticated user
     * @return bool True if user is owner or manager
     */
    public function viewAny(User $user): bool
    {
        return $this->hasAnyRole($user, ['owner', 'manager']);
    }

    /**
     * Determine if the user can view the purchase.
     * 
     * @param User $user The authenticated user
     * @param Purchase $purchase The purchase being accessed
     * @return bool True if user is owner or manager and purchase belongs to user's tenant
     */
    public function view(User $user, Purchase $purchase): bool
    {
        return $this->belongsToTenant($user, $purchase)
            && $this->hasAnyRole($user, ['owner', 'manager']);
    }

    /**
     * Determine if the user can create purchases.
     * 
     * @param User $user The authenticated user
     * @return bool True if user is owner or manager
     */
    public function create(User $user): bool
    {
        return $this->hasAnyRole($user, ['owner', 'manager']);
    }

    /**
     * Determine if the user can update the purchase.
     * 
     * @param User $user The authenticated user
     * @param Purchase $purchase The purchase being updated
     * @return bool True if user is owner or manager and purchase belongs to user's tenant
     */
    public function update(User $user, Purchase $purchase): bool
    {
        return $this->belongsToTenant($user, $purchase)
            && $this->hasAnyRole($user, ['owner', 'manager']);
    }

    /**
     * Determine if the user can delete the purchase.
     * 
     * @param User $user The authenticated user
     * @param Purchase $purchase The purchase being deleted
     * @return bool True if user is owner or manager and purchase belongs to user's tenant
     */
    public function delete(User $user, Purchase $purchase): bool
    {
        return $this->belongsToTenant($user, $purchase)
            && $this->hasAnyRole($user, ['owner', 'manager']);
    }
}
