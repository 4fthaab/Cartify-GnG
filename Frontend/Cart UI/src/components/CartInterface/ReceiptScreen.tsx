import { CheckCircle2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptScreenProps {
  items: { name: string; quantity: string; price: number }[];
  total: number;
  paymentMethod: string;
  paymentId: string;
  onDone: () => void;
}


export const ReceiptScreen = ({
  items,
  total,
  paymentMethod,
  paymentId,
  onDone,
}: ReceiptScreenProps) => {
  const date = new Date().toLocaleString();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-100 p-6">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">

        <div className="flex flex-col items-center mb-6">
          <CheckCircle2 className="h-14 w-14 text-green-500 mb-2" />
          <h2 className="text-2xl font-bold text-green-600">
            Payment Successful
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <Receipt className="h-5 w-5 text-slate-600" />
          <span className="font-semibold text-slate-700">Transaction Receipt</span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.name} ({item.quantity})</span>
              <span>₹ {item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹ {total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>Payment Method</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>

          <div className="flex justify-between">
            <span>Payment ID</span>
            <span>{paymentId}</span>
          </div>

          <div className="flex justify-between">
            <span>Date</span>
            <span>{date}</span>
          </div>
        </div>

        <Button
          onClick={onDone}
          className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
        >
          Done
        </Button>
      </div>
    </div>
  );
};