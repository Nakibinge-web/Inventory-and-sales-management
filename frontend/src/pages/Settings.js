import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const SYSTEM_MODULES = [
  {
    id: 'pos',
    name: 'Point of Sale (POS)',
    icon: '🖥️',
    category: 'Sales & Checkout',
    description: 'Rapid barcode & manual checkout register with instant item lookup, multi-pay methods, and receipt printing.'
  },
  {
    id: 'products',
    name: 'Products & Inventory',
    icon: '📦',
    category: 'Inventory',
    description: 'Item catalog, unit pricing, cost tracking, SKU/barcode lookup, and low-stock alert thresholds.'
  },
  {
    id: 'categories',
    name: 'Product Categories',
    icon: '🏷️',
    category: 'Inventory',
    description: 'Group and classify store merchandise into structured categories for streamlined management and sales.'
  },
  {
    id: 'suppliers',
    name: 'Suppliers Directory',
    icon: '🏭',
    category: 'Procurement',
    description: 'Manage vendor details, company contacts, procurement history, and restock order relationships.'
  },
  {
    id: 'customers',
    name: 'Customer CRM',
    icon: '👥',
    category: 'Sales & Customers',
    description: 'Customer contact directory, purchase tracking, outstanding account credit balances, and transaction logs.'
  },
  {
    id: 'sales',
    name: 'Sales Logs & History',
    icon: '💰',
    category: 'Sales & Customers',
    description: 'Comprehensive historical audit of all sales, payments received, cashier stamps, and order breakdown.'
  },
  {
    id: 'invoices',
    name: 'Invoices & Billing',
    icon: '📄',
    category: 'Finance & Invoicing',
    description: 'Generate proforma and official tax invoices with digital signature embeds, PDF export, and remittance info.'
  },
  {
    id: 'purchases',
    name: 'Purchases & Restocking',
    icon: '🛒',
    category: 'Procurement',
    description: 'Record incoming supplier shipments and purchases with automated stock level and cost rebalancing.'
  },
  {
    id: 'stock-movements',
    name: 'Stock Movements & Audits',
    icon: '🔄',
    category: 'Inventory Auditing',
    description: 'Track manual stock adjustments, transfers, restocks, damage write-offs, and shrinkage reasons.'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: '📈',
    category: 'Business Intelligence',
    description: 'Revenue trends, profit & loss analysis, sales by category, top products, and inventory valuation.'
  },
  {
    id: 'ai',
    name: 'AI Business Assistant',
    icon: '🤖',
    category: 'Smart Intelligence',
    description: 'Intelligent AI copilot for immediate operational answers, sales trend analysis, and inventory recommendations.'
  },
];

