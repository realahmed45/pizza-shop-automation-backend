// MODELS/ORDER.JS - Order Schema
// ===============================================
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: String,
        price: Number,
        quantity: Number,
        customization: {
          message: String,
          cardMessage: String,
          specialInstructions: String,
        },
        imageUrl: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryInfo: {
      recipientName: {
        type: String,
        required: true,
      },
      recipientPhone: String,
      city: {
        type: String,
        required: true,
      },
      area: String,
      address: {
        type: String,
        required: true,
      },
      deliveryDate: {
        type: Date,
        required: true,
      },
      deliveryTime: String,
      specialInstructions: String,
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ["cash_on_delivery", "card", "bank_transfer"],
        default: "cash_on_delivery",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      transactionId: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    timeline: [
      {
        status: String,
        timestamp: Date,
        notes: String,
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Generate unique order ID
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderId = `FS${dateStr}${randomNum}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
