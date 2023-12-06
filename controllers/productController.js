const Admin = require('../models/adminModel');
const Products = require('../models/productModel');
const Banner = require('../models/bannerModel');
const User = require('../models/userModel');
const Categories = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Offer = require('../models/offerModel');
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const upload = require('../config/multer');
/** Get Products Start */
const getProducts = async (req, res, next) => {
    try {
        var editProductMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const admin = req.session.admin
        const currentDate = new Date();
        const offerData = await Offer.find({ $and: [{ status: true }, { expiryDate: { $gt: currentDate } }] })
        const prodsData = await Products.find().populate('category').sort({ createdAt: -1 }).skip((pageNum - 1) * limit).limit(limit);
        const totalProductsCount = await Products.find({}).count()
        let pageCount = Math.ceil(totalProductsCount / limit);
        const adminData = await Admin.findOne({ email: admin.email });
        res.render('products', { admin: adminData, pageCount, pageNum, limit, prodsData, offerData, title: 'Products', page: 'Products', editProductMessage});
    } catch (error) {
        next(error);
    }
}
/** Get Products End */
/** Get Add Products Start */
const getAddProduct = async (req, res, next) => {
    try {
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        const categories = await Categories.find({});
        res.render('addProducts', { admin: adminData, title: 'Products', categories, page: 'Products'});
    } catch (error) {
        next(error);
    }
}
/** Get Add Products End */
/** Post Add Products Start */
const postAddProduct = async (req, res, next) => {
    try {
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        const {
            productname, category, check1, check2, check3, check4, check5, check6,
            quantity, price, dprice, description
        } = req.body
        const brand = req.body.brand.toUpperCase();
        let images = req.files ? req.files.map((file) => file.filename) : [];
        let size = [];
        if (check1) size.push(check1);
        if (check2) size.push(check2);
        if (check3) size.push(check3);
        if (check4) size.push(check4);
        if (check5) size.push(check5);
        if (check6) size.push(check6);
        const categoryData = await Categories.find({ name: category });
        const productData = await new Products({
            brand, name: productname, description, category: categoryData[0]._id, size, price, discountPrice: dprice, quantity, images, createdAt: new Date()
        }).save();
        req.app.locals.specialContext = 'Product added successfully'
        return res.redirect('/admin/products');
    } catch (error) {
        next(error);
    }
}
/** Post Add Products End*/
/** Get Edit Products Start */
const getEditProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const prodsData = await Products.findById({ _id: id }).populate('category');
        const catData = await Categories.find({});
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        res.render('editProducts', { admin: adminData, title: 'Edit Products', prodsData, catData, page: 'Products'})
    } catch (error) {
        next(error);
    }
}
/** Get Edit Products End */
/** Post Edit Products Start */
const postEditProduct = async (req, res, next) => {
    try {
        const {
            id, productName, category,
            check1, check2, check3, check4, check5, check6,
            quantity, price, dprice, description,
        } = req.body
        //console.log(req.files);
        const brand = req.body.brand.toUpperCase();
        let size = [];
        if (check1) size.push(check1)
        if (check2) size.push(check2)
        if (check3) size.push(check3)
        if (check4) size.push(check4)
        if (check5) size.push(check5)
        if (check6) size.push(check6)
        let newImages = req.files ? req.files.map((file) => file.filename) : [];
        //console.log(`id: ${id}`);
        await Products.findOneAndUpdate({ _id: id }, { $push: { images: { $each: newImages } } });
        const catData = await Categories.findOne({ name: category })
        //console.log(catData);
        await Products.findByIdAndUpdate(
            { _id: id },
            {
                $set: {
                    brand, name: productName, category: catData._id, size, quantity,
                    description, price, discountPrice: dprice
                }
            }
        )
        req.app.locals.specialContext = 'Product updated successfully'
        return res.redirect(`/admin/products`);
    } catch (error) {
        next(error);
    }
}
/** Post Edit Products End */
/** Get Remove Product Start */
const getRemoveProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const prodsData = await Products.findById({ _id: id });
        if (prodsData.isListed) {
            await Products.findByIdAndUpdate({ _id: id }, { $set: { isListed: false } });
        } else {
            await Products.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } });
        }
        res.redirect('/admin/products');
    } catch (error) {
        next(error);
    }
}
/** Get Remove Product End*/
/** Get Delete Image Start */
const getDeleteImage = async (req, res, next) => {
    try {
        const id = req.params.id;
        const imageURL = req.query.imageURL;
        await Products.findOneAndUpdate({ _id: id }, { $pull: { images: imageURL } });
        const imageFolder = path.join(__dirname, '../public/assets/product-images');
        const files = fs.readdirSync(imageFolder);
        for (const file of files) {
            if (file === imageURL) {
                const filePath = path.join(imageFolder, file);
                fs.unlinkSync(filePath);
                break;
            }
        }
        res.redirect(`/admin/products/editproduct/${id}`);
    } catch (error) {
        next(error);
    }
}
/** Get Delete Image End */
/** Get Shop Start */
const getHome = async (req, res, next) => {
    try {
        /** Search Step 2 for finding category data in order for searching */
        async function getCategoryIds(search) {
            const categories = await Categories.find({ name: { $regex: '.*' + search + '.*', $options: 'i' } });
            return categories.map(category => category._id);
        }
        let userData;
        const banner = await Banner.find({}).sort({name:1});
        const id = req.query.id;
        let wishlistExist;
        const prodsData = await Products.find({ isListed: true });
        if (req.session.user) {
            const user = req.session.user.email
            userData = await User.findOne({ email: user })
            wishlistExist = 0;
            const userWishlistData = await User.findOne({ email: req.session.user.email });
            //console.log(userWishlistData);
            if (userWishlistData && userWishlistData.wishlist) {
                const prodExist = userWishlistData.wishlist.find((data) => data == id);
                if (prodExist) {
                    wishlistExist = 1;
                }
            }
        }
        const prod = await Products.findOne({ _id: id });
        if (req.session.user) {
            let wishlist = userData.wishlist
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
            return res.render('home', { user: userData, prodsData, title: 'Home', banner, wishlist, cartData: cartList, cartCount: req.session.cartCount })
        }
        res.render('home', { user: userData, prodsData, title: 'Home', banner, wishlistExist });
    } catch (error) {
        next(error);
    }
};
/** Get Shop End */
/** Get Product Details Start */
const getProductDetails = async (req, res, next) => {
    try {
        const id = req.params.id;
        let userReviewed;
        let cartList = [];
        let cartData;
        let reviewData;
        let user = req.session.user;
        const isLoggedIn = Boolean(req.session.user);
        let userData;
        if (req.session.user) {
            userData = await User.findOne({ email: user.email });
            cartList = [];
            cartData = await Cart.findOne({ user: user._id }).populate('products.productId');
            userReviewed = 0
            reviewData = await Products.findOne({ _id: id, 'reviews.userId': user._id })
            //console.log(reviewData)
            if (reviewData) userReviewed = 1
            if (cartData) {
                cartList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice }) => ({
                    productId,
                    size,
                    quantity,
                    cartPrice,
                    cartDPrice
                }));
            }
            prodsData = await Products.findById({ _id: id }).populate('reviews.userId');
            //console.log(prodsData, "ProdsData");
            req.session.cartCount = 0
            cartData = await Cart.findOne({ user: user._id })
            if (cartData && cartData.products) {
                req.session.cartCount = cartData.products.length
            }
            let wishlist = userData.wishlist;
            //console.log(wishlist);
            return res.render('productdetails', { title: 'Product Detais', user: userData, wishlist, userReviewed, prodsData, isLoggedIn, cartData: cartList, cartCount: req.session.cartCount });
        }
        prodsData = await Products.findById({ _id: id });
        res.render('productdetails', { title: 'Product Detais', user: userData, userReviewed, prodsData, isLoggedIn })
    } catch (error) {
        next(error);
    }
}
/** Get Product Details End */
/** Review Side Start */
const getReviewProduct = async (req, res, next) => {
    try {
        const prodId = req.query.prodId;
        //console.log(prodId);
        const user = req.session.user;
        const userData = await User.findOne({ email: user.email });
        let productPurchased = 0
        const orderData = await Order.findOne({ user: user._id, 'products.productId': prodId })
        if (orderData) productPurchased = 1
        res.render('review', { prodId, productPurchased, user: req.session.user, wishlist: user.wishlist, cartCount: req.session.cartCount, orderData, title: 'Review Product' })
    } catch (error) {
        next(error);
    }
}
const postReviewProduct = async (req, res, next) => {
    try {
        const prodId = req.params.prodId
        const user = req.session.user
        const userId = user._id;
        const { rating, title, description } = req.body
        await Products.updateOne({ _id: prodId }, {
            $push: {
                reviews: {
                    userId, title, description, rating, createdAt: new Date()
                }
            }
        })
        const product = await Products.findOne({ _id: prodId })
        const reviews = product.reviews
        const totalRating = reviews.reduce((sum, reviews) => sum += reviews.rating, 0)
        const averageRating = totalRating / reviews.length
        await Products.updateOne({ _id: prodId }, { $set: { totalRating: averageRating } })
        res.redirect(`/productdetails/${prodId}`)
    } catch (error) {
        next(error);
    }
}
const getEditReview = async (req, res, next) => {
    try {
        const prodId = req.query.prodId;
        const user = req.session.user;
        const userId = req.session.user._id;
        const prodsData = await Products.findOne({ _id: prodId, reviews: { $elemMatch: { userId } } }).populate('reviews.userId');
        const reviewData = await prodsData.reviews.find((data) => data.userId._id == userId);
        res.render('editReview', { reviewData, prodId, title: 'Edit Review', user: req.session.user, wishlist: user.wishlist, cartCount: req.session.cartCount })
    } catch (error) {
        next(error);
    }
}
const postEditReview = async (req, res, next) => {
    try {
        const prodId = req.params.prodId;
        const reviewId = req.query.reviewId;
        const { rating, title, description } = req.body;
        await Products.updateOne({ _id: prodId, 'reviews._id': reviewId }, {
            $set: {
                'reviews.$.rating': rating,
                'reviews.$.title': title,
                'review.$.description': description
            }
        })
        const prodsData = await Products.findOne({ _id: prodId })
        const reviews = prodsData.reviews
        const totalRating = reviews.reduce((sum, reviews) => sum += reviews.rating, 0)
        let averageRating = totalRating / reviews.length
        averageRating = Math.round(averageRating * 10) / 10
        await Products.updateOne({ _id: prodId }, { $set: { totalRating: averageRating } })
        res.redirect(`/productdetails/${prodId}`);
    } catch (error) {
        next(error);
    }
}
const getMoreReviews = async (req, res, next) => {
    try {
        const user = req.session.user;
        const prodId = req.query.prodId;
        const prodsData = await Products.findOne({ _id: prodId })
        if(req.session.user){
            res.render('moreReviews', { prod: prodsData, wishlist: user.wishlist, cartCount: req.session.cartCount, user: user, title: 'All Reviews' });
        }
        res.render('moreReviews', { prod: prodsData, title: 'All Reviews' });
    } catch (error) {
        next(error);
    }
}
/** Review Side End */
/** Offer Apply Side */
const postApplyProductOffer = async (req, res, next) => {
    try {
        const { offerId, productId } = req.body;
        const product = await Products.findOne({ _id: productId })
        const offerData = await Offer.findOne({ _id: offerId })
        const price = product.price + product.discountPrice;
        if (product.offer && product.offerAppliedBy == 'category') {
            const oldOfferPrice = product.offerPrice;
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100))
            await Products.updateOne({ _id: productId }, {
                $set: {
                    offer: offerId,
                    price: offerPrice,
                    offerAppliedBy: 'product'
                }
            })
        } else {
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100))
            const offerDiscountPrice = product.price
            await Products.updateOne({ _id: productId }, {
                $set: {
                    offerPrice: offerDiscountPrice,
                    offer: offerId,
                    price: offerPrice,
                    offerAppliedBy: 'product'//re analyze this section correctly
                }
            })
        }
        const expiry = offerData.expiryDate
        schedule.scheduleJob(expiry, async () => {
            const productData = await Products.findOne({ _id: productId, offerAppliedBy: 'product' })
            let newPrice = productData.offerPrice
            await Products.updateOne({ _id: productId, offerAppliedBy: 'product' }, {
                $set: {
                    price: newPrice
                }
            })
            await Products.updateOne({ _id: productId, offerAppliedBy: 'product' }, {
                $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
            })
        })
        res.redirect('/admin/products');
    } catch (error) {
        next(error);
    }
}
const postRemoveOffer = async (req, res, next) => {
    try {
        const prodId = req.params.id;
        const productData = await Products.findOne({ _id: prodId, offerAppliedBy: 'product' })
        let newPrice = productData.offerPrice
        await Products.updateOne({ _id: prodId, offerAppliedBy: 'product' }, {
            $set: {
                price: newPrice
            }
        })
        await Products.updateOne({ _id: prodId, offerAppliedBy: 'product' }, {
            $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
        })
        res.redirect('/admin/products')
    } catch (error) {
        next(error);
    }
}
module.exports = {
    getProducts,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    getRemoveProduct,
    getDeleteImage,
    getHome,
    getProductDetails,
    getReviewProduct,
    postReviewProduct,
    getEditReview,
    postEditReview,
    getMoreReviews,
    postApplyProductOffer,
    postRemoveOffer
}