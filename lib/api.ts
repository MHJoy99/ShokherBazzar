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
const getBrandedAvatar = (username: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0f172a&color=06b6d4&bold=true&size=128&font-size=0.33`;
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
      let message = `API Error: ${response.statusText}`;
      try {
          const err = await response.json();
          message = err.message || message;
      } catch (e) {}
      throw new Error(message);
  }
  return response.json();
};

const fetchWordPress = async (endpoint: string) => {
    const response = await fetch(`${WP_BASE_URL}${endpoint}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("WP API Error");
    return response.json();
};

const fetchCustom = async (endpoint: string, method = 'GET', body?: any) => {
    const url = `${CUSTOM_API_URL}${endpoint}`;
    const config: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, config);
     if (!response.ok) {
        let message = `Custom API Error: ${response.statusText}`;
        try {
            const err = await response.json();
            message = err.message || message;
        } catch {}
        throw new Error(message);
    }
    return response.json();
}

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

const mapOrder = (o: any): Order => ({
    id: o.id,
    status: o.status,
    total: o.total,
    currency_symbol: o.currency_symbol || '৳',
    date_created: new Date(o.date_created).toLocaleDateString(),
    customer_note: o.customer_note,
    line_items: o.line_items.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        license_key: i.meta_data?.find((m: any) => m.key === '_license_key' || m.key === 'license_key')?.value || '',
        image: i.image?.src || PLACEHOLDER_IMG,
        downloads: i.downloads // Assuming API returns downloads in line items if extended, or logic elsewhere
    }))
});

