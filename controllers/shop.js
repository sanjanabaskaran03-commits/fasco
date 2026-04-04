const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order'); // - Make sure you have the Order model created

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product_list', { 
                prods: products,
                pageTitle: 'All Products',
                path: '/'
            });
        })
        .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => { // Adding this common route
    Product.find()
        .then(products => {
            res.render('shop/product_list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products'
            });
        })
        .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(prodId)) {
        return res.redirect('/products');
    }

    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product ? product.title : 'Product Not Found',
                path: '/products'
            });
        })
        .catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        })
        .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() => res.redirect('/cart'))
        .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
        .then(() => res.redirect('/cart'))
        .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    if (req.user.cart.items.length === 0) {
        return res.redirect('/cart');
    }
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart(); 
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => console.log(err));
};