

const express = require("express");
const router = express.Router();
const { verifyPhone, login,registerStore } = require("../controllers/authController");

console.log("✅ authRoutes.js loaded");
router.post('/register',registerStore);
router.post("/verify-phone", verifyPhone);
router.post("/login", login);

module.exports = router;
