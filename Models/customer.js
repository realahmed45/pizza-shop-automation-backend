// ===============================================
// MODELS/CUSTOMER.JS - Updated Customer Schema with Restaurant States
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
        // NEW RESTAURANT STATES
        "browsing_pizzas",
        "browsing_salads",
        "browsing_beverages",
        "browsing_specials",
        "browsing_appetizers",
        "browsing_desserts",
        "browsing_pasta",
        // COMMON STATES
        "product_details",
        "customization",
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
      },
      salads: [mongoose.Schema.Types.Mixed],
      beverages: [mongoose.Schema.Types.Mixed],
      saladList: [String],
      beverageList: [String],
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
