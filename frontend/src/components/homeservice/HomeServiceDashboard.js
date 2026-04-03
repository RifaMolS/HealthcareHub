import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomeServiceDashboard({ user: initialUser, onLogout }) {
    const navigate = useNavigate();
    const [user] = useState(initialUser || JSON.parse(localStorage.getItem('user')));
    const [bookings, setBookings] = useState([]);
    const [members, setMembers] = useState([]);
    const [providerServices, setProviderServices] = useState([]);
    const [slots, setSlots] = useState([]);
    const [usersWithPlans, setUsersWithPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ services: 0, activeMembers: 0, pending: 0 });

    // Form States
    const [newSlot, setNewSlot] = useState({ date: '', time: '' });
    const [newService, setNewService] = useState({ serviceNames: [], planLevel: 'Silver', description: '' });

    const AVAILABLE_SERVICES = [
        "Home Cleaning", "Floor Cleaning", "Bathroom Cleaning",
        "Complete Dust Removal", "Surroundings Cleaning", "Advanced Equipment cleaning"
    ];
    const [newMember, setNewMember] = useState({ name: '', phone: '' });
    const [selectedMemberForBooking, setSelectedMemberForBooking] = useState({});
    const [editingService, setEditingService] = useState(null);

    const workerId = user?.regid?._id || user?.regid;

    const getMaxMembers = (plan) => {
        if (!plan) return 1;
        const p = plan.toUpperCase();
        if (p.includes('PLATINUM')) return 6; // Advanced with members and advanced equipments
        if (p.includes('GOLD')) return 4;
        if (p.includes('SILVER')) return 2;
        return 1;
    };

    useEffect(() => {
        if (!user || user.usertype !== 'homeservice') {
            navigate('/login');
        } else {
            fetchAllData();
            // Polling for new bookings every 30 seconds
            const interval = setInterval(fetchBookings, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const pendingCount = bookings.filter(b => b.status === 'Pending').length;
        if (pendingCount > stats.pending) {
            // New booking arrived
            alert(`🔔 New Service Request! You have ${pendingCount} pending appointments.`);
        }
        setStats(prev => ({
            ...prev,
            services: bookings.length,
            pending: pendingCount
        }));
    }, [bookings]);

    const fetchAllData = () => {
        fetchBookings();
        fetchMembers();
        fetchServices();
        fetchSlots();
        fetchUsersWithPlans();
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch(`http://localhost:5001/health/provider-bookings/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch(`http://localhost:5001/health/provider-members/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
                setStats(prev => ({ ...prev, activeMembers: data.length }));
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`http://localhost:5001/health/provider-services/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setProviderServices(data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const fetchSlots = async () => {
        try {
            const res = await fetch(`http://localhost:5001/health/worker-slots/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const fetchUsersWithPlans = async () => {
        try {
            const res = await fetch(`http://localhost:5001/health/users-service-plans`);
            if (res.ok) {
                const data = await res.json();
                setUsersWithPlans(data);
            }
        } catch (error) {
            console.error('Error fetching users with plans:', error);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/health/add-slot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newSlot, workerId })
            });
            if (res.ok) {
                setNewSlot({ date: '', time: '' });
                fetchSlots();
                alert('Slot added successfully');
            }
        } catch (error) {
            console.error('Error adding slot:', error);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        if (newService.serviceNames.length === 0) {
            alert('Please select at least one service');
            return;
        }
        try {
            const promises = newService.serviceNames.map(name =>
                fetch('http://localhost:5001/health/add-provider-service', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serviceName: name,
                        planLevel: newService.planLevel,
                        description: newService.description,
                        workerId
                    })
                })
            );
            const responses = await Promise.all(promises);
            const failed = responses.filter(r => !r.ok);

            if (failed.length > 0) {
                const errorData = await failed[0].json();
                alert(errorData.message || 'Some services could not be added (possibly already exists)');
            } else {
                alert('Services added successfully');
            }

            setNewService({ serviceNames: [], planLevel: 'Silver', description: '' });
            fetchServices();
        } catch (error) {
            console.error('Error adding service:', error);
        }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5001/health/update-provider-service/${editingService._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingService)
            });
            if (res.ok) {
                setEditingService(null);
                fetchServices();
                alert('Service updated successfully');
            }
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            const res = await fetch(`http://localhost:5001/health/delete-provider-service/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchServices();
            }
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/health/add-provider-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newMember, workerId })
            });
            if (res.ok) {
                setNewMember({ name: '', phone: '' });
                fetchMembers();
                alert('Member added successfully');
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleAssignMember = async (bookingId, maxMembers) => {
        const memberIds = selectedMemberForBooking[bookingId] || [];
        if (memberIds.length === 0) {
            alert('Please select at least one member.');
            return;
        }
        if (memberIds.length > maxMembers) {
            alert(`Based on the resident's active plan, you can assign up to ${maxMembers} member(s) to this request.`);
            return;
        }

        try {
            const res = await fetch('http://localhost:5001/health/assign-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, memberIds })
            });
            if (res.ok) {
                fetchBookings();
                fetchMembers(); // Update member status to Busy
                setSelectedMemberForBooking(prev => ({ ...prev, [bookingId]: [] })); // Clear selection
                alert('Members assigned and booking confirmed');
            }
        } catch (error) {
            console.error('Error assigning members:', error);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:5001/health/booking-status/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchBookings();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate('/login');
    };

    const navItemClass = (tab) => `
        w-full text-left flex items-center gap-3 px-6 py-4 mb-2 rounded-2xl transition-all duration-300 group
        ${activeTab === tab
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
    `;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <nav className="w-72 bg-slate-900 text-white flex flex-col fixed h-screen shadow-2xl z-20 transition-all duration-300">
                <div className="p-8 border-b border-slate-800 tracking-tight">
                    <h1 className="text-2xl font-black text-blue-500 flex items-center gap-2">
                        <span className="text-3xl">🏠</span> HomeHub
                    </h1>
                    <span className="text-[10px] text-slate-500 block mt-2 font-black uppercase tracking-[0.3em]">Home Specialist Portal</span>
                </div>

                <div className="flex-grow p-6 space-y-2 overflow-y-auto">
                    <button className={navItemClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
                        <span className="text-xl transition-transform group-hover:scale-110">📊</span>
                        <span className="tracking-wide text-sm font-bold">Dashboard</span>
                    </button>
                    <button className={navItemClass('addSlot')} onClick={() => setActiveTab('addSlot')}>
                        <span className="text-xl transition-transform group-hover:scale-110">➕</span>
                        <span className="tracking-wide text-sm font-bold">Add Slot</span>
                    </button>
                    <button className={navItemClass('viewAppointments')} onClick={() => setActiveTab('viewAppointments')}>
                        <span className="text-xl transition-transform group-hover:scale-110">📅</span>
                        <span className="tracking-wide text-sm font-bold">View Appointments</span>
                    </button>
                    <button className={navItemClass('services')} onClick={() => setActiveTab('services')}>
                        <span className="text-xl transition-transform group-hover:scale-110">🛠️</span>
                        <span className="tracking-wide text-sm font-bold">Services</span>
                    </button>
                    <button className={navItemClass('members')} onClick={() => setActiveTab('members')}>
                        <span className="text-xl transition-transform group-hover:scale-110">💎</span>
                        <span className="tracking-wide text-sm font-bold">Members</span>
                    </button>
                    <button className={navItemClass('usersView')} onClick={() => setActiveTab('usersView')}>
                        <span className="text-xl transition-transform group-hover:scale-110">👥</span>
                        <span className="tracking-wide text-sm font-bold">Users View</span>
                    </button>
                </div>

                <div className="p-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                            {user?.regid?.name?.charAt(0) || 'H'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-slate-100 truncate text-sm">{user?.regid?.name || 'Pro'}</h4>
                            <p className="text-[10px] text-blue-400 font-black truncate uppercase tracking-widest text-xs">Home Specialist</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl font-black text-sm transition-all duration-300 flex justify-center items-center gap-3 shadow-sm border border-blue-500/20"
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="ml-72 flex-grow p-10 bg-slate-50 min-h-screen">
                <header className="flex justify-between items-center mb-12 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')} <span className="text-blue-600">.</span>
                        </h2>
                        <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Expert Home Maintenance System
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-blue-700 font-black text-xs uppercase tracking-widest">Active Status</span>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">📊</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Service Volume</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.services}</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">💎</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Total Members</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.activeMembers}</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">⏳</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Queue Size</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                                <div>
                                    <h3 className="text-3xl font-black mb-4">Elevate your service quality</h3>
                                    <p className="opacity-80 font-bold max-w-md">Manage your slots and workers to provide the best home cleaning experience.</p>
                                </div>
                                <button className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all" onClick={() => setActiveTab('services')}>
                                    Update Services
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                        </div>
                    </div>
                )}

                {activeTab === 'addSlot' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                        <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📅</span>
                                Create Availability Slot
                            </h3>
                            <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-blue-500 transition-all font-bold text-slate-700"
                                        value={newSlot.date}
                                        onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Time Slot</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-blue-500 transition-all font-bold text-slate-700"
                                        value={newSlot.time}
                                        onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all">
                                    Add Available Slot
                                </button>
                            </form>
                        </section>

                        <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 mb-6 font-black uppercase tracking-widest text-xs opacity-50">Existing Slots</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {slots.map((s, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center group hover:bg-blue-50 hover:border-blue-100 transition-all">
                                        <div className="font-black text-slate-800 group-hover:text-blue-600">{s.date}</div>
                                        <div className="text-xs font-bold text-slate-400 mt-1">{s.time}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'viewAppointments' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                            <div className="p-10 border-b border-slate-50">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl shadow-inner">📋</span>
                                    Operational Queue
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                        <tr>
                                            <th className="px-10 py-6 text-left">Resident</th>
                                            <th className="px-10 py-6 text-left">Requirement</th>
                                            <th className="px-10 py-6 text-left">Logistics</th>
                                            <th className="px-10 py-6 text-left">Team Allocation</th>
                                            <th className="px-10 py-6 text-left">Internal Status</th>
                                            <th className="px-10 py-6 text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold">
                                        {bookings.map(book => (
                                            <tr key={book._id} className="hover:bg-slate-50/50 transition-all group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-inner font-black group-hover/row:scale-110 transition-transform">
                                                            {book.userId?.regid?.name?.charAt(0) || 'R'}
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-800 text-lg mb-1 tracking-tighter">{book.userId?.regid?.name || 'Customer'}</div>
                                                            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <span className="text-indigo-400">📞</span> {book.userId?.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border border-transparent ${book.serviceType.includes('Cleaning') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-violet-50 text-violet-600 border-violet-100'
                                                        }`}>
                                                        {book.serviceType}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="text-slate-700 text-sm mb-1">{book.date}</div>
                                                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">{book.time}</div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    {book.status === 'Pending' ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${book.userId?.regid?.membershipPlan === 'Platinum' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                    Plan: <span className="text-slate-700">{book.userId?.regid?.membershipPlan || 'Entry'}</span>
                                                                    ({getMaxMembers(book.userId?.regid?.membershipPlan)} MAX)
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-3 min-w-[250px]">
                                                                {members.filter(m => m.status === 'Available').map(m => (
                                                                    <label key={m._id} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border-2 border-slate-100 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm group">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                                            checked={(selectedMemberForBooking[book._id] || []).includes(m._id)}
                                                                            onChange={(e) => {
                                                                                const current = selectedMemberForBooking[book._id] || [];
                                                                                const updated = e.target.checked
                                                                                    ? [...current, m._id]
                                                                                    : current.filter(id => id !== m._id);
                                                                                setSelectedMemberForBooking({ ...selectedMemberForBooking, [book._id]: updated });
                                                                            }}
                                                                        />
                                                                        <span className="text-xs font-black text-slate-700 group-hover:text-indigo-900 whitespace-nowrap">{m.name}</span>
                                                                    </label>
                                                                ))}
                                                                {members.filter(m => m.status === 'Available').length === 0 && (
                                                                    <span className="text-xs text-rose-500 font-bold italic col-span-2">No active members available</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {book.memberIds && book.memberIds.length > 0 ? (
                                                                book.memberIds.map((m, i) => (
                                                                    <div key={i} className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">{m.name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-slate-400 text-xs italic">Team allocation failed</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-sm border ${book.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        book.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                            book.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                'bg-slate-50 text-slate-700 border-slate-100'
                                                        }`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right space-x-3">
                                                    {book.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleAssignMember(
                                                                book._id,
                                                                getMaxMembers(book.userId?.regid?.membershipPlan)
                                                            )}
                                                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] text-[10px] shadow-xl shadow-indigo-600/20 transition-all font-black uppercase tracking-[0.2em] active:scale-95"
                                                        >
                                                            Confirm Assignment
                                                        </button>
                                                    )}
                                                    {book.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(book._id, 'Completed')}
                                                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.2rem] text-[10px] shadow-xl shadow-emerald-500/20 transition-all font-black uppercase tracking-[0.2em]"
                                                        >
                                                            Mark Delivered
                                                        </button>
                                                    )}
                                                    {book.status === 'Completed' && (
                                                        <div className="flex items-center justify-end gap-2 text-emerald-500">
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Service Verified</span>
                                                            <span className="text-lg">✅</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                        <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">🛠️</span>
                                Register New Service
                            </h3>
                            <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                <div className="space-y-3 col-span-full md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Select Services (Multiple)</label>
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        {AVAILABLE_SERVICES.map(s => (
                                            <label key={s} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-all cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 checked:bg-indigo-600 transition-all cursor-pointer"
                                                    checked={newService.serviceNames.includes(s)}
                                                    onChange={(e) => {
                                                        const names = e.target.checked
                                                            ? [...newService.serviceNames, s]
                                                            : newService.serviceNames.filter(n => n !== s);
                                                        setNewService({ ...newService, serviceNames: names });
                                                    }}
                                                />
                                                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{s}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Plan Accessibility</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 transition-all font-bold text-slate-700 h-[60px]"
                                        value={newService.planLevel}
                                        onChange={(e) => setNewService({ ...newService, planLevel: e.target.value })}
                                    >
                                        <option value="Silver">Silver</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Platinum">Platinum</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Extra Features / Equipment</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Using high-pressure washers..."
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 transition-all font-bold text-slate-700 h-[60px]"
                                        value={newService.description}
                                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-full mt-4">
                                    <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/30 hover:-translate-y-1 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                                        <span className="text-xl">🚀</span> Register Selected Services
                                    </button>
                                </div>
                            </form>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {['Silver', 'Gold', 'Platinum'].map(plan => (
                                <div key={plan} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-xl font-black text-slate-800">{plan} Level</h4>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${plan === 'Platinum' ? 'bg-amber-100 text-amber-600' :
                                            plan === 'Gold' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {providerServices.filter(s => s.planLevel === plan).length} Tasks
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {providerServices.filter(s => s.planLevel === plan).map((s, idx) => (
                                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                                                <div>
                                                    <div className="font-bold text-slate-700">{s.serviceName}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{s.description || 'Professional grade service'}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingService(s)}
                                                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(s._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {providerServices.filter(s => s.planLevel === plan).length === 0 && (
                                            <div className="text-center py-6 text-slate-400 text-xs font-bold italic">No specialized services added</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Edit Service Modal */}
                        {editingService && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                                <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300">
                                    <h3 className="text-2xl font-black text-slate-800 mb-6 font-black tracking-tight">Edit Service</h3>
                                    <form onSubmit={handleUpdateService} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Name</label>
                                            <select
                                                required
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold text-slate-700"
                                                value={editingService.serviceName}
                                                onChange={(e) => setEditingService({ ...editingService, serviceName: e.target.value })}
                                            >
                                                {AVAILABLE_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</label>
                                            <select
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold text-slate-700"
                                                value={editingService.planLevel}
                                                onChange={(e) => setEditingService({ ...editingService, planLevel: e.target.value })}
                                            >
                                                <option value="Silver">Silver</option>
                                                <option value="Gold">Gold</option>
                                                <option value="Platinum">Platinum</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extra Features</label>
                                            <input
                                                type="text"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold text-slate-700"
                                                value={editingService.description}
                                                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all">Save Changes</button>
                                            <button type="button" onClick={() => setEditingService(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                        <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">💎</span>
                                Add Team Member
                            </h3>
                            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-emerald-500 transition-all font-bold text-slate-700"
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Contact Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-emerald-500 transition-all font-bold text-slate-700"
                                        value={newMember.phone}
                                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/30 hover:-translate-y-1 transition-all">
                                    Add Member
                                </button>
                            </form>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {members.map(member => (
                                <div key={member._id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-3xl mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">👤</div>
                                    <h4 className="text-xl font-black text-slate-800 mb-1">{member.name}</h4>
                                    <p className="text-slate-400 font-bold text-sm mb-6">{member.phone}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${member.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>{member.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'usersView' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10 blur-3xl"></div>
                            <div>
                                <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                                    Resident Intelligence
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                </h2>
                                <p className="text-slate-500 font-bold text-sm mt-2 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">👤</span>
                                    Comprehensive view of active service subscribers
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Residents</div>
                                    <div className="text-xl font-black text-slate-800">{usersWithPlans.length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {usersWithPlans.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group">
                                    <div className={`p-10 flex items-center gap-8 ${item.plan === 'Platinum' ? 'bg-gradient-to-br from-amber-500/10 to-transparent' :
                                        item.plan === 'Gold' ? 'bg-gradient-to-br from-blue-500/10 to-transparent' :
                                            'bg-gradient-to-br from-slate-500/10 to-transparent'
                                        }`}>
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-4xl font-black text-slate-800 border-2 border-slate-100 group-hover:scale-110 transition-transform duration-700">
                                                {item.user?.regid?.name?.charAt(0) || item.user?.name?.charAt(0)}
                                            </div>
                                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg ${item.plan === 'Platinum' ? 'bg-amber-500 text-white' :
                                                item.plan === 'Gold' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                                                }`}>
                                                {item.plan === 'Platinum' ? '💎' : item.plan === 'Gold' ? '⭐' : '🔘'}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-slate-800 text-2xl tracking-tighter">{item.user?.regid?.name || item.user?.name}</h4>
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${item.plan === 'Platinum' ? 'bg-amber-500 text-white' :
                                                    item.plan === 'Gold' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-white'
                                                    }`}>
                                                    {item.plan} Plan
                                                </span>
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                                <span>📧 {item.user?.email}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-10 bg-slate-50/30 backdrop-blur-sm flex-1">
                                        <div className="flex items-center justify-between mb-8">
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Activity Timeline</h5>
                                            <span className="h-px flex-1 bg-slate-100 mx-6"></span>
                                        </div>

                                        <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                            {item.bookings.length > 0 ? item.bookings.map((booking, bIdx) => (
                                                <div key={bIdx} className="relative pl-8 pb-8 last:pb-0 group/item">
                                                    {bIdx !== item.bookings.length - 1 && (
                                                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100"></div>
                                                    )}
                                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-lg border-4 border-white shadow-md transition-all duration-300 group-hover/item:scale-125 ${booking.status === 'Completed' ? 'bg-emerald-500' :
                                                        booking.status === 'Cancelled' ? 'bg-rose-500' : 'bg-blue-500'
                                                        }`}></div>

                                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group-hover/item:shadow-md transition-all">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="font-black text-slate-800 text-sm">{booking.serviceType}</div>
                                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                                    📅 {booking.date} • {booking.time}
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${booking.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                                booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                                                    'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {booking.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-500">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                                                            Assigned: <span className="text-slate-800 uppercase tracking-tighter">
                                                                {booking.assignedMembers && booking.assignedMembers !== 'Not Assigned' ? booking.assignedMembers : "Specialist Pending"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-10 text-center text-slate-400 italic text-sm font-bold">
                                                    No service records found for this resident.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default HomeServiceDashboard;
