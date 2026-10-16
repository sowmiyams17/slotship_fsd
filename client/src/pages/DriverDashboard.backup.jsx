import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDriverOrders, updateOrderStatus } from '../api/admin';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { IconTruck, IconPackage, IconMapPin, IconClock, IconCalendar, IconChevronRight } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const ALL_STATUSES = ['pending', 'confirmed', 'assigned', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', assigned: 'Assigned', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };

function DeliveryProgress({ status }) {
  const idx = ALL_STATUSES.indexOf(status);
  const driverStatuses = ['assigned', 'out_for_delivery', 'delivered'];
  const driverIdx = driverStatuses.indexOf(status);
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {driverStatuses.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= driverIdx ? 'bg-blaze' : 'bg-dark-border'}`} />
          <p className={`text-[9px] mt-1 font-medium ${i === driverIdx ? 'text-blaze' : 'text-dark-border'}`}>
            {i === driverIdx ? STATUS_LABELS[s] : '·'}
          </p>
        </div>
      ))}
    </div>
  );
}

const NEXT_STATUS = { assigned: 'out_for_delivery', out_for_delivery: 'delivered' };
const NEXT_LABEL  = { assigned: 'Start Delivery', out_for_delivery: 'Mark Delivered' };

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    getDriverOrders().then(({ data }) => setOrders(data)).catch(() => setOrders([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const progress = async (id, status) => {
    setError(''); setBusy(id);
    try { await updateOrderStatus(id, { status }); load(); }
    catch (e) { setError(e.response?.data?.message || 'Update failed'); }
    setBusy('');
  };

  const active    = orders.filter(o => o.status !== 'delivered');
  const completed = orders.filter(o => o.status === 'delivered');
  const inTransit = orders.filter(o => o.status === 'out_for_delivery');
  // Priority = first out_for_delivery, else first assigned
  const priority  = inTransit[0] || active[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <AppLayout><div className="flex items-center justify-center py-24 text-muted">Loading…</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-xl border border-dark-border/50 bg-dark-card">
          <div className="absolute top-0 right-0 w-48 h-full bg-blaze/5 blur-2xl pointer-events-none rounded-full translate-x-8" />
          <div className="relative z-10 p-6">
            <p className="text-muted text-sm mb-1">{greeting},</p>
            <h1 className="font-heading text-2xl font-bold text-soft-white">{user?.name}</h1>
            <p className="text-sm text-muted mt-1">
              {active.length === 0
                ? 'No active deliveries. Check back soon.'
                : `${active.length} deliver${active.length !== 1 ? 'ies' : 'y'} awaiting · ${inTransit.length} in transit`}
            </p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Assigned',   value: orders.filter(o => o.status === 'assigned').length,         icon: <IconClipboard />, ring: 'bg-violet-400/10', color: 'text-violet-400' },
            { label: 'In Transit', value: inTransit.length,                                            icon: <IconTruck />,     ring: 'bg-blaze/10',      color: 'text-blaze' },
            { label: 'Completed',  value: completed.length,                                            icon: <IconPackage />,   ring: 'bg-emerald-400/10',color: 'text-emerald-400' },
          ].map(({ label, value, icon, ring, color }) => (
            <div key={label} className="card p-4 text-center hover:bg-dark-hover transition-colors">
              <div className={`w-9 h-9 rounded-xl ${ring} flex items-center justify-center mx-auto mb-2`}>
                <span className={color}>{icon}</span>
              </div>
              <p className="font-heading text-xl font-bold text-soft-white">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Priority Delivery Card ── */}
        {priority && (
          <div className="card border-blaze/25 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blaze animate-pulse" />
                <h2 className="text-sm font-semibold text-soft-white">
                  {priority.status === 'out_for_delivery' ? 'Currently Delivering' : 'Next Priority Delivery'}
                </h2>
              </div>
              <StatusBadge status={priority.status} />
            </div>

            {/* Recipient */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-deepsea flex items-center justify-center text-white font-bold text-sm shrink-0">
                {priority.recipientName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-soft-white">{priority.recipientName}</p>
                <p className="text-xs text-muted">{priority.recipientPhone}</p>
              </div>
            </div>

            {/* Route */}
            <div className="flex gap-3 mb-4">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-muted" />
                <div className="w-px flex-1 bg-dark-border my-1" style={{ minHeight: '1.5rem' }} />
                <div className="w-2.5 h-2.5 rounded-full bg-blaze" />
              </div>
              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <p className="text-xs text-muted uppercase font-semibold tracking-wide">Pickup</p>
                  <p className="text-sm text-soft-white mt-0.5">{priority.pickupAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase font-semibold tracking-wide">Deliver To</p>
                  <p className="text-sm text-soft-white mt-0.5">{priority.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* Date / Slot / Package */}
            <div className="flex flex-wrap gap-4 text-xs text-muted border-t border-dark-border/30 pt-3 mb-4">
              <span className="flex items-center gap-1.5">
                <IconCalendar className="w-3.5 h-3.5" />
                {fmtDateLong(priority.deliveryDate)}
              </span>
              {priority.deliverySlot && (
                <span className="flex items-center gap-1.5">
                  <IconClock className="w-3.5 h-3.5" />
                  {priority.deliverySlot.startTime}–{priority.deliverySlot.endTime}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <IconPackage className="w-3.5 h-3.5" />
                {priority.packageDescription}
              </span>
            </div>

            {/* Progress */}
            <DeliveryProgress status={priority.status} />

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              {NEXT_STATUS[priority.status] && (
                <button disabled={busy === priority._id}
                  onClick={() => progress(priority._id, NEXT_STATUS[priority.status])}
                  className={`btn-primary flex-1 text-sm ${
                    priority.status === 'out_for_delivery' ? '!bg-emerald-600 hover:!bg-emerald-700' : ''
                  }`}>
                  {busy === priority._id ? 'Updating…' : NEXT_LABEL[priority.status]}
                </button>
              )}
              <button onClick={() => navigate(`/orders/${priority._id}`)} className="btn-outline flex-1 text-sm">
                View Details
              </button>
            </div>
          </div>
        )}

        {/* ── Other Active Deliveries ── */}
        {active.filter(o => o._id !== priority?._id).length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-border/40">
              <h3 className="section-title">Other Active Deliveries</h3>
            </div>
            <div className="divide-y divide-dark-border/30">
              {active.filter(o => o._id !== priority?._id).map(o => (
                <div key={o._id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-soft-white">{o.recipientName}</p>
                    <p className="text-xs text-muted mt-0.5">{o.deliveryAddress}</p>
                    <p className="text-xs text-muted">{fmtDate(o.deliveryDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={o.status} />
                    {NEXT_STATUS[o.status] && (
                      <button disabled={busy === o._id}
                        onClick={() => progress(o._id, NEXT_STATUS[o.status])}
                        className="text-xs bg-dark-hover border border-dark-border text-muted hover:text-soft-white px-3 py-1.5 rounded-md transition-colors">
                        {NEXT_LABEL[o.status]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {active.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center mx-auto mb-4">
              <IconTruck className="w-8 h-8 text-muted" />
            </div>
            <p className="font-heading font-semibold text-soft-white mb-1">No active deliveries</p>
            <p className="text-sm text-muted">Deliveries assigned to you will appear here.</p>
          </div>
        )}

        {/* ── Completed History ── */}
        {completed.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-border/40 flex items-center justify-between">
              <h3 className="section-title">Completed Deliveries</h3>
              <span className="text-xs text-muted">{completed.length} total</span>
            </div>
            <div className="divide-y divide-dark-border/30">
              {completed.slice(0, 10).map(o => (
                <div key={o._id}
                  onClick={() => navigate(`/orders/${o._id}`)}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-dark-hover/60 cursor-pointer transition-colors group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-soft-white">{o.recipientName}</p>
                    <p className="text-xs text-muted">{o.deliveryAddress} · {fmtDate(o.deliveryDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={o.status} />
                    <IconChevronRight className="w-4 h-4 text-dark-border group-hover:text-muted transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Tiny local icon to avoid import conflict
function IconClipboard({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
