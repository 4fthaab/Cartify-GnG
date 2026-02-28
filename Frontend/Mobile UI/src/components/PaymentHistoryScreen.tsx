import { ArrowLeft, CreditCard, Filter, ChevronDown, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Props { onBack: () => void; }

const payments = [
  { id: 'PAY-9021', orderId: '#ORD-4821', date: 'Feb 28, 2026', amount: 17.78, method: 'Visa •• 4242', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8990', orderId: '#ORD-4790', date: 'Feb 25, 2026', amount: 22.45, method: 'Mastercard •• 8814', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8955', orderId: '#ORD-4754', date: 'Feb 21, 2026', amount: 31.20, method: 'Visa •• 4242', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8902', orderId: '#ORD-4701', date: 'Feb 17, 2026', amount: 11.99, method: 'Apple Pay', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8841', orderId: '#ORD-4668', date: 'Feb 12, 2026', amount: 28.60, method: 'Visa •• 4242', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8790', orderId: '#ORD-4610', date: 'Feb 6, 2026',  amount: 19.35, method: 'Mastercard •• 8814', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8701', orderId: '#ORD-4555', date: 'Jan 30, 2026', amount: 44.10, method: 'Visa •• 4242', status: 'Paid', category: 'Groceries' },
  { id: 'PAY-8640', orderId: '#ORD-4498', date: 'Jan 24, 2026', amount: 15.80, method: 'Apple Pay', status: 'Paid', category: 'Groceries' },
];

const filters = ['All', 'Feb 2026', 'Jan 2026'];

const methodIcon = (method: string) => {
  if (method.includes('Visa')) return '💳';
  if (method.includes('Mastercard')) return '🟠';
  if (method.includes('Apple')) return '🍎';
  return '💳';
};

export function PaymentHistoryScreen({ onBack }: Props) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = activeFilter === 'All'
    ? payments
    : payments.filter(p => p.date.includes(activeFilter.replace(' 2026', '').slice(0, 3)));

  const total = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="h-full w-full flex flex-col bg-background">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Payment History</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>
          </div>
          {/* Filter button */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 bg-accent border border-border rounded-xl px-3 py-2"
          >
            <Filter className="w-4 h-4 text-foreground" />
            <span className="text-xs font-medium text-foreground">{activeFilter}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Filter chips — shown when filter open */}
        {showFilter && (
          <div className="flex gap-2 pb-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setShowFilter(false); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === f
                    ? 'bg-[#FF3347] text-white border-[#FF3347]'
                    : 'bg-accent text-foreground border-border'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Total summary card */}
        <div className="flex items-center justify-between bg-[#FF3347]/5 border border-[#FF3347]/20 rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl font-semibold text-foreground">${total.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Period</p>
            <p className="text-sm font-medium text-foreground">{activeFilter}</p>
          </div>
        </div>
      </div>

      {/* Payment list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {filtered.map((pay) => (
          <div key={pay.id} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">

            {/* Icon */}
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {methodIcon(pay.method)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{pay.orderId}</p>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{pay.method}</p>
              <p className="text-xs text-muted-foreground">{pay.date}</p>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="font-semibold text-foreground">${pay.amount.toFixed(2)}</p>
              <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                {pay.status}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}