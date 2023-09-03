const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now, // This sets the default value to the current date/time
    },
    blocked: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
        default: 0
    },
    walletHistory: [{
        transactionDate: {
            type: Date,
        },
        transactionDetails: {
            type: String
        },
        transactionType: {
            type: String
        },
        transactionAmount: {
            type: Number
        },
        currentBalance: {
            type: Number
        },
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products'
    }],
    referralCode: {
        type: String,
        required: true,
        unique: true
    },
    referredBy: {
        type: String
    },
    isReferred: {
        type: Boolean
    }
});
module.exports = mongoose.model('User', userSchema);