// ===============================================
// ROUTES/WHATSAPP.JS - COMPLETE Professional Pizza Shop WhatsApp Automation
// ===============================================
const express = require("express");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const Customer = require("../Models/customer");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// QR Code for WhatsApp Web
client.on("qr", (qr) => {
  console.log("🍕 ChatBiz Pizza Automation QR Code:");
  qrcode.generate(qr, { small: true });
  console.log("📱 Scan this QR code to connect your pizza shop's WhatsApp!");
});

client.on("ready", () => {
  console.log("🚀 ChatBiz Pizza Automation is LIVE!");
  console.log("💰 Your pizza shop is now earning 24/7 with zero staff!");
});

client.on("disconnected", () => {
  console.log("⚠️ WhatsApp disconnected - Reconnecting...");
});

// Main Message Handler
client.on("message", async (message) => {
  try {
    const phoneNumber = message.from.replace("@c.us", "");
    const messageText = message.body.toLowerCase().trim();

    // Skip group messages and status updates
    if (message.from.includes("@g.us") || message.from.includes("status")) {
      return;
    }

    // Check if customer exists in database
    let customer = await Customer.findOne({ phoneNumber });

    // If customer doesn't exist, only respond to "menu" or "hi" commands
    if (!customer) {
      if (
        messageText === "menu" ||
        messageText === "hi" ||
        messageText === "hello" ||
        messageText === "start"
      ) {
        await handleNewCustomer(phoneNumber, message);
      }
      return;
    }

    // For existing customers, check for "0" to go back to main menu
    if (messageText === "0") {
      await handleBackToMainMenu(phoneNumber, message);
      return;
    }

    // Handle "menu" command for existing customers
    if (messageText === "menu" || messageText === "start") {
      await handleExistingCustomerMenu(phoneNumber, message);
      return;
    }

    // Process existing conversations normally
    await processCustomerMessage(customer, messageText, message);
  } catch (error) {
    console.error("❌ Error handling message:", error);
  }
});

// Handle new customer
async function handleNewCustomer(phoneNumber, message) {
  try {
    let customer = await Customer.findOne({ phoneNumber });

    if (!customer) {
      customer = new Customer({
        phoneNumber,
        conversationState: "main_menu",
        currentContext: {
          productId: null,
          productList: [],
          customization: {},
          step: null,
        },
      });
      await customer.save();
      console.log(`✅ New customer registered: ${phoneNumber}`);
    } else {
      customer.conversationState = "main_menu";
      customer.currentContext = {
        productId: null,
        productList: [],
        customization: {},
        step: null,
      };
      await customer.save();
    }

    const welcomeMessage = `🍕 *Welcome to Tony's Pizza Palace!* 🍕
*New York's Finest Artisan Pizzas*

🤖 *Powered by ChatBiz Automation*
*24/7 Service • Zero Wait Time • Perfect Orders*

┌─────────────────────────────┐
│         *🍕 MAIN MENU 🍕*        │ 
└─────────────────────────────┘

1️⃣ 🍕 *Signature Pizzas* 
2️⃣ 🥗 *Fresh Salads & Starters*  
3️⃣ 🥤 *Beverages & Desserts*
4️⃣ 🔥 *Today's Hot Deals*
5️⃣ 🛒 *My Cart & Checkout*
6️⃣ 📞 *Contact & Hours*

🚚 *FREE DELIVERY* on orders $25+ 
⏰ *15-minute pickup* • *30-minute delivery*
💳 *Cash, Card & Digital payments accepted*

*Type any number (1-6) to get started!*

🌟 *Experience the future of pizza ordering*
No waiting, no confusion - just perfect pizza!

💡 Type *"0"* anytime to return to this menu`;

    await message.reply(welcomeMessage);
  } catch (error) {
    console.error("❌ Error handling new customer:", error);
  }
}

// Handle existing customer menu command
async function handleExistingCustomerMenu(phoneNumber, message) {
  try {
    let customer = await Customer.findOne({ phoneNumber });

    customer.conversationState = "main_menu";
    customer.currentContext = {
      productId: null,
      productList: [],
      customization: {},
      step: null,
    };
    await customer.save();

    const menuMessage = `🍕 *Tony's Pizza Palace* 🍕

┌─────────────────────────────┐
│         *🍕 MAIN MENU 🍕*        │ 
└─────────────────────────────┘

1️⃣ 🍕 *Signature Pizzas* 
2️⃣ 🥗 *Fresh Salads & Starters*  
3️⃣ 🥤 *Beverages & Desserts*
4️⃣ 🔥 *Today's Hot Deals*
5️⃣ 🛒 *My Cart & Checkout*
6️⃣ 📞 *Contact & Hours*

*Type any number (1-6) to continue!*

🤖 *ChatBiz Automation:* Instant service, every time!

💡 Type *"0"* anytime to return to this menu`;

    await message.reply(menuMessage);
  } catch (error) {
    console.error("❌ Error handling existing customer menu:", error);
  }
}

// Handle "0" - Back to Main Menu
async function handleBackToMainMenu(phoneNumber, message) {
  try {
    let customer = await Customer.findOne({ phoneNumber });

    if (!customer) return;

    customer.conversationState = "main_menu";
    customer.currentContext = {
      productId: null,
      productList: [],
      customization: {},
      step: null,
    };
    await customer.save();

    const menuMessage = `🍕 *Tony's Pizza Palace* 🍕

┌─────────────────────────────┐
│         *🍕 MAIN MENU 🍕*        │ 
└─────────────────────────────┘

1️⃣ 🍕 *Signature Pizzas* 
2️⃣ 🥗 *Fresh Salads & Starters*  
3️⃣ 🥤 *Beverages & Desserts*
4️⃣ 🔥 *Today's Hot Deals*
5️⃣ 🛒 *My Cart & Checkout*
6️⃣ 📞 *Contact & Hours*

*Type any number (1-6) to continue!*

🚀 *Back to main menu - What would you like to order?*

💡 Type *"0"* anytime to return to this menu`;

    await message.reply(menuMessage);
  } catch (error) {
    console.error("❌ Error handling back to main menu:", error);
  }
}

