const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', isAuth, adminController.getProducts);

router.get('/add-product', isAuth, adminController.getAddProduct);
router.post('/add-product', 
    [
        body('title').trim().isString().isLength({ min: 3, max: 50 }),
        body('price').trim().isFloat(),
        body('description').trim().isLength({ min: 3, max: 400 }),
    ],  
    isAuth, 
    adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)

router.post('/edit-product/', 
    [
        body('title').trim().isString().isLength({ min: 3, max: 50 }),
        body('price').trim().isFloat(),
        body('description').trim().isLength({ min: 3, max: 400}),
    ],
    isAuth, 
    adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct)

module.exports = router;