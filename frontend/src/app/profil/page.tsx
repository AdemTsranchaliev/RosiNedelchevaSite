"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/session";

type OrderLine = { title: string; price: number; quantity: number };
type ShopOrder = {
  id: number;
  number: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderLine[];
};
type ReviewInvite = {
  token: string;
  productName: string;
  orderNumber: string;
  used: boolean;
};

const statusLabel: Record<string, string> = {
  new: "Нова",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  completed: "Завършена",
  cancelled: "Отказана",
  unclaimed: "Непотърсена",
  returned: "Върната",
};

export default function ProfilePage() {
  const { user, ready, logout } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [invites, setInvites] = useState<ReviewInvite[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    api<ShopOrder[]>("/api/orders/mine")
      .then(setOrders)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Поръчките не се заредиха."));
    api<ReviewInvite[]>("/api/reviews/mine")
      .then(setInvites)
      .catch(() => setInvites([]));
  }, [ready, user]);

  if (!ready) return <div className="bg-paper pt-24" />;

  if (!user) {
    return (
      <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-4xl tracking-tight">Профил</h1>
          <p className="mt-4 text-[15px] font-light text-ink-soft">Влезте, за да видите поръчките си.</p>
          <Link href="/vhod" className="mt-8 inline-flex h-12 items-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper">
            Логин
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Акаунт</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight">{user.name}</h1>
            <p className="mt-2 text-sm font-light text-ink-soft">{user.email}</p>
          </div>
          <button type="button" onClick={logout} className="text-[11px] font-medium uppercase tracking-[0.18em] text-mute hover:text-ink">
            Изход
          </button>
        </div>

        <h2 className="mt-12 font-display text-3xl tracking-tight">Поръчки</h2>
        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}
        {orders.length === 0 ? (
          <p className="mt-4 text-[15px] font-light text-ink-soft">Все още няма поръчки от този акаунт.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div>
                  <p className="text-sm font-medium">{order.number}</p>
                  <p className="mt-1 text-sm font-light text-ink-soft">
                    {order.items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{order.total.toFixed(2).replace(".", ",")} €</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-mute">
                    {statusLabel[order.status] ?? order.status}
                  </p>
                  {invites
                    .filter((invite) => invite.orderNumber === order.number && !invite.used)
                    .map((invite) => (
                      <Link key={invite.token} href={`/revyu/${invite.token}`} className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-accent">
                        Напиши ревю
                      </Link>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
