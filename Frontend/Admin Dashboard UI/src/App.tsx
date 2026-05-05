import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { adminService } from './services/adminServices';
import { Home, Database, Tag, MessageSquare, BarChart3, LogOut, Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Map as MapIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import MapEditorPage from './pages/MapEditorPage.jsx';
import AddProductModal from './components/database/AddProductModal';
import Enquiries from './components/enquiries/Enquiries';
import OrderPage from './components/orders/OrdersPage.js';


export default function App() {
  const { isAuthenticated, logout, adminData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // --- DYNAMIC STATE ---
  const [productData, setProductData] = useState<any[]>([]);
  const [offersData, setOffersData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  // --- MODAL STATES ---
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', validUntil: '', active: true });

  const [selectedMonthFilter, setSelectedMonthFilter] = useState<{ key: string, label: string } | null>(null);

  const navigateTo = (tab: string) => setActiveTab(tab);

  const [ratingsData, setRatingsData] = useState<any[]>([]);
  const [issuesData, setIssuesData] = useState<any[]>([]);
  const [enquiryTab, setEnquiryTab] = useState<'reviews' | 'complaints'>('reviews');
  const [layoutData, setLayoutData] = useState<any>(null);

  // --- FETCH INITIAL DATA ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitialData = async () => {
      try {
        // Fetch real Products
        const itemsRes = await adminService.getItems();
        if (itemsRes.status === 'success') {
          setProductData(itemsRes.items);
        }

        // Fetch real Offers
        const offersRes = await adminService.getOffers();
        if (offersRes.status === 'success') {
          setOffersData(offersRes.offers);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <LoginPage />;

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const [itemsRes, offersRes, ordersRes, ratingsRes, issuesRes, layoutRes] = await Promise.all([
          adminService.getItems(),
          adminService.getOffers(),
          adminService.getOrders(),
          adminService.getStoreRatings(),
          adminService.getIssues(),
          adminService.getLayout()

        ]);

        if (itemsRes.status === 'success') {
          setProductData(itemsRes.items);
        }

        if (offersRes.status === 'success') {
          setOffersData(offersRes.offers);
        }

        if (ordersRes.status === 'success') {
          setOrdersData(ordersRes.orders);
        }

        if (ratingsRes.status === 'success') setRatingsData(ratingsRes.ratings);
        if (issuesRes.status === 'success') setIssuesData(issuesRes.issues);
        if (layoutRes.status === 'success') setLayoutData(layoutRes.layout);

      } catch (err) {
        console.error("Data fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Admin Portal...</div>;

  const getCategoryData = () => {
    const counts: Record<string, number> = {};
    productData.forEach(p => {
      counts[p.category_name] = (counts[p.category_name] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const major5 = sorted.slice(0, 5);
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);

    if (others > 0) major5.push({ name: 'Others', value: others });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
    return major5.map((item, i) => ({ ...item, color: colors[i] }));
  };

  // --- PRODUCT HANDLERS ---
  const handleProductSubmit = async (data: any) => {
    if (editingProduct) {
      const res = await adminService.updateItem(editingProduct.item_id, data);
      if (res.status === 'success') {
        setProductData(prev => prev.map(p => p.item_id === editingProduct.item_id ? { ...p, ...data } : p));
      }
    } else {
      const nextId = `ITEM${String(productData.length + 1).padStart(3, '0')}`;
      const newData = { ...data, item_id: nextId };
      const res = await adminService.createItem(newData);
      if (res.status === 'success') {
        setProductData(prev => [...prev, newData]);
      }
    }
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  // 1. Add the Date Parser outside your App function or right before getSalesOverview
  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    const parts = dateStr.split(/[,\s]+/);
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : "00:00:00";

    if (datePart && datePart.includes('/')) {
      const [day, month, year] = datePart.split('/');
      d = new Date(`${year}-${month}-${day}T${timePart}`);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // 2. Update getSalesOverview to use it
  const getSalesOverview = () => {
    const result = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      const monthlyOrders = ordersData.filter(o => {
        const oDate = parseSafeDate(o.paid_at);
        if (!oDate) return false;
        const oKey = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}`;
        return oKey === monthKey;
      });

      result.push({
        monthKey,
        month: monthLabel,
        sales: monthlyOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0),
        orders: monthlyOrders.length
      });
    }
    return result;
  };

  const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_price || 0), 0);

  const handleDeleteProduct = async (itemId: string) => {
    if (window.confirm("Are you sure you want to deactivate this item?")) {
      const res = await adminService.deleteItem(itemId);
      if (res.status === 'success') setProductData(prev => prev.filter(p => p.item_id !== itemId));
    }
  };

  const viewOrdersForMonth = (key: string, label: string) => {
    setSelectedMonthFilter({ key, label });
    setActiveTab('orders');
  };

  // --- OFFER HANDLERS ---
  const handleOfferSubmit = async () => {
    if (!offerForm.title.trim()) return;

    const payload = {
      title: offerForm.title,
      description: offerForm.description,
      expires_at: offerForm.validUntil ? new Date(offerForm.validUntil).toISOString() : null,
      active: true // New offers default to active
    };

    if (editingOffer) {
      // Update existing
      const res = await adminService.updateOffer(editingOffer.offer_id, payload);
      if (res.status === 'success') {
        setOffersData(prev => prev.map(o => o.offer_id === editingOffer.offer_id ? { ...o, ...payload } : o));
      }
    } else {
      // Create new
      const res = await adminService.createOffer(payload);
      if (res.status === 'success') {
        const newOffer = {
          ...payload,
          offer_id: res.offer_id,
          created_at: new Date().toISOString()
        };
        setOffersData(prev => [newOffer, ...prev]);
      }
    }
    setShowCreateOffer(false);
    setEditingOffer(null);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm("Permanently delete this promotional offer?")) {
      const res = await adminService.deleteOffer(offerId);
      if (res.status === 'success') {
        setOffersData(prev => prev.filter(o => o.offer_id !== offerId));
      }
    }
  };

  const handleToggleOffer = async (offerId: string) => {
    const res = await adminService.toggleOffer(offerId);
    if (res.status === 'success') {
      setOffersData(prev => prev.map(o => o.offer_id === offerId ? { ...o, active: res.active } : o));
    }
  };

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-blue-600',
      onClick: () => setActiveTab('orders')
    },
    {
      title: 'Total Orders',
      value: ordersData.length,
      icon: Database,
      color: 'text-green-600',
      onClick: () => setActiveTab('orders')
    },
    {
      title: 'Active Offers',
      value: offersData.filter(o => o.active).length,
      icon: Tag,
      color: 'text-orange-600',
      onClick: () => setActiveTab('offers')
    },
    {
      title: 'Total Items',
      value: productData.length,
      icon: Package,
      color: 'text-purple-600',
      onClick: () => setActiveTab('database')
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* HEADER */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white">🛒</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">CARTIFY : GRAB & GO</h1>
                <p className="text-slate-400 text-xs">Admin: {adminData?.name || 'Dashboard'}</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              <Button variant={activeTab === 'dashboard' ? 'default' : 'ghost'} onClick={() => setActiveTab('dashboard')} className="text-white">
                <Home className="w-4 h-4 mr-2" /> Dashboard
              </Button>
              <Button variant={activeTab === 'database' ? 'default' : 'ghost'} onClick={() => setActiveTab('database')} className="text-white">
                <Database className="w-4 h-4 mr-2" /> Database
              </Button>
              <Button variant={activeTab === 'offers' ? 'default' : 'ghost'} onClick={() => setActiveTab('offers')} className="text-white">
                <Tag className="w-4 h-4 mr-2" /> Offers
              </Button>
              <Button variant={activeTab === 'enquiries' ? 'default' : 'ghost'} onClick={() => setActiveTab('enquiries')} className="text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Enquiries
              </Button>
              <Button variant={activeTab === 'mapeditor' ? 'default' : 'ghost'} onClick={() => setActiveTab('mapeditor')} className="text-white">
                <MapIcon className="w-4 h-4 mr-2" /> Map Editor
              </Button>
              <Button variant="ghost" className="text-white" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-8">

        {/* ── DASHBOARD (Static Version) ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-white text-3xl mb-2">Dashboard Overview</h2>
              <p className="text-slate-400">Welcome back! Here's what's happening with your store.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="bg-slate-800/50 border-slate-700 backdrop-blur-sm cursor-pointer hover:border-slate-500 transition-all"
                    onClick={stat.onClick}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm text-slate-400">{stat.title}</CardTitle>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Sales Overview</CardTitle>
                  <CardDescription className="text-slate-400">Monthly sales and orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getSalesOverview()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Legend />
                      {/* Attach onClick directly to the Bars instead of the Chart wrapper */}
                      <Bar
                        dataKey="sales"
                        fill="#3b82f6"
                        name="Sales (₹)"
                        style={{ cursor: 'pointer' }}
                        onClick={(data) => viewOrdersForMonth(data.monthKey, data.month)}
                      />
                      <Bar
                        dataKey="orders"
                        fill="#10b981"
                        name="Orders"
                        style={{ cursor: 'pointer' }}
                        onClick={(data) => viewOrdersForMonth(data.monthKey, data.month)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Product Categories</CardTitle>
                  <CardDescription className="text-slate-400">Distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getCategoryData()}
                        cx="50%" cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getCategoryData().map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <OrderPage
            orders={ordersData}
            onBack={() => {
              setActiveTab('dashboard');
              setSelectedMonthFilter(null);
            }}
            selectedMonth={selectedMonthFilter}
          />
        )}

        {/* ── DATABASE ── */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Product Database</h2>
                <p className="text-slate-400">Manage your supermarket inventory</p>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setShowAddProduct(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>

            <AddProductModal
              isOpen={showAddProduct || editingProduct !== null}
              onClose={() => { setShowAddProduct(false); setEditingProduct(null); }}
              editProduct={editingProduct}
              onSubmit={handleProductSubmit}
            />

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-white">All Products</CardTitle>
                    <span style={{ padding: '2px 10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, color: '#67e8f9', fontSize: 12 }}>
                      {productData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category_name.toLowerCase().includes(searchQuery.toLowerCase())).length} items
                    </span>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search by name or category..." className="pl-10 bg-slate-700 border-slate-600 text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Item ID</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300">Weight Type</TableHead>
                      <TableHead className="text-slate-300">Price</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productData
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((product) => (
                        <TableRow key={product.item_id} className="border-slate-700 hover:bg-slate-700/30">
                          <TableCell className="text-slate-400 font-mono text-xs">{product.item_id}</TableCell>
                          <TableCell className="text-white font-medium">{product.name}</TableCell>
                          <TableCell>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{product.category_name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.weight_type === 'fixed' ? 'default' : 'secondary'} className="text-xs">
                              {product.weight_type === 'fixed' ? `📦 Fixed` : '⚖️ Variable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white text-sm">
                            {product.weight_type === 'fixed' ? `₹${product.price}` : `₹${product.unit_price_per_kg}/kg`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'destructive'} className="text-xs">
                              {product.is_active ? '● Active' : '○ Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700" onClick={() => setEditingProduct(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-slate-700" onClick={() => handleDeleteProduct(product.item_id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── OFFERS (Fully Dynamic) ── */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Manage Offers</h2>
                <p className="text-slate-400">Create and manage promotional offers</p>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => { setEditingOffer(null); setOfferForm({ title: '', description: '', validUntil: '', active: true }); setShowCreateOffer(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Create Offer
              </Button>
            </div>

            {/* Offer Creation Modal */}
            <Dialog open={showCreateOffer} onOpenChange={(open: boolean) => { setShowCreateOffer(open); if (!open) setEditingOffer(null); }}>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingOffer ? 'Update the details of this offer' : 'Set up a new promotional offer'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer-title">Offer Title</Label>
                    <Input id="offer-title" placeholder="Enter offer title" className="bg-slate-700 border-slate-600 text-white" value={offerForm.title} onChange={(e) => setOfferForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-description">Description</Label>
                    <Textarea id="offer-description" placeholder="Describe the offer" className="bg-slate-700 border-slate-600 text-white" value={offerForm.description} onChange={(e) => setOfferForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer-validUntil">Valid Until</Label>
                    <Input id="offer-validUntil" type="date" className="bg-slate-700 border-slate-600 text-white" value={offerForm.validUntil} onChange={(e) => setOfferForm(f => ({ ...f, validUntil: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setOfferForm(f => ({ ...f, active: true }))} className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${offerForm.active ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-600/50 border-slate-500 text-slate-300'}`}>
                        🟢 Active
                      </button>
                      <button type="button" onClick={() => setOfferForm(f => ({ ...f, active: false }))} className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${!offerForm.active ? 'bg-slate-600/50 border-slate-500 text-white' : 'bg-transparent border-slate-600 text-slate-500 hover:border-slate-400'}`}>
                        ⚫ Inactive
                      </button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => { setShowCreateOffer(false); setEditingOffer(null); }}>Cancel</Button>
                  <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={handleOfferSubmit}>
                    {editingOffer ? 'Save Changes' : 'Create Offer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offersData.map((offer) => {
                const today = new Date().toISOString();
                const isLive = offer.active && (!offer.expires_at || offer.expires_at > today);
                const isExpired = offer.expires_at && offer.expires_at < today;

                return (
                  <Card key={offer.offer_id} className={`bg-slate-800/50 border-slate-700 relative overflow-hidden transition-all ${isLive ? 'ring-1 ring-green-500/30' : ''}`}>
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${isLive ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-slate-600'}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white truncate">{offer.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge style={offer.active ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' } : { background: 'rgba(71,85,105,0.4)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.5)' }} className="text-xs font-medium cursor-pointer" onClick={() => handleToggleOffer(offer.offer_id)}>
                              {offer.active ? '🟢 Active' : '⚫ Inactive'}
                            </Badge>
                            {isLive && <span className="text-xs font-semibold text-green-400">LIVE</span>}
                            {isExpired && <span className="text-xs text-red-400 font-medium">⚠ Expired</span>}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-300 text-sm">{offer.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isExpired ? 'text-red-400' : 'text-slate-400'}>
                          Valid until: {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : 'No Expiry'}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="flex-1 bg-green text-white hover:bg-gray-200" onClick={() => { setEditingOffer(offer); setOfferForm({ title: offer.title, description: offer.description, validUntil: offer.expires_at ? offer.expires_at.split('T')[0] : '', active: offer.active }); setShowCreateOffer(true); }}>
                          <Edit className="w-4 h-4 mr-2 " /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDeleteOffer(offer.offer_id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'enquiries' && <Enquiries />}

        {activeTab === 'mapeditor' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-3xl mb-2">Store Map Editor</h2>
              <p className="text-slate-400">Design and manage your store floor layout</p>
            </div>
            <div className="bg-white rounded-xl" style={{ position: 'relative' }}>
              <MapEditorPage initialLayout={layoutData} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}