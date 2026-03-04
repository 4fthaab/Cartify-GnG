import { CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

const API_BASE = "http://10.152.93.220:8000";

interface Props {
  onClose: () => void;
}

export function ReportIssueModal({ onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title || !description) return;

    const stored = localStorage.getItem("user");
    if (!stored) {
      setError("User not logged in.");
      return;
    }

    const user = JSON.parse(stored);

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/user/report-issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.user_id,
          subject: title,
          description: description
        })
      });

      const data = await res.json();

      if (data.status === "reported") {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || "Failed to submit issue");
      }

    } catch (err) {
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full bg-background rounded-3xl flex flex-col shadow-2xl overflow-hidden"
        style={{ height: "68%" }}
        onClick={(e) => e.stopPropagation()}
      >

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Submitted!</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Thanks for letting us know. We'll look into it shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-[#FF3347] to-[#FF5566] px-6 pt-6 pb-8 shrink-0">
              <div className="w-11 h-10 rounded-2xl flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Report an Issue</h2>
              <p className="text-sm text-white/80 mt-1">
                Help us improve your experience
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-5 -mt-4 bg-background rounded-t-3xl">

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Issue Title
                </label>
                <input
                  placeholder="e.g. Wrong item scanned..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 rounded-xl border border-border bg-input-background px-4 focus:outline-none focus:border-[#FF3347] text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Description
                </label>
                <textarea
                  placeholder="Tell us what went wrong in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-input-background p-3 resize-none focus:outline-none focus:border-[#FF3347] text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {description.length} / 2000
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

            </div>

            <div className="px-6 pb-6 pt-3 flex gap-3 shrink-0 bg-background">
              <button
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-border text-sm font-medium text-foreground"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!title || !description || loading}
                className="flex-1 h-12 rounded-xl bg-[#FF3347] text-white text-sm font-medium shadow-md disabled:opacity-40"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}