export default function Settings({
  user,
  token,
  toast,
  onBusinessInfoUpdate,
  initialTab = 'branding',
  onTabChange,
  isOwner = true
}) {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    contacts: [],
    address: '',
    tagline: '',
    tin: '',
    website: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    mobile_money_number: '',
    mobile_money_name: '',
    payment_terms: '',
    invoice_notes: '',
    logo_url: '',
    logo_path: '',
    signature_url: '',
    signature_path: '',
    enabled_modules: {},
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'branding'); // 'branding' | 'contacts' | 'invoicing' | 'modules'
  const [sigMode, setSigMode] = useState('upload'); // 'upload' | 'draw'
  const [togglingModules, setTogglingModules] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contacts: [],
    address: '',
    tagline: '',
    tin: '',
    website: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    mobile_money_number: '',
    mobile_money_name: '',
    payment_terms: '',
    invoice_notes: '',
    logo_url: '',
    logo: null,
    remove_logo: false,
    signature_url: '',
    signature: null,
    remove_signature: false,
    enabled_modules: {},
  });

  // Keep active tab in sync if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Canvas ref for signature pad
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    fetchBusinessInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/settings/business?tenant_id=${user.tenant_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        const data = {
          ...result.data,
          contacts: Array.isArray(result.data.contacts) ? result.data.contacts : [],
          tagline: result.data.tagline || '',
          tin: result.data.tin || '',
          website: result.data.website || '',
          bank_name: result.data.bank_name || '',
          account_name: result.data.account_name || '',
          account_number: result.data.account_number || '',
          mobile_money_number: result.data.mobile_money_number || '',
          mobile_money_name: result.data.mobile_money_name || '',
          payment_terms: result.data.payment_terms || '',
          invoice_notes: result.data.invoice_notes || '',
          enabled_modules: result.data.enabled_modules || user?.tenant?.enabled_modules || {},
        };
        setBusinessInfo(data);
        setFormData({
          ...data,
          logo: null,
          remove_logo: false,
          signature: null,
          remove_signature: false,
        });
      } else {
        toast.error('Failed to load', result.message || 'Failed to load business information');
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
      toast.error('Error loading', 'Error loading business information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ── LOGO UPLOAD & REMOVE ──
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please select a logo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        logo: reader.result,
        logo_url: reader.result,
        remove_logo: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
      logo_url: '',
      remove_logo: true
    }));
  };

  // ── SIGNATURE UPLOAD, DRAW & REMOVE ──
  const handleSignatureFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Please select a signature image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        signature: reader.result,
        signature_url: reader.result,
        remove_signature: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({
      ...prev,
      signature: null,
      signature_url: '',
      remove_signature: true
    }));
    clearCanvas();
  };

  // Canvas drawing functions
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    isDrawing.current = true;
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
    setHasDrawn(true);
  };

  const stopDrawing = (e) => {
    if (isDrawing.current) {
      isDrawing.current = false;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const applyDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.warning('Empty signature', 'Please draw your signature before applying.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    setFormData(prev => ({
      ...prev,
      signature: dataUrl,
      signature_url: dataUrl,
      remove_signature: false
    }));
    toast.success('Signature applied', 'Your drawn signature has been captured.');
  };

  // ── MULTI-CONTACT HELPERS ──
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { type: 'mobile', number: '' }]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  // ── MODULE MANAGEMENT TOGGLES ──
  const isModuleActive = (modId) => {
    const modules = businessInfo.enabled_modules || {};
    return modules[modId] !== false; // defaults to true
  };

  const handleToggleModule = async (modId) => {
    const currentlyActive = isModuleActive(modId);
    const nextStatus = !currentlyActive;

    const updatedModules = {
      ...(businessInfo.enabled_modules || {}),
      [modId]: nextStatus
    };

    // Optimistically update local state
    setBusinessInfo(prev => ({
      ...prev,
      enabled_modules: updatedModules
    }));
    setFormData(prev => ({
      ...prev,
      enabled_modules: updatedModules
    }));
    setTogglingModules(prev => ({ ...prev, [modId]: true }));

    try {
      const response = await fetch(`${API}/settings/modules?tenant_id=${user.tenant_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ enabled_modules: updatedModules })
      });

      const result = await response.json();

      if (result.success) {
        // Sync global user state
        if (onBusinessInfoUpdate) {
          onBusinessInfoUpdate(prevUser => {
            const updatedUser = {
              ...prevUser,
              tenant: {
                ...prevUser.tenant,
                enabled_modules: updatedModules
              }
            };
            try {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {}
            return updatedUser;
          });
        }

        const modName = SYSTEM_MODULES.find(m => m.id === modId)?.name || modId;
        if (nextStatus) {
          toast.success('Module enabled', `${modName} is now active in your workspace.`);
        } else {
          toast.info('Module disabled', `${modName} was hidden from navigation.`);
        }
      } else {
        // Revert on error
        setBusinessInfo(prev => ({
          ...prev,
          enabled_modules: {
            ...(prev.enabled_modules || {}),
            [modId]: currentlyActive
          }
        }));
        toast.error('Update failed', result.message || 'Failed to update module state');
      }
    } catch (err) {
      console.error('Error toggling module:', err);
      setBusinessInfo(prev => ({
        ...prev,
        enabled_modules: {
          ...(prev.enabled_modules || {}),
          [modId]: currentlyActive
        }
      }));
      toast.error('Connection error', 'Could not save module setting.');
    } finally {
      setTogglingModules(prev => ({ ...prev, [modId]: false }));
    }
  };

  const handleEnableAllModules = async () => {
    const allEnabled = {};
    SYSTEM_MODULES.forEach(m => { allEnabled[m.id] = true; });

    setBusinessInfo(prev => ({ ...prev, enabled_modules: allEnabled }));
    setFormData(prev => ({ ...prev, enabled_modules: allEnabled }));

    try {
      const response = await fetch(`${API}/settings/modules?tenant_id=${user.tenant_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ enabled_modules: allEnabled })
      });

      const result = await response.json();
      if (result.success && onBusinessInfoUpdate) {
        onBusinessInfoUpdate(prevUser => {
          const updatedUser = {
            ...prevUser,
            tenant: {
              ...prevUser.tenant,
              enabled_modules: allEnabled
            }
          };
          try {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (e) {}
          return updatedUser;
        });
        toast.success('All modules enabled', 'All system operational modules are now active.');
      }
    } catch (e) {
      toast.error('Error', 'Failed to enable all modules');
    }
  };

  // ── SUBMIT FORM ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        contacts: formData.contacts,
        address: formData.address,
        tagline: formData.tagline,
        tin: formData.tin,
        website: formData.website,
        bank_name: formData.bank_name,
        account_name: formData.account_name,
        account_number: formData.account_number,
        mobile_money_number: formData.mobile_money_number,
        mobile_money_name: formData.mobile_money_name,
        payment_terms: formData.payment_terms,
        invoice_notes: formData.invoice_notes,
      };

      if (formData.logo) {
        payload.logo = formData.logo;
      }
      if (formData.remove_logo) {
        payload.remove_logo = true;
      }

      if (formData.signature) {
        payload.signature = formData.signature;
      }
      if (formData.remove_signature) {
        payload.remove_signature = true;
      }

      const response = await fetch(`${API}/settings/business?tenant_id=${user.tenant_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        const data = {
          ...result.data,
          contacts: Array.isArray(result.data.contacts) ? result.data.contacts : [],
          enabled_modules: result.data.enabled_modules || businessInfo.enabled_modules
        };
        setBusinessInfo(data);
        setFormData({
          ...data,
          logo: null,
          remove_logo: false,
          signature: null,
          remove_signature: false
        });
        setIsEditing(false);
        
        // Update user state immediately throughout the application
        if (onBusinessInfoUpdate) {
          onBusinessInfoUpdate(prevUser => {
            const updatedUser = {
              ...prevUser,
              tenant: {
                ...prevUser.tenant,
                ...data,
                logo_url: data.logo_url,
                signature_url: data.signature_url,
              }
            };

            try {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (err) {
              console.error('Error updating user in localStorage:', err);
            }

            return updatedUser;
          });
        }

        // Synchronize with invoice settings storage for invoices
        try {
          const invoiceSettings = {
            businessName: data.name,
            tagline: data.tagline,
            address: data.address,
            phone: data.phone,
            email: data.email,
            tin: data.tin,
            bankName: data.bank_name,
            accountName: data.account_name,
            accountNumber: data.account_number,
            mobileMoneyNumber: data.mobile_money_number,
            mobileMoneyName: data.mobile_money_name,
            paymentTerms: data.payment_terms,
            notes: data.invoice_notes,
            logoUrl: data.logo_url || '',
            signatureUrl: data.signature_url || '',
          };
          localStorage.setItem('zziwa_invoice_settings', JSON.stringify(invoiceSettings));
          if (data.id) {
            localStorage.setItem(`invoice_settings_${data.id}`, JSON.stringify(invoiceSettings));
          }
        } catch (e) {
          console.error('Error synchronizing invoice settings storage:', e);
        }
        
        toast.success('Settings updated', 'Business profile, branding & remittance saved successfully');
      } else {
        toast.error('Update failed', result.message || 'Failed to update business information');
      }
    } catch (error) {
      console.error('Error updating business info:', error);
      toast.error('Update failed', 'An error occurred while updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ...businessInfo,
      logo: null,
      remove_logo: false,
      signature: null,
      remove_signature: false,
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ marginTop: 14, color: '#64748b', fontSize: 14, fontWeight: 500 }}>
            Loading business settings...
          </p>
        </div>
      </div>
    );
  }

  const activeModulesCount = SYSTEM_MODULES.filter(m => isModuleActive(m.id)).length;

  return (
    <div style={styles.container}>
      {/* ── TOP HEADER ── */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={styles.title}>Business Settings</h1>
            <span style={styles.headerBadge}>Workspace Configuration</span>
            {isOwner && (
              <span style={styles.ownerBadge}>Owner Controls</span>
            )}
          </div>
          <p style={styles.subtitle}>
            Manage your company identity, branding logo, digital signature, and active business modules.
          </p>
        </div>
        {activeTab !== 'modules' && (
          !isEditing ? (
            <Button variant="primary" onClick={() => setIsEditing(true)} icon="✏️">
              Edit Information
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={saving} icon="💾">
                Save Changes
              </Button>
            </div>
          )
        )}
      </div>

      {/* ── UNIVERSAL SECTION NAVIGATION TAB BAR ── */}
      <div style={styles.tabBar}>
        <button
          type="button"
          onClick={() => handleTabClick('branding')}
          style={activeTab === 'branding' ? styles.tabButtonActive : styles.tabButton}
        >
          🏢 Business Profile &amp; Branding
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('contacts')}
          style={activeTab === 'contacts' ? styles.tabButtonActive : styles.tabButton}
        >
          📞 Contacts &amp; Location
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('invoicing')}
          style={activeTab === 'invoicing' ? styles.tabButtonActive : styles.tabButton}
        >
          💳 Invoicing, Tax &amp; Remittance
        </button>
        {isOwner && (
          <button
            type="button"
            onClick={() => handleTabClick('modules')}
            style={activeTab === 'modules' ? styles.tabButtonActiveModules : styles.tabButtonModules}
          >
            🧩 Module Management ({activeModulesCount}/{SYSTEM_MODULES.length})
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════
          TAB: MODULE MANAGEMENT (OWNER ONLY)
         ══════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Action Banner */}
          <div style={styles.modulesHeaderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    Feature Module Management
                  </h2>
                  <span style={styles.badgeSuccess}>
                    {activeModulesCount} of {SYSTEM_MODULES.length} Active
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Toggle modules on or off based on your store's workflow. Changes reflect immediately across navigation.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEnableAllModules}
                  icon="✅"
                >
                  Enable All Modules
                </Button>
              </div>
            </div>
          </div>

          {/* Module Grid */}
          <div style={styles.moduleGrid}>
            {SYSTEM_MODULES.map(mod => {
              const active = isModuleActive(mod.id);
              const isToggling = togglingModules[mod.id];

              return (
                <div
                  key={mod.id}
                  style={{
                    ...styles.moduleCard,
                    borderColor: active ? '#cbd5e1' : '#e2e8f0',
                    backgroundColor: active ? '#ffffff' : '#f8fafc',
                    boxShadow: active ? '0 2px 4px rgba(0,0,0,0.03)' : 'none',
                    opacity: isToggling ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          ...styles.moduleIconBox,
                          backgroundColor: active ? '#eff6ff' : '#f1f5f9',
                          borderColor: active ? '#bfdbfe' : '#e2e8f0'
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{mod.icon}</span>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: active ? '#0f172a' : '#64748b' }}>
                          {mod.name}
                        </h3>
                        <span style={styles.moduleCategoryTag}>{mod.category}</span>
                      </div>
                    </div>

                    {/* iOS / Figma Smooth Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleModule(mod.id)}
                      disabled={isToggling}
                      title={active ? 'Click to disable module' : 'Click to enable module'}
                      style={{
                        width: '46px',
                        height: '26px',
                        borderRadius: '14px',
                        backgroundColor: active ? '#10b981' : '#cbd5e1',
                        border: 'none',
                        cursor: isToggling ? 'wait' : 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                        padding: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        outline: 'none',
                        boxShadow: active ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none',
                        flexShrink: 0,
                      }}
                      aria-label={`Toggle ${mod.name}`}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          transform: active ? 'translateX(20px)' : 'translateX(0px)',
                          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: active ? '#475569' : '#94a3b8', lineHeight: 1.5 }}>
                    {mod.description}
                  </p>

                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#059669' : '#64748b' }}>
                      {active ? '● Active in Workspace' : '○ Hidden from Menu'}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {active ? 'Visible to authorized users' : 'Disabled for all users'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core System Guardrail Box */}
          <div style={styles.coreSystemBox}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  Essential Core System Modules (Always Active)
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                  <strong>Overview / Home (📊)</strong>, <strong>User &amp; Role Management (🔑)</strong>, and <strong>Business Settings (⚙️)</strong> remain permanently enabled to guarantee continuous administrative control and business continuity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TABS 1-3: EDIT MODE OR VIEW MODE
         ══════════════════════════════════════════ */}
      {activeTab !== 'modules' && (
        isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleSubmit}>
            {/* TAB 1: BRANDING & DIGITAL SIGNATURE */}
            {activeTab === 'branding' && (
              <div style={styles.sectionCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>🏢 Business Identity &amp; Digital Assets</h2>
                  <p style={styles.cardSubtitle}>
                    Set your official business name, corporate logo, and digital signature for invoices and receipts.
                  </p>
                </div>
                <div style={styles.cardBody}>
                  {/* Business Name & Tagline */}
                  <div style={styles.grid2}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="name">
                        Business Name <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        placeholder="e.g. Zziwa & Sons Gadgets"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="tagline">
                        Tagline / Slogan
                      </label>
                      <input
                        type="text"
                        id="tagline"
                        name="tagline"
                        value={formData.tagline}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="e.g. Quality & Reliability Guaranteed"
                      />
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* ── LOGO UPLOADER ── */}
                  <div style={styles.assetBlock}>
                    <div>
                      <label style={styles.label}>Company Logo</label>
                      <p style={styles.fieldHelp}>
                        Appears on dashboard navigation, invoices, and sales receipts. Transparent PNG recommended.
                      </p>
                    </div>

                    <div style={styles.assetPreviewRow}>
                      <div style={styles.logoPreviewBox}>
                        {formData.logo_url ? (
                          <img
                            src={formData.logo_url}
                            alt="Logo Preview"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={styles.placeholderAsset}>
                            <span style={{ fontSize: 32 }}>🏢</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No logo</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={styles.fileButton}>
                          📁 Choose Logo Image
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleLogoChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {formData.logo_url && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            style={styles.removeAssetBtn}
                          >
                            🗑️ Remove Logo
                          </button>
                        )}
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Supports PNG, JPG, WEBP, SVG &bull; Max 5MB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* ── DIGITAL SIGNATURE ── */}
                  <div style={styles.assetBlock}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={styles.label}>Digital Signature (Authorized Signatory)</label>
                        <span style={styles.badgePrimary}>Invoice Embed</span>
                      </div>
                      <p style={styles.fieldHelp}>
                        This official signature will be automatically embedded onto tax invoices, proformas, and sales receipts.
                      </p>
                    </div>

                    {/* Mode Selector */}
                    <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
                      <button
                        type="button"
                        onClick={() => setSigMode('upload')}
                        style={sigMode === 'upload' ? styles.subTabActive : styles.subTab}
                      >
                        📁 Upload Image File
                      </button>
                      <button
                        type="button"
                        onClick={() => setSigMode('draw')}
                        style={sigMode === 'draw' ? styles.subTabActive : styles.subTab}
                      >
                        ✍️ Draw on Screen
                      </button>
                    </div>

                    {sigMode === 'upload' ? (
                      <div style={styles.sigUploadContainer}>
                        <div style={styles.sigPreviewBox}>
                          {formData.signature_url ? (
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={formData.signature_url}
                                alt="Signature Preview"
                                style={{ maxHeight: 70, maxWidth: 220, objectFit: 'contain' }}
                              />
                              <div style={styles.sigSpecimenLine}></div>
                              <span style={styles.sigSpecimenLabel}>Authorized Signatory</span>
                            </div>
                          ) : (
                            <div style={styles.placeholderAsset}>
                              <span style={{ fontSize: 28 }}>✍️</span>
                              <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                No signature uploaded
                              </span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={styles.fileButton}>
                            📁 Browse Signature File
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleSignatureFileChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {formData.signature_url && (
                            <button
                              type="button"
                              onClick={handleRemoveSignature}
                              style={styles.removeAssetBtn}
                            >
                              🗑️ Remove Signature
                            </button>
                          )}
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Transparent PNG is recommended for seamless printing on white invoice sheets.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Drawing Pad */
                      <div style={styles.canvasContainer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                            Draw using mouse or touchscreen below:
                          </span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={clearCanvas}
                              style={styles.canvasSmallBtn}
                            >
                              🧹 Clear
                            </button>
                            <button
                              type="button"
                              onClick={applyDrawnSignature}
                              style={styles.canvasApplyBtn}
                            >
                              ✓ Apply Signature
                            </button>
                          </div>
                        </div>

                        <div style={styles.canvasWrapper}>
                          <canvas
                            ref={canvasRef}
                            width={440}
                            height={140}
                            style={styles.canvas}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                          <div style={styles.canvasBaseline}></div>
                        </div>

                        {formData.signature_url && (
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                              ✓ Current Signature Specimen:
                            </span>
                            <img
                              src={formData.signature_url}
                              alt="Current"
                              style={{ maxHeight: 36, maxWidth: 140, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 4, padding: 2 }}
                            />
                            <button
                              type="button"
                              onClick={handleRemoveSignature}
                              style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACTS & LOCATION */}
            {activeTab === 'contacts' && (
              <div style={styles.sectionCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>📞 Contact Numbers &amp; Address</h2>
                  <p style={styles.cardSubtitle}>
                    Provide customer support contact lines, official email, and physical shop location.
                  </p>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.grid2}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="email">
                        Official Business Email <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                        placeholder="support@company.com"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="phone">
                        Primary Helpline Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="+256 700 000 000"
                      />
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* Multiple Contacts */}
                  <div style={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <label style={styles.label}>Additional Contact Lines</label>
                        <p style={styles.fieldHelp}>Mobile, WhatsApp, Landline, or Office lines shown on invoices</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm"
                        onClick={addContact}
                        icon="➕"
                      >
                        Add Contact
                      </Button>
                    </div>

                    {formData.contacts && formData.contacts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {formData.contacts.map((contact, index) => (
                          <div key={index} style={styles.contactRow}>
                            <select
                              value={contact.type || 'mobile'}
                              onChange={(e) => updateContact(index, 'type', e.target.value)}
                              style={{ ...styles.input, flex: '0 0 140px' }}
                            >
                              <option value="mobile">📱 Mobile</option>
                              <option value="whatsapp">💬 WhatsApp</option>
                              <option value="office">🏢 Office</option>
                              <option value="landline">☎️ Landline</option>
                              <option value="support">🛠️ Support</option>
                              <option value="other">📌 Other</option>
                            </select>
                            <input
                              type="tel"
                              value={contact.number || ''}
                              onChange={(e) => updateContact(index, 'number', e.target.value)}
                              style={{ ...styles.input, flex: 1 }}
                              placeholder="+256 XXX XXX XXX"
                            />
                            <button
                              type="button"
                              onClick={() => removeContact(index)}
                              style={styles.removeContactBtn}
                              title="Remove number"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.emptyContacts}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          No extra contacts listed. Click "Add Contact" to add WhatsApp or department lines.
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={styles.divider}></div>

                  <div style={styles.grid2}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="address">
                        Physical Shop / Office Address
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        style={styles.textarea}
                        rows="3"
                        placeholder="e.g. Shop 311, Level 3, Kooki Tower, Kampala Uganda"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="website">
                        Business Website / Portal
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="https://www.yourdomain.com"
                      />
                      <p style={styles.fieldHelp}>Optional: Displayed on customer document footers.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVOICING & REMITTANCE */}
            {activeTab === 'invoicing' && (
              <div style={styles.sectionCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>💳 Invoicing, Tax &amp; Remittance Details</h2>
                  <p style={styles.cardSubtitle}>
                    Configure Tax registration (TIN/VAT), bank accounts, and mobile money remittance printed on invoices.
                  </p>
                </div>
                <div style={styles.cardBody}>
                  {/* Tax ID */}
                  <div style={styles.grid2}>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="tin">
                        Tax Identification Number (TIN / VAT Reg)
                      </label>
                      <input
                        type="text"
                        id="tin"
                        name="tin"
                        value={formData.tin || ''}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="e.g. 1002345678"
                      />
                      <p style={styles.fieldHelp}>Printed under company header on official tax invoices.</p>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label} htmlFor="payment_terms">
                        Default Payment Terms
                      </label>
                      <input
                        type="text"
                        id="payment_terms"
                        name="payment_terms"
                        value={formData.payment_terms || ''}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="e.g. Due upon receipt / Net 15 days"
                      />
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* Bank Account Details */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                      🏦 Bank Wire / EFT Remittance
                    </h3>
                    <div style={styles.grid3}>
                      <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="bank_name">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          id="bank_name"
                          name="bank_name"
                          value={formData.bank_name || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="e.g. ABSA Bank / Stanbic Bank"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="account_name">
                          Account Name
                        </label>
                        <input
                          type="text"
                          id="account_name"
                          name="account_name"
                          value={formData.account_name || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="e.g. Zziwa & Sons Limited"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="account_number">
                          Account Number
                        </label>
                        <input
                          type="text"
                          id="account_number"
                          name="account_number"
                          value={formData.account_number || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="e.g. 6008040719"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* Mobile Money Details */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                      📱 Mobile Money Merchant / Pay Remittance
                    </h3>
                    <div style={styles.grid2}>
                      <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="mobile_money_number">
                          Mobile Money Number
                        </label>
                        <input
                          type="text"
                          id="mobile_money_number"
                          name="mobile_money_number"
                          value={formData.mobile_money_number || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="e.g. +256 754 723 743"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="mobile_money_name">
                          Registered Merchant / Recipient Name
                        </label>
                        <input
                          type="text"
                          id="mobile_money_name"
                          name="mobile_money_name"
                          value={formData.mobile_money_name || ''}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="e.g. Zziwa & Sons"
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  {/* Invoice Footer Notes */}
                  <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="invoice_notes">
                      Default Invoice Footer Notes
                    </label>
                    <textarea
                      id="invoice_notes"
                      name="invoice_notes"
                      value={formData.invoice_notes || ''}
                      onChange={handleInputChange}
                      style={styles.textarea}
                      rows="3"
                      placeholder="e.g. Please quote invoice number as payment reference. Goods once sold cannot be returned without original receipt."
                    />
                    <p style={styles.fieldHelp}>Appears on the bottom instructions block of every invoice generated.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions Footer */}
            <div style={styles.formBottomBar}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Ensure changes are saved before navigating away.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving} icon="💾">
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        ) : (
          /* ══════════════════════════════════════════
             VIEW MODE
             ══════════════════════════════════════════ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Hero Branding Banner */}
            <div style={styles.heroCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={styles.heroLogoWrapper}>
                  {businessInfo.logo_url ? (
                    <img
                      src={businessInfo.logo_url}
                      alt={businessInfo.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={styles.heroLogoPlaceholder}>
                      {(businessInfo.name || 'B').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={styles.heroBusinessName}>{businessInfo.name || 'Business Name Not Set'}</h2>
                    {businessInfo.tin && (
                      <span style={styles.tinBadge}>TIN: {businessInfo.tin}</span>
                    )}
                  </div>
                  {businessInfo.tagline && (
                    <p style={styles.heroTagline}>{businessInfo.tagline}</p>
                  )}
                  <div style={styles.heroContactRow}>
                    {businessInfo.email && (
                      <span style={styles.heroContactChip}>✉️ {businessInfo.email}</span>
                    )}
                    {businessInfo.phone && (
                      <span style={styles.heroContactChip}>📞 {businessInfo.phone}</span>
                    )}
                    {businessInfo.address && (
                      <span style={styles.heroContactChip}>📍 {businessInfo.address}</span>
                    )}
                    {businessInfo.website && (
                      <a
                        href={businessInfo.website.startsWith('http') ? businessInfo.website : `https://${businessInfo.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.heroWebsiteLink}
                      >
                        🌐 {businessInfo.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.viewGrid}>
              {/* Card 1: Official Digital Signature */}
              <div style={styles.infoCard}>
                <div style={styles.infoCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>✍️</span>
                    <h3 style={styles.infoCardTitle}>Official Digital Signature</h3>
                  </div>
                  {businessInfo.signature_url ? (
                    <span style={styles.badgeSuccess}>Active on Invoices</span>
                  ) : (
                    <span style={styles.badgeWarning}>Not Configured</span>
                  )}
                </div>
                <div style={styles.infoCardBody}>
                  {businessInfo.signature_url ? (
                    <div style={styles.signatureSpecimenCard}>
                      <img
                        src={businessInfo.signature_url}
                        alt="Digital Signature"
                        style={{ maxHeight: 65, maxWidth: 220, objectFit: 'contain' }}
                      />
                      <div style={styles.sigSpecimenLine}></div>
                      <div style={styles.sigSpecimenLabel}>Authorized Signatory</div>
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748b' }}>
                        Automatically embedded above the signatory line on printed &amp; PDF invoices.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.emptySpecimenBox}>
                      <span style={{ fontSize: 24, marginBottom: 4 }}>📝</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        No digital signature uploaded
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                        Click "Edit Information" to upload or draw your authorized signature.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Contact Directory */}
              <div style={styles.infoCard}>
                <div style={styles.infoCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📞</span>
                    <h3 style={styles.infoCardTitle}>Contacts &amp; Phone Lines</h3>
                  </div>
                </div>
                <div style={styles.infoCardBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={styles.specRow}>
                      <span style={styles.specLabel}>Primary Phone:</span>
                      <span style={styles.specValue}>{businessInfo.phone || '—'}</span>
                    </div>
                    <div style={styles.specRow}>
                      <span style={styles.specLabel}>Official Email:</span>
                      <span style={styles.specValue}>{businessInfo.email || '—'}</span>
                    </div>
                    <div style={styles.specRow}>
                      <span style={styles.specLabel}>Address:</span>
                      <span style={styles.specValue}>{businessInfo.address || '—'}</span>
                    </div>

                    {businessInfo.contacts && businessInfo.contacts.length > 0 && (
                      <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Additional Lines:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {businessInfo.contacts.map((c, idx) => (
                            <span key={idx} style={styles.contactTag}>
                              {c.type === 'whatsapp' ? '💬 WhatsApp' : c.type === 'office' ? '🏢 Office' : c.type === 'landline' ? '☎️ Landline' : '📱 Mobile'}: {c.number}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Invoicing, Tax & Bank Remittance */}
              <div style={{ ...styles.infoCard, gridColumn: 'span 2' }}>
                <div style={styles.infoCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>💳</span>
                    <h3 style={styles.infoCardTitle}>Invoicing &amp; Payment Remittance Instructions</h3>
                  </div>
                  <span style={styles.badgeSecondary}>Customer Payment Info</span>
                </div>
                <div style={styles.infoCardBody}>
                  <div style={styles.grid3}>
                    <div style={styles.remittanceBox}>
                      <div style={styles.remittanceTitle}>🏦 Bank Account</div>
                      <div style={styles.remittanceItem}>
                        <strong>Bank:</strong> {businessInfo.bank_name || 'Not configured'}
                      </div>
                      <div style={styles.remittanceItem}>
                        <strong>Account Name:</strong> {businessInfo.account_name || '—'}
                      </div>
                      <div style={styles.remittanceItem}>
                        <strong>Account Number:</strong>{' '}
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                          {businessInfo.account_number || '—'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.remittanceBox}>
                      <div style={styles.remittanceTitle}>📱 Mobile Money</div>
                      <div style={styles.remittanceItem}>
                        <strong>Number:</strong> {businessInfo.mobile_money_number || 'Not configured'}
                      </div>
                      <div style={styles.remittanceItem}>
                        <strong>Merchant Name:</strong> {businessInfo.mobile_money_name || '—'}
                      </div>
                    </div>

                    <div style={styles.remittanceBox}>
                      <div style={styles.remittanceTitle}>⚖️ Terms &amp; Tax</div>
                      <div style={styles.remittanceItem}>
                        <strong>TIN / VAT:</strong> {businessInfo.tin || '—'}
                      </div>
                      <div style={styles.remittanceItem}>
                        <strong>Terms:</strong> {businessInfo.payment_terms || 'Due upon receipt'}
                      </div>
                    </div>
                  </div>

                  {businessInfo.invoice_notes && (
                    <div style={styles.notesBox}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Default Notes: </span>
                      {businessInfo.invoice_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Active Modules Quick Preview */}
              {isOwner && (
                <div style={{ ...styles.infoCard, gridColumn: 'span 2' }}>
                  <div style={styles.infoCardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🧩</span>
                      <h3 style={styles.infoCardTitle}>System Feature Modules</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabClick('modules')}
                      style={{
                        background: '#ede9fe',
                        border: '1px solid #ddd6fe',
                        color: '#6d28d9',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      ⚙️ Manage Modules ({activeModulesCount}/{SYSTEM_MODULES.length} Active)
                    </button>
                  </div>
                  <div style={styles.infoCardBody}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SYSTEM_MODULES.map(m => {
                        const active = isModuleActive(m.id);
                        return (
                          <span
                            key={m.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: active ? '#ecfdf5' : '#f1f5f9',
                              color: active ? '#065f46' : '#94a3b8',
                              border: active ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            }}
                          >
                            <span>{m.icon}</span>
                            <span>{m.name}</span>
                            <span>{active ? '✓' : '—'}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.footerNote}>
              <span>
                Last updated: {businessInfo.updated_at ? new Date(businessInfo.updated_at).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Recently'}
              </span>
              <span>All business updates reflect across dashboard headers, receipts, and invoices.</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── MODERN AESTHETIC STYLES ──
const styles = {
  container: {
    padding: '28px 24px',
    maxWidth: '1020px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a',
  },
  loadingCard: {
    padding: '60px 20px',
    textAlign: 'center',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  headerBadge: {
    background: '#ede9fe',
    color: '#5b21b6',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 9px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  ownerBadge: {
    background: '#fef3c7',
    color: '#92400e',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 9px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: '1px solid #fde68a',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '6px 0 0 0',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '22px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
    overflowX: 'auto',
  },
  tabButton: {
    background: 'transparent',
    border: 'none',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  tabButtonActive: {
    background: '#4f46e5',
    border: 'none',
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
    whiteSpace: 'nowrap',
  },
  tabButtonModules: {
    background: 'transparent',
    border: '1.5px dashed #cbd5e1',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  tabButtonActiveModules: {
    background: '#0f172a',
    border: '1.5px solid #0f172a',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
    whiteSpace: 'nowrap',
  },
  sectionCard: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  cardBody: {
    padding: '24px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#dc2626',
    fontWeight: '700',
  },
  input: {
    padding: '9px 13px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  textarea: {
    padding: '10px 13px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  fieldHelp: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0',
  },
  divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '20px 0',
  },
  assetBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  assetPreviewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  logoPreviewBox: {
    width: '100px',
    height: '100px',
    borderRadius: '12px',
    border: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    overflow: 'hidden',
  },
  placeholderAsset: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#f1f5f9',
    color: '#1e293b',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    width: 'fit-content',
    transition: 'all 0.15s ease',
  },
  removeAssetBtn: {
    background: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '2px 0',
    width: 'fit-content',
  },
  badgePrimary: {
    fontSize: '10px',
    fontWeight: '700',
    background: '#ede9fe',
    color: '#6d28d9',
    padding: '2px 7px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
  subTab: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  subTabActive: {
    background: '#0f172a',
    border: '1px solid #0f172a',
    color: '#ffffff',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  sigUploadContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  sigPreviewBox: {
    minWidth: '220px',
    height: '110px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
  },
  sigSpecimenLine: {
    borderBottom: '1.5px solid #94a3b8',
    width: '160px',
    margin: '4px auto 2px',
  },
  sigSpecimenLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#64748b',
    fontWeight: '700',
  },
  canvasContainer: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px',
  },
  canvasSmallBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  canvasApplyBtn: {
    background: '#16a34a',
    border: '1px solid #16a34a',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  canvasWrapper: {
    position: 'relative',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    display: 'inline-block',
    cursor: 'crosshair',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    touchAction: 'none',
  },
  canvasBaseline: {
    position: 'absolute',
    bottom: '30px',
    left: '20px',
    right: '20px',
    height: '1px',
    background: '#cbd5e1',
    pointerEvents: 'none',
  },
  contactRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  removeContactBtn: {
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  emptyContacts: {
    padding: '16px',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: '8px',
    textAlign: 'center',
  },
  formBottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
  },

  /* ── VIEW MODE STYLES ── */
  heroCard: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
  },
  heroLogoWrapper: {
    width: '90px',
    height: '90px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroLogoPlaceholder: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#4f46e5',
  },
  heroBusinessName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  tinBadge: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    fontVariantNumeric: 'tabular-nums',
  },
  heroTagline: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 10px 0',
    fontStyle: 'italic',
  },
  heroContactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  heroContactChip: {
    fontSize: '12px',
    color: '#334155',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  heroWebsiteLink: {
    fontSize: '12px',
    color: '#4f46e5',
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
    padding: '4px 10px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  infoCard: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  infoCardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  infoCardBody: {
    padding: '20px',
  },
  badgeSuccess: {
    background: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  badgeWarning: {
    background: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  badgeSecondary: {
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  signatureSpecimenCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '16px',
    textAlign: 'center',
  },
  emptySpecimenBox: {
    padding: '24px 16px',
    borderRadius: '10px',
    border: '1.5px dashed #cbd5e1',
    background: '#f8fafc',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '6px 0',
    borderBottom: '1px solid #f8fafc',
  },
  specLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  specValue: {
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
  },
  contactTag: {
    fontSize: '12px',
    color: '#334155',
    background: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '500',
  },
  remittanceBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px',
  },
  remittanceTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px',
  },
  remittanceItem: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: 1.6,
  },
  notesBox: {
    marginTop: '16px',
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    fontSize: '12px',
    color: '#1e40af',
  },
  footerNote: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    padding: '8px 4px',
    flexWrap: 'wrap',
    gap: '8px',
  },

  /* ── MODULE MANAGEMENT STYLES ── */
  modulesHeaderCard: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  moduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  moduleCard: {
    borderRadius: '14px',
    border: '1.5px solid #e2e8f0',
    padding: '18px 20px',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  moduleIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleCategoryTag: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '2px',
  },
  coreSystemBox: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px 20px',
  },
};
