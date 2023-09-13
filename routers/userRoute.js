const express = require('express');
const user_route = express();
const session = require('express-session');
const { randomUUID } = require('crypto');

const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const addressController = require('../controllers/addressController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');

const isUser = require('../middleware/userAuth');


user_route.use(express.json());

user_route.use(express.urlencoded({ extended: true }));

user_route.use(session(
    {
        secret: randomUUID(),
        resave: false,
        saveUninitialized: true
    }
));

user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

//Home
user_route.get('/', productController.getHome);
user_route.get('/home', productController.getHome);

//Shop
user_route.get('/shop', userController.getShop);

//SignUp
user_route.get('/signup', isUser.loggedOut, userController.getSignup);
user_route.post('/signup', userController.postSignup);

//Verify OTP
user_route.post('/verifyotp', isUser.loggedOut, userController.postVerifyOtp);
user_route.get('/resend-otp', userController.getResendOTP);

//Login
user_route.get('/login', isUser.loggedOut, userController.getLogin);
user_route.post('/login', userController.postLogin);
user_route.get('/forgotpassword',userController.getLoginForgotPassword);
user_route.post('/login-resetpassword',userController.postLoginResetPassword);
user_route.post('/resetpassword-verifyotp',userController.postResetPasswordVerifyOTP)
//Logout
user_route.post('/logout', userController.postLogout);

//Get Profile
user_route.get('/profile/:id', isUser.loggedIn, userController.getProfile);

//Edit Profile
user_route.get('/editprofile', isUser.loggedIn, userController.getEditProfile);
user_route.post('/editprofile', userController.postEditProfile);

user_route.get('/productdetails/:id', productController.getProductDetails);

user_route.get('/profile/:id/addaddress', isUser.loggedIn, addressController.getAddAddress);
user_route.post('/profile/:id/addaddress', addressController.postAddAddress);

user_route.get('/profile/:id/manageaddress', isUser.loggedIn, addressController.getManageAddress);
user_route.get('/manageaddress/editaddress/:id', isUser.loggedIn, addressController.getEditAddress);
user_route.post('/manageaddress/editaddress/:id', addressController.postEditAddress);
user_route.get('/manageaddress/deleteaddress/:id', isUser.loggedIn, addressController.getDeleteAddress);

user_route.get('/profile/:id/managepassword', isUser.loggedIn, userController.getManagePassword);
user_route.post('/profile/:id/managepassword', userController.postManagePassword);

user_route.get('/profile/:id/forgotpassword', isUser.loggedIn, userController.getForgotPassword);
user_route.post('/profile/:id/forgotpassword', userController.postForgotPassword);

user_route.get('/profile/:id/resetpassword', isUser.loggedIn, userController.getResetPassword);
user_route.post('/profile/:id/resetpassword', userController.postResetPassword);

/** Wishlist */
user_route.get('/wishlist', isUser.loggedIn,userController.getWishlist);
user_route.post('/wishlist/:id', userController.postWishlist);

/**Cart */
user_route.get('/cart', isUser.loggedIn, cartController.getCart);
user_route.post('/addtocart/:id', cartController.postAddToCart);
user_route.put('/updatecart', cartController.updateCart);
user_route.get('/removecartproduct/:id', cartController.getRemoveCartProduct);

/** Proceed to checkout & Place Order*/
user_route.get('/proceedtocheckout', isUser.loggedIn, orderController.getProceedtoCheckout);
user_route.post('/placeorder', orderController.postPlaceOrder);

/** Payment Verify */
user_route.post('/verifypayment', orderController.postVerifyPayment);

/** Orders */
user_route.get('/myorders', isUser.loggedIn, orderController.getMyOrders);
user_route.get('/orderdetails', isUser.loggedIn, orderController.getOrderDetails);
user_route.post('/cancel-order/:id', isUser.loggedIn, orderController.postCancelOrder);
user_route.post('/return-order', isUser.loggedIn, orderController.postReturnOrder);
user_route.get('/invoice', isUser.loggedIn, orderController.getInvoice);

user_route.get('/ordersuccess', isUser.loggedIn, orderController.getOrderSuccess);
user_route.get('/orderfailure', isUser.loggedIn, orderController.getOrderFailure);

/** Coupon */
user_route.post('/applycoupon', couponController.postApplyCoupon);
user_route.get('/removecoupon',isUser.loggedIn, couponController.getRemoveCoupon);

/**Wallet*/
user_route.get('/wallet-history', isUser.loggedIn, userController.getWalletHistory);

/**Reviews*/
user_route.get('/review-product', isUser.loggedIn, productController.getReviewProduct);
user_route.post('/review-product/:prodId', productController.postReviewProduct);
user_route.get('/edit-review-product', isUser.loggedIn, productController.getEditReview);
user_route.post('/edit-review-product/:prodId', productController.postEditReview);
user_route.get('/more-reviews', productController.getMoreReviews);

user_route.get('/contact', userController.getContact);
user_route.post('/contact', userController.postContact);
user_route.get('/about-us', userController.getAboutUs);
user_route.post('/subscribe-newsletter',userController.postSubscribeNewsletter);


module.exports = user_route;