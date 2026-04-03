import React, { useState } from 'react';

function AddNurse() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        experience: '',
        type: 'nurse'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('http://localhost:5001/health/provider-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Personnel synchronization complete.' });
                setFormData({
                    name: '', email: '', phone: '', password: '', experience: '', type: 'nurse'
                });
            } else {
                setMessage({ type: 'error', text: data.message || 'Registration failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Communications failure.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="bg-white rounded-[3.5rem] shadow-sm overflow-hidden border border-slate-100">
                <div className="bg-rose-600 px-10 py-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                    <h2 className="text-4xl font-black uppercase tracking-tight">Recruitment Protocol</h2>
                    <p className="text-rose-100 mt-2 font-black text-[10px] uppercase tracking-[0.3em] opacity-80 italic">Initializing verified healthcare credentials</p>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-8">
                    {message.text && (
                        <div className={`p-6 rounded-2xl text-center font-black text-[10px] uppercase tracking-[0.2em] border shadow-sm animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {message.type === 'success' ? '◈' : '⚠'} {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Personnel Name</label>
                            <input
                                type="text" name="name" required placeholder="Full Identity"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-rose-500/10 outline-none transition-all"
                                value={formData.name} onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Communications Node</label>
                            <input
                                type="email" name="email" required placeholder="Email Address"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-rose-500/10 outline-none transition-all"
                                value={formData.email} onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Secure Line</label>
                            <input
                                type="text" name="phone" required placeholder="Phone Contact"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-rose-500/10 outline-none transition-all"
                                value={formData.phone} onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Security Token</label>
                            <input
                                type="password" name="password" required placeholder="Password Phrase"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-rose-500/10 outline-none transition-all"
                                value={formData.password} onChange={handleChange}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Experience Coefficient (Years)</label>
                            <input
                                type="number" name="experience" required placeholder="0"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black focus:bg-white focus:ring-4 ring-rose-500/10 outline-none transition-all"
                                value={formData.experience} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl ${isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 active:scale-95'}`}
                    >
                        {isSubmitting ? 'Synchronizing...' : 'Authorize Personnel Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddNurse;