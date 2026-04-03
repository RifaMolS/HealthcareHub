import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const staticCategories = [
    { id: 'c1', name: 'Fruits & Veggies', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80' },
    { id: 'c2', name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80' },
    { id: 'c3', name: 'Bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
    { id: 'c4', name: 'Beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { id: 'c5', name: 'Snacks', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80' },
    { id: 'c6', name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80' }
];

const staticSubcategories = [
    { id: 's1', categoryId: 'c1', name: 'Fresh Fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80' },
    { id: 's2', categoryId: 'c1', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80' },
    { id: 's3', categoryId: 'c1', name: 'Organic', image: 'https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?auto=format&fit=crop&w=600&q=80' },
    { id: 's4', categoryId: 'c2', name: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80' },
    { id: 's5', categoryId: 'c2', name: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80' },
    { id: 's6', categoryId: 'c2', name: 'Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80' },
    { id: 's7', categoryId: 'c3', name: 'Breads', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
    { id: 's8', categoryId: 'c3', name: 'Pastries', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
    { id: 's9', categoryId: 'c4', name: 'Juices', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80' },
    { id: 's10', categoryId: 'c4', name: 'Soft Drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { id: 's11', categoryId: 'c5', name: 'Chips', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80' },
    { id: 's12', categoryId: 'c5', name: 'Chocolates', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80' },
    { id: 's13', categoryId: 'c6', name: 'Skin Care', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80' },
    { id: 's14', categoryId: 'c6', name: 'Hair Care', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' }
];

function ShopDashboard({ user: propUser, onLogout }) {
    const navigate = useNavigate();
    const [user] = useState(propUser || JSON.parse(localStorage.getItem('user')));
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [newProduct, setNewProduct] = useState({
        name: '', price: '', description: '', category: '', subcategory: ''
    });
    const [productImage, setProductImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedCategoryForSubView, setSelectedCategoryForSubView] = useState('all');
    const [shopReviews, setShopReviews] = useState([]);
    const [productReviews, setProductReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [shopOrders, setShopOrders] = useState([]);
    const [totalSales, setTotalSales] = useState(0);

    useEffect(() => {
        if (!user || user.usertype !== 'shop') {
            navigate('/login');
            return;
        }
        fetchProducts();
        fetchReviews();
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`http://localhost:5001/health/get-shop-orders/${user.regid._id}`);
            if (response.ok) {
                const data = await response.json();
                setShopOrders(data);
                const total = data.reduce((sum, order) => sum + order.totalAmount, 0);
                setTotalSales(total);
            }
        } catch (error) { console.error('Error fetching orders:', error); }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch(`http://localhost:5001/health/get-shop-reviews/${user.regid._id}`);
            if (response.ok) {
                const data = await response.json();
                setShopReviews(data.shopReviews);
                setProductReviews(data.productReviews);

                // Calculate average
                const allReviews = [...data.shopReviews, ...data.productReviews];
                if (allReviews.length > 0) {
                    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
                    setAverageRating(avg.toFixed(1));
                }
            }
        } catch (error) { console.error('Error fetching reviews:', error); }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`http://localhost:5001/health/shop-products/${user.regid._id}`);
            const data = await response.json();
            setProducts(data);
        } catch (error) { console.error('Error fetching products:', error); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProductImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newProduct).forEach(key => formData.append(key, newProduct[key]));
        formData.append('shopId', user.regid._id);
        if (productImage) formData.append('image', productImage);

        try {
            const response = await fetch('http://localhost:5001/health/add-product', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                alert('Product listed successfully!');
                setNewProduct({ name: '', price: '', description: '', category: '', subcategory: '' });
                setProductImage(null);
                setImagePreview(null);
                fetchProducts();
                setActiveTab('inventory');
            }
        } catch (error) { console.error('Error adding product:', error); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to completely erase this product from the inventory?')) return;
        try {
            const response = await fetch(`http://localhost:5001/health/delete-product/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Product destroyed.');
                fetchProducts();
            } else {
                alert('Failed to delete product.');
            }
        } catch (error) { console.error('Error deleting product:', error); }
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate('/login');
    };

    const NavItem = ({ id, icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <span className={`text-2xl transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-80 bg-slate-950 text-white fixed h-screen flex flex-col z-50">
                <div className="p-10 border-b border-slate-900">
                    <h1 className="text-2xl font-black tracking-tighter text-emerald-400 uppercase">Vendor<span className="text-white">Portal</span></h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Inventory Core</p>
                </div>

                <div className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem id="overview" icon="📊" label="Dashboard" />
                    <NavItem id="categories" icon="🗂️" label="Categories" />
                    <NavItem id="subcategories" icon="📁" label="Groups" />
                    <NavItem id="inventory" icon="📦" label="My Catalog" />
                    <NavItem id="ratings" icon="⭐" label="User Ratings" />
                    <NavItem id="add" icon="➕" label="List Item" />
                </div>

                <div className="p-8 border-t border-slate-900">
                    <div className="mb-6 px-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connected Store</p>
                        <p className="text-sm font-black text-white uppercase truncate">{user?.regid?.shopName}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full py-5 bg-slate-900 hover:bg-rose-600 transition-all text-rose-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                        <span>🚪</span> Logoff
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-80 flex-1 p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                            {activeTab === 'overview' ? 'Performance Deck' : activeTab.replace(/([A-Z])/g, ' $1')}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest italic">Welcome back, {user?.regid?.ownerName}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Store Operational</span>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    {activeTab === 'overview' && (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-8 hover:shadow-2xl transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">💰</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">₹{totalSales}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-8 hover:shadow-2xl transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">🏷️</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Classes</p>
                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{new Set(products.map(p => p.category)).size}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-8 hover:shadow-2xl transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="w-20 h-20 rounded-[2rem] bg-amber-50 text-amber-600 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">⭐</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Rating</p>
                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{averageRating || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-600/10 to-transparent pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-3xl font-black tracking-tight uppercase">Sales Intelligence Graph</h3>
                                        <div className="flex gap-2">
                                            <span className="px-4 py-1.5 bg-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Active Growth</span>
                                        </div>
                                    </div>

                                    <div className="h-80 border border-emerald-500/10 rounded-[2.5rem] bg-[#0f172a] shadow-2xl relative overflow-hidden p-8 group/graph">
                                        {/* Background Grid Lines */}
                                        <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none opacity-20">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-full border-t border-emerald-500/30 border-dashed"></div>
                                            ))}
                                        </div>

                                        {shopOrders.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
                                                <div className="text-6xl mb-4 opacity-10">�</div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/40">Waiting for live signals...</p>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-end gap-4 overflow-x-auto scrollbar-hide relative z-10 pt-12">
                                                {shopOrders.slice(0, 15).reverse().map((order, idx) => {
                                                    const maxVal = Math.max(...shopOrders.map(o => o.totalAmount)) || 1;
                                                    const heightPct = Math.max((order.totalAmount / maxVal) * 100, 5);

                                                    return (
                                                        <div key={idx} className="flex-1 min-w-[35px] h-full flex flex-col justify-end group/bar relative">
                                                            {/* Hover Tooltip */}
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover/bar:scale-100 transition-all duration-300 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.4)] z-30">
                                                                ₹{order.totalAmount}
                                                            </div>

                                                            <div className="relative flex flex-col items-center h-full justify-end">
                                                                <svg className="w-full drop-shadow-[0_0_8px_rgba(16,185,129,0.1)]" style={{ height: `${heightPct}%` }} viewBox="0 0 35 100" preserveAspectRatio="none">
                                                                    <defs>
                                                                        <linearGradient id={`emeraldGrad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                                            <stop offset="0%" stopColor="#10b981" />
                                                                            <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <rect
                                                                        x="4" y="0" width="27" height="100"
                                                                        rx="8" fill={`url(#emeraldGrad-${idx})`}
                                                                        className="group-hover/bar:fill-emerald-400 transition-all cursor-help duration-300"
                                                                    />
                                                                </svg>

                                                                <div className="mt-4 text-[7px] font-black text-emerald-500/40 uppercase tracking-widest truncate w-full text-center group-hover/bar:text-emerald-400 transition-colors">
                                                                    {order._id.slice(-4)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-slate-100">
                                <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tight uppercase">Incoming Live Sales</h3>
                                <div className="space-y-6">
                                    {shopOrders.length === 0 ? (
                                        <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">
                                            No recent transactions detected
                                        </div>
                                    ) : (
                                        shopOrders.slice(0, 5).map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👤</div>
                                                    <div>
                                                        <p className="font-black text-slate-800 uppercase tracking-tighter">{order.customerName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} Items
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-emerald-600 tracking-tighter">₹{order.totalAmount}</p>
                                                    <span className="px-3 py-1 bg-white rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">{order.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {staticCategories.map((cat, idx) => (
                                <div key={cat.id} className="group relative rounded-[3.5rem] overflow-hidden aspect-square shadow-sm hover:shadow-2xl transition-all duration-700 border border-slate-100" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <img src={cat.image} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                                    <div className="absolute bottom-10 left-10">
                                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter group-hover:-translate-y-2 transition-transform duration-500">{cat.name}</h4>
                                        <div className="w-12 h-1.5 bg-emerald-500 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 origin-left mt-4 text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center">Explore Collection</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'subcategories' && (
                        <div className="space-y-16">
                            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight ml-4">Granular Classification</h3>
                                <select className="px-10 py-5 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none border border-slate-100 focus:ring-4 ring-emerald-500/10 transition-all" value={selectedCategoryForSubView} onChange={e => setSelectedCategoryForSubView(e.target.value)}>
                                    <option value="all">Display All Domains</option>
                                    {staticCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {staticCategories.filter(c => selectedCategoryForSubView === 'all' || c.id === selectedCategoryForSubView).map(cat => {
                                const subs = staticSubcategories.filter(s => s.categoryId === cat.id);
                                if (subs.length === 0) return null;
                                return (
                                    <div key={cat.id} className="space-y-8">
                                        <div className="flex items-center gap-6 px-4">
                                            <div className="w-2 h-12 bg-emerald-500 rounded-full"></div>
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{cat.name}</h4>
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{subs.length} Modules</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                            {subs.map(s => (
                                                <div key={s.id} className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all p-4 group">
                                                    <div className="h-48 rounded-[2.5rem] overflow-hidden mb-6">
                                                        <img src={s.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                                    </div>
                                                    <h5 className="text-center font-black text-slate-800 text-sm uppercase tracking-widest pb-4">{s.name}</h5>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="bg-emerald-600 p-12 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                                    <h3 className="text-4xl font-black uppercase tracking-tight">Product Deployment</h3>
                                    <p className="text-emerald-100 font-bold text-sm mt-2 opacity-80 italic uppercase tracking-widest">Registering stock into global repository</p>
                                </div>
                                <form onSubmit={handleAddProduct} className="p-16 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Material Label</label>
                                            <input type="text" placeholder="e.g. Organic Red Quinoa" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-emerald-500/10 outline-none transition-all" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Value (₹)</label>
                                            <input type="number" placeholder="0.00" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-emerald-500/10 outline-none transition-all" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Domain</label>
                                            <select className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white outline-none cursor-pointer" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value, subcategory: '' })} required>
                                                <option value="" disabled>Select Domain</option>
                                                {staticCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Module</label>
                                            <select className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white outline-none cursor-pointer disabled:opacity-50" value={newProduct.subcategory} onChange={e => setNewProduct({ ...newProduct, subcategory: e.target.value })} disabled={!newProduct.category} required>
                                                <option value="" disabled>Select Module</option>
                                                {staticSubcategories.filter(s => {
                                                    const parent = staticCategories.find(c => c.name === newProduct.category);
                                                    return parent && s.categoryId === parent.id;
                                                }).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Asset Visualization</label>
                                            <div className="relative h-64 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-all group overflow-hidden">
                                                <input type="file" id="img-up" className="hidden" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                                                <label htmlFor="img-up" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                                    {imagePreview ? (
                                                        <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <>
                                                            <span className="text-5xl mb-4 group-hover:scale-125 transition-transform">📸</span>
                                                            <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Initialize Visual Stream</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Manifest Data</label>
                                            <textarea placeholder="Describe technical specifications and origins..." className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold focus:bg-white outline-none min-h-[150px] resize-none" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95 transition-all">
                                        Confirm Synchronized Listing
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-12">
                            <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight ml-4">Current Repository</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-1 italic">Managing stock across all categorized nodes</p>
                                </div>
                                <button onClick={() => setActiveTab('add')} className="px-10 py-5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all flex items-center gap-3 group">
                                    <span className="text-xl group-hover:rotate-90 transition-transform">➕</span> Initialize New Sync
                                </button>
                            </div>

                            {products.length === 0 ? (
                                <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[4rem] border border-slate-100 shadow-sm text-center">
                                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-6xl mb-8 animate-pulse grayscale opacity-30">📦</div>
                                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">Repository Depleted</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 max-w-sm">No synchronized products detected in this node. Please initialize listing protocols.</p>
                                    <button onClick={() => setActiveTab('add')} className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all">Start Listing Sync</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {products.map((p, i) => (
                                        <div key={i} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 flex flex-col group relative">
                                            <div className="h-56 relative bg-slate-100">
                                                {p.image ? (
                                                    <img src={`http://localhost:5001/uploads/${p.image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">🍎</div>
                                                )}
                                                <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black text-emerald-700 uppercase tracking-widest shadow-xl border border-white/50">{p.category}</div>
                                            </div>
                                            <div className="p-8 flex-1 flex flex-col">
                                                <h4 className="font-black text-xl text-slate-800 uppercase tracking-tighter mb-2 truncate group-hover:text-emerald-600 transition-colors">{p.name}</h4>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{p.subcategory}</div>
                                                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-2xl font-black text-emerald-600 tracking-tighter">₹{p.price}</span>
                                                    <button onClick={() => handleDeleteProduct(p._id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center font-bold">🗑️</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'ratings' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[2rem] bg-amber-50 text-amber-500 flex items-center justify-center text-4xl shadow-inner font-black">{averageRating}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregated Service Score</p>
                                        <h4 className="text-3xl font-black text-slate-800">Shop Reputation</h4>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center text-4xl shadow-inner font-black">{shopReviews.length + productReviews.length}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback Volume</p>
                                        <h4 className="text-3xl font-black text-slate-800">Total Voices</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Reviews */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Shop Reviews */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="w-2 h-12 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Shop Inquiries</h4>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>
                                    <div className="space-y-6">
                                        {shopReviews.length === 0 ? (
                                            <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 font-bold italic">No shop reviews captured yet.</div>
                                        ) : (
                                            shopReviews.map((rev, idx) => (
                                                <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-2xl">👤</div>
                                                            <div>
                                                                <p className="font-black text-slate-800 text-sm">{rev.userId?.regid?.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`text-sm ${i < rev.rating ? 'text-amber-400' : 'text-slate-200'}`}>⭐</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 font-bold leading-relaxed">{rev.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Product Reviews */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="w-2 h-12 bg-blue-500 rounded-full"></div>
                                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Product Intelligence</h4>
                                        <div className="flex-1 h-px bg-slate-200"></div>
                                    </div>
                                    <div className="space-y-6">
                                        {productReviews.length === 0 ? (
                                            <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 font-bold italic">No catalog feedback detected.</div>
                                        ) : (
                                            productReviews.map((rev, idx) => (
                                                <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">👤</div>
                                                            <div>
                                                                <p className="font-black text-slate-800 text-sm">{rev.userId?.regid?.name}</p>
                                                                <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">{rev.productName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i} className={`text-sm ${i < rev.rating ? 'text-amber-400' : 'text-slate-200'}`}>⭐</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 font-bold leading-relaxed">{rev.comment}</p>
                                                    <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        Captured: {new Date(rev.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ShopDashboard;
