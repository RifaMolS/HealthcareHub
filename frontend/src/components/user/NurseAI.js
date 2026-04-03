import React, { useState, useEffect } from 'react';

function NurseAI({ user, plan }) {
    const isGoldPlan = plan?.name?.toLowerCase().includes('gold') || user?.regid?.membershipPlan?.toLowerCase().includes('gold');
    const [nurses, setNurses] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [view, setView] = useState(plan?.nurseAccess ? 'nurse' : 'diet'); // Default based on access
    const [dietInput, setDietInput] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [nurseAlertMsg, setNurseAlertMsg] = useState("");

    const [dietFormData, setDietFormData] = useState({
        Age: user?.regid?.age || '',
        Gender: 'Female', // default or fetch if available
        Weight_kg: user?.regid?.medicalHistory?.weight || '',
        Height_cm: user?.regid?.medicalHistory?.height || '',
        Disease_Type: 'None',
        Severity: 'None', // disabled/hidden if Disease_Type is None
        Physical_Activity_Level: 'Sedentary',
        Daily_Caloric_Intake: '',
        Cholesterol_mg_dL: '',
        Blood_Pressure_mmHg: '',
        Glucose_mg_dL: '',
        Dietary_Restrictions: 'None',
        Dietary_Restrictions_Other: '',
        Allergies: 'None',
        Allergies_Other: '',
        Weekly_Exercise_Hours: '',
    });

    useEffect(() => {
        // Auto-calculate BMI if height and weight exist
        const setBMI = () => {
            const h = parseFloat(dietFormData.Height_cm);
            const w = parseFloat(dietFormData.Weight_kg);
            if (h > 0 && w > 0) {
                const bmi = (w / ((h / 100) ** 2)).toFixed(1);
                setDietFormData(prev => ({ ...prev, BMI: bmi }));
            }
        };
        setBMI();
    }, [dietFormData.Height_cm, dietFormData.Weight_kg]);

    // Booking Modal State
    const [showBookModal, setShowBookModal] = useState(false);
    const [selectedNurse, setSelectedNurse] = useState(null);
    const [bookingData, setBookingData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM'
    });

    useEffect(() => {
        fetchNurses();
        fetchBookings();
    }, []);

    const fetchNurses = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/workers/nurse');
            const data = await res.json();
            setNurses(data);
        } catch (err) { console.error(err); }
    };

    const fetchBookings = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5001/health/bookings/${user._id}`);
            const data = await res.json();
            setBookings(data.filter(b => b.serviceType === 'Nurse Consultation'));
        } catch (err) { console.error(err); }
    };

    const handleOpenBook = (nurse) => {
        // Enforce membership limits
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyBookings = bookings.filter(b => {
            const bDate = new Date(b.date);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear && b.status !== 'Cancelled';
        });

        const limit = parseInt(plan?.maxNurseBookings) || 0;

        if (plan?.name?.toLowerCase().includes('unlimited')) {
            // No limit
        } else if (monthlyBookings.length >= limit) {
            alert(`Plan Limit Reached! Your ${plan?.name} only allows ${limit} nurse booking(s) per month. Please upgrade for more.`);
            return;
        }

        setSelectedNurse(nurse);
        setShowBookModal(true);
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5001/health/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    workerId: selectedNurse._id,
                    serviceType: 'Nurse Consultation',
                    date: bookingData.date,
                    time: bookingData.time
                })
            });
            if (res.ok) {
                alert('Consultation scheduled successfully!');
                fetchBookings();
                setShowBookModal(false);
                setView('bookings');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
        try {
            const res = await fetch(`http://localhost:5001/health/booking/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Consultation cancelled successfully.');
                fetchBookings();
            } else {
                alert('Failed to cancel consultation.');
            }
        } catch (err) {
            console.error(err);
            alert('Error cancelling consultation.');
        }
    };

    const handleGenerateDiet = (e) => {
        if (e) e.preventDefault();
        setIsGenerating(true);
        setAiResponse(null);
        setNurseAlertMsg("");

        // Construct final data to be sent to ML Model
        // Calculate dynamic properties for Gold Users based on their profile
        let goldDisease = 'None';
        if (user?.regid?.medicalHistory?.diabetes) goldDisease = 'Diabetes';
        else if (user?.regid?.medicalHistory?.bp) goldDisease = 'Hypertension';

        const gWeight = parseFloat(user?.regid?.medicalHistory?.weight) || 65;
        const gHeight = parseFloat(user?.regid?.medicalHistory?.height) || 165;
        let gBmi = 23.8;
        if (gWeight > 0 && gHeight > 0) {
            gBmi = parseFloat((gWeight / ((gHeight / 100) ** 2)).toFixed(1));
            if (goldDisease === 'None' && gBmi > 30) goldDisease = 'Obesity';
        }

        const finalData = isGoldPlan ? {
            Age: user?.regid?.age || 30,
            Gender: 'Female',
            Weight_kg: gWeight,
            Height_cm: gHeight,
            BMI: gBmi,
            Disease_Type: goldDisease,
            Severity: goldDisease !== 'None' ? 'Moderate' : 'None',
            Physical_Activity_Level: 'Moderate',
            Weekly_Exercise_Hours: 3,
            Daily_Caloric_Intake: gBmi > 25 ? 1800 : 2200,
            Cholesterol_mg_dL: 180,
            Blood_Pressure_mmHg: user?.regid?.medicalHistory?.bp ? 140 : 120,
            Glucose_mg_dL: user?.regid?.medicalHistory?.diabetes ? 140 : 90,
            Dietary_Restrictions: 'None',
            Allergies: 'None',
            Preferred_Cuisine: 'Indian'
        } : {
            ...dietFormData,
            Dietary_Restrictions: dietFormData.Dietary_Restrictions === 'Other' ? dietFormData.Dietary_Restrictions_Other : dietFormData.Dietary_Restrictions,
            Allergies: dietFormData.Allergies === 'Other' ? dietFormData.Allergies_Other : dietFormData.Allergies,
            Preferred_Cuisine: 'Indian' // Hardcoded backend requirement
        };

        console.log("Data to send/process:", finalData);

        if (isGoldPlan) {
            // Gold Plan: Use local static generation based on rules
            setTimeout(() => {
                let planText = `🌟 Standard Diet Plan Overview\n\n`;
                planText += `Identified Biometrics:\n- BMI: ${gBmi}\n- Focus Condition: ${goldDisease}\n- Caloric Target: ~${finalData.Daily_Caloric_Intake} kcal/day\n\n`;

                planText += `Recommended Meal Plan:\n`;
                if (goldDisease === 'Diabetes' || user?.regid?.medicalHistory?.diabetes) {
                    planText += "• Breakfast: Sugar-free oatmeal with chopped walnuts (250 kcal)\n• Lunch: Quinoa & grilled broccoli bowl (400 kcal)\n• Dinner: Steamed salmon or tofu with spinach (350 kcal)\n";
                } else if (goldDisease === 'Hypertension' || user?.regid?.medicalHistory?.bp) {
                    planText += "• Breakfast: Berry smoothie with low-fat yogurt (200 kcal)\n• Lunch: Large leafy green salad with olive oil dressing (350 kcal)\n• Dinner: Baked skinless chicken with sweet potatoes (450 kcal)\n";
                } else if (goldDisease === 'Obesity' || gBmi > 25) {
                    planText += "• Breakfast: 2 Boiled eggs and black/green tea (180 kcal)\n• Lunch: Lean turkey/paneer wrap (350 kcal)\n• Dinner: Cabbage or mixed vegetable clear soup (200 kcal)\n";
                } else {
                    planText += "• Breakfast: Whole grain toast with mashed avocado (300 kcal)\n• Lunch: Grilled chicken or chickpea salad (400 kcal)\n• Dinner: Brown rice with mixed lentils (400 kcal)\n";
                }

                planText += "\n💡 Upgrade to the Platinum Plan to unlock dynamic, real-time Machine Learning meal suggestions customized from exact bloodwork panels.";

                setAiResponse(planText);
                setIsGenerating(false);

                if (finalData.Severity === 'Severe' || parseInt(finalData.Age) > 65) {
                    setNurseAlertMsg("Based on your profile, we highly recommend scheduling a consultation with a registered nurse to monitor your condition.");
                }
            }, 1000); // 1-second simulated delay
            return;
        }

        // Platinum/Other plans hit the ML API
        fetch('http://127.0.0.1:5002/predict_diet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.plan) {
                    setAiResponse(data.plan);
                } else {
                    setAiResponse("Error: Could not retrieve plan from AI.");
                }
            })
            .catch(err => {
                console.error("ML Model connection failed:", err);
                setAiResponse("Network Error connecting to the AI Hub. Ensure the Python engine is running.");
            })
            .finally(() => {
                setIsGenerating(false);

                // Hardcoded Logic for Nurse Recommendation Warning remains
                const isSevere = finalData.Severity === 'Severe';
                const isAged = parseInt(finalData.Age) > 65;

                if (isSevere || isAged) {
                    setNurseAlertMsg("Based on your profile, we highly recommend scheduling a consultation with a registered nurse to monitor your condition.");
                }
            });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Navigation Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="text-rose-500">⚕️</span> Healthcare Hub
                    </h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">Professional medical care & AI-driven wellness</p>

                    {plan && !plan.name.toLowerCase().includes('unlimited') && (
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {[...Array(Math.max(0, parseInt(plan.maxNurseBookings)))].map((_, i) => {
                                    const currentMonth = new Date().getMonth();
                                    const currentYear = new Date().getFullYear();
                                    const usedCount = bookings.filter(b => {
                                        const bDate = new Date(b.date);
                                        return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear && b.status !== 'Cancelled';
                                    }).length;
                                    return (
                                        <div key={i} className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${i < usedCount ? 'bg-slate-200' : 'bg-rose-500'}`}></div>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                {Math.max(0, parseInt(plan.maxNurseBookings) - bookings.filter(b => {
                                    const bDate = new Date(b.date);
                                    return bDate.getMonth() === new Date().getMonth() && bDate.getFullYear() === new Date().getFullYear() && b.status !== 'Cancelled';
                                }).length)} Consultations Remaining
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto w-full lg:w-auto">
                    {[
                        { id: 'nurse', label: 'Book Nurse', icon: '👩‍⚕️', color: 'text-rose-600', access: plan?.nurseAccess },
                        { id: 'bookings', label: 'Appointments', icon: '🗓️', color: 'text-blue-600', access: true },
                        { id: 'diet', label: 'AI Diet Plan', icon: '✨', color: 'text-emerald-600', access: plan?.aiDietAccess }
                    ].filter(tab => tab.access).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id)}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 ${view === tab.id ? 'bg-white shadow-sm ' + tab.color : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'nurse' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {nurses.map(nurse => (
                        <div key={nurse._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl transition-all flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-rose-50 -z-10 opacity-50 group-hover:h-32 transition-all"></div>
                            <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform border border-rose-50">👩‍⚕️</div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">{nurse.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">{nurse.experience} Yrs Exp</span>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Available</span>
                            </div>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 px-4">
                                Certified medical professional specializing in home healthcare and elder care services.
                            </p>
                            <button
                                onClick={() => handleOpenBook(nurse)}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all"
                            >
                                Schedule Visit
                            </button>
                        </div>
                    ))}
                    {nurses.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <div className="text-6xl mb-6 opacity-30">🏥</div>
                            <p className="text-slate-400 font-black uppercase tracking-widest">No medical staff currently online.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'bookings' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    {bookings.length > 0 ? bookings.map(book => (
                        <div key={book._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 group hover:shadow-xl transition-all relative overflow-hidden">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">👩‍⚕️</div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase mb-1">{book.serviceType}</h4>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">With {book.workerId?.name || "Professional Nurse"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                                    <p className="font-black text-slate-800">{book.date}</p>
                                    <p className="text-xs font-bold text-slate-500">{book.time}</p>
                                </div>
                                <div className="px-6 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                    {book.status}
                                </div>
                                <button onClick={() => handleDeleteBooking(book._id)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-sm border border-slate-100 transition-colors">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="text-5xl mb-6 opacity-20">📅</div>
                            <h4 className="font-black text-slate-600 uppercase tracking-widest text-sm">No scheduled consultations</h4>
                            <button onClick={() => setView('nurse')} className="mt-4 text-rose-500 font-black text-xs hover:underline uppercase tracking-widest">Book Now →</button>
                        </div>
                    )}
                </div>
            )}

            {view === 'diet' && (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden mb-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="flex-1">
                                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">{plan?.aiLevel || 'Premium'} Intelligence</span>
                                <h3 className="text-5xl font-black tracking-tight mb-4">AI Dietitian Pro</h3>
                                <p className="text-emerald-50 font-medium text-lg opacity-90 leading-relaxed">
                                    Our advanced algorithm analyzes your <strong>Medical History</strong>, BMI, and biometric data to formulate the perfect nutrition plan.
                                </p>
                            </div>
                            <div className="w-32 h-32 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-6xl backdrop-blur-xl border border-white/20 shadow-2xl">🥗</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-5 space-y-8">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Biometric Context</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="text-sm font-bold text-slate-600">Calculated BMI</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${dietFormData.BMI > 25 ? 'text-rose-500' : 'text-emerald-500'}`}>{dietFormData.BMI || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="text-sm font-bold text-slate-600">Blood Group</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{user?.regid?.medicalHistory?.bloodGroup || '--'}</span>
                                    </div>
                                </div>
                            </div>

                            {isGoldPlan ? (
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 space-y-6 text-center">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-4xl mb-4 shadow-inner">✨</div>
                                    <h4 className="text-2xl font-black text-slate-800">Standard Diet Plan</h4>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                                        Your Gold Plan includes access to standard AI diet generation tailored directly to your profile's baseline biometrics.
                                        Upgrade to Platinum for advanced personalized input forms and specialized medical condition parameters.
                                    </p>
                                    <button
                                        onClick={handleGenerateDiet}
                                        disabled={isGenerating}
                                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl lg:rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Analyzing Output...</span>
                                            </>
                                        ) : (
                                            <>
                                                Generate Standard Diet <span className="text-xl">✨</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleGenerateDiet} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Medical Parameters</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="Age" required value={dietFormData.Age} onChange={e => setDietFormData({ ...dietFormData, Age: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                        <select value={dietFormData.Gender} onChange={e => setDietFormData({ ...dietFormData, Gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input type="number" placeholder="Weight (kg)" required value={dietFormData.Weight_kg} onChange={e => setDietFormData({ ...dietFormData, Weight_kg: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                        <input type="number" placeholder="Height (cm)" required value={dietFormData.Height_cm} onChange={e => setDietFormData({ ...dietFormData, Height_cm: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Disease Type</label>
                                            <select value={dietFormData.Disease_Type} onChange={e => setDietFormData({ ...dietFormData, Disease_Type: e.target.value, ...(e.target.value === 'None' && { Severity: 'None' }) })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                                <option value="None">None</option>
                                                <option value="Diabetes">Diabetes</option>
                                                <option value="Obesity">Obesity</option>
                                                <option value="Hypertension">Hypertension</option>
                                            </select>
                                        </div>
                                        {dietFormData.Disease_Type !== 'None' && (
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Severity</label>
                                                <select value={dietFormData.Severity} onChange={e => setDietFormData({ ...dietFormData, Severity: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                                    <option value="Mild">Mild</option>
                                                    <option value="Moderate">Moderate</option>
                                                    <option value="Severe">Severe</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Activity Level</label>
                                                <select value={dietFormData.Physical_Activity_Level} onChange={e => setDietFormData({ ...dietFormData, Physical_Activity_Level: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                                    <option value="Sedentary">Sedentary</option>
                                                    <option value="Moderate">Moderate</option>
                                                    <option value="Active">Active</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Exercise Hrs/Wk</label>
                                                <input type="number" required value={dietFormData.Weekly_Exercise_Hours} onChange={e => setDietFormData({ ...dietFormData, Weekly_Exercise_Hours: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="number" placeholder="Caloric Intake (kcal)" required value={dietFormData.Daily_Caloric_Intake} onChange={e => setDietFormData({ ...dietFormData, Daily_Caloric_Intake: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                            <input type="number" placeholder="Cholesterol (mg/dL)" required value={dietFormData.Cholesterol_mg_dL} onChange={e => setDietFormData({ ...dietFormData, Cholesterol_mg_dL: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                            <input type="number" placeholder="BP (mmHg)" required value={dietFormData.Blood_Pressure_mmHg} onChange={e => setDietFormData({ ...dietFormData, Blood_Pressure_mmHg: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                            <input type="number" placeholder="Glucose (mg/dL)" required value={dietFormData.Glucose_mg_dL} onChange={e => setDietFormData({ ...dietFormData, Glucose_mg_dL: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Dietary Restrictions</label>
                                            <div className="flex gap-2">
                                                <select value={dietFormData.Dietary_Restrictions} onChange={e => setDietFormData({ ...dietFormData, Dietary_Restrictions: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                                    <option value="None">None</option>
                                                    <option value="Low_Sodium">Low Sodium</option>
                                                    <option value="Low_Sugar">Low Sugar</option>
                                                    <option value="Other">Other...</option>
                                                </select>
                                                {dietFormData.Dietary_Restrictions === 'Other' && (
                                                    <input type="text" placeholder="Specify..." required value={dietFormData.Dietary_Restrictions_Other} onChange={e => setDietFormData({ ...dietFormData, Dietary_Restrictions_Other: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Food Allergies</label>
                                            <div className="flex gap-2">
                                                <select value={dietFormData.Allergies} onChange={e => setDietFormData({ ...dietFormData, Allergies: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none">
                                                    <option value="None">None</option>
                                                    <option value="Peanuts">Peanuts</option>
                                                    <option value="Gluten">Gluten</option>
                                                    <option value="Other">Other...</option>
                                                </select>
                                                {dietFormData.Allergies === 'Other' && (
                                                    <input type="text" placeholder="Specify..." required value={dietFormData.Allergies_Other} onChange={e => setDietFormData({ ...dietFormData, Allergies_Other: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 ring-emerald-500/20 outline-none" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl lg:rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Analyzing Profile...</span>
                                            </>
                                        ) : (
                                            <>
                                                Generate Plan <span className="text-xl">✨</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 h-full min-h-[400px] flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl">🤖</div>
                                </div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 pb-4 border-b border-slate-50">Intelligent Output</h4>

                                {aiResponse ? (
                                    <div className="flex flex-col h-full space-y-8">
                                        <div className="prose prose-slate max-w-none bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                                            <div className="whitespace-pre-line font-bold text-slate-700 leading-relaxed text-sm">
                                                {aiResponse}
                                            </div>
                                        </div>

                                        {nurseAlertMsg && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 justify-between mt-auto shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-sm">⚠️</div>
                                                    <p className="text-sm font-bold text-rose-700 max-w-md">{nurseAlertMsg}</p>
                                                </div>
                                                <button onClick={() => setView('nurse')} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap shadow-lg shadow-rose-600/20 shrink-0">
                                                    Book Nurse
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl mb-6 grayscale opacity-50">🥗</div>
                                        <p className="text-slate-400 font-bold text-lg mb-2 italic">Ready for calculation</p>
                                        <p className="text-slate-300 text-xs font-medium">Please enter your criteria and click generate to receive your customized clinical diet protocol.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Confirmation Modal */}
            {showBookModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
                    <form onSubmit={handleConfirmBooking} className="bg-white rounded-[3rem] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-rose-600 p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                            <button type="button" onClick={() => setShowBookModal(false)} className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors text-2xl">✕</button>
                            <h3 className="text-3xl font-black mb-2 tracking-tight">Confirm Visit</h3>
                            <p className="opacity-70 text-xs font-black uppercase tracking-[0.2em]">Nurse Consultation Request</p>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-rose-50">👩‍⚕️</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Professional</p>
                                    <p className="text-xl font-black text-slate-800 tracking-tight">{selectedNurse?.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingData.date}
                                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 ring-rose-500/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Slot</label>
                                    <select
                                        required
                                        value={bookingData.time}
                                        onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-4 ring-rose-500/10 outline-none appearance-none"
                                    >
                                        {['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'].map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-rose-600/30 transition-all hover:-translate-y-1 active:scale-95">
                                Secure Consultation
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default NurseAI;

