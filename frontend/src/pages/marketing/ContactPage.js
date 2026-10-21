import React, { useState } from 'react';
import MarketingHeader from '../../components/marketing/MarketingHeader';
import MarketingFooter from '../../components/marketing/MarketingFooter';
import { API_URL } from '../../config/api';
import { usePageMeta } from '../../utils/seo';
import { CheckIcon } from '../../components/marketing/Icons';

export default function ContactPage() {
  usePageMeta(
    'Contact StockPro — Business Inquiries & Support',
    'Get in touch with the StockPro team for pricing discussions, product demonstrations, onboarding assistance, and technical questions.'
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    business_name: '',
    subject: 'Product Inquiry',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Please enter your full name (minimum 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!form.subject.trim()) {
      errs.subject = 'Please select an inquiry subject.';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      errs.message = 'Please enter a message of at least 10 characters.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          business_name: form.business_name.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data?.message || 'We were unable to deliver your message. Please check your network and try again.'
        );
      } else {
        setSuccessMessage(
          data?.message || 'Thank you! Your message has been received and our team will get in touch shortly.'
        );
        setForm({
          name: '',
          email: '',
          business_name: '',
          subject: 'Product Inquiry',
          message: '',
        });
      }
    } catch {
      setErrorMessage(
        'Could not reach the server. Please verify the backend service is running or try again in a moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main id="main-content">
        <section className="sp-section sp-section-white" aria-labelledby="contact-heading">
          <div className="sp-container">
            <div style={{ marginBottom: 48 }}>
              <div className="sp-eyebrow">LET'S TALK</div>
              <h1 className="sp-section-title" style={{ fontSize: 'clamp(32px, 4vw, 44px)', marginBottom: 12 }}>
                Let's talk about your business.
              </h1>
              <p className="sp-body" style={{ maxWidth: 640, margin: 0, fontSize: 17 }}>
                Have questions regarding catalog structure, POS terminal deployment, or multi-cashier permissions? Our operations team is here to assist.
              </p>
            </div>

            <div className="sp-contact-grid">
              {/* Left Column: Direct Info & Editorial with Thin Separators */}
              <div className="sp-contact-info-col">
                <div className="sp-contact-spec-panel">
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sp-navy-950)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
                    Direct Operational Channels
                  </div>

                  <div className="sp-contact-spec-item">
                    <div className="sp-contact-spec-label">EMAIL</div>
                    <div className="sp-contact-spec-val">
                      <a href="mailto:support@stockpro.com" className="sp-contact-method-link">
                        support@stockpro.com
                      </a>
                    </div>
                    <div className="sp-contact-spec-sub">Direct support response within 2 business hours</div>
                  </div>

                  <div className="sp-contact-spec-item">
                    <div className="sp-contact-spec-label">PHONE &amp; WHATSAPP</div>
                    <div className="sp-contact-spec-val">
                      <a href="tel:+256700000000" className="sp-contact-method-link">
                        +256 700 000 000
                      </a>
                    </div>
                    <div className="sp-contact-spec-sub">Available Monday through Saturday</div>
                  </div>

                  <div className="sp-contact-spec-item">
                    <div className="sp-contact-spec-label">LOCATION</div>
                    <div className="sp-contact-spec-val">Kampala, Uganda</div>
                    <div className="sp-contact-spec-sub">East Africa Commerce Hub</div>
                  </div>

                  <div className="sp-contact-spec-item">
                    <div className="sp-contact-spec-label">HOURS</div>
                    <div className="sp-contact-spec-val">Monday &ndash; Saturday: 8:00 AM &ndash; 6:00 PM EAT</div>
                    <div className="sp-contact-spec-sub">Sunday: Dedicated On-Call System Maintenance</div>
                  </div>
                </div>

                <div style={{ padding: '20px 24px', backgroundColor: 'var(--sp-surface-soft)', border: '1px solid var(--sp-border)', borderRadius: 'var(--sp-radius-md)' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--sp-navy-950)', marginBottom: 4 }}>
                    Already an Active Merchant?
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--sp-text-muted)', margin: 0, lineHeight: 1.45 }}>
                    Existing business owners and staff can sign in directly to launch register shifts or view inventory audits without filing an inquiry.
                  </p>
                </div>
              </div>

              {/* Right Column: Contact Form */}
              <div className="sp-contact-card">
                <h3 className="sp-section-title" style={{ fontSize: 22, marginBottom: 8 }}>
                  Send us a message
                </h3>
                <p className="sp-body" style={{ fontSize: 14, marginBottom: 28 }}>
                  Fill out the form below and an operations specialist will review your request.
                </p>

                {/* Success alert */}
                {successMessage && (
                  <div className="sp-form-alert sp-form-alert-success" role="status">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                      <CheckIcon size={16} />
                      <span>Message Received</span>
                    </div>
                    <div>{successMessage}</div>
                    <button
                      type="button"
                      className="sp-btn sp-btn-secondary sp-btn-sm"
                      style={{ marginTop: 14 }}
                      onClick={() => setSuccessMessage(null)}
                    >
                      Send another message
                    </button>
                  </div>
                )}

                {/* Error alert */}
                {errorMessage && (
                  <div className="sp-form-alert sp-form-alert-error" role="alert">
                    <strong>Error: </strong>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!successMessage && (
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Name */}
                    <div className="sp-input-group">
                      <label htmlFor="contact-name" className="sp-label">
                        <span>Full Name</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Alex Zziwa"
                        className={`sp-input ${errors.name ? 'sp-input-error' : ''}`}
                        disabled={submitting}
                        required
                      />
                      {errors.name && <div className="sp-error-message">{errors.name}</div>}
                    </div>

                    {/* Email */}
                    <div className="sp-input-group">
                      <label htmlFor="contact-email" className="sp-label">
                        <span>Email Address</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="e.g. alex@zziwastores.com"
                        className={`sp-input ${errors.email ? 'sp-input-error' : ''}`}
                        disabled={submitting}
                        required
                      />
                      {errors.email && <div className="sp-error-message">{errors.email}</div>}
                    </div>

                    {/* Business Name */}
                    <div className="sp-input-group">
                      <label htmlFor="contact-business" className="sp-label">
                        <span>Business Name</span>
                        <span className="sp-label-optional">Optional</span>
                      </label>
                      <input
                        id="contact-business"
                        type="text"
                        name="business_name"
                        value={form.business_name}
                        onChange={handleChange}
                        placeholder="e.g. Zziwa Electronics"
                        className="sp-input"
                        disabled={submitting}
                      />
                    </div>

                    {/* Subject */}
                    <div className="sp-input-group">
                      <label htmlFor="contact-subject" className="sp-label">
                        <span>Subject</span>
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className={`sp-select ${errors.subject ? 'sp-input-error' : ''}`}
                        disabled={submitting}
                      >
                        <option value="Product Inquiry">Product Inquiry</option>
                        <option value="Pricing & Plans">Pricing &amp; Subscription Plans</option>
                        <option value="Demo Request">Request a Live Demonstration</option>
                        <option value="Custom Enterprise">Multi-Branch / Enterprise Deployment</option>
                        <option value="Technical Support">Technical &amp; Account Support</option>
                      </select>
                      {errors.subject && <div className="sp-error-message">{errors.subject}</div>}
                    </div>

                    {/* Message */}
                    <div className="sp-input-group">
                      <label htmlFor="contact-message" className="sp-label">
                        <span>Your Message</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your business, inventory size, or specific questions..."
                        className={`sp-textarea ${errors.message ? 'sp-input-error' : ''}`}
                        disabled={submitting}
                        rows={5}
                        required
                      />
                      {errors.message && <div className="sp-error-message">{errors.message}</div>}
                    </div>

                    <button
                      type="submit"
                      className="sp-btn sp-btn-primary sp-btn-lg"
                      style={{ width: '100%', marginTop: 8 }}
                      disabled={submitting}
                    >
                      {submitting ? 'Sending Message...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
