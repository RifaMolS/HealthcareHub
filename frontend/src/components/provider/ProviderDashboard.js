import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProviderDashboard({ user: initialUser, onLogout }) {
    const navigate = useNavigate();
    const [user] = useState(initialUser || JSON.parse(localStorage.getItem('user')));
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('bookings');

    useEffect(() => {
        if (!user || (user.usertype !== 'nurse' && user.usertype !== 'homeservice')) {
            alert('Access Denied');
            navigate('/login');
        } else {
            fetchBookings();
        }
    }, []);

    const fetchBookings = async () => {
        try {
            const workerId = typeof user.regid === 'object' ? user.regid._id : user.regid;
            const res = await fetch(`http://localhost:5001/health/provider-bookings/${workerId}`);
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) { console.error('Error fetching bookings:', error); }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:5001/health/booking-status/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchBookings();
        } catch (error) { console.error('Error updating status:', error); }
    };

    const handleLogout = () => {
        if (onLogout) onLogout();
        navigate('/login');
    };

    const isNurse = user?.usertype === 'nurse';
    const primaryColor = isNurse ? 'rose' : 'blue';
    const primaryBg = isNurse ? 'bg-rose-950' : 'bg-blue-950';
    const primaryAccent = isNurse ? 'text-rose-400' : 'text-blue-400';
    const primaryButton = isNurse ? 'bg-rose-600' : 'bg-blue-600';

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className={`w-80 ${primaryBg} text-white fixed h-screen flex flex-col z-50`}>
                <div className="p-10 border-b border-white/5">
                    <h1 className="text-2xl font-black tracking-tighter uppercase">Service<span className={primaryAccent}>Hub</span></h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2 italic">{isNurse ? 'Certified Medical Core' : 'Home Infrastructure Care'}</p>
                </div>

                <div className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center gap-4 px-6 py-5 rounded-[2rem] transition-all duration-300 group ${activeTab === 'bookings' ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
                        <span className="font-black text-[10px] uppercase tracking-[0.2em]">Assignment Queue</span>
                    </button>
                    {/* Future tabs can go here */}
                </div>

                <div className="p-10 border-t border-white/5">
                    <div className="mb-8 px-4">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 italic">Active Professional</p>
                        <p className="text-sm font-black text-white truncate max-w-full">{user?.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isNurse ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            Verified {isNurse ? 'Medical' : 'Expert'}
                        </span>
                    </div>
                    <button onClick={handleLogout} className="w-full py-5 bg-white/5 hover:bg-rose-600 transition-all text-rose-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                        <span>🚪</span> Terminate
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-80 flex-1 p-12 overflow-y-auto">
                <header className="flex justify-between items-center mb-12 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                            Mission <span className={isNurse ? 'text-rose-600' : 'text-blue-600'}>Center</span>
                        </h2>
                        <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest italic">Operational Window: Pending Assignments</p>
                    </div>
                    <div className={`flex items-center gap-4 px-8 py-4 rounded-full border border-${primaryColor}-100 bg-${primaryColor}-50`}>
                        <div className={`w-3 h-3 ${primaryButton} rounded-full animate-pulse shadow-lg ring-4 ring-${primaryColor}-500/10`}></div>
                        <span className={`text-[10px] font-black ${isNurse ? 'text-rose-700' : 'text-blue-700'} uppercase tracking-widest`}>Active Readiness</span>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                    <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-950 text-white">
                                <tr>
                                    <th className="px-12 py-10 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Client Persona</th>
                                    <th className="px-12 py-10 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Mission Type</th>
                                    <th className="px-12 py-10 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Timeline</th>
                                    <th className="px-12 py-10 text-left text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Status</th>
                                    <th className="px-12 py-10 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Execution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {bookings.map(book => (
                                    <tr key={book._id} className="hover:bg-slate-50 transition-all group">
                                        <td className="px-12 py-10">
                                            <div className="font-black text-slate-800 text-lg uppercase tracking-tight">{book.userId?.name || 'Anonymous Client'}</div>
                                            <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest font-mono">PH_{book.userId?.phone || 'N/A'}</div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <span className={`px-4 py-2 border-2 border-slate-100 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:border-${primaryColor}-200 group-hover:text-${primaryColor}-600 transition-all`}>
                                                {book.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tighter">{book.date}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{book.time}</div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${book.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                    book.status === 'Confirmed' ? 'bg-blue-100 text-blue-600' :
                                                        book.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-slate-100 text-slate-400'
                                                }`}>
                                                {book.status}
                                            </span>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {book.status === 'Pending' && (
                                                    <button onClick={() => handleStatusUpdate(book._id, 'Confirmed')} className={`px-8 py-3 ${primaryButton} text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-${primaryColor}-500/20`}>Authorize</button>
                                                )}
                                                {book.status === 'Confirmed' && (
                                                    <button onClick={() => handleStatusUpdate(book._id, 'Completed')} className="px-8 py-3 bg-emerald-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20">Finalize</button>
                                                )}
                                                {book.status === 'Completed' && (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic pr-4">Archive Locked</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {bookings.length === 0 && (
                            <div className="py-40 text-center">
                                <div className="text-8xl mb-8 animate-pulse grayscale opacity-20">📭</div>
                                <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4">No Active Missions</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Awaiting synchronized assignments from the central hub.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ProviderDashboard;
