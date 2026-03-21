import {
  ArrowLeft,
  PackageCheck,
  Clock,
  MapPin,
  CreditCard,
  Download,
  ShoppingCart
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

const API_BASE = "http://10.211.103.220:8000";

export function RecentOrdersScreen({ onBack }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>("");

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
  }, [user?.user_id]);

  const selected = orders.find(o => o.order_id === selectedOrder);

  // 🔥 Fetch Store Name when an order is selected
  useEffect(() => {
    if (selected?.store_id) {
      const fetchStoreName = async () => {
        try {
          const res = await fetch(`${API_BASE}/store/${selected.store_id}`);
          const data = await res.json();
          // Adjust based on your actual backend response structure
          setStoreName(data.name || data.store?.name || `${selected.store_id}`);
        } catch (err) {
          // Fallback if the endpoint fails or doesn't exist yet
          setStoreName(`Store ${selected.store_id}`);
        }
      };
      fetchStoreName();
    }
  }, [selected?.store_id]);

  // ───────── ORDER DETAIL VIEW (With Print Layout) ─────────
  if (selected) {
    const subtotal = selected.total_price;
    const tax = subtotal * 0.08;

    return (
      <div className="min-h-[100dvh] w-full flex flex-col bg-background print:bg-white print:text-black">

        {/* --- App Header (Hidden on Print) --- */}
        <div className="px-6 py-4 border-b border-border print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border transition-colors hover:bg-accent/80"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-lg">Order Details</h2>
              <p className="text-xs text-muted-foreground">{selected.order_id}</p>
            </div>
            {/* Print / Save PDF Button */}
            <button
              onClick={() => window.print()}
              className="w-10 h-10 bg-[#FF3347]/10 text-[#FF3347] rounded-full flex items-center justify-center hover:bg-[#FF3347]/20 transition-colors"
              title="Save as PDF Receipt"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Scrollable Body (Centered for Print) --- */}
        <div className="flex-1 overflow-y-auto print:overflow-visible px-6 py-6 print:py-8 print:max-w-md print:mx-auto print:w-full space-y-6">
          <div className="flex justify-center items-center">
            {/* Added flex, flex-col, and items-center here */}
            <div className="flex flex-col items-center">
              {/* Minimal Image Logo */}
              <img
                src="../../assets/logo.png"
                alt="Grab n Go Logo"
                className="w-14 h-14 object-contain mb-3"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              />

              {/* Store Name & Receipt Label */}
              <h1 className="text-xl font-bold text-black text-center uppercase tracking-widest">
                {storeName || "Loading Store..."}
              </h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1 uppercase text-center">
                Purchase Receipt
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mt-4 bg-gray-50 px-4 py-1.5 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500">
              Customer: <span className="font-semibold text-black">{user?.name || 'Valued Customer'}</span>
            </p>
          </div>

          {/* --- Order Info Cards --- */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 print:border-none print:shadow-none print:p-0 print:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF3347]/10 rounded-full flex items-center justify-center print:hidden">
                  <PackageCheck className="w-5 h-5 text-[#FF3347]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground print:text-black">
                    Order ID: {selected.order_id}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-2 h-2 text-muted-foreground print:text-gray-500" />
                    <p className="text-xs text-muted-foreground print:text-gray-500">
                      {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <span
                className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium print:bg-green-100 print:text-green-800 print:border print:border-green-200"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                {selected.status}
              </span>
            </div>

            <div className="h-px bg-border print:hidden" /> {/* Divider for App UI */}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between print:flex-col print:gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground print:text-gray-500" />
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  {storeName || selected.store_id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground print:text-gray-500" />
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Paid via {selected.payment_method}
                </p>
              </div>
            </div>
          </div>

          {/* --- Items List --- */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 print:text-black print:border-b-2 print:border-black print:pb-2">
              Items Purchased
            </p>

            <div className="bg-card border border-border rounded-2xl overflow-hidden print:border-none print:rounded-none">
              {selected.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-4 my-4 last:border-0 print:px-0 print:py-2.5 print:border-dashed print:border-gray-300">
                  <div>
                    <p className="text-sm font-medium text-foreground print:text-black">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 print:text-gray-500">
                      Qty: {item.qty} × ₹{(item.price / item.qty).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground print:text-black">
                    ₹{item.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* --- Bill Summary --- */}
          <div className="pt-3 flex justify-between items-center">
            <span className="font-semibold text-foreground print:text-black">Total Paid</span>
            <span className="text-xl font-bold text-[#FF3347] print:text-black">
              ₹{selected.total_price.toFixed(2)}
            </span>
          </div>

          {/* --- Print Footer --- */}
          <div className="hidden print:block text-center mt-12 pt-6 border-t-2 border-dashed border-gray-300 text-xs text-gray-500">
            <p className="font-medium text-black mb-1">Thank you for shopping!</p>
            <p>If you have any questions about your order,</p>
            <p>please show this receipt at the help desk.</p>
            <p className="mt-4 font-mono text-[10px] text-gray-400">POWERED BY CARTIFY-GNG</p>
          </div>

        </div>
      </div>
    );
  }

  // ───────── LIST VIEW ─────────
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">

      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border hover:bg-accent/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="font-semibold text-foreground text-lg">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">
              {orders.length} total orders
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

        {loading && (
          <div className="flex justify-center py-10">
            <p className="text-muted-foreground text-sm animate-pulse">Loading orders...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-10">
            <PackageCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No orders found.</p>
            <p className="text-xs text-muted-foreground mt-1">Your past purchases will appear here.</p>
          </div>
        )}

        {orders.map((order) => (
          <div
            key={order.order_id}
            onClick={() => setSelectedOrder(order.order_id)}
            className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-[#FF3347]/50 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {order.order_id}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium border border-green-200">
                {order.status}
              </span>
            </div>

            <div className="flex justify-between items-end pt-3 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {order.total_items} items
                </p>
                <p className="text-lg font-bold text-foreground">
                  ₹{order.total_price.toFixed(2)}
                </p>
              </div>

              <span className="text-sm text-[#FF3347] font-medium flex items-center gap-1 group-hover:underline">
                View Details
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}