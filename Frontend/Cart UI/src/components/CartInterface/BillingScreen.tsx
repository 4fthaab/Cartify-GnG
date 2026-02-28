// BillingScreen.tsx
import { ArrowLeft, CheckCircle2, CreditCard, Wallet, Receipt, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BillingScreenProps {
  onBack: () => void;
  onDone: (method: "upi" | "cash") => void;
}

const purchasedItems = [
  { name: "RICE", quantity: "10 Kg", price: 45 },
  { name: "OIL", quantity: "2 Kg", price: 100 },
  { name: "SHAMPOO", quantity: "1", price: 3 },
  { name: "SOAP", quantity: "3", price: 9 },
  { name: "APPLE", quantity: "1 Kg", price: 20 },
  { name: "BANANA", quantity: "1 Kg", price: 10 },
  { name: "BRINJAL", quantity: "500g", price: 2.5 },
];

export const BillingScreen = ({ onBack, onDone }: BillingScreenProps) => {
  const subtotal = purchasedItems.reduce((sum, item) => sum + item.price, 0);
  const savings = 2.5;
  const total = subtotal - savings;



  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Continue Shopping
        </Button>

        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 animate-bounce" />
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Checkout Summary</h1>
          <p className="text-slate-600">Review your order and proceed to payment</p>
        </div>

        <div className="w-24"></div>
      </div>

      {/* Billing Content */}
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full flex flex-col">
          {/* Bill Title */}
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Receipt className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold text-slate-800">Your Bill</h2>
          </div>

          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-3">
            {purchasedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between border-b border-slate-100 pb-2 text-slate-700"
              >
                <div>
                  <span className="font-semibold">{item.name}</span>{" "}
                  <span className="text-sm text-slate-500">({item.quantity})</span>
                </div>
                <div className="font-semibold">${item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 text-sm text-slate-700 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>You Saved</span>
              <span className="font-semibold">-${savings.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-lg font-bold text-slate-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mb-6">
            <p className="font-semibold text-slate-800 mb-3">Select Payment Method</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("upi")}
                className={`flex items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === "upi"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                  }`}
              >
                <Wallet className="h-5 w-5 text-green-500" />
                <span className="font-medium">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === "cash"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                  }`}
              >
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <span className="font-medium">Pay at Counter</span>
              </button>
            </div>
          </div>

          {/* Final Confirm */}
          <Button
            onClick={() => {
              if (paymentMethod === "upi") {
                onDone("upi");   // ✅ correct
              } else if (paymentMethod === "cash") {
                onDone("cash");  // ✅ correct
              }

            }}
            disabled={!paymentMethod}
            size="lg"
            className={`w-full font-bold text-lg shadow-lg ${paymentMethod
              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            Pay Now
          </Button>
        </div>
      </div>
    </div>
  );
};
