
import { Product, Category, Order, User, OrderNote, Coupon } from '../types';
import { config } from '../config';

// --- MOCK DATA FOR FALLBACK ONLY ---
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Action', slug: 'action', count: 120 },
  { id: 6, name: 'Gift Cards', slug: 'gift-cards', count: 15 },
];

export const MOCK_PRODUCTS: Product[] = []; // Empty default, relies on API

// UPDATED BACKEND DOMAINS
const WC_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wc/v3";
const WP_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wp/v2";

// NOTE: Generate new keys in WooCommerce > Settings > Advanced > REST API on your new site
const CONSUMER_KEY = "ck_97520f17fc4470d40b9625ea0cf0911c5a0ce9bb";
const CONSUMER_SECRET = "cs_ad555ccecf6ebc4d1c84a3e14d74b53dd55de903";

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
    // WP API usually doesn't need Basic Auth for reading public pages, but we send it just in case
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

const findPaymentUrl = (order: any): string | null => {
    let url = null;
    
    // 1. Search Meta Data for External Gateway URL
    // We look for _api_payment_url (Our Custom Fix) OR standard keys
    if (order.meta_data && Array.isArray(order.meta_data)) {
        const externalLinkMeta = order.meta_data.find((m: any) => 
            m.key === '_api_payment_url' || // Priority: Our custom PHP hook
            (typeof m.value === 'string' && m.value.includes('pay.mhjoygamershub.com')) || 
            m.key === 'uddoktapay_payment_url' ||
            m.key === '_payment_url'
        );
        if (externalLinkMeta) {
            url = externalLinkMeta.value;
        }
    }

    // 2. Check payment_result (Standard WooCommerce)
    if (!url && order.payment_result && order.payment_result.redirect_url) {
         url = order.payment_result.redirect_url;
    } 
    
    // 3. Fallback: Standard payment_url (Ignore admin links if possible)
    if (!url && order.payment_url) {
         if (!order.payment_url.includes('order-pay')) {
             url = order.payment_url;
         }
    }
    
    return url;
};

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

  getPage: async (slug: string): Promise<{ title: string, content: string } | null> => {
      try {
          const pages = await fetchWordPress(`/pages?slug=${slug}`);
          if (pages.length > 0) {
              return {
                  title: pages[0].title.rendered,
                  content: pages[0].content.rendered
              };
          }
          return null;
      } catch (e) {
          return null;
      }
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
      } catch (e) {
          return null;
      }
  },

  createOrder: async (orderData: any): Promise<{ id: number; success: boolean; payment_url?: string; debug_meta?: any; debug_payment_result?: any }> => {
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

    const payment_method_id = orderData.payment_method === 'manual' ? 'bacs' : 'uddoktapay';
    const coupon_lines = orderData.coupon_code ? [{ code: orderData.coupon_code }] : [];

    const payload = {
        payment_method: payment_method_id,
        payment_method_title: orderData.payment_method === 'manual' ? 'Manual Transfer (bKash/Nagad)' : config.payment.methodTitle,
        set_paid: false,
        customer_id: orderData.customer_id || 0,
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
        coupon_lines: coupon_lines,
        meta_data: meta_data,
        customer_note: orderData.payment_method === 'manual' 
            ? `TrxID: ${orderData.trxId}, Sender: ${orderData.senderNumber}` 
            : "Customer proceeding to payment gateway..."
    };

    try {
        let order = await fetchWooCommerce('/orders', 'POST', payload);
        console.log("Order Created:", order);

        // ATTEMPT 1: Check for URL immediately
        let payment_url = findPaymentUrl(order);

        // ATTEMPT 2: If missing and using UddoktaPay, wait 1.5s and fetch again
        // This is crucial because the PHP hook we added might take a moment to save the meta data
        if (!payment_url && orderData.payment_method === 'uddoktapay') {
             console.log("Payment URL not found initially. Retrying fetch to catch PHP hook result...");
             await new Promise(r => setTimeout(r, 1500));
             order = await fetchWooCommerce(`/orders/${order.id}`);
             payment_url = findPaymentUrl(order);
             console.log("Retry Result URL:", payment_url);
        }

        return { 
            id: order.id, 
            success: true,
            payment_url: payment_url || undefined,
            debug_meta: order.meta_data, 
            debug_payment_result: order.payment_result 
        };
    } catch (error) {
        console.error("Order Creation Failed:", error);
        throw error;
    }
  },

  sendMessage: async (formData: any): Promise<boolean> => {
      try {
          const response = await fetch('https://admin.mhjoygamershub.com/wp-json/custom/v1/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          if (!response.ok) throw new Error('Failed to send message');
          return true;
      } catch (error) {
          console.error("Contact Form Error:", error);
          throw error;
      }
  },

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

  login: async (email: string): Promise<User> => {
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
                  license_key: o.meta_data.find((m:any) => m.key === '_license_key' || m.key === 'serial_number' || m.key === 'license_key')?.value || null, 
                  image: i.image?.src || "https://via.placeholder.com/150",
                  downloads: i.downloads || []
              }))
          }));
      } catch (error) {
          return [];
      }
  },

  getOrderNotes: async (orderId: number): Promise<OrderNote[]> => {
      try {
          const notes = await fetchWooCommerce(`/orders/${orderId}/notes`);
          return notes
              .filter((n: any) => n.customer_note)
              .map((n: any) => ({
                  id: n.id,
                  note: n.note,
                  customer_note: n.customer_note,
                  date_created: new Date(n.date_created).toLocaleString()
              }));
      } catch (e) {
          return [];
      }
  }
};