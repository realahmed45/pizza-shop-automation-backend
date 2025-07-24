// ===============================================
// MODELS/CUSTOMER.JS - UPDATED Customer Schema with All Restaurant States
// ===============================================
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    conversationState: {
      type: String,
      default: "initial",
      enum: [
        "initial",
        "main_menu",
        "browsing_flowers",
        "browsing_cakes",
        "browsing_gifts",
        "browsing_combos",
        // RESTAURANT STATES
        "browsing_pizzas",
        "browsing_salads",
        "browsing_beverages",
        "browsing_specials",
        "browsing_appetizers", // ADDED
        "browsing_desserts",
        "browsing_pasta", // ADDED
        // COMMON STATES
        "product_details",
        "customization", // CRITICAL: This handles post-cart actions
        "delivery_details",
        "cart_view",
        "payment",
        "order_confirmation",
      ],
    },
    currentContext: {
      categoryId: String,
      productId: String,
      productList: [String],
      products: [mongoose.Schema.Types.Mixed], // Store actual product objects
      selectedPizza: {
        _id: String,
        name: String,
        basePrice: Number,
        description: String,
        images: [mongoose.Schema.Types.Mixed],
        specifications: mongoose.Schema.Types.Mixed,
      },
      selectedSalad: mongoose.Schema.Types.Mixed, // ADDED
      selectedBeverage: mongoose.Schema.Types.Mixed, // ADDED
      selectedSpecial: mongoose.Schema.Types.Mixed, // ADDED
      selectedPasta: mongoose.Schema.Types.Mixed, // ADDED
      selectedAppetizer: mongoose.Schema.Types.Mixed, // ADDED
      salads: [mongoose.Schema.Types.Mixed],
      beverages: [mongoose.Schema.Types.Mixed],
      specials: [mongoose.Schema.Types.Mixed], // ADDED
      pasta: [mongoose.Schema.Types.Mixed], // ADDED
      appetizers: [mongoose.Schema.Types.Mixed], // ADDED
      defaultSpecials: [mongoose.Schema.Types.Mixed], // ADDED
      saladList: [String],
      beverageList: [String],
      specialsList: [String], // ADDED
      lastAddedItem: String, // ADDED for tracking
      customization: {
        message: String,
        cardMessage: String,
        specialInstructions: String,
      },
      deliveryInfo: {
        city: String,
        area: String,
        address: String,
        recipientName: String,
        recipientPhone: String,
        deliveryDate: Date,
        deliveryTime: String,
      },
      step: String,
    },
    cart: {
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
          imageBase64: String,
          imageMimeType: String,
        },
      ],
      totalAmount: {
        type: Number,
        default: 0,
      },
    },
    orderHistory: [
      {
        orderId: String,
        date: Date,
        amount: Number,
        status: String,
        items: Array,
      },
    ],
    preferences: {
      favoriteCity: String,
      frequentOrders: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
