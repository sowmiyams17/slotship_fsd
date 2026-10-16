import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { getAdminStats, getAdminOrders, getAdminDrivers, getAdminSlots, updateSlot, updateOrderStatus, createDriver } from '../api/admin';

import AppLayout from '../components/AppLayout';

import StatusBadge from '../components/StatusBadge';

import { IconUsers, IconPackage, IconTruck, IconClock, IconClipboard } from '../components/Icons';

function fmtDate(iso) {

  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

}

// ── Pure CSS bar chart ──

function BarChart({ data, title }) {

  const max = Math.max(...data.map(d => d.value), 1);

  return (

    <div className="card p-6 h-full rounded-2xl border border-dark-border/70">

      <h3 className="section-title mb-4">{title}</h3>

      <div className="flex items-end gap-2 h-28">

        {data.map(({ label, value, color }) => (

          <div key={label} className="flex-1 flex flex-col items-center gap-1.5">

            <span className="text-xs font-bold text-soft-white">{value}</span>

            <div className="w-full rounded-t-md transition-all duration-500"

              style={{ height: `${(value / max) * 96}px`, minHeight: value > 0 ? '4px' : '2px', backgroundColor: color || '#FF5B04', opacity: value === 0 ? 0.2 : 1 }} />

            <span className="text-[10px] text-muted text-center leading-tight">{label}</span>

          </div>

        ))}

      </div>

    </div>

  );

}

// ── Donut / ring chart (pure SVG) ──

function DonutChart({ segments, title }) {

  const actualTotal = segments.reduce((s, d) => s + d.value, 0);

  const total = actualTotal || 1;

  let cumulative = 0;

  const r = 42, cx = 52, cy = 52, stroke = 22;

  const circumference = 2 * Math.PI * r;

  return (

    <div className="card p-6 h-full rounded-2xl border border-dark-border/70">

      <h3 className="section-title mb-4">{title}</h3>

      <div className="flex items-center gap-5">

        <svg width="104" height="104" viewBox="0 0 104 104" className="shrink-0">

          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#29434B" strokeWidth={stroke} />

          {segments.filter(s => s.value > 0).map((seg, i) => {

            const pct = seg.value / total;

            const offset = circumference - cumulative * circumference;

            cumulative += pct;

            return (

              <circle key={i} cx={cx} cy={cy} r={r} fill="none"

                stroke={seg.color} strokeWidth={stroke}

                strokeDasharray={`${pct * circumference} ${circumference}`}

                strokeDashoffset={offset}

                transform={`rotate(-90 ${cx} ${cy})`}

                style={{ transition: 'stroke-dasharray 0.4s ease' }} />

            );

          })}

          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"

            fill="#F5F8F9" fontSize="16" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">

            {actualTotal}

          </text>

        </svg>

        <ul className="space-y-2 flex-1 min-w-0">

          {segments.map(s => (

            <li key={s.label} className="flex items-center gap-2 text-xs">

              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />

              <span className="text-muted truncate">{s.label}</span>

              <span className="ml-auto font-bold text-soft-white">{s.value}</span>

            </li>

          ))}

        </ul>

      </div>

    </div>

  );

}

// ── Slot capacity bar ──

function SlotCapacityRow({ slot }) {

  const pct = slot.capacity > 0 ? Math.min(100, (slot.booked / slot.capacity) * 100) : 0;

  const color = pct >= 90 ? '#f87171' : pct >= 60 ? '#fb923c' : '#34d399';

  return (

    <div className="py-2.5 border-b border-dark-border/30 last:border-0">

      <div className="flex items-center justify-between text-xs mb-1.5">

        <span className="text-muted">{slot.startTime}–{slot.endTime}</span>

        <span className="text-soft-white font-medium">{slot.booked}/{slot.capacity}</span>

      </div>

      <div className="h-1.5 bg-dark-hover rounded-full overflow-hidden">

        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />

      </div>

    </div>

  );

}

const TABS = ['orders', 'slots', 'drivers'];

