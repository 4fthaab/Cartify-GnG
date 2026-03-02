import {
  ArrowLeft,
  PackageCheck,
  Clock,
  ChevronRight,
  MapPin,
  CreditCard
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

const API_BASE = "http://192.168.2.22:8000";

export function RecentOrdersScreen({ onBack }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  // 🔥 Fetch orders from backend
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/orders/${user.user_id}`);
        const data = await res.json();

        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }

      setLoading(false);
    };

    fetchOrders();
  }, []);

  const selected = orders.find(o => o.order_id === selectedOrder);

  // ───────── ORDER DETAIL VIEW ─────────
  if (selected) {
    const subtotal = selected.total_price;
    const tax = subtotal * 0.08;

    return (
      <div className="h-full w-full flex flex-col bg-background">

        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Order Details</h2>
              <p className="text-xs text-muted-foreground">
                {selected.order_id}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
              {selected.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-[#FF3347]" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selected.order_id}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Store: {selected.store_id}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Paid via {selected.payment_method}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Items Purchased
            </p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {selected.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between px-4 py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.qty}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    ₹{item.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bill */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (8%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total Paid</span>
              <span className="text-[#FF3347]">
                ₹{selected.total_price.toFixed(2)}
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ───────── LIST VIEW ─────────
  return (
    <div className="h-full w-full flex flex-col bg-background">

      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">
              {orders.length} total orders
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

        {loading && (
          <p className="text-muted-foreground text-sm">Loading orders...</p>
        )}

        {!loading && orders.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No orders found.
          </p>
        )}

        {orders.map((order) => (
          <div key={order.order_id} className="bg-card border border-border rounded-2xl p-4">

            <div className="flex justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {order.order_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
                {order.status}
              </span>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {order.total_items} items
                </p>
                <p className="text-base font-semibold text-foreground">
                  ₹{order.total_price.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(order.order_id)}
                className="text-xs text-[#FF3347] font-medium"
              >
                View Details →
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}