const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById
} = require("../controllers/productController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// CREATE PRODUCT STANDARD
router.post(
    "/",
    protect,
    authorize("admin", "manager"),
    createProduct
);


// GET ALL PRODUCT STANDARDS
router.get(
    "/",
    protect,
    getProducts
);


// GET PRODUCT STANDARD BY ID
router.get(
    "/:id",
    protect,
    getProductById
);


module.exports = router;