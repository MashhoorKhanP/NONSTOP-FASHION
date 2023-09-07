
const express = require('express');
const admin_route = express();
const upload = require('../config/multer');
const bannerUpload = require('../config/multerBanner');
const session = require('express-session');
const { randomUUID } = require('crypto');

const { cache } = require('ejs');
const nocache = require('nocache');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const couponController = require('../controllers/couponController');
const bannerController = require('../controllers/bannerController');
const orderController = require('../controllers/orderController');
const offerController = require('../controllers/offerController');

const { loggedIn, loggedOut } = require('../middleware/adminAuth');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.use(nocache())

admin_route.use(
    session({

        secret: randomUUID(),
        resave: false,
        saveUninitialized: true
    })
);

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

/** Login */
admin_route.get('/', loggedOut,adminController.getLogin);
admin_route.post('/login', adminController.postLogin);

admin_route.get('/dashboard', loggedIn, adminController.getDashboard);

admin_route.get('/otplogin',loggedOut, adminController.getOTPLogin);
admin_route.post('/sendotp', adminController.postSendOTP);

admin_route.post('/otplogin',adminController.postOTPLogin);
admin_route.post('/logout', adminController.postLogout);

admin_route.get('/resend-otp-admin', adminController.getResendOTP);

admin_route.get('/users', loggedIn, adminController.getDashboardUsers);

/** User Block/Unblock Start */
// admin_route.post('/api/block-user/:userId',adminController.postBlockUnblockUser) 
admin_route.get('/users/status/:id', loggedIn, adminController.postUsersStatus);
/** User Block/Unblock End */

admin_route.get('/products', loggedIn, productController.getProducts);
admin_route.get('/products/addproduct', loggedIn, productController.getAddProduct);
admin_route.post('/products/addproduct', upload.array('image', 3), productController.postAddProduct);

admin_route.get('/products/editproduct/:id', loggedIn, productController.getEditProduct);
admin_route.post('/products/editproduct/', upload.array('image', 3), productController.postEditProduct);
admin_route.get('/products/editproduct/deleteimage/:id',loggedIn, productController.getDeleteImage);

admin_route.get('/products/removeproduct/:id', loggedIn, productController.getRemoveProduct);

admin_route.get('/categories', loggedIn, categoryController.getCategories);
admin_route.post('/categories', loggedIn, upload.single('image'), categoryController.postAddCategory);

admin_route.post('/categories/editcategory', loggedIn, upload.single('image'), categoryController.postEditCategory);
admin_route.get('/categories/status/:id', loggedIn, categoryController.getCategoryStatus);

admin_route.get('/coupons', loggedIn, couponController.getCoupons);
admin_route.get('/coupons/addcoupon', loggedIn, couponController.getAddCoupon);
admin_route.post('/coupons/addcoupon', couponController.postAddCoupon);

admin_route.get('/coupons/editcoupon/:id', loggedIn, couponController.getEditCoupon);
admin_route.post('/coupons/editcoupon/:id', couponController.postEditCoupon);
admin_route.get('/coupons/cancelcoupon/:id', loggedIn, couponController.getCancelCoupon);

admin_route.get('/offers', loggedIn, offerController.getOffers);
admin_route.get('/offers/add-offer', loggedIn, offerController.getAddOffer);
admin_route.post('/offers/add-offer', loggedIn, offerController.postAddOffer);
admin_route.get('/offers/edit-offer', loggedIn, offerController.getEditOffer);
admin_route.post('/offers/edit-offer/:id', loggedIn, offerController.postEditOffer);
admin_route.get('/offers/change-offer-status/:id', loggedIn, offerController.getOfferStatus);

admin_route.post('/apply-product-offer', loggedIn, productController.postApplyProductOffer);
admin_route.post('/remove-product-offer/:id', loggedIn, productController.postRemoveOffer);

admin_route.post('/apply-category-offer', loggedIn, categoryController.postApplyCategoryOffer);
admin_route.post('/remove-category-offer/:id', loggedIn, categoryController.postRemoveCategoryOffer);

admin_route.get('/banners', loggedIn, bannerController.getBanners);
admin_route.post('/updatebanner', bannerUpload.single('image'), bannerController.postUpdateBanner);

admin_route.get('/orders', loggedIn, orderController.getOrders);
admin_route.get('/orders/singleorder-details', loggedIn, orderController.getSingleOrderDetails);
admin_route.post('/order-status', loggedIn, orderController.postOrderStatus);
admin_route.post('/cancel-order/:id', orderController.postCancelOrder);

admin_route.post('/approve-return/:id', loggedIn, orderController.postApproveReturn);

module.exports = admin_route;
