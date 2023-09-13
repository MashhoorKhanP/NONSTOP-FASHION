const Offer = require('../models/offerModel');
const Admin = require('../models/adminModel');
//const { request } = require('../routers/adminRoute');
const getOffers = async (req, res, next) => {
    try {
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const offers = await Offer.find({})
        const admin = req.session.admin
        const adminData = await Admin.findOne({ email: admin.email });
        const totalOffersCount = await Offer.find({}).count()
        let pageCount = Math.ceil(totalOffersCount / limit);
        res.render('offers', { offers, admin: adminData, pageCount, pageNum, limit, title: 'Offers', page: 'Offers' });
    } catch (error) {
        next(error);
    }
}
const getAddOffer = async (req, res, next) => {
    try {
        const admin = req.session.admin
        const adminData = await Admin.findOne({ email: admin.email });
        var offerUpdateMessage = req.app.locals.offerUpdateMessage
        req.app.locals.offerUpdateMessage = null;
        res.render('addOffer', { offerUpdateMessage, title: 'Add Offer', page: 'Offers', admin: adminData })
    } catch (error) {
        next(error);
    }
}
const postAddOffer = async (req, res, next) => {
    try {
        let { name, discount, expirydate } = req.body
        name = name.toUpperCase();
        const offerExists = await Offer.findOne({ offerName: name })
        if (offerExists) {
            req.app.locals.offerUpdateMessage = 'Offer already exists';
            return res.redirect('/admin/add-offer');
        }
        await Offer({ offerName: name, discount, expiryDate: expirydate }).save();
        res.redirect('/admin/offers');
    } catch (error) {
        next(error);
    }
}
const getEditOffer = async (req, res, next) => {
    try {
        const offerId = req.query.id;
        const admin = req.session.admin
        const adminData = await Admin.findOne({ email: admin.email });
        var offerUpdateMessage = req.app.locals.offerUpdateMessage
        req.app.locals.offerUpdateMessage = null
        const offerData = await Offer.findOne({ _id: offerId })
        res.render('editOffer', { title: 'Edit offer', offerData, offerUpdateMessage, page: 'Offers', admin: adminData })
    } catch (error) {
        next(error);
    }
}
const postEditOffer = async (req, res, next) => {
    try {
        const id = req.params.id;
        let name = req.body.name;
        name = name.toUpperCase();
        let discount = req.body.discount
        const offerExists = await Offer.findOne({ offerName: name })
        if (offerExists && offerExists._id != id) {
            req.app.locals.offerUpdateMessage = 'Offer already exists'
            return res.redirect(`/admin/offers/edit-offer?id=${id}`)
        }
        if (req.body.expirydate) {
            await Offer.updateOne({ _id: id }, {
                $set: { offerName: name, discount, expiryDate: req.body.expirydate }
            });
        } else {
            await Offer.updateOne({ _id: id }, {
                $set: { offerName: name, discount }
            })
        }
        req.app.locals.offerUpdateMessage = 'Updated Successfully';
        res.redirect('/admin/offers')
    } catch (error) {
        next(error);
    }
}
const getOfferStatus = async (req, res, next) => {
    try {
        const offerId = req.params.id;
        const offerData = await Offer.findOne({ _id: offerId });
        if (offerData.status === true) {
            await Offer.updateOne({ _id: offerId }, { $set: { status: false } });
        } else {
            await Offer.updateOne({ _id: offerId }, { $set: { status: true } });
        }
        res.redirect('/admin/offers');
    } catch (error) {
        next(error);
    }
}
module.exports = {
    getOffers,
    getAddOffer,
    postAddOffer,
    getEditOffer,
    postEditOffer,
    getOfferStatus
}
