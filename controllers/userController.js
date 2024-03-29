const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Banner = require('../models/bannerModel');
const Categories = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { response } = require('../routers/adminRoute');
require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const referralCode = require('../utils/referral');

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
})

const getOTP = () => Math.floor(Math.random() * 900000) + 100000;
/** Secure Password Start */
const securePassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
    } catch (error) {

    }
};
/** Secure Password End */
/** Get SignUp Start */
const getSignup = async (req, res, next) => {
    try {
        var emailExistMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        req.session.referral = '';
        if (req.query.referral) {
            req.session.referral = req.query.referral;
        }
        res.render('signUp', { title: "Sign Up", referral: req.session.referral, emailExistMessage });
    } catch (error) {
        next(error.message);
    }
};
/** Get SignUp End */
/** Post SignUp Start */
const postSignup = async (req, res, next) => {
    try {
        const { fname, lname, email, mobno, password, confirmPassword } = req.body;
        if (password === confirmPassword) {
            const userData = await User.findOne({ email })
            if (userData) {
                req.app.locals.specialContext = 'Email already exists'
                return res.redirect('/signup');
            }
            const OTP = req.session.OTP = getOTP(); /** For assigning to two variables */
            req.session.fname = fname;
            req.session.lname = lname;
            req.session.email = email;
            req.session.mobile = mobno;
            req.session.password = password;
            //req.session.referral = referral;
            sendVerifyMail(fname, lname, email, OTP);
            res.render('otpVerification', { title: 'Verification Page', fname, lname, email, mobno, password, emailMessage: 'Please check your email' });
        } else {
            req.app.locals.specialContext = "Sign Up Failed"
            return res.redirect('/signup')
        }
    } catch (error) {
        next(error);
    }
}
/** Post SignUp End */
/** For sending Mail */
const sendVerifyMail = async (fname, lname, email, OTP, next) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'mashhoorkhan325pc@gmail.com',
                pass: process.env.PASSWORD
            }
        });
        const mailOptions = {
            from: 'mashhoorkhan325pc@gmail.com',
            to: email,
            subject: 'Verify your account',
            html: `<h1>Hello, ${fname} ${lname}</h1><h5>Your OTP for verification is,</h5><p>OTP: ${OTP}</p>`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                next(error);
            } else {

            }
        })
    } catch (error) {
        next(error);
    }
}
/** For sending Mail End */
/** Post Verify OTP Start */
const postVerifyOtp = async (req, res, next) => {
    try {
        const enteredOtp = Number(req.body.otp);
        const sharedOtp = Number(req.session.OTP);
        const { fname, lname, email, mobile, password, referral } = req.session;
        if (enteredOtp === sharedOtp) {
            const secPassword = await securePassword(password);
            const newReferralCode = await referralCode();
            let newUserData;
            if (referral) {
                const isReferrerExist = await User.findOne({ referralCode: referral });
                let joiningBonus = 150;
                if (isReferrerExist) {
                    let refereredUserId = isReferrerExist._id;
                    const walletHistory = {
                        transactionDate: new Date(),
                        transactionDetails: 'Joining Bonus',
                        transactionType: 'Credit',
                        transactionAmount: joiningBonus,
                        currentBalance: joiningBonus
                    }
                    newUserData = await new User({
                        firstName: fname, lastName: lname, email: email, mobile: mobile, password: secPassword,
                        referralCode: newReferralCode, referredBy: referral, isReferred: true, wallet: 150, walletHistory
                    }).save();
                    updateWallet(refereredUserId, 200, 'Refferal Reward')
                }
            } else {
                newUserData = await new User({
                    firstName: fname, lastName: lname, email: email, mobile: mobile, password: secPassword,
                    referralCode: newReferralCode, isReferred: false
                }).save();
            }
            req.session.userId = newUserData._id;
            req.app.locals.specialContext = 'Registration Successfull, Please Login.';
            return res.redirect('/login');
        } else {

            res.render('otpVerification', { firstName: fname, lastName: lname, email: email, mobile: mobile, password: password, message: 'Invalid OTP' });
        }
    } catch (error) {
        next(error);
    }
}
/** Post Verify OTP End */
/** Update Wallet Method */
const updateWallet = async (userId, amount, details) => {
    const userData = await User.findOne({ _id: userId });
    let currentWalletBalance = userData.wallet
    const walletHistory = {
        transactionDate: new Date(),
        transactionDetails: details,
        transactionType: 'Credit',
        transactionAmount: amount,
        currentBalance: currentWalletBalance + amount
    }
    await User.findByIdAndUpdate(
        { _id: userId },
        {
            $inc: {
                wallet: amount
            },
            $push: {
                walletHistory
            }
        }
    )
}
/** Get Resend OTP Start */
const getResendOTP = async (req, res, next) => {
    try {
        const email = req.query.id
        const resendedOTP = getOTP()
        req.session.OTP = resendedOTP
        sendVerifyMail(req.session.fname, req.session.lname, email, resendedOTP);
        res.render('otpVerification', { title: 'Verification Page', fname: req.session.fname, lname: req.session.lname, email: req.session.email, mobno: req.session.mobile, password: req.session.password, message: 'OTP resended successfully,Please check your email' });
    } catch (error) {
        next(error);
    }
}
/** Get Resend OTP End */
/** Get Login Start */
const getLogin = async (req, res, next) => {
    try {
        var loginErrorMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        if (req.session.user) {
            res.redirect('/');
        } else {
            res.render('login', { title: "Login", loginErrorMessage });
        }
    } catch (error) {
        next(error);
    }
}
/** Get Login End */
/** Post Login Start */
const postLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const secPassword = await securePassword(password);
        const prodsData = await Products.find({ isListed: true });
        const userData = await User.findOne({ email: email });
        if (userData) {
            let cartList = [];
            let cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
            if (cartData) {
                cartList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice }) => ({
                    productId,
                    size,
                    quantity,
                    cartPrice,
                    cartDPrice
                }));
            }
            const banner = await Banner.find({}).sort({ name: 1 });
            let wishlist = userData.wishlist;
            if (userData.blocked === false) {
                const passwordMatch = await bcrypt.compare(password, userData.password);
                let cartData;
                if (passwordMatch) {
                    req.session.cartCount = 0
                    cartData = await Cart.findOne({ user: userData._id })
                    if (cartData && cartData.products) {
                        req.session.cartCount = cartData.products.length
                    }
                    let cartCount;
                    req.session.user = userData;
                    res.render('home', { user: userData, prodsData, title: 'Home', banner, wishlist, cartData: cartList, cartCount: req.session.cartCount });
                } else {
                    req.app.locals.specialContext = 'Password not matching'
                    return res.redirect('/login');
                }
            } else {
                req.app.locals.specialContext = 'Your account is blocked temporarily'
                return res.redirect('/login');
            }
        } else {
            req.app.locals.specialContext = 'Invalid Email, Please re-check your email'
            return res.redirect('/login');
        }
    } catch (error) {
        next(error);
    }
}
/** Post Login End */
/** Forgot Password */
const getLoginForgotPassword = async (req, res, next) => {
    try {
        var passwordErrorMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        res.render('loginForgotPassword', { title: 'Forgot Password', passwordErrorMessage });
    } catch (error) {
        next(error);
    }
}
const postLoginResetPassword = async (req, res, next) => {
    try {
        const { newpassword, confirmpassword, email } = req.body;
        const userData = await User.findOne({ email: email });
        if (userData) {
            req.session.user = userData;
            req.session.newPassword = newpassword;
            req.session.confirmPassword = confirmpassword;
            var otpErrorMessage = req.app.locals.specialContext;
            req.app.locals.specialContext = null;
            res.render('resetOtpVerification', { title: 'Reset Password OTP Verification', email, otpErrorMessage })
            const OTP = getOTP();
            req.session.otp = OTP;
            req.session.save();
            sendVerifyMail(userData.firstName, userData.lastName, userData.email, OTP);
        } else {
            req.app.locals.specialContext = 'Email not found';
            return res.redirect('/forgotpassword');
        }
    } catch (error) {
        next(error);
    }
}
const postResetPasswordVerifyOTP = async (req, res, next) => {
    try {
        const otp = Number(req.body.otp);
        const userData = req.session.user;
        const OTP = Number(req.session.otp);
        const newpassword = req.session.newPassword;
        const confirmpassword = req.session.confirmPassword;
        if (OTP === otp) {
            if (newpassword !== confirmpassword) {
                req.app.locals.specialContext = 'Both passwords are not matching'
                return res.redirect(`/forgotpassword`);
            } else {
                const secPassword = await securePassword(newpassword)
                await User.findByIdAndUpdate(
                    { _id: userData._id },
                    {
                        $set: {
                            password: secPassword
                        }
                    }
                );
                req.app.locals.specialContext = 'Password changed successfully';
                req.session.destroy();
                return res.redirect('/login');
            }
        } else {
            req.app.locals.specialContext = 'Invalid OTP entered';
            req.session.destroy();
            return res.redirect('/login');
        }
    } catch (error) {
        next(error);
    }
}
/** Post Logout Start */
const postLogout = async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                next(err);
            } else {
                res.redirect('/');
            }
        })
    } catch (error) {
        next(error);
    }
}
/** Post Logout End*/
/** Get Profile Start */
const getProfile = async (req, res, next) => {
    try {
        // const userData = await User.findOne({ email: req.session.user });
        const user = req.session.user
        const userData = await User.findOne({ email: user.email })
        const userAddress = await Address.findOne({ userId: user._id });
        if (userData) {
            req.session.cartCount = 0
            let cartData = await Cart.findOne({ user: user._id })
            if (cartData && cartData.products) {
                req.session.cartCount = cartData.products.length
            }
            res.render('userProfile', { user: userData, userAddress, title: 'User Profile', cartCount: req.session.cartCount });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        next(error);
    }
}
/** Get Profile End */
/** Get Edit Profile Start */
const getEditProfile = async (req, res, next) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id });
        const userAddress = await Address.findOne({ userId: userData._id });
        if (userData) {
            req.session.cartCount = 0
            let cartData = await Cart.findOne({ user: userData._id })
            if (cartData && cartData.products) {
                req.session.cartCount = cartData.products.length
            }
            res.render('editProfile', { user: userData, userAddress, title: "Edit Profile", cartCount: req.session.cartCount });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        next(error);
    }
}
/** Get Edit Profile End */
/** Post Edit Profile Start */
const postEditProfile = async (req, res, next) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.query.id },
            { $set: { firstName: req.body.fname, lastName: req.body.lname, email: req.body.email, mobile: req.body.mobno } });
        //req.session.destroy();
        res.redirect('/profile');
    } catch (error) {
        next(error);
    }
}
/** Post Edit Profile End */
/** Get ChangePassword Start */
const getManagePassword = async (req, res, next) => {
    try {
        var changePasswordMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        const userData = await User.findOne({ email: req.session.user.email });
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('managePassword', { title: 'Change Password', user: userData, cartCount: req.session.cartCount, changePasswordMessage })
    } catch (error) {
        next(error);
    }
}
/** Get ChangePassword End*/
/** Post ChangePassword Start */
const postManagePassword = async (req, res, next) => {
    try {
        const userData = await User.findOne({ email: req.session.user.email });
        const { oldpassword, newpassword, confirmpassword } = req.body;
        const userId = userData._id;
        if (newpassword !== confirmpassword) {
            return res.redirect(`/profile/${userId}/managepassword`)
        }
        const passwordMatch = await bcrypt.compare(oldpassword, userData.password);
        if (passwordMatch) {
            const secPassword = await securePassword(newpassword)
            await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        password: secPassword
                    }
                }
            );
            return res.redirect(`/profile/${userId}`);
        } else {
            req.app.locals.specialContext = 'Old password not match';
            return res.redirect(`/profile/${userId}/managepassword`);
        }
    } catch (error) {
        next(error);
    }
}
/** Post ChangePassword End */
/** Get Forgot Password Start */
const getForgotPassword = async (req, res, next) => {
    try {
        var otpErrorMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        const user = req.session.user;
        const userData = await User.findOne({ email: user.email });
        const OTP = req.session.OTP = getOTP();
        sendVerifyMail(userData.firstName, userData.lastName, userData.email, OTP);
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: user._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('forgotPasswordVerification', { title: 'Forgot Password', user: userData, email: userData.email, message: 'An OTP has been sent to your email,please verify your OTP', cartCount: req.session.cartCount, otpErrorMessage });
    } catch (error) {
        next(error);
    }
}
/** Get Forgot Password End */
/** Post Forgot Password Start */
const postForgotPassword = async (req, res, next) => {
    try {
        const userOTP = req.body.otp;
        const sharedOTP = req.session.OTP;
        const userData = await User.findOne({ email: req.session.user.email });
        const userId = userData._id;
        if (userOTP == sharedOTP) {
            res.render('resetPassword', { title: 'Reset Password', user: userData, cartCount: req.session.cartCount });
        } else {

            req.app.locals.specialContext = "Entered OTP is wrong, A new OTP has been sent to your email"
            res.redirect(`/profile/${userId}/forgotpassword`);
        }
    } catch (error) {
        next(error);
    }
}
/** Post Forgot Password End */
/** Get Reset Password Start */
const getResetPassword = async (req, res, next) => {
    try {
        const userData = await User.findOne({ email: req.session.user.email });
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('resetPassword', { title: 'Reset Password', user: userData, cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/** Get Reset Password End */
/** Post Reset Password Start */
const postResetPassword = async (req, res, next) => {
    try {
        const userData = await User.findOne({ email: req.session.user.email });
        const userId = userData._id;
        const { newpassword, confirmpassword } = req.body;
        if (newpassword !== confirmpassword) {
            return res.redirect(`/profile/${userId}/resetpassword`);
        } else {
            const secPassword = await securePassword(newpassword)
            await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        password: secPassword
                    }
                }
            );
            return res.redirect(`/profile/${userId}`);
        }
    } catch (error) {
        next(error);
    }
}
/** Post Reset Password End */
/** Get Shop Start */
const getShop = async (req, res, next) => {
    try {
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        let limit = 16
        let sortValue = -1
        if (req.query.sortValue) {
            if (req.query.sortValue == 2) {
                sortValue = 1
            } else if (req.query.sortValue == 3) {
                sortValue = -1
            } else {
                sortValue = -1
            }
        }
        /** Price */
        let minPrice = 1;
        let maxPrice = 20000;
        if (req.query.minPrice) {
            minPrice = req.query.minPrice;
        }
        if (req.query.maxPrice) {
            maxPrice = req.query.maxPrice;
        }
        /** Search Step 1 */
        let search = ''
        if (req.query.search) {
            search = req.query.search;
        }
        /** Search Step 2 for finding category data in order for searching */
        async function getCategoryIds(search) {
            const categories = await Categories.find({ name: { $regex: '.*' + search + '.*', $options: 'i' } });
            return categories.map(category => category._id);
        }
        /** Search Step 3 for sort and all others */
        const query = {
            isListed: true,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + search + '.*', $options: 'i' } }
            ],
            discountPrice: { $gte: minPrice, $lte: maxPrice }
        }
        /** Search Step 3 */
        if (req.query.search) {
            search = req.query.search
            query.$or.push({
                'Categories': { $in: await getCategoryIds(search) }
            });
        }
        /** Category */
        if (req.query.category) {
            query.category = req.query.category
        }
        /**brand */
        if (req.query.brand) {
            query.brand = req.query.brand
        }
        /**.sort({_id:-1 for latest sorting is _id better to change by createdAt:-1}) */
        let prodsData = await Products.find(query).populate('category').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
        if (req.query.sortValue && req.query.sortValue != 3) {
            prodsData = await Products.find(query).populate('category').sort({ price: sortValue }).limit(limit * 1).skip((page - 1) * limit)
        } else {
            /**.sort({_id:-1 for latest sorting is _id better to change by createdAt:-1}) */
            prodsData = await Products.find(query).populate('category').sort({ createdAt: sortValue }).limit(limit * 1).skip((page - 1) * limit)
        }
        const categoryNames = await Categories.find({});
        const brands = await Products.aggregate([{ $group: { _id: '$brand' } }])
        let totalProductsCount = await Products.find(query).count()
        let pageCount = Math.ceil(totalProductsCount / limit)
        let removeFilter = 'false'
        if (req.query) {
            if (req.query.page) {
                removeFilter = 'false'
            } else {
                removeFilter = 'true'
            }
        }
        //let wishlistExist = await productExist(email);    
        let userData
        if (req.session.user) {
            userData = await User.findOne({ email: req.session.user.email });
        }
        if (userData) {
            let id = req.query.id;
            let wishlist = userData.wishlist;
            let cartList = [];
            let cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
            if (cartData) {
                cartList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice }) => ({
                    productId,
                    size,
                    quantity,
                    cartPrice,
                    cartDPrice
                }));
            }
            req.session.cartCount = 0
            if (cartData && cartData.products) {
                req.session.cartCount = cartData.products.length
            }
            res.render('shop', {
                prodsData, user: userData, categoryNames, wishlist, brands, pageCount,
                currentPage: page, sortValue: req.query.sortValue, minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice, category: req.query.category, brand: req.query.brand, cartData: cartList,
                removeFilter, search: req.query.search, title: 'Shop', cartCount: req.session.cartCount
            })
        } else {
            res.render('shop', {
                prodsData, categoryNames, brands, pageCount,
                currentPage: page, sortValue: req.query.sortValue, minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice, category: req.query.category, brand: req.query.brand,
                removeFilter, search: req.query.search, title: 'Shop', cartCount: 0
            })
        }
    } catch (error) {
        next(error);
    }
}
/** Get Shop End */
/** Get Wishlist Start */
const getWishlist = async (req, res, next) => {
    try {
        const email = req.session.user.email
        const userData = await User.findOne({ email: email }).populate('wishlist')
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('wishlist', { wishlist: userData.wishlist, user: userData, title: 'Wishlist', cartCount: req.session.cartCount });
    } catch (error) {
        next(error);
    }
}
/** Get Wishlist End */
/** Post Wishlist Start */
const postWishlist = async (req, res, next) => {
    try {
        const email = req.session.user.email
        const productId = req.params.id;
        const userData = await User.findOne({ email: email });
        const prodExist = userData.wishlist.find((data) => data == productId)
        if (prodExist) {
            await User.findOneAndUpdate({ email: email }, { $pull: { wishlist: productId } });
        } else {
            await User.findOneAndUpdate({ email: email }, { $push: { wishlist: productId } });
        }
        const referringUrl = req.headers.referer;
        return res.redirect(referringUrl);
    } catch (error) {
        next(error);
    }
}
/** Post Wishlist End */
/** Wallet */
const postAddMoneyToWallet = async (req, res, next) => {
    try {
        const { amount } = req.body
        const id = crypto.randomBytes(8).toString('hex')

        var options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: "hello" + id
        }

        instance.orders.create(options, (err, order) => {
            if (err) {
                res.json({ status: false })
            } else {
                res.json({ status: true, payment: order })
            }

        })
    } catch (error) {
        next(error)
    }
}

