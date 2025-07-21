// ===============================================
// SEED ADMIN SCRIPT - seedAdmin.js
// ===============================================
const mongoose = require("mongoose");
require("dotenv").config();

// Import models with correct paths
const Admin = require("./Models/Admin"); // Capital M for Models folder
const Product = require("./Models/Product"); // Capital M for Models folder

// Sample products for demo
const sampleProducts = [
  {
    name: "Red Roses Bouquet Premium",
    category: "flowers",
    subcategory: "roses",
    description:
      "Beautiful premium red roses arranged in an elegant bouquet. Perfect for expressing love and romance. Includes 12 fresh red roses with baby's breath and greenery.",
    price: 3500,
    originalPrice: 4000,
    images: [
      { url: "/uploads/products/red-roses-1.jpg", alt: "Red Roses Bouquet" },
    ],
    availability: true,
    stock: 25,
    specifications: {
      dimensions: "30cm height x 25cm width",
      flowerTypes: ["Red Roses", "Baby's Breath", "Eucalyptus"],
      occasion: ["Valentine's Day", "Anniversary", "Love", "Romance"],
    },
    customizable: true,
    customizationOptions: {
      messageCard: true,
      specialInstructions: true,
    },
    deliveryCities: [
      {
        city: "Lahore",
        areas: ["DHA", "Gulberg", "Johar Town"],
        sameDayAvailable: true,
      },
      {
        city: "Karachi",
        areas: ["Clifton", "Defence", "Gulshan"],
        sameDayAvailable: true,
      },
      {
        city: "Islamabad",
        areas: ["F-6", "F-7", "Blue Area"],
        sameDayAvailable: true,
      },
    ],
    tags: ["roses", "red", "romance", "premium", "valentine"],
    featured: true,
    rating: { average: 4.8, count: 124 },
  },
  {
    name: "Chocolate Truffle Cake 2lbs",
    category: "cakes",
    subcategory: "chocolate",
    description:
      "Rich and decadent chocolate truffle cake layered with premium chocolate ganache. Moist chocolate sponge with smooth truffle filling. Serves 8-10 people.",
    price: 4500,
    originalPrice: 5000,
    images: [
      {
        url: "/uploads/products/chocolate-cake-1.jpg",
        alt: "Chocolate Truffle Cake",
      },
    ],
    availability: true,
    stock: 15,
    specifications: {
      weight: "2 lbs",
      servings: "8-10 people",
      dimensions: "8 inch round",
    },
    customizable: true,
    customizationOptions: {
      messageCard: true,
      cakeMessage: true,
      specialInstructions: true,
    },
    deliveryCities: [
      {
        city: "Lahore",
        areas: ["DHA", "Gulberg", "Johar Town"],
        sameDayAvailable: true,
      },
      {
        city: "Karachi",
        areas: ["Clifton", "Defence", "Gulshan"],
        sameDayAvailable: true,
      },
      {
        city: "Islamabad",
        areas: ["F-6", "F-7", "Blue Area"],
        sameDayAvailable: true,
      },
    ],
    tags: ["chocolate", "cake", "birthday", "celebration", "truffle"],
    featured: true,
    rating: { average: 4.9, count: 87 },
  },
  {
    name: "Love & Romance Combo",
    category: "combos",
    subcategory: "romantic",
    description:
      "Perfect romantic combo featuring 6 red roses, heart-shaped chocolate cake (1lb), and a cuddly teddy bear. Complete package for expressing your love.",
    price: 6500,
    originalPrice: 7500,
    images: [
      { url: "/uploads/products/love-combo-1.jpg", alt: "Love Romance Combo" },
    ],
    availability: true,
    stock: 20,
    specifications: {
      dimensions: "Gift box 40cm x 30cm",
      weight: "2.5 kg total",
    },
    customizable: true,
    customizationOptions: {
      messageCard: true,
      cakeMessage: true,
      specialInstructions: true,
    },
    deliveryCities: [
      {
        city: "Lahore",
        areas: ["DHA", "Gulberg", "Johar Town"],
        sameDayAvailable: true,
      },
      {
        city: "Karachi",
        areas: ["Clifton", "Defence"],
        sameDayAvailable: true,
      },
      { city: "Islamabad", areas: ["F-6", "F-7"], sameDayAvailable: true },
    ],
    tags: ["combo", "romantic", "valentine", "anniversary", "love"],
    featured: true,
    rating: { average: 4.7, count: 156 },
  },
  {
    name: "Mixed Flowers Basket",
    category: "flowers",
    subcategory: "mixed",
    description:
      "Colorful arrangement of seasonal flowers in a beautiful wicker basket. Includes roses, gerberas, lilies and chrysanthemums with fresh greenery.",
    price: 4200,
    originalPrice: 4800,
    images: [
      {
        url: "/uploads/products/mixed-basket-1.jpg",
        alt: "Mixed Flowers Basket",
      },
    ],
    availability: true,
    stock: 18,
    specifications: {
      dimensions: "35cm height x 30cm width",
      flowerTypes: ["Roses", "Gerberas", "Lilies", "Chrysanthemums"],
      occasion: ["Birthday", "Get Well Soon", "Congratulations", "Thank You"],
    },
    customizable: true,
    deliveryCities: [
      {
        city: "Lahore",
        areas: ["DHA", "Gulberg", "Johar Town"],
        sameDayAvailable: true,
      },
      {
        city: "Karachi",
        areas: ["Clifton", "Defence"],
        sameDayAvailable: false,
      },
      { city: "Islamabad", areas: ["F-6", "F-7"], sameDayAvailable: true },
    ],
    tags: ["mixed", "basket", "colorful", "birthday", "celebration"],
    featured: false,
    rating: { average: 4.6, count: 78 },
  },
];

