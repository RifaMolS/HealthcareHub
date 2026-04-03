const { registerModel, loginModel, shopModel, productModel, planModel, cartModel, orderModel, serviceWorkerModel, bookingModel, reviewModel, serviceSlotModel, providerServiceModel, providerMemberModel } = require('../model/healthmodel');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.reginsert = async (req, res) => {
    try {
        const { name, address, phone, dob, age, password } = req.body;
        const email = req.body.email.trim();

        const existingUser = await loginModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const reg = await registerModel.create({ name, address, phone, dob, age });

        let userLogin;
        try {
            userLogin = await loginModel.create({
                email,
                password,
                usertype: "user",
                regid: reg._id,
                usertype_ref: "register"
            });
        } catch (loginErr) {
            // Clean up the created register record if login fails
            await registerModel.findByIdAndDelete(reg._id);
            throw loginErr;
        }

        res.status(201).json({ message: "Registration successful", user: userLogin });
    } catch (err) {
        console.error("Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.shopRegister = async (req, res) => {
    try {
        const { shopName, ownerName, phone, address, password } = req.body;
        const email = req.body.email.trim();

        const existingUser = await loginModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const shop = await shopModel.create({ shopName, ownerName, email, phone, address });

        let shopLogin;
        try {
            shopLogin = await loginModel.create({
                email,
                password,
                usertype: "shop",
                regid: shop._id,
                usertype_ref: "shop"
            });
        } catch (loginErr) {
            // Clean up the created shop record if login fails
            await shopModel.findByIdAndDelete(shop._id);
            throw loginErr;
        }

        res.status(201).json({ message: "Shop registration successful", user: shopLogin });
    } catch (err) {
        console.error("Shop Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.workerRegister = async (req, res) => {
    try {
        const { name, phone, experience, password, type } = req.body;
        const email = req.body.email.trim();

        const existingUser = await loginModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const workerTypeMap = {
            'nurse': 'nurse',
            'homeservice': 'cleaner', // Mapping default homeservice to cleaner type for backward compatibility
            'cleaner': 'cleaner',
            'maintenance': 'maintenance'
        };

        const dbWorkerType = workerTypeMap[type] || 'cleaner';

        const worker = await serviceWorkerModel.create({
            name,
            email,
            phone,
            type: dbWorkerType,
            experience: Number(experience) || 0,
            status: type === 'nurse' ? 'available' : 'pending'
        });

        let workerLogin;
        try {
            workerLogin = await loginModel.create({
                email,
                password,
                usertype: type, // 'nurse' or 'homeservice'
                regid: worker._id,
                usertype_ref: "serviceWorker"
            });
        } catch (loginErr) {
            await serviceWorkerModel.findByIdAndDelete(worker._id);
            throw loginErr;
        }

        res.status(201).json({ message: "Provider registered successfully", user: workerLogin });
    } catch (err) {
        console.error("Worker Registration Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const email = req.body.email.trim();
        const { password } = req.body;

        const user = await loginModel.findOne({ email, password }).populate({
            path: 'regid',
            refPath: 'usertype_ref'
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // If admin and no regid, provide a default object to avoid frontend breaks if any
        if (user.usertype === 'admin' && !user.regid) {
            user.regid = { name: "Administrator" };
        }

        // Check if shop is approved
        if (user.usertype === 'shop') {
            if (user.regid && user.regid.status === 'pending') {
                return res.status(403).json({ message: "Your account is pending approval from Admin." });
            }
            if (user.regid && user.regid.status === 'rejected') {
                return res.status(403).json({ message: "Your account has been rejected." });
            }
        }

        // Check if service provider (nurse/homeservice) is approved
        if (user.usertype === 'nurse' || user.usertype === 'homeservice') {
            if (user.regid && user.regid.status === 'pending') {
                return res.status(403).json({ message: "Your account is pending approval from Admin." });
            }
            if (user.regid && user.regid.status === 'rejected') {
                return res.status(403).json({ message: "Your account has been rejected by Admin." });
            }
        }

        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicalHistory, membershipPlan } = req.body;
        const updatedReg = await registerModel.findByIdAndUpdate(id, { medicalHistory, membershipPlan }, { new: true });
        res.status(200).json({ message: "Profile updated successfully", data: updatedReg });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, price, description, category, subcategory, shopId } = req.body;
        const image = req.file ? req.file.filename : '';

        const product = await productModel.create({
            name,
            price,
            description,
            category,
            subcategory,
            image,
            shopId
        });

        res.status(201).json({ message: "Product added successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Error adding product", error: err.message });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const result = await productModel.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product", error: err.message });
    }
};

exports.getShopProducts = async (req, res) => {
    try {
        const products = await productModel.find({ shopId: req.params.shopId });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

exports.getAllShops = async (req, res) => {
    try {
        const shops = await shopModel.find();
        res.status(200).json(shops);
    } catch (err) {
        res.status(500).json({ message: "Error fetching shops", error: err.message });
    }
};

exports.updateShopStatus = async (req, res) => {
    try {
        const { shopId, status } = req.body;
        const updatedShop = await shopModel.findByIdAndUpdate(shopId, { status }, { new: true });
        res.status(200).json({ message: "Status updated", shop: updatedShop });
    } catch (err) {
        res.status(500).json({ message: "Error updating status", error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await loginModel.find({ usertype: 'user' }).populate({
            path: 'regid',
            model: 'register'
        });
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Error fetching users", error: err.message });
    }
};

exports.getAllWorkers = async (req, res) => {
    try {
        const workers = await serviceWorkerModel.find();
        res.status(200).json(workers);
    } catch (err) {
        res.status(500).json({ message: "Error fetching workers", error: err.message });
    }
};

exports.deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await serviceWorkerModel.findById(id);
        if (!worker) return res.status(404).json({ message: "Worker not found" });

        // Delete from loginModel too
        await loginModel.findOneAndDelete({ regid: id });
        await serviceWorkerModel.findByIdAndDelete(id);

        res.status(200).json({ message: "Provider deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting provider", error: err.message });
    }
};

exports.updateWorkerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const worker = await serviceWorkerModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!worker) return res.status(404).json({ message: "Worker not found" });

        res.status(200).json({ message: "Worker status updated successfully", worker });
    } catch (err) {
        res.status(500).json({ message: "Error updating worker status", error: err.message });
    }
};

// exports.createPlan = async (req, res) => {
//     try {
//         const { name, price, features, description } = req.body;
//         const image = req.file ? req.file.filename : '';
//         const newPlan = await planModel.create({ name, price, features, description, image });
//         res.status(201).json({ message: "Plan created successfully", plan: newPlan });
//     } catch (err) {
//         res.status(500).json({ message: "Error creating plan", error: err.message });
//     }
// };

exports.createPlan = async (req, res) => {
    try {
        const {
            name, price, duration, description,
            cleaningLevel, aiLevel,
            maxCleaningBookings, maxNurseBookings, status
        } = req.body;

        // Parse Booleans (FormData sends them as strings "true"/"false")
        const groceryAccess = req.body.groceryAccess === 'true';
        const cleaningAccess = req.body.cleaningAccess === 'true';
        const aiDietAccess = req.body.aiDietAccess === 'true';
        const nurseAccess = req.body.nurseAccess === 'true';

        const image = req.file ? req.file.filename : '';

        const newPlan = await planModel.create({
            name,
            price: Number(price),
            duration,
            description,
            image,
            groceryAccess,
            cleaningAccess,
            aiDietAccess,
            nurseAccess,
            cleaningLevel,
            aiLevel,
            maxCleaningBookings: Number(maxCleaningBookings) || 0,
            maxNurseBookings: Number(maxNurseBookings) || 0,
            status
        });

        res.status(201).json({
            message: "Plan created successfully",
            plan: newPlan
        });
    } catch (err) {
        console.error("Create Plan Error:", err);
        res.status(500).json({
            message: "Error creating plan",
            error: err.message
        });
    }
};


exports.getAllPlans = async (req, res) => {
    try {
        const plans = await planModel.find();
        res.status(200).json(plans);
    } catch (err) {
        res.status(500).json({ message: "Error fetching plans", error: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find().populate('shopId', 'shopName ownerName');
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const userCount = await loginModel.countDocuments({ usertype: 'user' });
        const shopCount = await shopModel.countDocuments();
        const productCount = await productModel.countDocuments();
        const pendingShops = await shopModel.countDocuments({ status: 'pending' });
        const pendingWorkers = await serviceWorkerModel.countDocuments({ status: 'pending' });

        res.status(200).json({
            users: userCount,
            shops: shopCount,
            products: productCount,
            pendingShops: pendingShops + pendingWorkers
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching stats", error: err.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await loginModel.findById(id).populate({
            path: 'regid',
            model: 'register'
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: "Error fetching profile", error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await loginModel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Delete associated profile
        if (user.usertype === 'user' && user.regid) {
            await registerModel.findByIdAndDelete(user.regid);
        } else if (user.usertype === 'shop' && user.regid) {
            await shopModel.findByIdAndDelete(user.regid);
        }

        await loginModel.findByIdAndDelete(id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err.message });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        await planModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Plan deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting plan", error: err.message });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle booleans
        ['groceryAccess', 'cleaningAccess', 'aiDietAccess', 'nurseAccess'].forEach(key => {
            if (updateData[key] !== undefined) {
                updateData[key] = updateData[key] === 'true';
            }
        });

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const updatedPlan = await planModel.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ message: "Plan updated successfully", plan: updatedPlan });
    } catch (err) {
        res.status(500).json({ message: "Error updating plan", error: err.message });
    }
};

// --- USER FUNCTIONALITIES ---

exports.getAllAvailableProducts = async (req, res) => {
    try {
        const products = await productModel.find().populate('shopId', 'shopName');
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, price } = req.body;
        let cart = await cartModel.findOne({ userId });
        if (!cart) {
            cart = await cartModel.create({ userId, items: [], totalPrice: 0 });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, price });
        }

        cart.totalPrice = cart.items.reduce((total, item) => total + (item.quantity * item.price), 0);
        await cart.save();
        res.status(200).json({ message: "Added to cart", cart });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        const cart = await cartModel.findOne({ userId: req.params.userId }).populate('items.productId');
        res.status(200).json(cart || { items: [], totalPrice: 0 });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.placeOrder = async (req, res) => {
    try {
        const { userId, items, totalAmount } = req.body;

        // Fetch user to check plan
        const user = await loginModel.findById(userId).populate('regid');
        const hasPlan = user?.regid?.membershipPlan && user.regid.membershipPlan !== 'None';

        // Set delivery estimate to 3 hours from now
        const deliveryEstimatedAt = new Date();
        deliveryEstimatedAt.setHours(deliveryEstimatedAt.getHours() + 3);

        const order = await orderModel.create({
            userId,
            items,
            totalAmount,
            status: hasPlan ? 'Paid' : 'Confirmed',
            deliveryEstimatedAt
        });

        // Clear cart after place order
        await cartModel.findOneAndDelete({ userId });
        res.status(201).json({ message: "Order Placed Successfully", order });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.getShopOrders = async (req, res) => {
    try {
        const { shopId } = req.params;
        const orders = await orderModel.find().populate({
            path: 'items.productId',
            select: 'name price shopId'
        }).populate({
            path: 'userId',
            populate: { path: 'regid', select: 'name' }
        });

        const shopOrders = orders.filter(order =>
            order.items.some(item => item.productId && item.productId.shopId && item.productId.shopId.toString() === shopId)
        );

        const formattedOrders = shopOrders.map(order => {
            const shopItems = order.items.filter(item =>
                item.productId && item.productId.shopId && item.productId.shopId.toString() === shopId
            );
            const shopTotal = shopItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                _id: order._id,
                customerName: order.userId?.regid?.name || 'Customer',
                items: shopItems,
                totalAmount: shopTotal,
                status: order.status,
                createdAt: order.createdAt
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(formattedOrders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching shop orders", error: err.message });
    }
};


exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const now = new Date();

        // Auto-update orders that passed the delivery estimate
        await orderModel.updateMany(
            {
                userId,
                status: { $in: ['Pending', 'Confirmed'] },
                deliveryEstimatedAt: { $lte: now }
            },
            { $set: { status: 'Delivered' } }
        );

        const orders = await orderModel.find({ userId }).populate({
            path: 'items.productId',
            populate: { path: 'shopId' }
        });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await orderModel.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json({ message: "Order status updated", order });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.getWorkers = async (req, res) => {
    try {
        const type = req.params.type; // 'nurse', 'cleaner', 'maintenance'
        const workers = await serviceWorkerModel.find({ type, status: 'available' });
        res.status(200).json(workers);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { userId, workerId, serviceType, date, time } = req.body;

        // Fetch user to check plan
        const user = await loginModel.findById(userId).populate('regid');
        const hasPlan = user?.regid?.membershipPlan && user.regid.membershipPlan !== 'None';

        const booking = await bookingModel.create({
            userId,
            workerId,
            serviceType,
            date,
            time,
            status: hasPlan ? 'Confirmed' : 'Pending'
        });
        res.status(201).json({ message: "Booking Confirmed", booking });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.find({ userId: req.params.userId })
            .populate('workerId')
            .populate('memberIds');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const result = await bookingModel.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Booking not found' });
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: "Error deleting booking", error: err.message });
    }
};

exports.getWorkersBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.find({ workerId: req.params.workerId })
            .populate({
                path: 'userId',
                populate: { path: 'regid' }
            })
            .populate('memberIds');
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await bookingModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json({ message: "Status Updated", booking });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency,
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.status(201).json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (err) {
        console.error("Razorpay Order Error:", err);
        res.status(500).json({ message: "Error creating Razorpay order", error: err.message });
    }
};
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, regId, planName } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Update user membership ONLY if it was a membership plan payment
            if (regId && planName) {
                await registerModel.findByIdAndUpdate(regId, { membershipPlan: planName });
                return res.status(200).json({ message: "Payment verified and membership updated", status: "success" });
            }

            // For other payments (like grocery), just return success
            res.status(200).json({ message: "Payment verified successfully", status: "success" });
        } else {
            console.error("Signature mismatch");
            res.status(400).json({ message: "Invalid signature", status: "failure" });
        }
    } catch (err) {
        console.error("Razorpay Verification Error:", err);
        res.status(500).json({ message: "Error verifying payment", error: err.message });
    }
};

exports.updateMedicalHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { diabetes, bp, thyroid, other, height, weight, bloodGroup } = req.body;
        const reg = await registerModel.findById(id);
        const updatedReg = await registerModel.findByIdAndUpdate(
            id,
            {
                medicalHistory: {
                    diabetes, bp, thyroid, other, height, weight, bloodGroup,
                    reports: reg.medicalHistory.reports
                }
            },
            { new: true }
        );
        res.status(200).json({ message: "Medical history updated", data: updatedReg });
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};

exports.uploadMedicalReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const file = req.file ? req.file.filename : '';

        const user = await registerModel.findById(id);
        user.medicalHistory.reports.push({ title, file });
        await user.save();

        res.status(200).json({ message: "Report uploaded successfully", data: user });
    } catch (err) {
        res.status(500).json({ message: "Error uploading report", error: err.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const { userId, targetId, targetType, rating, comment } = req.body;
        const review = await reviewModel.create({ userId, targetId, targetType, rating, comment });
        res.status(201).json({ message: "Review added successfully", review });
    } catch (err) {
        res.status(500).json({ message: "Error adding review", error: err.message });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await reviewModel.find({ userId });
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user reviews", error: err.message });
    }
};

exports.getTargetReviews = async (req, res) => {
    try {
        const { targetId } = req.params;
        const reviews = await reviewModel.find({ targetId }).populate({
            path: 'userId',
            select: 'regid',
            populate: { path: 'regid', select: 'name' }
        });
        res.status(200).json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Error fetching reviews", error: err.message });
    }
};

exports.getShopFullReviews = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Find all products for this shop
        const products = await productModel.find({ shopId }).select('_id name');
        const productIds = products.map(p => p._id);

        // Fetch shop reviews
        const shopReviews = await reviewModel.find({ targetId: shopId, targetType: 'shop' }).populate({
            path: 'userId',
            select: 'regid',
            populate: { path: 'regid', select: 'name' }
        });

        // Fetch product reviews
        const productReviews = await reviewModel.find({ targetId: { $in: productIds }, targetType: 'product' }).populate({
            path: 'userId',
            select: 'regid',
            populate: { path: 'regid', select: 'name' }
        });

        // Map product names to reviews for easier display
        const productReviewsWithNames = productReviews.map(review => {
            const product = products.find(p => p._id.toString() === review.targetId.toString());
            return {
                ...review.toObject(),
                productName: product ? product.name : 'Unknown Product'
            };
        });

        res.status(200).json({
            shopReviews: shopReviews || [],
            productReviews: productReviewsWithNames || []
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching shop reviews", error: err.message });
    }
};


exports.addSlot = async (req, res) => {
    try {
        const { workerId, date, time } = req.body;
        const slot = await serviceSlotModel.create({ workerId, date, time });
        res.status(201).json({ message: "Slot added successfully", slot });
    } catch (err) {
        res.status(500).json({ message: "Error adding slot", error: err.message });
    }
};

exports.getWorkerSlots = async (req, res) => {
    try {
        const { workerId } = req.params;
        const slots = await serviceSlotModel.find({ workerId });
        res.status(200).json(slots);
    } catch (err) {
        res.status(500).json({ message: "Error fetching slots", error: err.message });
    }
};

exports.addProviderService = async (req, res) => {
    try {
        const { workerId, serviceName, planLevel, description } = req.body;

        // Prevent duplicate services for the same plan
        const existing = await providerServiceModel.findOne({ workerId, serviceName, planLevel });
        if (existing) {
            return res.status(400).json({ message: "Service already exists for this plan" });
        }

        const service = await providerServiceModel.create({ workerId, serviceName, planLevel, description });
        res.status(201).json({ message: "Service added successfully", service });
    } catch (err) {
        res.status(500).json({ message: "Error adding service", error: err.message });
    }
};

exports.updateProviderService = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, planLevel, description } = req.body;
        const service = await providerServiceModel.findByIdAndUpdate(id, { serviceName, planLevel, description }, { new: true });
        res.status(200).json({ message: "Service updated successfully", service });
    } catch (err) {
        res.status(500).json({ message: "Error updating service", error: err.message });
    }
};

