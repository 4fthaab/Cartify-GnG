// BillingScreen.tsx - FIXED VERSION with Props Injection
import { ArrowLeft, CheckCircle2, Wallet, Receipt, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BASE_URL, CART_ID } from "@/config";

interface BillingScreenProps {
  cartItems: any[];        // <-- Receive items from parent
  totalAmount: number;     // <-- Receive total from parent
  onBack: () => void;
  onDone: (paymentData: { payment_id: string; amount: number; order_id: string; qr_payload: string; method: string; }) => void;
}

export const BillingScreen = ({ cartItems, totalAmount, onBack, onDone }: BillingScreenProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayNow = async () => {
    if (!paymentMethod) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Get user from localStorage
      const raw = localStorage.getItem("cart_user");
      const userId = raw ? JSON.parse(raw)?.user_id : null;

      // Call /cart/checkout to initiate checkout and create payment session
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

      if (data.error) {
        setError(data.error);
        setIsProcessing(false);
        return;
      }

      // Extract payment session data
      const paymentSession = data.payment_session;

      if (paymentSession?.payment_id) {
        // Pass payment data to parent (goes to PaymentScreen)
        onDone({
          payment_id: paymentSession.payment_id,
          amount: paymentSession.amount || data.order_summary?.total_price || 0,
          order_id: data.order_id,
          qr_payload: paymentSession.qr_payload || "",
          method: paymentMethod
        });
      } else {
        setError("Failed to create payment session");
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "Checkout failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-4 md:p-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        {/* <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          disabled={isProcessing}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Continue Shopping</span>
        </Button> */}

        <div className="flex flex-col items-center">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mt-2">Checkout Summary</h1>
          <p className="text-sm text-slate-600">Review your order and proceed</p>
        </div>

        <div className="w-10 sm:w-24"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Billing Content */}
      <div className="flex-1 flex justify-center items-center w-full pb-4 md:pb-8 overflow-hidden">
        <div className="bg-white rounded-3xl p-6 md:p-4 max-w-3xl w-full flex flex-col max-h-full">

          {/* Bill Title */}
          <div className="flex items-center gap-2 mb-3 border-b pb-3">
            <Receipt className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-slate-800">Your Bill</h2>
          </div>

          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[150px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No items in cart</p>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between border-b border-slate-100 pb-2 text-slate-700 text-sm md:text-base"
                >
                  <div className="flex flex-col sm:flex-row sm:gap-1">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-0">({item.weight_g}g)</span>
                  </div>
                  <div className="font-semibold">₹{item.price.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 text-sm text-slate-700 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-base md:text-lg font-bold text-slate-800">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mb-4">
            <p className="font-semibold text-slate-800 text-sm mb-2">Select Payment Method</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => setPaymentMethod("upi")}
                disabled={isProcessing}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "upi"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod("cash")}
                disabled={isProcessing}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === "cash"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ShoppingCart className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Pay at Counter</span>
              </button>
            </div>
          </div>

          {/* Final Confirm */}
          <Button
            onClick={handlePayNow}
            disabled={!paymentMethod || isProcessing}
            className={`w-full font-bold text-base shadow-lg py-5 ${paymentMethod && !isProcessing
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};