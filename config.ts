
export const config = {
    siteName: "Steam Bazaar",
    siteDescription: "Bangladesh's #1 Digital Game Store. Buy Steam Wallet, Google Play, and Game Codes with bKash/Nagad.",
    currency: "৳",
    payment: {
      bkashPersonal: "01700-000000", // CHANGE THIS
      nagadPersonal: "01800-000000", // CHANGE THIS
      rocketPersonal: "01900-000000", // CHANGE THIS
      manualInstructions: "Go to your bKash/Nagad App, select 'Send Money', and transfer the total amount to the number below. Copy the TrxID and paste it here."
    },
    contact: {
      phone: "+880 1700-000000",
      email: "admin@mhjoygamershub.com",
      whatsapp: "https://wa.me/8801700000000"
    },
    social: {
      facebook: "https://facebook.com",
      discord: "https://discord.gg",
      instagram: "https://instagram.com"
    },
    api: {
        // If you set this to true, the app will try to hit the real WooCommerce API defined in core.tsx
        // If false, it uses mock data.
        useRealApi: true 
    },
    // EDIT YOUR HOME PAGE PLATFORM BUTTONS HERE
    platformCategories: [
      { name: "Steam", icon: "fab fa-steam", color: "from-blue-600 to-blue-900", slug: "steam" },
      { name: "PlayStation", icon: "fab fa-playstation", color: "from-indigo-600 to-indigo-900", slug: "playstation" },
      { name: "Xbox", icon: "fab fa-xbox", color: "from-green-600 to-green-900", slug: "xbox" },
      { name: "Google Play", icon: "fab fa-google-play", color: "from-rose-600 to-rose-900", slug: "google-play" },
      { name: "PC Games", icon: "fas fa-desktop", color: "from-purple-600 to-purple-900", slug: "pc-games" },
      { name: "Top Ups", icon: "fas fa-gem", color: "from-yellow-500 to-yellow-800", slug: "top-up" },
    ]
  };
