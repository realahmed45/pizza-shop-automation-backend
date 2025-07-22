// ===============================================
// SERVER.JS - With 24/7 Keep-Alive System for Render
// ===============================================
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

// ===============================================
// KEEP-ALIVE SYSTEM FOR RENDER (24/7 UPTIME)
// ===============================================
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render sleeps after 15 minutes)
let APP_URL =
  process.env.RENDER_EXTERNAL_URL ||
  "https://pizza-shop-automation-backend-1.onrender.com";

// Self-ping function to prevent sleeping
const keepRenderAwake = () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("🔧 Keep-alive disabled in development mode");
    return;
  }

  setInterval(async () => {
    try {
      const response = await fetch(`${APP_URL}/health`);
      const data = await response.json();
      console.log(
        `✅ Keep-alive ping successful - Status: ${
          response.status
        }, Uptime: ${Math.floor(data.uptime || 0)}s`
      );
    } catch (error) {
      console.log(`❌ Keep-alive ping failed: ${error.message}`);
      // Try backup ping to root endpoint
      try {
        await fetch(`${APP_URL}/`);
        console.log(`✅ Backup ping successful`);
      } catch (backupError) {
        console.log(`❌ Backup ping also failed: ${backupError.message}`);
      }
    }
  }, KEEP_ALIVE_INTERVAL);
};

// Auto-detect Render URL from request (with fallback to your specific URL)
const detectAppUrl = (req) => {
  if (req && req.get("host") && req.get("host").includes("onrender.com")) {
    const protocol = req.get("x-forwarded-proto") || "https";
    APP_URL = `${protocol}://${req.get("host")}`;
    console.log(`🔍 Auto-detected App URL: ${APP_URL}`);
  } else if (!APP_URL.includes("onrender.com")) {
    APP_URL = "https://pizza-shop-automation-backend-1.onrender.com";
    console.log(`🎯 Using configured Render URL: ${APP_URL}`);
  }
};

// ===============================================
// CORS - Allow Everything
// ===============================================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// ===============================================
// MIDDLEWARE
// ===============================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const productsDir = path.join(__dirname, "uploads", "products");
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// ===============================================
// DATABASE CONNECTION
// ===============================================
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://realahmedali4:QcU47egUiSvFrbJZ@cluster0.uioclog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// ===============================================
// IMPORT MODELS (Use your existing model files)
// ===============================================
const Customer = require("./Models/customer");
const Product = require("./Models/Product");
const Order = require("./Models/Order");

// ===============================================
// MULTER SETUP FOR FILE UPLOADS
// ===============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ===============================================
// KEEP-ALIVE ROUTES
// ===============================================

// Enhanced health check endpoint
app.get("/health", (req, res) => {
  // Auto-detect URL on first request
  if (APP_URL.includes("localhost") && req.get("host")) {
    detectAppUrl(req);
  }

  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
    },
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
    keepAlive: process.env.NODE_ENV === "production" ? "active" : "disabled",
    url: APP_URL,
  });
});

// Ping endpoint for external monitoring
app.get("/ping", (req, res) => {
  res.json({
    status: "pong",
    time: Date.now(),
    uptime: Math.floor(process.uptime()),
  });
});

// Wake-up endpoint
app.get("/wake", (req, res) => {
  res.json({
    message: "Service is awake!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ===============================================
// ROUTES
// ===============================================

// Root endpoint
app.get("/", (req, res) => {
  // Auto-detect URL on first request
  if (APP_URL.includes("localhost") && req.get("host")) {
    detectAppUrl(req);
  }

  res.json({
    success: true,
    message: "🍕 ChatBiz Pizza Automation API Server",
    status: "active",
    keepAlive: process.env.NODE_ENV === "production" ? "enabled" : "disabled",
    endpoints: {
      dashboard: "/api/admin/dashboard",
      customers: "/api/admin/customers",
      orders: "/api/admin/orders",
      products: "/api/admin/products",
      health: "/health",
      ping: "/ping",
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
app.get("/api/admin/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Dashboard endpoint
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Basic stats
    const stats = {
      totalCustomers: (await Customer.countDocuments()) || 0,
      totalOrders: (await Order.countDocuments()) || 0,
      todayOrders:
        (await Order.countDocuments({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })) || 0,
      totalRevenue: await Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]).then((result) => result[0]?.total || 0),
      todayRevenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]).then((result) => result[0]?.total || 0),
      pendingOrders: (await Order.countDocuments({ status: "pending" })) || 0,
    };

    // Recent orders
    const recentOrders =
      (await Order.find()
        .populate("customerId", "name phoneNumber")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()) || [];

    // Sales data (simple version for last 7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]).then((result) => result[0]?.revenue || 0);

      salesData.push({
        date: dayStart.toISOString().split("T")[0],
        revenue: dayRevenue,
      });
    }

    res.json({
      success: true,
      stats,
      recentOrders,
      salesData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      message: error.message,
      stats: {
        totalCustomers: 0,
        totalOrders: 0,
        todayOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        pendingOrders: 0,
      },
      salesData: [],
      recentOrders: [],
    });
  }
});

// Get customers
app.get("/api/admin/customers", async (req, res) => {
  try {
    const customers =
      (await Customer.find().sort({ createdAt: -1 }).limit(50).lean()) || [];

    res.json({
      success: true,
      customers: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customers",
      customers: [],
    });
  }
});

// Get orders
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders =
      (await Order.find()
        .populate("customerId", "name phoneNumber")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()) || [];

    res.json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      orders: [],
    });
  }
});

