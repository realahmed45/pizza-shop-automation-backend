// ===============================================
// ROUTES/ADMIN.JS - Complete Admin Routes (NO AUTHENTICATION)
// ===============================================
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Customer = require("../Models/customer"); // Capital M for Models folder
const Product = require("../Models/Product"); // Capital M for Models folder
const Order = require("../Models/Order"); // Capital M for Models folder

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDir = "uploads/products";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
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
// DASHBOARD OVERVIEW (NO AUTH REQUIRED)
// ===============================================
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Basic Stats
    const stats = {
      totalCustomers: await Customer.countDocuments(),
      totalOrders: await Order.countDocuments(),
      todayOrders: await Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      weeklyOrders: await Order.countDocuments({
        createdAt: { $gte: startOfWeek },
      }),
      monthlyOrders: await Order.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
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
      weeklyRevenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]).then((result) => result[0]?.total || 0),
      monthlyRevenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]).then((result) => result[0]?.total || 0),
      pendingOrders: await Order.countDocuments({ status: "pending" }),
      confirmedOrders: await Order.countDocuments({ status: "confirmed" }),
      deliveredOrders: await Order.countDocuments({ status: "delivered" }),
      totalProducts: await Product.countDocuments(),
      activeProducts: await Product.countDocuments({ availability: true }),
      lowStockProducts: await Product.countDocuments({ stock: { $lt: 10 } }),
    };

    // Recent orders with customer details
    const recentOrders = await Order.find()
      .populate("customerId", "name phoneNumber")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Daily sales chart data (last 7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
      ]);

      salesData.push({
        date: date.toISOString().split("T")[0],
        revenue: dayData[0]?.revenue || 0,
        orders: dayData[0]?.orders || 0,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent customers
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name phoneNumber orderHistory createdAt")
      .lean();

    res.json({
      success: true,
      stats,
      recentOrders,
      salesData,
      topProducts,
      ordersByStatus,
      recentCustomers,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      message: error.message,
    });
  }
});

// ===============================================
// CUSTOMER MANAGEMENT (NO AUTH REQUIRED)
// ===============================================

// Get all customers with pagination and search
router.get("/customers", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const customers = await Customer.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select(
        "phoneNumber name email orderHistory cart createdAt conversationState"
      )
      .lean();

    // Add calculated fields
    const customersWithStats = customers.map((customer) => ({
      ...customer,
      totalOrders: customer.orderHistory?.length || 0,
      totalSpent:
        customer.orderHistory?.reduce(
          (sum, order) => sum + (order.amount || 0),
          0
        ) || 0,
      lastOrderDate:
        customer.orderHistory?.length > 0
          ? customer.orderHistory[customer.orderHistory.length - 1].date
          : null,
      cartValue: customer.cart?.totalAmount || 0,
      cartItems: customer.cart?.items?.length || 0,
    }));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers: customersWithStats,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customers",
    });
  }
});

// Get customer details by ID
router.get("/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Get customer's orders
    const orders = await Order.find({ customerId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate customer stats
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) /
            orders.length
          : 0,
      lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
      favoriteCategory: null, // Could be calculated from order items
      cartValue: customer.cart?.totalAmount || 0,
    };

    res.json({
      success: true,
      customer,
      orders,
      stats,
    });
  } catch (error) {
    console.error("Get customer details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer details",
    });
  }
});

// Update customer information
router.put("/customers/:id", async (req, res) => {
  try {
    const { name, email, notes } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, notes },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update customer",
    });
  }
});

// ===============================================
// ORDER MANAGEMENT (NO AUTH REQUIRED)
// ===============================================

// Get all orders with filters and pagination
router.get("/orders", async (req, res) => {
  try {
    const {
      status,
      city,
      page = 1,
      limit = 20,
      startDate,
      endDate,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // City filter
    if (city && city !== "all") {
      query["deliveryInfo.city"] = city;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { "deliveryInfo.recipientName": { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const orders = await Order.find(query)
      .populate("customerId", "name phoneNumber")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
});

// Get order details by ID
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name phoneNumber email")
      .populate("items.productId", "name category images")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order details",
    });
  }
});

// Update order status
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    order.status = status;
    if (notes) order.notes = notes;
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
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

// Update order details
router.put("/orders/:id", async (req, res) => {
  try {
    const { deliveryInfo, paymentInfo, notes } = req.body;

    const updateData = { updatedAt: new Date() };
    if (deliveryInfo) updateData.deliveryInfo = deliveryInfo;
    if (paymentInfo) updateData.paymentInfo = paymentInfo;
    if (notes) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("customerId", "name phoneNumber");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order",
    });
  }
});

// ===============================================
// PRODUCT MANAGEMENT (NO AUTH REQUIRED)
// ===============================================

// Get all products with filters
router.get("/products", async (req, res) => {
  try {
    const {
      category,
      availability,
      featured,
      search = "",
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Availability filter
    if (availability !== undefined) {
      query.availability = availability === "true";
    }

    // Featured filter
    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
});

// Get product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
});

// Add new product
router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        alt: productData.name || "Product image",
      }));
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
router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        alt: productData.name || "Product image",
      }));

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
});

// Delete product
router.delete("/products/:id", async (req, res) => {
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
        const imagePath = path.join(__dirname, "..", image.url);
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

// ===============================================
// TEST ENDPOINTS (NO AUTH REQUIRED)
// ===============================================

// Test endpoint to check if API is working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
