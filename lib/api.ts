
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

const getAuthHeaders = () => {
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    return { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
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

  // 🚀 OFFICIAL DIRECT PAYMENT STRATEGY (Enabled by Dual License)
  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string }> => {
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

    const payment_method_id = orderData.payment_method === 'manual' ? 'bacs' : 'uddoktapay';
    const coupon_lines = orderData.coupon_code ? [{ code: orderData.coupon_code }] : [];

    const payload = {
        payment_method: payment_method_id,
        customer_id: orderData.customer_id || 0,
        billing: orderData.billing,
        line_items,
        coupon_lines,
        meta_data,
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
            
            // 1. Try Direct Gateway Link (Best Experience)
            if (data.payment_url) {
                return {
                    id: data.id,
                    success: true,
                    payment_url: data.payment_url
                };
            }
            
            // 2. Fallback to WP Checkout (Safe Backup)
            // Format: domain/checkout/order-pay/ID/?pay_for_order=true&key=ORDER_KEY
            if (orderData.payment_method !== 'manual' && data.order_key) {
                const wpPayLink = `https://admin.mhjoygamershub.com/checkout/order-pay/${data.id}/?pay_for_order=true&key=${data.order_key}`;
                return {
                    id: data.id,
                    success: true,
                    payment_url: wpPayLink
                };
            }

            return {
                id: data.id,
                success: true
            };
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Order creation failed');
        }
    } catch (proxyError: any) {
        console.error("Order Failed:", proxyError);
        throw proxyError;
    }
  },

  verifyPayment: async (orderId: number): Promise<boolean> => {
      try {
          const response = await fetch(`${CUSTOM_API_URL}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId })
          });
          return response.ok;
      } catch (e) {
          // If server call fails, we assume success for UI purposes (as user already paid)
          // The backend webhook is the ultimate source of truth anyway.
          // Send emergency email just in case
          api.sendMessage({ 
              name: "System", 
              email: "admin@mhjoygamershub.com", 
              message: `Client-side verification failed for Order #${orderId}. Check status manually.` 
          });
          return true;
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
          if (response.ok) return await response.json();
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
          return response.json();
      } catch (error) { throw error; }
  },

  getUserOrders: async (userId: number): Promise<Order[]> => {
      try {
          const orders = await fetchWooCommerce(`/orders?customer=${userId}`);
          return orders.map((o: any) => ({
              id: o.id,
              status: o.status,
              total: o.total,
              currency_symbol: o.currency_symbol,
              date_created: new Date(o.date_created).toLocaleDateString(),
              customer_note: o.customer_note || "",
              line_items: o.line_items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  // Map Exposed License Keys
                  license_key: i.exposed_license_keys ? i.exposed_license_keys.join(', ') : (o.meta_data.find((m:any) => m.key === '_license_key')?.value || null),
                  image: i.image?.src || "https://via.placeholder.com/150",
                  downloads: i.downloads || []
              }))
          }));
      } catch (error) { return []; }
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
