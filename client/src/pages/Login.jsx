import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      const dest = data.role === 'admin' ? '/admin' : data.role === 'driver' ? '/driver' : '/dashboard';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-mirage">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#131e24] border-r border-dark-border/40 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blaze/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-deepsea/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-blaze flex items-center justify-center shadow-lg shadow-blaze/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="font-heading font-bold text-soft-white text-xl tracking-tight">SlotShip</span>
          </div>

          <h1 className="font-heading text-4xl font-bold text-soft-white leading-tight mb-4">
            Smart Delivery.<br />
            <span className="text-blaze">Your Schedule.</span>
          </h1>
          <p className="text-muted text-base leading-relaxed max-w-md">
            The professional platform for scheduling, managing and tracking time-slot deliveries with precision.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['Real-time','Tracking'],['Slot','Management'],['Role-based','Access']].map(([l1,l2]) => (
              <div key={l1} className="bg-dark-card rounded-xl p-4 border border-dark-border/40">
                <p className="text-xs font-semibold text-soft-white">{l1}</p>
                <p className="text-xs text-muted">{l2}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted text-xs relative z-10">&copy; {new Date().getFullYear()} SlotShip</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-blaze flex items-center justify-center shadow-lg shadow-blaze/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="font-heading font-bold text-soft-white text-lg">SlotShip</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-soft-white mb-1">Welcome back</h2>
          <p className="text-sm text-muted mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange}
                placeholder="••••••••" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-blaze hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
