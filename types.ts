
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

// Interface for the Calculator Info Endpoint
export interface CalculatorInfo {
    product_id: number;
    currency: string;      // e.g. "USD"
    exchange_rate: number; // e.g. 129
    denominations: number[];
    min_amount: number;
    max_amount: number;
}

// NEW: Interface for Calculator Calculation Result
export interface CalculatorResult {
    success: boolean;
    requested_amount: number;
    actual_amount: number;
    match_type: 'exact' | 'closest';
    currency: string;
    total_bdt: number;
    items: {
        variation_id: number;
        name: string;
        quantity: number;
        unit_price_bdt: number;
        subtotal_bdt: number;
    }[];
    // New fields from CTO
    calculation_token?: string; 
    conversion?: {
        original_amount: number;
        original_currency: string;
        converted_amount: number;
        converted_currency: string;
    };
    message?: string;
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
  exchange_rate?: number; 
  profit_margin?: number; // New field for Fixed Profit Amount from Backend
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: Variation;
  custom_price?: string; // For bundle pricing overrides
  
  // SECURITY TOKEN FIELDS
  calculation_token?: string;
  calculator_product_id?: number;
  calculator_amount?: number;
  calculator_currency?: string; // NEW: Added per CTO checklist
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
