// components/CartInterface/HelpModal.tsx
import { useState } from "react";
import { HelpCircle, X, AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";

const BASE_URL = "http://10.68.201.220:8000";

export const HelpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("Cart");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);

    const raw = localStorage.getItem("cart_user");
    const userId = raw ? JSON.parse(raw)?.user_id : "GUEST";

    try {
      await fetch(`${BASE_URL}/user/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          subject: subject,
          description: description,
          store_id: "STORE001",
        })
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setDescription("");
      }, 2500);
    } catch (e) {
      console.error("Failed to submit issue", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[9990] bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:bg-slate-700 transition-transform hover:scale-105 flex items-center gap-2 font-bold text-sm"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Need Help?</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            <div className="bg-slate-800 p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 font-bold text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Report an Issue
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Issue Reported</h3>
                  <p className="text-slate-500 mt-2">Staff has been notified and will assist you shortly if needed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">What is the issue regarding?</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="Cart">Smart Cart Hardware</option>
                      <option value="App">Cartify App / Scanner</option>
                      <option value="Supermarket">Item / Store Layout</option>
                      <option value="Payment">Billing / Payment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Describe the problem</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="E.g., An item didn't scan properly, cart battery is low..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 h-32 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !description.trim()}
                    className="w-full py-4 mt-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    Submit Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};