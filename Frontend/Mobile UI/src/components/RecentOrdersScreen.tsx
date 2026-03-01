import { ArrowLeft, PackageCheck, Clock, ChevronRight, ChevronDown, MapPin, CreditCard, X } from 'lucide-react';
import { useState } from 'react';

interface Props { onBack: () => void; }

const orders = [
  {
    id: '#ORD-4821',
    date: 'Feb 28, 2026',
    time: '3:45 PM',
    items: ['🍎 Organic Apples', '🥛 Whole Milk', '🍞 Wheat Bread'],
    itemDetails: [
      { name: 'Organic Apples',  qty: '1.2 kg', price: 4.99 },
      { name: 'Whole Milk',      qty: '1 unit',  price: 3.49 },
      { name: 'Wheat Bread',     qty: '1 unit',  price: 2.99 },
    ],
    total: 17.78,
    status: 'Completed',
    itemCount: 3,
    paymentMethod: 'Visa •• 4242',
    store: 'GnG Supermart, Downtown',
  },
  {
    id: '#ORD-4790',
    date: 'Feb 25, 2026',
    time: '11:20 AM',
    items: ['🥬 Baby Spinach', '🧀 Cheddar Cheese', '🍳 Free Range Eggs'],
    itemDetails: [
      { name: 'Baby Spinach',    qty: '0.8 kg', price: 3.20 },
      { name: 'Cheddar Cheese',  qty: '1 unit',  price: 5.49 },
      { name: 'Free Range Eggs', qty: '1 unit',  price: 4.99 },
    ],
    total: 22.45,
    status: 'Completed',
    itemCount: 3,
    paymentMethod: 'Mastercard •• 8814',
    store: 'GnG Supermart, Uptown',
  },
  {
    id: '#ORD-4754',
    date: 'Feb 21, 2026',
    time: '5:10 PM',
    items: ['🍌 Bananas', '🥦 Broccoli', '🍗 Chicken Breast', '🥚 Eggs'],
    itemDetails: [
      { name: 'Bananas',         qty: '1.5 kg', price: 2.99 },
      { name: 'Broccoli',        qty: '0.6 kg', price: 3.20 },
      { name: 'Chicken Breast',  qty: '1.2 kg', price: 8.99 },
      { name: 'Eggs',            qty: '1 unit',  price: 4.99 },
    ],
    total: 31.20,
    status: 'Completed',
    itemCount: 4,
    paymentMethod: 'Visa •• 4242',
    store: 'GnG Supermart, Downtown',
  },
  {
    id: '#ORD-4701',
    date: 'Feb 17, 2026',
    time: '9:55 AM',
    items: ['🍊 Oranges', '🥜 Peanut Butter'],
    itemDetails: [
      { name: 'Oranges',         qty: '1.0 kg', price: 3.99 },
      { name: 'Peanut Butter',   qty: '1 unit',  price: 4.99 },
    ],
    total: 11.99,
    status: 'Completed',
    itemCount: 2,
    paymentMethod: 'Apple Pay',
    store: 'GnG Supermart, Westside',
  },
  {
    id: '#ORD-4668',
    date: 'Feb 12, 2026',
    time: '2:30 PM',
    items: ['🥩 Ground Beef', '🧅 Onions', '🍅 Tomatoes', '🫑 Bell Peppers'],
    itemDetails: [
      { name: 'Ground Beef',     qty: '0.8 kg', price: 9.99 },
      { name: 'Onions',          qty: '0.5 kg', price: 1.99 },
      { name: 'Tomatoes',        qty: '0.6 kg', price: 2.99 },
      { name: 'Bell Peppers',    qty: '0.4 kg', price: 2.49 },
    ],
    total: 28.60,
    status: 'Completed',
    itemCount: 4,
    paymentMethod: 'Visa •• 4242',
    store: 'GnG Supermart, Downtown',
  },
];

export function RecentOrdersScreen({ onBack }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const selected = orders.find(o => o.id === selectedOrder);

  // ── Order Detail View ──────────────────────────────────────────
  if (selected) {
    const subtotal = selected.itemDetails.reduce((s, i) => s + i.price, 0);
    const tax = subtotal * 0.08;

    return (
      <div className="h-full w-full flex flex-col bg-background">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Order Details</h2>
              <p className="text-xs text-muted-foreground">{selected.id}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
              {selected.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Order info card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF3347]/10 rounded-xl flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5 text-[#FF3347]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.id}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{selected.date} · {selected.time}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{selected.store}</p>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">Paid via {selected.paymentMethod}</p>
            </div>
          </div>

          {/* Items section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Items Purchased
            </p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {selected.itemDetails.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">${item.price.toFixed(2)}</p>
                  </div>
                  {i < selected.itemDetails.length - 1 && <div className="h-px bg-border mx-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Bill summary */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Bill Summary
            </p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total Paid</span>
                <span className="font-bold text-[#FF3347] text-base">${selected.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── Orders List View ───────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col bg-background">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">{orders.length} orders this month</p>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-card border border-border rounded-2xl p-4">

            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-[#FF3347]/10 rounded-xl flex items-center justify-center">
                  <PackageCheck className="w-5 h-5 text-[#FF3347]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.id}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{order.date} · {order.time}</p>
                  </div>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
                {order.status}
              </span>
            </div>

            <div className="h-px bg-border mb-3" />

            {/* Items preview */}
            <div className="space-y-1 mb-3">
              {order.items.slice(0, 2).map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">{item}</p>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-[#FF3347]">+{order.items.length - 2} more items</p>
              )}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{order.itemCount} items</p>
                <p className="text-base font-semibold text-foreground">${order.total.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(order.id)}
                className="flex items-center gap-1 text-xs text-[#FF3347] font-medium"
              >
                View Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}