// Process customer messages based on conversation state
async function processCustomerMessage(customer, messageText, message) {
  try {
    console.log(
      `🔍 Processing message: "${messageText}" | State: ${customer.conversationState}`
    );

    switch (customer.conversationState) {
      case "main_menu":
        await handleMainMenu(customer, messageText, message);
        break;
      case "browsing_pizzas":
        await handlePizzaBrowsing(customer, messageText, message);
        break;
      case "browsing_salads":
        await handleSaladBrowsing(customer, messageText, message);
        break;
      case "browsing_beverages":
        await handleBeverageBrowsing(customer, messageText, message);
        break;
      case "browsing_specials":
        await handleSpecialsBrowsing(customer, messageText, message);
        break;
      case "browsing_pasta":
        await handlePastaBrowsing(customer, messageText, message);
        break;
      case "browsing_appetizers":
        await handleAppetizersBrowsing(customer, messageText, message);
        break;
      case "product_details":
        await handleProductDetails(customer, messageText, message);
        break;
      case "customization":
        await handlePostCartActions(customer, messageText, message);
        break;
      case "cart_view":
        await handleCartView(customer, messageText, message);
        break;
      case "delivery_details":
        await handleDeliveryDetails(customer, messageText, message);
        break;
      default:
        console.log(
          `⚠️ Unknown state: ${customer.conversationState} - Sending main menu`
        );
        await sendMainMenu(customer, message);
        break;
    }
  } catch (error) {
    console.error("❌ Error processing customer message:", error);
    await message.reply(
      '❌ *Something went wrong!*\n\nType *"0"* to return to main menu'
    );
  }
}

// Handle main menu selection
async function handleMainMenu(customer, messageText, message) {
  const choice = messageText.trim();

  switch (choice) {
    case "1":
      customer.conversationState = "browsing_pizzas";
      await customer.save();
      await showPizzaMenu(customer, message);
      break;
    case "2":
      customer.conversationState = "browsing_salads";
      await customer.save();
      await showSaladMenu(customer, message);
      break;
    case "3":
      customer.conversationState = "browsing_beverages";
      await customer.save();
      await showBeverageMenu(customer, message);
      break;
    case "4":
      customer.conversationState = "browsing_specials";
      await customer.save();
      await showSpecialsMenu(customer, message);
      break;
    case "5":
      await showCartAndCheckout(customer, message);
      break;
    case "6":
      await showContactInfo(customer, message);
      break;
    default:
      await message.reply(
        `❌ *Invalid choice!*\n\nPlease select a valid option (1-6) from the menu above 👆\n\n🤖 *ChatBiz:* Our system guides you every step of the way!\n\n💡 Type *"0"* to return to main menu`
      );
      break;
  }
}

// Handle post-cart actions (Continue Shopping, Checkout, View Cart)
async function handlePostCartActions(customer, messageText, message) {
  const choice = messageText.trim();

  console.log(`🛒 Handling post-cart action: ${choice}`);

  switch (choice) {
    case "1":
      // Continue Shopping - go back to main menu
      customer.conversationState = "main_menu";
      customer.currentContext = {};
      await customer.save();
      await sendMainMenu(customer, message);
      break;
    case "2":
      // Proceed to Checkout
      customer.conversationState = "delivery_details";
      customer.currentContext = {};
      await customer.save();
      await requestDeliveryDetails(customer, message);
      break;
    case "3":
      // View Full Cart
      await showCartAndCheckout(customer, message);
      break;
    default:
      await message.reply(
        `❌ *Invalid choice!*\n\nPlease select option 1, 2, or 3 👆\n\n🤖 *ChatBiz:* Choose your next step!\n\n💡 Type *"0"* to return to main menu`
      );
      break;
  }
}

