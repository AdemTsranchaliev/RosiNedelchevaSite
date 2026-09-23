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
};

const ORDER_KEY = "rosi-order";

export function saveOrder(order: PlacedOrder) {
  sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
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
