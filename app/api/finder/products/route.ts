// app/api/finder/products/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";

export async function GET() {
  // ✅ Provisioned test data for PH launch (always available)
  const items = [
    {
      id: "sp-1",
      title: "Mini Tripod for Phones (Flexible Grip)",
      merchant: "SHOPEE_PH",
      price: 129,
      image:
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=60",
      url: "https://shopee.ph/product/12345",
      rating: 4.6,
      reviews: 980,
      tags: ["phone", "creator", "accessory"],
    },
    {
      id: "lz-1",
      title: "Wireless Earbuds V5 – Noise Cancelling",
      merchant: "LAZADA_PH",
      price: 499,
      image:
        "https://images.unsplash.com/photo-1585386959984-a41552231664?w=600&q=60",
      url: "https://www.lazada.com.ph/products/abc",
      rating: 4.4,
      reviews: 1240,
      tags: ["audio", "music", "wireless"],
    },
    {
      id: "sp-2",
      title: "LED Makeup Mirror with Touch Sensor",
      merchant: "SHOPEE_PH",
      price: 389,
      image:
        "https://images.unsplash.com/photo-1605136491051-12d9f62a6b0b?w=600&q=60",
      url: "https://shopee.ph/product/67890",
      rating: 4.8,
      reviews: 670,
      tags: ["beauty", "mirror", "lighting"],
    },
  ];

  return NextResponse.json({ ok: true, items });
}
