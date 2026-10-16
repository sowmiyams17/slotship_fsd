const CONFIG = {
  pending:          { cls: 'bg-amber-400/10 text-amber-400 ring-amber-400/20',   label: 'Pending' },
  confirmed:        { cls: 'bg-blue-400/10  text-blue-400  ring-blue-400/20',    label: 'Confirmed' },
  assigned:         { cls: 'bg-violet-400/10 text-violet-400 ring-violet-400/20',label: 'Assigned' },
  out_for_delivery: { cls: 'bg-blaze/10 text-blaze ring-blaze/20',               label: 'Out for Delivery' },
  delivered:        { cls: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20', label: 'Delivered' },
};

export default function StatusBadge({ status }) {
  const { cls, label } = CONFIG[status] || { cls: 'bg-muted/10 text-muted ring-muted/20', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
