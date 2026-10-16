
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const driver = await User.findOne({
            email: 'driver@delivery.com',
            role: 'driver'
        });

        if (!driver) {
            console.log('Driver account not found');
            return;
        }

        const newPassword = process.env.DRIVER_RESET_PASSWORD;

        if (!newPassword || newPassword.length < 12) {
            throw new Error('Set DRIVER_RESET_PASSWORD to a new password of at least 12 characters');
        }

        driver.password = newPassword;
        await driver.save();

        console.log('Driver password updated successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword();
