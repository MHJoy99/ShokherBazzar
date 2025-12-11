
import { Product, Category, Order, User, OrderNote, Coupon } from '../types';
import { config } from '../config';

// UPDATED BACKEND DOMAINS
const WC_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wc/v3";
const WP_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wp/v2";
// const CUSTOM_API_URL = "https://admin.mhjoygamershub.com/wp-json/custom/v1"; // Custom Endpoint disabled as it's missing on server

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

const fetchWooCommerce = async (endpoint: string, method = 'GET', body?: any) => {
  // CACHE BUSTING: Append timestamp to URL to prevent browser/CDN caching.
  const timestamp = new Date().getTime();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${WC_BASE_URL}${endpoint}${method === 'GET' ? `${separator}_t=${timestamp}` : ''}`;

  const config: RequestInit = {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  };
  const response = await fetch(url, config);
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
    } catch { return []; }
  },

  createOrder: async (orderData: any) => {
      // STANDARD WOOCOMMERCE ORDER CREATION
      // Since the custom 'checkout' endpoint is missing, we use the standard API.
      // This will typically return a 'payment_url' that redirects to the WordPress 'Pay for Order' page.
      // Users will complete payment there, and then be redirected back.
      try {
          const data = await fetchWooCommerce('/orders', 'POST', {
              payment_method: orderData.payment_method,
              payment_method_title: orderData.payment_method === 'uddoktapay' ? 'bKash/Nagad (UddoktaPay)' : 'Manual',
              set_paid: false,
              billing: orderData.billing,
              line_items: orderData.items.map((i: any) => ({
                  product_id: i.id,
                  quantity: i.quantity,
                  variation_id: i.selectedVariation?.id
              })),
              customer_id: orderData.customer_id || 0,
              coupon_lines: orderData.coupon_code ? [{ code: orderData.coupon_code }] : [],
              meta_data: [
                   { key: 'billing_phone', value: orderData.billing.phone },
                   { key: 'sender_number', value: orderData.senderNumber },
                   { key: 'transaction_id', value: orderData.trxId }
              ]
          });
          
          return { 
              success: true, 
              id: data.id, 
              payment_url: data.payment_url, // This is usually the WP order-pay link
              guest_token: data.order_key 
          }; 
      } catch (e: any) {
          console.error("Order Creation Failed", e);
          return { success: false, message: e.message || "Order creation failed" };
      }
  },

  verifyPayment: async (orderId: number, invoiceId?: string) => {
      // Verification usually happens on the backend via IPN/Webhook.
      // We can poll the order status here if needed, or just let the user see the result on the dashboard.
      // Currently disabling the custom endpoint call to avoid 404s.
  },

  trackOrder: async (orderId: string, email: string, token?: string) => {
      try {
          // Fallback logic since custom track endpoint might be missing
          // Use standard orders API with email filtering if possible, but standard API restricts this for security.
          // We will try to fetch the specific order ID.
          const orderData = await fetchWooCommerce(`/orders/${orderId}`);
          
          // Basic security check: match email
          if (orderData && orderData.billing && orderData.billing.email.toLowerCase() === email.toLowerCase()) {
              return { type: 'success', data: {
                  id: orderData.id,
                  status: orderData.status,
                  total: orderData.total,
                  currency_symbol: orderData.currency_symbol,
                  date_created: new Date(orderData.date_created).toLocaleDateString(),
                  customer_note: orderData.customer_note,
                  line_items: orderData.line_items.map((i: any) => ({
                    name: i.name,
                    quantity: i.quantity,
                    license_key: i.meta_data?.find((m: any) => m.key === '_license_key' || m.key === 'serial_number')?.value,
                    image: i.image?.src || PLACEHOLDER_IMG,
                    downloads: i.downloads
                  }))
              }};
          }
          return { type: 'error' };
      } catch(e) { return { type: 'error' }; }
  },

  getPage: async (slug: string) => {
      try {
          const res = await fetchWordPress(`/pages?slug=${slug}`);
          if(res.length > 0) return { title: res[0].title.rendered, content: res[0].content.rendered };
          return null;
      } catch { return null; }
  },

  // Auth Functions (Standard WP/WC Auth isn't exposed by default REST API in this way, 
  // keeping these stubs or using standard JWT if available. 
  // For now, assuming these custom endpoints MIGHT exist or we handle errors gracefully.)
  login: async (email: string, password?: string) => {
       // Placeholder: In a real headless setup without custom plugins, you'd use JWT Auth plugin routes.
       // Example: await fetch(`${WP_BASE_URL}/jwt-auth/v1/token`, ...)
       throw new Error("Login requires JWT Auth plugin configuration.");
  },
  
  register: async (data: any) => {
       throw new Error("Registration requires custom backend support.");
  },

  resetPassword: async (email: string) => {
       // No standard REST endpoint for this without plugins
  },

  updateProfile: async (id: number, data: any) => {
       return false;
  },
  
  getProfileSync: async (email: string) => {
      return null;
  },

  getUserOrders: async (id: number) => {
      try {
          const data = await fetchWooCommerce(`/orders?customer=${id}&per_page=20`);
          return data.map((o: any) => ({
              id: o.id,
              status: o.status,
              total: o.total,
              currency_symbol: o.currency_symbol,
              date_created: new Date(o.date_created).toLocaleDateString(),
              customer_note: o.customer_note,
              line_items: o.line_items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  license_key: i.meta_data?.find((m: any) => m.key === '_license_key' || m.key === 'serial_number')?.value,
                  image: i.image?.src || PLACEHOLDER_IMG,
                  downloads: i.downloads
              }))
          }));
      } catch { return []; }
  },

  getOrderNotes: async (id: number) => {
      try {
          const data = await fetchWooCommerce(`/orders/${id}/notes`);
          return data.map((n: any) => ({
              id: n.id,
              note: n.note,
              customer_note: n.customer_note,
              date_created: new Date(n.date_created).toLocaleString()
          }));
      } catch { return []; }
  },
  
  sendMessage: async (data: any) => {
      // Placeholder
  },
  
  getCoupon: async (code: string) => {
      try {
          const data = await fetchWooCommerce(`/coupons?code=${code}`);
          if(data.length > 0) return data[0];
          return null;
      } catch { return null; }
  }
};
