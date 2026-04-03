const mongoose = require('mongoose');
const { loginModel } = require('./model/healthmodel');

async function seedAdmin() {
    try {
        await mongoose.connect("mongodb://localhost:27017/healthhub");
        console.log("Connected to MongoDB...");

        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin';

        const existingAdmin = await loginModel.findOne({ email: adminEmail });
        if (existingAdmin) {
            existingAdmin.password = adminPassword;
            await existingAdmin.save();
            console.log("Admin password updated successfully.");
        } else {
            await loginModel.create({
                email: adminEmail,
                password: adminPassword,
                usertype: 'admin',
                usertype_ref: 'admin'
            });
            console.log("Admin seeded successfully.");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();
