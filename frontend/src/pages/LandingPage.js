import React, { useState } from 'react';

function LandingPage({ onGoToLogin, onGoToRegister }) {
  const [activeTab, setActiveTab] = useState('home');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [sentMessage, setSentMessage] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email) {
      setSentMessage(true);
      setTimeout(() => {
        setSentMessage(false);
        setContactForm({ name: '', email: '', message: '' });
      }, 4000);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0f172a', color: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.4px', color: '#fff' }}>StockPro</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inventory &amp; Sales</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {['home', 'pricing', 'contact'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', color: activeTab === tab ? '#38bdf8' : '#94a3b8',
                fontWeight: activeTab === tab ? 700 : 500, fontSize: 14, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'color 0.15s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onGoToLogin}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Sign In
          </button>
          <button
            onClick={onGoToRegister}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 14px rgba(79,70,229,0.4)' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* HOME SECTION */}
        {activeTab === 'home' && (
          <div>
            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
              <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                🚀 Modern Enterprise Multi-Tenant Solution
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1px', margin: '0 0 20px', lineHeight: 1.15, background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Manage Your Inventory &amp; Sales with High Precision
              </h1>
              <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 36px' }}>
                All-in-one POS, Stock Control, CRM, Purchases &amp; Financial Analytics built for fast-growing businesses.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button onClick={onGoToRegister} style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
                  Start Free Trial →
                </button>
                <button onClick={() => setActiveTab('pricing')} style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                  View Pricing
                </button>
              </div>
            </section>

            {/* Feature Cards Grid */}
            <section style={{ maxWidth: 1100, margin: '40px auto 80px', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                { icon: '🧾', title: 'Smart POS & Receipts', desc: 'Process sales instantly with high-precision timestamped thermal receipt printing.' },
                { icon: '📦', title: 'Real-time Stock Tracking', desc: 'Automatic inventory deductions, low stock notifications, and supplier purchases.' },
                { icon: '👥', title: 'CRM & Relations', desc: 'Maintain complete customer profiles, order history, and relationship analytics.' },
                { icon: '🔒', title: 'Role-Based Permissions', desc: 'Granular permissions for Owners, Admins, Managers, and Cashiers with custom roles.' },
                { icon: '📱', title: 'Progressive Web App', desc: 'Works seamless across Desktop, Mobile, and Tablet offline with service worker caching.' },
                { icon: '📊', title: 'Financial Intelligence', desc: 'Comprehensive daily, monthly, and yearly revenue and profit margin analytics.' }
              ].map((f, i) => (
                <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#f8fafc' }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* PRICING SECTION */}
        {activeTab === 'pricing' && (
          <section style={{ maxWidth: 1000, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px' }}>Simple, Transparent Pricing</h2>
            <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 48 }}>Choose the plan that best fits your business growth.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'left' }}>
              {[
                { plan: 'Starter', price: '$19', desc: 'Perfect for single stores starting out.', features: ['1 Store Location', 'Up to 3 Staff Accounts', 'Standard POS & Stock Control', 'Email Support'] },
                { plan: 'Professional', price: '$49', desc: 'For growing businesses requiring full CRM & AI.', features: ['3 Store Locations', 'Unlimited Staff & Custom Roles', 'Full CRM & Supplier Purchase Tracking', 'AI Assistant & Priority Support'], badge: 'Most Popular' },
                { plan: 'Enterprise', price: '$99', desc: 'Custom enterprise multi-tenant infrastructure.', features: ['Unlimited Locations', 'Dedicated Server Instance', 'Custom PWA Branding & Domain', '24/7 Dedicated Support'] }
              ].map((p, i) => (
                <div key={i} style={{ background: '#1e293b', border: p.badge ? '2px solid #6366f1' : '1px solid #334155', borderRadius: 20, padding: 32, position: 'relative' }}>
                  {p.badge && (
                    <span style={{ position: 'absolute', top: -14, right: 24, background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, textTransform: 'uppercase' }}>
                      {p.badge}
                    </span>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{p.plan}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>{p.desc}</p>
                  <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, color: '#f8fafc' }}>
                    {p.price} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/ month</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {p.features.map((feat, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#38bdf8' }}>✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onGoToRegister} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: p.badge ? '#4f46e5' : '#334155', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Choose {p.plan}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CONTACT SECTION */}
        {activeTab === 'contact' && (
          <section style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 36 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Get in Touch</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Have questions or need a custom solution? Send us a message.</p>

              {sentMessage ? (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: 16, borderRadius: 12, textAlign: 'center', fontWeight: 600 }}>
                  ✓ Thank you! Your message has been sent successfully.
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Your Name</label>
                    <input
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="Jane Doe"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Email Address</label>
                    <input
                      type="email"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="jane@example.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Message</label>
                    <textarea
                      rows="4"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="How can we help your business?"
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" style={{ padding: '12px 0', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px 48px', borderTop: '1px solid #1e293b', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        © {new Date().getFullYear()} StockPro Inventory &amp; Sales Management System. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
