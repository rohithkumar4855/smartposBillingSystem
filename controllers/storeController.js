const pool = require("../db");
const generateApiKey = require("../utils/generateApikey");

const registerStore = async (req, res) => {
  const { storeName, ownerName,typeOfBusiness,gstNumber, phone, pincode } = req.body;

  try {
    // ✅ Validate phone number (must be exactly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }
    if(gstNumber && gstNumber.length!==15){
      return res.status(400).json({error:"GST number must be exactly 15 characters"})
    }


    const query = `
      SELECT * FROM stores 
      WHERE (email = $1 AND email IS NOT NULL)
         OR (phone = $2 AND phone IS NOT NULL)
         OR (gst_number = $3 AND gst_number IS NOT NULL)
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [email, phone, gstNumber]);

    if (rows.length > 0) {
      return res.status(200).json({
        status: "Store already existed",
        storeId: rows[0].id,
        apiKey: rows[0].api_key,
      });
    }

    const apiKey = generateApiKey();
    const insertQuery = `
      INSERT INTO stores 
      (store_name, owner_name,typeof_business, email, phone, gst_number, address,pincode, logo_url, api_key)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, api_key
    `;
    const result = await pool.query(insertQuery, [
      storeName || null,
      ownerName || null,
      typeOfBusiness || null,
      phone || null,
      gstNumber || null,
      address || null,
      pincode || null,
      apiKey,
    ]);

    res.status(201).json({
      storeId: result.rows[0].id,
      apiKey: result.rows[0].api_key,
      message: "Store registered successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ----------------------
// Get All Stores (Admin Only)
// ----------------------
const getAllStores = async (req, res) => {
  try {
    const adminToken = req.headers.authorization;

    if (!adminToken || adminToken !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const result = await pool.query(`
      SELECT id AS "storeId", store_name AS "storeName", owner_name AS "ownerName",
             email,typeof_business AS "typeOfBusiness", phone, gst_number AS "gstNumber",pincode
      FROM stores
      ORDER BY id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ✅ Get Store by ID
// ✅ Get Store by ID with Authorization header check
const getStoreById = async (req, res) => {
  try {
    // 1️⃣ Check Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized. Invalid or missing token" });
    }

    // 2️⃣ Get storeId from params
    const storeId = req.params.storeId;
    if (!storeId || isNaN(storeId)) {
      return res.status(400).json({ error: "Invalid or missing store ID" });
    }

    // 3️⃣ Fetch store from DB
    const query = `
      SELECT id AS storeId, store_name AS storeName, email, address, gst_number AS gstNumber,typeof_business AS "typeOfBusiness", 'active' AS status
      FROM stores
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [storeId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    // 4️⃣ Return store details
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching store by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Update Store
const updateStore = async (req, res) => {
  const { storeId } = req.params;
  const {
    storeName,
    ownerName,
    email,
    typeOfBusiness,
    phone,
    gstNumber,
    address,
    pincode,
    logoUrl,
  } = req.body;

  // ✅ Authorization check
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // ✅ Check if store exists
    const existing = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    // ✅ Validate phone if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    // ✅ Prepare fields dynamically
    const fields = [];
    const values = [];
    let index = 1;

    if (storeName !== undefined) { fields.push(`store_name = $${index++}`); values.push(storeName); }
    if (ownerName !== undefined) { fields.push(`owner_name = $${index++}`); values.push(ownerName); }
    if (email !== undefined) { fields.push(`email = $${index++}`); values.push(email); }
    if (typeOfBusiness !== undefined) { fields.push(`typeof_business = $${index++}`); values.push(typeOfBusiness); }
    if (phone !== undefined) { fields.push(`phone = $${index++}`); values.push(phone); }
    if (gstNumber !== undefined) { fields.push(`gst_number = $${index++}`); values.push(gstNumber); }
    if (address !== undefined) { fields.push(`address = $${index++}`); values.push(address); }
    if (pincode !== undefined) { fields.push(`pincode = $${index++}`); values.push(pincode); }
    if (logoUrl !== undefined) { fields.push(`logo_url = $${index++}`); values.push(logoUrl); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const updateQuery = `UPDATE stores SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
    values.push(storeId);

    await pool.query(updateQuery, values);

    res.status(200).json({ status: "updated" });
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete store by ID
const deleteStore = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Authorization check
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { storeId } = req.params;

    // ✅ Delete store
    const result = await pool.query("DELETE FROM stores WHERE id = $1 RETURNING *", [storeId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.status(200).json({ status: "deleted" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = { registerStore, getAllStores, getStoreById, updateStore, deleteStore };
