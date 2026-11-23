import React, { useState, useEffect, useCallback } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import developerApi from './developerApi';
import { can, PERMISSIONS } from './developerPermissions';

export default function DeveloperTenants({ user, token, onNotify }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, last_page: 1, per_page: 25 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusModalTenant, setStatusModalTenant] = useState(null);
  const [newStatus, setNewStatus] = useState('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await developerApi.getTenants(token, {
        search,
        status: statusFilter,
        plan: planFilter,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        per_page: 25,
      });

      if (res.success) {
        setTenants(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        onNotify(res.message || 'Failed to fetch tenants.', 'error');
      }
    } catch (err) {
      onNotify(err.message || 'Error communicating with tenant directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, planFilter, dateFrom, dateTo, page, onNotify]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleViewDetails = async (tenantId) => {
    try {
      setDetailsLoading(true);
      setSelectedTenant({ id: tenantId, loading: true });
      const res = await developerApi.getTenant(token, tenantId);
      if (res.success && res.data) {
        setSelectedTenant(res.data);
      } else {
        onNotify(res.message || 'Could not load tenant details.', 'error');
        setSelectedTenant(null);
      }
    } catch (err) {
      onNotify(err.message || 'Failed to fetch tenant profile.', 'error');
      setSelectedTenant(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenStatusModal = (tenant) => {
    setStatusModalTenant(tenant);
    setNewStatus(tenant.status === 'active' ? 'suspended' : 'active');
    setStatusReason('');
    setStatusError(null);
  };

  const handleSaveStatus = async () => {
    if (!statusModalTenant) return;
    try {
      setStatusUpdating(true);
      setStatusError(null);
      const res = await developerApi.updateTenantStatus(
        token,
        statusModalTenant.id,
        newStatus,
        statusReason || null
      );

      if (res.success) {
        onNotify(`Tenant ${statusModalTenant.name} is now ${newStatus}.`, 'success');
        setStatusModalTenant(null);
        fetchTenants();
        if (selectedTenant && selectedTenant.id === statusModalTenant.id) {
          handleViewDetails(statusModalTenant.id);
        }
      } else {
        setStatusError(res.message || 'Failed to update status.');
      }
    } catch (err) {
      setStatusError(err.message || 'Failed to update tenant status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const canManage = can(user, PERMISSIONS.TENANTS_MANAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Tenant Directory
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Inspect all registered organizations, subscription entitlements, and operational states across the platform.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchTenants} loading={loading}>
          ↻ Refresh Directory
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by name, email, or TIN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ width: '150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              backgroundColor: '#fff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Plan Filter */}
        <div style={{ width: '150px' }}>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              backgroundColor: '#fff',
            }}
          >
            <option value="">All Plans</option>
            <option value="Trial">Trial</option>
            <option value="Starter">Starter</option>
            <option value="Business">Business</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        {/* Date From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
          />
        </div>

        {(search || statusFilter || planFilter || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPlanFilter('');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Tenants Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading tenant directory...
          </div>
        ) : tenants.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              title="No tenants found"
              description="No organizations match your current search criteria or filter parameters."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px' }}>Tenant ID</th>
                  <th style={{ padding: '12px 16px' }}>Organization</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Plan</th>
                  <th style={{ padding: '12px 16px' }}>Remaining Days</th>
                  <th style={{ padding: '12px 16px' }}>Metrics</th>
                  <th style={{ padding: '12px 16px' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t, idx) => {
                  const statusVariant = t.status === 'active' ? 'success' : (t.status === 'suspended' ? 'warning' : 'danger');
                  const planName = t.plan_name || t.subscription?.plan_name || (t.subscription_plan ? t.subscription_plan.charAt(0).toUpperCase() + t.subscription_plan.slice(1) : null);
                  const expiresAt = t.subscription_expires_at || t.subscription?.expires_at || null;
                  const subStatus = (t.subscription_status || t.subscription?.status || '').toLowerCase();
                  let remainingDays = null;
                  if (t.remaining_days !== undefined && t.remaining_days !== null) {
                    remainingDays = Number(t.remaining_days);
                  } else if (expiresAt) {
                    const diffMs = new Date(expiresAt).getTime() - Date.now();
                    remainingDays = diffMs > 0 ? Math.ceil(diffMs / 86400000) : 0;
                  } else if (subStatus === 'expired') {
                    remainingDays = 0;
                  }

                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        fontSize: '13.5px',
                        color: '#334155',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                        #{t.id}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{t.email || t.phone || 'No direct email'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={statusVariant}>{t.status || 'active'}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={planName ? 'primary' : 'neutral'}>
                          {planName || 'No Plan'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px' }}>
                        {remainingDays === null ? (
                          <span style={{ color: '#94a3b8' }}>No active plan</span>
                        ) : remainingDays <= 0 ? (
                          <Badge variant="danger">Expired (0 days)</Badge>
                        ) : (
                          <div>
                            <Badge variant={remainingDays <= 7 ? 'warning' : 'success'}>
                              {remainingDays} {remainingDays === 1 ? 'day' : 'days'} left
                            </Badge>
                            {expiresAt && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                Exp: {new Date(expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#475569' }}>
                        <span>{t.users_count ?? 0} users</span> • <span>{t.products_count ?? 0} products</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button variant="secondary" size="sm" onClick={() => handleViewDetails(t.id)}>
                            Inspect
                          </Button>
                          {canManage && (
                            <Button
                              variant={t.status === 'suspended' ? 'success' : 'danger'}
                              size="sm"
                              onClick={() => handleOpenStatusModal(t)}
                            >
                              {t.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.total > pagination.per_page && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
            <span>
              Showing Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total tenants)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ‹ Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.last_page}
                onClick={() => setPage(p => p + 1)}
              >
                Next ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTenant(null)}
          title={`Tenant Profile: ${selectedTenant.name || 'Loading...'}`}
          size="lg"
        >
          {detailsLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              Loading detailed tenant metadata...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{selectedTenant.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Tenant ID #{selectedTenant.id} • Registered {new Date(selectedTenant.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant={selectedTenant.status === 'active' ? 'success' : 'warning'}>
                    {selectedTenant.status}
                  </Badge>
                  {canManage && (
                    <Button variant="secondary" size="sm" onClick={() => handleOpenStatusModal(selectedTenant)}>
                      Change Status
                    </Button>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Users</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTenant.metrics?.users_count ?? 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Products</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTenant.metrics?.products_count ?? 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Sales</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTenant.metrics?.sales_count ?? 0}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Purchases</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTenant.metrics?.purchases_count ?? 0}
                  </div>
                </div>
              </div>

              {/* Module Entitlements */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Enabled Module Entitlements
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(selectedTenant.enabled_modules || {}).map(([mod, enabled]) => (
                    <Badge key={mod} variant={enabled ? 'success' : 'neutral'}>
                      {enabled ? '✓' : '✗'} {mod}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subscription Summary */}
              <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>
                  Current Subscription
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                  <div>Plan: <strong>{selectedTenant.plan_name || selectedTenant.subscription?.plan_name || 'No Plan'}</strong></div>
                  <div>
                    Status:{' '}
                    <Badge variant={(selectedTenant.subscription_status || selectedTenant.subscription?.status) === 'active' ? 'success' : 'warning'}>
                      {selectedTenant.subscription_status || selectedTenant.subscription?.status || 'inactive'}
                    </Badge>
                  </div>
                  <div>
                    Remaining Days:{' '}
                    <strong>
                      {selectedTenant.remaining_days !== undefined && selectedTenant.remaining_days !== null
                        ? (selectedTenant.remaining_days <= 0 ? 'Expired (0 days)' : `${selectedTenant.remaining_days} days left`)
                        : 'No active plan'}
                    </strong>
                  </div>
                  <div>Cycle: <strong>{selectedTenant.subscription?.billing_cycle || 'monthly'}</strong></div>
                  <div>Expires: <strong>{(selectedTenant.subscription_expires_at || selectedTenant.subscription?.expires_at) ? new Date(selectedTenant.subscription_expires_at || selectedTenant.subscription?.expires_at).toLocaleDateString() : 'N/A'}</strong></div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Change Status Modal */}
      {statusModalTenant && (
        <Modal
          isOpen={true}
          onClose={() => setStatusModalTenant(null)}
          title={`Update Status: ${statusModalTenant.name}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {statusError && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
                {statusError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Operational Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="active">Active (Full system access)</option>
                <option value="suspended">Suspended (Access blocked by gateway)</option>
                <option value="cancelled">Cancelled (Terminated organization)</option>
              </select>
            </div>

            {newStatus === 'suspended' && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e', fontSize: '12.5px' }}>
                ⚠️ <strong>Administrative Notice:</strong> Suspending a tenant denies all non-developer tenant users from accessing the system via EnsureTenantMiddleware.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Reason for change (Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="State the administrative reason (e.g. Non-payment, violation of terms, customer request)..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="secondary" size="md" onClick={() => setStatusModalTenant(null)} disabled={statusUpdating}>
                Cancel
              </Button>
              <Button
                variant={newStatus === 'suspended' ? 'danger' : 'primary'}
                size="md"
                onClick={handleSaveStatus}
                loading={statusUpdating}
              >
                Confirm Status Change
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
