
import { Product, Category, Order, User, OrderNote, Coupon } from '../types';
import { config } from '../config';

// UPDATED BACKEND DOMAINS
const WC_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wc/v3";
const WP_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wp/v2";
const CUSTOM_API_URL = "https://admin.mhjoygamershub.com/wp-json/custom/v1";

// Keys: Prioritize Environment Variables for Security
const env = (import.meta as any).env;
const CONSUMER_KEY = env?.VITE_WC_CONSUMER_KEY || "ck_97520f17fc4470d40b9625ea0cf0911c5a0ce9bb";
const CONSUMER_SECRET = env?.VITE_WC_CONSUMER_SECRET || "cs_ad555ccecf6ebc4d1c84a3e14d74b53dd55de903";

// Branded Placeholder for missing images
const PLACEHOLDER_IMG = "https://placehold.co/400x600/0f172a/06b6d4/png?text=MHJoy+GamersHub";

const getAuthHeaders = () => {
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    return { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
};

// HELPER: Generate Branded Avatar
// Creates a stylish "Initials" avatar (e.g. "MH") using brand colors (Dark BG, Cyan Text)
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
  featured: p.featured || false
});

export const api = {
  getProducts: async (idOrSlug?: string): Promise<Product[]> => {
    try {
      let endpoint = '/products?per_page=50'; 
      if (idOrSlug && idOrSlug !== 'all') {
          // Find Category ID first
          const cats = await fetchWooCommerce(`/products/categories?slug=${idOrSlug}`);
          if(cats.length > 0) endpoint = `/products?category=${cats[0].id}&per_page=50`;
      }
      const data = await fetchWooCommerce(endpoint);
      return data.map(mapWooProduct);
    } catch (error) { return []; }
  },
  
  getProduct: async (idOrSlug: string | number): Promise<Product | undefined> => {
    try {
      let data;
      const isId = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug));

      if (isId) {
          data = await fetchWooCommerce(`/products/${idOrSlug}`);
      } else {
          const results = await fetchWooCommerce(`/products?slug=${idOrSlug}`);
          if (results.length > 0) data = results[0]; else return undefined;
      }

      const product = mapWooProduct(data);
      if (data.type === 'variable') {
          try {
             const variationsData = await fetchWooCommerce(`/products/${data.id}/variations?per_page=100`);
             product.variations = variationsData.map((v: any) => ({
                 id: v.id,
                 name: v.attributes.map((a: any) => a.option).join(' ') || `Option ${v.id}`,
                 price: v.price || v.regular_price || "0",
                 regular_price: v.regular_price,
                 stock_status: v.stock_status
             })).sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
          } catch (vErr) { }
      }
      return product;
    } catch (error) { return undefined; }
  },

  getProductsByIds: async (ids: number[]): Promise<Product[]> => {
      if (!ids.length) return [];
      try {
          const includes = ids.join(',');
          const data = await fetchWooCommerce(`/products?include=${includes}`);
          return data.map(mapWooProduct);
      } catch { return []; }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const data = await fetchWooCommerce('/products/categories?hide_empty=true&per_page=100');
      return data.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, count: c.count }));
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

  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string; guest_token?: string }> => {
    // Construct line items with explicit custom price override for Bundles
    const line_items = orderData.items.map((item: any) => {
        const lineItem: any = {
            product_id: item.id,
            quantity: item.quantity,
            variation_id: item.selectedVariation?.id
        };

        // IMPORTANT: If this item comes from the Calculator with a custom price,
        // we must explicitly tell the backend the 'total' and 'subtotal'.
        // Otherwise, WooCommerce will recalculate using the database price (which is cheaper).
        if (item.custom_price) {
            const lineTotal = (parseFloat(item.custom_price) * item.quantity).toFixed(2);
            lineItem.subtotal = lineTotal;
            lineItem.total = lineTotal;
            
            // Add metadata so admins know this was a calculator bundle
            lineItem.meta_data = [
                { key: '_is_bundle_price', value: 'yes' },
                { key: 'Unit Price', value: `${parseFloat(item.custom_price).toFixed(2)}` }
            ];
        }
        
        return lineItem;
    });

    const meta_data = [];
    if (orderData.payment_method === 'manual') {
        meta_data.push({ key: 'bkash_trx_id', value: orderData.trxId });
        meta_data.push({ key: 'sender_number', value: orderData.senderNumber });
    }

    const payment_method_id = orderData.payment_method === 'manual' ? 'bacs' : 'uddoktapay';
    const coupon_lines = orderData.coupon_code ? [{ code: orderData.coupon_code }] : [];

    const payload = {
        payment_method: payment_method_id,
        customer_id: orderData.customer_id || 0,
        billing: orderData.billing,
        line_items,
        coupon_lines,
        meta_data,
        trxId: orderData.trxId, 
        senderNumber: orderData.senderNumber, 
        customer_note: orderData.payment_method === 'manual' ? `TrxID: ${orderData.trxId}` : "Headless Order"
    };

    try {
        const response = await fetch(`${CUSTOM_API_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            
            // Return token if available
            const baseResult = {
                id: data.id,
                success: true,
                guest_token: data.guest_token
            };

            // 1. Try Direct Gateway Link
            if (data.payment_url) {
                return {
                    ...baseResult,
                    payment_url: data.payment_url
                };
            }
            
            // 2. Fallback to WP Checkout
            if (orderData.payment_method !== 'manual' && data.order_key) {
                const wpPayLink = `https://admin.mhjoygamershub.com/checkout/order-pay/${data.id}/?pay_for_order=true&key=${data.order_key}`;
                return {
                    ...baseResult,
                    payment_url: wpPayLink
                };
            }

            return baseResult;
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Order creation failed');
        }
    } catch (proxyError: any) {
        console.error("Order Failed:", proxyError);
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
          const data = await res.json();
          if (data.status !== 'verified' && data.status !== 'already_paid') {
               await api.sendMessage({
                   name: "System Alert",
                   email: "admin@mhjoygamershub.com",
                   message: `Urgent: Order #${orderId} (Invoice ${invoiceId}) returned SUCCESS but API verification failed. Please check UddoktaPay manually.`
               });
          }
          return res.ok;
      } catch (e) {
          return false;
      }
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
              // Apply branded avatar
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
          // Apply branded avatar
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
          // Apply branded avatar
          u.avatar_url = getBrandedAvatar(u.username);
          return u;
      } catch (e) { return null; }
  },

  getProfile: async (email: string): Promise<User | null> => {
     return api.getProfileSync(email);
  },

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
                  image: i.image || PLACEHOLDER_IMG, // Use fallback
                  downloads: [],
              }))
          }));
      } catch (error) { 
          console.error("Order Fetch Error:", error);
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
                  image: i.image || PLACEHOLDER_IMG, // Use fallback
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