
export interface Variation {
  id: number;
  name: string;
  price: string;
  regular_price?: string;
  stock_status: string;
}

export interface Coupon {
    id: number;
    code: string;
    amount: string;
    discount_type: 'percent' | 'fixed_cart';
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  short_description: string;
  description: string;
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[]; 
  cross_sell_ids: number[];
  stock_status: string;
  stock_quantity: number | null;
  average_rating: string;
  rating_count: number;
  platform?: 'Steam' | 'Xbox' | 'PSN' | 'Origin' | 'Uplay' | 'Android';
  variations?: Variation[];
  type?: string;
  attributes?: { id: number; name: string; options: string[] }[];
  featured: boolean; 
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: Variation;
  custom_price?: string; // For bundle pricing overrides
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
}

export interface OrderNote {
  id: number;
  note: string;
  customer_note: boolean;
  date_created: string;
}

export interface OrderDownload {
  id: string;
  name: string;
  file: string;
  download_url: string;
}

export interface Order {
  id: number;
  status: string;
  total: string;
  currency_symbol: string;
  date_created: string;
  customer_note: string; // Note FROM customer
  line_items: {
      name: string;
      quantity: number;
      license_key?: string;
      image: string;
      downloads?: OrderDownload[]; // For downloadable files
  }[];
}
