const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    medicalHistory: {
        diabetes: { type: Boolean, default: false },
        bp: { type: Boolean, default: false },
        thyroid: { type: Boolean, default: false },
        other: { type: String, default: "" },
        height: { type: Number },
        weight: { type: Number },
        bloodGroup: { type: String },
        reports: [{
            title: String,
            file: String,
            date: { type: Date, default: Date.now }
        }]
    },
    membershipPlan: {
        type: String,
        default: 'None'
    }
});
const registerModel = mongoose.model("register", registerSchema);

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'login', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can be productId or shopId
    targetType: { type: String, enum: ['product', 'shop'], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const reviewModel = mongoose.model("review", reviewSchema);

const shopSchema = new mongoose.Schema({
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    category: { type: String, default: 'Grocery' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});
const shopModel = mongoose.model("shop", shopSchema);

const loginSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    usertype: { type: String, enum: ['user', 'shop', 'admin', 'nurse', 'homeservice'], default: 'user' },
    regid: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'usertype_ref'
    },
    usertype_ref: {
        type: String,
        enum: ['register', 'shop', 'admin', 'serviceWorker']
    }
});
const loginModel = mongoose.model("login", loginSchema);

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: String, required: true },
    subcategory: { type: String },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'shop' }
});

const productModel = mongoose.model("product", productSchema);

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, default: 'Monthly' },
    description: { type: String },
    image: { type: String },

    groceryAccess: { type: Boolean, default: false },
    cleaningAccess: { type: Boolean, default: false },
    aiDietAccess: { type: Boolean, default: false },
    nurseAccess: { type: Boolean, default: false },

    cleaningLevel: { type: String, default: 'None' },
    aiLevel: { type: String, default: 'None' },

    maxCleaningBookings: { type: Number, default: 0 },
    maxNurseBookings: { type: Number, default: 0 },

    status: { type: String, default: 'Active' }
});
const planModel = mongoose.model("plan", planSchema);

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'login', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, default: 0 }
});
const cartModel = mongoose.model("cart", cartSchema);

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'login', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
        quantity: { type: Number },
        price: { type: Number }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Delivered', 'Cancelled', 'Paid', 'Buyed'], default: 'Pending' },
    deliveryEstimatedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const orderModel = mongoose.model("order", orderSchema);

const serviceWorkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    type: { type: String, enum: ['nurse', 'cleaner', 'maintenance'], required: true },
    experience: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'available', 'busy', 'rejected'], default: 'pending' }
});
const serviceWorkerModel = mongoose.model("serviceWorker", serviceWorkerSchema);

const serviceSlotSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'serviceWorker', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false }
});
const serviceSlotModel = mongoose.model("serviceSlot", serviceSlotSchema);

const providerServiceSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'serviceWorker', required: true },
    serviceName: { type: String, required: true },
    planLevel: { type: String, enum: ['Silver', 'Gold', 'Platinum'], required: true },
    description: { type: String }
});
const providerServiceModel = mongoose.model("providerService", providerServiceSchema);

const providerMemberSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'serviceWorker', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Busy'], default: 'Available' }
});
const providerMemberModel = mongoose.model("providerMember", providerMemberSchema);

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'login', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'serviceWorker', required: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'providerMember' }],
    serviceType: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Paid'], default: 'Pending' }
});
const bookingModel = mongoose.model("booking", bookingSchema);

module.exports = {
    registerModel, loginModel, shopModel, productModel, planModel,
    cartModel, orderModel, serviceWorkerModel, bookingModel, reviewModel,
    serviceSlotModel, providerServiceModel, providerMemberModel
};
