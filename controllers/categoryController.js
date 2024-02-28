const Admin = require('../models/adminModel');
const Categories = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Product = require('../models/productModel');
const schedule = require('node-schedule');
/** Get Category Start */
const getCategories = async (req, res, next) => {
    try {
        var categoryMessage = req.app.locals.specialContext;
        req.app.locals.specialContext = null;
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const categories = await Categories.find({}).sort({ _id: -1 }).skip((pageNum - 1) * limit).limit(limit);;
        req.session.save();
        let totalCategoryCount = await Categories.find({}).count();
        let pageCount = Math.ceil(totalCategoryCount / limit);
        const currentDate = new Date();
        const offerData = await Offer.find({ $and: [{ status: true }, { expiryDate: { $gt: currentDate } }] })
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        res.render('categories', { categories, admin: adminData, offerData, pageCount, pageNum, limit, title: 'Catergories', page: 'Categories', categoryMessage });
    } catch (error) {
        next(error);
    }
}
/** Get Category End */
/** Post Add Category Start */
const postAddCategory = async (req, res, next) => {
    try {
        // 
        const categoryName = req.body.category.toUpperCase();
        const image = req.file.filename;
        // 
        if (categoryName) {
            const isExistCategory = await Categories.findOne({ name: categoryName });
            if (isExistCategory) {

                req.app.locals.specialContext = 'Category already exists';
                return res.redirect('/admin/categories');
            } else {
                await new Categories({ name: categoryName, image: image }).save();
                req.app.locals.specialContext = 'Category added successfully'
                res.redirect('/admin/categories');
            }
        } else {
            req.app.locals.specialContext = 'Not Entered Category Name'

            res.redirect('/admin/categories');
        }
    } catch (error) {
        next(error);
    }
}
/** Post Add Category End */
/** Post Edit Category Start */
const postEditCategory = async (req, res, next) => {
    try {
        const id = req.body.categoryId;
        const newName = req.body.categoryName.toUpperCase();
        // 
        const isCategoryExist = await Categories.findOne({ name: newName });
        // 
        if (req.file.filename) {
            const image = req.file.filename;
            if (!isCategoryExist || isCategoryExist._id == id) {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { name: newName, image: image } });
            }
        } else {
            if (!isCategoryExist) {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { name: newName } });
            }
        }
        req.app.locals.specialContext = 'Category updated successfully';
        res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
}
/** Post Edit Category End */
/** Get Category Status Start */
const getCategoryStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const categoryData = await Categories.findById({ _id: id });
        if (categoryData) {
            if (categoryData.isListed === true) {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { isListed: false } });
            } else {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } });
            }
            res.redirect('/admin/categories');
        }
    } catch (error) {
        next(error);
    }
}
/** Get Category Status End */
/** Offer Side Start */
const postApplyCategoryOffer = async (req, res, next) => {
    try {
        const { offerId, categoryId } = req.body;
        await Categories.updateOne({ _id: categoryId }, {
            $set: {
                offer: offerId
            }
        })
        const offerData = await Offer.findOne({ _id: offerId });
        const updatingProducts = await Product.find({ category: categoryId });
        // 
        for (const product of updatingProducts) {
            var newPrice = product.offerPrice
            const price = product.price + product.discountPrice;
            const offerDiscountPrice = product.price
            const offerPrice = Math.round(price - ((price * offerData.discount) / 100));
            await Product.updateOne({ _id: product._id, offer: { $exists: false } },
                {
                    $set: {
                        offerPrice: offerDiscountPrice,
                        offer: offerId,
                        price: offerPrice,
                        offerAppliedBy: 'category'
                    }
                })
        }
        const expiry = offerData.expiryDate
        schedule.scheduleJob(expiry, async () => {
            await Categories.updateOne({ _id: categoryId }, {
                $unset: {
                    offer: ''
                }
            })
            await Product.updateMany({ category: categoryId, offerAppliedBy: 'category' },
                [{
                    $set: {
                        price: '$offerPrice'
                    }
                }])
            await Product.updateMany({ category: categoryId, offerAppliedBy: 'category' },
                {
                    $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
                });
        })
        res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
}
const postRemoveCategoryOffer = async (req, res, next) => {
    try {
        let categoryId = req.params.id;
        await Categories.updateOne({ _id: categoryId }, {
            $unset: {
                offer: ''
            }
        })
        await Product.updateMany({ category: categoryId, offerAppliedBy: 'category' },
            [{
                $set: {
                    price: '$offerPrice'
                }
            }])
        await Product.updateMany({ category: categoryId, offerAppliedBy: 'category' },
            {
                $unset: { offer: "", offerPrice: "", offerAppliedBy: "" }
            }
        );
        res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
}
module.exports = {
    getCategories,
    postAddCategory,
    postEditCategory,
    getCategoryStatus,
    postApplyCategoryOffer,
    postRemoveCategoryOffer
}