"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, site } from "@/lib/content";
import { readOrder, type PlacedOrder } from "@/lib/order";

export function OrderSuccess() {
  const [order, setOrder] = useState<PlacedOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(readOrder());
  }, []);

  if (order === undefined) {
    return <div className="bg-paper pt-24" />;
  }

  if (!order) {
    return (
      <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-4xl tracking-tight">Няма активна поръчка</h1>
          <Link
            href="/karti"
            className="mt-8 inline-flex h-12 items-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper"
          >
            Към картите
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper px-5 pb-20 pt-24 md:px-8 md:pt-28">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.8fr)]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Готово</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Поръчката е приета
          </h1>
          <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-ink-soft">
            Номер {order.number}. Ще се свържем на {order.customer.phone}, за да я потвърдим.
            Доставка в България за 1–3 работни дни.
          </p>

          <dl className="mt-8 max-w-md space-y-3 text-sm font-light">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-mute">Получател</dt>
              <dd className="mt-1 text-ink">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-mute">Адрес</dt>
              <dd className="mt-1 text-ink">
                {order.customer.address}, {order.customer.city}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-mute">Имейл</dt>
              <dd className="mt-1 text-ink">{order.customer.email}</dd>
            </div>
          </dl>

          <p className="mt-8 text-sm font-light text-ink-soft">
            Въпроси —{" "}
            <a href={site.phoneHref} className="underline decoration-accent/60 underline-offset-4">
              {site.phone}
            </a>{" "}
            или{" "}
            <a href={site.emailHref} className="underline decoration-accent/60 underline-offset-4">
              {site.email}
            </a>
            .
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center border border-ink/20 px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-ink"
          >
            Към началото
          </Link>
        </div>

        <aside className="border border-line bg-[#f3eee6] px-5 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Поръчка</p>
          <ul className="mt-5 space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 bg-paper">
                  <Image src={item.image} alt="" fill className="object-contain" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-tight">{item.title}</p>
                  <p className="mt-1 text-[12px] font-light text-mute">{item.quantity} бр.</p>
                </div>
                <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-ink/10 pt-4">
            <span className="text-[11px] uppercase tracking-[0.16em] text-mute">Общо</span>
            <span className="font-display text-3xl leading-none">{formatPrice(order.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
