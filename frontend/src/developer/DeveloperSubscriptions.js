import React, { useState, useEffect, useCallback } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import developerApi from './developerApi';
import { can, PERMISSIONS } from './developerPermissions';

const PLAN_PREVIEWS = {
  Trial: {
    max_users: 5,
    max_products: 500,
    price: '0.00 UGX',
    modules: 'All Modules (Trial period)',
  },
  Starter: {
    max_users: 3,
    max_products: 250,
    price: '50,000 UGX / mo',
    modules: 'POS, Products, Categories, Suppliers, Customers, Sales, Invoices, Reports (Purchases, Stock Movements & AI disabled)',
  },
  Business: {
    max_users: 10,
    max_products: 10000,
    price: '2,000 UGX / mo',
    modules: 'Full Inventory, POS, Sales, Purchases & AI Assistant enabled',
  },
  Professional: {
    max_users: 10,
    max_products: 2500,
    price: '120,000 UGX / mo',
    modules: 'Full Inventory & Sales Suite (AI Assistant disabled)',
  },
  Enterprise: {
    max_users: 100,
    max_products: 50000,
    price: '300,000 UGX / mo',
    modules: 'Unrestricted Access (All Modules + AI Assistant enabled)',
  },
};

export default function DeveloperSubscriptions({ user, token, onNotify }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, last_page: 1, per_page: 25 });

  // Filters
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [inspectSub, setInspectSub] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Extend Trial State
  const [extendSub, setExtendSub] = useState(null);
  const [extendDays, setExtendDays] = useState(14);
  const [extendReason, setExtendReason] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState(null);

  // Change Plan State
  const [planSub, setPlanSub] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('Professional');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [planReason, setPlanReason] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await developerApi.getSubscriptions(token, {
        plan: planFilter,
        status: statusFilter,
        search,
        page,
        per_page: 25,
      });

      if (res.success) {
        setSubscriptions(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        onNotify(res.message || 'Failed to fetch subscriptions.', 'error');
      }
    } catch (err) {
      onNotify(err.message || 'Error communicating with subscriptions API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, planFilter, statusFilter, search, page, onNotify]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleInspect = async (sub) => {
    try {
      setHistoryLoading(true);
      setInspectSub(sub);
      const res = await developerApi.getSubscription(token, sub.id);
      if (res.success && res.data) {
        setInspectSub(res.data);
      }
    } catch {
      // Keep basic sub on error
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenExtend = (sub) => {
    setExtendSub(sub);
    setExtendDays(14);
    setExtendReason('');
    setExtendError(null);
  };

  const handleSubmitExtend = async () => {
    if (!extendSub) return;
    try {
      setExtendLoading(true);
      setExtendError(null);
      const res = await developerApi.extendTrial(token, extendSub.tenant_id, extendDays, extendReason || null);
      if (res.success) {
        onNotify(`Trial successfully extended by ${extendDays} days.`, 'success');
        setExtendSub(null);
        fetchSubscriptions();
      } else {
        setExtendError(res.message || 'Failed to extend trial.');
      }
    } catch (err) {
      setExtendError(err.message || 'Trial extension failed.');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleOpenPlanChange = (sub) => {
    setPlanSub(sub);
    setSelectedPlan(sub.plan_name || 'Professional');
    setBillingCycle(sub.billing_cycle || 'monthly');
    setIsComplimentary(!!sub.is_complimentary);
    setPlanReason('');
    setPlanError(null);
  };

  const handleSubmitPlanChange = async () => {
    if (!planSub) return;
    try {
      setPlanLoading(true);
      setPlanError(null);
      const res = await developerApi.changePlan(token, planSub.tenant_id, {
        plan_name: selectedPlan,
        billing_cycle: billingCycle,
        is_complimentary: isComplimentary,
        reason: planReason || null,
      });

      if (res.success) {
        onNotify(`Subscription plan changed to ${selectedPlan}.`, 'success');
        setPlanSub(null);
        fetchSubscriptions();
      } else {
        setPlanError(res.message || 'Failed to update plan.');
      }
    } catch (err) {
      setPlanError(err.message || 'Plan change failed.');
    } finally {
      setPlanLoading(false);
    }
  };

  const canManage = can(user, PERMISSIONS.SUBSCRIPTIONS_MANAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Subscription & License Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Oversee tenant billing cycles, quotas, trial extensions, and module entitlement synchronizations.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchSubscriptions} loading={loading}>
          ↻ Refresh Subscriptions
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
            placeholder="Search by tenant name or notes..."
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

        {/* Plan Filter */}
        <div style={{ width: '160px' }}>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Plans</option>
            <option value="Trial">Trial</option>
            <option value="Starter">Starter</option>
            <option value="Business">Business</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: '160px' }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="expired">Expired</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {(search || planFilter || statusFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPlanFilter(''); setStatusFilter(''); setPage(1); }}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading subscription directory...
          </div>
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              title="No subscriptions found"
              description="No subscription records match your current criteria."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px' }}>Tenant</th>
                  <th style={{ padding: '12px 16px' }}>Plan</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Quotas</th>
                  <th style={{ padding: '12px 16px' }}>Billing Cycle</th>
                  <th style={{ padding: '12px 16px' }}>Expiration</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, idx) => {
                  const displayStatus = sub.effective_status || sub.status;
                  const statusVariant =
                    displayStatus === 'active'
                      ? 'success'
                      : displayStatus === 'trialing'
                      ? 'primary'
                      : displayStatus === 'expired'
                      ? 'danger'
                      : 'warning';
                  const remainingDays =
                    sub.remaining_days !== undefined && sub.remaining_days !== null
                      ? Number(sub.remaining_days)
                      : sub.expires_at
                      ? Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000))
                      : null;
                  const isExpiringSoon = remainingDays !== null && remainingDays <= 7;

                  return (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        fontSize: '13.5px',
                        color: '#334155',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{sub.tenant?.name || `Tenant #${sub.tenant_id}`}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{sub.tenant?.email || `ID: ${sub.tenant_id}`}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant="primary">{sub.plan_name}</Badge>
                        {sub.is_complimentary && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>[Complimentary]</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={statusVariant}>{displayStatus}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#475569' }}>
                        <span>{sub.max_users} users</span> • <span>{sub.max_products?.toLocaleString()} products</span>
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize', fontSize: '13px' }}>
                        <div>{sub.billing_cycle || 'monthly'}</div>
                        {Number(sub.price || 0) > 0 && (
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {Number(sub.price).toLocaleString()} {sub.currency || 'UGX'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', color: isExpiringSoon ? '#b91c1c' : '#475569' }}>
                        <div>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'Lifetime'}</div>
                        {remainingDays !== null && (
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: remainingDays === 0 ? '#dc2626' : (isExpiringSoon ? '#d97706' : '#16a34a') }}>
                            {remainingDays === 0 ? 'Expired' : `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} left`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button variant="secondary" size="sm" onClick={() => handleInspect(sub)}>
                            History
                          </Button>
                          {canManage && (
                            <>
                              <Button variant="secondary" size="sm" onClick={() => handleOpenExtend(sub)}>
                                + Extend
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleOpenPlanChange(sub)}>
                                Change Plan
                              </Button>
                            </>
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
              Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} subscriptions)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ‹ Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pagination.last_page} onClick={() => setPage(p => p + 1)}>
                Next ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect & History Modal */}
      {inspectSub && (
        <Modal
          isOpen={true}
          onClose={() => setInspectSub(null)}
          title={`Subscription Details & Audit: ${inspectSub.tenant?.name || `Tenant #${inspectSub.tenant_id}`}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Plan</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{inspectSub.plan_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                <div><Badge variant={inspectSub.status === 'active' ? 'success' : 'warning'}>{inspectSub.status}</Badge></div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Users Quota</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{inspectSub.max_users}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Expires</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {inspectSub.expires_at ? new Date(inspectSub.expires_at).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Subscription Mutation History
              </h3>
              {historyLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
              ) : !inspectSub.history || inspectSub.history.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No historical mutations recorded for this subscription.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {inspectSub.history.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9',
                        backgroundColor: '#ffffff',
                        fontSize: '12.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Badge variant="primary">{item.event_type}</Badge>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {item.from_plan && item.to_plan ? `${item.from_plan} → ${item.to_plan}` : item.to_plan}
                          </span>
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#475569' }}>
                        {item.reason || 'System scheduled event'}
                      </div>
                      {item.actor && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Action executed by: <strong>{item.actor.name}</strong> ({item.actor.email})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Extend Trial Modal */}
      {extendSub && (
        <Modal
          isOpen={true}
          onClose={() => setExtendSub(null)}
          title={`Extend Trial Period: ${extendSub.tenant?.name || `Tenant #${extendSub.tenant_id}`}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {extendError && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
                {extendError}
              </div>
            )}

            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                Current Expiration Date: <strong>{extendSub.expires_at ? new Date(extendSub.expires_at).toLocaleDateString() : 'N/A'}</strong>
              </div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Days to Extend (1 to 365)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[7, 14, 30].map(d => (
                  <Button
                    key={d}
                    variant={extendDays === d ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setExtendDays(d)}
                  >
                    +{d} Days
                  </Button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Administrative Reason
              </label>
              <textarea
                rows={2}
                placeholder="Reason for extension (e.g. Sales onboarding assistance, customer request)..."
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setExtendSub(null)} disabled={extendLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitExtend} loading={extendLoading}>
                Extend Trial
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Plan Modal */}
      {planSub && (
        <Modal
          isOpen={true}
          onClose={() => setPlanSub(null)}
          title={`Change Plan: ${planSub.tenant?.name || `Tenant #${planSub.tenant_id}`}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {planError && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
                {planError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Select Tier
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.keys(PLAN_PREVIEWS).map(pName => (
                  <div
                    key={pName}
                    onClick={() => setSelectedPlan(pName)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${selectedPlan === pName ? '#4f46e5' : '#e2e8f0'}`,
                      backgroundColor: selectedPlan === pName ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: selectedPlan === pName ? '#4338ca' : '#0f172a' }}>
                      {pName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {PLAN_PREVIEWS[pName].price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Preview & Entitlement Details */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Target Entitlements: {selectedPlan}
              </div>
              <div style={{ color: '#475569' }}>
                • Max Users: <strong>{PLAN_PREVIEWS[selectedPlan]?.max_users}</strong><br />
                • Max Products: <strong>{PLAN_PREVIEWS[selectedPlan]?.max_products?.toLocaleString()}</strong><br />
                • Module Policy: {PLAN_PREVIEWS[selectedPlan]?.modules}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={isComplimentary}
                    onChange={(e) => setIsComplimentary(e.target.checked)}
                  />
                  <span>Complimentary (100% discount)</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Reason for Plan Change (Audit Log)
              </label>
              <textarea
                rows={2}
                placeholder="Reason for change..."
                value={planReason}
                onChange={(e) => setPlanReason(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setPlanSub(null)} disabled={planLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitPlanChange} loading={planLoading}>
                Confirm Plan Change
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