async function seedData() {
  try {
    console.log("🌸 Starting The Flower Studio data seeding...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/flowerstudio",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");

    // Create admin user
    console.log("👤 Creating admin user...");
    const existingAdmin = await Admin.findOne({ username: "admin" });
    if (!existingAdmin) {
      const admin = new Admin({
        username: "admin",
        password: "admin12",
        email: "admin@theflowerstudio.pk",
        role: "admin",
        permissions: {
          dashboard: true,
          customers: true,
          orders: true,
          products: true,
          analytics: true,
          settings: true,
        },
      });

      await admin.save();
      console.log("✅ Admin user created successfully!");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create sample products
    console.log("📦 Creating sample products...");
    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      await Product.insertMany(sampleProducts);
      console.log(
        `✅ ${sampleProducts.length} sample products created successfully!`
      );
    } else {
      console.log(
        `ℹ️  Products already exist (${existingProducts} products found)`
      );
    }

    console.log("");
    console.log("🎉 THE FLOWER STUDIO AUTOMATION SYSTEM IS READY!");
    console.log("================================================");
    console.log("");
    console.log("🔐 ADMIN LOGIN CREDENTIALS:");
    console.log("   Username: admin");
    console.log("   Password: admin12");
    console.log("   Email: admin@theflowerstudio.pk");
    console.log("");
    console.log("🌐 ACCESS POINTS:");
    console.log("   Admin Dashboard: http://localhost:5000/admin");
    console.log("   API Base URL: http://localhost:5000/api/admin");
    console.log("");
    console.log("🤖 WHATSAPP BOT SETUP:");
    console.log("   1. Start the server: npm run dev");
    console.log("   2. Scan QR code that appears in terminal");
    console.log('   3. Send "Hi" to your WhatsApp number');
    console.log("   4. Bot will respond with flower menu!");
    console.log("");
    console.log("🎯 DEMO FLOW:");
    console.log("   1. Admin logs into dashboard");
    console.log("   2. Adds new flower products with images");
    console.log('   3. Customer texts "Hi" to WhatsApp');
    console.log("   4. Bot shows updated product list");
    console.log("   5. Customer browses, orders automatically");
    console.log("   6. Admin sees orders in real-time!");
    console.log("");
    console.log("✨ Perfect for impressing your client! ✨");
    console.log("================================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
