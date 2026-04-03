import React, { useState, useEffect } from 'react';

function HomeService({ user, plan }) {
    const [workers, setWorkers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [view, setView] = useState('browse'); // browse, bookings
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        date: '',
        time: ''
    });
    const [workerSlots, setWorkerSlots] = useState([]);

    useEffect(() => {
        fetchWorkers();
        fetchBookings();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/workers/cleaner');
            const data = await res.json();
            setWorkers(data);
        } catch (err) { console.error(err); }
    };

    const fetchBookings = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5001/health/bookings/${user._id}`);
            const data = await res.json();
            setBookings(data.filter(b => b.serviceType !== 'Nurse Consultation'));
        } catch (err) { console.error(err); }
    };

    const handleOpenBooking = async (worker) => {
        // Enforce membership limits
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyBookings = bookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear && b.status !== 'Cancelled';
        });

        const limit = parseInt(plan?.maxCleaningBookings) || 0;

        if (plan?.name?.toLowerCase().includes('unlimited')) {
            // No limit
        } else if (monthlyBookings.length >= limit) {
            alert(`Plan Limit Reached! Your ${plan?.name} only allows ${limit} booking(s) per month. Please upgrade for more.`);
            return;
        }

        setSelectedWorker(worker);
        try {
            const res = await fetch(`http://localhost:5001/health/worker-slots/${worker._id}`);
            const data = await res.json();
            setWorkerSlots(data);
            if (data.length > 0) {
                setBookingForm({ date: data[0].date, time: data[0].time });
            }
        } catch (err) { console.error(err); }
        setShowBookingModal(true);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/health/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    workerId: selectedWorker._id,
                    serviceType: 'Home Cleaning/Maintenance',
                    date: bookingForm.date,
                    time: bookingForm.time
                })
            });
            if (res.ok) {
                alert('Service booked successfully!');
                fetchBookings();
                setShowBookingModal(false);
                setView('bookings');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            const res = await fetch(`http://localhost:5001/health/booking/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Booking cancelled successfully.');
                fetchBookings();
            } else {
                alert('Failed to cancel booking.');
            }
        } catch (err) {
            console.error(err);
            alert('Error cancelling booking.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                        Home Services
                        <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest font-black">{plan?.cleaningLevel || 'Trusted'}</span>
                    </h2>
                    <p className="text-slate-500 font-bold text-sm mt-1 italic">Professional help for your home sanctuary</p>

                    {plan && !plan.name.toLowerCase().includes('unlimited') && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[...Array(Math.max(0, parseInt(plan.maxCleaningBookings)))].map((_, i) => {
                                    const currentMonth = new Date().getMonth();
                                    const currentYear = new Date().getFullYear();
                                    const usedCount = bookings.filter(b => {
                                        const bDate = new Date(b.date);
                                        return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear && b.status !== 'Cancelled';
                                    }).length;
                                    return (
                                        <div key={i} className={`w-8 h-2 rounded-full border-2 border-white shadow-sm ${i < usedCount ? 'bg-slate-200' : 'bg-blue-500'}`}></div>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                {Math.max(0, parseInt(plan.maxCleaningBookings) - bookings.filter(b => {
                                    const bDate = new Date(b.date);
                                    return bDate.getMonth() === new Date().getMonth() && bDate.getFullYear() === new Date().getFullYear() && b.status !== 'Cancelled';
                                }).length)} Sessions Remaining
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    {[
                        { id: 'browse', label: 'All Providers', icon: '👤' },
                        { id: 'bookings', label: 'My Bookings', icon: '📅' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setView(tab.id); if (tab.id === 'bookings') fetchBookings(); }}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <span className="mr-2">{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'browse' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {workers.map(worker => (
                        <div key={worker._id} className="bg-white p-8 rounded-[2.2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all group flex flex-col relative overflow-hidden">
                            <div className="flex gap-6 items-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    {worker.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-2xl leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{worker.name}</h3>
                                    <p className="text-blue-500 font-black text-xs uppercase tracking-widest mt-1">{worker.type}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                                        <p className="text-sm font-black text-slate-700">{worker.experience} Years</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                                        <p className="text-sm font-black text-emerald-500 flex items-center gap-1 justify-end">⭐ 4.8</p>
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed opacity-80">
                                    Expert in professional home maintenance and hygiene services with verified background.
                                </p>
                            </div>

                            <button
                                onClick={() => handleOpenBooking(worker)}
                                className="w-full py-4 bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-600 hover:text-white text-blue-600 font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/5 group-hover:shadow-blue-500/20"
                            >
                                Book Session
                            </button>
                        </div>
                    ))}
                    {workers.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <span className="text-6xl block mb-6">🏜️</span>
                            <p className="text-slate-400 font-black text-xl italic uppercase tracking-widest">No available heroes found.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'bookings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {bookings.map(book => (
                        <div key={book._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-start gap-6 hover:shadow-xl transition-all relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 -z-10 ${book.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            <div className="flex justify-between items-start w-full">
                                <div>
                                    <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase leading-none mb-2">{book.serviceType}</h4>
                                    <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest inline-block ${book.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {book.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                                    <p className="text-sm font-black text-slate-800">{book.date}</p>
                                    <p className="text-xs font-bold text-slate-500">{book.time}</p>
                                </div>
                            </div>

                            <div className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Provider & Team</p>
                                    <p className="text-sm font-black text-slate-700">{book.workerId?.name || "Premium Provider"}</p>
                                    {book.memberIds && book.memberIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {book.memberIds.map((m, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold">
                                                    {m.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-auto flex gap-2">
                                    <button onClick={() => handleDeleteBooking(book._id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-sm border border-slate-100 transition-colors">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {bookings.length === 0 && (
                        <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-500 flex flex-col items-center">
                            <span className="text-5xl mb-6 opacity-30">📪</span>
                            <p className="font-black text-sm uppercase tracking-widest">No active service history found.</p>
                            <button onClick={() => setView('browse')} className="mt-6 text-blue-500 font-black text-xs hover:underline uppercase tracking-widest">Find a Provider</button>
                        </div>
                    )}
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <form onSubmit={handleBook} className="bg-white rounded-[3rem] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-blue-600 p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                            <button type="button" onClick={() => setShowBookingModal(false)} className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">✕</button>
                            <h3 className="text-3xl font-black mb-2 tracking-tight">Confirm Booking</h3>
                            <p className="opacity-70 text-xs font-black uppercase tracking-[0.2em]">Service Request Details</p>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-inner">🏠</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking for</p>
                                    <p className="text-lg font-black text-slate-800">{selectedWorker?.name}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Select Available Slot</label>
                                    <select
                                        required
                                        value={`${bookingForm.date}|${bookingForm.time}`}
                                        onChange={(e) => {
                                            const [date, time] = e.target.value.split('|');
                                            setBookingForm({ date, time });
                                        }}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 ring-blue-500/10"
                                    >
                                        {workerSlots.length > 0 ? (
                                            workerSlots.map((s, i) => (
                                                <option key={i} value={`${s.date}|${s.time}`}>
                                                    {s.date} at {s.time}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No slots available</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 transition-all hover:-translate-y-1 active:scale-95">
                                Finalize Request
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default HomeService;

