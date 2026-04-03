import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GroceryStore from './GroceryStore';
import HomeService from './HomeService';
import NurseAI from './NurseAI';
import UserProfile from './UserProfile';

function UserHome({ user: propUser, onLogout }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(propUser || JSON.parse(localStorage.getItem('user')));
    const [showJoin, setShowJoin] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, grocery, services, health, profile
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?._id) fetchUserProfile();
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch plans when modal opens to ensure they are shown
    useEffect(() => {
        if (showJoin) fetchPlans();
    }, [showJoin]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:5001/health/user-profile/${user._id}`);
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        } catch (error) { console.error('Error fetching profile:', error); }
    };

    const fetchPlans = async () => {
        try {
            console.log('Fetching plans from backend...');
            const res = await fetch('http://localhost:5001/health/admin/plans');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            console.log('Plans fetched:', data.length);
            setPlans(data);
        } catch (err) {
            console.error('Plans error:', err);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const membership = user?.regid?.membershipPlan || 'None';

    const handleInitiatePayment = (plan) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedPlanDetails(plan);
        setShowPayment(true);
    };

    const processPaymentAndJoin = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const res = await loadRazorpayScript();
            if (!res) {
                alert("Razorpay SDK failed to load. Please check your connection.");
                setIsProcessing(false);
                return;
            }

            // 1. Create Order on Backend
            const orderRes = await fetch('http://localhost:5001/health/razorpay-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: selectedPlanDetails.price })
            });

            if (!orderRes.ok) throw new Error("Order creation failed");
            const orderData = await orderRes.json();

            // 2. Open Razorpay Checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "HealthCare Hub",
                description: `Subscription for ${selectedPlanDetails.name}`,
                order_id: orderData.id,
                handler: async (response) => {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch('http://localhost:5001/health/razorpay-verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...response,
                                regId: user.regid._id,
                                planName: selectedPlanDetails.name
                            })
                        });

                        if (verifyRes.ok) {
                            alert('Payment Verified! Welcome to ' + selectedPlanDetails.name);
                            await fetchUserProfile();
                            setShowPayment(false);
                            setShowJoin(false);
                        } else {
                            alert('Verification failed. Please contact support.');
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                    }
                },
                prefill: {
                    name: user?.regid?.name || "",
                    email: user?.email || "",
                    contact: user?.regid?.phone || ""
                },
                theme: { color: "#4f46e5" },
                modal: {
                    ondismiss: () => setIsProcessing(false)
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert("Something went wrong with the payment process.");
            setIsProcessing(false);
        }
    };

    const activePlan = plans.find(p => {
        const pName = p.name.toLowerCase().replace(' plan', '').trim();
        const mName = membership.toLowerCase().replace(' plan', '').trim();
        return pName === mName;
    });

    const isSilver = activePlan?.name?.toLowerCase().includes('silver') || membership.toLowerCase().includes('silver');
    const isGold = activePlan?.name?.toLowerCase().includes('gold') || membership.toLowerCase().includes('gold');

    const accessGrocery = activePlan ? activePlan.groceryAccess : (membership !== 'None');
    const accessCleaning = activePlan ? activePlan.cleaningAccess : false;

    // Strict rules based on plan type defined by user:
    // Silver: No Nurse, No AI
    // Gold: No Nurse, Yes AI (Limited)
    // Platinum/Others: Yes Nurse, Yes AI
    const accessNurse = (isSilver || isGold) ? false : (activePlan ? activePlan.nurseAccess : false);
    const accessAI = isSilver ? false : (activePlan ? activePlan.aiDietAccess : false);

    const displayPlanName = membership.toLowerCase().includes('plan') ? membership : `${membership} Plan`;

    const slides = [
        {
            title: "Elevate Your Health",
            subtitle: "Professional care and intelligent diet plans directly at your fingertips.",
            color: "from-indigo-600 via-indigo-500 to-cyan-500",
            icon: "🏥"
        },
        {
            title: "Fresh Groceries Delivered",
            subtitle: "Organic, fresh, and fully stocked. Get everything you need in under an hour.",
            color: "from-emerald-600 via-teal-500 to-emerald-400",
            icon: "🥑"
        },
        {
            title: "Premium Home Services",
            subtitle: "Expert cleaning and maintenance professionals available on demand.",
            color: "from-amber-500 via-orange-400 to-rose-400",
            icon: "✨"
        }
    ];

    const plansJSX = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {plans.map((plan, idx) => {
                const isPopular = plan.name.toLowerCase().includes('gold') || plan.name.toLowerCase().includes('premium');
                return (
                    <div
                        key={plan._id}
                        className={`relative bg-white rounded-[2.5rem] p-10 border-2 transition-all duration-500 flex flex-col ${isPopular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10' : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2'}`}
                    >
                        {isPopular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white font-black text-[10px] px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl">
                                Best Value
                            </div>
                        )}

                        <div className="mb-8">
                            <h4 className="text-3xl font-black text-slate-800 mb-2 capitalize">{plan.name}</h4>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black text-indigo-600">₹{plan.price}</span>
                                <span className="text-slate-400 font-black uppercase tracking-widest text-xs">/{plan.duration || 'month'}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-5 mb-10">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Core Privileges</div>
                            <ul className="space-y-4">
                                {[
                                    { access: plan.groceryAccess, label: 'Express Grocery Delivery' },
                                    { access: plan.cleaningAccess, label: `${plan.cleaningLevel || 'Basic'} Cleaning (${plan.maxCleaningBookings} Sessions/mo)` },
                                    { access: plan.nurseAccess, label: `Nurse Visits (${plan.maxNurseBookings} Visits/mo)` },
                                    { access: plan.aiDietAccess, label: `${plan.aiLevel || 'Basic'} AI Powered Dietician` },
                                ].map((feat, fidx) => (
                                    <li key={fidx} className="flex gap-4 items-center">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${feat.access ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                            {feat.access ? '✓' : '×'}
                                        </span>
                                        <span className={`text-sm font-bold ${feat.access ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{feat.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handleInitiatePayment(plan)}
                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all transform active:scale-95 ${isPopular ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'}`}
                        >
                            Choose {plan.name}
                        </button>
                    </div>
                )
            })}
            {plans.length === 0 && (
                <div className="col-span-full py-24 text-center text-slate-400 flex flex-col items-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="text-6xl mb-6">🏜️</div>
                    <p className="font-black text-xl text-slate-600">No plans found.</p>
                    <p className="font-medium">The administrator hasn't configured membership tiers yet.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            {/* Top Navigation */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 py-4 shadow-sm border-b border-slate-100 flex justify-between items-center transition-all">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                    <span className="text-3xl">⚕️</span>
                    <div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">HealthCare Hub</h1>
                        <p className="text-[9px] text-slate-500 font-black tracking-[0.2em] uppercase">User Ecosystem</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-8 bg-slate-50 px-8 py-3 rounded-full border border-slate-100">
                    {[
                        { id: 'dashboard', label: 'Home', access: true },
                        { id: 'grocery', label: 'Grocery Store', access: accessGrocery },
                        { id: 'services', label: 'Home Services', access: accessCleaning },
                        { id: 'health', label: 'Nurse & AI', access: accessNurse || accessAI },
                        { id: 'profile', label: 'My Profile', access: !!user }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.access === false) {
                                    if (!user) navigate('/login');
                                    else setShowJoin(true);
                                }
                                else setActiveTab(item.id);
                            }}
                            className={`font-black text-xs uppercase tracking-widest transition-all ${activeTab === item.id ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-indigo-400'}`}
                        >
                            {item.label} {item.access === false && <span className="opacity-40 text-rose-500 ml-1">🔒</span>}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="font-black text-sm text-slate-800">
                                    {user?.regid?.name || 'Member'}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${membership === 'None' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {membership !== 'None' ? `${membership} Active` : 'Unsubscribed'}
                                </span>
                            </div>
                            <button
                                onClick={() => { if (onLogout) onLogout(); navigate('/login'); }}
                                className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl font-black transition-all shadow-sm group"
                                title="Logout"
                            >
                                <span className="text-xl group-hover:-translate-x-1 transition-transform">🚪</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all"
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both space-y-16">
                        {/* Carousel Hero Banner */}
                        <div className="relative w-full h-[300px] md:h-[400px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/10 group">
                            {slides.map((slide, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 bg-gradient-to-r ${slide.color} p-12 flex flex-col justify-center transition-opacity duration-1000 ${currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                >
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.05] rounded-full transform translate-x-1/3 -translate-y-1/4 blur-3xl"></div>
                                    <div className="relative z-20 max-w-2xl px-4 md:px-12">
                                        <div className="text-6xl md:text-8xl mb-6 animate-bounce opacity-80">{slide.icon}</div>
                                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">{slide.title}</h2>
                                        <p className="text-white/90 text-lg md:text-xl font-medium">{slide.subtitle}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Carousel Controls */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-10 bg-white' : 'bg-white/40'}`}
                                    ></button>
                                ))}
                            </div>
                        </div>

                        {/* Services Overview */}
                        <div>
                            <div className="mb-10 text-center">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Ecosystem Facilities</h3>
                                <p className="text-slate-500 font-bold mt-2">Explore the tools available to our members.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Grocery Card */}
                                <div
                                    onClick={() => {
                                        if (accessGrocery) setActiveTab('grocery');
                                        else if (!user) navigate('/login');
                                        else setShowJoin(true);
                                    }}
                                    className={`relative bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group cursor-pointer transition-all duration-500 ${accessGrocery ? 'hover:shadow-2xl hover:border-emerald-200 hover:-translate-y-2' : 'hover:shadow-xl hover:border-rose-200'}`}
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-500 flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">🛒</div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">Grocery Store</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">Fresh organic products delivered to your door within 60 minutes. Guaranteed quality.</p>

                                    <div className="mt-auto">
                                        {accessGrocery ? (
                                            <span className="inline-flex items-center gap-3 text-emerald-600 font-black bg-emerald-50 px-6 py-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                Enter Store <span className="text-lg">→</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-3 text-rose-500 font-black bg-rose-50 px-6 py-3 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                🔒 Subscribe to Unlock
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Services Card */}
                                <div
                                    onClick={() => {
                                        if (accessCleaning) setActiveTab('services');
                                        else if (!user) navigate('/login');
                                        else setShowJoin(true);
                                    }}
                                    className={`relative bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group cursor-pointer transition-all duration-500 ${accessCleaning ? 'hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2' : 'hover:shadow-xl hover:border-rose-200'}`}
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500 flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">🏠</div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">Home Services</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">Professional cleaning and maintenance services at your convenience, scheduled easily.</p>

                                    <div className="mt-auto">
                                        {accessCleaning ? (
                                            <span className="inline-flex items-center gap-3 text-blue-600 font-black bg-blue-50 px-6 py-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                Book Professional <span className="text-lg">→</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-3 text-rose-500 font-black bg-rose-50 px-6 py-3 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                🔒 Subscribe to Unlock
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Health Card */}
                                <div
                                    onClick={() => {
                                        if (accessNurse) setActiveTab('health');
                                        else if (!user) navigate('/login');
                                        else setShowJoin(true);
                                    }}
                                    className={`relative bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group cursor-pointer transition-all duration-500 ${accessNurse ? 'hover:shadow-2xl hover:border-purple-200 hover:-translate-y-2' : 'hover:shadow-xl hover:border-rose-200'}`}
                                >
                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-500 flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">🏥</div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-purple-600 transition-colors">Healthcare Hub</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">Instant AI diet plans and professional nurse appointment booking based on health metrics.</p>

                                    <div className="mt-auto">
                                        {accessNurse ? (
                                            <span className="inline-flex items-center gap-3 text-purple-600 font-black bg-purple-50 px-6 py-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                Access Care <span className="text-lg">→</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-3 text-rose-500 font-black bg-rose-50 px-6 py-3 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                🔒 Subscribe to Unlock
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Plans Section */}
                        <div className="pt-10 border-t border-slate-200">
                            <div className="mb-12 text-center max-w-2xl mx-auto">
                                <span className="px-4 py-2 bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-full mb-4 inline-block">Premium Upgrades</span>
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Membership Tiers</h3>
                                <p className="text-slate-500 font-medium text-lg">
                                    {membership === 'None'
                                        ? "Choose a subscription plan to unlock features across the HealthCare Hub ecosystem today."
                                        : `You are currently subscribed to the ${membership}. Want to change your tier?`}
                                </p>
                            </div>

                            {plansJSX}
                        </div>
                    </div>
                )}

                {/* Sub-components rendering */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                    {activeTab === 'grocery' && <GroceryStore user={user} plan={activePlan} />}
                    {activeTab === 'services' && <HomeService user={user} plan={activePlan} />}
                    {activeTab === 'health' && <NurseAI user={user} plan={activePlan} />}
                    {activeTab === 'profile' && <UserProfile user={user} fetchProfile={fetchUserProfile} />}
                </div>
            </main>

            {/* Membership Modal (Still kept for manual triggers on restricted items) */}
            {showJoin && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-50 rounded-[3rem] max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 mb-2">Unlock These Features</h3>
                                <p className="text-slate-500 font-bold text-sm tracking-wide">You attempted to access a premium feature. Choose a plan to continue.</p>
                            </div>
                            <button onClick={() => setShowJoin(false)} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white flex items-center justify-center font-black transition-all duration-300 rotation-hover">✕</button>
                        </div>
                        <div className="p-10 overflow-y-auto">
                            {plansJSX}
                        </div>
                    </div>
                </div>
            )}

            {/* Razorpay Payment Orchestration Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] max-w-md w-full overflow-hidden shadow-[0_0_100px_-20px_rgba(79,70,229,0.5)] animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <button
                                onClick={() => !isProcessing && setShowPayment(false)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-black transition-all backdrop-blur-md"
                            >
                                ✕
                            </button>
                            <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 backdrop-blur-xl shadow-2xl border border-white/20">💳</div>
                            <h3 className="text-3xl font-black tracking-tight mb-2">Secure Payment</h3>
                            <p className="opacity-70 font-bold text-xs uppercase tracking-[0.3em]">{selectedPlanDetails?.name} Tier Upgrade</p>
                        </div>

                        <div className="p-10">
                            <div className="mb-10 space-y-6">
                                <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 text-center shadow-inner">
                                    <span className="block text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3">Total Investment</span>
                                    <span className="font-black text-indigo-600 text-5xl tracking-tighter">₹{selectedPlanDetails?.price}</span>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <div className="text-2xl mt-1">🛡️</div>
                                    <p className="text-slate-500 text-xs font-bold leading-relaxed">
                                        You are being redirected to our secure payment partner <span className="text-indigo-600">Razorpay</span>. Standard encryption protocols apply.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={processPaymentAndJoin}
                                disabled={isProcessing}
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 group"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Syncing Gateway...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Proceed to Checkout</span>
                                        <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-8 flex flex-col items-center gap-4">
                                <div className="flex gap-4 grayscale opacity-30">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="mastercard" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="visa" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" className="h-4" alt="rupay" />
                                </div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">PCI DSS COMPLIANT PORTAL</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserHome;
