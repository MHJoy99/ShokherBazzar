
export const config = {
    siteName: "MHJoyGamersHub",
    siteDescription: "Bangladesh's #1 Digital Game Store. Buy Steam Wallet, Google Play, and Game Codes with bKash/Nagad.",
    currency: "৳",
    
    // CENTRALIZED PRICING CONTROL
    pricing: {
        baseRate: 135,       // Default Rate (Updated to your preference)
        profitMarginPercent: 1, // 1% Margin
        // Legacy fields removed to prevent confusion
    },

    payment: {
      // The Title shown in WordPress Admin Order List
      methodTitle: "Bangladeshi Payment", 
      
      // EDIT YOUR PERSONAL NUMBERS HERE
      bkashPersonal: "01983888331", 
      nagadPersonal: "01983888331", 
      rocketPersonal: "0000-000000", 
      manualInstructions: "Go to your bKash/Nagad/Rocket App, select 'Send Money', and transfer the total amount to one of the numbers below. Copy the TrxID and paste it here."
    },
    contact: {
      phone: "+880 1983888331",
      email: "admin@mhjoygamershub.com",
      whatsapp: "https://wa.me/01983888331"
    },
    social: {
      facebook: "https://facebook.com/mhjoygamershub",
      discord: "https://discord.gg/zfGgdv4cWu",
      instagram: "https://instagram.com/mhjoygamershub"
    },
    api: {
        // If you set this to true, the app will try to hit the real WooCommerce API defined in lib/api.ts
        // If false, it uses mock data.
        useRealApi: true 
    },

    // -------------------------------------------------------------------------
    // HOMEPAGE PLATFORM BUTTONS CONFIGURATION
    // -------------------------------------------------------------------------
    // To link a button to a specific product:
    // Add a 'customLink' property like this: customLink: "/product/your-product-slug"
    //
    // To link to a category page:
    // Just ensure 'slug' matches the category slug (e.g. slug: "xbox" -> /category/xbox)
    // -------------------------------------------------------------------------
    platformCategories: [
      { 
        name: "Steam", 
        icon: "fab fa-steam", 
        color: "from-blue-600 to-blue-900", 
        slug: "steam",
        // UPDATED LINK HERE:
        customLink: "/product/steam-wallet-code-global-usd" 
      },
      { name: "PlayStation", icon: "fab fa-playstation", color: "from-indigo-600 to-indigo-900", slug: "playstation" },
      { name: "Xbox", icon: "fab fa-xbox", color: "from-green-600 to-green-900", slug: "xbox" },
      { name: "Google Play", icon: "fab fa-google-play", color: "from-rose-600 to-rose-900", slug: "google-play" },
      { name: "PC Games", icon: "fas fa-desktop", color: "from-purple-600 to-purple-900", slug: "pc-games" },
      { name: "Top Ups", icon: "fas fa-gem", color: "from-yellow-500 to-yellow-800", slug: "top-up" },
    ]
  };
