const pool = require("../db/index");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// ✅ Create Invoice API (No API Key)
// const createInvoice = async (req, res) => {
//   const { storeId, customerName, phone, items,paymentMethod, discount } = req.body;

//   try {
//     // 1️⃣ Validate required fields
//     if (!storeId || !customerName || !items || items.length === 0 || !paymentMethod) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // 2️⃣ Start a transaction
//     await pool.query("BEGIN");
//     let total = 0;
//     for (const item of items) {
//       const { productId, qty } = item;

//       // Fetch product price from DB to prevent price tampering
//       const productResult = await pool.query(
//         "SELECT price FROM products WHERE id = $1 AND store_id = $2",
//         [productId, storeId]
//       );

//       if (productResult.rows.length === 0) {
//         await pool.query("ROLLBACK");
//         return res.status(404).json({ message: `Product with ID ${productId} not found` });
//       }

//       const price = Number(productResult.rows[0].price);
      
//       total += price * qty; // Add to total
//       item.price = price;   // Save actual price for insertion
//     }

//     // 3️⃣ Insert invoice
//     const invoiceResult = await pool.query(
//       `INSERT INTO invoices (store_id, customer_name, phone, total, payment_method, status)
//        VALUES ($1, $2, $3, $4, $5, 'completed')
//        RETURNING id`,
//       [storeId, customerName, phone || null, total, paymentMethod]
//     );

//     const invoiceId = invoiceResult.rows[0].id;

//     // 4️⃣ Insert invoice items + update stock
//     for (const item of items) {
//       const { productId, qty, price } = item;

//       if (!productId || !qty || !price) {
//         await pool.query("ROLLBACK");
//         return res.status(400).json({ error: "Invalid item data" });
//       }

//       // Check product and stock
//       const productResult = await pool.query(
//         "SELECT quantity FROM products WHERE id = $1 AND store_id = $2",
//         [productId, storeId]
//       );

//       if (productResult.rows.length === 0) {
//         await pool.query("ROLLBACK");
//         return res.status(400).json({ error: `Product ${productId} not found for store ${storeId}` });
//       }

//       const availableQty = productResult.rows[0].quantity;
//       if (availableQty < qty) {
//         await pool.query("ROLLBACK");
//         return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
//       }

//       // Insert item (use `qty` column — matches models/invoiceModel.js)
//       await pool.query(
//         `INSERT INTO invoice_items (invoice_id, product_id, qty, price)
//          VALUES ($1, $2, $3, $4)`,
//         [invoiceId, productId, qty, price]
//       );

//       // Update product stock
//       await pool.query(
//         "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
//         [qty, productId]
//       );
//     }

//     // 5️⃣ Commit
//     await pool.query("COMMIT");

//     // 6️⃣ Send response
//     res.status(201).json({
//       invoiceId,
//       total,
//       status: "completed",
//       message: "Invoice created successfully"
//     });

//   } catch (error) {
//     console.error("❌ Error creating invoice:", error);
//     await pool.query("ROLLBACK");
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


