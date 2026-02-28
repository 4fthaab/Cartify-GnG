import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { Home, Database, Tag, MessageSquare, BarChart3, LogOut, Search, Plus, Edit, Trash2 } from 'lucide-react';
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

export default function App() {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', validUntil: '', status: 'Active' });
  const [offersData, setOffersData] = useState([
    { id: 1, title: '20% Off Fresh Produce', description: 'Get 20% off on all fresh fruits and vegetables', validUntil: '2025-10-15', status: 'Active' },
    { id: 2, title: 'Buy 1 Get 1 Free', description: 'Buy one snack item, get another free', validUntil: '2025-10-20', status: 'Active' },
    { id: 3, title: 'Weekend Special', description: '15% off on beverages every weekend', validUntil: '2025-10-31', status: 'Active' },
    { id: 4, title: 'Student Discount', description: '10% off for students with valid ID', validUntil: '2025-12-31', status: 'Scheduled' },
  ]);

  const [productData, setProductData] = useState([
    {
      item_id: 'ITEM001', name: 'Potato', category_id: 'C2', category_name: 'Vegetables',
      label_variants: ['potato', 'aloo', 'ഉരുളക്കിഴങ്ങ്'], weight_type: 'variable',
      weight_g: null as number | null, unit_price_per_kg: 35 as number | null, price: null as number | null,
      rack_id: 'str001r02', position_index: 1, is_active: true,
    },
    {
      item_id: 'ITEM002', name: 'Coconut Oil 1L', category_id: 'C3', category_name: 'Cooking Essentials',
      label_variants: ['coconut oil', 'velichenna', 'വെളിച്ചെണ്ണ'], weight_type: 'fixed',
      weight_g: 920 as number | null, unit_price_per_kg: null as number | null, price: 420 as number | null,
      rack_id: 'str001r03', position_index: 1, is_active: true,
    },
    {
      item_id: 'ITEM003', name: 'Fresh Mango', category_id: 'C1', category_name: 'Fruits',
      label_variants: ['mango', 'manga', 'മാങ്ങ'], weight_type: 'variable',
      weight_g: null as number | null, unit_price_per_kg: 120 as number | null, price: null as number | null,
      rack_id: 'str001r01', position_index: 3, is_active: true,
    },
  ]);

  if (!isAuthenticated) return <LoginPage />;

  const salesData = [
    { month: 'Jan', sales: 12500, orders: 245 },
    { month: 'Feb', sales: 15200, orders: 289 },
    { month: 'Mar', sales: 18900, orders: 356 },
    { month: 'Apr', sales: 16700, orders: 312 },
    { month: 'May', sales: 21300, orders: 401 },
    { month: 'Jun', sales: 24800, orders: 478 },
  ];

  const categoryData = [
    { name: 'Groceries', value: 35, color: '#3b82f6' },
    { name: 'Beverages', value: 25, color: '#10b981' },
    { name: 'Snacks', value: 20, color: '#f59e0b' },
    { name: 'Dairy', value: 15, color: '#ef4444' },
    { name: 'Others', value: 5, color: '#8b5cf6' },
  ];

  const statsCards = [
    { title: 'Total Revenue', value: '$109,400', change: '+12.5%', icon: BarChart3, color: 'text-blue-600' },
    { title: 'Total Orders', value: '2,081', change: '+8.2%', icon: Database, color: 'text-green-600' },
    { title: 'Active Offers', value: '3', change: '+1', icon: Tag, color: 'text-orange-600' },
    { title: 'Customer Enquiries', value: '156', change: '+23', icon: MessageSquare, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white">🛒</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">GRAB & GO</h1>
                <p className="text-slate-400 text-xs">Admin Dashboard</p>
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">

        {/* ── Dashboard ── */}
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
                  <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm text-slate-400">{stat.title}</CardTitle>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <p className="text-xs text-green-500 mt-1">{stat.change} from last month</p>
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
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)" />
                      <Bar dataKey="orders" fill="#10b981" name="Orders" />
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
                      <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100} fill="#8884d8" dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Products</CardTitle>
                <CardDescription className="text-slate-400">Latest items in your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productData.slice(0, 3).map((product) => (
                    <div key={product.item_id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">🛍️</div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-slate-400 text-sm">{product.category_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {product.weight_type === 'fixed' ? `₹${product.price}` : `₹${product.unit_price_per_kg}/kg`}
                        </p>
                        <Badge variant={product.is_active ? 'default' : 'destructive'} className="text-xs">
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Database ── */}
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
              onSubmit={(data) => {
                if (editingProduct) {
                  setProductData(prev => prev.map(p => p.item_id === data.item_id ? { ...p, ...data } : p));
                } else {
                  const nextId = `ITEM${String(productData.length + 1).padStart(3, '0')}`;
                  setProductData(prev => [...prev, { ...data, item_id: nextId }]);
                }
              }}
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
                      <TableHead className="text-slate-300">Rack</TableHead>
                      <TableHead className="text-slate-300">Pos</TableHead>
                      <TableHead className="text-slate-300">Labels</TableHead>
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
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              <span style={{ color: '#64748b', fontSize: 10 }}>{product.category_id}</span>{' · '}{product.category_name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.weight_type === 'fixed' ? 'default' : 'secondary'} className="text-xs">
                              {product.weight_type === 'fixed' ? `📦 Fixed${product.weight_g ? ` · ${product.weight_g}g` : ''}` : '⚖️ Variable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white text-sm">
                            {product.weight_type === 'fixed' ? `₹${product.price}` : `₹${product.unit_price_per_kg}/kg`}
                          </TableCell>
                          <TableCell>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#67e8f9', background: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                              {product.rack_id}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm text-center">{product.position_index}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.label_variants.slice(0, 2).map((lv: string, i: number) => (
                                <span key={i} style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(71,85,105,0.3)', padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>{lv}</span>
                              ))}
                              {product.label_variants.length > 2 && (
                                <span style={{ fontSize: 10, color: '#64748b' }}>+{product.label_variants.length - 2}</span>
                              )}
                            </div>
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
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-slate-700" onClick={() => setProductData(prev => prev.filter(p => p.item_id !== product.item_id))}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {productData.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-lg mb-1">No products found</p>
                    <p className="text-sm">Try a different search or add a new product</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Offers ── */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Manage Offers</h2>
                <p className="text-slate-400">Create and manage promotional offers</p>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => { setEditingOffer(null); setOfferForm({ title: '', description: '', validUntil: '', status: 'Active' }); setShowCreateOffer(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Create Offer
              </Button>
            </div>

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
                      {['Active', 'Scheduled', 'Inactive'].map((s) => (
                        <button key={s} type="button" onClick={() => setOfferForm(f => ({ ...f, status: s }))}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            offerForm.status === s
                              ? s === 'Active' ? 'bg-green-500/20 border-green-500 text-green-400'
                                : s === 'Scheduled' ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                : 'bg-slate-600/50 border-slate-500 text-slate-300'
                              : 'bg-transparent border-slate-600 text-slate-500 hover:border-slate-400'
                          }`}
                        >
                          <span className="mr-1">{s === 'Active' ? '🟢' : s === 'Scheduled' ? '🔵' : '⚫'}</span>{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => { setShowCreateOffer(false); setEditingOffer(null); }}>Cancel</Button>
                  <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => {
                    if (!offerForm.title.trim()) return;
                    if (editingOffer) {
                      setOffersData(prev => prev.map(o => o.id === editingOffer.id ? { ...o, ...offerForm } : o));
                    } else {
                      setOffersData(prev => [...prev, { id: Date.now(), ...offerForm }]);
                    }
                    setShowCreateOffer(false);
                    setEditingOffer(null);
                  }}>
                    {editingOffer ? 'Save Changes' : 'Create Offer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offersData.map((offer) => {
                const today = new Date().toISOString().split('T')[0];
                const isLive = offer.status === 'Active' && offer.validUntil >= today;
                const isExpired = offer.validUntil < today;
                return (
                  <Card key={offer.id} className={`bg-slate-800/50 border-slate-700 relative overflow-hidden transition-all ${isLive ? 'ring-1 ring-green-500/30' : ''}`}>
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${isLive ? 'bg-gradient-to-r from-green-500 to-emerald-400' : offer.status === 'Scheduled' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-600'}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white truncate">{offer.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              style={
                                offer.status === 'Active'
                                  ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }
                                  : offer.status === 'Scheduled'
                                  ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)' }
                                  : { background: 'rgba(71,85,105,0.4)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.5)' }
                              }
                              className="text-xs font-medium"
                            >
                              {offer.status === 'Active' ? '🟢' : offer.status === 'Scheduled' ? '🔵' : '⚫'} {offer.status}
                            </Badge>
                            {isLive && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                LIVE
                              </span>
                            )}
                            {isExpired && <span className="text-xs text-red-400 font-medium">⚠ Expired</span>}
                          </div>
                        </div>
                        <Tag className={`w-8 h-8 shrink-0 ${isLive ? 'text-green-400' : offer.status === 'Scheduled' ? 'text-blue-400' : 'text-slate-500'}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-300 text-sm">{offer.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isExpired ? 'text-red-400' : 'text-slate-400'}>Valid until: {offer.validUntil || '—'}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="ghost"
                          className="flex-1 bg-white text-black border border-white hover:bg-gray-100 hover:scale-105 hover:shadow-lg hover:shadow-white/20 active:scale-95 transition-all duration-200"
                          onClick={() => { setEditingOffer(offer); setOfferForm({ title: offer.title, description: offer.description, validUntil: offer.validUntil, status: offer.status }); setShowCreateOffer(true); }}
                        >
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => setOffersData(prev => prev.filter(o => o.id !== offer.id))}>
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

        {/* ── Enquiries (Customer Reviews + Customer Complaints) ── */}
        {activeTab === 'enquiries' && <Enquiries />}

        {/* ── Map Editor ── */}
        {activeTab === 'mapeditor' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-3xl mb-2">Store Map Editor</h2>
              <p className="text-slate-400">Design and manage your store floor layout</p>
            </div>
            <div className="bg-white rounded-xl" style={{ position: 'relative' }}>
              <MapEditorPage />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}