import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Banknote,
  Search,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';

interface Props {
  onBack: () => void;
}

const API_BASE = "http://10.168.168.220:8000";

export function PaymentHistoryScreen({ onBack }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  useEffect(() => {
    if (!user?.user_id) return;

    const fetchPayments = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/payments/${user.user_id}`);
        const data = await res.json();
        if (data.payments) setPayments(data.payments);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }
      setLoading(false);
    };
    fetchPayments();
  }, [user?.user_id]);

  const totalSpent = payments.reduce((s, p) => s + p.amount, 0);
  const filteredPayments = payments.filter(p =>
    p.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payment_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] w-full mt-4 flex flex-col bg-background">
      {/* Header & Dashboard */}
      <div className="bg-card px-6 pt-4 pb-6 border-b border-border shrink-0 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-border">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-xl text-foreground">Payment History</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              {payments.length} Transactions
            </p>
          </div>
        </div>

        {/*Summary Dashboard*/}
        <div className="flex justify-center items-center mt-2">
          <div className="w-full max-w-sm bg-gradient-to-br from-[#FF3347] to-[#FF5566] rounded-3xl p-6 text-white shadow-lg shadow-[#FF3347]/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

            <div className="flex flex-col items-center justify-center text-center relative z-10">
              <div className="flex items-center gap-2 mb-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em]">Total Expenditure</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-medium opacity-80">₹</span>
                <p className="text-4xl font-black tracking-tight">
                  {totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Order or Payment ID..."
            className="pl-10 h-11 bg-accent/30 border-none rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <p className="text-center py-20 text-sm text-muted-foreground">Syncing records...</p>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No records found</p>
          </div>
        ) : (
          filteredPayments.map((pay) => {
            const isSuccess = pay.status === "success" || pay.status === "paid";
            const isUPI = pay.method?.toLowerCase() === "upi";

            return (
              <div key={pay.payment_id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSuccess ? "bg-green-500/5 text-green-600" : "bg-yellow-500/5 text-yellow-600"
                    }`}>
                    {isUPI ? <Smartphone className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-foreground uppercase truncate">
                            {pay.order_id}
                          </p>
                          {isSuccess ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(pay.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <p className="font-bold text-foreground">₹{pay.amount.toFixed(2)}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-accent rounded text-muted-foreground">
                          {pay.method || 'cash'}
                        </span>
                        <p className="text-[10px] font-mono text-muted-foreground opacity-60">
                          Ref: {pay.payment_id.slice(6)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSuccess ? "text-green-600" : "text-yellow-600"
                        }`}>
                        {pay.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}