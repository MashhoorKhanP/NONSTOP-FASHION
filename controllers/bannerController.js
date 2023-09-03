const Banner = require('../models/bannerModel');
const bannerCompare = require('../models/bannerModel')
const Admin = require('../models/adminModel');
const path = require('path');
const fs = require('fs');
const { nextTick } = require('process');

/** Get Banner Start */
const getBanners = async (req, res, next) => {
    try {
        const adminData = await Admin.findOne({ email: req.session.admin.email });
        const banner = await Banner.find();
        res.render('banners', { title: 'Banners', page: 'Banners', admin: adminData, banner })
    } catch (error) {
        next(error);
    }
}
/** Get Banner End */
/** Post Banner Start */
const postUpdateBanner = async (req, res, next) => {
    try {
        const { name, url } = req.body;
        console.log(name, url);
        let image = false;
        if (req.file) {
            image = req.file.filename;
        }
        console.log(name, url, image);
        const bannerExist = await bannerCompare.findOne({ name })
        if (bannerExist && image != false && url != null) {
            await fs.unlink(path.join(__dirname, '../public/assets/banner-images') + name, (error) => {
                if (error) {

                    console.log(error);
                }
            });
            await Banner.updateOne({ name }, { $set: { image, url } });

        } else if (bannerExist && image != false) {
            await fs.unlink(path.join(__dirname, '../public/assets/banner-images') + name, (error) => {
                if (error) {
                    console.log(error);
                }
            });
            await Banner.updateOne({ name }, { $set: { image } })
        } else if (bannerExist && url != null) {
            await Banner.updateOne({ name }, { $set: { url } })
        } else {
            await new Banner({ name, image, url }).save();
        }
        res.redirect('/admin/banners');
    } catch (error) {
        next(error);
    }
}
/** Post Banner End */
module.exports = {
    getBanners,
    postUpdateBanner
}