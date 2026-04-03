import React, { useState, useEffect } from 'react';

function ViewNurses() {
    const [workers, setWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5001/health/admin/workers');
            if (response.ok) {
                const data = await response.json();
                setWorkers(data.filter(w => w.type === 'nurse'));
            } else {
                setError('Registry unreachable');
            }
        } catch (err) {
            setError('System communications failure');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Terminate personnel authorization?')) return;
        try {
            const response = await fetch(`http://localhost:5001/health/admin/delete-worker/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setWorkers(workers.filter(w => w._id !== id));
            }
        } catch (err) {
            console.error('Error deleting nurse', err);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-6">
            <div className="w-16 h-16 border-8 border-rose-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Personnel Data...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex justify-between items-center px-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Active Medical Core</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Authorized personnel nodes with live status</p>
                </div>
                <button
                    onClick={fetchWorkers}
                    className="p-5 bg-slate-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-slate-100 shadow-sm"
                >
                    <span className="text-xl">🔄</span> Re-Sync Registry
                </button>
            </div>

            {error && (
                <div className="p-8 bg-rose-50 text-rose-600 rounded-[2rem] border border-rose-100 font-black text-[10px] uppercase tracking-[0.2em] text-center shadow-inner">
                    ⚠ Critical Alert: {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {workers.map((worker) => (
                    <div key={worker._id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden group p-10 relative">
                        <div className="absolute top-0 right-0 p-8">
                            <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${worker.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {worker.status}
                            </span>
                        </div>

                        <div className="w-20 h-20 rounded-[2.5rem] bg-rose-50 text-rose-600 flex items-center justify-center text-3xl shadow-inner italic font-black mb-8 group-hover:scale-110 transition-transform">
                            {worker.name.charAt(0)}
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight truncate mb-1">{worker.name}</h3>
                        <p className="text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] mb-8">
                            Medical Personnel Node
                        </p>

                        <div className="space-y-4 mb-10 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                            <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest">
                                <span className="text-xl opacity-30">📧</span>
                                <span className="truncate uppercase">{worker.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest">
                                <span className="text-xl opacity-30">📞</span>
                                <span className="font-mono uppercase">{worker.phone}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest">
                                <span className="text-xl opacity-30">⏳</span>
                                <span className="uppercase">{worker.experience} Years Active</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDelete(worker._id)}
                            className="w-full py-5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-[2rem] font-black text-[10px] transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                        >
                            <span>🗑️</span> Terminate Credentials
                        </button>
                    </div>
                ))}

                {workers.length === 0 && !error && (
                    <div className="col-span-full py-32 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 opacity-50 space-y-4">
                        <div className="text-8xl grayscale animate-pulse">🌫️</div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Registry Depleted: No Providers Detected</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewNurses;