export default function AdminDashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({});

  const [orders, setOrders] = useState([]);

  const [drivers, setDrivers] = useState([]);

  const [slots, setSlots] = useState([]);

  const [tab, setTab] = useState('orders');

  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState('');

  const [busy, setBusy] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState('');
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [driverMessage, setDriverMessage] = useState('');
  const [driverForm, setDriverForm] = useState({
    name: '', email: '', password: '', phone: '',
    vehicleType: 'bike', vehicleNumber: '', licenseNumber: '', currentZone: '',
  });

  const submitDriver = async (event) => {
    event.preventDefault();
    if (savingDriver) return;
    setSavingDriver(true);
    setErr('');
    setDriverMessage('');
    try {
      await createDriver(driverForm);
      setDriverMessage('Driver account created successfully. The driver can now log in.');
      setDriverForm({ name: '', email: '', password: '', phone: '', vehicleType: 'bike', vehicleNumber: '', licenseNumber: '', currentZone: '' });
      setShowDriverForm(false);
      await load();
    } catch (e) {
      const validationMessage = e.response?.data?.errors?.map(x => x.msg).join(', ');
      setErr(validationMessage || e.response?.data?.message || 'Could not create driver. Please try again.');
    } finally {
      setSavingDriver(false);
    }
  };


  const load = async () => {

    setLoadError('');

    try {

      const [s, o, d, sl] = await Promise.all([getAdminStats(), getAdminOrders(), getAdminDrivers(), getAdminSlots()]);

      setStats(s.data); setOrders(o.data); setDrivers(d.data); setSlots(sl.data);

    } catch (e) {

      console.error(e);

      setLoadError(e.response?.data?.message || 'Unable to load dashboard data. Check the server connection.');

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };

  useEffect(() => { load(); }, []);

  const doStatus = async (id, payload) => {

    setErr(''); setBusy(id);

    try { await updateOrderStatus(id, payload); await load(); }

    catch (e) { setErr(e.response?.data?.message || 'Failed'); }

    setBusy('');

  };

  const doSlot = async (id, field, val) => {

    setErr('');

    try { await updateSlot(id, { [field]: val }); await load(); }

    catch (e) { setErr(e.response?.data?.message || 'Failed'); }

  };

  // ── Derived analytics from real data ──

  const statusCounts = {

    pending:          orders.filter(o => o.status === 'pending').length,

    confirmed:        orders.filter(o => o.status === 'confirmed').length,

    assigned:         orders.filter(o => o.status === 'assigned').length,

    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,

    delivered:        orders.filter(o => o.status === 'delivered').length,

  };

  // Driver workload (assigned + out_for_delivery orders per driver)

  const driverLoad = drivers.map(d => ({

    label: d.name.split(' ')[0],

    value: orders.filter(o => (o.driver?._id === d._id || o.driver === d._id) &&

      ['assigned', 'out_for_delivery'].includes(o.status)).length,

    color: '#FF5B04',

  }));

  // Today's slots

  const todayStr = new Date().toLocaleDateString('en-CA');

  const todaySlots = slots.filter(s => s.date?.startsWith(todayStr));

  const activeDeliveries = statusCounts.assigned + statusCounts.out_for_delivery;

  const totalOrders = orders.length;

  const completionRate = totalOrders ? Math.round(statusCounts.delivered / totalOrders * 100) : 0;

  const refresh = () => { setRefreshing(true); load(); };

  if (loading) return <AppLayout><div className="flex items-center justify-center py-24 text-muted">Loading…</div></AppLayout>;

  return (

    <AppLayout>

      <div className="space-y-5">

        {/* ── Command center hero ── */}

      <section className="relative overflow-hidden rounded-2xl border border-blaze/20 bg-dark-card p-6 sm:p-8"

        style={{ background: 'radial-gradient(circle at 95% 15%, rgba(255,91,4,.14), transparent 35%), linear-gradient(115deg, #203940 0%, #16232A 80%)' }}>

        <div className="absolute -right-14 -bottom-20 h-56 w-56 rounded-full border border-blaze/10 pointer-events-none" />

        <div className="absolute -right-4 -bottom-12 h-40 w-40 rounded-full border border-blaze/10 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          <div>

            <p className="text-[11px] uppercase tracking-[.24em] font-bold text-blaze mb-2">Operations / Overview</p>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-soft-white">Logistics Command Center</h1>

            <p className="text-sm text-muted mt-2">Track orders, coordinate drivers and manage delivery capacity.</p>

            <div className="flex flex-wrap items-center gap-3 mt-5 text-xs text-muted">

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                {activeDeliveries} active deliveries

              </span>

              <span className="rounded-full border border-dark-border px-3 py-1.5">{completionRate}% orders delivered</span>

            </div>

          </div>

          <button onClick={refresh} disabled={refreshing}

            className="self-start rounded-xl bg-blaze px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blaze/20 hover:brightness-110 disabled:opacity-50 transition-all">

            {refreshing ? 'Refreshing…' : '↻ Refresh overview'}

          </button>

        </div>

      </section>

      {(err || loadError) && (

        <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">

          {err || loadError}

        </div>

      )}

      {/* ── KPI overview ── */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">

        {[

          { label: 'Total Orders', value: stats.totalOrders, icon: <IconClipboard className="w-5 h-5 text-blaze" />, ring: 'bg-blaze/10', sub: 'All bookings' },

          { label: 'Pending Review', value: stats.pendingOrders, icon: <IconClock className="w-5 h-5 text-amber-400" />, ring: 'bg-amber-400/10', sub: 'Need confirmation' },

          { label: 'Delivered', value: statusCounts.delivered, icon: <IconPackage className="w-5 h-5 text-emerald-400" />, ring: 'bg-emerald-400/10', sub: 'Completed orders' },

          { label: 'Customers', value: stats.totalCustomers, icon: <IconUsers className="w-5 h-5 text-cyan-400" />, ring: 'bg-cyan-400/10', sub: 'Registered accounts' },

          { label: 'Drivers', value: stats.totalDrivers, icon: <IconTruck className="w-5 h-5 text-violet-400" />, ring: 'bg-violet-400/10', sub: 'Driver accounts' },

        ].map(({ label, value, icon, ring, sub }) => (

          <div key={label} className="relative overflow-hidden rounded-2xl border border-dark-border/70 bg-dark-card p-5 hover:border-blaze/30 hover:-translate-y-0.5 transition-all duration-200 group">

            <div className="flex items-start justify-between gap-2">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted">{label}</p>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ring}`}>{icon}</div>

            </div>

            <p className="font-heading text-3xl font-bold text-soft-white mt-3">{value ?? '—'}</p>

            <p className="text-xs text-muted mt-1">{sub}</p>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blaze/0 group-hover:bg-blaze/70 transition-colors" />

          </div>

        ))}

      </div>

      {/* ── Analytics Row ── */}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

          <DonutChart

            title="Order Status Distribution"

            segments={[

              { label: 'Pending',        value: statusCounts.pending,          color: '#fbbf24' },

              { label: 'Confirmed',      value: statusCounts.confirmed,        color: '#60a5fa' },

              { label: 'Assigned',       value: statusCounts.assigned,         color: '#a78bfa' },

              { label: 'Out for Delivery', value: statusCounts.out_for_delivery, color: '#FF5B04' },

              { label: 'Delivered',      value: statusCounts.delivered,        color: '#34d399' },

            ]}

          />

          <BarChart

            title="Driver Workload (Orders)"

            data={driverLoad.length > 0 ? driverLoad : [{ label: 'No drivers', value: 0, color: '#38515A' }]}

          />

          {/* Slot capacity today */}

          <div className="card p-6 rounded-2xl border border-dark-border/70">

            <h3 className="section-title mb-3">Today's Slot Capacity</h3>

            {todaySlots.length === 0 ? (

              <p className="text-sm text-muted text-center py-6">No slots today</p>

            ) : (

              <div>{todaySlots.slice(0, 6).map(s => <SlotCapacityRow key={s._id} slot={s} />)}</div>

            )}

          </div>

        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 pt-3">

        <div>

          <p className="text-[11px] font-bold uppercase tracking-[.22em] text-blaze">Manage operations</p>

          <h2 className="font-heading text-xl font-bold text-soft-white mt-1">Delivery workspace</h2>

          <p className="text-sm text-muted mt-1">Review orders, control slots and coordinate your driver team.</p>

        </div>

        <span className="text-xs text-muted">{orders.length} orders · {drivers.length} drivers</span>

      </div>

      {/* ── Tabs ── */}

        <div className="flex gap-1 p-1 bg-dark-card border border-dark-border/50 rounded-lg w-fit">

          {TABS.map(t => (

            <button key={t} onClick={() => setTab(t)}

              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${

                tab === t ? 'bg-blaze text-white' : 'text-muted hover:text-soft-white hover:bg-dark-hover'

              }`}>

              {t.charAt(0).toUpperCase() + t.slice(1)}

            </button>

          ))}

        </div>

        {/* ── Orders Tab ── */}

        {tab === 'orders' && (

          <div className="card overflow-hidden rounded-2xl border border-dark-border/70">

            <div className="overflow-x-auto">

              <table className="w-full dark-table">

                <thead><tr>

                  <th>Customer</th><th>Delivery To</th><th>Date / Slot</th>

                  <th>Status</th><th>Driver</th><th>Actions</th>

                </tr></thead>

                <tbody>

                  {orders.map(o => {

                    const slot = o.deliverySlot;

                    return (

                      <tr key={o._id}>

                        <td className="font-medium">{o.customer?.name}</td>

                        <td className="max-w-[160px] truncate text-muted">{o.deliveryAddress}</td>

                        <td className="text-xs text-muted whitespace-nowrap">

                          {fmtDate(o.deliveryDate)}{slot ? ` · ${slot.startTime}–${slot.endTime}` : ''}

                        </td>

                        <td><StatusBadge status={o.status} /></td>

                        <td className="text-muted text-xs">{o.driver?.name || '—'}</td>

                        <td>

                          <div className="flex flex-col gap-1.5">

                            {o.status === 'pending' && (

                              <button disabled={busy === o._id} onClick={() => doStatus(o._id, { status: 'confirmed' })}

                                className="text-xs bg-deepsea/80 hover:bg-deepsea text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-40">

                                Confirm

                              </button>

                            )}

                            {o.status === 'confirmed' && (

                              <select defaultValue="" onChange={e => doStatus(o._id, { status: 'assigned', driverId: e.target.value })}

                                className="input-field text-xs py-1.5 px-2">

                                <option value="" disabled>Assign driver…</option>

                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}

                              </select>

                            )}

                            <button onClick={() => navigate(`/orders/${o._id}`)}

                              className="text-xs text-blaze hover:underline font-medium">View</button>

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                  {orders.length === 0 && <tr><td colSpan="6" className="text-center py-10 text-muted">No orders</td></tr>}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* ── Slots Tab ── */}

        {tab === 'slots' && (

          <div className="card overflow-hidden rounded-2xl border border-dark-border/70">

            <div className="overflow-x-auto">

              <table className="w-full dark-table">

                <thead><tr>

                  <th>Date</th><th>Time</th><th>Capacity</th><th>Booked</th><th>Available</th><th>Status</th><th>Actions</th>

                </tr></thead>

                <tbody>

                  {slots.map(s => (

                    <tr key={s._id}>

                      <td className="whitespace-nowrap">{fmtDate(s.date)}</td>

                      <td className="font-medium whitespace-nowrap">{s.startTime}–{s.endTime}</td>

                      <td>{s.capacity}</td>

                      <td>{s.booked}</td>

                      <td className="font-semibold">{s.available}</td>

                      <td>

                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ${

                          s.isActive ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' : 'bg-red-400/10 text-red-400 ring-red-400/20'

                        }`}>{s.isActive ? 'Active' : 'Disabled'}</span>

                      </td>

                      <td>

                        <div className="flex gap-2">

                          <button onClick={() => doSlot(s._id, 'capacity', s.capacity + 5)}

                            className="text-xs border border-dark-border text-muted px-2.5 py-1 rounded-md hover:bg-dark-hover transition-colors">+5</button>

                          <button onClick={() => doSlot(s._id, 'isActive', !s.isActive)}

                            className={`text-xs px-2.5 py-1 rounded-md transition-colors border ${

                              s.isActive ? 'border-red-400/30 text-red-400 hover:bg-red-400/10' : 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10'

                            }`}>{s.isActive ? 'Disable' : 'Enable'}</button>

                        </div>

                      </td>

                    </tr>

                  ))}

                  {slots.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-muted">No slots</td></tr>}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* ── Drivers Tab ── */}

        {tab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark-border/70 bg-dark-card p-5">
            <div>
              <h3 className="font-heading text-lg font-bold text-soft-white">Driver Management</h3>
              <p className="text-sm text-muted mt-1">Create individual accounts for your delivery team.</p>
            </div>
            <button type="button" onClick={() => { setShowDriverForm(v => !v); setErr(''); setDriverMessage(''); }}
              className="rounded-xl bg-blaze px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              {showDriverForm ? 'Cancel' : '+ Add Driver'}
            </button>
          </div>
          {driverMessage && <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{driverMessage}</div>}
          {showDriverForm && (
            <form onSubmit={submitDriver} className="rounded-2xl border border-dark-border/70 bg-dark-card p-5 sm:p-6">
              <h3 className="font-heading text-lg font-bold text-soft-white mb-4">Create Driver Account</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['name', 'Full name', 'text'],
                  ['email', 'Email address', 'email'],
                  ['password', 'Temporary password (min 6 characters)', 'password'],
                  ['phone', 'Phone number', 'tel'],
                  ['vehicleNumber', 'Vehicle registration number', 'text'],
                  ['licenseNumber', 'Driving licence number', 'text'],
                  ['currentZone', 'Delivery zone (optional)', 'text'],
                ].map(([field, label, type]) => (
                  <label key={field} className="block">
                    <span className="block text-xs font-semibold text-muted mb-2">{label}</span>
                    <input type={type} required={field !== 'currentZone'} minLength={field === 'password' ? 6 : undefined}
                      autoComplete="off" value={driverForm[field]}
                      onChange={e => setDriverForm(f => ({ ...f, [field]: e.target.value }))}
                      className="input-field w-full" />
                  </label>
                ))}
                <label className="block">
                  <span className="block text-xs font-semibold text-muted mb-2">Vehicle type</span>
                  <select className="input-field w-full" value={driverForm.vehicleType}
                    onChange={e => setDriverForm(f => ({ ...f, vehicleType: e.target.value }))}>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                  </select>
                </label>
              </div>
              <p className="mt-4 text-xs text-muted">New drivers start unavailable until availability is enabled in the next phase. Share login details privately.</p>
              <button type="submit" disabled={savingDriver}
                className="mt-5 rounded-xl bg-blaze px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:brightness-110">
                {savingDriver ? 'Creating driver…' : 'Create Driver'}
              </button>
            </form>
          )}


          <div className="card overflow-hidden rounded-2xl border border-dark-border/70">

            <div className="overflow-x-auto">

              <table className="w-full dark-table">

                <thead><tr><th>Driver</th><th>Email</th><th>Phone</th><th>Orders</th><th>Status</th></tr></thead>

                <tbody>

                  {drivers.map(d => {

                    const dOrders = orders.filter(o => o.driver?._id === d._id || o.driver === d._id);

                    return (

                      <tr key={d._id}>

                        <td>

                          <div className="flex items-center gap-2.5">

                            <div className="w-7 h-7 rounded-full bg-deepsea flex items-center justify-center text-white text-xs font-bold shrink-0">

                              {d.name?.charAt(0)}

                            </div>

                            <span className="font-medium">{d.name}</span>

                          </div>

                        </td>

                        <td className="text-muted">{d.email}</td>

                        <td className="text-muted">{d.phone || '—'}</td>

                        <td><span className="font-semibold text-blaze">{dOrders.length}</span></td>

                        <td>

                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ${

                            d.isActive ? 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' : 'bg-red-400/10 text-red-400 ring-red-400/20'

                          }`}>{d.isActive ? 'Active' : 'Inactive'}</span>

                        </td>

                      </tr>

                    );

                  })}

                  {drivers.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-muted">No drivers</td></tr>}

                </tbody>

              </table>

            </div>

          </div>

          </div>
      )}

      </div>

    </AppLayout>

  );

}
