const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },
        size: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
        },
        cartSubtotalPrice: {
            type: Number
        },
        cartPrice: {
            type: Number
        },
        cartDPrice: {
            type: Number
        }
    }],
    totalPrice: {
        type: Number,
        default: 0
    }
})
module.exports = mongoose.model('Cart', cartSchema);