import {
  ArrowLeft,
  CreditCard,
  CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

const API_BASE = "http://10.211.103.220:8000";

export function PaymentHistoryScreen({ onBack }: Props) {

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  // 🔥 Fetch payments from backend
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchPayments = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/payments/${user.user_id}`);
        const data = await res.json();

        if (data.payments) {
          setPayments(data.payments);
        }
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }

      setLoading(false);
    };

    fetchPayments();
  }, []);

  const total = payments.reduce((s, p) => s + p.amount, 0);

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
            <p className="text-xs text-muted-foreground">
              {payments.length} transactions
            </p>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between bg-[#FF3347]/5 border border-[#FF3347]/20 rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl font-semibold text-foreground">
              ₹{total.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="text-sm font-medium text-foreground">INR</p>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

        {loading && (
          <p className="text-muted-foreground text-sm">
            Loading payments...
          </p>
        )}

        {!loading && payments.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No payments found.
          </p>
        )}

        {payments.map((pay) => (
          <div key={pay.payment_id} className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">

            {/* Icon */}
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {pay.order_id}
                </p>

                {pay.status === "success" || pay.status === "paid" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                Payment ID: {pay.payment_id}
              </p>

              <p className="text-xs text-muted-foreground">
                {new Date(pay.created_at).toLocaleString()}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ₹{pay.amount.toFixed(2)}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${pay.status === "success" || pay.status === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
                }`}>
                {pay.status}
              </span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}