const postVerifyWalletPayment = async (req, res, next) => {
    try {

        const user = req.session.user
        const userId = user._id;
        const details = req.body;
        const amount = parseInt(details.order.amount) / 100
        let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET)

        hmac.update(
            // details['payment[razorpay_order_id]']+ '|' +details['payment[razorpay_payment_id]']
            details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id
        )
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {

            const walletHistory = {
                transactionDate: new Date(),
                transactionDetails: 'Deposited via Razorpay',
                transactionType: 'Credit',
                transactionAmount: amount,
                currentBalance: user.wallet + amount
            }
            await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $inc: {
                        wallet: amount
                    },
                    $push: {
                        walletHistory
                    }
                }
            );
            res.json({ status: true })
        } else {
            res.json({ status: false })
        }
    } catch (error) {
        next(error)
    }
}

/** Get Wallet History Start */
const getWalletHistory = async (req, res, next) => {
    try {
        const user = req.session.user.email;
        const userData = await User.findOne({ email: user });
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('walletHistory', { title: 'Wallet History', user: userData, cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
/** Get Wallet History End */
/** Contact  */
const getContact = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.render('contact', { title: 'Contact Us', user: req.session.user, cartCount: req.session.cartCount });
        } else {
            res.render('contact', { title: 'Contact Us' });
        }
    } catch (error) {
        next(error);
    }
}
const postContact = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'mashhoorkhan325pc@gmail.com',
                pass: process.env.PASSWORD
            }
        });
        const mailDetails = {
            from: 'mashhoorkhan325pc@gmail.com',
            to: process.env.EMAIL,
            subject: subject,
            html: `<h1>From, ${name}</h1>\n<h5>Name: ${name}<br>Email: ${email}<h5>\nMessage:<br> ${message}`
        }
        transporter.sendMail(mailDetails, function (error, info) {
            if (error) {
                next(error);
                res.json({ status: false })
            } else {

                res.json({ status: true })
            }
        })
    } catch (error) {
        next(error);
    }
}
/**About Us */
const getAboutUs = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.render('aboutUs', { title: 'About Us', user: req.session.user, cartCount: req.session.cartCount });
        } else {
            res.render('aboutUs', { title: 'About Us' });
        }
    } catch (error) {
        next(error);
    }
}
/** Subscribe Newsletter */
const postSubscribeNewsletter = async (req, res, next) => {
    try {
        let email = req.body.sbemail;
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'mashhoorkhan325pc@gmail.com',
                pass: process.env.PASSWORD
            }
        });
        const mailDetails = {
            from: 'mashhoorkhan325pc@gmail.com',
            to: process.env.EMAIL,
            subject: 'For Subscription Request',
            html: `<h1>From, ${email}</h1>\n<h5>Email: ${email}<h5>\nMessage:<br>Subsciption Request`
        }
        transporter.sendMail(mailDetails, function (error, info) {
            if (error) {
                next(error);
                res.json({ status: false })
            } else {
                const referringUrl = req.headers.referer;
                return res.redirect(referringUrl);
            }
        });
    } catch (error) {
        next(error);
    }
}
module.exports = {
    getSignup,
    postSignup,
    postVerifyOtp,
    getResendOTP,
    getLogin,
    postLogin,
    getLoginForgotPassword,
    postLoginResetPassword,
    postResetPasswordVerifyOTP,
    postLogout,
    getProfile,
    getEditProfile,
    postEditProfile,
    getManagePassword,
    postManagePassword,
    getForgotPassword,
    postForgotPassword,
    getResetPassword,
    postResetPassword,
    getShop,
    getWishlist,
    postWishlist,
    postAddMoneyToWallet,
    postVerifyWalletPayment,
    getWalletHistory,
    getContact,
    postContact,
    getAboutUs,
    postSubscribeNewsletter
}