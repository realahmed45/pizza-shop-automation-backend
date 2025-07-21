// ===============================================
// MODELS/PRODUCT.JS - Updated for Restaurant Categories
// ===============================================
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        // ORIGINAL CATEGORIES (keep for backward compatibility)
        "flowers",
        "cakes",
        "gifts",
        "combos",
        "plants",
        // NEW RESTAURANT CATEGORIES
        "pizzas",
        "salads",
        "beverages",
        "appetizers",
        "desserts",
        "pasta",
        "sandwiches",
        "specials",
        "sides",
        "entrees",
        "soups",
      ],
    },
    subcategory: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    images: [
      {
        url: String, // File path for server reference
        base64: String, // Base64 data for WhatsApp
        alt: String,
        mimeType: String, // image/jpeg, image/png, etc.
      },
    ],
    availability: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 100,
    },
    specifications: {
      dimensions: String,
      weight: String,
      servings: String, // For food items
      flowerTypes: [String], // For flowers (backward compatibility)
      occasion: [String], // birthday, anniversary, etc.
      // NEW RESTAURANT SPECIFICATIONS
      ingredients: String, // For food items
      allergens: String, // For food allergen info
      calories: Number, // Nutritional info
      preparationTime: String, // Cooking time
      spiceLevel: String, // Mild, Medium, Hot
      dietaryInfo: [String], // Vegetarian, Vegan, Gluten-Free
    },
    customizable: {
      type: Boolean,
      default: true,
    },
    customizationOptions: {
      messageCard: Boolean,
      cakeMessage: Boolean,
      specialInstructions: Boolean,
      // NEW RESTAURANT CUSTOMIZATIONS
      sizeOptions: [String], // Small, Medium, Large
      toppings: [String], // Extra cheese, pepperoni, etc.
      cookingPreference: [String], // Well-done, medium, etc.
      spiceLevel: [String], // Mild, medium, hot
    },
    deliveryCities: [
      {
        city: String,
        areas: [String],
        sameDayAvailable: Boolean,
      },
    ],
    tags: [String],
    featured: {
      type: Boolean,
      default: false,
    },
    rating: {
      average: {
        type: Number,
        default: 5.0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    // NEW RESTAURANT-SPECIFIC FIELDS
    nutritionalInfo: {
      calories: Number,
      protein: String,
      carbs: String,
      fat: String,
      fiber: String,
    },
    menuSection: {
      type: String,
      enum: ["starters", "mains", "desserts", "drinks", "specials"],
      default: "mains",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