const createInvoice = async (req, res) => {
  const { storeId, customerName, phone, items, paymentMethod, discount = 0 } = req.body;

  try {
    if (!storeId || !customerName || !items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query("BEGIN");

    let total = 0;

    // 1️⃣ Calculate total from products
    for (const item of items) {
      const { productId, qty } = item;

      const productResult = await pool.query(
        "SELECT price FROM products WHERE id = $1 AND store_id = $2",
        [productId, storeId]
      );

      if (productResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }

      const price = Number(productResult.rows[0].price);
      total += price * qty;
      item.price = price;
    }

    // 2️⃣ Apply overall discount (on total)
    const discountPercent = Number(discount) || 0;
    const discountAmount = (total * discountPercent) / 100;
    const finalTotal = total - discountAmount;

    // 3️⃣ Insert into invoices
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (store_id, customer_name, phone, total, discount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')
       RETURNING id`,
      [storeId, customerName, phone || null, finalTotal, discountPercent, paymentMethod]
    );

    const invoiceId = invoiceResult.rows[0].id;

    // 4️⃣ Insert invoice items + reduce stock
    for (const item of items) {
      const { productId, qty, price } = item;

      const productResult = await pool.query(
        "SELECT quantity FROM products WHERE id = $1 AND store_id = $2",
        [productId, storeId]
      );

      if (productResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ error: `Product ${productId} not found for store ${storeId}` });
      }

      const availableQty = productResult.rows[0].quantity;
      if (availableQty < qty) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ error: `Insufficient stock for product ${productId}` });
      }

      await pool.query(
        `INSERT INTO invoice_items (invoice_id, product_id, qty, price)
         VALUES ($1, $2, $3, $4)`,
        [invoiceId, productId, qty, price]
      );

      await pool.query(
        "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
        [qty, productId]
      );
    }

    await pool.query("COMMIT");

    res.status(201).json({
      invoiceId,
      totalBeforeDiscount: total,
      discountPercent,
      discountAmount,
      finalTotal,
      message: "Invoice created successfully with overall discount",
    });

  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// ✅ Get Invoice by ID (No storeId required)
const getInvoiceById = async (req, res) => {
  const { invoiceId } = req.params;

  try {
    // 1️⃣ Validate input
    if (!invoiceId) {
      return res.status(400).json({ error: "Missing invoiceId" });
    }

    // 2️⃣ Fetch invoice details
    const invoiceResult = await pool.query(
      `SELECT id AS invoiceId, store_id AS storeId, customer_name, phone,
              total, payment_method, status, created_at AS createdAt
       FROM invoices
       WHERE id = $1`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];

    // 3️⃣ Fetch invoice items with product details
    const itemsResult = await pool.query(
      `SELECT ii.product_id AS productId, p.name AS productName,
              ii.qty, ii.price, (ii.qty * ii.price) AS subtotal
       FROM invoice_items ii
       JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1`,
      [invoiceId]
    );

    invoice.items = itemsResult.rows;

    // 4️⃣ Return response
    res.status(200).json({
      success: true,
      invoice,
    });

  } catch (error) {
    console.error("❌ Error fetching invoice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getInvoicesByStore = async (req, res) => {
  const { storeId } = req.params;

  try {
    // 1️⃣ Validate input
    if (!storeId) {
      return res.status(400).json({ error: "Missing storeId" });
    }

    // 2️⃣ Fetch all invoices for the store
    const result = await pool.query(
      `SELECT id AS invoiceId,
              customer_name AS customerName,
              total,
              created_at AS date
       FROM invoices
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [storeId]
    );

    // 3️⃣ Return response
    res.status(200).json({
      success: true,
      count: result.rows.length,
      invoices: result.rows,
    });

  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




// Generate PDF helper (CommonJS) — adapted from utils/generateInvoicePdf.js
const generateInvoicePDF = async (invoice, items, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${invoice.id || invoice.invoiceId}.pdf`);
    doc.pipe(res);

    // === HEADER ===
    doc.font("Helvetica-Bold").fontSize(22).text("Smart Billing System", { align: "center" }).moveDown(1.2);

    const headerY = doc.y;
    doc.moveTo(50, headerY).lineTo(550, headerY).strokeColor("#999").stroke();
    doc.moveDown(0.8);

    doc.font("Helvetica").fontSize(12);
    const pad = 40;

    doc.text(`Invoice ID: ${invoice.id || invoice.invoiceId || "N/A"}`, pad, doc.y);
    doc.text(`Store ID: ${invoice.store_id || invoice.storeId || "N/A"}`, pad, doc.y + 5);
    doc.text(`Customer Name: ${invoice.customer_name || invoice.customerName || "N/A"}`, pad, doc.y + 10);
    doc.text(`Phone: ${invoice.phone || "N/A"}`, pad, doc.y + 15);
    doc.text(`Date: ${new Date(invoice.created_at || invoice.createdAt || Date.now()).toLocaleString()}`, pad, doc.y + 20);
    doc.moveDown(2);

    // === TABLE HEADER ===
    doc.font("Helvetica-Bold").fontSize(16).text("Items", { underline: true, align: "center" });
    doc.moveDown(0.5);

    const colWidths = [70, 150, 50, 70, 70, 70];
    const startX = 50;
    let y = doc.y + 10;
    const headers = ["Product ID", "Description", "Qty", "Price", "Discount", "Total"];

    doc.font("Helvetica-Bold").fontSize(11);
    let x = startX;
    headers.forEach((header, i) => {
      doc.text(header, x, y, { width: colWidths[i], align: "left" });
      x += colWidths[i];
    });

    y += 18;
    doc.moveTo(50, y).lineTo(540, y).strokeColor("#000").stroke();

    // === TABLE BODY ===
    let grandTotal = 0;
    let totalOriginal = 0;
    let totalSaved = 0;
    doc.font("Helvetica").fontSize(10);

    items.forEach((item) => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 2);
      const description = String(item.description || item.productName || item.description || "N/A");

      const originalTotal = qty * price;
      const discountedTotal = originalTotal * (1 - discount / 100);
      totalOriginal += originalTotal;
      grandTotal += discountedTotal;
      totalSaved += originalTotal - discountedTotal;

      x = startX;

      const columns = [
        item.product_id?.toString() || item.productId?.toString() || "N/A",
        description,
        qty.toString(),
        `₹${price.toFixed(2)}`,
        `${discount}%`,
        `₹${discountedTotal.toFixed(2)}`,
      ];

      const descHeight = doc.heightOfString(description, {
        width: colWidths[1],
        align: "left",
      });

      const rowHeight = Math.max(descHeight + 10, 20);

      // Add page break if near bottom
      if (y + rowHeight > doc.page.height - 150) {
        doc.addPage();
        y = 80;
        doc.moveTo(50, y).lineTo(540, y).strokeColor("#000").stroke();
      }

      columns.forEach((text, i) => {
        const options = { width: colWidths[i], align: "left" };
        doc.text(text, x, y + 5, options);
        x += colWidths[i];
      });

      y += rowHeight;
      doc.moveTo(50, y).lineTo(540, y).strokeColor("#ccc").stroke();
    });

    // === SAVINGS SUMMARY ===
    doc.moveDown(1.5);
    if (totalSaved > 0) {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("green").text(`You saved ₹${totalSaved.toFixed(2)} on this purchase!`, { align: "left" }).fillColor("black");
    }

    // === GRAND TOTAL ===
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(14).text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { align: "center" });

    // === UPI QR CODE ===
    const upiId = "6360095490@axl";
    const payeeName = "RohitKumar";
    const amount = grandTotal.toFixed(2);
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;

    const qrDataUrl = QRCode.toDataURL ? await QRCode.toDataURL(upiLink) : await QRCode.toDataURL(upiLink);

    const qrY = doc.y + 40;
    if (qrY + 160 > doc.page.height) doc.addPage();

    doc.image(qrDataUrl, 240, qrY, { width: 120, height: 120 });
    doc.font("Helvetica").fontSize(12).text("Scan to Pay via UPI", 0, qrY + 130, { align: "center", width: doc.page.width });

    // === FOOTER ===
    const footerY = doc.page.height - 50;
    doc.moveTo(50, footerY - 10).lineTo(550, footerY - 10).strokeColor("#aaa").stroke();

    doc.font("Helvetica-Oblique").fontSize(12).text("Thank you for your purchase!", 0, footerY, { align: "center", width: doc.page.width });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF", error: err.message });
    } else {
      // If headers already sent, just end the response
      try { res.end(); } catch (e) {}
    }
  }
};


// 🧾 GET /api/invoices/:invoiceId/pdf
const getInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ error: "Missing invoiceId" });
    }

    // ✅ 1. Fetch Invoice
    const invoiceResult = await pool.query(
      `SELECT id, store_id, customer_name, phone, total, payment_method, status, created_at
       FROM invoices
       WHERE id = $1`,
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];

    // ✅ 2. Fetch Items
    const itemsResult = await pool.query(
      `SELECT ii.product_id, p.name AS description, ii.qty, ii.price
       FROM invoice_items ii
       JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1`,
      [invoiceId]
    );

    const items = itemsResult.rows;

    // ✅ 3. Generate PDF
    await generateInvoicePDF(invoice, items, res);
  } catch (error) {
    console.error("❌ Error generating invoice PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};


// ✅ Update invoice payment status
const updateInvoiceStatus = async (req, res) => {
  const { invoiceId } = req.params;
  const { status } = req.body; // expected { "status": "paid" } or { "status": "unpaid" }

  try {
    // Validate input
    if (!["paid", "unpaid"].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use 'paid' or 'unpaid'.",
      });
    }

    const result = await pool.query(
      `UPDATE invoices 
       SET status = $1
       WHERE id = $2
       RETURNING id, status;`,
      [status, invoiceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




module.exports = { createInvoice, getInvoiceById, getInvoicesByStore, getInvoicePDF, updateInvoiceStatus };

