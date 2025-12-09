
import { Product, Category, Order, User } from '../types';
import { config } from '../config';

// --- MOCK DATA ---
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Action', slug: 'action', count: 120 },
  { id: 2, name: 'RPG', slug: 'rpg', count: 85 },
  { id: 3, name: 'Strategy', slug: 'strategy', count: 45 },
  { id: 4, name: 'Simulation', slug: 'simulation', count: 30 },
  { id: 5, name: 'Sports', slug: 'sports', count: 25 },
  { id: 6, name: 'Gift Cards', slug: 'gift-cards', count: 15 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 103,
    name: "Steam Wallet Code (BDT)",
    slug: "steam-wallet-bdt",
    price: "600",
    regular_price: "600",
    sale_price: "",
    on_sale: false,
    short_description: "Warning: This code is valid for Bangladesh Steam accounts only.",
    description: "Steam Gift Cards and Wallet Codes are an easy way to put money into your own Steam Wallet.",
    images: [{ id: 3, src: "https://picsum.photos/400/500?random=3", alt: "Steam Card" }],
    categories: [{ id: 6, name: "Gift Cards", slug: "gift-cards" }],
    tags: [{ id: 3, name: "Region: BD", slug: "region-bd" }],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 999,
    average_rating: "5.0",
    rating_count: 5000,
    platform: "Steam",
    type: "variable",
    featured: true,
    variations: [
      { id: 1031, name: "500 BDT Steam Wallet", price: "550", stock_status: "instock" },
      { id: 1032, name: "1000 BDT Steam Wallet", price: "1100", stock_status: "instock" },
      { id: 1033, name: "2000 BDT Steam Wallet", price: "2200", stock_status: "instock" },
      { id: 1034, name: "5000 BDT Steam Wallet", price: "5500", stock_status: "instock" }
    ]
  },
  {
    id: 101,
    name: "Elden Ring: Shadow of the Erdtree",
    slug: "elden-ring-shadow",
    price: "4500",
    regular_price: "4500",
    sale_price: "",
    on_sale: false,
    short_description: "Requires base game Elden Ring to play.",
    description: "An expansion to the fantasy action RPG, creating a new world to explore.",
    images: [{ id: 1, src: "https://picsum.photos/400/500?random=1", alt: "Elden Ring" }],
    categories: [{ id: 2, name: "RPG", slug: "rpg" }, { id: 1, name: "Action", slug: "action" }],
    tags: [],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 50,
    average_rating: "4.9",
    rating_count: 1240,
    platform: "Steam",
    type: "simple",
    attributes: [{ id: 1, name: "Edition", options: ["DLC Expansion"] }],
    featured: true
  },
  {
    id: 102,
    name: "Cyberpunk 2077: Ultimate Edition",
    slug: "cyberpunk-2077",
    price: "3500",
    regular_price: "6000",
    sale_price: "3500",
    on_sale: true,
    short_description: "Includes Phantom Liberty expansion.",
    description: "Cyberpunk 2077 is an open-world, action-adventure story set in Night City.",
    images: [{ id: 2, src: "https://picsum.photos/400/500?random=2", alt: "Cyberpunk 2077" }],
    categories: [{ id: 1, name: "Action", slug: "action" }, { id: 2, name: "RPG", slug: "rpg" }],
    tags: [],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 100,
    average_rating: "4.5",
    rating_count: 850,
    platform: "Steam",
    type: "simple",
    attributes: [{ id: 1, name: "Edition", options: ["Ultimate Edition"] }],
    featured: false
  },
  {
    id: 105,
    name: "Call of Duty: Modern Warfare III",
    slug: "cod-mw3",
    price: "7500",
    regular_price: "7500",
    sale_price: "",
    on_sale: false,
    short_description: "Cross-gen bundle for Xbox One and Series X|S.",
    description: "Captain Price and Task Force 141 face off against the ultimate threat.",
    images: [{ id: 5, src: "https://picsum.photos/400/500?random=5", alt: "COD MW3" }],
    categories: [{ id: 1, name: "Action", slug: "action" }],
    tags: [],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 150,
    average_rating: "3.5",
    rating_count: 2100,
    platform: "Xbox",
    type: "simple",
    featured: true
  },
  {
    id: 106,
    name: "EA SPORTS FC 24",
    slug: "fc-24",
    price: "3200",
    regular_price: "7000",
    sale_price: "3200",
    on_sale: true,
    short_description: "",
    description: "EA SPORTS FC 24 marks a new era for The World's Game.",
    images: [{ id: 9, src: "https://picsum.photos/400/500?random=9", alt: "FC 24" }],
    categories: [{ id: 5, name: "Sports", slug: "sports" }, { id: 4, name: "Simulation", slug: "simulation" }],
    tags: [],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 500,
    average_rating: "4.0",
    rating_count: 1200,
    platform: "PSN",
    type: "simple",
    featured: false
  },
  {
    id: 113,
    name: "Free Fire Diamonds",
    slug: "free-fire-diamonds",
    price: "100",
    regular_price: "100",
    sale_price: "",
    on_sale: false,
    short_description: "Provide Player ID in order notes.",
    description: "Buy Free Fire Diamonds in seconds! Just enter your Player ID.",
    images: [{ id: 14, src: "https://picsum.photos/400/500?random=14", alt: "Free Fire" }],
    categories: [{ id: 6, name: "Gift Cards", slug: "gift-cards" }],
    tags: [],
    cross_sell_ids: [],
    stock_status: "instock",
    stock_quantity: 9999,
    average_rating: "4.8",
    rating_count: 9999,
    platform: "Android",
    type: "variable",
    featured: true,
    variations: [
      { id: 1131, name: "100 Diamonds + 10 Bonus", price: "100", stock_status: "instock" },
      { id: 1132, name: "310 Diamonds + 31 Bonus", price: "310", stock_status: "instock" },
      { id: 1133, name: "520 Diamonds + 52 Bonus", price: "520", stock_status: "instock" },
      { id: 1134, name: "1060 Diamonds + 106 Bonus", price: "1060", stock_status: "instock" }
    ]
  }
];

