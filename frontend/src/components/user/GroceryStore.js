import React, { useState, useEffect } from 'react';

function GroceryStore({ user }) {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(null);
    const [view, setView] = useState('shop'); // shop, cart, orders
    const [orders, setOrders] = useState([]);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Rating State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null); // {id, type, name}
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [targetReviews, setTargetReviews] = useState([]);
    const [userRatedIds, setUserRatedIds] = useState([]); // List of targetIds user has rated

    useEffect(() => {
        fetchProducts();
        fetchCart();
        fetchUserRatedIds();
    }, []);

    const fetchUserRatedIds = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5001/health/user-reviews/${user._id}`);
            if (res.ok) {
                const data = await res.json();
                setUserRatedIds(data.map(r => r.targetId));
            }
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/products');
            const data = await res.json();
            setProducts(data);
        } catch (err) { console.error(err); }
    };

    const fetchCart = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5001/health/cart/${user._id}`);
            const data = await res.json();
            setCart(data);
        } catch (err) { console.error(err); }
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5001/health/orders/${user._id}`);
            const data = await res.json();
            setOrders(data);
        } catch (err) { console.error(err); }
    };

    const fetchReviews = async (targetId) => {
        try {
            const res = await fetch(`http://localhost:5001/health/reviews/${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setTargetReviews(data);
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            const res = await fetch(`http://localhost:5001/health/update-order-status/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                alert(`Order marked as ${status}!`);
                fetchOrders();
            }
        } catch (err) { console.error(err); }
    };

    const isDelivered = (targetId) => {
        return orders.some(order =>
            order.status === 'Delivered' &&
            order.items.some(item => item.productId?._id === targetId)
        );
    };

    const hasDeliveredOrders = () => {
        return orders.some(order => order.status === 'Delivered');
    };

    const handleOpenReview = (target) => {
        if (target.type === 'product' && !isDelivered(target.id)) {
            alert('You can only rate products after they have been delivered.');
            return;
        }
        if (target.type === 'shop' && !hasDeliveredOrders()) {
            alert('You can only rate the shop after you have received an order.');
            return;
        }
        setRatingTarget(target);
        fetchReviews(target.id);
        setShowReviewModal(true);
    };

    const submitReview = async () => {
        try {
            const res = await fetch('http://localhost:5001/health/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    targetId: ratingTarget.id,
                    targetType: ratingTarget.type,
                    rating: ratingValue,
                    comment: ratingComment
                })
            });
            if (res.ok) {
                alert('Review submitted!');
                fetchReviews(ratingTarget.id);
                fetchUserRatedIds(); // Refresh rated status
                setRatingComment('');
            }
        } catch (err) { console.error(err); }
    };

    const addToCart = async (product) => {
        try {
            const res = await fetch('http://localhost:5001/health/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    productId: product._id,
                    quantity: 1,
                    price: product.price
                })
            });
            if (res.ok) {
                alert('Added to cart!');
                fetchCart();
            }
        } catch (err) { console.error(err); }
    };

    const processPaymentAndOrder = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        // All users who access this are members, so we just process the order directly
        try {
            const orderFinalRes = await fetch('http://localhost:5001/health/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    items: cart.items,
                    totalAmount: cart.totalPrice,
                    paymentId: 'PLAN_BENEFIT' // Indicating it is covered by the plan
                })
            });

            if (orderFinalRes.ok) {
                alert('Order placed successfully! Your items are covered by your plan. No additional payment required.');
                fetchCart();
                setShowPayment(false);
                setView('orders');
                fetchOrders();
            } else {
                alert("Error placing order. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error placing order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">Grocery Store</h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">Premium organic products at your doorstep</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    {[
                        { id: 'shop', label: 'Store', icon: '🏪' },
                        { id: 'cart', label: `Cart (${cart?.items?.length || 0})`, icon: '🛒' },
                        { id: 'orders', label: 'History', icon: '📜' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setView(tab.id); if (tab.id === 'orders') fetchOrders(); }}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${view === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <span className="mr-2">{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'shop' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(p => (
                        <div key={p._id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col">
                            <div className="h-56 bg-slate-50 relative overflow-hidden">
                                {p.image ? (
                                    <img src={`http://localhost:5001/uploads/${p.image}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-5xl opacity-40">🥦</div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-sm border border-emerald-50">
                                        {p.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2 group">
                                    <h3 className="font-black text-slate-800 text-xl leading-tight group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                                    {userRatedIds.includes(p._id) ? (
                                        <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                            ✅ Rated
                                        </div>
                                    ) : isDelivered(p._id) ? (
                                        <button
                                            onClick={() => handleOpenReview({ id: p._id, type: 'product', name: p.name })}
                                            className="text-xs font-black text-amber-500 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            ⭐ Rate
                                        </button>
                                    ) : (
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded">
                                            Not Delivered
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-xs font-medium mb-6 line-clamp-2 leading-relaxed">
                                    {p.description || "Premium quality fresh grocery item sourced directly from certified organic farms."}
                                </p>
                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Price</span>
                                        <span className="text-2xl font-black text-slate-800 tracking-tight">₹{p.price}</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(p)}
                                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <span className="text-6xl block mb-6">🌵</span>
                            <p className="text-slate-400 font-bold">No products available in your area yet.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'cart' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                        <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4">
                            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">🛒</span>
                            Shopping Basket
                        </h3>

                        {cart && cart.items.length > 0 ? (
                            <div className="space-y-6">
                                <div className="divide-y divide-slate-50 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                    {cart.items.map((item, idx) => (
                                        <div key={item._id || idx} className="py-6 flex justify-between items-center group">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                                                    {item.productId?.image ? (
                                                        <img src={`http://localhost:5001/uploads/${item.productId.image}`} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                    ) : "🍏"}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800">{item.productId?.name || 'Item Removed'}</h4>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-emerald-600 tracking-tight">₹{item.quantity * item.price}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border-2 border-emerald-50 shadow-inner gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable Amount</span>
                                        <span className="text-5xl font-black text-slate-800 tracking-tighter">₹{cart.totalPrice}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowPayment(true)}
                                        className="w-full md:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-2xl shadow-emerald-500/30 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Place Order <span className="text-2xl">⚡</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-24 text-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-5xl mb-6">🏜️</div>
                                <p className="text-slate-400 font-black text-xl italic">Empty Cart, Empty Heart</p>
                                <button onClick={() => setView('shop')} className="mt-6 text-emerald-500 font-black text-xs uppercase tracking-widest hover:underline">Go Shopping →</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'orders' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    {orders.length > 0 ? orders.map(order => (
                        <div key={order._id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all">
                            <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center flex-1">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner group-hover:bg-emerald-50 transition-colors">📦</div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-black text-slate-800 text-xl tracking-tight uppercase">Order #{order._id.slice(-6)}</h4>
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' :
                                                order.status === 'Paid' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-indigo-100 text-indigo-600'
                                                }`}>{order.status}</span>
                                        </div>
                                        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} • {order.items.length} Items Purchased
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0">
                                    <div className="text-right flex flex-col items-end">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {order.status === 'Delivered' ? 'Total Paid' : 'Est. Delivery'}
                                        </span>
                                        {order.status === 'Delivered' ? (
                                            <span className="text-2xl font-black text-emerald-600 tracking-tight">₹{order.totalAmount}</span>
                                        ) : (
                                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                                {new Date(order.deliveryEstimatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    {order.status !== 'Delivered' && (
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                                                disabled={new Date() < new Date(order.deliveryEstimatedAt)}
                                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all w-full md:w-auto shadow-lg ${new Date() < new Date(order.deliveryEstimatedAt)
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95'
                                                    }`}
                                            >
                                                Mark Delivered
                                            </button>
                                            {new Date() < new Date(order.deliveryEstimatedAt) && (
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">
                                                    Locked until {new Date(order.deliveryEstimatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {order.status === 'Delivered' && (
                                <div className="px-8 pb-8 -mt-4">
                                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                                        <div className="flex justify-between items-center">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Audit & Feedback</h5>
                                            {order.items[0]?.productId?.shopId && (
                                                userRatedIds.includes(order.items[0].productId.shopId._id) ? (
                                                    <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                                        ✅ Shop Rated
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenReview({
                                                            id: order.items[0].productId.shopId._id,
                                                            type: 'shop',
                                                            name: order.items[0].productId.shopId.shopName
                                                        })}
                                                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                    >
                                                        🏪 Rate {order.items[0].productId.shopId.shopName}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-amber-200 transition-colors group/item">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl overflow-hidden border border-slate-50">
                                                            {item.productId?.image ? (
                                                                <img src={`http://localhost:5001/uploads/${item.productId.image}`} className="w-full h-full object-cover" alt="" />
                                                            ) : "📦"}
                                                        </div>
                                                        <div>
                                                            <span className="block text-xs font-black text-slate-700 truncate max-w-[150px]">{item.productId?.name || 'Item'}</span>
                                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quantity: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    {userRatedIds.includes(item.productId?._id) ? (
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 italic font-black text-[10px]">
                                                            RA
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenReview({ id: item.productId?._id, type: 'product', name: item.productId?.name })}
                                                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100"
                                                        >
                                                            <span className="text-lg">⭐</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <span className="text-5xl block mb-6">📪</span>
                            <p className="text-slate-400 font-black">You haven't placed any orders recently.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Rating Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <button onClick={() => setShowReviewModal(false)} className="absolute top-6 right-6 text-2xl font-black hover:scale-125 transition-transform">✕</button>
                            <h3 className="text-2xl font-black leading-tight">Rate {ratingTarget?.name}</h3>
                            <p className="opacity-70 text-sm font-bold mt-1 uppercase tracking-widest">Share your expert opinion</p>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="flex justify-center gap-4">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setRatingValue(v)}
                                        className={`w-12 h-12 rounded-xl text-2xl transition-all ${ratingValue >= v ? 'bg-amber-100 text-amber-500 scale-110' : 'bg-slate-50 text-slate-300'}`}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            <textarea
                                placeholder="Your detailed feedback..."
                                value={ratingComment}
                                onChange={e => setRatingComment(e.target.value)}
                                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-bold text-sm focus:ring-4 ring-indigo-500/10"
                            ></textarea>
                            <button
                                onClick={submitReview}
                                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
                            >
                                Submit Expert Review
                            </button>

                            <div className="pt-6 border-t border-slate-50">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Reviews</h4>
                                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                                    {targetReviews.map(r => (
                                        <div key={r._id} className="bg-slate-50 p-4 rounded-xl">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-black text-slate-700 text-xs">{r.userId?.regid?.name || 'User'}</span>
                                                <span className="text-amber-500 font-bold text-xs">⭐ {r.rating}</span>
                                            </div>
                                            <p className="text-slate-500 text-xs italic">"{r.comment}"</p>
                                        </div>
                                    ))}
                                    {targetReviews.length === 0 && <p className="text-slate-300 text-[10px] font-black uppercase text-center">Be the first to rate this!</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-10 text-white text-center relative overflow-hidden">
                            <button onClick={() => !isProcessing && setShowPayment(false)} className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center font-black transition-all backdrop-blur-md">✕</button>
                            <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 backdrop-blur-xl shadow-2xl border border-white/20">💳</div>
                            <h3 className="text-3xl font-black tracking-tight mb-2">Secure Payment</h3>
                            <p className="opacity-70 font-bold text-xs uppercase tracking-[0.3em]">Grocery Order Checkout</p>
                        </div>

                        <div className="p-10">
                            <div className="mb-10 space-y-6">
                                <div className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 text-center shadow-inner">
                                    <span className="block text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3">Total Payable</span>
                                    <span className="font-black text-emerald-600 text-5xl tracking-tighter">₹{cart?.totalPrice}</span>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 text-xs font-bold text-slate-500 italic leading-relaxed">
                                    🛡️ Covered fully by your Membership Plan.
                                </div>
                            </div>

                            <button
                                onClick={processPaymentAndOrder}
                                disabled={isProcessing}
                                className={`w-full py-6 rounded-[1.5rem] font-black text-xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 group bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/40`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Authorizing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Claim with Plan</span>
                                        <span className="text-2xl group-hover:translate-x-1 transition-transform">⚡</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroceryStore;
