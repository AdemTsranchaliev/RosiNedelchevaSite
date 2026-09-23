"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, product } from "@/lib/content";
import { nextOrderNumber, saveOrder, type OrderCustomer } from "@/lib/order";
import { useCart } from "./CartProvider";

const fieldClass =
  "mt-2 w-full border border-line bg-paper px-3 py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent";

export function CheckoutForm() {
  const { items, total, ready, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || sending) return;

    const data = new FormData(event.currentTarget);
    const customer: OrderCustomer = {
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      city: String(data.get("city") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      note: String(data.get("note") ?? "").trim(),
    };

    if (!customer.name || !customer.phone || !customer.email || !customer.city || !customer.address) {
      setError("Попълнете име, телефон, имейл, град и адрес.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      setError("Въведете валиден имейл.");
      return;
    }
    if (customer.phone.replace(/\D/g, "").length < 8) {
      setError("Въведете телефон за връзка.");
      return;
    }

    setSending(true);
    setPlaced(true);
    saveOrder({
      number: nextOrderNumber(),
      createdAt: new Date().toISOString(),
      items,
      total,
      customer,
    });
    clear();
    router.push("/porachka/uspeh");
  }

  if (!ready || placed) {
    return <div className="bg-paper pt-24" />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-paper px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-lg">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Поръчка</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight">Количката е празна</h1>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
            Добавете комплекта, за да продължите.
          </p>
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
    <div className="bg-paper pt-16 md:pt-[4.25rem]">
      <div className="lg:grid lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.85fr)]">
        <form onSubmit={onSubmit} noValidate className="px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Поръчка</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight">Данни за доставка</h1>
          <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink-soft">
            След потвърждение ще се свържем на телефона. Доставка в България за 1–3 работни дни.
          </p>

          <div className="mt-6 border border-line lg:hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen((open) => !open)}
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-accent">
                {summaryOpen ? "Скрий поръчката" : "Покажи поръчката"}
              </span>
              <span className="font-display text-xl">{formatPrice(total)}</span>
            </button>
            {summaryOpen ? (
              <div className="border-t border-line px-4 py-4">
                <SummaryItems />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="mt-6 text-sm text-ink" role="alert">
              {error}
            </p>
          ) : null}

          <fieldset className="mt-8">
            <legend className="font-display text-2xl tracking-tight">Контакт</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Име" name="name" autoComplete="name" placeholder="Име и фамилия" />
              <Field label="Телефон" name="phone" type="tel" autoComplete="tel" placeholder="089 …" />
              <Field
                label="Имейл"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                className="sm:col-span-2"
              />
            </div>
          </fieldset>

          <fieldset className="mt-10">
            <legend className="font-display text-2xl tracking-tight">Адрес</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Град" name="city" autoComplete="address-level2" placeholder="София" />
              <Field
                label="Адрес"
                name="address"
                autoComplete="street-address"
                placeholder="Улица, номер, вход"
                className="sm:col-span-2"
              />
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">
                  Бележка
                </span>
                <textarea
                  name="note"
                  rows={3}
                  className={fieldClass}
                  placeholder="По желание"
                />
              </label>
            </div>
          </fieldset>

          <div className="mt-8 border border-line bg-paper-2/60 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Доставка</p>
            <p className="mt-2 text-sm font-light leading-relaxed text-ink">
              България · 1–3 работни дни
            </p>
            <p className="mt-1 text-[12px] font-light text-ink-soft">{product.priceNote}</p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-8 flex h-12 w-full items-center justify-center bg-clay text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {sending ? "Изпращане…" : "Завърши поръчката"}
          </button>
        </form>

        <aside className="hidden border-l border-line bg-[#f3eee6] lg:block">
          <div className="sticky top-16 px-8 py-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Вашата поръчка</p>
            <div className="mt-6">
              <SummaryItems />
            </div>
            <div className="mt-6 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="text-[11px] uppercase tracking-[0.16em] text-mute">Общо</span>
              <span className="font-display text-3xl leading-none">{formatPrice(total)}</span>
            </div>
            <p className="mt-2 text-[12px] font-light text-ink-soft">{product.priceNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryItems() {
  const { items } = useCart();
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <div className="relative h-16 w-14 shrink-0 bg-paper">
            <Image src={item.image} alt="" fill className="object-contain" sizes="56px" />
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[10px] text-paper">
              {item.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight">{item.title}</p>
            <p className="mt-1 text-[12px] font-light text-mute">Комплект</p>
          </div>
          <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  );
}
