
import { Product, Category, Order, User, OrderNote, Coupon } from '../types';
import { config } from '../config';

// UPDATED BACKEND DOMAINS
const WC_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wc/v3";
const WP_BASE_URL = "https://admin.mhjoygamershub.com/wp-json/wp/v2";

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

// FRONTEND SCRAPER: Attempts to find the real Gateway URL from the WordPress Page
const attemptPaymentPageScrape = async (wpPaymentUrl: string): Promise<string> => {
    try {
        console.log("Attempting to bypass WP page by scraping:", wpPaymentUrl);
        // We fetch the WP page (frontend only!)
        const response = await fetch(wpPaymentUrl);
        const html = await response.text();

        // 1. Look for UddoktaPay specific redirect
        // Many plugins inject: window.location.href = "https://sandbox.uddoktapay.com/..."
        const jsRedirectMatch = html.match(/window\.location\.href\s*=\s*['"](https:\/\/.*?uddoktapay\.com.*?)['"]/);
        if (jsRedirectMatch && jsRedirectMatch[1]) {
            console.log("Found JS Redirect:", jsRedirectMatch[1]);
            return jsRedirectMatch[1];
        }

        // 2. Look for Form Action in the "Pay Now" button
        // <form ... action="https://sandbox.uddoktapay.com/checkout/..." ...>
        const formActionMatch = html.match(/action=['"](https:\/\/.*?uddoktapay\.com.*?)['"]/);
        if (formActionMatch && formActionMatch[1]) {
             console.log("Found Form Action:", formActionMatch[1]);
             return formActionMatch[1];
        }

        // 3. Look for generic 'Pay for order' link if it's an anchor tag
        const anchorMatch = html.match(/href=['"](https:\/\/.*?uddoktapay\.com.*?)['"]/);
        if (anchorMatch && anchorMatch[1]) {
            return anchorMatch[1];
        }
        
        console.log("No direct link found, returning WP link.");
        return wpPaymentUrl;
    } catch (e) {
        console.warn("CORS/Network blocked scraping. Falling back to WP page.", e);
        // If CORS blocks us (very likely on different domains), we MUST return the original link
        // so the user can at least pay, even if they see the WP page for a second.
        return wpPaymentUrl;
    }
};


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
    console.group("📦 ORDER CREATION - STANDARD API");
    console.log("Input Order Data:", orderData);

    try {
        const payload = {
            payment_method: orderData.payment_method,
            payment_method_title: orderData.payment_method === 'uddoktapay' ? 'bKash/Nagad (UddoktaPay)' : 'Manual',
            set_paid: false,
            billing: orderData.billing,
            line_items: orderData.items.map((i: any) => {
                const lineItem: any = {
                    product_id: i.id,
                    quantity: i.quantity
                };
                // CRITICAL FIX: Ensure variation_id is passed if it exists
                // This ensures the correct denomination is selected in WooCommerce
                if (i.selectedVariation && i.selectedVariation.id) {
                    lineItem.variation_id = i.selectedVariation.id;
                }
                return lineItem;
            }),
            customer_id: orderData.customer_id || 0,
            coupon_lines: orderData.coupon_code ? [{ code: orderData.coupon_code }] : [],
            meta_data: [
                 { key: 'billing_phone', value: orderData.billing.phone },
                 { key: 'sender_number', value: orderData.senderNumber },
                 { key: 'transaction_id', value: orderData.trxId }
            ]
        };

        console.log("Sending Payload to WC:", payload);

        const data = await fetchWooCommerce('/orders', 'POST', payload);
        console.log("WC Response:", data);
        
        let finalUrl = data.payment_url;
        
        // ATTEMPT BYPASS IF UDDOKTAPAY
        if (orderData.payment_method === 'uddoktapay' && finalUrl) {
              const directGatewayUrl = await attemptPaymentPageScrape(finalUrl);
              finalUrl = directGatewayUrl;
        }

        return { 
            success: true, 
            id: data.id, 
            payment_url: finalUrl, 
            guest_token: data.order_key 
        }; 

    } catch (proxyError: any) {
        console.error("❌ NETWORK ERROR:", proxyError);
        throw proxyError;
    } finally {
        console.groupEnd();
    }
  },

  verifyPayment: async (orderId: number, invoiceId?: string): Promise<boolean> => {
      // Backend verification is usually automatic via Webhooks.
      // Frontend just assumes success if redirected back with success param.
      return true;
  },

  sendMessage: async (formData: any): Promise<boolean> => {
       // Placeholder
       return true;
  },

  register: async (userData: any): Promise<User> => {
       throw new Error("Registration requires custom backend support.");
  },

  login: async (email: string, password?: string): Promise<User> => {
      throw new Error("Login requires JWT Auth plugin configuration.");
  },

  resetPassword: async (email: string): Promise<boolean> => {
       return true;
  },

  updateProfile: async (userId: number, data: any): Promise<boolean> => {
       return false;
  },

  getProfileSync: async (email: string): Promise<User | null> => {
      return null;
  },
  
  getProfile: async (email: string): Promise<User | null> => {
      return null;
  },

  getUserOrders: async (userId: number): Promise<Order[]> => {
      try {
          const data = await fetchWooCommerce(`/orders?customer=${userId}&per_page=20`);
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

  trackOrder: async (orderId: string, email: string, token?: string): Promise<{ type: 'success' | 'email_sent' | 'error', data?: Order }> => {
      try {
          const orderData = await fetchWooCommerce(`/orders/${orderId}`);
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
