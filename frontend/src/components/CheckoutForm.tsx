"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, product } from "@/lib/content";
import { nextOrderNumber, saveOrder, type OrderCustomer } from "@/lib/order";
import { api } from "@/lib/session";
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
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payable, setPayable] = useState<number | null>(null);
  const [promoNote, setPromoNote] = useState("");
  const [delivery, setDelivery] = useState<"address" | "office">("address");
  const [payment, setPayment] = useState<"card" | "cod">("card");
  const [offices, setOffices] = useState<{ code: string; name: string }[]>([]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    const officeCode = String(data.get("office") ?? "");
    const office = offices.find((item) => item.code === officeCode);

    if (!customer.name || !customer.phone || !customer.email || !customer.city || (delivery === "address" && !customer.address)) {
      setError("Попълнете име, телефон, имейл, град и адрес.");
      return;
    }
    if (delivery === "office" && !office) {
      setError("Изберете офис на Еконт.");
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

    const number = nextOrderNumber();
    setSending(true);
    setError("");
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          number,
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          note: customer.note,
          paymentMethod: payment,
          deliveryType: delivery,
          officeCode: office?.code ?? null,
          officeName: office?.name ?? null,
          address: delivery === "office" ? office?.name ?? customer.address : customer.address,
          total: payable ?? total,
          promoCode: promo.trim() || null,
          items: items.map((item) => ({
            productId: item.id === product.id ? 1 : 0,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });
    } catch (cause) {
      setSending(false);
      setError(cause instanceof Error ? cause.message : "Поръчката не се записа. Опитайте отново.");
      return;
    }

    setPlaced(true);
    saveOrder({
      number,
      createdAt: new Date().toISOString(),
      items,
      total,
      customer,
    });
    clear();
    router.push("/porachka/uspeh");
  }

  async function loadOffices(city: string) {
    if (delivery !== "office" || city.trim().length < 2) return;
    try {
      const list = await api<{ code: string; name: string }[]>(`/api/courier/offices?city=${encodeURIComponent(city.trim())}`);
      setOffices(list);
    } catch {
      setOffices([]);
    }
  }

  async function applyPromo() {
    const quote = await api<{ ok: boolean; message: string; percent: number; total: number }>("/api/promo/quote", {
      method: "POST",
      body: JSON.stringify({ subtotal: total, code: promo }),
    });
    setPromoNote(quote.message);
    setDiscount(quote.ok ? quote.percent : 0);
    setPayable(quote.ok ? quote.total : total);
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
              <Field label="Град" name="city" autoComplete="address-level2" placeholder="София" onBlur={(event) => loadOffices(event.target.value)} />
              {delivery === "address" ? (
                <Field
                  label="Адрес"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Улица, номер, вход"
                  className="sm:col-span-2"
                />
              ) : (
                <label className="block sm:col-span-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Офис на Еконт</span>
                  <select name="office" className={fieldClass} defaultValue="">
                    <option value="">Изберете офис</option>
                    {offices.map((office) => (
                      <option key={office.code} value={office.code}>{office.name}</option>
                    ))}
                  </select>
                </label>
              )}
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

          <fieldset className="mt-10">
            <legend className="font-display text-2xl tracking-tight">Доставка и плащане</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Choice name="delivery" checked={delivery === "address"} onChange={() => setDelivery("address")} title="До адрес" />
              <Choice name="delivery" checked={delivery === "office"} onChange={() => setDelivery("office")} title="До офис на Еконт" />
              <Choice name="payment" checked={payment === "card"} onChange={() => setPayment("card")} title="С карта" />
              <Choice name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} title="Наложен платеж" />
            </div>
            <p className="mt-3 text-[12px] font-light text-ink-soft">{product.priceNote}</p>
          </fieldset>

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
            <div className="mt-6 flex gap-2">
              <input
                value={promo}
                onChange={(event) => setPromo(event.target.value.toUpperCase())}
                placeholder="Промокод"
                className="h-11 min-w-0 flex-1 border border-line bg-paper px-3 text-sm uppercase outline-none"
              />
              <button type="button" onClick={applyPromo} className="h-11 bg-clay px-4 text-[11px] uppercase tracking-[0.14em] text-paper">
                Приложи
              </button>
            </div>
            {promoNote ? <p className="mt-2 text-sm text-ink-soft">{promoNote}</p> : null}
            <div className="mt-6 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="text-[11px] uppercase tracking-[0.16em] text-mute">
                {discount > 0 ? `Общо −${discount}%` : "Общо"}
              </span>
              <span className="font-display text-3xl leading-none">{formatPrice(payable ?? total)}</span>
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

function Choice({ name, checked, onChange, title }: { name: string; checked: boolean; onChange: () => void; title: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm ${checked ? "border-clay bg-paper-2" : "border-line"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {title}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  className = "",
  onBlur,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onBlur={onBlur}
        className={fieldClass}
      />
    </label>
  );
}
