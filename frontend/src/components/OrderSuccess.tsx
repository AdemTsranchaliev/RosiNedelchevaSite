"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useCart } from "@/components/CartProvider";
import { CheckoutBar } from "@/components/CheckoutForm";
import { onConsentChange } from "@/lib/consent";
import { formatPrice, product, site } from "@/lib/content";
import {
  clearPendingOrder,
  readOrder,
  readPendingOrder,
  saveOrder,
  type PlacedOrder,
} from "@/lib/order";
import { api } from "@/lib/session";
import { toTrackedItem, trackPurchase } from "@/lib/tracking";

type CheckoutReceipt = {
  paid: boolean;
  number: string;
  total: number;
  shipping: number;
  discountPercent: number;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  deliveryType: string;
  createdAt: string;
  items: { productId: number; title: string; price: number; quantity: number }[];
};

export function OrderSuccess() {
  const { clear } = useCart();
  const [order, setOrder] = useState<PlacedOrder | null | undefined>(undefined);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setOrder(readOrder());
      return;
    }

    let cancelled = false;
    api<CheckoutReceipt>(`/api/orders/checkout?session_id=${encodeURIComponent(sessionId)}`)
      .then((receipt) => {
        if (cancelled) return;
        if (!receipt.paid) {
          setProblem("Плащането още не е получено. Ако сумата е удържана, ще се видим с поръчката след малко.");
          setOrder(null);
          return;
        }
        const pending = readPendingOrder();
        const placed = pending?.number === receipt.number ? { ...pending, total: receipt.total, shipping: receipt.shipping } : receiptOrder(receipt);
        saveOrder(placed);
        clearPendingOrder();
        clear();
        setOrder(placed);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setProblem(cause instanceof Error ? cause.message : "Плащането не се потвърди.");
        setOrder(null);
      });

    return () => {
      cancelled = true;
    };
  }, [clear]);

  useEffect(() => {
    if (!order) return;
    const send = () =>
      trackPurchase({
        number: order.number,
        total: order.total,
        shipping: order.shipping,
        eventId: order.eventId,
        items: order.items.map(toTrackedItem),
      });
    send();
    return onConsentChange(send);
  }, [order]);

  if (order === undefined) {
    return (
      <div className="bg-paper">
        <CheckoutBar href="/" label="Към началото" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-paper">
        <CheckoutBar href={problem ? "/porachka" : "/"} label={problem ? "Към поръчката" : "Към началото"} />
        <div className="mx-auto max-w-lg px-5 pb-20 pt-10 md:px-8">
          <h1 className="font-display text-4xl tracking-tight">{problem ? "Плащането не мина" : "Няма активна поръчка"}</h1>
          {problem ? <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">{problem}</p> : null}
          <Link
            href={problem ? "/porachka" : "/karti"}
            className="mt-8 inline-flex h-12 items-center bg-clay px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-paper"
          >
            {problem ? "Опитайте отново" : "Към картите"}
          </Link>
        </div>
      </div>
    );
  }

  const paidByCard = order.payment === "card";
  const paymentLabel = order.payment === "cod" ? "Наложен платеж" : order.payment === "card" ? "С карта" : "—";
  const place =
    order.customer.address === order.customer.city
      ? order.customer.city
      : `${order.customer.address}, ${order.customer.city}`;

  return (
    <div className="bg-paper">
      <CheckoutBar href="/" label="Към началото" />
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <article className="border border-[#246b45]/20 bg-white">
          <header className="bg-[#e5f3ea] px-5 py-6 sm:px-7">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#246b45] text-[#f4faf6]"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="min-w-0 flex-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#246b45]">Всичко е наред</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#1b4a30]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#246b45]" aria-hidden />
                {paidByCard ? "Платено" : "Приета"}
              </span>
            </div>
            <h1 className="mt-4 font-display text-[2rem] leading-none tracking-tight text-[#1b4a30] sm:text-4xl">
              Поръчката е приета
            </h1>
          </header>

          <div className="grid border-b border-line sm:grid-cols-3">
            <SummaryCell label="Номер">
              <span className="font-display text-2xl leading-none tracking-tight text-[#1b4a30]">{order.number}</span>
            </SummaryCell>
            <SummaryCell label="Плащане">{paymentLabel}</SummaryCell>
            <SummaryCell label="Доставка">1–3 работни дни</SummaryCell>
          </div>

          <div className="grid md:grid-cols-2">
            <section className="border-b border-line px-5 py-6 sm:px-7 md:border-b-0 md:border-r">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#246b45]">Получател</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Име">{order.customer.name}</Field>
                <Field label="Телефон">{order.customer.phone}</Field>
                <Field label="Имейл" className="sm:col-span-2">
                  {order.customer.email}
                </Field>
                <Field label={order.delivery === "office" ? "Офис" : "Адрес"} className="sm:col-span-2">
                  {place}
                </Field>
              </dl>
            </section>

            <section className="px-5 py-6 sm:px-7">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#246b45]">Поръчка</h2>
              <ul className="mt-4 space-y-4">
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
              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                {order.shipping ? (
                  <div className="flex items-baseline justify-between text-ink-soft">
                    <dt>Доставка</dt>
                    <dd className="tabular-nums">{formatPrice(order.shipping)}</dd>
                  </div>
                ) : null}
                {order.discount ? (
                  <div className="flex items-baseline justify-between text-[#246b45]">
                    <dt>Отстъпка</dt>
                    <dd className="tabular-nums">−{order.discount}%</dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-mute">Общо</dt>
                  <dd className="font-display text-3xl leading-none text-[#1b4a30]">{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <footer className="flex flex-col gap-5 border-t border-line bg-paper px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div className="space-y-3 text-sm font-light text-ink-soft">
              <p>Ще се свържем на {order.customer.phone}, за да потвърдим поръчката.</p>
              <p>
                Въпроси —{" "}
                <a href={site.phoneHref} className="underline decoration-[#246b45]/50 underline-offset-4">
                  {site.phone}
                </a>{" "}
                или{" "}
                <a href={site.emailHref} className="underline decoration-[#246b45]/50 underline-offset-4">
                  {site.email}
                </a>
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-12 shrink-0 items-center justify-center bg-[#246b45] px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[#f4faf6] transition hover:bg-[#1b4a30]"
            >
              Към началото
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}

function SummaryCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-7 sm:last:border-r-0">
      <p className="text-[11px] uppercase tracking-[0.16em] text-mute">{label}</p>
      <div className="mt-1.5 text-[15px] leading-snug text-ink">{children}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-mute">{label}</dt>
      <dd className="mt-1 text-[15px] font-light leading-snug text-ink">{children}</dd>
    </div>
  );
}

function receiptOrder(receipt: CheckoutReceipt): PlacedOrder {
  return {
    number: receipt.number,
    createdAt: receipt.createdAt || new Date().toISOString(),
    items: (receipt.items ?? []).map((item) => ({
      id: String(item.productId),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: product.imageBox,
    })),
    total: receipt.total,
    shipping: receipt.shipping,
    discount: receipt.discountPercent,
    payment: "card",
    delivery: receipt.deliveryType === "office" ? "office" : "address",
    customer: {
      name: receipt.customerName,
      phone: receipt.phone,
      email: receipt.email,
      city: receipt.city,
      address: receipt.address,
      note: "",
    },
  };
}
