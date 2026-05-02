import { useState } from 'react';
import { Trash2, Search, Star, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

// Types 
interface Enquiry {
  id: number;
  name: string;
  email: string;
  avatar: string;
  review: string;
  service: number;
  website: number;
  overall: number;
  date: string;
}

type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';

interface Complaint {
  id: number;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  date: string;
}

// Static data 
const initialEnquiries: Enquiry[] = [
  {
    id: 1, name: 'Afthab Rahman', email: 'afthab@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    review: 'Great effort! Saved my time by 3 times lesser for searching items.',
    service: 5, website: 4, overall: 2, date: '2025-10-05',
  },
  {
    id: 2, name: 'Akshay', email: 'akshay@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    review: 'I find this supermarket assistant website incredibly useful and easy to navigate. The ability to search for item locations, create shopping lists, and explore offers makes my shopping experience much more convenient.',
    service: 5, website: 4, overall: 5, date: '2025-10-04',
  },
  {
    id: 3, name: 'OXY SCOOBY', email: 'oxyscooby@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    review: 'Amazing Experience.... Keep it up!',
    service: 4, website: 5, overall: 5, date: '2025-10-03',
  },
];

const initialComplaints: Complaint[] = [
  {
    id: 1, name: 'Rahul Menon', email: 'rahul.menon@example.com',
    subject: 'Wrong item location shown',
    description: 'The app directed me to Rack B3 for milk but it was actually at Rack A1. Wasted 10 minutes searching. Please fix the map data.',
    status: 'Open', date: '2025-10-08',
  },
  {
    id: 2, name: 'Priya Nair', email: 'priya.nair@example.com',
    subject: 'Offer not applied at checkout',
    description: 'The "Buy 1 Get 1 Free" offer for snacks was showing on the website but was not applied when I checked out. I had to pay full price.',
    status: 'In Progress', date: '2025-10-07',
  },
  {
    id: 3, name: 'Sreekanth V', email: 'sreekanth.v@example.com',
    subject: 'App crashes on search',
    description: 'When I search for items with Malayalam text the app sometimes crashes. This happens consistently with "ഉരുളക്കിഴങ്ങ്".',
    status: 'In Progress', date: '2025-10-06',
  },
  {
    id: 4, name: 'Anjali Das', email: 'anjali.das@example.com',
    subject: 'Product price mismatch',
    description: 'The website shows coconut oil at ₹380 but the shelf price is ₹420. Prices should be updated regularly.',
    status: 'Resolved', date: '2025-10-04',
  },
  {
    id: 5, name: 'Mohammed Fariz', email: 'fariz@example.com',
    subject: 'Shopping list not saving',
    description: 'I created a shopping list with 8 items but after closing the app and reopening it the list was empty. Lost all my data.',
    status: 'Open', date: '2025-10-03',
  },
];

// Status config (no priority) 
const statusConfig: Record<ComplaintStatus, { icon: React.ElementType; style: React.CSSProperties }> = {
  Open:        { icon: AlertTriangle, style: { background: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.35)'  } },
  'In Progress': { icon: Clock,       style: { background: 'rgba(234,179,8,0.12)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.35)'  } },
  Resolved:    { icon: CheckCircle,   style: { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)'  } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className="w-3.5 h-3.5"
          style={{
            color: star <= rating ? '#facc15' : '#475569',
            fill: star <= rating ? '#facc15' : 'none',
            stroke: star <= rating ? '#facc15' : '#475569'
          }}
        />
      ))}
    </div>
  );
}


// Main component 
export default function Enquiries() {
  // Reviews state
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [reviewSearch, setReviewSearch] = useState('');

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [complaintSearch, setComplaintSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'All'>('All');
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);

  // Reviews helpers
  const filteredReviews = enquiries.filter((e) =>
    e.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    e.review.toLowerCase().includes(reviewSearch.toLowerCase())
  );
  const avgOverall = enquiries.length > 0
    ? (enquiries.reduce((sum, e) => sum + e.overall, 0) / enquiries.length).toFixed(1)
    : '0';

  // Complaints helpers
  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.subject.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(complaintSearch.toLowerCase());
    return matchSearch && (filterStatus === 'All' || c.status === filterStatus);
  });
  const counts = {
    Open:          complaints.filter((c) => c.status === 'Open').length,
    'In Progress': complaints.filter((c) => c.status === 'In Progress').length,
    Resolved:      complaints.filter((c) => c.status === 'Resolved').length,
  };

  const handleDeleteReview = (id: number) => setEnquiries((prev) => prev.filter((e) => e.id !== id));
  const handleDeleteComplaint = (id: number) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    if (viewingComplaint?.id === id) setViewingComplaint(null);
  };
  const handleStatusChange = (id: number, status: ComplaintStatus) => {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setViewingComplaint((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  return (
    <div className="space-y-12">

      {/* SECTION 1 — Customer Reviews*/}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white text-3xl mb-1">Enquiries</h2>
            <p className="text-slate-400">View and manage customer feedback</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Summary pill */}
            <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2">
              <div className="text-center">
                <p className="text-white font-bold text-lg leading-none">{enquiries.length}</p>
                <p className="text-slate-400 text-xs mt-0.5">Total</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-lg leading-none">{avgOverall}</p>
                <p className="text-slate-400 text-xs mt-0.5">Avg Rating</p>
              </div>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search reviews..."
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Review cards */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg mb-1">No reviews found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((enquiry) => (
              <Card key={enquiry.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-11 h-11 shrink-0">
                      <AvatarImage src={enquiry.avatar} alt={enquiry.name} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-sm font-bold">
                        {enquiry.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-sm font-semibold truncate">{enquiry.name}</CardTitle>
                      <p className="text-slate-400 text-xs truncate">{enquiry.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{enquiry.date}</p>
                    </div>
                    <Badge style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.35)' }} className="text-xs font-semibold shrink-0">
                      ★ {enquiry.overall}.0
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <p className="text-slate-300 text-sm italic leading-relaxed">"{enquiry.review}"</p>
                  <div className="space-y-1.5 pt-1 border-t border-slate-700/60">
                    {[{ label: 'Service', val: enquiry.service }, { label: 'Website', val: enquiry.website }, { label: 'Overall', val: enquiry.overall }].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">{label}</span>
                        <StarRating rating={val} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="destructive" className="w-full hover:scale-[1.02] active:scale-95 transition-all duration-150" onClick={() => handleDeleteReview(enquiry.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700/60" />

      {/* SECTION 2 — Customer Complaints */}
      <div className="space-y-6">
        {/* Sub-header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-white text-2xl mb-1">Customer Complaints</h3>
            <p className="text-slate-400">Track and resolve customer issues</p>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search complaints..."
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              value={complaintSearch}
              onChange={(e) => setComplaintSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Clickable status stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(counts) as [ComplaintStatus, number][]).map(([status, count]) => {
            const { icon: Icon, style } = statusConfig[status];
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(isActive ? 'All' : status)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${
                  isActive ? 'bg-slate-700/80 border-slate-500 shadow-lg' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" style={{ color: style.color as string }} />
                <div className="text-left">
                  <p className="text-white font-bold text-xl leading-none">{count}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{status}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Complaint list */}
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-1">No complaints found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => {
              const { icon: StatusIcon, style: sStyle } = statusConfig[complaint.status];
              return (
                <Card key={complaint.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm font-bold">
                          {complaint.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-white font-semibold text-sm">{complaint.name}</p>
                            <p className="text-slate-400 text-xs">{complaint.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge style={sStyle} className="text-xs font-medium flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {complaint.status}
                            </Badge>
                            <span className="text-slate-500 text-xs">{complaint.date}</span>
                          </div>
                        </div>

                        <p className="text-white text-sm font-medium mt-2">{complaint.subject}</p>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{complaint.description}</p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Button size="sm" variant="ghost"
                            className="h-7 px-3 text-xs bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600"
                            onClick={() => setViewingComplaint(complaint)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>

                          {complaint.status === 'Open' && (
                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs border"
                              style={{ background: 'rgba(234,179,8,0.1)', color: '#fbbf24', borderColor: 'rgba(234,179,8,0.3)' }}
                              onClick={() => handleStatusChange(complaint.id, 'In Progress')}
                            >
                              <Clock className="w-3 h-3 mr-1" /> Mark In Progress
                            </Button>
                          )}
                          {complaint.status === 'In Progress' && (
                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs border"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.3)' }}
                              onClick={() => handleStatusChange(complaint.id, 'Resolved')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                            </Button>
                          )}
                          {complaint.status === 'Resolved' && (
                            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs border"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                              onClick={() => handleStatusChange(complaint.id, 'Open')}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" /> Reopen
                            </Button>
                          )}

                          <Button size="sm" variant="destructive"
                            className="h-7 px-3 text-xs ml-auto hover:scale-105 active:scale-95 transition-all"
                            onClick={() => handleDeleteComplaint(complaint.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      <Dialog open={!!viewingComplaint} onOpenChange={(open: boolean) => { if (!open) setViewingComplaint(null); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Complaint Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Submitted by {viewingComplaint?.name} on {viewingComplaint?.date}
            </DialogDescription>
          </DialogHeader>

          {viewingComplaint && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 to-orange-500 text-white font-bold">
                    {viewingComplaint.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">{viewingComplaint.name}</p>
                  <p className="text-slate-400 text-sm">{viewingComplaint.email}</p>
                </div>
                <div className="ml-auto">
                  <Badge style={statusConfig[viewingComplaint.status].style} className="text-xs">
                    {viewingComplaint.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-slate-700/40 rounded-lg p-4 space-y-2">
                <p className="text-white font-semibold">{viewingComplaint.subject}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{viewingComplaint.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">Update Status</p>
                <div className="flex gap-2">
                  {(['Open', 'In Progress', 'Resolved'] as ComplaintStatus[]).map((s) => (
                    <button key={s}
                      onClick={() => handleStatusChange(viewingComplaint.id, s)}
                      className="flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all hover:opacity-90"
                      style={viewingComplaint.status === s ? statusConfig[s].style : { background: 'transparent', color: '#64748b', borderColor: '#334155' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="destructive" size="sm" onClick={() => viewingComplaint && handleDeleteComplaint(viewingComplaint.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Complaint
            </Button>
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setViewingComplaint(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}