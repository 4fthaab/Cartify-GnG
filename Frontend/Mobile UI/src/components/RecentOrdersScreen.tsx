import { ArrowLeft, PackageCheck, Clock, ChevronRight } from 'lucide-react';

interface Props { onBack: () => void; }

const orders = [
  {
    id: '#ORD-4821',
    date: 'Feb 28, 2026',
    time: '3:45 PM',
    items: ['🍎 Organic Apples', '🥛 Whole Milk', '🍞 Wheat Bread'],
    total: 17.78,
    status: 'Completed',
    itemCount: 3,
  },
  {
    id: '#ORD-4790',
    date: 'Feb 25, 2026',
    time: '11:20 AM',
    items: ['🥬 Baby Spinach', '🧀 Cheddar Cheese', '🍳 Free Range Eggs'],
    total: 22.45,
    status: 'Completed',
    itemCount: 3,
  },
  {
    id: '#ORD-4754',
    date: 'Feb 21, 2026',
    time: '5:10 PM',
    items: ['🍌 Bananas', '🥦 Broccoli', '🍗 Chicken Breast', '🥚 Eggs'],
    total: 31.20,
    status: 'Completed',
    itemCount: 4,
  },
  {
    id: '#ORD-4701',
    date: 'Feb 17, 2026',
    time: '9:55 AM',
    items: ['🍊 Oranges', '🥜 Peanut Butter'],
    total: 11.99,
    status: 'Completed',
    itemCount: 2,
  },
  {
    id: '#ORD-4668',
    date: 'Feb 12, 2026',
    time: '2:30 PM',
    items: ['🥩 Ground Beef', '🧅 Onions', '🍅 Tomatoes', '🫑 Bell Peppers'],
    total: 28.60,
    status: 'Completed',
    itemCount: 4,
  },
];

export function RecentOrdersScreen({ onBack }: Props) {
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

            {/* Divider */}
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
              <button className="flex items-center gap-1 text-xs text-[#FF3347] font-medium">
                View Details <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}