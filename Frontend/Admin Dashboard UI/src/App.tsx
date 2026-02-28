import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { Home, Database, Tag, MessageSquare, Users, BarChart3, LogOut, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import MapEditorPage from './pages/MapEditorPage.jsx';  // .jsx import works fine in .tsx
import { Map as MapIcon } from 'lucide-react';

export default function App() {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Show login page if not authenticated
  if (!isAuthenticated) return <LoginPage />;

  // Mock data for analytics
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

  const productData = [
    { id: 1, name: 'Fresh Milk', category: 'Dairy', price: 3.99, stock: 145, status: 'In Stock' },
    { id: 2, name: 'Whole Wheat Bread', category: 'Groceries', price: 2.49, stock: 89, status: 'In Stock' },
    { id: 3, name: 'Orange Juice', category: 'Beverages', price: 4.99, stock: 12, status: 'Low Stock' },
    { id: 4, name: 'Potato Chips', category: 'Snacks', price: 3.49, stock: 0, status: 'Out of Stock' },
    { id: 5, name: 'Greek Yogurt', category: 'Dairy', price: 5.99, stock: 67, status: 'In Stock' },
    { id: 6, name: 'Coffee Beans', category: 'Groceries', price: 12.99, stock: 34, status: 'In Stock' },
  ];

  const offersData = [
    { id: 1, title: '20% Off Fresh Produce', description: 'Get 20% off on all fresh fruits and vegetables', validUntil: '2025-10-15', status: 'Active' },
    { id: 2, title: 'Buy 1 Get 1 Free', description: 'Buy one snack item, get another free', validUntil: '2025-10-20', status: 'Active' },
    { id: 3, title: 'Weekend Special', description: '15% off on beverages every weekend', validUntil: '2025-10-31', status: 'Active' },
    { id: 4, title: 'Student Discount', description: '10% off for students with valid ID', validUntil: '2025-12-31', status: 'Scheduled' },
  ];

  const reviewsData = [
    {
      id: 1,
      name: 'Afthab Rahman',
      email: 'afthab@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      review: 'Great effort! Saved my time by 3 times lesser for searching items.',
      service: 5,
      website: 4,
      overall: 5,
      date: '2025-10-05'
    },
    {
      id: 2,
      name: 'Akshay',
      email: 'akshay@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      review: 'I find this supermarket assistant website incredibly useful and easy to navigate. The ability to search for item locations, create shopping lists, and explore offers makes my shopping experience much more convenient.',
      service: 5,
      website: 5,
      overall: 5,
      date: '2025-10-04'
    },
    {
      id: 3,
      name: 'OXY SCOOBY',
      email: 'oxyscooby@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      review: 'Amazing Experience.... Keep it up!',
      service: 5,
      website: 5,
      overall: 5,
      date: '2025-10-03'
    },
  ];

  const statsCards = [
    { title: 'Total Revenue', value: '$109,400', change: '+12.5%', icon: BarChart3, color: 'text-blue-600' },
    { title: 'Total Orders', value: '2,081', change: '+8.2%', icon: Database, color: 'text-green-600' },
    { title: 'Active Offers', value: '3', change: '+1', icon: Tag, color: 'text-orange-600' },
    { title: 'Customer Reviews', value: '156', change: '+23', icon: MessageSquare, color: 'text-purple-600' },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
      </div>
    );
  };

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
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className="text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'database' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('database')}
                className="text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Database
              </Button>
              <Button
                variant={activeTab === 'offers' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('offers')}
                className="text-white"
              >
                <Tag className="w-4 h-4 mr-2" />
                Offers
              </Button>
              <Button
                variant={activeTab === 'reviews' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('reviews')}
                className="text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Reviews
              </Button>
              <Button
                variant={activeTab === 'mapeditor' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('mapeditor')}
                className="text-white"
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Map Editor
              </Button>
              <Button variant="ghost" className="text-white" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-white text-3xl mb-2">Dashboard Overview</h2>
              <p className="text-slate-400">Welcome back! Here's what's happening with your store.</p>
            </div>

            {/* Stats Cards */}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
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
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)" />
                      <Bar dataKey="orders" fill="#10b981" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Product Categories</CardTitle>
                  <CardDescription className="text-slate-400">Distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Products</CardTitle>
                <CardDescription className="text-slate-400">Latest items in your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productData.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                          🛍️
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-slate-400 text-sm">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${product.price}</p>
                        <Badge variant={product.status === 'In Stock' ? 'default' : 'destructive'} className="text-xs">
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Database Management Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Product Database</h2>
                <p className="text-slate-400">Manage your supermarket inventory</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Enter the details of the new product
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" placeholder="Enter product name" className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="groceries">Groceries</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="snacks">Snacks</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" type="number" placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" type="number" placeholder="0" className="bg-slate-700 border-slate-600 text-white" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="bg-cyan-500 hover:bg-cyan-600">Add Product</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">All Products</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search products..."
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">ID</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300">Price</TableHead>
                      <TableHead className="text-slate-300">Stock</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productData.map((product) => (
                      <TableRow key={product.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300">{product.id}</TableCell>
                        <TableCell className="text-white font-medium">{product.name}</TableCell>
                        <TableCell className="text-slate-300">{product.category}</TableCell>
                        <TableCell className="text-white">${product.price}</TableCell>
                        <TableCell className="text-slate-300">{product.stock}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === 'In Stock'
                                ? 'default'
                                : product.status === 'Low Stock'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-slate-700">
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

        {/* Offers Management Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Manage Offers</h2>
                <p className="text-slate-400">Create and manage promotional offers</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Offer</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Set up a new promotional offer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Offer Title</Label>
                      <Input id="title" placeholder="Enter offer title" className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Describe the offer" className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input id="validUntil" type="date" className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="bg-cyan-500 hover:bg-cyan-600">Create Offer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offersData.map((offer) => (
                <Card key={offer.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">{offer.title}</CardTitle>
                        <Badge
                          variant={offer.status === 'Active' ? 'default' : 'secondary'}
                          className="mt-2"
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <Tag className="w-8 h-8 text-orange-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">{offer.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Valid until: {offer.validUntil}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-3xl mb-2">Customer Reviews</h2>
                <p className="text-slate-400">View and manage customer feedback</p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewsData.map((review) => (
                <Card key={review.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.avatar} alt={review.name} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                          {review.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-white text-base">{review.name}</CardTitle>
                        <p className="text-slate-400 text-sm">{review.email}</p>
                        <p className="text-slate-500 text-xs mt-1">{review.date}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-sm italic">"{review.review}"</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Service:</span>
                        {renderStars(review.service)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Website:</span>
                        {renderStars(review.website)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Overall:</span>
                        {renderStars(review.overall)}
                      </div>
                    </div>
                    <Button size="sm" variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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