exports.deleteProviderService = async (req, res) => {
    try {
        const { id } = req.params;
        await providerServiceModel.findByIdAndDelete(id);
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting service", error: err.message });
    }
};

exports.getProviderServices = async (req, res) => {
    try {
        const { workerId } = req.params;
        const services = await providerServiceModel.find({ workerId });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({ message: "Error fetching services", error: err.message });
    }
};

exports.addProviderMember = async (req, res) => {
    try {
        const { workerId, name, phone } = req.body;
        const member = await providerMemberModel.create({ workerId, name, phone });
        res.status(201).json({ message: "Member added successfully", member });
    } catch (err) {
        res.status(500).json({ message: "Error adding member", error: err.message });
    }
};

exports.getProviderMembers = async (req, res) => {
    try {
        const { workerId } = req.params;
        const members = await providerMemberModel.find({ workerId });
        res.status(200).json(members);
    } catch (err) {
        res.status(500).json({ message: "Error fetching members", error: err.message });
    }
};

exports.assignMemberToBooking = async (req, res) => {
    try {
        const { bookingId, memberIds } = req.body; // Expecting an array of memberIds
        const booking = await bookingModel.findByIdAndUpdate(
            bookingId,
            { memberIds, status: 'Confirmed' },
            { new: true }
        );

        // Mark members as busy
        if (memberIds && memberIds.length > 0) {
            await providerMemberModel.updateMany(
                { _id: { $in: memberIds } },
                { status: 'Busy' }
            );
        }

        res.status(200).json({ message: "Members assigned successfully", booking });
    } catch (err) {
        res.status(500).json({ message: "Error assigning members", error: err.message });
    }
};

exports.getUsersWithServicePlans = async (req, res) => {
    try {
        // Users who have booked home services
        const bookings = await bookingModel.find()
            .populate({
                path: 'userId',
                populate: { path: 'regid' }
            })
            .populate('memberIds')
            .populate('workerId');

        // Extract unique users with their latest booking info and plan
        const usersMap = {};
        bookings.forEach(b => {
            if (b.userId && b.userId.regid) {
                const uid = b.userId._id.toString();
                if (!usersMap[uid]) {
                    usersMap[uid] = {
                        user: b.userId.regid,
                        plan: b.userId.regid.membershipPlan,
                        bookings: []
                    };
                }
                usersMap[uid].bookings.push({
                    providerName: b.workerId ? b.workerId.name : 'Unknown',
                    serviceType: b.serviceType,
                    date: b.date,
                    time: b.time,
                    status: b.status,
                    assignedMembers: b.memberIds && b.memberIds.length > 0
                        ? b.memberIds.map(m => m.name).join(', ')
                        : 'Not Assigned'
                });
            }
        });

        res.status(200).json(Object.values(usersMap));
    } catch (err) {
        res.status(500).json({ message: "Error fetching user data", error: err.message });
    }
};
