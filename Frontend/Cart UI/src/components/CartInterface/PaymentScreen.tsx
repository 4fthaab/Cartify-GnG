import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptScreen } from "./ReceiptScreen";

const BASE_URL = "http://192.168.2.22:8000";
const CART_ID  = "CART109";

interface PaymentScreenProps {
    paymentMethod: "upi" | "cash";
    onBack: () => void;
    onDone: () => void;          // called after successful payment → show receipt / reset
}

export const PaymentScreen = ({ paymentMethod, onBack, onDone }: PaymentScreenProps) => {
    const [phase, setPhase]           = useState<"initiating" | "pending" | "success" | "failed">("initiating");
    const [paymentId, setPaymentId]   = useState<string | null>(null);
    const [qrPayload, setQrPayload]   = useState<string>("");
    const [amount, setAmount]         = useState<number>(0);
    const [orderId, setOrderId]       = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [error, setError]           = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Step 1: Call /cart/checkout to create order + payment session
    useEffect(() => {
        let cancelled = false;
        const initCheckout = async () => {
            try {
                const raw = localStorage.getItem("cart_user");
                const userId = raw ? JSON.parse(raw)?.user_id : null;

                const res = await fetch(`${BASE_URL}/cart/checkout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cart_id: CART_ID,
                        user_id: userId,
                        payment_method: paymentMethod,
                    }),
                });
                const data = await res.json();
                if (cancelled) return;

                if (data.error) { setError(data.error); setPhase("failed"); return; }

                const ps = data.payment_session;
                if (ps?.payment_id) {
                    setPaymentId(ps.payment_id);
                    setQrPayload(ps.qr_payload ?? "");
                    setAmount(ps.amount ?? data.order_summary?.total_price ?? 0);
                    setOrderId(data.order_id);
                    setPhase("pending");
                } else {
                    setError("Failed to create payment session"); setPhase("failed");
                }
            } catch (e: any) {
                if (!cancelled) { setError(e.message ?? "Checkout failed"); setPhase("failed"); }
            }
        };
        initCheckout();
        return () => { cancelled = true; };
    }, [paymentMethod]);

    // ── Step 2: Poll /mock-payment/status/{payment_id} until paid or failed
    useEffect(() => {
        if (phase !== "pending" || !paymentId) return;

        pollRef.current = setInterval(async () => {
            try {
                const res  = await fetch(`${BASE_URL}/mock-payment/status/${paymentId}`);
                const data = await res.json();

                if (data.status === "success" || data.status === "paid") {
                    clearInterval(pollRef.current!);
                    // Fetch order items for receipt
                    try {
                        const oRes  = await fetch(`${BASE_URL}/cart/receipt/${data.order_id ?? orderId}`);
                        const oData = await oRes.json();
                        setOrderItems(oData.items ?? []);
                    } catch { /* silent */ }
                    setPhase("success");
                } else if (data.status === "failed") {
                    clearInterval(pollRef.current!);
                    setPhase("failed");
                }
            } catch { /* silent network errors */ }
        }, 2500);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [phase, paymentId, orderId]);

    // ── Initiating spinner
    if (phase === "initiating") {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-green-50">
                <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-green-500"/>
                    <p className="text-lg font-semibold text-slate-700">Creating payment session…</p>
                </div>
            </div>
        );
    }

    // ── Failed
    if (phase === "failed") {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-red-50">
                <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center">
                    <XCircle className="h-16 w-16 text-red-500"/>
                    <h2 className="text-2xl font-bold text-red-600">Payment Failed</h2>
                    {error && <p className="text-sm text-slate-500">{error}</p>}
                    <Button onClick={onBack} className="mt-2">← Back</Button>
                </div>
            </div>
        );
    }

    // ── Success → show receipt
    if (phase === "success") {
        return (
            <ReceiptScreen
                items={orderItems}
                total={amount}
                paymentMethod={paymentMethod}
                paymentId={paymentId ?? ""}
                onDone={onDone}
            />
        );
    }

    // ── Pending: show QR for mobile to scan
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-green-50">
            <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center min-w-[380px] max-w-md w-full">
                <h2 className="text-2xl font-bold mb-2 text-slate-800">Scan & Pay</h2>
                <p className="text-slate-500 text-sm mb-6">Open the Cartify app on your phone and tap <strong>"Pay ₹{amount.toFixed(2)}"</strong> to scan this code</p>

                <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100 mb-4">
                    {qrPayload ? (
                        <QRCodeCanvas value={qrPayload} size={220}/>
                    ) : (
                        <div className="w-[220px] h-[220px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-300"/>
                        </div>
                    )}
                </div>

                <p className="font-bold text-3xl text-green-600 mb-2">₹{amount.toFixed(2)}</p>

                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    Waiting for payment…
                </div>

                {paymentId && (
                    <p className="text-xs text-slate-300 mt-4 font-mono">{paymentId}</p>
                )}
            </div>
        </div>
    );
};