const express = require("express");
const router = express.Router();
const { getAllCustomers,getRepeatCustomers,getNewCustomers,getAverageInvoiceValue ,getCustomerSpendingTrends, getTopCustomers,getCustomerLoyaltyInsights,getCustomerDetails,exportAnalyticsData,generateDetailedReport} = require("../controllers/customerController");

// GET /api/customers?storeId=1
router.get("/customers", getAllCustomers);
//repeat customers
router.get("/customers/repeat", getRepeatCustomers);
//new customers
router.get("/customers/new", getNewCustomers);
//average invoice value
router.get("/invoice/average-value", getAverageInvoiceValue);
// customets trends daily, weekly, monthly can be added here in future
router.get("/customers/spending-trends", getCustomerSpendingTrends);
//get top customers by spending
router.get("/customers/top-spenders", getTopCustomers);
//customer loyalty insights can be added here in future
router.get("/customers/loyalty-insights", getCustomerLoyaltyInsights);
//get customer by customer_code
router.get("/customers/detailes/:customerId", getCustomerDetails);
// Export complete analytics data as CSV/Excel
router.get("/analytics/exports", exportAnalyticsData);
// Export detailed analytics report as PDF
router.get("/analytics/detailes/report", generateDetailedReport);

module.exports = router;
