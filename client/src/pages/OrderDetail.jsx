import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { IconMapPin, IconCalendar, IconClock, IconTruck, IconPackage } from '../components/Icons';

const ALL_STATUSES = ['pending','confirmed','assigned','out_for_delivery','delivered'];
const STATUS_LABELS = {
  pending:'Pending', confirmed:'Confirmed', assigned:'Assigned',
  out_for_delivery:'Out for Delivery', delivered:'Delivered',
};
const STATUS_DESCS = {
  pending:          'Order received and awaiting review.',
  confirmed:        'Order confirmed by admin.',
  assigned:         'Driver assigned to this delivery.',
  out_for_delivery: 'Driver is on the way to deliver.',
  delivered:        'Package successfully delivered.',
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDT(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-3 py-3 border-b border-dark-border/30 last:border-0">
      <div className="w-5 h-5 mt-0.5 shrink-0 text-muted">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-soft-white">{children}</p>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrderById(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const backPath = { admin: '/admin', driver: '/driver', customer: '/dashboard' }[user?.role] || '/dashboard';

  if (loading) return <AppLayout><div className="flex items-center justify-center py-24 text-muted">Loading…</div></AppLayout>;
  if (error)   return <AppLayout><div className="flex items-center justify-center py-24 text-red-400">{error}</div></AppLayout>;

  const slot    = order.deliverySlot;
  const history = order.statusHistory || [];
  const currentIndex = ALL_STATUSES.indexOf(order.status);

  // Build timeline entries — merge history timestamps into ALL_STATUSES
  const historyMap = {};
  history.forEach((h) => { historyMap[h.status] = h; });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <button onClick={() => navigate(backPath)} className="text-sm text-muted hover:text-soft-white transition-colors">
          ← Back
        </button>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* ── LEFT: Order Info (3/5 cols) ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Header */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h1 className="font-heading text-lg font-bold text-soft-white">Order Details</h1>
                  <p className="font-mono text-xs text-muted mt-0.5">{order._id}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <InfoRow label="Delivery Date" icon={<IconCalendar className="w-5 h-5" />}>
                {fmtDate(order.deliveryDate)}
              </InfoRow>
              {slot && (
                <InfoRow label="Time Slot" icon={<IconClock className="w-5 h-5" />}>
                  {slot.startTime} – {slot.endTime}
                </InfoRow>
              )}
              <InfoRow label="Pickup" icon={<IconMapPin className="w-5 h-5" />}>
                {order.pickupAddress}
              </InfoRow>
              <InfoRow label="Delivery To" icon={<IconMapPin className="w-5 h-5 text-blaze" />}>
                {order.deliveryAddress}
              </InfoRow>
              <InfoRow label="Recipient" icon={<span className="text-xs">👤</span>}>
                {order.recipientName} · {order.recipientPhone}
              </InfoRow>
              <InfoRow label="Package" icon={<IconPackage className="w-5 h-5" />}>
                {order.packageDescription}
              </InfoRow>
              {order.notes && (
                <InfoRow label="Notes" icon={<span>📝</span>}>{order.notes}</InfoRow>
              )}
              <InfoRow label="Booked On" icon={<IconCalendar className="w-5 h-5" />}>
                {fmtDate(order.createdAt)}
              </InfoRow>
            </div>

            {/* Driver card */}
            {order.driver && (
              <div className="card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-deepsea flex items-center justify-center text-white font-bold text-base shrink-0">
                    {order.driver.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-semibold mb-0.5">Assigned Driver</p>
                    <p className="text-sm font-semibold text-soft-white">{order.driver.name}</p>
                    {order.driver.phone && <p className="text-xs text-muted">{order.driver.phone}</p>}
                  </div>
                  <div className="ml-auto">
                    <IconTruck className="w-6 h-6 text-muted" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Timeline (2/5 cols) ── */}
          <div className="lg:col-span-2">
            <div className="card p-5 h-full">
              <h2 className="section-title mb-5">Delivery Progress</h2>
              <ol className="space-y-0">
                {ALL_STATUSES.map((status, i) => {
                  const done    = i <= currentIndex;
                  const active  = i === currentIndex;
                  const entry   = historyMap[status];
                  const isLast  = i === ALL_STATUSES.length - 1;

                  return (
                    <li key={status} className="flex gap-3">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          active ? 'bg-blaze border-blaze shadow-lg shadow-blaze/30' :
                          done   ? 'bg-deepsea border-deepsea' :
                                   'bg-dark-hover border-dark-border'
                        }`}>
                          {done && !active
                            ? <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className={`text-xs font-bold ${active ? 'text-white' : done ? 'text-white' : 'text-muted'}`}>{i+1}</span>
                          }
                        </div>
                        {!isLast && <div className={`w-0.5 flex-1 my-1 min-h-[1.5rem] ${done && i < currentIndex ? 'bg-deepsea' : 'bg-dark-border/40'}`} />}
                      </div>

                      {/* Content */}
                      <div className={`pb-5 min-w-0 ${isLast ? '' : ''}`}>
                        <p className={`text-sm font-semibold ${active ? 'text-blaze' : done ? 'text-soft-white' : 'text-muted'}`}>
                          {STATUS_LABELS[status]}
                        </p>
                        {entry ? (
                          <p className="text-xs text-muted mt-0.5">{fmtDT(entry.changedAt)}{entry.changedBy ? ` · ${entry.changedBy.name}` : ''}</p>
                        ) : (
                          <p className="text-xs text-dark-border mt-0.5">{done ? '' : STATUS_DESCS[status]}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
