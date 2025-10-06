// lib/finder/curated.ts
// Curated mock items for Finder (provision mode).
// Replace/augment with real merchant feeds later.

export type FinderItem = {
  id: string;
  title: string;
  merchant: "LAZADA_PH" | "SHOPEE_PH" | string;
  price: number;
  image?: string;
  url: string;
  rating?: number;
  reviews?: number;
  tags?: string[];
};

export const curated: FinderItem[] = [
  {
    id: "lz-1",
    title: "USB-C Desk Lamp with Touch Dimmer",
    merchant: "LAZADA_PH",
    price: 349,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=60",
    url: "https://www.lazada.com.ph/products/abc",
    rating: 4.7,
    reviews: 2150,
    tags: ["home", "lighting", "desk"],
  },
  {
    id: "sp-1",
    title: "Mini Tripod for Phones (Flexible Grip)",
    merchant: "SHOPEE_PH",
    price: 129,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=60",
    url: "https://shopee.ph/product/12345",
    rating: 4.6,
    reviews: 980,
    tags: ["phone", "creator", "accessory"],
  },
  {
    id: "lz-2",
    title: "Bluetooth Earbuds w/ ENC Mic",
    merchant: "LAZADA_PH",
    price: 599,
    image: "https://images.unsplash.com/photo-1518443780060-5cea188e8d8d?w=600&q=60",
    url: "https://www.lazada.com.ph/products/xyz",
    rating: 4.5,
    reviews: 3200,
    tags: ["audio", "gadget"],
  },
  {
    id: "sp-2",
    title: "Cable Organizer Clips (10-Pack)",
    merchant: "SHOPEE_PH",
    price: 89,
    image: "https://images.unsplash.com/photo-1587825140400-7d8d4634cd87?w=600&q=60",
    url: "https://shopee.ph/product/67890",
    rating: 4.8,
    reviews: 540,
    tags: ["desk", "cable", "organizer"],
  },
  {
    id: "lz-3",
    title: "Ergonomic Wrist Rest (Keyboard + Mouse)",
    merchant: "LAZADA_PH",
    price: 249,
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=60",
    url: "https://www.lazada.com.ph/products/qwe",
    rating: 4.6,
    reviews: 770,
    tags: ["desk", "ergonomics"],
  },
  {
    id: "sp-3",
    title: "MagSafe-Style Phone Stand (Foldable)",
    merchant: "SHOPEE_PH",
    price: 199,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=60",
    url: "https://shopee.ph/product/11223",
    rating: 4.7,
    reviews: 1450,
    tags: ["phone", "stand", "desk"],
  },
];
