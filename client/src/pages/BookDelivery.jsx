import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSlots, createOrder } from '../api/orders';
import AppLayout from '../components/AppLayout';
import { IconCalendar, IconClock, IconMapPin, IconPackage } from '../components/Icons';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

const STEPS = [
  { label: 'Date & Slot', icon: <IconCalendar className="w-4 h-4" /> },
  { label: 'Details',    icon: <IconMapPin className="w-4 h-4" /> },
  { label: 'Confirm',    icon: <IconPackage className="w-4 h-4" /> },
];

function Stepper({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              i < current  ? 'bg-blaze text-white' :
              i === current? 'bg-blaze text-white ring-4 ring-blaze/20' :
                             'bg-dark-hover text-muted'
            }`}>
              {i < current
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : s.icon
              }
            </div>
            <span className={`text-xs mt-1.5 font-medium hidden sm:block ${i <= current ? 'text-soft-white' : 'text-muted'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 mb-4 transition-colors ${i < current ? 'bg-blaze' : 'bg-dark-border'}`} style={{width: '3rem'}} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookDelivery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    pickupAddress:'', deliveryAddress:'', recipientName:'',
    recipientPhone:'', packageDescription:'', notes:'',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleDateChange = async (e) => {
    const val = e.target.value;
    setDate(val); setSelectedSlot(null); setSlots([]); setSlotsError('');
    if (!val) return;
    setSlotsLoading(true);
    try {
      const { data } = await getSlots(val);
      setSlots(data);
      if (data.length === 0) setSlotsError('No available slots for this date.');
    } catch (err) { setSlotsError(err.response?.data?.message || 'Failed to load slots'); }
    finally { setSlotsLoading(false); }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return setSubmitError('Please select a time slot.');
    setSubmitError(''); setSubmitLoading(true);
    try {
      await createOrder({ ...form, slotId: selectedSlot._id, deliveryDate: date });
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Booking failed');
    } finally { setSubmitLoading(false); }
  };

  const canStep2 = date && selectedSlot;
  const canStep3 = form.pickupAddress && form.deliveryAddress && form.recipientName && form.recipientPhone && form.packageDescription;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="page-title mb-6">Book a Delivery</h1>
        <Stepper current={step} />

        {/* ─── STEP 0: Date & Slot ─── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconCalendar className="w-5 h-5 text-blaze" />
                <h2 className="text-sm font-semibold text-soft-white">Select Delivery Date</h2>
              </div>
              <input type="date" min={todayStr()} value={date} onChange={handleDateChange}
                className="input-field max-w-xs" />
            </div>

            {date && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <IconClock className="w-5 h-5 text-blaze" />
                  <h2 className="text-sm font-semibold text-soft-white">Choose a Time Slot</h2>
                </div>
                {slotsLoading && (
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-dark-hover animate-pulse" />)}
                  </div>
                )}
                {slotsError && <p className="text-sm text-red-400">{slotsError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {slots.map((slot) => {
                    const isSel = selectedSlot?._id === slot._id;
                    const full  = slot.available === 0;
                    return (
                      <button key={slot._id} type="button" disabled={full}
                        onClick={() => !full && setSelectedSlot(slot)}
                        className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-150 ${
                          isSel  ? 'border-blaze bg-blaze/10 ring-1 ring-blaze/30' :
                          full   ? 'border-dark-border/30 opacity-40 cursor-not-allowed bg-dark-hover/30' :
                                   'border-dark-border hover:border-blaze/40 hover:bg-dark-hover'
                        }`}>
                        <p className={`text-sm font-bold ${isSel ? 'text-blaze' : 'text-soft-white'}`}>
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className={`text-xs mt-1 ${full ? 'text-red-400' : 'text-muted'}`}>
                          {full ? 'Fully booked' : `${slot.available} spot${slot.available !== 1 ? 's' : ''} left`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {canStep2 && (
              <button onClick={() => setStep(1)} className="btn-primary w-full">Continue to Details →</button>
            )}
          </div>
        )}

        {/* ─── STEP 1: Details ─── */}
        {step === 1 && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <IconMapPin className="w-5 h-5 text-blaze" />
              <h2 className="text-sm font-semibold text-soft-white">Delivery Details</h2>
            </div>
            {[
              { label: 'Pickup Address',       name: 'pickupAddress',       ph: '123 Sender St' },
              { label: 'Delivery Address',     name: 'deliveryAddress',     ph: '456 Receiver Ave' },
              { label: 'Recipient Name',       name: 'recipientName',       ph: 'Jane Doe' },
              { label: 'Recipient Phone',      name: 'recipientPhone',      ph: '+1 555 000 0000' },
              { label: 'Package Description',  name: 'packageDescription',  ph: 'Small box, fragile electronics' },
            ].map(({ label, name, ph }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input type="text" name={name} required value={form[name]}
                  onChange={handleChange} placeholder={ph} className="input-field" />
              </div>
            ))}
            <div>
              <label className="label">Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                placeholder="Leave at door, ring bell, etc." className="input-field" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="btn-outline flex-1">← Back</button>
              <button onClick={() => canStep3 && setStep(2)} disabled={!canStep3} className="btn-primary flex-1">
                Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Confirm ─── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{submitError}</div>
            )}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <IconPackage className="w-5 h-5 text-blaze" />
                <h2 className="text-sm font-semibold text-soft-white">Booking Summary</h2>
              </div>

              {/* Highlighted slot */}
              <div className="bg-blaze/10 border border-blaze/20 rounded-xl p-4 mb-5">
                <p className="text-xs text-muted mb-1">Selected slot</p>
                <p className="text-base font-bold text-blaze">{fmtDate(date)}</p>
                <p className="text-sm text-soft-white">{selectedSlot?.startTime} – {selectedSlot?.endTime}</p>
              </div>

              <div className="space-y-3">
                {[
                  ['Pickup',    form.pickupAddress],
                  ['Delivery',  form.deliveryAddress],
                  ['Recipient', `${form.recipientName} · ${form.recipientPhone}`],
                  ['Package',   form.packageDescription],
                  ...(form.notes ? [['Notes', form.notes]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4 text-sm">
                    <span className="text-muted text-xs font-semibold uppercase w-20 shrink-0 pt-0.5">{k}</span>
                    <span className="text-soft-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">← Back</button>
              <button type="submit" disabled={submitLoading} className="btn-primary flex-1">
                {submitLoading ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
