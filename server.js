const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const storeRoutes = require("./routes/storeRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const customersRoutes=require("./routes/customersRoutes");

dotenv.config();
const app = express();
// ✅ Middlewares — must come before routes
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/stores", storeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", invoiceRoutes);
app.use("/api", customersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



