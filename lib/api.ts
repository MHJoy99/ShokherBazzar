
import { Product, Category, Order, User, OrderNote, Coupon } from '../types';
import { config } from '../config';

// UPDATED BACKEND DOMAINS
const WC_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wc/v3";
const WP_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wp/v2";
const CUSTOM_API_URL = "https://admin.mhjoygamershub.com/wp-json/custom/v1";

// Keys: Prioritize Environment Variables for Security
const env = (import.meta as any).env;
const CONSUMER_KEY = env?.VITE_WC_CONSUMER_KEY || ""; 
const CONSUMER_SECRET = env?.VITE_WC_CONSUMER_SECRET || "";

// Branded Placeholder for missing images
const PLACEHOLDER_IMG = "https://placehold.co/400x600/0f172a/06b6d4/png?text=MHJoy+GamersHub";

// --- PERFORMANCE CACHE LAYER ---
// This makes the app feel native by storing data in memory after the first fetch.
let PRODUCT_CACHE: Product[] | null = null;
let CATEGORY_CACHE: Category[] | null = null;
let CACHE_TIMESTAMP = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 Minutes Cache

const getAuthHeaders = () => {
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
        console.warn("⚠️ API Keys missing! Check your .env file.");
    }
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    return { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
};

// HELPER: Generate Branded Avatar
const getBrandedAvatar = (username: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0f172a&color=06b6d4&bold=true&size=128&font-size=0.33`;
};

const fetchWooCommerce = async (endpoint: string, method = 'GET', body?: any) => {
  const config: RequestInit = {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(`${WC_BASE_URL}${endpoint}`, config);
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};

const fetchWordPress = async (endpoint: string) => {
    const response = await fetch(`${WP_BASE_URL}${endpoint}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("WP API Error");
    return response.json();
};

const mapWooProduct = (p: any): Product => {
  // Extract Exchange Rate from WP Plugin Meta
  // The PHP plugin saves it as '_giftcard_rate'
  const rateMeta = p.meta_data?.find((m: any) => m.key === '_giftcard_rate');
  const exchangeRate = rateMeta ? parseFloat(rateMeta.value) : undefined;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price || "0.00",
    regular_price: p.regular_price || "0.00",
    sale_price: p.sale_price || "",
    on_sale: p.on_sale,
    short_description: p.short_description?.replace(/<[^>]*>?/gm, '') || "",
    description: p.description || "",
    images: (p.images && p.images.length > 0) 
      ? p.images.map((img: any) => ({ id: img.id, src: img.src, alt: img.alt || p.name }))
      : [{ id: 0, src: PLACEHOLDER_IMG, alt: p.name }],
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
    featured: p.featured || false,
    exchange_rate: exchangeRate
  };
};

