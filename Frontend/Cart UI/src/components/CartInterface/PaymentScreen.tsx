// PaymentScreen.tsx - FIXED VERSION
import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptScreen } from "./ReceiptScreen";

const BASE_URL = "http://192.168.2.22:8000";

interface PaymentScreenProps {
  paymentData: {
    payment_id: string;
    amount: number;
    order_id: string;
    qr_payload: string;
  };
  onBack: () => void;
  onDone: () => void; // called after successful payment
}

export const PaymentScreen = ({ paymentData, onBack, onDone }: PaymentScreenProps) => {
  const [phase, setPhase] = useState<"pending" | "success" | "failed">("pending");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll /mock-payment/status/{payment_id} until paid or failed
  useEffect(() => {
    if (phase !== "pending" || !paymentData.payment_id) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/mock-payment/status/${paymentData.payment_id}`);
        const data = await res.json();

        if (data.status === "success" || data.status === "paid") {
          clearInterval(pollRef.current!);
          
          // Fetch order items for receipt
          try {
            const oRes = await fetch(`${BASE_URL}/cart/receipt/${paymentData.order_id}`);
            const oData = await oRes.json();
            setOrderItems(oData.items ?? []);
          } catch {
            /* silent */
          }
          
          setPhase("success");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setError("Payment was declined");
          setPhase("failed");
        }
      } catch {
        /* silent network errors */
      }
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, paymentData.payment_id, paymentData.order_id]);

  // Failed
  if (phase === "failed") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center">
          <XCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600">Payment Failed</h2>
          {error && <p className="text-sm text-slate-500">{error}</p>}
          <Button onClick={onBack} className="mt-2">← Back</Button>
        </div>
      </div>
    );
  }

  // Success → show receipt
  if (phase === "success") {
    return (
      <ReceiptScreen
        items={orderItems}
        total={paymentData.amount}
        paymentMethod="upi"
        paymentId={paymentData.payment_id}
        onDone={onDone}
      />
    );
  }

  // Pending: show QR for mobile to scan
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center min-w-[380px] max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Scan & Pay</h2>
        <p className="text-slate-500 text-sm mb-6">
          Open the Cartify app on your phone and tap <strong>"Pay ₹{paymentData.amount.toFixed(2)}"</strong> to scan this code
        </p>

        <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100 mb-4">
          {paymentData.qr_payload ? (
            <QRCodeCanvas value={paymentData.qr_payload} size={220} />
          ) : (
            <div className="w-[220px] h-[220px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
          )}
        </div>

        <p className="font-bold text-3xl text-green-600 mb-2">₹{paymentData.amount.toFixed(2)}</p>

        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for payment…
        </div>

        {paymentData.payment_id && (
          <p className="text-xs text-slate-300 mt-4 font-mono">{paymentData.payment_id}</p>
        )}
      </div>
    </div>
  );
};
