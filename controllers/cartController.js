const Cart = require('../models/cartModel');
const Products = require('../models/productModel');
const User = require('../models/userModel');
/** Get Cart Start */
const getCart = async (req, res, next) => {
    try {
        let email = req.session.user.email;
        const userData = await User.findOne({ email: email });
        let cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
        let totalPrice = 0, dPrice = 0, subtotalPrice = 0;
        let cartList = [];
        req.session.cartCount = 0
        if (cartData && cartData.products) {
            req.session.cartCount = cartData.products.length
        }
        if (cartData && cartData.products.length > 0) {
            cartList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }) => ({
                productId,
                size,
                quantity,
                cartPrice,
                cartDPrice,
                cartSubtotalPrice
            }));
            for (const { productId, quantity } of cartList) {
                await Cart.updateOne(
                    { user: userData._id, 'products.productId': productId },
                    {
                        $set: {
                            'products.$.cartPrice': quantity * productId.price,
                            'products.$.cartDPrice': quantity * productId.discountPrice,
                            'products.$.cartSubtotalPrice': quantity * productId.price + productId.discountPrice
                        }
                    }
                );
            }
            // Fetch updated cart data after the updates
            cartData = await Cart.findOne({ user: userData._id }).populate('products.productId');
            cartList = cartData.products.map(({ productId, size, quantity, cartPrice, cartDPrice, cartSubtotalPrice }) => ({
                productId,
                size,
                quantity,
                cartPrice,
                cartDPrice,
                cartSubtotalPrice
            }));
            totalPrice = cartList.reduce((acc, curr) => acc + curr.cartPrice, 0);
            dPrice = cartList.reduce((acc, curr) => acc + curr.cartDPrice, 0);
            subtotalPrice = cartList.reduce((acc, curr) => acc + curr.cartSubtotalPrice, 0);
            await Cart.updateOne({ user: userData._id }, { $set: { totalPrice: totalPrice } });
        }
        res.render('cart', { user: userData, title: 'Cart', dPrice, totalPrice, subtotalPrice, cartData: cartList, cartCount: req.session.cartCount });
    } catch (error) {
        next(error);
    }
};
/** Get Cart End */
/** Post Add to Cart Start */
const postAddToCart = async (req, res) => {
    try {
        let user = req.session.user.email;
        let userData = await User.findOne({ email: user });
        let id = userData._id;
        let productId = req.params.id
        let size = req.body.size
        const product = await Products.findById({ _id: productId })
        const price = product.price
        const dPrice = product.discountPrice
        const subtotalPrice = product.price + product.discountPrice;
        let userExist = await Cart.findOne({ user: id })
        if (userExist) {
            let productExists = await Cart.findOne({ user: id, products: { $elemMatch: { productId: productId } } });
            if (productExists) {
                const referringUrl = req.headers.referer;
                return res.redirect(referringUrl);
            } else {
                await Cart.updateOne({ user: id }, {
                    $addToSet: {
                        products: {
                            productId,
                            size: size,
                            quantity: 1,
                            cartSubtotalPrice: subtotalPrice,
                            cartPrice: price,
                            cartDPrice: dPrice
                        }
                    }, $inc: { totalPrice: price }
                })
                let cartCount = await Cart.findOne({ user: id });
                req.session.cartCount = cartCount.products.length
                const referringUrl = req.headers.referer;
                return res.redirect(referringUrl);
            }
        } else {
            await new Cart({
                user: id,
                products: [{
                    productId,
                    size: size,
                    quantity: 1,
                    cartSubtotalPrice: subtotalPrice,
                    cartPrice: price,
                    cartDPrice: dPrice
                }],
                totalPrice: price
            }).save()
            let cartCount = await Cart.findOne({ user: id })
            req.session.cartCount = cartCount.products.length
            const referringUrl = req.headers.referer;
            return res.redirect(referringUrl);
        }
    } catch (error) {
        next(error);
    }
}
/** Post Add to Cart End*/
/** Post Remove From Cart Start */
const getRemoveCartProduct = async (req, res, next) => {
    try {
        const user = req.session.user.email;
        const userData = await User.findOne({ email: user });
        const productId = req.params.id;
        let removed = await Cart.findOneAndUpdate({ user: userData._id, 'products.productId': productId },
            { $pull: { products: { productId } } })
        if (removed) {
            let cartCount = await Cart.findOneAndUpdate({ user: userData._id })
            if (cartCount && cartCount.products) {
                req.session.cartCount = cartCount.products.length
            } else {
                req.session.cartCount = 0;
            }
            const referringUrl = req.headers.referer;
            return res.redirect(referringUrl);
        } else {
            res.send('not removed')
        }
    } catch (error) {
        next(error);
    }
}
/** Post Remove From Cart End */
/** Update Cart Start */
const updateCart = async (req, res, next) => {
    try {
        const email = req.session.user.email;
        const userData = await User.findOne({ email: email })
        const quantity = parseInt(req.body.amt)
        const productId = req.body.prodId;
        const productData = await Products.findOne({ _id: productId });
        const stock = productData.quantity
        const price = quantity * productData.price;
        const dPrice = quantity * productData.discountPrice;
        const subtotalPrice = (productData.price + productData.discountPrice) * quantity;
        if (stock >= quantity) {
            await Cart.updateOne({ user: userData._id, 'products.productId': productId },
                {
                    $set: { 'products.$.quantity': quantity, 'products.$.cartPrice': price, 'products.$.cartDPrice': dPrice, 'products.$.cartSubtotalPrice': subtotalPrice }
                })
            let cartData = await Cart.find({ user: userData._id }).populate('products.productId');
            let [{ products }] = cartData
            let cartList = products.map(({ cartPrice, cartDPrice, cartSubtotalPrice }) => ({ cartPrice, cartDPrice, cartSubtotalPrice }));
            let totalPrice = cartList.reduce((acc, curr) => acc += curr.cartPrice, 0)
            let discountPrice = cartList.reduce((acc, curr) => acc += curr.cartDPrice, 0)
            let subTotal = cartList.reduce((acc, curr) => acc += curr.cartSubtotalPrice, 0);
            await Cart.updateOne({ user: userData._id }, { $set: { totalPrice: totalPrice } })
            let productPrice = productData.price * quantity
            res.json({ status: true, data: { st: '', dPrice, totalPrice, discountPrice, productPrice, subTotal } })
        } else {
            res.json({ status: false, data: 'The product stock has been exceeded' });
        }
    } catch (error) {
        next(error);
    }
}
/** Update Cart End */
module.exports = {
    getCart,
    postAddToCart,
    getRemoveCartProduct,
    updateCart
}