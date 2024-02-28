const Address = require('../models/addressModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');
const getAddAddress = async (req, res, next) => {
    try {
        let user = req.session.user;
        let userData = await User.findOne({ email: user.email });
        let id = req.params.id;
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        if (!user) {
            req.app.locals.specialContext = 'User can only add upto 6 address'
            res.redirect('/profile/manageaddress');
        } else {
            res.render('addAddress', { title: 'Add Address', user: userData, cartCount: req.session.cartCount});
        }
    } catch (error) {
        next(error);
    }
}
const postAddAddress = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const { name, mobno, town, address, email, state, country, zipcode } = req.body;
        const newAddress = { userName: name, email, mobile: mobno, town, state, country, zip: zipcode, address }
        const isUserHaveAddress = await Address.findOne({ userId: userId });
        if (isUserHaveAddress) {
            await Address.updateOne({ userId: userId },
                {
                    $addToSet: {
                        addresses: newAddress
                    }
                }
            );
            res.redirect('/profile/:id');
        } else {
            await new Address({
                userId: userId,
                addresses: [newAddress]
            }).save();
            res.redirect('/profile/:id');
        }
    } catch (error) {
        next(error);
    }
}
const getManageAddress = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = req.session.user
        const userData = await User.findOne({ email: user.email })
        const userAddress = await Address.findOne({ userId: user._id });
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        if (userAddress) {
            return res.render('manageAddress', { title: 'Manage Address', userAddress, user: userData, cartCount: req.session.cartCount });
        } else {
            return res.redirect(`/profile/${userId}`);
        }
    } catch (error) {
        next(error);
    }
}
const getEditAddress = async (req, res, next) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user._id;
        const userData = await User.findOne({ email: req.session.user.email });
        const addressData = await Address.findOne({ userId, 'addresses._id': addressId });
        const address = addressData.addresses.find(obj => obj._id.toString() === addressId);
        req.session.cartCount = 0
        let cartData = await Cart.findOne({ user: userData._id })
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        res.render('editAddress', { address, title: 'Edit Address', user: userData, cartCount: req.session.cartCount });
    } catch (err) {
        next(err);
    }
}
const postEditAddress = async (req, res, next) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user._id;
        const { name, email, mobno, town, state, country, zipcode, address } = req.body;
        await Address.updateOne(
            { userId, 'addresses._id': addressId },
            {
                $set: {
                    'addresses.$.userName': name,
                    'addresses.$.email': email,
                    'addresses.$.mobile': mobno,
                    'addresses.$.town': town,
                    'addresses.$.state': state, // Corrected typo here
                    'addresses.$.country': country,
                    'addresses.$.zip': zipcode,
                    'addresses.$.address': address,
                },
            }
        );
        res.redirect(`/profile/${userId}/manageaddress`); // Corrected redirect URL
    } catch (error) {
        next(error);
    }
};
const getDeleteAddress = async (req, res, next) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user._id;
        await Address.updateOne(
            { userId, 'addresses._id': addressId },
            {
                $pull: {
                    addresses: { _id: addressId }
                }
            }
        )
        res.redirect(`/profile/${userId}/manageaddress`);
    } catch (error) {
        next(error);
    }
}
module.exports = {
    getAddAddress,
    postAddAddress,
    getManageAddress,
    getEditAddress,
    postEditAddress,
    getDeleteAddress
} 