import { ArrowLeft, Gift, Star, Tag, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

interface OffersScreenProps {
  onBack: () => void;
}

export function OffersScreen({ onBack }: OffersScreenProps) {
  const offers = [
    { id: 1, title: '20% off Produce', description: 'Valid until Oct 15', code: 'FRESH20', color: 'from-green-500 to-green-600' },
    { id: 2, title: 'Buy 2 Get 1 Free', description: 'Dairy products', code: 'DAIRY3', color: 'from-blue-500 to-blue-600' },
    { id: 3, title: '$5 off $50+', description: 'Next purchase', code: 'SAVE5', color: 'from-purple-500 to-purple-600' },
  ];

  const rewards = [
    { id: 1, name: '$5 Coupon', points: 500, unlocked: true },
    { id: 2, name: '$10 Coupon', points: 1000, unlocked: true },
    { id: 3, name: '$20 Coupon', points: 2000, unlocked: true },
    { id: 4, name: 'Free Delivery', points: 3000, unlocked: false },
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="flex-1 text-foreground">Offers & Rewards</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Loyalty Points */}
        <Card className="bg-gradient-to-br from-[#FF3347] to-[#FF5566] text-white p-6 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm">Your Loyalty Points</p>
              <h2 className="text-4xl mt-1">2,450</h2>
            </div>
            <Star className="w-10 h-10 fill-white text-white" />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to next reward</span>
              <span>550 to go</span>
            </div>
            <Progress value={82} className="h-2 bg-white/20" />
          </div>
          <p className="text-white/90 text-sm">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Earn more points with every purchase!
          </p>
        </Card>

        {/* Active Offers */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-[#FF3347]" />
            <h3>Active Offers</h3>
          </div>
          <div className="space-y-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="rounded-2xl overflow-hidden">
                <div className={`bg-gradient-to-r ${offer.color} text-white p-4`}>
                  <h4 className="mb-1">{offer.title}</h4>
                  <p className="text-white/90 text-sm">{offer.description}</p>
                </div>
                <div className="p-4 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    <code className="px-3 py-1 bg-accent text-foreground rounded-lg">{offer.code}</code>
                  </div>
                  <button className="text-[#FF3347] text-sm">Apply</button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[#FF3347]" />
            <h3>Available Rewards</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => (
              <Card 
                key={reward.id}
                className={`p-4 rounded-2xl text-center ${
                  reward.unlocked 
                    ? 'bg-card border-[#FF3347] border-2' 
                    : 'bg-muted opacity-60'
                }`}
              >
                <div className="w-12 h-12 bg-[#FF3347]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Gift className={`w-6 h-6 ${reward.unlocked ? 'text-[#FF3347]' : 'text-muted-foreground'}`} />
                </div>
                <p className="mb-1 text-foreground">{reward.name}</p>
                <p className="text-sm text-muted-foreground">{reward.points} pts</p>
                {reward.unlocked && (
                  <Badge className="mt-2 bg-[#FF3347] text-white">Unlocked</Badge>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Earn More Points */}
        <Card className="p-4 rounded-2xl bg-blue-50 border-blue-200">
          <h4 className="mb-3">Earn More Points</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Complete a purchase</span>
              <span className="text-sm text-blue-600">+100 pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Refer a friend</span>
              <span className="text-sm text-blue-600">+500 pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Write a review</span>
              <span className="text-sm text-blue-600">+50 pts</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
