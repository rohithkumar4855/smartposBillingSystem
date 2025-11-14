
const express = require("express");
const router = express.Router();
const { addProduct,getAllProducts,getProductDetails,updateProduct,deleteProduct, updateStock } = require("../controllers/productController");

router.post("/products", addProduct);
// Get all products of a store
router.get("/products/:storeId", getAllProducts);

// Get product details by productId
router.get("/products/item/:productId", getProductDetails);

// Update product details by productId
router.put("/products/:productId", updateProduct);

// Delete product by productId
router.delete("/products/:id", deleteProduct);

// update stock of a product
router.patch("/products/stock/:productId", updateStock);



module.exports = router;
