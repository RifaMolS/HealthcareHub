const express = require("express");
const router = express.Router();
const healthController = require('../controller/healthcontroller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post("/register", healthController.reginsert);
router.post("/shop-register", healthController.shopRegister);
router.post("/login", healthController.login);
router.put("/update-profile/:id", healthController.updateProfile);

// Handle product addition with image upload
router.post("/add-product", upload.single('image'), healthController.addProduct);
router.delete("/delete-product/:id", healthController.deleteProduct);

router.get("/shop-products/:shopId", healthController.getShopProducts);
router.get("/all-shops", healthController.getAllShops);
router.post("/update-shop-status", healthController.updateShopStatus);

router.get("/admin/stats", healthController.getAdminStats);
router.get("/admin/users", healthController.getAllUsers);
router.get("/admin/products", healthController.getAllProducts);

router.get("/admin/plans", healthController.getAllPlans);
router.post("/admin/add-plan", upload.single('image'), healthController.createPlan);
router.delete("/admin/delete-plan/:id", healthController.deletePlan);
router.put("/admin/update-plan/:id", upload.single('image'), healthController.updatePlan);

router.delete("/admin/delete-user/:id", healthController.deleteUser);
router.get("/admin/workers", healthController.getAllWorkers);
router.delete("/admin/delete-worker/:id", healthController.deleteWorker);
router.put("/admin/update-worker-status/:id", healthController.updateWorkerStatus);
router.get("/user-profile/:id", healthController.getUserProfile);

// New Routes for User Functionalities
router.get("/products", healthController.getAllAvailableProducts);
router.post("/cart", healthController.addToCart);
router.get("/cart/:userId", healthController.getCart);
router.post("/order", healthController.placeOrder);
router.get("/orders/:userId", healthController.getOrders);
router.get("/get-shop-orders/:shopId", healthController.getShopOrders);
router.put("/update-order-status/:id", healthController.updateOrderStatus);

router.post("/provider-register", healthController.workerRegister);
router.get("/workers/:type", healthController.getWorkers);
router.post("/book", healthController.createBooking);
router.get("/bookings/:userId", healthController.getUserBookings);
router.delete("/booking/:id", healthController.deleteBooking);

// Worker Dashboard Routes
router.get("/provider-bookings/:workerId", healthController.getWorkersBookings);
router.put("/booking-status/:id", healthController.updateBookingStatus);

// Home Service Enhancements
router.post("/add-slot", healthController.addSlot);
router.get("/worker-slots/:workerId", healthController.getWorkerSlots);
router.post("/add-provider-service", healthController.addProviderService);
router.get("/provider-services/:workerId", healthController.getProviderServices);
router.put("/update-provider-service/:id", healthController.updateProviderService);
router.delete("/delete-provider-service/:id", healthController.deleteProviderService);
router.post("/add-provider-member", healthController.addProviderMember);
router.get("/provider-members/:workerId", healthController.getProviderMembers);
router.post("/assign-member", healthController.assignMemberToBooking);
router.get("/users-service-plans", healthController.getUsersWithServicePlans);

// Razorpay Payment Routes
router.post("/razorpay-order", healthController.createRazorpayOrder);
router.post("/razorpay-verify", healthController.verifyRazorpayPayment);

// Review & Profile Routes
router.put("/update-medical-history/:id", healthController.updateMedicalHistory);
router.post("/upload-medical-report/:id", upload.single('file'), healthController.uploadMedicalReport);
router.post("/reviews", healthController.addReview);
router.get("/reviews/:targetId", healthController.getTargetReviews);
router.get("/user-reviews/:userId", healthController.getUserReviews);
router.get("/get-shop-reviews/:shopId", healthController.getShopFullReviews);

module.exports = router;
