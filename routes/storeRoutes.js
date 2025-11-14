const express = require("express");
const router = express.Router();
const { registerStore, getAllStores,getStoreById,updateStore,deleteStore } = require("../controllers/storeController");

// Register Store
router.post("/register", registerStore);

// Get All Stores (Admin Only)
router.get("/getall", getAllStores);

// Get Store by ID
router.get("/:storeId", getStoreById);

// Update Store

router.put("/:storeId", updateStore);

// Delete Store
router.delete("/:storeId", deleteStore);

module.exports = router;
