
const Coupons = require('../models/couponModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const Admin = require('../models/adminModel');

//** Admin */
/** Get Coupons Start */
const getCoupons = async (req, res, next) => {
    try {
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        const totalcouponsCount = await Coupons.find({}).count()
        let pageCount = Math.ceil(totalcouponsCount / limit);
        const coupons = await Coupons.find({});
        res.render('coupons', { title: 'Coupons', admin: adminData, pageCount, pageNum, limit, coupons, page: 'Coupons' });
    } catch (error) {
        next(error);
    }
}
/** Get Coupons End */

/** Get Add Coupon Start */
const getAddCoupon = async (req, res, next) => {
    try {
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        res.render('addCoupon', { title: 'Add Coupon', admin: adminData, page: 'Coupons' });

    } catch (error) {
        next(error);
    }
}
/** Get Add Coupon End */

/** Post Add Coupon Start */
const postAddCoupon = async (req, res, next) => {
    try {
        const couponId = req.params.id;
        const { discount, minpurchase, expirydate, description } = req.body;
        const code = req.body.coupon.toUpperCase();
        console.log('Entered to post coupons')
        console.log(discount, minpurchase, expirydate, description, code)
        const isCodeExist = await Coupons.findOne({ code })
        if (!isCodeExist) {
            await new Coupons({
                code, discount, minPurchase: minpurchase, expiryDate: expirydate, description
            }).save()
        } else {
            req.app.locals.message = 'Code already exists'
            return res.redirect(`/admin/coupons/addcoupon`)
        }
        res.redirect(`/admin/coupons`);
    } catch (error) {
        next(error);
    }
}
/** Post Add Coupon Start */

/** Get Edit Coupon Start */
const getEditCoupon = async (req, res, next) => {
    try {
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        const couponId = req.params.id;
        const couponData = await Coupons.findById({ _id: couponId })
        res.render('editCoupon', { coupons: couponData, page: 'Coupons', title: 'Edit Coupon', admin: adminData });
    } catch (error) {
        next(error);
    }
}
/** Get Edit Coupon End */

/** Post Edit Coupon Start */
const postEditCoupon = async (req, res, next) => {
    try {
        const couponId = req.params.id;
        const { discount, minpurchase, expirydate, description } = req.body;
        const code = req.body.coupon.toUpperCase();
        const isCodeExist = await Coupons.findOne({ code });

        if (isCodeExist && isCodeExist._id != couponId) {
            req.app.locals.message = 'Coupon already exists';
            return res.redirect(`/admin/coupons/editcoupon/${couponId}`);
        } else {
            const couponData = await Coupons.findByIdAndUpdate({ _id: couponId },
                {
                    $set: {
                        code, discount, minPurchase: minpurchase, expiryDate: expirydate, description
                    }
                });
        }
        res.redirect('/admin/coupons');
    } catch (error) {
        next(error);
    }
}
/** Post Edit Coupon End*/

/** Get Remove Coupon Start */
const getCancelCoupon = async (req, res, next) => {
    try {
        const couponId = req.params.id;
        const couponData = await Coupons.findById({ _id: couponId });
        if (couponData.isCancelled) {
            await Coupons.findByIdAndUpdate({ _id: couponId },
                {
                    $set: {
                        isCancelled: false
                    }
                }
            );
            req.app.locals.message = 'Coupon added'
        } else {
            await Coupons.findByIdAndUpdate({ _id: couponId },
                {
                    $set: {
                        isCancelled: true
                    }
                }
            );
            req.app.locals.message = 'Coupon has been Cancelled'
        }
        res.redirect('/admin/coupons');
    } catch (error) {
        next(error);
    }
}
/** Get Remove Coupon End */

/** User */
/** Post Apply Coupon Start*/
const postApplyCoupon = async (req, res, next) => {
    try {
        const user = req.session.user.email;
        const coupon = req.body.coupon.toUpperCase();
        const userData = await User.findOne({ email: user });
        const couponFound = await Coupons.findOne({ code: coupon })
        const cartData = await Cart.findOne({ user: userData._id })

        if (couponFound && couponFound.isCancelled === false) {
            console.log(cartData.totalPrice);
            if (cartData.totalPrice >= couponFound.minPurchase) {
                if (couponFound.expiryDate >= new Date()) {
                    const userExist = couponFound.usedUsers.find((data) => data == userData._id)
                    if (!userExist) {
                        req.session.coupon = couponFound
                        //console.log(req.session.coupon)
                        const totalPrice = req.session.totalPrice
                        const couponDiscountTotal = totalPrice - couponFound.discount
                        let walletActive = false

                        if (userData.wallet >= couponDiscountTotal) {
                            walletActive = true;
                        }
                        res.json({ status: true, message: 'success', couponDiscount: couponFound.discount, couponDiscountTotal, walletActive })
                    } else {
                        res.json({ status: false, message: `Coupon Already Used` })
                    }
                } else {
                    res.json({ status: false, message: `Coupon Expired` })
                }
            } else {
                res.json({ status: false, message: `Minimum purchase price should be ${couponFound.minPurchase}` })
            }
        } else {
            res.json({ status: false, message: "Coupon doesn't exist" })
        }
    } catch (error) {
        next(error)
    }
}
/** Post Apply Coupon End */
/** Remove Coupon Start */
const getRemoveCoupon = async (req, res, next) => {
    try {
        req.session.coupon = null;
        res.json({ status: true })
    } catch (error) {
        next(error);
    }
}
/** Remove Coupon End */

module.exports = {
    getCoupons,
    getAddCoupon,
    postAddCoupon,
    getEditCoupon,
    postEditCoupon,
    getCancelCoupon,
    postApplyCoupon,
    getRemoveCoupon
}