import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptScreen } from "./ReceiptScreen";

interface PaymentScreenProps {
    total: number;
    onBack: () => void;
}

export const PaymentScreen = ({ total, onBack }: PaymentScreenProps) => {
    const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");

    const upiString = `upi://pay?pa=yourstore@upi&pn=Cartify GnG&am=${total}&cu=INR`;

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-green-50">

            {status === "pending" && (
                <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center min-w-[360px]">

                    <h2 className="text-2xl font-bold mb-6">Scan & Pay</h2>

                    <div className="flex justify-center items-center">
                        <QRCodeCanvas value={upiString} size={240} />
                    </div>

                    <p className="mt-6 font-semibold text-lg">₹ {total}</p>

                    <div className="flex gap-4 mt-8">
                        <Button onClick={() => setStatus("success")}>
                            Simulate Success
                        </Button>

                        <Button variant="destructive" onClick={() => setStatus("failed")}>
                            Simulate Failed
                        </Button>
                    </div>

                </div>
            )}

            {status === "success" && (
                <ReceiptScreen
                    items={[
                        { name: "RICE", quantity: "10 Kg", price: 45 },
                        { name: "OIL", quantity: "2 Kg", price: 100 },
                        { name: "SHAMPOO", quantity: "1", price: 3 },
                        { name: "SOAP", quantity: "3", price: 9 },
                    ]}
                    total={total}
                    paymentMethod="upi"
                    paymentId={`TXN${Math.floor(Math.random() * 1000000)}`}
                    onDone={onBack}
                />
            )}

            {status === "failed" && (
                <div className="text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-red-600 mt-4">
                        Payment Failed
                    </h2>
                    <Button onClick={() => setStatus("pending")} className="mt-6">
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
};