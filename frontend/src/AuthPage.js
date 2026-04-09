import { useState } from 'react';

const API = 'http://localhost:8000/api';

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', business_name: '', phone: '', address: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, password_confirmation: form.password_confirmation, business_name: form.business_name, phone: form.phone, address: form.address };

    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!res.ok) {
        setError(data?.message || `Error ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setResult(null);
    setError(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{mode === 'login' ? 'Login' : 'Register'}</h2>

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <input
              style={styles.input}
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handle}
              required
            />
          )}
          <input
            style={styles.input}
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handle}
            required
          />
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handle}
            required
          />
          {mode === 'register' && form.password && (
            <div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    flex: 1, height: '4px', borderRadius: '2px',
                    background: i <= getStrength(form.password) ? strengthColor[getStrength(form.password)] : '#e5e7eb'
                  }} />
                ))}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: strengthColor[getStrength(form.password)] }}>
                {strengthLabel[getStrength(form.password)]}
              </p>
            </div>
          )}
          {mode === 'register' && (
            <>
              <input
                style={styles.input}
                name="password_confirmation"
                type="password"
                placeholder="Confirm password"
                value={form.password_confirmation}
                onChange={handle}
                required
              />
              <input
                style={styles.input}
                name="business_name"
                placeholder="Business name"
                value={form.business_name}
                onChange={handle}
                required
              />
              <input
                style={styles.input}
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={handle}
              />
              <textarea
                style={{ ...styles.input, resize: 'vertical', minHeight: '70px' }}
                name="address"
                placeholder="Business address"
                value={form.address}
                onChange={handle}
              />
            </>
          )}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span style={styles.link} onClick={toggle}>
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div style={styles.success}>
            <strong>Response:</strong>
            <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { margin: '0 0 1.5rem', textAlign: 'center', fontSize: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
  btn: { padding: '0.7rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
  toggle: { textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' },
  link: { color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' },
  error: { marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '4px', color: '#b91c1c' },
  success: { marginTop: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '4px', color: '#166534' },
  pre: { margin: '0.5rem 0 0', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
};
