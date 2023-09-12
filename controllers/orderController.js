const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Products = require('../models/productModel');
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

require('dotenv').config();
const Razorpay = require('razorpay');
const { response } = require('express');
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
})

const getProceedtoCheckout = async (req, res, next) => {
    try {
        var paymentErrorMessage = req.app.locals.specialContext;
        req.app.locals.specialContext=null;
        const user = req.session.user;
        req.session.coupon = null;
        const userAddress = await Address.findOne({ userId: user._id });
        const couponData = await Coupon.find({ isCancelled: false });
        const userData = await User.findOne({ email: user.email });
        let address = [];
        if (userAddress) {
            address = userAddress.addresses;
            //console.log(address);
        }
        let cart = await Cart.findOne({ user: userData._id }).populate('products.productId');
        if (!cart) {
            return res.redirect('/cart');
        }
        let totalPrice = 0, discountPrice = 0, subTotal = 0;
        let cartList = cart.products.map(({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }) => ({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }))
        totalPrice = cartList.reduce((acc, curr) => acc + curr.cartPrice, 0);
        discountPrice = cartList.reduce((acc, curr) => acc + curr.cartDPrice, 0);
        subTotal = cartList.reduce((acc, curr) => acc + curr.cartSubtotalPrice, 0);
        req.session.totalPrice = totalPrice;
        const walletBalance = userData.wallet
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('proceedToCheckOut', { user: userData, title: 'Check Out', address, cart, totalPrice, discountPrice, subTotal, couponData, walletBalance, cartCount: req.session.cartCount,paymentErrorMessage })
    } catch (error) {
        next(error);
    }
}
/** Get Proceed To Checkout End */
/** Post PlaceOrder Start */
const postPlaceOrder = async (req, res, next) => {
    try {
        const user = req.session.user
        const userData = await User.findOne({ email: user.email });
        const addressId = req.body.address;
        //console.log(addressId);
        const paymentType = req.body.payment
        const walletSelected = req.body.walletCheckBox;
        const addressData = await Address.findOne({ userId: user._id })
        // console.log(user._id);
        // console.log(addressData)
        const findAddress = addressData.addresses.find(obj => obj._id.toString() === addressId)
        const address = {
            name: findAddress.userName,
            mobile: findAddress.mobile,
            location: findAddress.address,
            email: findAddress.email,
            pincode: findAddress.zip,
            town: findAddress.town,
            state: findAddress.state
        }
        req.session.deliveryAddress = address
        const cartData = await Cart.findOne({ user: user._id }).populate('products.productId');
        let productList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }) => ({
            productId: productId,
            productName: productId.name,
            productBrand: productId.brand,
            productPrice: productId.price,
            productDiscountPrice: productId.discountPrice,
            size,
            quantity,
            totalProductPrice: cartPrice,
            totalProductDiscountPrice: cartDPrice,
            totalSubtotalPrice: cartSubtotalPrice
        }))
        let totalPrice = cartData.totalPrice
        let couponName = ''
        let couponDiscount = 0
        let minusCouponPrice = 0
        if (req.session.coupon != null) {
            couponName = req.session.coupon.code
            // console.log(couponName);
            couponDiscount = req.session.coupon.discount
            minusCouponPrice = couponDiscount / productList.length
        }
        if (paymentType === 'COD') {
            productList.forEach(async (prod) => {
                await new Order({
                    user: userData._id,
                    deliveryAddress: address,
                    products: prod,
                    totalPrice: prod.totalProductPrice - minusCouponPrice,
                    paymentMethod: paymentType,
                    onlineTransactionId:'COD',
                    status: 'Order Confirmed',
                    date: new Date(),
                    couponName,
                    couponDiscount: minusCouponPrice
                }).save()
            })
            for (const { productId, quantity } of productList) {
                await Products.updateOne({ _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }
            await Cart.deleteOne({ user: userData._id });
            if (req.session.coupon != null) {
                await Coupon.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: userData._id } })
            }
            req.session.cartCount = 0
            res.json({ status: 'COD' })
            
        } else if (paymentType === 'WALLET') {
            if(userData.wallet>totalPrice - minusCouponPrice){

                productList.forEach(async (prod) => {
                    await new Order({
                        user: userData._id,
                        deliveryAddress: address,
                        products: prod,
                        totalPrice: prod.totalProductPrice - minusCouponPrice,
                        paymentMethod: paymentType,
                        onlineTransactionId:'WALLET',
                        status: 'Order Confirmed',
                        date: new Date(),
                        couponName,
                        couponDiscount: minusCouponPrice
                    }).save();
                })
                for (const { productId, quantity } of productList) {
                    await Products.updateOne(
                        { _id: productId._id },
                        { $inc: { quantity: -quantity } }
                    );
                }
                await Cart.deleteOne({ user: userData._id });
                if (req.session.coupon != null) {
                    await Coupon.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: user._id } })
                }
                req.session.cartCount = 0;
                let walletBalanceTotal = userData.wallet - totalPrice
                await User.findByIdAndUpdate({ _id: user._id }, {
                    $inc: { wallet: -totalPrice },
                    $push: {
                        walletHistory: {
                            transactionDate: new Date(),
                            transactionDetails: 'Product Purchase',
                            transactionType: 'Debit',
                            transactionAmount: totalPrice,
                            currentBalance: walletBalanceTotal
                        }
                    }
                })
                res.json({ status: 'WALLET' })
            }else{
                res.json({status:'WALLET BALANCE LOW' });
            }
        }else if (paymentType === 'ONLINE') {
            if (walletSelected) {
                let userData = await User.findOne({email:user.email });
                let walletBalance = parseInt(userData.wallet)
                totalPrice = parseInt(totalPrice - walletBalance)
                req.session.wallet = walletBalance
            }
            totalPrice = parseInt(totalPrice - minusCouponPrice);
            var options = {
                amount: (totalPrice * 100),
                currency: 'INR',
                receipt: ""
            }
            instance.orders.create(options, (error, order) => {
                req.session.onlineTransactionId = order.id;
                if (error) {
                    next(error);
                } else {  
                    res.json({ status: 'ONLINE', order })
                }
            })
        }
    } catch (error) {
        next(error);
    }
}
/** Post PlaceOrder End */
/** Post Verify Payment Start */
const postVerifyPayment = async (req, res, next) => {
    try {
        const details = req.body
        //console.log(details);
        const onlineTransactionId = req.session.onlineTransactionId;
        /** Razor Pay Code */
        const crypto = require('crypto');
        let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
        hmac.update(
            // details['payment[razorpay_order_id]']+ '|' +details['payment[razorpay_payment_id]']
            details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id
        )
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {
            const user = req.session.user;
            //console.log(user.firstName);
            const cartData = await Cart.findOne({ user: user._id }).populate("products.productId");
            let productList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }) => ({
                productId,
                productBrand: productId.brand,
                productName: productId.name,
                productPrice: productId.price,
                productDiscountPrice: productId.discountPrice,
                size,
                quantity,
                totalProductPrice: cartPrice,
                totalProductDiscountPrice: cartDPrice,
                totalSubtotalPrice: cartSubtotalPrice
            }))
            let totalPrice = cartData.totalPrice
            let couponName = ''
            let couponDiscount = 0
            let minusCouponPrice = 0
            let walletMinus = 0
            if (req.session.coupon != null) {
                couponName = req.session.coupon.code
                couponDiscount = req.session.coupon.discount
                minusCouponPrice = couponDiscount / productList.length
            }
            if (req.session.wallet) {
                walletMinus = req.session.wallet / productList.length
            }
            const paymentType = 'ONLINE'
            productList.forEach(async (prod) => {
                await new Order({
                    user: user._id,
                    deliveryAddress: req.session.deliveryAddress,
                    products: prod,
                    totalPrice: prod.totalProductPrice - minusCouponPrice,
                    paymentMethod: paymentType,
                    onlineTransactionId:req.session.onlineTransactionId,
                    status: 'Order Confirmed',
                    date: new Date(),
                    couponName,
                    couponDiscount: minusCouponPrice

                }).save()
            })
            for (const { productId, quantity } of productList) {
                await Products.updateOne(
                    { _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }
            await Cart.deleteOne({ user: user._id });
            if (req.session.coupon != null) {
                await Coupon.findByIdAndUpdate({ _id: req.session.coupon._id }, { $push: { usedUsers: user._id } })
            }
            req.session.cartCount = 0
            if (req.session.wallet) {
                const userData = await User.findOne({ _id: user._id })
                let totalWalletBalance = userData.wallet - req.session.wallet
                await User.findByIdAndUpdate({ _id: userData._id }, {
                    $inc: { wallet: -req.session.wallet },
                    $push: {
                        walletHistory: {
                            transactionDate: new Date(),
                            transactionDetails: 'Product Purchase',
                            transactionType: 'Debit',
                            transactionAmount: req.session.wallet,
                            currentBalance: totalWalletBalance
                        }
                    }
                })
                req.session.wallet = null
            }
            res.json({paymentSuccess: true })
        }else{
            console.log('Payment Error')
            res.json({paymentSuccess: false})
        }
    } catch (error) {
        next(error);
    }
}
/** Post Verify Payment End */
/**Get Order Start */
const getMyOrders = async (req, res, next) => {
    try {
        let page = 1
        if (req.query.page) {
            page = req.query.page
        }
        let limit = 3;
        const user = req.session.user;
        const userData = await User.findOne({ email: user.email })
        const orders = await Order.find({ user: userData._id }).populate('products.productId').sort({ date: -1 }).limit(limit * 1).skip((page - 1) * limit)
        let totalOrdersCount = await Order.find({ user: userData._id }).count()
        let pageCount = Math.ceil(totalOrdersCount / limit);
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })

        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('myOrders', { user: userData, title: 'My Orders', pageCount, orders, currentPage: page, cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/**Get Order End */
/** Get Order Success Start */
const getOrderSuccess = async (req, res, next) => {
    try {
        let user = req.session.user;
        let userData = await User.findOne({ email: user.email });
        let cartCount = await Cart.findOne({ user: userData._id })
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        if (cartCount && cartCount.products) {
            req.session.cartCount = cartCount.products.length;
        } else {
            req.session.cartCount = 0
        }
        res.render('orderSuccess', { user: userData, title: 'Order Success', cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/** Get Order Success End */
/** Get Order Failure Start */
const getOrderFailure = async (req, res, next) => {
    try {
        let user = req.session.user;
        let userData = await User.findOne({ email: user.email });
        let cartCount = await Cart.findOne({ user: userData._id })
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        if (cartCount && cartCount.products) {
            req.session.cartCount = cartCount.products.length;
        } else {
            req.session.cartCount = 0
        }
        res.render('orderFailure', { user: userData, title: 'Order Failed', cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/** Get Order Failure End */
/**Get Order Details Start*/
const getOrderDetails = async (req, res, next) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ email: user.email });
        const orderId = req.query.details;
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        const orders = await Order.find({ user: userData._id }).populate('products.productId');
        const orderDetails = await Order.findOne({ _id: orderId }).populate('products.productId');
        //console.log(orderDetails.deliveryAddress);
        let status = 0;
        if (orderDetails.status.toString() === 'Order Confirmed') {
            status = 1;
        } else if (orderDetails.status.toString() === 'Shipped') {
            status = 2;
        } else if (orderDetails.status.toString() === 'Out for delivery') {
            status = 3;
        } else if (orderDetails.status.toString() === 'Delivered') {
            status = 4;
        } else if (orderDetails.status.toString() === 'Cancelled') {
            status = 5;
        } else if (orderDetails.status.toString() === 'Cancelled by admin') {
            status = 6;
        } else if (orderDetails.status.toString() === 'Pending for return approval') {
            status = 7
        } else if (orderDetails.status.toString() === 'Returned') {
            status = 8;
        }
        let allowReturn = true;
        let orderedDate = orderDetails.date
        let returnLastDate = new Date(orderedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        if (new Date() > returnLastDate) {
            allowReturn = false;
        }
        res.render('orderDetails', { user: userData, orderDetails, status, title: 'Order Details', allowReturn, cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/**Get Order Details End*/
/** Post Cancel Order Start */
const postCancelOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id
        const status = req.query.status
        const orderData = await Order.findOne({ _id: orderId });
        const userId = orderData.user
        const userData = await User.findOne({ _id: userId })
        if ((orderData.paymentMethod === 'ONLINE') || (orderData.paymentMethod === 'WALLET')) {
            let purchaseAmount = Math.round(orderData.totalPrice)
            let totalWalletAmount = userData.wallet + purchaseAmount
            await User.findByIdAndUpdate({ _id: userId },
                {
                    $inc: { wallet: purchaseAmount },
                    $push: {
                        walletHistory: {
                            transactionDate: new Date(),
                            transactionDetails: 'Order Cancellation',
                            transactionType: 'Credit',
                            transactionAmount: purchaseAmount,
                            currentBalance: totalWalletAmount
                        }
                    }
                })
        }
        await Order.updateOne({ _id: orderId }, { $set: { status } })
        if (status.toString() === 'Cancelled') {
            res.redirect('/myorders');
        } else {
            res.redirect(`/admin/orders?id=${orderId}`);
        }
    } catch (error) {
        next(error);
    }
}
/** Post Cancel Order End */
/** Invoice Start */
const getInvoice = async (req, res, next) => {
    try {
        const orderId = req.query.id;
        const order = await Order.findOne({ _id: orderId })
        res.render('invoice', { order, title: 'Order Invoice' })
    } catch (error) {
        next(error);
    }
}
/** Invoice End */

//** Admin */
/** Get Orders Start */
const getOrders = async (req, res, next) => {
    try {
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const orders = await Order.find({}).populate('products.productId').populate('user').sort({ date: -1 }).skip((pageNum - 1) * limit).limit(limit);
        const totalOrderCount = await Order.find({}).count()
        let pageCount = Math.ceil(totalOrderCount / limit);
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        res.render('orders', { admin: adminData, orders, pageCount, pageNum, limit, title: 'Orders', page: 'Orders' })
    } catch (error) {
        next(error);
    }
}
/** Get Orders End */
/** Get Single Order Start */
const getSingleOrderDetails = async (req, res, next) => {
    try {
        const orderId = req.query.id;
        const order = await Order.findOne({ _id: orderId }).populate('products.productId').populate('user')
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        res.render('singleOrderDetails', { admin: adminData, order, title: 'Single Order Details', page: 'Orders' });
    } catch (error) {
        next(error);
    }
}
/** Get Single Order End */
/** Post Order Status Start */
const postOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.query.id;
        const status = req.body.status
        await Order.updateOne({ _id: orderId }, { $set: { status } })
        const referringUrl = req.headers.referer;
        return res.redirect(referringUrl);
    } catch (error) {
        next(error);
    }
}
/** Post Order Status End*/
/** Post Return Start */
const postReturnOrder = async (req, res, next) => {
    try {
        const orderId = req.body.orderId
        const status = req.body.status
        await Order.updateOne({ _id: orderId }, { $set: { status } })
        const referringUrl = req.headers.referer;
        return res.redirect(referringUrl);
    } catch (error) {
        next(error);
    }
}
/** Post Return End */
/** Post Approve Return Start */
const postApproveReturn = async (req, res, next) => {

    try {
        let orderId = req.params.id;
        //console.log(orderId);
        let orderData = await Order.findOne({ _id: orderId })
        const userId = orderData.user
        //console.log(orderData);
        const userData = await User.findOne({ _id: userId })
        let orderTotal = Math.round(orderData.totalPrice)
        // console.log(orderTotal)
        let totalWalletBalance = userData.wallet + orderTotal;
        await User.findByIdAndUpdate({ _id: userId },
            {
                $inc: { wallet: orderTotal },
                $push: {
                    walletHistory: {
                        transactionDate: new Date(),
                        transactionDetails: 'Order return refund',
                        transactionType: 'Credit',
                        transactionAmount: orderTotal,
                        currentBalance: totalWalletBalance
                    }
                }
            })
        await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: 'Returned' } })
        const referringUrl = req.headers.referer;
        return res.redirect(referringUrl);
    } catch (error) {
        next(error);
    }
}
/** Post Approve Return End */

module.exports = {
    getProceedtoCheckout,
    postPlaceOrder,
    postVerifyPayment,
    getMyOrders,
    getOrderSuccess,
    getOrderFailure,
    getOrderDetails,
    postCancelOrder,
    getOrders,
    getSingleOrderDetails,
    postOrderStatus,
    postReturnOrder,
    postApproveReturn,
    getInvoice
} 