const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deliveryAddress: {
        type: Object
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },
        productBrand:{
            type:String,
        },
        productName: {
            type: String
        },
        productPrice:{
          type: Number  
        },
        productDiscount:{
            type: Number
        },
        size: {
            type: String
        },
        quantity: {
            type: Number
        },
        totalProductPrice: {
            type: Number
        },
        totalProductDiscountPrice:{
            type:Number
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    onlineTransactionId:{
        type:String
    },
    status: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    couponName: {
        type: String
    },
    couponDiscount: {
        type: Number
    }
})
module.exports = mongoose.model('Order',orderSchema);