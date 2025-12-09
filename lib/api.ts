
import { Product, Category, Order, User } from '../types';
import { config } from '../config';

// --- MOCK DATA FOR FALLBACK ONLY ---
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Action', slug: 'action', count: 120 },
  { id: 6, name: 'Gift Cards', slug: 'gift-cards', count: 15 },
];

export const MOCK_PRODUCTS: Product[] = []; // Empty default, relies on API

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
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `API Error: ${response.statusText}`);
  }
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
      const data = await fetchWooCommerce('/products?per_page=50');
      let products = data.map(mapWooProduct);
      if (category && category !== 'all') {
        products = products.filter((p: Product) => p.categories.some(c => c.slug === category));
      }
      return products;
    } catch (error) {
      console.warn("API Error, Mock Data fallback blocked for production safety.");
      return [];
    }
  },
  getProduct: async (id: number): Promise<Product | undefined> => {
    try {
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
      return undefined;
    }
  },
  getProductsByIds: async (ids: number[]): Promise<Product[]> => {
      if (!ids.length) return [];
      try {
          // WooCommerce doesn't have a clean 'ids' filter in v3, so we fetch all or specific includes if supported
          const includes = ids.join(',');
          const data = await fetchWooCommerce(`/products?include=${includes}`);
          return data.map(mapWooProduct);
      } catch { return []; }
  },
  getCategories: async (): Promise<Category[]> => {
    try {
      const data = await fetchWooCommerce('/products/categories?hide_empty=true&per_page=20');
      return data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count }));
    } catch (error) {
      return MOCK_CATEGORIES;
    }
  },

  // --- REAL ORDER CREATION ---
  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string }> => {
    console.log("Submitting Order to WooCommerce:", orderData);

    const line_items = orderData.items.map((item: any) => ({
        product_id: item.id,
        quantity: item.quantity,
        variation_id: item.selectedVariation?.id
    }));

    const meta_data = [];
    if (orderData.payment_method === 'manual') {
        meta_data.push({ key: 'bkash_trx_id', value: orderData.trxId });
        meta_data.push({ key: 'sender_number', value: orderData.senderNumber });
    }

    const payload = {
        payment_method: orderData.payment_method === 'manual' ? 'bacs' : 'uddoktapay', // 'bacs' usually enables Bank/Manual
        payment_method_title: orderData.payment_method === 'manual' ? 'Manual Transfer (bKash/Nagad)' : 'Online Payment',
        set_paid: false,
        billing: {
            first_name: orderData.billing.first_name,
            last_name: orderData.billing.last_name,
            address_1: "Digital Delivery",
            city: "Dhaka",
            state: "Dhaka",
            postcode: "1000",
            country: "BD",
            email: orderData.billing.email,
            phone: orderData.billing.phone
        },
        line_items: line_items,
        meta_data: meta_data,
        customer_note: orderData.payment_method === 'manual' 
            ? `TrxID: ${orderData.trxId}, Sender: ${orderData.senderNumber}` 
            : "Customer waiting for payment link"
    };

    try {
        const order = await fetchWooCommerce('/orders', 'POST', payload);
        
        // If UddoktaPay plugin is active, it might handle redirection, but via API we might need to handle it manually.
        // For now, we return success so the UI shows the "Done" step.
        return { 
            id: order.id, 
            success: true,
            // In a real UddoktaPay integration, you would generate the payment URL here
        };
    } catch (error) {
        console.error("Order Creation Failed:", error);
        throw error;
    }
  },

  sendMessage: async (formData: any): Promise<boolean> => {
      // Contact form usually requires a specific WP endpoint or 3rd party service
      // Keeping mock for now as WP doesn't have a default 'contact' API
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
  },

  // --- AUTHENTICATION ---
  
  // 1. REGISTER (REAL)
  register: async (userData: any): Promise<User> => {
      try {
          const payload = {
              email: userData.email,
              first_name: userData.first_name,
              last_name: userData.last_name,
              username: userData.email.split('@')[0],
              password: userData.password
          };
          const response = await fetchWooCommerce('/customers', 'POST', payload);
          return {
              id: response.id,
              username: response.username,
              email: response.email,
              avatar_url: response.avatar_url
          };
      } catch (error) {
          console.error("Registration Error", error);
          throw error;
      }
  },

  // 2. LOGIN (PARTIAL REAL / SIMULATED)
  // WARNING: Standard WooCommerce API keys cannot authenticate USERS (Password check).
  // You need the "JWT Authentication for WP-REST-API" plugin to do real password checking.
  // For this version, we will Simulate login by checking if the customer exists via email.
  login: async (email: string): Promise<User> => {
      // SECURITY WARNING: This does NOT check passwords. It just finds the user.
      // Install JWT Plugin for real security.
      const users = await fetchWooCommerce(`/customers?email=${email}`);
      if (users.length > 0) {
          const u = users[0];
          return {
              id: u.id,
              username: u.username,
              email: u.email,
              avatar_url: u.avatar_url
          };
      }
      throw new Error("User not found.");
  },

  // 3. GET ORDERS (REAL)
  getUserOrders: async (userId: number): Promise<Order[]> => {
      try {
          const orders = await fetchWooCommerce(`/orders?customer=${userId}`);
          return orders.map((o: any) => ({
              id: o.id,
              status: o.status,
              total: o.total,
              date_created: new Date(o.date_created).toLocaleDateString(),
              line_items: o.line_items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  // License key usually comes from a plugin meta field. 
                  // We check meta_data for common license manager keys.
                  license_key: o.meta_data.find((m:any) => m.key === '_license_key' || m.key === 'serial_number')?.value || null, 
                  image: "https://via.placeholder.com/150" // WP API doesn't return product image in order line items by default
              }))
          }));
      } catch (error) {
          return [];
      }
  }
};
