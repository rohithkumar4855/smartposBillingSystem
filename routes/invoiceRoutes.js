const express = require("express");
const { createInvoice, getInvoiceById, getInvoicesByStore, getInvoicePDF, updateInvoiceStatus } = require("../controllers/invoiceController");

const router = express.Router();

// When mounted at /api in server.js, use plain /invoices here
router.post("/invoices", createInvoice);
router.get("/invoices/:invoiceId", getInvoiceById);
router.get("/stores/:storeId/invoices", getInvoicesByStore);
router.get("/invoices/pdf/:invoiceId", getInvoicePDF);
router.patch("/invoices/:invoiceId/status", updateInvoiceStatus);
module.exports = router;
