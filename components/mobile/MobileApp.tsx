"use client";

import { useState } from "react";
import { MobileLanding } from "./MobileLanding";
import { MobileTerminal } from "./MobileTerminal";

export type MobileProduct = "perps" | "spot";

export function MobileApp() {
  const [product, setProduct] = useState<MobileProduct | null>(null);

  if (!product) {
    return <MobileLanding onSelect={setProduct} />;
  }

  return <MobileTerminal product={product} onBack={() => setProduct(null)} />;
}