// Show pizza menu
async function showPizzaMenu(customer, message) {
  try {
    const pizzas = await Product.find({
      category: "pizzas",
      availability: true,
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(20);

    let response = `🍕 *SIGNATURE PIZZAS* 🍕

┌─────────────────────────────┐
│    *🔥 FROM OUR BRICK OVEN 🔥*   │
└─────────────────────────────┘

*Hand-tossed • Fresh ingredients • Made to order*
`;

    if (pizzas.length > 0) {
      pizzas.forEach((pizza, index) => {
        const isFeatured = pizza.featured ? "⭐ " : "";
        response += `\n${index + 1}️⃣ ${isFeatured}*${pizza.name}*`;
        response += `\n   💰 Starting at $${pizza.price.toFixed(2)}`;
        response += `\n   📝 ${pizza.description.substring(0, 45)}...`;
        if (pizza.specifications?.spiceLevel) {
          response += `\n   🌶️ ${pizza.specifications.spiceLevel}`;
        }
        response += `\n`;
      });

      if (!customer.currentContext) {
        customer.currentContext = {};
      }
      customer.currentContext.productList = pizzas.map((p) => p._id.toString());
      customer.currentContext.products = pizzas;
    } else {
      response += `\n🔄 *Loading our amazing pizzas...* 
Please check back in a moment!\n`;
    }

    response += `\n${pizzas.length + 1}️⃣ 🍝 *Pasta & Italian Classics*`;
    response += `\n${pizzas.length + 2}️⃣ 🥖 *Appetizers & Sides*`;

    response += `\n\n*Select any number to see details & sizes!* 📏`;
    response += `\n\n🤖 *ChatBiz:* Live menu from restaurant database!`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);

    console.log(
      `📋 Sent pizza menu with ${pizzas.length} items to ${customer.phoneNumber}`
    );
  } catch (error) {
    console.error("❌ Error loading pizza menu:", error);
    await message.reply(
      '❌ *Menu temporarily unavailable*\n\nPlease try again in a moment!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Show salad menu
async function showSaladMenu(customer, message) {
  try {
    const salads = await Product.find({
      category: "salads",
      availability: true,
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(15);

    let response = `🥗 *FRESH SALADS & STARTERS* 🥗

┌─────────────────────────────┐
│     *🌱 FARM TO TABLE 🌱*       │
└─────────────────────────────┘

*Daily fresh • Locally sourced • Healthy choices*
`;

    if (salads.length > 0) {
      salads.forEach((salad, index) => {
        const isFeatured = salad.featured ? "⭐ " : "";
        response += `\n${index + 1}️⃣ ${isFeatured}*${salad.name}*`;
        response += `\n   💰 $${salad.price.toFixed(2)}`;
        response += `\n   🥗 ${salad.description.substring(0, 45)}...`;
        if (salad.specifications?.servings) {
          response += `\n   👥 ${salad.specifications.servings}`;
        }
        response += `\n`;
      });

      if (!customer.currentContext) {
        customer.currentContext = {};
      }
      customer.currentContext.saladList = salads.map((s) => s._id.toString());
      customer.currentContext.salads = salads;
    } else {
      response += `\n🔄 *Loading fresh salads...* 
Our healthy options will be available shortly!\n`;
    }

    response += `\n\n*Select any number to view details & order!* 🛒`;
    response += `\n\n🤖 *ChatBiz:* Real-time inventory from kitchen!`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);

    console.log(
      `🥗 Sent salad menu with ${salads.length} items to ${customer.phoneNumber}`
    );
  } catch (error) {
    console.error("❌ Error loading salad menu:", error);
    await message.reply(
      '❌ *Salad menu temporarily unavailable*\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Show beverage menu
async function showBeverageMenu(customer, message) {
  try {
    const beverages = await Product.find({
      category: "beverages",
      availability: true,
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(15);

    let response = `🥤 *BEVERAGES & DESSERTS* 🥤

┌─────────────────────────────┐
│   *🍹 REFRESH & INDULGE 🍹*     │
└─────────────────────────────┘

*Ice cold drinks • Sweet treats • Perfect pairings*
`;

    if (beverages.length > 0) {
      beverages.forEach((beverage, index) => {
        const isFeatured = beverage.featured ? "⭐ " : "";
        response += `\n${index + 1}️⃣ ${isFeatured}*${
          beverage.name
        }* - $${beverage.price.toFixed(2)}`;
        if (beverage.description) {
          response += `\n   📝 ${beverage.description.substring(0, 40)}...`;
        }
      });

      if (!customer.currentContext) {
        customer.currentContext = {};
      }
      customer.currentContext.beverageList = beverages.map((b) =>
        b._id.toString()
      );
      customer.currentContext.beverages = beverages;
    } else {
      response += `\n🔄 *Loading beverages...* 
Refreshing options coming soon!\n`;
    }

    response += `\n\n*Select any number to view details & order!* 🛒`;
    response += `\n\n🤖 *ChatBiz:* Live beverage inventory!`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);

    console.log(
      `🥤 Sent beverage menu with ${beverages.length} items to ${customer.phoneNumber}`
    );
  } catch (error) {
    console.error("❌ Error loading beverage menu:", error);
    await message.reply(
      '❌ *Beverage menu temporarily unavailable*\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Show specials menu
async function showSpecialsMenu(customer, message) {
  try {
    const specials = await Product.find({
      $or: [
        { category: "specials", availability: true },
        { featured: true, availability: true },
      ],
    })
      .sort({ featured: -1, createdAt: -1 })
      .limit(8);

    let response = `🔥 *TODAY'S HOT DEALS* 🔥

┌─────────────────────────────┐
│    *💥 LIMITED TIME ONLY 💥*    │
└─────────────────────────────┘
`;

    if (specials.length > 0) {
      specials.forEach((special, index) => {
        response += `\n${index + 1}️⃣ *${
          special.name
        }* - $${special.price.toFixed(2)}`;
        response += `\n   📝 ${special.description}`;
        if (special.originalPrice && special.originalPrice > special.price) {
          const savings = special.originalPrice - special.price;
          response += `\n   💰 Save $${savings.toFixed(2)}!`;
        }
        response += `\n`;
      });

      if (!customer.currentContext) {
        customer.currentContext = {};
      }
      customer.currentContext.specialsList = specials.map((s) =>
        s._id.toString()
      );
      customer.currentContext.specials = specials;
    } else {
      // Fallback combos if no database specials
      const defaultSpecials = [
        {
          name: "Family Feast",
          price: 39.99,
          description: "Large pizza + Caesar salad + 4 drinks",
          details: "Perfect for family dinner! Save $12 vs individual items",
        },
        {
          name: "Lunch Express",
          price: 12.99,
          description: "Personal pizza + drink + garlic bread",
          details: "Quick lunch ready in 15 minutes!",
        },
        {
          name: "Date Night Special",
          price: 24.99,
          description: "Medium pizza + Caprese salad + dessert",
          details: "Romantic dining made easy!",
        },
        {
          name: "Game Day Bundle",
          price: 49.99,
          description: "2 Large pizzas + wings + 6 drinks",
          details: "Perfect for watching the game!",
        },
      ];

      defaultSpecials.forEach((special, index) => {
        response += `\n${index + 1}️⃣ *${
          special.name
        }* - $${special.price.toFixed(2)}`;
        response += `\n   📝 ${special.description}`;
        response += `\n   💡 ${special.details}`;
        response += `\n`;
      });

      customer.currentContext.defaultSpecials = defaultSpecials;
    }

    response += `\n*Limited time offers - Order now!* ⏰`;
    response += `\n\n🤖 *ChatBiz:* Best deals updated automatically!`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);

    console.log(
      `🔥 Sent specials menu with ${specials.length || 4} items to ${
        customer.phoneNumber
      }`
    );
  } catch (error) {
    console.error("❌ Error loading specials menu:", error);
    await message.reply(
      '❌ *Specials menu temporarily unavailable*\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Show pasta menu
async function showPastaMenu(customer, message) {
  try {
    const pasta = await Product.find({
      category: "pasta",
      availability: true,
    }).limit(8);

    let response = `🍝 *PASTA & ITALIAN CLASSICS* 🍝

┌─────────────────────────────┐
│    *🇮🇹 AUTHENTIC ITALIAN 🇮🇹*   │
└─────────────────────────────┘
`;

    if (pasta.length > 0) {
      pasta.forEach((item, index) => {
        response += `\n${index + 1}️⃣ *${item.name}* - $${item.price.toFixed(
          2
        )}`;
        response += `\n   📝 ${item.description.substring(0, 40)}...`;
      });

      customer.currentContext.pasta = pasta;
    } else {
      // Fallback items
      const defaultPasta = [
        {
          name: "Spaghetti Carbonara",
          price: 14.99,
          description: "Creamy sauce with bacon & parmesan cheese",
        },
        {
          name: "Fettuccine Alfredo",
          price: 13.99,
          description: "Rich garlic cream sauce with fresh herbs",
        },
        {
          name: "Penne Arrabbiata",
          price: 12.99,
          description: "Spicy tomato sauce with Italian herbs",
        },
        {
          name: "Lasagna Classic",
          price: 16.99,
          description: "Layered with meat sauce & three cheeses",
        },
      ];

      defaultPasta.forEach((item, index) => {
        response += `\n${index + 1}️⃣ *${item.name}* - $${item.price.toFixed(
          2
        )}`;
        response += `\n   📝 ${item.description}`;
      });

      customer.currentContext.pasta = defaultPasta;
    }

    response += `\n\n${(pasta.length || 4) + 1}️⃣ 🔙 *Back to Pizza Menu*`;
    response += `\n\n*Type the number to view details & order!* 🛒`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);
  } catch (error) {
    console.error("❌ Error loading pasta menu:", error);
    await message.reply(
      '❌ *Pasta menu temporarily unavailable*\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Show appetizer menu
async function showAppetizerMenu(customer, message) {
  try {
    const appetizers = await Product.find({
      category: "appetizers",
      availability: true,
    }).limit(8);

    let response = `🥖 *APPETIZERS & SIDES* 🥖

┌─────────────────────────────┐
│   *🍗 PERFECT STARTERS 🍗*      │
└─────────────────────────────┘
`;

    if (appetizers.length > 0) {
      appetizers.forEach((item, index) => {
        response += `\n${index + 1}️⃣ *${item.name}* - $${item.price.toFixed(
          2
        )}`;
        response += `\n   📝 ${item.description.substring(0, 40)}...`;
      });

      customer.currentContext.appetizers = appetizers;
    } else {
      // Fallback items
      const defaultAppetizers = [
        {
          name: "Garlic Bread",
          price: 5.99,
          description: "Warm bread with garlic butter and herbs",
        },
        {
          name: "Cheese Breadsticks",
          price: 7.99,
          description: "Mozzarella-filled breadsticks with marinara",
        },
        {
          name: "Buffalo Wings",
          price: 9.99,
          description: "Spicy wings with ranch dipping sauce",
        },
        {
          name: "Mozzarella Sticks",
          price: 6.99,
          description: "Crispy fried cheese sticks with marinara",
        },
      ];

      defaultAppetizers.forEach((item, index) => {
        response += `\n${index + 1}️⃣ *${item.name}* - $${item.price.toFixed(
          2
        )}`;
        response += `\n   📝 ${item.description}`;
      });

      customer.currentContext.appetizers = defaultAppetizers;
    }

    response += `\n\n${(appetizers.length || 4) + 1}️⃣ 🔙 *Back to Pizza Menu*`;
    response += `\n\n*Type the number to view details & order!* 🛒`;
    response += `\n\n💡 Type *"0"* to return to main menu`;

    await customer.save();
    await message.reply(response);
  } catch (error) {
    console.error("❌ Error loading appetizer menu:", error);
    await message.reply(
      '❌ *Appetizer menu temporarily unavailable*\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Handle pizza browsing
async function handlePizzaBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const products = customer.currentContext?.products || [];

  if (choice >= 1 && choice <= products.length) {
    const selectedPizza = products[choice - 1];
    await showPizzaDetails(customer, selectedPizza, message);
  } else if (choice === products.length + 1) {
    customer.conversationState = "browsing_pasta";
    await customer.save();
    await showPastaMenu(customer, message);
  } else if (choice === products.length + 2) {
    customer.conversationState = "browsing_appetizers";
    await customer.save();
    await showAppetizerMenu(customer, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${
        products.length + 2
      } from the pizza menu 👆\n\n🤖 *ChatBiz:* We guide you to the perfect order!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Handle salad browsing
async function handleSaladBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const salads = customer.currentContext?.salads || [];

  if (choice >= 1 && choice <= salads.length) {
    const selectedSalad = salads[choice - 1];
    await showSaladDetails(customer, selectedSalad, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${salads.length} from the salad menu 👆\n\n🤖 *ChatBiz:* We help you find the perfect salad!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Handle beverage browsing
async function handleBeverageBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const beverages = customer.currentContext?.beverages || [];

  if (choice >= 1 && choice <= beverages.length) {
    const selectedBeverage = beverages[choice - 1];
    await showBeverageDetails(customer, selectedBeverage, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${beverages.length} from the beverage menu 👆\n\n🤖 *ChatBiz:* Perfect drink pairings await!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Handle specials browsing
async function handleSpecialsBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const specials =
    customer.currentContext?.specials ||
    customer.currentContext?.defaultSpecials ||
    [];

  if (choice >= 1 && choice <= specials.length) {
    const selectedSpecial = specials[choice - 1];
    await showSpecialDetails(customer, selectedSpecial, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${specials.length} from the specials menu 👆\n\n🤖 *ChatBiz:* Amazing deals waiting for you!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Handle pasta browsing
async function handlePastaBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const pasta = customer.currentContext?.pasta || [];

  if (choice >= 1 && choice <= pasta.length) {
    const selectedPasta = pasta[choice - 1];
    await showPastaDetails(customer, selectedPasta, message);
  } else if (choice === pasta.length + 1) {
    // Back to pizza menu
    customer.conversationState = "browsing_pizzas";
    await customer.save();
    await showPizzaMenu(customer, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${
        pasta.length + 1
      } from the pasta menu 👆\n\n🤖 *ChatBiz:* Authentic Italian flavors await!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Handle appetizers browsing
async function handleAppetizersBrowsing(customer, messageText, message) {
  const choice = parseInt(messageText.trim());
  const appetizers = customer.currentContext?.appetizers || [];

  if (choice >= 1 && choice <= appetizers.length) {
    const selectedAppetizer = appetizers[choice - 1];
    await showAppetizerDetails(customer, selectedAppetizer, message);
  } else if (choice === appetizers.length + 1) {
    // Back to pizza menu
    customer.conversationState = "browsing_pizzas";
    await customer.save();
    await showPizzaMenu(customer, message);
  } else {
    await message.reply(
      `❌ *Invalid choice!*\n\nPlease select option 1-${
        appetizers.length + 1
      } from the appetizers menu 👆\n\n🤖 *ChatBiz:* Perfect starters for your meal!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Show pizza details with size options
async function showPizzaDetails(customer, pizza, message) {
  customer.conversationState = "product_details";
  customer.currentContext.selectedPizza = {
    _id: pizza._id,
    name: pizza.name,
    basePrice: pizza.price,
    description: pizza.description,
    images: pizza.images,
    specifications: pizza.specifications,
  };
  await customer.save();

  // Send product image first if available
  if (pizza.images && pizza.images.length > 0) {
    await sendProductImage(pizza, message.from);
  }

  const response = `🍕 *${pizza.name.toUpperCase()}* 🍕

┌─────────────────────────────┐
│       *🔥 PIZZA DETAILS 🔥*     │
└─────────────────────────────┘

📝 *Description:*
${pizza.description}

${
  pizza.specifications?.ingredients
    ? `🥬 *Ingredients:* ${pizza.specifications.ingredients}\n`
    : ""
}
${
  pizza.specifications?.preparationTime
    ? `⏰ *Prep Time:* ${pizza.specifications.preparationTime}\n`
    : ""
}
${
  pizza.specifications?.spiceLevel
    ? `🌶️ *Spice Level:* ${pizza.specifications.spiceLevel}\n`
    : ""
}

💰 *SIZE & PRICING:*

1️⃣ *Small (10")* - ${pizza.price.toFixed(2)}
   👥 Perfect for 1-2 people

2️⃣ *Medium (12")* - ${(pizza.price + 4).toFixed(2)}
   👥 Great for 2-3 people

3️⃣ *Large (14")* - ${(pizza.price + 8).toFixed(2)}
   👥 Feeds 3-4 people

4️⃣ *Extra Large (16")* - ${(pizza.price + 12).toFixed(2)}
   👥 Perfect for sharing 4-5 people

5️⃣ *🔙 Back to Pizza Menu*

*Select your preferred size (1-5)!*

🤖 *ChatBiz:* Real-time pricing from restaurant system!

💡 Type *"0"* to return to main menu`;

  await message.reply(response);
  console.log(`🍕 Showed details for ${pizza.name} to ${customer.phoneNumber}`);
}

// Show salad details
async function showSaladDetails(customer, salad, message) {
  try {
    // Send product image first
    if (salad.images && salad.images.length > 0) {
      await sendProductImage(salad, message.from);
    }

    const response = `🥗 *${salad.name.toUpperCase()}* 🥗

┌─────────────────────────────┐
│      *🌱 SALAD DETAILS 🌱*      │
└─────────────────────────────┘

📝 *Description:*
${salad.description}

${
  salad.specifications?.ingredients
    ? `🥬 *Ingredients:* ${salad.specifications.ingredients}\n`
    : ""
}
${
  salad.specifications?.servings
    ? `👥 *Serves:* ${salad.specifications.servings}\n`
    : ""
}
${
  salad.specifications?.allergens
    ? `⚠️ *Allergens:* ${salad.specifications.allergens}\n`
    : ""
}

💰 *Price: ${salad.price.toFixed(2)}*

*What would you like to do?*

1️⃣ ✅ *Add to Cart*
2️⃣ 🔙 *Back to Salad Menu*

*Select an option (1-2)*

🚀 *ChatBiz:* Fresh ingredients, perfect nutrition!

💡 Type *"0"* to return to main menu`;

    await message.reply(response);

    // Update customer state for salad selection
    customer.conversationState = "product_details";
    customer.currentContext.selectedSalad = salad;
    await customer.save();

    console.log(
      `🥗 Showed details for ${salad.name} to ${customer.phoneNumber}`
    );
  } catch (error) {
    console.error("❌ Error showing salad details:", error);
  }
}

// Show beverage details
async function showBeverageDetails(customer, beverage, message) {
  try {
    // Send product image if available
    if (beverage.images && beverage.images.length > 0) {
      await sendProductImage(beverage, message.from);
    }

    const response = `🥤 *${beverage.name.toUpperCase()}* 🥤

┌─────────────────────────────┐
│    *🍹 BEVERAGE DETAILS 🍹*     │
└─────────────────────────────┘

📝 *Description:*
${
  beverage.description ||
  "Refreshing beverage to complement your meal perfectly"
}

${
  beverage.specifications?.servings
    ? `👥 *Size:* ${beverage.specifications.servings}\n`
    : ""
}
${
  beverage.specifications?.ingredients
    ? `🥤 *Contains:* ${beverage.specifications.ingredients}\n`
    : ""
}

💰 *Price: ${beverage.price.toFixed(2)}*

*What would you like to do?*

1️⃣ ✅ *Add to Cart*
2️⃣ 🔙 *Back to Beverage Menu*

*Select an option (1-2)*

🚀 *ChatBiz:* Perfect drink for your perfect meal!

💡 Type *"0"* to return to main menu`;

    await message.reply(response);

    // Update customer state for beverage selection
    customer.conversationState = "product_details";
    customer.currentContext.selectedBeverage = beverage;
    await customer.save();

    console.log(
      `🥤 Showed details for ${beverage.name} to ${customer.phoneNumber}`
    );
  } catch (error) {
    console.error("❌ Error showing beverage details:", error);
  }
}

// Show special details
async function showSpecialDetails(customer, special, message) {
  const response = `🔥 *${special.name.toUpperCase()}* 🔥

┌─────────────────────────────┐
│      *💥 SPECIAL DEAL 💥*       │
└─────────────────────────────┘

📝 *What's Included:*
${special.description}

📖 *Details:*
${special.details || "Limited time offer with amazing savings!"}

${
  special.originalPrice
    ? `🏷️ *Regular Price: ${special.originalPrice.toFixed(2)}*\n`
    : ""
}
💰 *Special Price: ${special.price.toFixed(2)}*
${
  special.originalPrice
    ? `💸 *You Save: ${(special.originalPrice - special.price).toFixed(2)}*\n`
    : ""
}

*What would you like to do?*

1️⃣ ✅ *Add to Cart*
2️⃣ 🔙 *Back to Specials Menu*

*Select an option (1-2)*

🚀 *ChatBiz:* Best deals updated automatically!

💡 Type *"0"* to return to main menu`;

  await message.reply(response);

  // Update customer state for special selection
  customer.conversationState = "product_details";
  customer.currentContext.selectedSpecial = special;
  await customer.save();

  console.log(
    `🔥 Showed special details for ${special.name} to ${customer.phoneNumber}`
  );
}

// Show pasta details
async function showPastaDetails(customer, pasta, message) {
  const response = `🍝 *${pasta.name.toUpperCase()}* 🍝

┌─────────────────────────────┐
│    *🇮🇹 PASTA DETAILS 🇮🇹*       │
└─────────────────────────────┘

📝 *Description:*
${pasta.description}

💰 *Price: ${pasta.price.toFixed(2)}*

*What would you like to do?*

1️⃣ ✅ *Add to Cart*
2️⃣ 🔙 *Back to Pasta Menu*

*Select an option (1-2)*

🚀 *ChatBiz:* Authentic Italian made fresh!

💡 Type *"0"* to return to main menu`;

  await message.reply(response);

  // Update customer state for pasta selection
  customer.conversationState = "product_details";
  customer.currentContext.selectedPasta = pasta;
  await customer.save();

  console.log(
    `🍝 Showed pasta details for ${pasta.name} to ${customer.phoneNumber}`
  );
}

// Show appetizer details
async function showAppetizerDetails(customer, appetizer, message) {
  const response = `🥖 *${appetizer.name.toUpperCase()}* 🥖

┌─────────────────────────────┐
│   *🍗 APPETIZER DETAILS 🍗*     │
└─────────────────────────────┘

📝 *Description:*
${appetizer.description}

💰 *Price: ${appetizer.price.toFixed(2)}*

*What would you like to do?*

1️⃣ ✅ *Add to Cart*
2️⃣ 🔙 *Back to Appetizers Menu*

*Select an option (1-2)*

🚀 *ChatBiz:* Perfect way to start your meal!

💡 Type *"0"* to return to main menu`;

  await message.reply(response);

  // Update customer state for appetizer selection
  customer.conversationState = "product_details";
  customer.currentContext.selectedAppetizer = appetizer;
  await customer.save();

  console.log(
    `🥖 Showed appetizer details for ${appetizer.name} to ${customer.phoneNumber}`
  );
}

// Handle product details (size selection, add to cart)
async function handleProductDetails(customer, messageText, message) {
  const choice = parseInt(messageText.trim());

  // Handle pizza size selection
  if (customer.currentContext.selectedPizza) {
    if (choice >= 1 && choice <= 4) {
      const pizza = customer.currentContext.selectedPizza;
      const sizes = [
        'Small (10")',
        'Medium (12")',
        'Large (14")',
        'Extra Large (16")',
      ];

      const basePrice = Number(pizza.basePrice);
      if (isNaN(basePrice)) {
        console.error(
          `❌ Invalid base price for pizza ${pizza.name}: ${pizza.basePrice}`
        );
        await message.reply(
          '❌ *Price error for this item* \n\nPlease try selecting another item!\n\n💡 Type *"0"* to return to main menu'
        );
        return;
      }

      const prices = [basePrice, basePrice + 4, basePrice + 8, basePrice + 12];
      const selectedSize = sizes[choice - 1];
      const selectedPrice = prices[choice - 1];

      console.log(
        `🍕 Pizza selection: ${pizza.name} - ${selectedSize} - Base: ${basePrice} - Final: ${selectedPrice}`
      );

      await addToCartAndShowOptions(
        customer,
        `${pizza.name} - ${selectedSize}`,
        selectedPrice,
        message
      );
    } else if (choice === 5) {
      customer.conversationState = "browsing_pizzas";
      await customer.save();
      await showPizzaMenu(customer, message);
    }
  }
  // Handle salad selection - IMPROVED PRICE HANDLING
  else if (customer.currentContext.selectedSalad) {
    if (choice === 1) {
      const salad = customer.currentContext.selectedSalad;

      // IMPROVED PRICE PARSING
      let saladPrice = parsePrice(salad.price, salad.name, 12.99);

      await addToCartAndShowOptions(customer, salad.name, saladPrice, message);
    } else if (choice === 2) {
      customer.conversationState = "browsing_salads";
      await customer.save();
      await showSaladMenu(customer, message);
    }
  }
  // Handle beverage selection - IMPROVED PRICE HANDLING
  else if (customer.currentContext.selectedBeverage) {
    if (choice === 1) {
      const beverage = customer.currentContext.selectedBeverage;
      let beveragePrice = parsePrice(beverage.price, beverage.name, 2.99);

      await addToCartAndShowOptions(
        customer,
        beverage.name,
        beveragePrice,
        message
      );
    } else if (choice === 2) {
      customer.conversationState = "browsing_beverages";
      await customer.save();
      await showBeverageMenu(customer, message);
    }
  }
  // Handle special selection - IMPROVED PRICE HANDLING
  else if (customer.currentContext.selectedSpecial) {
    if (choice === 1) {
      const special = customer.currentContext.selectedSpecial;
      let specialPrice = parsePrice(special.price, special.name, 19.99);

      await addToCartAndShowOptions(
        customer,
        special.name,
        specialPrice,
        message
      );
    } else if (choice === 2) {
      customer.conversationState = "browsing_specials";
      await customer.save();
      await showSpecialsMenu(customer, message);
    }
  }
  // Handle pasta selection - IMPROVED PRICE HANDLING
  else if (customer.currentContext.selectedPasta) {
    if (choice === 1) {
      const pasta = customer.currentContext.selectedPasta;
      let pastaPrice = parsePrice(pasta.price, pasta.name, 14.99);

      await addToCartAndShowOptions(customer, pasta.name, pastaPrice, message);
    } else if (choice === 2) {
      customer.conversationState = "browsing_pasta";
      await customer.save();
      await showPastaMenu(customer, message);
    }
  }
  // Handle appetizer selection - IMPROVED PRICE HANDLING
  else if (customer.currentContext.selectedAppetizer) {
    if (choice === 1) {
      const appetizer = customer.currentContext.selectedAppetizer;
      let appetizerPrice = parsePrice(appetizer.price, appetizer.name, 7.99);

      await addToCartAndShowOptions(
        customer,
        appetizer.name,
        appetizerPrice,
        message
      );
    } else if (choice === 2) {
      customer.conversationState = "browsing_appetizers";
      await customer.save();
      await showAppetizerMenu(customer, message);
    }
  }
}

// Add to cart and show options
async function addToCartAndShowOptions(customer, productName, price, message) {
  try {
    if (!customer.cart) {
      customer.cart = { items: [], totalAmount: 0 };
    }

    const cartItem = {
      productName: productName,
      price: price,
      quantity: 1,
      customization: {},
    };

    customer.cart.items.push(cartItem);
    customer.cart.totalAmount += price;

    // Set state to "customization" for post-cart actions
    customer.conversationState = "customization";
    customer.currentContext = {
      lastAddedItem: productName,
    };
    await customer.save();

    let response = `✅ *ADDED TO CART!* ✅

┌─────────────────────────────┐
│     *🛒 ORDER UPDATED 🛒*       │
└─────────────────────────────┘

🍕 *${productName}*
💰 ${price.toFixed(2)}

🛒 *Cart Total: ${customer.cart.totalAmount.toFixed(2)}*

*What would you like to do next?*

1️⃣ 🛒 *Continue Shopping*
2️⃣ 🚚 *Proceed to Checkout*  
3️⃣ 👀 *View Full Cart*

*Select an option (1-3)*

🚀 *ChatBiz:* Order processed instantly - No human needed!

💡 Type *"0"* to return to main menu`;

    await message.reply(response);
    console.log(`🛒 Added ${productName} to cart for ${customer.phoneNumber}`);
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    await message.reply(
      '❌ *Error occurred* \n\nPlease try again!\n\n💡 Type *"0"* to return to main menu'
    );
  }
}

// Send product images
async function sendProductImage(product, phoneNumber) {
  try {
    if (product.images && product.images.length > 0) {
      const image = product.images[0];

      if (image.base64) {
        const media = new MessageMedia(
          image.mimeType || "image/jpeg",
          image.base64,
          `${product.name}.jpg`
        );
        const caption = `🍕 *${
          product.name
        }*\n💰 Starting at ${product.price.toFixed(
          2
        )}\n\n🤖 *ChatBiz Automation*\n📱 Instant ordering, perfect results!`;
        await client.sendMessage(phoneNumber, media, { caption });
        console.log(`📸 Sent image for ${product.name} to ${phoneNumber}`);
      } else if (image.url) {
        const imageUrl = image.url.startsWith("http")
          ? image.url
          : `http://localhost:5000${image.url}`;
        const media = await MessageMedia.fromUrl(imageUrl);
        const caption = `🍕 *${
          product.name
        }*\n💰 Starting at ${product.price.toFixed(
          2
        )}\n\n🤖 *ChatBiz Automation*\n📱 Instant ordering, perfect results!`;
        await client.sendMessage(phoneNumber, media, { caption });
        console.log(`📸 Sent image for ${product.name} to ${phoneNumber}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error sending image for ${product.name}:`, error);
  }
}

// Show cart and checkout
async function showCartAndCheckout(customer, message) {
  let response = `🛒 *YOUR SHOPPING CART* 🛒

┌─────────────────────────────┐
│       *📋 ORDER SUMMARY 📋*     │
└─────────────────────────────┘
`;

  if (customer.cart && customer.cart.items && customer.cart.items.length > 0) {
    response += `\n*Your Delicious Order:*\n`;
    customer.cart.items.forEach((item, index) => {
      response += `\n${index + 1}️⃣ ${item.productName}`;
      response += `\n   💰 ${item.price.toFixed(2)} x ${item.quantity}`;
      response += `\n`;
    });

    response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    response += `\n💰 *TOTAL: ${customer.cart.totalAmount.toFixed(2)}*`;
    response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Add delivery fee info
    const deliveryFee = customer.cart.totalAmount >= 25 ? 0 : 2.99;
    const finalTotal = customer.cart.totalAmount + deliveryFee;

    if (deliveryFee > 0) {
      response += `\n🚚 *Delivery Fee: ${deliveryFee.toFixed(2)}*`;
      response += `\n💡 *FREE delivery on orders $25+*`;
      response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      response += `\n💰 *GRAND TOTAL: ${finalTotal.toFixed(2)}*`;
    } else {
      response += `\n🚚 *Delivery:* FREE! 🎉`;
    }

    response += `\n\n*Ready to complete your order?*`;
    response += `\n\n1️⃣ 🚚 *Proceed to Checkout*`;
    response += `\n2️⃣ 🗑️ *Clear Cart*`;
    response += `\n3️⃣ ➕ *Add More Items*`;

    response += `\n\n🚀 *ChatBiz:* Your order is being processed automatically!`;
  } else {
    response += `\n*Your cart is empty!* 🛒`;
    response += `\n\n*Start your delicious journey:*`;
    response += `\n1️⃣ 🍕 *Browse Signature Pizzas*`;
    response += `\n2️⃣ 🥗 *Browse Fresh Salads*`;
    response += `\n3️⃣ 🥤 *Browse Drinks & Desserts*`;
    response += `\n4️⃣ 🔥 *Check Today's Hot Deals*`;
  }

  response += `\n\n💡 Type *"0"* to return to main menu`;

  customer.conversationState = "cart_view";
  customer.currentContext = {};
  await customer.save();

  await message.reply(response);
  console.log(
    `🛒 Showed cart to ${customer.phoneNumber} - ${
      customer.cart?.items?.length || 0
    } items`
  );
}

// Handle cart view
async function handleCartView(customer, messageText, message) {
  const choice = messageText.trim();

  // Handle normal cart view actions (when cart has items)
  if (customer.cart && customer.cart.items && customer.cart.items.length > 0) {
    switch (choice) {
      case "1":
        // Proceed to Checkout
        customer.conversationState = "delivery_details";
        customer.currentContext = {};
        await customer.save();
        await requestDeliveryDetails(customer, message);
        break;
      case "2":
        // Clear Cart
        customer.cart = { items: [], totalAmount: 0 };
        customer.conversationState = "main_menu";
        customer.currentContext = {};
        await customer.save();
        await message.reply(
          `🗑️ *Cart Cleared Successfully!*\n\n*Ready to start fresh?*\n\nType *"0"* to return to main menu and start ordering! 🛒`
        );
        console.log(`🗑️ Cart cleared for ${customer.phoneNumber}`);
        break;
      case "3":
        // Add More Items - go to main menu
        await sendMainMenu(customer, message);
        break;
      default:
        await message.reply(
          `❌ *Invalid choice!*\n\nPlease select option 1-3 👆\n\n🤖 *ChatBiz:* We're here to help!\n\n💡 Type *"0"* to return to main menu`
        );
        break;
    }
  } else {
    // Handle empty cart view
    switch (choice) {
      case "1":
        customer.conversationState = "browsing_pizzas";
        await customer.save();
        await showPizzaMenu(customer, message);
        break;
      case "2":
        customer.conversationState = "browsing_salads";
        await customer.save();
        await showSaladMenu(customer, message);
        break;
      case "3":
        customer.conversationState = "browsing_beverages";
        await customer.save();
        await showBeverageMenu(customer, message);
        break;
      case "4":
        customer.conversationState = "browsing_specials";
        await customer.save();
        await showSpecialsMenu(customer, message);
        break;
      default:
        await message.reply(
          `❌ *Invalid choice!*\n\nPlease select option 1-4 👆\n\n🤖 *ChatBiz:* Let's find something delicious!\n\n💡 Type *"0"* to return to main menu`
        );
        break;
    }
  }
}

// Request delivery details
async function requestDeliveryDetails(customer, message) {
  const deliveryFee = customer.cart.totalAmount >= 25 ? 0 : 2.99;
  const finalTotal = customer.cart.totalAmount + deliveryFee;

  const response = `🚚 *DELIVERY INFORMATION* 🚚

┌─────────────────────────────┐
│   *📍 COMPLETE YOUR ORDER 📍*   │
└─────────────────────────────┘

💰 *Order Total: ${finalTotal.toFixed(2)}*
${
  deliveryFee > 0
    ? `🚚 *Delivery Fee: ${deliveryFee.toFixed(2)}*`
    : "🚚 *Delivery: FREE! 🎉*"
}

To complete your order, please provide:

*Format (copy and edit):*

Name: [Your Full Name]
Phone: [Your Phone Number]  
Address: [Complete Street Address]
City: [City, State, ZIP]
Notes: [Special delivery instructions]

*Example:*
Name: John Smith
Phone: (555) 123-4567
Address: 123 Main Street, Apt 4B
City: New York, NY 10001
Notes: Ring doorbell twice

🤖 *ChatBiz:* Information processed automatically & securely!

💡 Type *"0"* to return to main menu`;

  await message.reply(response);
  console.log(`📍 Requested delivery details from ${customer.phoneNumber}`);
}

// Handle delivery details and create order
async function handleDeliveryDetails(customer, messageText, message) {
  try {
    const orderId = `TP${Date.now()}`;
    const deliveryFee = customer.cart.totalAmount >= 25 ? 0 : 2.99;
    const finalTotal = customer.cart.totalAmount + deliveryFee;

    const order = new Order({
      orderId,
      customerId: customer._id,
      customerPhone: customer.phoneNumber,
      items: customer.cart.items,
      totalAmount: finalTotal,
      deliveryInfo: {
        recipientName: "Valued Customer",
        recipientPhone: customer.phoneNumber,
        address: messageText,
        city: "Delivery City",
        deliveryDate: new Date(),
        deliveryTime: "30-45 minutes",
        deliveryFee: deliveryFee,
      },
      status: "pending",
      paymentMethod: "cash_on_delivery",
    });

    await order.save();

    // Add to customer order history
    customer.orderHistory.push({
      orderId,
      date: new Date(),
      amount: finalTotal,
      status: "pending",
    });

    // Clear cart
    customer.cart = { items: [], totalAmount: 0 };
    customer.conversationState = "main_menu";
    customer.currentContext = {};
    await customer.save();

    const confirmationMessage = `✅ *ORDER CONFIRMED!* ✅

┌─────────────────────────────┐
│    *🎉 ORDER CONFIRMATION 🎉*   │
└─────────────────────────────┘

🎊 *Thank you for choosing Tony's Pizza Palace!*

📋 *Order Details:*
🆔 Order ID: *${orderId}*
💰 Total: *${finalTotal.toFixed(2)}*
📞 Phone: *${customer.phoneNumber}*
📍 Address: ${messageText}
⏰ Estimated Delivery: *30-45 minutes*
💳 Payment: *Cash on Delivery*

🚀 *CHATBIZ AUTOMATION SUCCESS!*

*Your complete order was processed automatically:*
✅ Zero human staff involvement
✅ Instant order confirmation  
✅ Real-time kitchen notification
✅ Automatic order tracking
✅ Professional customer experience

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *Want ChatBiz automation for YOUR pizza shop?*

🌐 Website: *www.chatbiz.site*
📱 WhatsApp: *+92-3329934858*
📧 Email: *chatbiz50@gmail.com*

*Transform your pizza business today!*
*Eliminate staff costs • Handle unlimited orders • 24/7 operations*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Type *"MENU"* to order again!
💡 Type *"0"* to return to main menu

🍕 *Enjoy your delicious pizza!* 🍕`;

    await message.reply(confirmationMessage);
    console.log(
      `✅ Order ${orderId} confirmed for ${
        customer.phoneNumber
      } - Total: ${finalTotal.toFixed(2)}`
    );
  } catch (error) {
    console.error("❌ Error creating order:", error);
    await message.reply(
      `❌ Sorry, there was an error processing your order.\n\nPlease try again!\n\n💡 Type *"0"* to return to main menu`
    );
  }
}

// Show contact info
async function showContactInfo(customer, message) {
  const response = `📞 *TONY'S PIZZA PALACE* 📞

┌─────────────────────────────┐
│   *🏪 RESTAURANT INFO 🏪*       │
└─────────────────────────────┘

🏪 *Location & Hours:*
📍 123 Broadway Ave, New York, NY 10001
📞 Phone: (555) PIZZA-NY
🕐 Hours: Mon-Sun 11AM-11PM
🚚 Free delivery: Manhattan, Brooklyn & Queens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *THIS IS A CHATBIZ DEMO PIZZA SHOP*
*Showcasing complete WhatsApp automation for pizza businesses!*

*Real Benefits for Pizza Shop Owners:*
💰 Eliminate WhatsApp staff costs (Save $3,000+/month)
📈 Handle unlimited orders simultaneously  
🕐 24/7 automated operations
❌ Zero missed orders or human errors
⭐ Professional customer experience
📊 Real-time order management dashboard
📋 Automatic inventory tracking
📈 Customer analytics & insights
🔔 Instant order notifications to kitchen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 *GET CHATBIZ FOR YOUR PIZZA SHOP!*

🌐 Website: *www.chatbiz.site*
📱 WhatsApp: *+92-3329934858*
📧 Email: *orders@chatbiz.site*

*Join 500+ pizza shops already using ChatBiz automation!*
*Free setup • Quick integration • Proven results*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Type *"MENU"* to continue demo
💡 Type *"0"* for main menu`;

  await message.reply(response);
  console.log(`📞 Sent contact info to ${customer.phoneNumber}`);
}

// Send main menu
async function sendMainMenu(customer, message) {
  customer.conversationState = "main_menu";
  customer.currentContext = {
    productId: null,
    productList: [],
    customization: {},
    step: null,
  };
  await customer.save();

  const menuMessage = `🍕 *Tony's Pizza Palace* 🍕

┌─────────────────────────────┐
│         *🍕 MAIN MENU 🍕*        │ 
└─────────────────────────────┘

1️⃣ 🍕 *Signature Pizzas* 
2️⃣ 🥗 *Fresh Salads & Starters*  
3️⃣ 🥤 *Beverages & Desserts*
4️⃣ 🔥 *Today's Hot Deals*
5️⃣ 🛒 *My Cart & Checkout*
6️⃣ 📞 *Contact & Hours*

*Type any number (1-6) to continue!*

🚀 *ChatBiz:* Seamless automation, perfect results!

💡 Type *"0"* anytime to return to this menu`;

  await message.reply(menuMessage);
}

// Helper function to parse and validate prices
function parsePrice(price, itemName, defaultPrice = 9.99) {
  let parsedPrice;

  console.log(
    `💰 Parsing price for ${itemName}: ${price} (type: ${typeof price})`
  );

  if (typeof price === "number") {
    parsedPrice = price;
  } else if (typeof price === "string") {
    // Remove currency symbols, spaces, and convert to number
    parsedPrice = parseFloat(price.replace(/[$,\s]/g, ""));
  } else {
    parsedPrice = defaultPrice;
    console.log(`🔧 Using default price for ${itemName}: ${defaultPrice}`);
  }

  // Final validation
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    console.error(
      `❌ Invalid price for ${itemName}: ${price} -> ${parsedPrice}`
    );
    parsedPrice = defaultPrice;
    console.log(`🔧 Fallback to default price: ${defaultPrice}`);
  }

  console.log(`✅ Final price for ${itemName}: ${parsedPrice}`);
  return parsedPrice;
}

// Initialize the WhatsApp client when the module loads
client.initialize().catch(console.error);

// Export the router
module.exports = router;
