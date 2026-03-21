import { ArrowLeft, Gift, Star, Tag, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';

interface OffersScreenProps {
  onBack: () => void;
}

const API_BASE = "http://10.211.103.220:8000";

export function OffersScreen({ onBack }: OffersScreenProps) {

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const [offers, setOffers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const NEXT_REWARD_POINTS = 3000; // you can change tier logic later

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 Fetch Loyalty Points
        if (user?.user_id) {
          const loyaltyRes = await fetch(`${API_BASE}/user/loyalty/${user.user_id}`);
          const loyaltyData = await loyaltyRes.json();
          setPoints(loyaltyData.loyalty_points || 0);
        }

        // 🔥 Fetch Active Offers
        const offerRes = await fetch(`${API_BASE}/offers/all`);
        const offerData = await offerRes.json();
        if (offerData.offers) {
          setOffers(offerData.offers);
        }

        // 🔥 Fetch User Coupons
        if (user?.user_id) {
          const couponRes = await fetch(`${API_BASE}/coupons/user/${user.user_id}`);
          const couponData = await couponRes.json();
          if (couponData.coupons) {
            setCoupons(couponData.coupons);
          }
        }

      } catch (err) {
        console.error("Failed to fetch offers data", err);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const progressPercent = Math.min(
    (points / NEXT_REWARD_POINTS) * 100,
    100
  );

  const pointsRemaining = Math.max(
    NEXT_REWARD_POINTS - points,
    0
  );

  return (
    <div className="h-full bg-background flex flex-col">

      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-accent rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="flex-1 text-foreground">Offers & Rewards</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {loading && (
          <p className="text-muted-foreground text-sm">Loading...</p>
        )}

        {!loading && (
          <>
            {/* 🔥 Loyalty Points */}
            <Card className="bg-gradient-to-br from-[#FF3347] to-[#FF5566] text-white p-6 rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm">Your Loyalty Points</p>
                  <h2 className="text-4xl mt-1">
                    {points.toLocaleString()}
                  </h2>
                </div>
                <Star className="w-10 h-10 fill-white text-white" />
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to next reward</span>
                  <span>{pointsRemaining} to go</span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-white/20"
                />
              </div>

              <p className="text-white/90 text-sm">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Earn more points with every purchase!
              </p>
            </Card>

            {/* 🔥 Active Offers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-[#FF3347]" />
                <h3>Active Offers</h3>
              </div>

              {offers.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No active offers available.
                </p>
              )}

              <div className="space-y-3">
                {offers.map((offer) => (
                  <Card key={offer.offer_id} className="rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
                      <h4 className="mb-1">{offer.title}</h4>
                      <p className="text-white/90 text-sm">
                        {offer.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* 🔥 User Coupons */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-[#FF3347]" />
                <h3>Your Coupons</h3>
              </div>

              {coupons.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No available coupons.
                </p>
              )}

              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <Card
                    key={coupon.code}
                    className="p-4 rounded-2xl flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {coupon.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Code: {coupon.code}
                      </p>
                    </div>

                    <Badge className="bg-[#FF3347] text-white">
                      {coupon.discount_type === "percent"
                        ? `${coupon.discount_value}% OFF`
                        : `₹${coupon.discount_value} OFF`}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}