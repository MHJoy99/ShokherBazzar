
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
      // 1. Try Custom API Endpoint first. 
      // This is crucial for Payment Gateways like UddoktaPay to return their own URL instead of WP fallback.
      try {
          const response = await fetch(`${CUSTOM_API_URL}/checkout`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(orderData)
          });
          const data = await response.json();
          if (response.ok) return data; 
      } catch (e) { console.error("Custom Checkout Failed", e); }

      // 2. Fallback: Standard WooCommerce Order (Less capable for Headless Payment)
      // This will return the 'order-pay' link which our frontend now filters out for automated payments.
      try {
          const data = await fetchWooCommerce('/orders', 'POST', {
              payment_method: orderData.payment_method,
              payment_method_title: orderData.payment_method === 'uddoktapay' ? 'bKash/Nagad' : 'Manual',
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
          return { success: true, id: data.id, payment_url: data.payment_url, guest_token: data.order_key }; 
      } catch (e) {
          return { success: false, message: "Order creation failed" };
      }
  },

  verifyPayment: async (orderId: number, invoiceId?: string) => {
      try {
           await fetch(`${CUSTOM_API_URL}/payment/verify`, {
               method: 'POST',
               headers: getAuthHeaders(),
               body: JSON.stringify({ order_id: orderId, invoice_id: invoiceId })
           });
      } catch(e) {}
  },

  trackOrder: async (orderId: string, email: string, token?: string) => {
      try {
          const params = new URLSearchParams({ order_id: orderId, email: email });
          if(token) params.append('token', token);
          
          const response = await fetch(`${CUSTOM_API_URL}/track-order?${params.toString()}`, { headers: getAuthHeaders() });
          return response.json();
      } catch(e) { return { type: 'error' }; }
  },

  getPage: async (slug: string) => {
      try {
          const res = await fetchWordPress(`/pages?slug=${slug}`);
          if(res.length > 0) return { title: res[0].title.rendered, content: res[0].content.rendered };
          return null;
      } catch { return null; }
  },

  // Auth Functions
  login: async (email: string, password?: string) => {
       const res = await fetch(`${CUSTOM_API_URL}/login`, {
           method: 'POST',
           headers: getAuthHeaders(),
           body: JSON.stringify({ email, password })
       });
       if(!res.ok) throw new Error("Login failed");
       return res.json();
  },
  
  register: async (data: any) => {
      const res = await fetch(`${CUSTOM_API_URL}/register`, {
           method: 'POST',
           headers: getAuthHeaders(),
           body: JSON.stringify(data)
       });
       if(!res.ok) throw new Error("Registration failed");
       return res.json();
  },

  resetPassword: async (email: string) => {
       await fetch(`${CUSTOM_API_URL}/reset-password`, {
           method: 'POST',
           headers: getAuthHeaders(),
           body: JSON.stringify({ email })
       });
  },

  updateProfile: async (id: number, data: any) => {
       try {
           const res = await fetch(`${CUSTOM_API_URL}/customer/${id}`, {
               method: 'PUT',
               headers: getAuthHeaders(),
               body: JSON.stringify(data)
           });
           return res.ok;
       } catch { return false; }
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
      await fetch(`${CUSTOM_API_URL}/contact`, {
           method: 'POST',
           headers: getAuthHeaders(),
           body: JSON.stringify(data)
       });
  },
  
  getCoupon: async (code: string) => {
      try {
          const data = await fetchWooCommerce(`/coupons?code=${code}`);
          if(data.length > 0) return data[0];
          return null;
      } catch { return null; }
  }
};
