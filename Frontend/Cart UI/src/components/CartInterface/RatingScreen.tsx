// components/CartInterface/RatingScreen.tsx
import { useState } from "react";
import { Star, MessageSquareHeart, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = "http://10.211.103.220:8000";
const CART_ID = "CART103";
const STORE_ID = "STORE001";

interface RatingScreenProps {
  onDone: () => void;
}

export const RatingScreen = ({ onDone }: RatingScreenProps) => {
  const [ratings, setRatings] = useState({ supermarket: 0, cart: 0, app: 0 });
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (type: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const raw = localStorage.getItem("cart_user");
    const userId = raw ? JSON.parse(raw)?.user_id : "GUEST";

    const targets = [
      { type: "supermarket", id: STORE_ID, rating: ratings.supermarket },
      { type: "cart", id: CART_ID, rating: ratings.cart },
      { type: "app", id: null, rating: ratings.app },
    ];

    try {
      // Submit a rating for each category the user actually interacted with
      for (const target of targets) {
        if (target.rating > 0) {
          await fetch(`${BASE_URL}/user/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              target_type: target.type,
              target_id: target.id,
              rating: target.rating,
              review: review
            })
          });
        }
      }
    } catch (e) {
      console.error("Failed to submit rating", e);
    } finally {
      setIsSubmitting(false);
      onDone(); // Navigate home regardless of success/fail
    }
  };

  const RatingRow = ({ label, type }: { label: string, type: keyof typeof ratings }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <span className="font-semibold text-slate-700 mb-2 sm:mb-0">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => handleStarClick(type, star)} className="focus:outline-none transition-transform hover:scale-110">
            <Star className={`h-8 w-8 ${ratings[type] >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-8 flex flex-col">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquareHeart className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">How was your experience?</h2>
          <p className="text-slate-500 text-sm mt-2">Your feedback helps us improve your shopping journey.</p>
        </div>

        <div className="space-y-3 mb-6">
          <RatingRow label="Store Experience" type="supermarket" />
          <RatingRow label="Smart Cart Hardware" type="cart" />
          <RatingRow label="Cartify App" type="app" />
        </div>

        <textarea
          placeholder="Any other comments or suggestions? (Optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 resize-none h-24"
        />

        <div className="flex gap-3">
          <Button onClick={onDone} variant="outline" className="flex-1 py-6 rounded-xl text-slate-500 border-2">
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-md shadow-lg">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
};