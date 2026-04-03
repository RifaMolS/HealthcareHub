import React, { useState } from 'react';

function UserProfile({ user, fetchProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        diabetes: user?.regid?.medicalHistory?.diabetes || false,
        bp: user?.regid?.medicalHistory?.bp || false,
        thyroid: user?.regid?.medicalHistory?.thyroid || false,
        other: user?.regid?.medicalHistory?.other || '',
        height: user?.regid?.medicalHistory?.height || '',
        weight: user?.regid?.medicalHistory?.weight || '',
        bloodGroup: user?.regid?.medicalHistory?.bloodGroup || '',
    });

    const [reportTitle, setReportTitle] = useState('');
    const [reportFile, setReportFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const membership = user?.regid?.membershipPlan || 'None';
    const isPlatinum = membership.toLowerCase().includes('platinum');

    const handleUpdateMedical = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5001/health/update-medical-history/${user.regid._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Medical history updated!');
                fetchProfile();
                setIsEditing(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleUploadReport = async (e) => {
        e.preventDefault();
        if (!reportFile) return alert('Select a file');
        setIsUploading(true);

        const uploadData = new FormData();
        uploadData.append('title', reportTitle);
        uploadData.append('file', reportFile);

        try {
            const res = await fetch(`http://localhost:5001/health/upload-medical-report/${user.regid._id}`, {
                method: 'POST',
                body: uploadData
            });
            if (res.ok) {
                alert('Report uploaded!');
                fetchProfile();
                setReportTitle('');
                setReportFile(null);
            }
        } catch (err) { console.error(err); }
        finally { setIsUploading(false); }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Profile Header */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-indigo-500/30">
                    {user?.regid?.name?.charAt(0)}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-4xl font-black text-slate-800 mb-2">{user?.regid?.name}</h2>
                    <p className="text-slate-500 font-bold mb-4">{user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
                            {membership} Member
                        </span>
                        <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest border border-slate-100">
                            ID: {user?.regid?._id?.slice(-8).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Medical Information */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                            <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl">🧬</span>
                            Health Profile
                        </h3>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="text-indigo-600 font-black text-sm hover:underline">Edit Info</button>
                        ) : (
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 font-black text-sm hover:underline">Cancel</button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Height</span>
                                <p className="text-xl font-black text-slate-700">{user?.regid?.medicalHistory?.height || '--'} cm</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</span>
                                <p className="text-xl font-black text-slate-700">{user?.regid?.medicalHistory?.weight || '--'} kg</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Group</span>
                                <p className="text-xl font-black text-rose-600">{user?.regid?.medicalHistory?.bloodGroup || '--'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Conditions</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user?.regid?.medicalHistory?.diabetes && <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-black">Diabetes</span>}
                                    {user?.regid?.medicalHistory?.bp && <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-black">BP</span>}
                                    {user?.regid?.medicalHistory?.thyroid && <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-black">Thyroid</span>}
                                    {!user?.regid?.medicalHistory?.diabetes && !user?.regid?.medicalHistory?.bp && !user?.regid?.medicalHistory?.thyroid && <span className="text-slate-400 italic text-sm">No conditions noted</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateMedical} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Height (cm)</label>
                                    <input type="number" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold focus:ring-2 ring-indigo-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Weight (kg)</label>
                                    <input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold focus:ring-2 ring-indigo-500/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Blood Group</label>
                                <select value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold">
                                    <option value="">Select</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.diabetes} onChange={e => setFormData({ ...formData, diabetes: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm font-bold text-slate-600">Diabetes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.bp} onChange={e => setFormData({ ...formData, bp: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm font-bold text-slate-600">BP</span>
                                </label>
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all">Save Health Profile</button>
                        </form>
                    )}
                </div>

                {/* Platinum Exclusive: Data Upload */}
                <div className={`rounded-[2.5rem] p-10 shadow-sm border flex flex-col ${isPlatinum ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 border-dashed relative overflow-hidden'}`}>
                    {!isPlatinum && (
                        <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-xl">🏆</div>
                            <h4 className="text-xl font-black text-slate-800 mb-2">Platinum Exclusive</h4>
                            <p className="text-slate-500 font-medium text-sm">Upgrade to Platinum to upload medical reports and unlock AI Diet suggestions.</p>
                        </div>
                    )}

                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                        <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl">📄</span>
                        Medical Reports
                    </h3>

                    {isPlatinum && (
                        <div className="space-y-8">
                            <form onSubmit={handleUploadReport} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Report Title (e.g., Blood Test Feb 24)"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold"
                                    value={reportTitle}
                                    onChange={e => setReportTitle(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        onChange={e => setReportFile(e.target.files[0])}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs"
                                        required
                                    />
                                    <button disabled={isUploading} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50">
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Recent Uploads</h4>
                                <div className="grid grid-cols-1 gap-4 max-h-48 overflow-y-auto pr-2">
                                    {user?.regid?.medicalHistory?.reports?.length > 0 ? user.regid.medicalHistory.reports.map((report, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm">📄</div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-xs">{report.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(report.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <a href={`http://localhost:5001/uploads/${report.file}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-black text-[10px] uppercase hover:underline">View</a>
                                        </div>
                                    )) : (
                                        <p className="text-slate-400 text-xs italic">No reports uploaded yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
