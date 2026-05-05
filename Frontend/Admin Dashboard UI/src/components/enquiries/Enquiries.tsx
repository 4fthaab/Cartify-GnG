import { useState, useEffect } from 'react';
import { Trash2, Search, Star, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { adminService } from '../../services/adminServices'; // Adjust path if needed

// Types 
interface Enquiry {
  id: string; // Changed to string for MongoDB _id
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
  id: string; // Changed to string for issue_id (e.g., "ISS1772543699")
  name: string;
  email: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  date: string;
}

// Status config
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
  // Dynamic States
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search/Filter States
  const [reviewSearch, setReviewSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'All'>('All');
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);

  // --- 1. FETCH DATA ON MOUNT ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratingsRes, issuesRes] = await Promise.all([
          adminService.getStoreRatings(),
          adminService.getIssues()
        ]);

        if (ratingsRes.status === 'success') {
          // Map backend ratings schema to UI format
          const mappedRatings = ratingsRes.ratings.map((r: any) => ({
            id: r._id?.$oid || Math.random().toString(), 
            name: r.user_id || 'Anonymous',
            email: `User ID: ${r.user_id || 'Unknown'}`,
            review: r.review || "No feedback text provided.",
            overall: r.rating || 5,
            service: r.rating || 5, // Copied from overall rating to keep UI full
            website: r.rating || 5, // Copied from overall rating to keep UI full
            date: new Date(r.created_at).toLocaleDateString(),
            avatar: `https://ui-avatars.com/api/?name=${r.user_id || 'User'}&background=random`
          }));
          setEnquiries(mappedRatings);
        }

        if (issuesRes.status === 'success') {
          // Map backend issues schema to UI format
          const mappedIssues = issuesRes.issues.map((i: any) => ({
            id: i.issue_id,
            name: i.user_id || "Guest",
            email: `User ID: ${i.user_id || 'Guest'}`,
            subject: i.subject || "General Issue",
            description: i.description || "No description provided.",
            status: i.status === 'open' ? 'Open' : (i.status === 'resolved' ? 'Resolved' : 'In Progress'),
            date: new Date(i.created_at).toLocaleDateString()
          }));
          setComplaints(mappedIssues);
        }
      } catch (err) {
        console.error("Failed to load enquiries", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. BACKEND HANDLERS ---
  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    // Map UI status back to backend 'open'/'resolved'/'in_progress'
    const backendStatus = status.toLowerCase().replace(" ", "_");
    
    try {
      const res = await adminService.updateIssue(id, { status: backendStatus });
      if (res.status === 'success') {
        // Update Local State
        setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
        setViewingComplaint((prev) => (prev?.id === id ? { ...prev, status } : prev));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteComplaint = (id: string) => {
    if (window.confirm("Remove this complaint record?")) {
      // NOTE: You can add an adminService.deleteIssue(id) call here later if your backend supports it.
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      if (viewingComplaint?.id === id) setViewingComplaint(null);
    }
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm("Remove this review?")) {
      // NOTE: You can add an adminService.deleteRating(id) call here later if your backend supports it.
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // --- HELPERS ---
  const filteredReviews = enquiries.filter((e) =>
    e.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    e.review.toLowerCase().includes(reviewSearch.toLowerCase())
  );
  
  const avgOverall = enquiries.length > 0
    ? (enquiries.reduce((sum, e) => sum + e.overall, 0) / enquiries.length).toFixed(1)
    : '0';

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

  if (isLoading) {
    return <div className="text-white text-center py-20 text-lg">Loading Enquiries...</div>;
  }

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