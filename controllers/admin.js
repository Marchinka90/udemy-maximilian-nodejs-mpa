const Product = require('../models/product');
const { validationResult } = require('express-validator/check');

const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        editing: false,
        activeAddProduct: true,
        formsCSS: true,
        productCSS: true,
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);
    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            editing: false,
            product: {
                title: title, 
                price: price, 
                description: description 
            },
            errorMessage: 'Attached file is not a an image',
            formsCSS: true,
            productCSS: true,
            isAuthenticated: req.session.isLoggedIn
        });
    }
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            editing: false,
            product: {
                title: title, 
                price: price, 
                description: description
            },
            errorMessage: errors.array()[0].msg,
            formsCSS: true,
            productCSS: true,
            isAuthenticated: req.session.isLoggedIn
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        // _id: new mongoose.Types.ObjectId('61af82955a51947fc477a793'),
        title: title, 
        price: price, 
        description: description, 
        imageUrl: imageUrl,
        userId: req.session.user
    });
    product.save()
        .then(result => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            // res.redirect('/500');
            // return res.status(500).render('admin/edit-product', {
            //     pageTitle: 'Add Product',
            //     editing: false,
            //     product: {
            //         title: title, 
            //         price: price, 
            //         description: description, 
            //         imageUrl: imageUrl
            //     },
            //     errorMessage: 'Database operation failed, please try again.',
            //     formsCSS: true,
            //     productCSS: true,
            //     isAuthenticated: req.session.isLoggedIn
            // });
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .lean()
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                editing: editMode,
                product: product,
                formsCSS: true,
                productCSS: true,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            editing: true,
            product: {
                title: updatedTitle, 
                price: updatedPrice, 
                description: updatedDescription, 
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            formsCSS: true,
            productCSS: true,
            isAuthenticated: req.session.isLoggedIn
        });
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.description = updatedDescription;
            return product.save()
                .then(result => {
                    console.log('Updated product');
                    res.redirect('/admin/products');
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
        .populate('userId')
        .lean()
        .then(products => {
            res.render('admin/products', {
                prods: products, 
                pageTitle: 'Admin Products',
                path: '/admin/product', 
                hasProducts: products.length > 0, 
                activeAdminProducts: true,
                productCSS: true,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) {
            return next(new Error('Product not found!')); 
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id: prodId, userId: req.user._id });
    })
    .then(() => {
        console.log('Destoyed Product')
        res.status(200).json({ message: 'Success!' });
    })
    .catch(err => {
        res.status(500).json({ message: 'Deleting product failed!' });
    });
};