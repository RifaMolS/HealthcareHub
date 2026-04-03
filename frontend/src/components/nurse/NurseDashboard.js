import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function NurseDashboard({ user: initialUser, onLogout }) {
    const navigate = useNavigate();
    const [user] = useState(initialUser || JSON.parse(localStorage.getItem('user')));
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ appointments: 0, completed: 0, pending: 0 });

    useEffect(() => {
        if (!user || user.usertype !== 'nurse') {
            navigate('/login');
        } else {
            fetchBookings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchBookings = async () => {
        try {
            const workerId = typeof user.regid === 'object' ? user.regid._id : user.regid;
            const res = await fetch(`http://localhost:5001/health/provider-bookings/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
                // Simple stats
                setStats({
                    appointments: data.length,
                    completed: data.filter(b => b.status === 'Completed').length,
                    pending: data.filter(b => b.status === 'Pending').length
                });
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
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
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-bold'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
    `;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <nav className="w-72 bg-slate-900 text-white flex flex-col fixed h-screen shadow-2xl z-20 transition-all duration-300">
                <div className="p-8 border-b border-slate-800 tracking-tight">
                    <h1 className="text-2xl font-black text-rose-500 flex items-center gap-2">
                        <span className="text-3xl">🏥</span> NurseHub
                    </h1>
                    <span className="text-[10px] text-slate-500 block mt-2 font-black uppercase tracking-[0.3em]">Nursing Professional Portal</span>
                </div>

                <div className="flex-grow p-6 space-y-2 overflow-y-auto">
                    <button className={navItemClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
                        <span className="text-xl transition-transform group-hover:scale-110">📊</span>
                        <span className="tracking-wide">Dashboard</span>
                    </button>
                    <button className={navItemClass('appointments')} onClick={() => setActiveTab('appointments')}>
                        <span className="text-xl transition-transform group-hover:scale-110">📅</span>
                        <span className="tracking-wide">Appointments</span>
                    </button>
                    <button className={navItemClass('users')} onClick={() => setActiveTab('users')}>
                        <span className="text-xl transition-transform group-hover:scale-110">👥</span>
                        <span className="tracking-wide">User View</span>
                    </button>
                    <button className={navItemClass('reports')} onClick={() => setActiveTab('reports')}>
                        <span className="text-xl transition-transform group-hover:scale-110">📄</span>
                        <span className="tracking-wide">Booked Reports</span>
                    </button>
                </div>

                <div className="p-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-rose-500/20">
                            {user?.regid?.name?.charAt(0) || 'N'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-slate-100 truncate text-sm">{user?.regid?.name || 'Nurse'}</h4>
                            <p className="text-[10px] text-rose-400 font-black truncate uppercase tracking-widest text-xs">Registered Nurse</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-sm transition-all duration-300 flex justify-center items-center gap-3 shadow-sm border border-rose-500/20"
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="ml-72 flex-grow p-10 bg-slate-50 min-h-screen">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                            Health Station <span className="text-rose-600">.</span>
                        </h2>
                        <p className="text-slate-500 font-bold flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Logged in as Professional Nurse
                        </p>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">📊</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Total Care Calls</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.appointments}</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">✅</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Completed</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.completed}</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-2xl transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">⏳</div>
                                <div>
                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Pending Action</h4>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 h-96 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-6">📈</div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Performance Analytics</h3>
                            <p className="text-slate-500 font-bold max-w-sm">Deeper stats and patient recovery metrics will appear here after more appointments.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shadow-inner font-black">📅</span>
                                    Patient Attendance Queue
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 italic">Live Updates</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                        <tr>
                                            <th className="px-10 py-6 text-left">Resident Details</th>
                                            <th className="px-10 py-6 text-left">Clinical Service</th>
                                            <th className="px-10 py-6 text-left">Schedule</th>
                                            <th className="px-10 py-6 text-left">Priority Status</th>
                                            <th className="px-10 py-6 text-right">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold">
                                        {bookings.map(book => (
                                            <tr key={book._id} className="hover:bg-slate-50/50 transition-all group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl shadow-inner font-black group-hover/row:scale-110 transition-transform duration-500">
                                                            {book.userId?.regid?.name?.charAt(0) || 'P'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 text-lg mb-1 tracking-tighter">{book.userId?.regid?.name || 'Customer'}</div>
                                                            <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                                <span className="text-rose-400">📞</span> {book.userId?.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-indigo-100">
                                                        {book.serviceType}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="text-slate-700 text-sm mb-1">{book.date}</div>
                                                    <div className="text-[10px] text-rose-500 font-black uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg inline-block border border-rose-100">{book.time}</div>
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
                                                <td className="px-10 py-8 text-right space-x-3 whitespace-nowrap">
                                                    {book.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(book._id, 'Confirmed')}
                                                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            Accept Patient
                                                        </button>
                                                    )}
                                                    {book.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(book._id, 'Completed')}
                                                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            Mark Finished
                                                        </button>
                                                    )}
                                                    {book.status === 'Completed' && (
                                                        <div className="flex items-center justify-end gap-3 text-emerald-500">
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Care Delivered</span>
                                                            <span className="text-xl">✨</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {bookings.length === 0 && (
                                    <div className="py-32 text-center flex flex-col items-center">
                                        <div className="text-7xl mb-6 opacity-20">📭</div>
                                        <h4 className="text-xl font-black text-slate-400">Station is quiet...</h4>
                                        <p className="text-slate-400 font-bold mt-2">No active appointments at this moment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl shadow-inner font-black">👥</span>
                                    Resident Intelligence
                                </h3>
                            </div>
                            <div className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from(new Map(bookings.filter(b => b.userId && b.userId.regid).map(b => [b.userId._id, {
                                        id: b.userId._id,
                                        name: b.userId.regid.name,
                                        phone: b.userId.phone,
                                        reports: b.userId.regid.medicalHistory?.reports || [],
                                        bookings: bookings.filter(book => book.userId && book.userId._id === b.userId._id)
                                    }])).values()).map(user => (
                                        <div key={user.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50 hover:shadow-lg transition-all group">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black shadow-inner group-hover:scale-110 transition-transform">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{user.name}</h4>
                                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"><span className="text-indigo-400">📞</span> {user.phone}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-indigo-200">Clinical History ({user.bookings.length} Encounters)</p>
                                                {user.bookings.slice(0, 3).map((book, idx) => (
                                                    <div key={idx} className="bg-white px-4 py-3 rounded-2xl flex justify-between items-center shadow-sm">
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{book.serviceType}</span>
                                                        <span className="text-[10px] font-black text-slate-400">{book.date}</span>
                                                    </div>
                                                ))}
                                                {user.bookings.length > 3 && <p className="text-[10px] text-center font-bold text-slate-400">+{user.bookings.length - 3} older records</p>}

                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-emerald-200 mt-4">Medical Documents ({user.reports.length})</p>
                                                {user.reports.length > 0 ? user.reports.slice(0, 3).map((report, idx) => (
                                                    <div key={idx} className="bg-white px-4 py-3 rounded-2xl flex justify-between items-center shadow-sm">
                                                        <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{report.title}</span>
                                                        <a href={`http://localhost:5001/uploads/${report.file}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-emerald-600 hover:underline flex items-center gap-1">
                                                            View <span>📄</span>
                                                        </a>
                                                    </div>
                                                )) : (
                                                    <div className="bg-slate-100/50 px-4 py-3 rounded-2xl text-center">
                                                        <p className="text-[10px] font-bold text-slate-400 italic">No documents provided</p>
                                                    </div>
                                                )}
                                                {user.reports.length > 3 && <p className="text-[10px] text-center font-bold text-slate-400">+{user.reports.length - 3} more files</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {bookings.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="text-6xl mb-6 opacity-20">👤</div>
                                            <p className="text-slate-400 font-bold">No patient profiles formed yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="animate-in fade-in duration-700">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
                                <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl shadow-inner font-black">📄</span>
                                Appointment Logs
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {bookings.map(book => (
                                    <div key={book._id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase tracking-tight">{book.serviceType}</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Patient: {book.userId?.regid?.name || 'Unknown'}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${book.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                {book.status}
                                            </span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-2xl flex justify-between items-center text-xs font-bold text-slate-500 shadow-sm border border-slate-50">
                                            <span>📅 {book.date}</span>
                                            <span>⏱️ {book.time}</span>
                                        </div>
                                    </div>
                                ))}
                                {bookings.length === 0 && (
                                    <div className="col-span-full text-center py-20">
                                        <p className="text-slate-400 font-bold">No historical data available for reporting.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default NurseDashboard;