export const MOCK_ORDERS: Order[] = [
    {
        id: 10024,
        status: 'completed',
        total: '3200',
        date_created: '2024-05-20',
        line_items: [
            { name: "EA SPORTS FC 24", quantity: 1, license_key: "XXXX-YYYY-ZZZZ-AAAA", image: "https://picsum.photos/400/500?random=9" }
        ]
    },
    {
        id: 10021,
        status: 'completed',
        total: '600',
        date_created: '2024-05-18',
        line_items: [
            { name: "$5 Steam Gift Card", quantity: 1, license_key: "STEAM-5555-9999-0000", image: "https://picsum.photos/400/500?random=21" }
        ]
    }
];

const BASE_URL = "https://bazaar.mhjoybots.store/wp-json/wc/v3";
// NOTE: Ideally these should be in environment variables (e.g. import.meta.env.VITE_WC_KEY)
const CONSUMER_KEY = "ck_1096fe3ae14606686ad5d403e48a521260a1d98f";
const CONSUMER_SECRET = "cs_bbf7f67357551485a2f7a09e87eb0477a7019a3f";

const fetchWooCommerce = async (endpoint: string, method = 'GET', body?: any) => {
  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  const config: RequestInit = {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
};

const mapWooProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  price: p.price || "0.00",
  regular_price: p.regular_price || "0.00",
  sale_price: p.sale_price || "",
  on_sale: p.on_sale,
  short_description: p.short_description?.replace(/<[^>]*>?/gm, '') || "",
  description: p.description || "",
  images: p.images.map((img: any) => ({ id: img.id, src: img.src, alt: img.alt || p.name })),
  categories: p.categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
  tags: p.tags ? p.tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) : [],
  cross_sell_ids: p.cross_sell_ids || [],
  stock_status: p.stock_status,
  stock_quantity: p.stock_quantity,
  average_rating: p.average_rating,
  rating_count: p.rating_count,
  platform: p.categories.some((c: any) => c.name.toLowerCase().includes('xbox')) ? 'Xbox' :
            p.categories.some((c: any) => c.name.toLowerCase().includes('playstation')) ? 'PSN' : 'Steam',
  type: p.type,
  attributes: p.attributes || [],
  variations: [],
  featured: p.featured || false
});

export const api = {
  getProducts: async (category?: string): Promise<Product[]> => {
    try {
      if (!config.api.useRealApi) throw new Error("Using Mock Data");

      const data = await fetchWooCommerce('/products?per_page=50');
      let products = data.map(mapWooProduct);
      
      // Removed forced Mock Steam Card injection

      if (category && category !== 'all') {
        products = products.filter((p: Product) => p.categories.some(c => c.slug === category));
      }
      return products;
    } catch (error) {
      console.warn("Using Mock Data (Products)");
      let products = [...MOCK_PRODUCTS];
      if (category && category !== 'all') {
        products = products.filter(p => p.categories.some(c => c.slug === category));
      }
      return products;
    }
  },
  getProduct: async (id: number): Promise<Product | undefined> => {
    try {
      if (!config.api.useRealApi) throw new Error("Using Mock Data");
      const data = await fetchWooCommerce(`/products/${id}`);
      const product = mapWooProduct(data);
      if (data.type === 'variable') {
          try {
             const variationsData = await fetchWooCommerce(`/products/${id}/variations`);
             product.variations = variationsData.map((v: any) => ({
                 id: v.id,
                 name: v.attributes.map((a: any) => a.option).join(' ') || `Option ${v.id}`,
                 price: v.price,
                 regular_price: v.regular_price,
                 stock_status: v.stock_status
             }));
          } catch (vErr) { console.warn("Failed to fetch variations", vErr); }
      }
      return product;
    } catch (error) {
      return MOCK_PRODUCTS.find(p => p.id === id);
    }
  },
  getProductsByIds: async (ids: number[]): Promise<Product[]> => {
      if (!ids.length) return [];
      try {
          const all = await api.getProducts('all');
          return all.filter(p => ids.includes(p.id));
      } catch { return []; }
  },
  getCategories: async (): Promise<Category[]> => {
    try {
      if (!config.api.useRealApi) throw new Error("Using Mock Data");
      const data = await fetchWooCommerce('/products/categories?hide_empty=true&per_page=20');
      return data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count }));
    } catch (error) {
      return MOCK_CATEGORIES;
    }
  },
  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string }> => {
    console.log("Creating Order with Data:", orderData);
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (orderData.payment_method === 'uddoktapay') {
        return { 
            id: Math.floor(Math.random() * 100000), 
            success: true, 
            payment_url: "https://sandbox.uddoktapay.com/pay/checkout-demo" 
        };
    }
    return { id: Math.floor(Math.random() * 100000), success: true };
  },
  sendMessage: async (formData: any): Promise<boolean> => {
      console.log("Sending Message:", formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
  },
  login: async (email: string): Promise<User> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
          id: 1,
          username: email.split('@')[0],
          email: email,
          avatar_url: `https://i.pravatar.cc/150?u=${email}`
      };
  },
  getUserOrders: async (userId: number): Promise<Order[]> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_ORDERS;
  }
};
