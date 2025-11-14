const pool = require("../db");
const jwt = require("jsonwebtoken");

// ✅ Register Store API
const registerStore = async (req, res) => {
  try {
    const { store_name, phone, email, address ,logoUrl} = req.body;

    // ✅ Validation
    if (!store_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Store name and phone are required",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    // ✅ Check if phone already registered
    const existingStore = await pool.query(
      "SELECT * FROM stores WHERE phone = $1",
      [phone]
    );
    if (existingStore.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Store already registered with this phone number",
      });
    }

    // ✅ Insert new store
    const result = await pool.query(
      `INSERT INTO stores (store_name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING id, store_name, phone`,
      [store_name, phone, email, address]
    );

    const store = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Store registered successfully",
      store,
    });
  } catch (error) {
    console.error("❌ Error in registerStore:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Verify Phone API
const verifyPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    console.log("📞 /verify-phone:", phone);

    const result = await pool.query("SELECT * FROM stores WHERE phone = $1", [phone]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Store not found. Please register first.",
      });
    }

    const otp = "123456";
    console.log(`✅ OTP sent to ${phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp, // remove in production
    });
  } catch (error) {
    console.error("❌ Error in verifyPhone:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Login API
const login = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (!otp || otp !== "123456") {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    console.log("🔑 /login:", phone);

    const result = await pool.query("SELECT * FROM stores WHERE phone = $1", [phone]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Store not registered",
      });
    }

    const store = result.rows[0];

    const token = jwt.sign(
      { storeId: store.id, storeName: store.store_name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      storeId: store.id,
      storeName: store.store_name,
    });
  } catch (error) {
    console.error("❌ Error in login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { registerStore, verifyPhone, login };