export const api = {
  getProducts: async (idOrSlug?: string): Promise<Product[]> => {
    try {
      let endpoint = '/products?per_page=50'; 
      if (idOrSlug && idOrSlug !== 'all') {
          // Find Category ID first
          const cats = await fetchWooCommerce(`/products/categories?slug=${idOrSlug}`);
          if(cats.length > 0) endpoint = `/products?category=${cats[0].id}&per_page=50`;
          else return []; // Category not found
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

  verifyPayment: async (orderId: number, invoiceId?: string) => {
      // Mock verification or call backend to check status
      try {
          const order = await fetchWooCommerce(`/orders/${orderId}`);
          return order.status === 'completed' || order.status === 'processing';
      } catch { return false; }
  },

  getCoupon: async (code: string): Promise<Coupon | null> => {
      try {
          const coupons = await fetchWooCommerce(`/coupons?code=${code}`);
          if (coupons.length > 0) {
              return {
                  id: coupons[0].id,
                  code: coupons[0].code,
                  amount: coupons[0].amount,
                  discount_type: coupons[0].discount_type
              };
          }
          return null;
      } catch { return null; }
  },

  createOrder: async (data: any): Promise<{success: boolean, id: number, payment_url?: string, guest_token?: string}> => {
      // Construct WooCommerce Order Payload
      const payload = {
          payment_method: data.payment_method === 'manual' ? 'bacs' : 'uddoktapay', // Example mapping
          payment_method_title: data.payment_method === 'manual' ? 'Manual Transfer' : 'Online Payment',
          set_paid: false,
          billing: {
              first_name: data.billing.first_name,
              last_name: data.billing.last_name,
              email: data.billing.email,
              phone: data.billing.phone,
          },
          line_items: data.items.map((item: any) => ({
              product_id: item.id, 
              quantity: item.quantity,
              // If it's a variation, pass variation_id. 
              variation_id: item.selectedVariation ? item.id : undefined 
          })),
          customer_id: data.customer_id || 0,
          meta_data: [],
          coupon_lines: data.coupon_code ? [{ code: data.coupon_code }] : []
      };

      if (data.trxId) payload.meta_data.push({ key: 'transaction_id', value: data.trxId });
      if (data.senderNumber) payload.meta_data.push({ key: 'sender_number', value: data.senderNumber });

      try {
          const order = await fetchWooCommerce('/orders', 'POST', payload);
          
          let paymentUrl = order.payment_url; 
          
          // CHECK FOR CUSTOM GATEWAY LINK IN META DATA (Common in WP plugins)
          if (!paymentUrl && order.meta_data) {
             const metaLink = order.meta_data.find((m: any) => m.key === 'uddoktapay_payment_url' || m.key === 'payment_link');
             if (metaLink) paymentUrl = metaLink.value;
          }

          // FALLBACK: Only if we have NO url and method is online, use manual order-pay link
          if (!paymentUrl && data.payment_method === 'uddoktapay') {
              paymentUrl = `https://admin.mhjoygamershub.com/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;
          }

          return { success: true, id: order.id, guest_token: order.order_key, payment_url: paymentUrl }; 
      } catch (e) {
          throw e;
      }
  },

  sendMessage: async (data: { name: string; email: string; message: string }) => {
      // Assuming a custom endpoint or Contact Form 7 integration
      // Mock success for now as we don't have form endpoint
      return new Promise(resolve => setTimeout(resolve, 500));
  },

  login: async (email: string, password?: string): Promise<User> => {
      // MOCK IMPLEMENTATION FOR DEMO
      if (password === 'error') throw new Error("Invalid Credentials");
      
      // Try to find customer by email
      const customers = await fetchWooCommerce(`/customers?email=${email}`);
      if (customers.length > 0) {
           const c = customers[0];
           return {
               id: c.id,
               username: c.username,
               email: c.email,
               avatar_url: c.avatar_url || getBrandedAvatar(c.username)
           };
      }
      throw new Error("User not found");
  },

  register: async (data: any): Promise<User> => {
      const payload = {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.email.split('@')[0],
          password: data.password
      };
      const customer = await fetchWooCommerce('/customers', 'POST', payload);
      return {
           id: customer.id,
           username: customer.username,
           email: customer.email,
           avatar_url: customer.avatar_url || getBrandedAvatar(customer.username)
      };
  },

  updateProfile: async (userId: number, data: any): Promise<boolean> => {
      try {
          await fetchWooCommerce(`/customers/${userId}`, 'PUT', data);
          return true;
      } catch { return false; }
  },

  resetPassword: async (email: string) => {
      // Call WP endpoint or mock
      return true;
  },

  getOrderNotes: async (orderId: number): Promise<OrderNote[]> => {
      try {
          const notes = await fetchWooCommerce(`/orders/${orderId}/notes`);
          return notes.map((n: any) => ({
              id: n.id,
              note: n.note,
              customer_note: n.customer_note,
              date_created: new Date(n.date_created).toLocaleString()
          }));
      } catch { return []; }
  },

  getProfileSync: async (email: string): Promise<User | null> => {
       const customers = await fetchWooCommerce(`/customers?email=${email}`);
       if (customers.length > 0) {
           const c = customers[0];
           return {
               id: c.id,
               username: c.username,
               email: c.email,
               avatar_url: c.avatar_url || getBrandedAvatar(c.username)
           };
       }
       return null;
  },

  getUserOrders: async (userId: number): Promise<Order[]> => {
      try {
          const orders = await fetchWooCommerce(`/orders?customer=${userId}`);
          return orders.map(mapOrder);
      } catch { return []; }
  },

  getPage: async (slug: string): Promise<{title: string, content: string} | null> => {
      try {
          const pages = await fetchWordPress(`/pages?slug=${slug}`);
          if (pages.length > 0) {
              return {
                  title: pages[0].title.rendered,
                  content: pages[0].content.rendered
              };
          }
          return null;
      } catch { return null; }
  },

  trackOrder: async (orderId: string, email: string, token?: string): Promise<{type: string, data?: Order}> => {
      try {
          const order = await fetchWooCommerce(`/orders/${orderId}`);
          // Simple email verification match or token match (order_key)
          if (order.billing.email.toLowerCase() === email.toLowerCase() || (token && order.order_key === token)) {
               return { type: 'success', data: mapOrder(order) };
          }
          return { type: 'error' };
      } catch { return { type: 'error' }; }
  }
};