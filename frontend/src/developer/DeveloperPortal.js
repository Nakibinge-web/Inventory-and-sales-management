import React, { useState } from 'react';
import Button from '../components/ui/Button';
import DeveloperDashboard from './DeveloperDashboard';
import DeveloperTenants from './DeveloperTenants';
import DeveloperSubscriptions from './DeveloperSubscriptions';
import DeveloperTelemetry from './DeveloperTelemetry';
import DeveloperActivity from './DeveloperActivity';
import { can, PERMISSIONS } from './developerPermissions';

export default function DeveloperPortal({ user, token, onLogout, onSwitchToApp }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Toast notification helper
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: '📊',
      permission: null, // base portal access
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: '🏢',
      permission: PERMISSIONS.TENANTS_VIEW,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: '💳',
      permission: PERMISSIONS.SUBSCRIPTIONS_VIEW,
    },
    {
      id: 'telemetry',
      label: 'API Telemetry',
      icon: '📡',
      permission: PERMISSIONS.TELEMETRY_VIEW,
    },
    {
      id: 'activity',
      label: 'Audit Trail',
      icon: '🛡️',
      permission: PERMISSIONS.ACTIVITY_VIEW,
    },
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.permission || can(user, item.permission)
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Toast Notification Container */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => (
          <div
            key={n.id}
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              backgroundColor: n.type === 'error' ? '#fef2f2' : (n.type === 'success' ? '#f0fdf4' : '#ffffff'),
              border: `1px solid ${n.type === 'error' ? '#fecaca' : (n.type === 'success' ? '#bbf7d0' : '#e2e8f0')}`,
              color: n.type === 'error' ? '#991b1b' : (n.type === 'success' ? '#166534' : '#0f172a'),
              fontSize: '13.5px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '260px',
            }}
          >
            <span>{n.type === 'error' ? '⚠️' : (n.type === 'success' ? '✓' : 'ℹ️')}</span>
            <span>{n.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid #1e293b',
          zIndex: 100,
        }}
        className={`dev-sidebar ${mobileMenuOpen ? 'dev-sidebar-mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
              ISMS Developer
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Platform Ops Console
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & App Switching Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#0b1120' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#3730a3',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                Platform Developer
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {onSwitchToApp && (
              <button
                onClick={onSwitchToApp}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ← Return to Business App
              </button>
            )}

            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#ef4444',
                border: '1px solid transparent',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="dev-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', marginRight: '6px' }}
            >
              ☰
            </button>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Developer Portal</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
              {activeTab}
            </span>
          </div>

          {/* Right Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#16a34a', fontWeight: 500 }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              <span>API Gateway Connected</span>
            </div>

            {onSwitchToApp && (
              <Button variant="secondary" size="sm" onClick={onSwitchToApp}>
                Switch to Tenant App
              </Button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <DeveloperDashboard
              user={user}
              token={token}
              onNavigate={setActiveTab}
              onNotify={addNotification}
            />
          )}

          {activeTab === 'tenants' && (
            can(user, PERMISSIONS.TENANTS_VIEW) ? (
              <DeveloperTenants user={user} token={token} onNotify={addNotification} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
                Access denied. You lack permission <code>developer.tenants.view</code>.
              </div>
            )
          )}

          {activeTab === 'subscriptions' && (
            can(user, PERMISSIONS.SUBSCRIPTIONS_VIEW) ? (
              <DeveloperSubscriptions user={user} token={token} onNotify={addNotification} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
                Access denied. You lack permission <code>developer.subscriptions.view</code>.
              </div>
            )
          )}

          {activeTab === 'telemetry' && (
            can(user, PERMISSIONS.TELEMETRY_VIEW) ? (
              <DeveloperTelemetry user={user} token={token} onNotify={addNotification} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
                Access denied. You lack permission <code>developer.telemetry.view</code>.
              </div>
            )
          )}

          {activeTab === 'activity' && (
            can(user, PERMISSIONS.ACTIVITY_VIEW) ? (
              <DeveloperActivity user={user} token={token} onNotify={addNotification} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
                Access denied. You lack permission <code>developer.activity.view</code>.
              </div>
            )
          )}
        </main>
      </div>

      {/* Mobile Drawer CSS */}
      <style>{`
        @media (max-width: 768px) {
          .dev-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .dev-sidebar-mobile-open {
            transform: translateX(0);
          }
          .dev-mobile-toggle {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}