// Update order status
app.put("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    });
  }
});

// Get products
app.get("/api/admin/products", async (req, res) => {
  try {
    const products =
      (await Product.find().sort({ createdAt: -1 }).limit(100).lean()) || [];

    res.json({
      success: true,
      products: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
      products: [],
    });
  }
});

// Add new product
app.post("/api/admin/products", upload.array("images", 5), async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle uploaded images - Convert to Base64
    if (req.files && req.files.length > 0) {
      productData.images = await Promise.all(
        req.files.map(async (file) => {
          // Read file and convert to base64
          const fileBuffer = fs.readFileSync(file.path);
          const base64Data = fileBuffer.toString("base64");

          return {
            url: `/uploads/products/${file.filename}`,
            base64: base64Data,
            alt: productData.name || "Product image",
            mimeType: file.mimetype,
          };
        })
      );
    }

    // Parse JSON fields
    if (productData.specifications) {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = {};
      }
    }

    if (productData.deliveryCities) {
      try {
        productData.deliveryCities = JSON.parse(productData.deliveryCities);
      } catch (e) {
        productData.deliveryCities = [];
      }
    }

    if (productData.tags) {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        productData.tags = [];
      }
    }

    // Convert string booleans
    productData.availability = productData.availability === "true";
    productData.customizable = productData.customizable === "true";
    productData.featured = productData.featured === "true";

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add product",
      details: error.message,
    });
  }
});

// Update product
app.put(
  "/api/admin/products/:id",
  upload.array("images", 5),
  async (req, res) => {
    try {
      const productData = { ...req.body };

      // Handle new uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = await Promise.all(
          req.files.map(async (file) => {
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(file.path);
            const base64Data = fileBuffer.toString("base64");

            return {
              url: `/uploads/products/${file.filename}`,
              base64: base64Data,
              alt: productData.name || "Product image",
              mimeType: file.mimetype,
            };
          })
        );

        // Keep existing images if specified
        if (productData.existingImages) {
          try {
            const existingImages = JSON.parse(productData.existingImages);
            productData.images = [...existingImages, ...newImages];
          } catch (e) {
            productData.images = newImages;
          }
        } else {
          productData.images = newImages;
        }
      }

      // Parse JSON fields
      if (productData.specifications) {
        try {
          productData.specifications = JSON.parse(productData.specifications);
        } catch (e) {
          delete productData.specifications;
        }
      }

      if (productData.deliveryCities) {
        try {
          productData.deliveryCities = JSON.parse(productData.deliveryCities);
        } catch (e) {
          delete productData.deliveryCities;
        }
      }

      if (productData.tags) {
        try {
          productData.tags = JSON.parse(productData.tags);
        } catch (e) {
          delete productData.tags;
        }
      }

      // Convert string booleans
      if (productData.availability !== undefined) {
        productData.availability = productData.availability === "true";
      }
      if (productData.customizable !== undefined) {
        productData.customizable = productData.customizable === "true";
      }
      if (productData.featured !== undefined) {
        productData.featured = productData.featured === "true";
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        productData,
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      res.json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update product",
        details: error.message,
      });
    }
  }
);

// Delete product
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach((image) => {
        const imagePath = path.join(__dirname, image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete product",
    });
  }
});

// Import and use routes if they exist
try {
  const adminRoutes = require("./Routes/Admin");
  app.use("/api/admin", adminRoutes);
  console.log("✅ Admin routes loaded");
} catch (error) {
  console.log("⚠️ Admin routes not found, using inline routes");
}

try {
  const whatsappRoutes = require("./Routes/Whatsapp");
  app.use("/api/whatsapp", whatsappRoutes);
  console.log("✅ WhatsApp routes loaded");
} catch (error) {
  console.log("⚠️ WhatsApp routes not found");
}

// ===============================================
// ERROR HANDLING
// ===============================================
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// ===============================================
// START SERVER WITH KEEP-ALIVE SYSTEM
// ===============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🍕 ChatBiz Pizza Automation Server running on port ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
  console.log(`📱 WhatsApp Bot: Running automatically`);
  console.log(`✅ No CORS restrictions - All origins allowed`);
  console.log(`🔓 No authentication required`);

  // Start keep-alive system after server is ready
  setTimeout(() => {
    if (process.env.NODE_ENV === "production") {
      keepRenderAwake();
      console.log("🚀 Keep-alive system activated for 24/7 uptime");
      console.log(
        `⏰ Pinging https://pizza-shop-automation-backend-1.onrender.com/health every 14 minutes`
      );
      console.log(`🎯 Your service will NEVER sleep on Render!`);
    } else {
      console.log("🔧 Keep-alive system disabled in development");
    }
  }, 30000); // Wait 30 seconds before starting keep-alive
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
