import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data); navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-mirage">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#131e24] border-r border-dark-border/40 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blaze/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-blaze flex items-center justify-center shadow-lg shadow-blaze/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="font-heading font-bold text-soft-white text-xl">SlotShip</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-soft-white leading-tight mb-4">
            Start delivering <span className="text-blaze">smarter</span> today
          </h1>
          <p className="text-muted leading-relaxed">
            Create your customer account and start scheduling time-slot deliveries in minutes.
          </p>
        </div>
        <p className="text-muted text-xs relative z-10">&copy; {new Date().getFullYear()} SlotShip</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-blaze flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="font-heading font-bold text-soft-white text-lg">SlotShip</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-soft-white mb-1">Create account</h2>
          <p className="text-sm text-muted mb-7">Registered as a customer</p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', name: 'name', type: 'text', ph: 'Jane Doe', req: true },
              { label: 'Email', name: 'email', type: 'email', ph: 'you@example.com', req: true },
              { label: 'Password', name: 'password', type: 'password', ph: '••••••••', req: true },
              { label: 'Phone (optional)', name: 'phone', type: 'tel', ph: '+1 555 000 0000', req: false },
              { label: 'Address (optional)', name: 'address', type: 'text', ph: '123 Main St', req: false },
            ].map(({ label, name, type, ph, req }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input type={type} name={name} required={req} value={form[name]}
                  onChange={handleChange} placeholder={ph} className="input-field" />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-blaze hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
