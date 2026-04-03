import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddNurse from './AddNurse';
import ViewNurses from './ViewNurses';

function AdminDashboard({ onLogout }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, shops: 0, products: 0, pendingShops: 0 });
    const [shops, setShops] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [plans, setPlans] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: '',
        duration: 'Monthly',
        description: '',
        image: null,
        groceryAccess: false,
        cleaningAccess: false,
        aiDietAccess: false,
        nurseAccess: false,
        cleaningLevel: 'None',
        aiLevel: 'None',
        maxCleaningBookings: '',
        maxNurseBookings: '',
        status: 'Active'
    });

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, shops, products, users, plans, nurses, cleaners
    const [nurseSubTab, setNurseSubTab] = useState('add'); // add, view
    const [isEditing, setIsEditing] = useState(false);
    const [editPlanId, setEditPlanId] = useState(null);

    useEffect(() => {
        checkAdmin();
        fetchInitialData();
    }, []);

    const checkAdmin = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.usertype !== 'admin') {
            alert('Access Denied');
            navigate('/login');
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchStats(), fetchShops()]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error('Stats error:', err); }
    };

    const fetchShops = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/all-shops');
            const data = await res.json();
            setShops(data);
        } catch (err) { console.error('Shops error:', err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) { console.error('Users error:', err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/admin/products');
            const data = await res.json();
            setProducts(data);
        } catch (err) { console.error('Products error:', err); }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/admin/plans');
            const data = await res.json();
            setPlans(data);
        } catch (err) { console.error('Plans error:', err); }
    };

    const fetchCleaners = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/admin/workers');
            const data = await res.json();
            setCleaners(data.filter(w => w.type !== 'nurse'));
        } catch (err) { console.error('Cleaners error:', err); }
    };

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) fetchUsers();
        if (activeTab === 'products' && products.length === 0) fetchProducts();
        if (activeTab === 'shops' && shops.length === 0) fetchShops();
        if (activeTab === 'plans') fetchPlans();
        if (activeTab === 'cleaners') fetchCleaners();
        if (activeTab === 'dashboard') fetchStats();
    }, [activeTab]);

    const handleStatusUpdate = async (shopId, status) => {
        try {
            const response = await fetch('http://localhost:5001/health/update-shop-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId, status })
            });
            if (response.ok) {
                fetchShops();
                fetchStats();
            }
        } catch (error) { console.error('Error updating status:', error); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete this user permanently?')) return;
        try {
            const response = await fetch(`http://localhost:5001/health/admin/delete-user/${userId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchUsers();
                fetchStats();
            }
        } catch (error) { console.error('Error deleting user:', error); }
    };

    const handleWorkerStatus = async (workerId, status) => {
        try {
            const response = await fetch(`http://localhost:5001/health/admin/update-worker-status/${workerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) fetchCleaners();
        } catch (error) { console.error('Error updating status:', error); }
    };

    const handleWorkerDelete = async (id) => {
        if (!window.confirm('Remove this provider?')) return;
        try {
            const response = await fetch(`http://localhost:5001/health/admin/delete-worker/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) fetchCleaners();
        } catch (error) { console.error('Error deleting provider:', error); }
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(newPlan).forEach(key => {
                if (key === 'image' && newPlan.image) {
                    formData.append('image', newPlan.image);
                } else if (key !== '_id' && key !== '__v') {
                    formData.append(key, newPlan[key]);
                }
            });

            const url = isEditing
                ? `http://localhost:5001/health/admin/update-plan/${editPlanId}`
                : 'http://localhost:5001/health/admin/add-plan';

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                body: formData
            });

            if (response.ok) {
                alert(isEditing ? 'Plan updated!' : 'Plan created!');
                handleCancelEdit();
                fetchPlans();
            }
        } catch (error) { console.error(error); }
    };

    const handleEditClick = (plan) => {
        setIsEditing(true);
        setEditPlanId(plan._id);
        const { _id, __v, ...rest } = plan;
        setNewPlan({ ...rest, image: null });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditPlanId(null);
        setNewPlan({
            name: '', price: '', duration: 'Monthly', description: '', image: null,
            groceryAccess: false, cleaningAccess: false, aiDietAccess: false, nurseAccess: false,
            cleaningLevel: 'None', aiLevel: 'None', maxCleaningBookings: '', maxNurseBookings: '',
            status: 'Active'
        });
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('Delete this plan?')) return;
        try {
            const response = await fetch(`http://localhost:5001/health/admin/delete-plan/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) fetchPlans();
        } catch (error) { console.error(error); }
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate('/login');
    };

    const SidebarItem = ({ id, icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <span className={`text-2xl transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">{label}</span>
        </button>
    );

    const StatCard = ({ icon, label, value, color }) => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-[0.03] group-hover:scale-150 transition-transform duration-700 bg-${color}-500`}></div>
            <div className={`w-16 h-16 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform`}>{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
            </div>
        </div>
    );

    if (loading && activeTab === 'dashboard') return <div className="flex justify-center items-center h-screen bg-slate-950 text-indigo-500 font-black tracking-widest uppercase animate-pulse">Initializing System Core...</div>;

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-80 bg-slate-950 text-white fixed h-screen flex flex-col z-50">
                <div className="p-10 border-b border-slate-900">
                    <h1 className="text-2xl font-black tracking-tighter text-indigo-400">HEALTHHUB<span className="text-white">.OS</span></h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Administrative Core</p>
                </div>

                <div className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <SidebarItem id="dashboard" icon="📊" label="Overview" />
                    <SidebarItem id="shops" icon="🏪" label="Shop Control" />
                    <SidebarItem id="products" icon="📦" label="Global Catalog" />
                    <SidebarItem id="users" icon="👤" label="Active Users" />
                    <SidebarItem id="plans" icon="💎" label="Premium Plans" />
                    <SidebarItem id="nurses" icon="👩‍⚕️" label="Medical Staff" />
                    <SidebarItem id="cleaners" icon="🧹" label="Service Providers" />
                </div>

                <div className="p-8 border-t border-slate-900">
                    <button onClick={handleLogout} className="w-full py-5 bg-slate-900 hover:bg-rose-600 transition-all text-rose-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                        <span>🚪</span> Terminate Session
                    </button>
                </div>
            </aside>

            {/* Main Section */}
            <main className="ml-80 flex-1 p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                            {activeTab === 'dashboard' ? 'Kernel Overview' : activeTab.replace(/([A-Z])/g, ' $1')}
                        </h2>
                        <p className="text-slate-400 font-bold text-sm mt-1">{activeTab === 'dashboard' ? 'Real-time metrics and system health.' : 'Manage and view detailed records.'}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-full border border-slate-200">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Root Authority</span>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <StatCard icon="👥" label="Total Registry" value={stats.users} color="indigo" />
                                <StatCard icon="🏪" label="Active Vendors" value={stats.shops} color="emerald" />
                                <StatCard icon="⚠️" label="Pending Sync" value={stats.pendingShops} color="amber" />
                                <StatCard icon="📦" label="Stock Modules" value={stats.products} color="purple" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm">
                                    <h3 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 uppercase tracking-tight">Intelligence Feed</h3>
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors">⚡</div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700">System event log generated successfully.</p>
                                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Status: Stable • Response Time: 42ms</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                                    <h3 className="text-3xl font-black mb-6 tracking-tight">Core Status</h3>
                                    <div className="flex items-center gap-4 py-6 border-y border-white/10">
                                        <div className="text-4xl text-emerald-400">🛡️</div>
                                        <div>
                                            <p className="font-black text-xl">Protected</p>
                                            <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">Global Firewall Active</p>
                                        </div>
                                    </div>
                                    <button className="mt-12 w-full py-5 bg-white text-indigo-600 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Export Logs</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shops' && (
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-950 text-white">
                                    <tr>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Identity</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Infrastructure</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Status</th>
                                        <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Commands</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {shops.map(shop => (
                                        <tr key={shop._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{shop.shopName}</div>
                                                <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{shop.ownerName} • {shop.email}</div>
                                            </td>
                                            <td className="px-10 py-8 text-sm font-bold text-slate-500 max-w-xs italic line-clamp-2">{shop.address}</td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${shop.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : shop.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {shop.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {shop.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => handleStatusUpdate(shop._id, 'approved')} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">Authorize</button>
                                                        <button onClick={() => handleStatusUpdate(shop._id, 'rejected')} className="px-6 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20">Revoke</button>
                                                    </div>
                                                ) : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Immutable Record</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-950 text-white">
                                    <tr>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Material</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Value</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Classification</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products.map(p => (
                                        <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-10 py-8 flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl overflow-hidden border border-slate-200 group-hover:scale-110 transition-transform">
                                                    {p.image ? <img src={`http://localhost:5001/uploads/${p.image}`} alt={p.name} className="w-full h-full object-cover" /> : '📦'}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{p.name}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.subcategory}</div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 font-black text-emerald-600 text-xl tracking-tighter">₹{p.price}</td>
                                            <td className="px-10 py-8">
                                                <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-700 text-xs uppercase tracking-tight">{p.shopId?.shopName || 'External Vendor'}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.shopId?.ownerName}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-950 text-white">
                                    <tr>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">User Base</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Bio-Metrics</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Protocol</th>
                                        <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map(u => (
                                        <tr key={u._id} className="hover:bg-slate-50 transition-all">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{u.regid?.name || 'Null User'}</div>
                                                <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{u.email}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-tighter w-10">Age:</span>
                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{u.regid?.age || '??'} Yrs</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-tighter w-10">Blood:</span>
                                                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase">
                                                            {u.regid?.medicalHistory?.bloodGroup || 'Not Set'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.regid?.membershipPlan === 'None' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}>
                                                    {u.regid?.membershipPlan || 'None'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <button onClick={() => handleDeleteUser(u._id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center font-bold shadow-sm inline-flex">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'plans' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 h-fit sticky top-12">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{isEditing ? 'Modify Plan' : 'Initialize Plan'}</h3>
                                    {isEditing && <button onClick={handleCancelEdit} className="text-rose-500 font-black text-[10px] uppercase tracking-widest hover:underline">Cancel</button>}
                                </div>
                                <form onSubmit={handleAddPlan} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Configuration</label>
                                            <input type="text" placeholder="Plan Name" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black focus:ring-4 ring-indigo-500/10 outline-none transition-all" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} required />
                                            <input type="number" placeholder="Credit Cost (₹)" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black focus:ring-4 ring-indigo-500/10 outline-none transition-all mt-2" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} required />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Permissions & Quotas</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Grocery */}
                                                <label className={`flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-all ${newPlan.groceryAccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <input type="checkbox" className="hidden" checked={newPlan.groceryAccess} onChange={e => setNewPlan({ ...newPlan, groceryAccess: e.target.checked })} />
                                                        <span className="text-lg">🛒</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Grocery</span>
                                                    </div>
                                                </label>

                                                {/* Cleaning */}
                                                <div className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${newPlan.cleaningAccess ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="hidden" checked={newPlan.cleaningAccess} onChange={e => setNewPlan({ ...newPlan, cleaningAccess: e.target.checked })} />
                                                        <span className="text-lg">🧹</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Cleaning</span>
                                                    </label>
                                                    {newPlan.cleaningAccess && (
                                                        <div className="space-y-2 mt-2">
                                                            <select className="w-full text-[9px] font-black bg-white rounded-lg p-1 outline-none border border-blue-100" value={newPlan.cleaningLevel} onChange={e => setNewPlan({ ...newPlan, cleaningLevel: e.target.value })}>
                                                                <option value="None">Level: None</option>
                                                                <option value="Basic">Level: Basic</option>
                                                                <option value="Professional">Level: Professional</option>
                                                                <option value="Unlimited">Level: Unlimited</option>
                                                            </select>
                                                            <input type="number" placeholder="Max/mo" className="w-full text-[9px] font-black bg-white rounded-lg p-1 border border-blue-100" value={newPlan.maxCleaningBookings} onChange={e => setNewPlan({ ...newPlan, maxCleaningBookings: e.target.value })} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* AI Diet */}
                                                <div className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${newPlan.aiDietAccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="hidden" checked={newPlan.aiDietAccess} onChange={e => setNewPlan({ ...newPlan, aiDietAccess: e.target.checked })} />
                                                        <span className="text-lg">🤖</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">AI Diet</span>
                                                    </label>
                                                    {newPlan.aiDietAccess && (
                                                        <div className="space-y-2 mt-2">
                                                            <select className="w-full text-[9px] font-black bg-white rounded-lg p-1 outline-none border border-emerald-100" value={newPlan.aiLevel} onChange={e => setNewPlan({ ...newPlan, aiLevel: e.target.value })}>
                                                                <option value="None">Level: None</option>
                                                                <option value="Basic">Level: Basic</option>
                                                                <option value="Premium">Level: Premium</option>
                                                                <option value="Unlimited">Level: Unlimited</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Nurse Access */}
                                                <div className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${newPlan.nurseAccess ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="hidden" checked={newPlan.nurseAccess} onChange={e => setNewPlan({ ...newPlan, nurseAccess: e.target.checked })} />
                                                        <span className="text-lg">👩‍⚕️</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Nurse</span>
                                                    </label>
                                                    {newPlan.nurseAccess && (
                                                        <div className="space-y-2 mt-2">
                                                            <input type="number" placeholder="Visits/mo" className="w-full text-[9px] font-black bg-white rounded-lg p-1 border border-rose-100" value={newPlan.maxNurseBookings} onChange={e => setNewPlan({ ...newPlan, maxNurseBookings: e.target.value })} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <textarea placeholder="Service Module Description" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm h-32 resize-none outline-none focus:ring-4 ring-indigo-500/10 placeholder:text-slate-300" value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}></textarea>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-xs">Banner Asset</label>
                                            <input type="file" accept="image/*" className="w-full px-4 py-3 bg-slate-50 rounded-xl" onChange={e => setNewPlan({ ...newPlan, image: e.target.files[0] })} />
                                        </div>

                                        <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all">
                                            {isEditing ? 'Push Updates' : 'Deploy Protocol'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {plans.map(plan => (
                                    <div key={plan._id} className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative">
                                        <div className="h-40 bg-slate-200 relative overflow-hidden">
                                            {plan.image && <img src={`http://localhost:5001/uploads/${plan.image}`} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt="" />}
                                            <div className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur text-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-xl">💎</div>
                                        </div>
                                        <div className="p-10">
                                            <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">{plan.name}</h4>
                                            <div className="text-4xl font-black text-indigo-600 tracking-tighter mb-8">₹{plan.price}</div>

                                            <div className="space-y-3 mb-10">
                                                {plan.groceryAccess && (
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <span className="text-emerald-500">✓</span> Unlimited Grocery Access
                                                    </div>
                                                )}
                                                {plan.cleaningAccess && (
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <span className="text-blue-500">✓</span> {plan.cleaningLevel} Cleaning ({plan.maxCleaningBookings} / mo)
                                                    </div>
                                                )}
                                                {plan.aiDietAccess && (
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <span className="text-emerald-500">✓</span> {plan.aiLevel} AI Diet Plan
                                                    </div>
                                                )}
                                                {plan.nurseAccess && (
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        <span className="text-rose-500">✓</span> Nurse Visits ({plan.maxNurseBookings} / mo)
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={() => handleEditClick(plan)} className="flex-1 py-4 bg-slate-50 hover:bg-indigo-500 hover:text-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Modify</button>
                                                <button onClick={() => handleDeletePlan(plan._id)} className="w-14 h-14 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center">🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'nurses' && (
                        <div className="space-y-12">
                            <div className="flex bg-slate-100 p-2 rounded-3xl w-fit gap-2">
                                <button onClick={() => setNurseSubTab('add')} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${nurseSubTab === 'add' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Recruitment</button>
                                <button onClick={() => setNurseSubTab('view')} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${nurseSubTab === 'view' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Personnel Registry</button>
                            </div>

                            <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm overflow-hidden">
                                {nurseSubTab === 'add' ? <AddNurse /> : <ViewNurses />}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cleaners' && (
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-950 text-white">
                                    <tr>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Provider Persona</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Specialization</th>
                                        <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Security Status</th>
                                        <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {cleaners.map(worker => (
                                        <tr key={worker._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{worker.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest font-mono">ID_{worker._id.slice(-6)}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{worker.type} • {worker.experience} yrs</span>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${worker.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : worker.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {worker.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right flex gap-3 justify-end items-center">
                                                {worker.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleWorkerStatus(worker._id, 'approved')} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Verify</button>
                                                        <button onClick={() => handleWorkerStatus(worker._id, 'rejected')} className="px-6 py-2 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Deny</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleWorkerDelete(worker._id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {cleaners.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">No pending provider requests. System secure.</div>}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
