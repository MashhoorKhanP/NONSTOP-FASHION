const mongoose = require('mongoose');
const addressSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addresses: [{
        userName: {
            type: String,
            required: true,
        },
        mobile: {
            type: Number,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        town: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        zip: {
            type: Number,
            required: true,
        },
        address: {
            type: String,
            requird: true,
        }
    }]
});
module.exports = mongoose.model('Addresses', addressSchema);