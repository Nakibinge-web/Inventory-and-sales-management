import React, { useState, useEffect, useCallback } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import developerApi from './developerApi';

export default function DeveloperTelemetry({ user, token, onNotify }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, last_page: 1, per_page: 25 });

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [slowOnly, setSlowOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await developerApi.getRequests(token, {
        search,
        method: methodFilter,
        status: statusFilter,
        slow_only: slowOnly ? 1 : 0,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        per_page: 25,
      });

      if (res.success) {
        setRequests(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        onNotify(res.message || 'Failed to fetch telemetry logs.', 'error');
      }
    } catch (err) {
      onNotify(err.message || 'Error communicating with telemetry API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, search, methodFilter, statusFilter, slowOnly, dateFrom, dateTo, page, onNotify]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleInspect = async (id) => {
    try {
      setDetailLoading(true);
      setSelectedReq({ id, loading: true });
      const res = await developerApi.getRequest(token, id);
      if (res.success && res.data) {
        setSelectedReq(res.data);
      }
    } catch {
      // Keep placeholder on error
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMethodBadge = (m) => {
    switch (m?.toUpperCase()) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT':
      case 'PATCH': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'neutral';
    if (code >= 400 && code < 500) return 'warning';
    return 'danger';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            HTTP Request Telemetry
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Real-time API observability, latency monitoring, and sanitized error tracking.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchRequests} loading={loading}>
          ↻ Refresh Logs
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
        <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
          <input
            type="text"
            placeholder="Search endpoint, correlation ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Method Filter */}
        <div style={{ width: '120px' }}>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: '130px' }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff' }}
          >
            <option value="">All Statuses</option>
            <option value="2xx">2xx Success</option>
            <option value="3xx">3xx Redirect</option>
            <option value="4xx">4xx Client Error</option>
            <option value="5xx">5xx Server Error</option>
            <option value="error">Errors (≥400)</option>
          </select>
        </div>

        {/* Slow Requests Toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={slowOnly}
            onChange={(e) => { setSlowOnly(e.target.checked); setPage(1); }}
          />
          <span>Slow Requests Only (≥500ms)</span>
        </label>

        {(search || methodFilter || statusFilter || slowOnly || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setMethodFilter(''); setStatusFilter(''); setSlowOnly(false); setDateFrom(''); setDateTo(''); setPage(1); }}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Telemetry Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Fetching telemetry stream...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '30px' }}>
            <EmptyState
              title="No telemetry records found"
              description="No HTTP request logs match the selected filter parameters."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Method</th>
                  <th style={{ padding: '12px 16px' }}>Endpoint</th>
                  <th style={{ padding: '12px 16px' }}>Latency</th>
                  <th style={{ padding: '12px 16px' }}>Tenant</th>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, idx) => {
                  const isSlow = r.duration_ms >= 500;
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        fontSize: '13px',
                        color: '#334155',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={getStatusBadge(r.status_code)}>{r.status_code}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={getMethodBadge(r.method)}>{r.method}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: '12.5px', color: '#0f172a' }}>
                        {r.endpoint}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: isSlow ? '#b45309' : '#16a34a' }}>
                        {r.duration_ms} ms
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {r.tenant?.name || (r.tenant_id ? `Tenant #${r.tenant_id}` : 'Platform / Public')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button variant="secondary" size="sm" onClick={() => handleInspect(r.id)}>
                          Inspect
                        </Button>
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
              Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total logs)
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

      {/* Request Inspection Modal */}
      {selectedReq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReq(null)}
          title={`HTTP Telemetry: ${selectedReq.method} ${selectedReq.endpoint}`}
          size="lg"
        >
          {detailLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading request metadata...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Badge variant={getStatusBadge(selectedReq.status_code)} size="lg">{selectedReq.status_code}</Badge>
                  <Badge variant={getMethodBadge(selectedReq.method)} size="lg">{selectedReq.method}</Badge>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#0f172a' }}>{selectedReq.endpoint}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: selectedReq.duration_ms >= 500 ? '#b45309' : '#16a34a' }}>
                  {selectedReq.duration_ms} ms
                </div>
              </div>

              {/* Correlation ID with Copy Button */}
              {selectedReq.correlation_id && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600, marginRight: '8px' }}>Correlation ID:</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", color: '#0f172a' }}>{selectedReq.correlation_id}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => copyToClipboard(selectedReq.correlation_id)}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </Button>
                </div>
              )}

              {/* Error Details (if applicable) */}
              {selectedReq.status_code >= 400 && (
                <div style={{ padding: '14px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '4px', fontSize: '13px' }}>
                    {selectedReq.error_type || 'Captured Client / Server Error'}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#7f1d1d' }}>
                    {selectedReq.error_message || 'No additional error body returned.'}
                  </pre>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#b91c1c' }}>
                    * Sensitive headers, tokens, and credentials are automatically redacted prior to storage.
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>IP Address</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedReq.ip_address || '127.0.0.1'}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Route Name</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedReq.route_name || 'N/A'}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Tenant</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedReq.tenant?.name || 'Platform API'}</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>User Agent</div>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', wordBreak: 'break-word' }}>{selectedReq.user_agent || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
