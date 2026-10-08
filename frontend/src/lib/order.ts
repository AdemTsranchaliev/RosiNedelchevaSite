import type { CartItem } from "@/components/CartProvider";

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
};

export type PlacedOrder = {
  number: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  customer: OrderCustomer;
  payment?: "card" | "cod";
  delivery?: "address" | "office";
  discount?: number;
  shipping?: number;
  eventId?: string;
};

const ORDER_KEY = "rosi-order";
const PENDING_KEY = "rosi-order-pending";

let orderCacheRaw: string | undefined;
let orderCache: PlacedOrder | null = null;

export function placedOrderSnapshot(): PlacedOrder | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ORDER_KEY) ?? "";
  if (raw === orderCacheRaw) return orderCache;
  orderCacheRaw = raw;
  if (!raw) {
    orderCache = null;
    return null;
  }
  try {
    orderCache = JSON.parse(raw) as PlacedOrder;
  } catch {
    orderCache = null;
  }
  return orderCache;
}

export function savePendingOrder(order: PlacedOrder) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(order));
}

export function readPendingOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlacedOrder;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  sessionStorage.removeItem(PENDING_KEY);
}

export function saveOrder(order: PlacedOrder) {
  const raw = JSON.stringify(order);
  sessionStorage.setItem(ORDER_KEY, raw);
  orderCacheRaw = raw;
  orderCache = order;
}

export function readOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlacedOrder;
  } catch {
    return null;
  }
}

export function nextOrderNumber() {
  const stamp = new Date();
  const day = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}`;
  const tail = String(Math.floor(1000 + Math.random() * 9000));
  return `RN-${day}-${tail}`;
}
