import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../api/orders';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { IconPackage, IconTruck, IconPlus, IconChevronRight, IconClock, IconCalendar } from '../components/Icons';

const STAGES = ['pending', 'confirmed', 'assigned', 'out_for_delivery', 'delivered'];
const LABELS = { pending: 'Pending', confirmed: 'Confirmed', assigned: 'Assigned', out_for_delivery: 'In transit', delivered: 'Delivered' };
const dateText = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not scheduled';
const timeText = (slot) => slot ? `${slot.startTime} – ${slot.endTime}` : 'Time not assigned';

function Stat({ label, value, description, icon, tone = 'text-blaze' }) {
  return (
    <div className="rounded-2xl border border-dark-border/70 bg-dark-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blaze/30">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">{label}</p>
        <span className={tone}>{icon}</span>
      </div>
      <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-soft-white">{value}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

function Timeline({ status }) {
  const current = STAGES.indexOf(status);
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {STAGES.map((stage, index) => (
        <div key={stage} className="min-w-0">
          <div className={`h-1.5 rounded-full transition-colors duration-300 ${index <= current ? 'bg-blaze' : 'bg-dark-border'}`} />
          <p className={`mt-2 text-[9px] sm:text-[10px] leading-tight ${index === current ? 'font-semibold text-blaze' : 'text-muted'}`}>
            {LABELS[stage]}
          </p>
        </div>
      ))}
    </div>
  );
}

function Route({ order }) {
  return (
    <div className="rounded-xl border border-dark-border/70 bg-[#16232A]/80 p-5">
      <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Delivery route</p>
      <div className="flex gap-4">
        <div className="flex flex-col items-center pt-1">
          <span className="h-3 w-3 rounded-full border-2 border-teal-400" />
          <span className="my-1 min-h-12 w-px flex-1 border-l border-dashed border-teal-400/60" />
          <span className="h-3 w-3 rounded-full bg-blaze shadow-lg shadow-blaze/40" />
        </div>
        <div className="min-w-0 flex-1 space-y-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pickup location</p>
            <p className="mt-1 break-words text-sm font-medium text-soft-white">{order.pickupAddress || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Drop-off location</p>
            <p className="mt-1 break-words text-sm font-medium text-soft-white">{order.deliveryAddress || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = () => {
    setLoading(true);
    setError('');
    getMyOrders()
      .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load orders. Please check your connection.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadOrders(); }, []);

  const active = orders.filter((order) => order.status !== 'delivered');
  const delivered = orders.filter((order) => order.status === 'delivered');
  const priority = active.find((order) => order.status === 'out_for_delivery') || active.find((order) => order.status === 'assigned') || active[0];
  const upcoming = [...active].filter((order) => order.deliveryDate).sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-5 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-dark-border/70 bg-gradient-to-r from-[#203b42] via-[#1c343b] to-[#393031] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-blaze/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blaze">Customer portal / Overview</p>
              <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-soft-white sm:text-3xl">{greeting}, {user?.name || 'Customer'} <span aria-hidden="true">👋</span></h1>
              <p className="mt-2 text-sm text-muted">Your deliveries, booking activity and progress — all in one place.</p>
            </div>
            <button onClick={() => navigate('/book')} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 self-start px-5 py-3 sm:self-auto">
              <IconPlus className="h-4 w-4" /> Book a delivery
            </button>
          </div>
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"><span>{error}</span><button onClick={loadOrders} className="rounded-lg border border-red-400/30 px-3 py-1.5 font-semibold">Retry</button></div>}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat label="Total orders" value={loading ? '—' : orders.length} description="All delivery bookings" icon={<IconPackage className="h-5 w-5" />} />
          <Stat label="Active deliveries" value={loading ? '—' : active.length} description="Awaiting or in progress" icon={<IconTruck className="h-5 w-5" />} />
          <Stat label="Completed" value={loading ? '—' : delivered.length} description="Successfully delivered" tone="text-emerald-400" icon={<IconPackage className="h-5 w-5" />} />
          <Stat label="Next scheduled" value={loading ? '—' : upcoming ? dateText(upcoming.deliveryDate) : '—'} description={upcoming ? timeText(upcoming.deliverySlot) : 'No upcoming booking'} tone="text-amber-400" icon={<IconCalendar className="h-5 w-5" />} />
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-5"><div className="h-96 animate-pulse rounded-2xl bg-dark-card lg:col-span-3" /><div className="h-96 animate-pulse rounded-2xl bg-dark-card lg:col-span-2" /></div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-5">
            <section className="overflow-hidden rounded-2xl border border-blaze/20 bg-dark-card lg:col-span-3">
              <div className="flex items-center justify-between gap-3 border-b border-dark-border/60 px-5 py-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blaze">Live order overview</p><h2 className="mt-1 font-heading text-lg font-bold text-soft-white">{priority ? 'Your active delivery' : 'Your delivery workspace'}</h2></div>
                {priority && <StatusBadge status={priority.status} />}
              </div>
              {priority ? (
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-xs text-muted">Delivering to</p><p className="mt-1 text-lg font-semibold text-soft-white">{priority.recipientName || 'Recipient'}</p></div>
                    <span className="rounded-lg border border-dark-border px-3 py-2 text-xs text-muted">{dateText(priority.deliveryDate)}</span>
                  </div>
                  <Route order={priority} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-dark-hover/70 p-4"><p className="flex items-center gap-2 text-xs text-muted"><IconClock className="h-4 w-4" /> Delivery window</p><p className="mt-2 text-sm font-semibold text-soft-white">{timeText(priority.deliverySlot)}</p></div>
                    <div className="rounded-xl bg-dark-hover/70 p-4"><p className="flex items-center gap-2 text-xs text-muted"><IconPackage className="h-4 w-4" /> Package</p><p className="mt-2 break-words text-sm font-semibold text-soft-white">{priority.packageDescription || 'Not specified'}</p></div>
                  </div>
                  {priority.driver && <p className="text-xs text-muted">Assigned driver: <span className="font-semibold text-soft-white">{priority.driver.name}</span></p>}
                  <div className="rounded-xl border border-dark-border/60 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold text-soft-white">Delivery progress</h3><span className="text-[10px] text-muted">{Math.max(0, STAGES.indexOf(priority.status) + 1)} / 5 stages</span></div><Timeline status={priority.status} /></div>
                  <button onClick={() => navigate(`/orders/${priority._id}`)} className="btn-primary flex w-full items-center justify-center gap-2">Track delivery <IconChevronRight className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><div className="mb-4 rounded-2xl bg-blaze/10 p-4"><IconTruck className="h-8 w-8 text-blaze" /></div><h3 className="font-heading text-lg font-semibold text-soft-white">No active deliveries</h3><p className="mt-2 max-w-sm text-sm text-muted">When you schedule a delivery, its route and progress will appear here.</p><button onClick={() => navigate('/book')} className="btn-primary mt-5">Schedule delivery</button></div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-dark-border/70 bg-dark-card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-dark-border/60 px-5 py-4"><h2 className="font-heading text-base font-semibold text-soft-white">Recent orders</h2><span className="text-xs text-muted">{orders.length} total</span></div>
              {orders.length ? <div className="divide-y divide-dark-border/50">{orders.slice(0, 8).map((order) => <button key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-dark-hover/70"><div className="rounded-xl bg-blaze/10 p-2.5"><IconTruck className="h-4 w-4 text-blaze" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-soft-white">{order.deliveryAddress || 'Delivery'}</p><p className="mt-1 text-xs text-muted">{dateText(order.deliveryDate)} · {timeText(order.deliverySlot)}</p></div><div className="flex shrink-0 items-center gap-2"><StatusBadge status={order.status} /><IconChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" /></div></button>)}</div> : <div className="p-10 text-center"><IconPackage className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm font-semibold text-soft-white">No orders yet</p><p className="mt-1 text-xs text-muted">Your booking history will appear here.</p></div>}
              <div className="border-t border-dark-border/50 bg-dark-hover/30 px-5 py-4"><p className="text-xs text-muted">Need another delivery?</p><button onClick={() => navigate('/book')} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blaze hover:underline"><IconPlus className="h-4 w-4" /> Create a new booking</button></div>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