export const api = {
  // OPTIMIZED: Fetches all products once and filters in-memory for speed.
  getProducts: async (idOrSlug?: string): Promise<Product[]> => {
    try {
      const now = Date.now();
      
      // 1. Check Cache Validity
      if (PRODUCT_CACHE && (now - CACHE_TIMESTAMP < CACHE_DURATION)) {
          // If we want 'all', return everything
          if (!idOrSlug || idOrSlug === 'all') return PRODUCT_CACHE;
          
          // Client-side Filter (Instant)
          return PRODUCT_CACHE.filter(p => p.categories.some(c => c.slug === idOrSlug));
      }

      // 2. Fetch Fresh Data (Only if cache empty or expired)
      // fetching 100 per page to likely get everything in one go for small/medium stores
      const data = await fetchWooCommerce('/products?per_page=100');
      const mapped = data.map(mapWooProduct);
      
      // Update Cache
      PRODUCT_CACHE = mapped;
      CACHE_TIMESTAMP = now;

      if (!idOrSlug || idOrSlug === 'all') return mapped;

      // Filter after fetching
      return mapped.filter(p => p.categories.some(c => c.slug === idOrSlug));

    } catch (error) { 
        console.error("API Error", error);
        return []; 
    }
  },
  
  // SUPER OPTIMIZED: Checks cache, Fetches Variations, Updates Cache
  getProduct: async (idOrSlug: string | number): Promise<Product | undefined> => {
    try {
      // 1. Try finding in Cache first (Instant Load)
      let cachedIndex = -1;
      let cached: Product | undefined;

      if (PRODUCT_CACHE) {
          cachedIndex = PRODUCT_CACHE.findIndex(p => p.id === idOrSlug || p.slug === idOrSlug);
          if (cachedIndex > -1) {
              cached = PRODUCT_CACHE[cachedIndex];
              // CRITICAL OPTIMIZATION:
              // If we have the product cached AND it already has variations loaded (or isn't variable), return immediately.
              // This kills the load time on 2nd visit.
              if (cached.type !== 'variable') return cached;
              if (cached.type === 'variable' && cached.variations && cached.variations.length > 0) return cached;
          }
      }

      // 2. Fetch Fresh Data if not fully cached
      let data;
      const isId = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug));

      if (cached) {
          // If we have the shell but need variations, skip fetching the base product again
          data = { id: cached.id, type: cached.type }; 
      } else {
          // Full fetch if not in cache at all
          if (isId) {
              data = await fetchWooCommerce(`/products/${idOrSlug}`);
          } else {
              const results = await fetchWooCommerce(`/products?slug=${idOrSlug}`);
              if (results.length > 0) data = results[0]; else return undefined;
          }
      }

      // 3. Map Data (If we fetched fresh base data)
      const product = cached ? { ...cached } : mapWooProduct(data);

      // 4. Fetch Variations if Variable
      if (data.type === 'variable') {
          try {
             // Variations are heavy, we still fetch these fresh to ensure stock accuracy
             const variationsData = await fetchWooCommerce(`/products/${data.id}/variations?per_page=100`);
             
             product.variations = variationsData.map((v: any) => ({
                 id: v.id,
                 name: v.attributes.map((a: any) => a.option).join(' ') || `Option ${v.id}`,
                 price: v.price || v.regular_price || "0",
                 regular_price: v.regular_price,
                 stock_status: v.stock_status
             })).sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));

             // DEEP CACHE UPDATE:
             // Write these variations BACK to the global cache so we never fetch them again this session.
             if (PRODUCT_CACHE && cachedIndex > -1) {
                 PRODUCT_CACHE[cachedIndex] = product;
             }

          } catch (vErr) { console.error("Error fetching variations", vErr); }
      }
      return product;
    } catch (error) { return undefined; }
  },

  getProductsByIds: async (ids: number[]): Promise<Product[]> => {
      if (!ids.length) return [];
      // Try cache first
      if (PRODUCT_CACHE) {
          const cached = PRODUCT_CACHE.filter(p => ids.includes(p.id));
          if (cached.length === ids.length) return cached;
      }

      try {
          const includes = ids.join(',');
          const data = await fetchWooCommerce(`/products?include=${includes}`);
          return data.map(mapWooProduct);
      } catch { return []; }
  },

  getCategories: async (): Promise<Category[]> => {
    if (CATEGORY_CACHE) return CATEGORY_CACHE;
    try {
      const data = await fetchWooCommerce('/products/categories?hide_empty=true&per_page=100');
      const mapped = data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count }));
      CATEGORY_CACHE = mapped;
      return mapped;
    } catch (error) { return []; }
  },

  getPage: async (slug: string): Promise<{ title: string, content: string } | null> => {
      try {
          const pages = await fetchWordPress(`/pages?slug=${slug}`);
          return pages.length > 0 ? { title: pages[0].title.rendered, content: pages[0].content.rendered } : null;
      } catch (e) { return null; }
  },

  getCoupon: async (code: string): Promise<Coupon | null> => {
      try {
          const coupons = await fetchWooCommerce(`/coupons?code=${code}`);
          return coupons.length > 0 ? { id: coupons[0].id, code: coupons[0].code, amount: coupons[0].amount, discount_type: coupons[0].discount_type } : null;
      } catch (e) { return null; }
  },

  // SECURITY: SECURE BUNDLE CALCULATION
  calculateBundle: async (productId: number | string, amount: number | string, currency: string = 'USD') => {
      try {
          // Explicitly cast to Ensure Numbers are sent to backend
          const payload = {
              productId: Number(productId),
              amount: Number(amount),
              currency: String(currency)
          };

          // Pre-flight check
          if (isNaN(payload.productId) || payload.productId <= 0) throw new Error("Invalid Product ID");
          if (isNaN(payload.amount) || payload.amount <= 0) throw new Error("Invalid Amount");

          const response = await fetch(`${CUSTOM_API_URL}/calculate-bundle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
              const err = await response.json();
              console.error("Bundle Calculation API Error:", err);
              throw new Error(err.message || `Calculation failed (${response.status})`);
          }
          
          // --- RESPONSE MAPPING LAYER ---
          // Backend sends snake_case (standard PHP/WP). Frontend needs camelCase.
          const data = await response.json();
          
          return {
              success: data.success,
              
              // Map: calculation_token -> calculationToken
              calculationToken: data.calculation_token, 
              
              // Map: total_bdt -> totalBDT
              totalBDT: data.total_bdt,                
              
              // Map: currency -> currency
              currency: data.currency || 'USD',
              
              requestedAmount: data.requested_amount || payload.amount,
              
              items: Array.isArray(data.items) ? data.items.map((i: any) => ({
                  // Map: variation_id -> variationId
                  variationId: i.variation_id,
                  name: i.name, // Added mapping for name
                  
                  quantity: i.quantity,
                  
                  // Map: subtotal_bdt -> subtotalBDT
                  // Fallback to unit_price_bdt * quantity if subtotal missing
                  subtotalBDT: i.subtotal_bdt ?? (i.unit_price_bdt * i.quantity),
                  
                  denomination: i.denomination || 0
              })) : []
          };

      } catch (error) {
          console.error("calculateBundle Exception:", error);
          throw error;
      }
  },

  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string; guest_token?: string }> => {
    // Construct line items with Security Tokens if present
    const line_items = orderData.items.map((item: any) => {
        const payload: any = {
            product_id: item.id,
            quantity: item.quantity
        };
        
        if (item.selectedVariation) {
            payload.variation_id = Number(item.selectedVariation.id);
        }

        // SECURITY: Attach Token if this is a Gift Card (Product 9042)
        if (item.id === config.pricing.giftCardProductId && item.calculationToken) {
            payload.meta_data = [
                // MUST USE UNDERSCORE PREFIX for Backend Validation
                { key: '_calculation_token', value: item.calculationToken },
                { key: '_calculator_currency', value: item.calculatorCurrency || 'USD' }
            ];
            
            // Override price if bundle logic requires it
            if (item.custom_price) {
                 payload.total = item.custom_price;
            }
        } else if (item.custom_price) {
            // Legacy bundle logic for non-secure items (if any)
            payload.total = item.custom_price; 
            payload.meta_data = [{ key: 'Bundle Promo', value: 'Active' }];
        }
        
        return payload;
    });

    const meta_data = [];
    if (orderData.payment_method === 'manual') {
        meta_data.push({ key: 'bkash_trx_id', value: orderData.trxId });
        meta_data.push({ key: 'sender_number', value: orderData.senderNumber });
    }

    const payload = {
        payment_method: orderData.payment_method === 'manual' ? 'bacs' : 'uddoktapay',
        customer_id: orderData.customer_id || 0,
        billing: orderData.billing,
        line_items,
        coupon_lines: orderData.coupon_code ? [{ code: orderData.coupon_code }] : [],
        meta_data,
        customer_note: orderData.payment_method === 'manual' ? `TrxID: ${orderData.trxId}` : "Order via App"
    };

    try {
        const response = await fetch(`${CUSTOM_API_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const baseResult = { id: data.id, success: true, guest_token: data.guest_token };
            if (data.payment_url) return { ...baseResult, payment_url: data.payment_url };
            return baseResult;
        } else {
            const err = await response.json();
            // Pass the 403 Security Message to frontend
            throw new Error(err.message || 'Order creation failed');
        }
    } catch (proxyError: any) {
        throw proxyError;
    }
  },

  verifyPayment: async (orderId: number, invoiceId?: string): Promise<boolean> => {
      await new Promise(r => setTimeout(r, 1500));
      try {
          const res = await fetch(`${CUSTOM_API_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId, invoice_id: invoiceId })
          });
          if (res.status === 404) return false;
          return res.ok;
      } catch (e) { return false; }
  },

  sendMessage: async (formData: any): Promise<boolean> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/contact`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          return response.ok;
      } catch (error) { throw error; }
  },

  register: async (userData: any): Promise<User> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/register-customer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
          });
          if (response.ok) {
              const u = await response.json();
              u.avatar_url = getBrandedAvatar(u.username);
              return u;
          }
          throw new Error("Registration failed");
      } catch (e) { throw e; }
  },

  login: async (email: string, password?: string): Promise<User> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
          });
          if (!response.ok) throw new Error("Invalid credentials");
          const u = await response.json();
          u.avatar_url = getBrandedAvatar(u.username);
          return u;
      } catch (error) { throw error; }
  },

  resetPassword: async (email: string): Promise<boolean> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/reset-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          if (!response.ok) throw new Error("Failed to reset");
          return true;
      } catch (e) { throw e; }
  },

  updateProfile: async (userId: number, data: any): Promise<boolean> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/update-profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: userId, ...data })
          });
          return response.ok;
      } catch (e) { return false; }
  },

  getProfileSync: async (email: string): Promise<User | null> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/get-profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          if (!response.ok) return null;
          const u = await response.json();
          u.avatar_url = getBrandedAvatar(u.username);
          return u;
      } catch (e) { return null; }
  },
  
  getProfile: async (email: string) => api.getProfileSync(email),

  getUserOrders: async (userId: number): Promise<Order[]> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/my-orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId })
          });
          
          if (!response.ok) throw new Error("Failed to fetch orders");
          const orders = await response.json();
          return orders.map((o: any) => ({
              id: o.id,
              status: o.status,
              total: o.total,
              currency_symbol: '৳',
              date_created: o.date_created,
              customer_note: o.customer_note || "",
              line_items: o.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  license_key: i.license_keys && i.license_keys.length > 0 ? i.license_keys.join(' | ') : null,
                  image: i.image || PLACEHOLDER_IMG,
                  downloads: [],
              }))
          }));
      } catch (error) { 
          return []; 
      }
  },

  trackOrder: async (orderId: string, email: string, token?: string): Promise<{ type: 'success' | 'email_sent' | 'error', data?: Order }> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/track-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId, email: email, token: token })
          });

          const data = await response.json();

          if (data.status === 'email_sent') {
              return { type: 'email_sent' };
          }

          if (!response.ok) return { type: 'error' };

          const order: Order = {
              id: data.id,
              status: data.status,
              total: data.total,
              currency_symbol: '৳',
              date_created: data.date_created,
              customer_note: "",
              line_items: data.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  license_key: i.license_keys && i.license_keys.length > 0 ? i.license_keys.join(' | ') : null,
                  image: i.image || PLACEHOLDER_IMG,
                  downloads: [],
              }))
          };
          return { type: 'success', data: order };
      } catch (e) {
          return { type: 'error' };
      }
  },

  getOrderNotes: async (orderId: number): Promise<OrderNote[]> => {
      try {
          const notes = await fetchWooCommerce(`/orders/${orderId}/notes`);
          return notes.filter((n: any) => n.customer_note).map((n: any) => ({
              id: n.id,
              note: n.note,
              customer_note: n.customer_note,
              date_created: new Date(n.date_created).toLocaleString()
          }));
      } catch (e) { return []; }
  }
};
