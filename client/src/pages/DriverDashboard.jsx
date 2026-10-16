import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDriverOrders, updateOrderStatus } from '../api/admin';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { IconTruck, IconPackage, IconClock, IconCalendar, IconChevronRight } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const NEXT_STATUS = { assigned: 'out_for_delivery', out_for_delivery: 'delivered' };
const NEXT_LABEL = { assigned: 'Start Delivery', out_for_delivery: 'Mark Delivered' };
const STAGES = ['assigned', 'out_for_delivery', 'delivered'];
const STAGE_LABELS = ['Assigned', 'In transit', 'Delivered'];

function fmtDate(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not scheduled' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Progress({ status }) {
  const current = STAGES.indexOf(status);
  return (
    <div className="grid grid-cols-3 gap-2" aria-label={`Delivery status: ${status.replaceAll('_', ' ')}`}>
      {STAGES.map((stage, index) => (
        <div key={stage}>
          <div className={`h-1.5 rounded-full ${index <= current ? 'bg-blaze' : 'bg-dark-border'}`} />
          <p className={`mt-2 text-[11px] ${index === current ? 'font-semibold text-blaze' : 'text-muted'}`}>{STAGE_LABELS[index]}</p>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, detail, icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dark-border bg-dark-card p-5 transition-colors hover:bg-dark-hover">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${accent}`} />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
        <span className="text-blaze">{icon}</span>
      </div>
      <p className="relative mt-4 font-heading text-4xl font-bold text-soft-white">{value}</p>
      <p className="relative mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function Route({ order }) {
  return (
    <div className="rounded-xl border border-dark-border/70 bg-[#16232A]/70 p-5">
      <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted">Delivery route</p>
      <div className="flex gap-4">
        <div className="flex flex-col items-center pt-1">
          <span className="h-3 w-3 rounded-full border-[3px] border-[#69D4CB] bg-dark-card" />
          <span className="my-1 min-h-14 w-px flex-1 border-l border-dashed border-[#69D4CB]/60" />
          <span className="h-3 w-3 rounded-full bg-blaze shadow-[0_0_15px_rgba(255,91,4,0.55)]" />
        </div>
        <div className="min-w-0 flex-1 space-y-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Pickup location</p>
            <p className="mt-1 break-words text-sm font-semibold text-soft-white">{order.pickupAddress || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Drop-off location</p>
            <p className="mt-1 break-words text-sm font-semibold text-soft-white">{order.deliveryAddress || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getDriverOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load deliveries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const progress = async (id, status) => {
    setBusy(id);
    setError('');
    try {
      await updateOrderStatus(id, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update delivery status.');
    } finally {
      setBusy('');
    }
  };

  const assigned = orders.filter((o) => o.status === 'assigned');
  const inTransit = orders.filter((o) => o.status === 'out_for_delivery');
  const active = orders.filter((o) => o.status !== 'delivered');
  const completed = orders.filter((o) => o.status === 'delivered');
  const priority = inTransit[0] || assigned[0] || active[0];
  const remaining = active.filter((o) => o._id !== priority?._id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <section className="relative overflow-hidden rounded-3xl border border-dark-border bg-gradient-to-br from-[#223A41] via-[#1B3037] to-[#16232A] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blaze/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF9B67]">Driver dispatch / Overview</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-soft-white sm:text-4xl">{greeting}, {user?.name || 'Driver'} <span aria-hidden="true">👋</span></h1>
              <p className="mt-2 text-sm text-muted">Your deliveries, priorities, and progress — all in one place.</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#69D4CB]/20 bg-[#075056]/40 px-5 py-3">
              <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span>
              <div><p className="text-xs font-semibold text-soft-white">Dispatch overview</p><p className="text-xs text-muted">{active.length} active deliveries</p></div>
            </div>
          </div>
        </section>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}

        {loading ? <div className="rounded-2xl border border-dark-border bg-dark-card p-12 text-center text-muted">Loading your deliveries…</div> : <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric label="Assigned" value={assigned.length} detail="Ready for dispatch" icon={<IconPackage className="h-6 w-6" />} accent="bg-violet-400/10" />
            <Metric label="In transit" value={inTransit.length} detail="Deliveries underway" icon={<IconTruck className="h-6 w-6" />} accent="bg-blaze/15" />
            <Metric label="Completed" value={completed.length} detail="Successfully delivered" icon={<IconPackage className="h-6 w-6" />} accent="bg-emerald-400/10" />
          </section>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,1fr)]">
            <section className="overflow-hidden rounded-2xl border border-blaze/25 bg-dark-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border/60 px-5 py-5 sm:px-6">
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blaze">Your next move</p><h2 className="mt-1 font-heading text-xl font-bold text-soft-white">Priority delivery</h2></div>
                {priority && <StatusBadge status={priority.status} />}
              </div>
              {priority ? <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deepsea text-lg font-bold text-soft-white">{priority.recipientName?.charAt(0)?.toUpperCase() || 'D'}</div><div><p className="font-semibold text-soft-white">{priority.recipientName || 'Recipient'}</p><p className="text-xs text-muted">{priority.recipientPhone || 'No phone provided'}</p></div></div>
                  <div className="rounded-xl border border-dark-border px-3 py-2 text-xs text-muted"><IconCalendar className="mr-1 inline h-4 w-4" />{fmtDate(priority.deliveryDate)}</div>
                </div>
                <Route order={priority} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-dark-hover/70 p-4"><p className="mb-2 text-xs text-muted"><IconClock className="mr-1 inline h-4 w-4" />Delivery window</p><p className="font-semibold text-soft-white">{priority.deliverySlot ? `${priority.deliverySlot.startTime} – ${priority.deliverySlot.endTime}` : 'Not specified'}</p></div>
                  <div className="rounded-xl bg-dark-hover/70 p-4"><p className="mb-2 text-xs text-muted"><IconPackage className="mr-1 inline h-4 w-4" />Package</p><p className="break-words font-semibold text-soft-white">{priority.packageDescription || 'No description'}</p></div>
                </div>
                <div className="rounded-xl border border-dark-border/60 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-soft-white">Delivery progress</h3><span className="text-xs text-muted">{STAGES.indexOf(priority.status) + 1} / 3 stages</span></div><Progress status={priority.status} /></div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {NEXT_STATUS[priority.status] && <button type="button" disabled={busy === priority._id} onClick={() => progress(priority._id, NEXT_STATUS[priority.status])} className="btn-primary flex-1 disabled:opacity-50">{busy === priority._id ? 'Updating…' : NEXT_LABEL[priority.status]}</button>}
                  <button type="button" onClick={() => navigate(`/orders/${priority._id}`)} className="btn-outline flex-1">View delivery details</button>
                </div>
              </div> : <div className="p-12 text-center"><IconTruck className="mx-auto mb-4 h-10 w-10 text-muted" /><p className="font-semibold text-soft-white">No active deliveries</p><p className="mt-1 text-sm text-muted">Your next assignment will appear here.</p></div>}
            </section>

            <aside className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-dark-border bg-dark-card">
                <div className="flex items-center justify-between border-b border-dark-border/60 px-5 py-4"><h2 className="font-heading text-base font-bold text-soft-white">Delivery queue</h2><span className="rounded-full bg-blaze/10 px-3 py-1 text-xs font-semibold text-blaze">{remaining.length} waiting</span></div>
                {remaining.length ? <div className="divide-y divide-dark-border/50">{remaining.map((order) => <div key={order._id} className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-soft-white">{order.recipientName || 'Recipient'}</p><p className="mt-1 truncate text-xs text-muted">{order.deliveryAddress || 'No address'}</p><p className="mt-1 text-xs text-muted">{fmtDate(order.deliveryDate)}</p></div><StatusBadge status={order.status} /></div><div className="mt-3 flex flex-wrap gap-2">{NEXT_STATUS[order.status] && <button type="button" disabled={busy === order._id} onClick={() => progress(order._id, NEXT_STATUS[order.status])} className="rounded-lg bg-blaze px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === order._id ? 'Updating…' : NEXT_LABEL[order.status]}</button>}<button type="button" onClick={() => navigate(`/orders/${order._id}`)} className="rounded-lg border border-dark-border px-3 py-2 text-xs text-muted hover:text-soft-white">Details</button></div></div>)}</div> : <p className="p-6 text-sm text-muted">No other deliveries in your queue.</p>}
              </section>
              <section className="overflow-hidden rounded-2xl border border-dark-border bg-dark-card"><div className="flex items-center justify-between border-b border-dark-border/60 px-5 py-4"><h2 className="font-heading text-base font-bold text-soft-white">Completed deliveries</h2><span className="text-xs text-muted">{completed.length} total</span></div>{completed.length ? <div className="divide-y divide-dark-border/50">{completed.slice(0, 8).map((order) => <button type="button" key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-dark-hover"><div className="min-w-0"><p className="truncate text-sm font-semibold text-soft-white">{order.recipientName || 'Recipient'}</p><p className="mt-1 truncate text-xs text-muted">{fmtDate(order.deliveryDate)} · {order.deliveryAddress || 'Delivery'}</p></div><IconChevronRight className="h-4 w-4 shrink-0 text-muted" /></button>)}</div> : <p className="p-6 text-sm text-muted">No completed deliveries yet.</p>}</section>
            </aside>
          </div>
        </>}
      </div>
    </AppLayout>
  );
}
