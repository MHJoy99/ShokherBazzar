
export const config = {
    siteName: "Steam Bazaar",
    siteDescription: "Bangladesh's #1 Digital Game Store. Buy Steam Wallet, Google Play, and Game Codes with bKash/Nagad.",
    currency: "৳",
    payment: {
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
