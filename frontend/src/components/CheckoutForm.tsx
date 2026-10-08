"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice, product } from "@/lib/content";
import { onConsentChange, readTrackingConsent } from "@/lib/consent";
import { demoMode } from "@/lib/demo";
import { nextOrderNumber, saveOrder, savePendingOrder, type OrderCustomer } from "@/lib/order";
import { api } from "@/lib/session";
import { marketingAttribution, newEventId, toTrackedItem, trackBeginCheckout } from "@/lib/tracking";
import { useCart, type CartItem } from "./CartProvider";

const fieldClass =
  "mt-1.5 w-full rounded-lg border bg-paper px-3 py-3 text-base text-ink outline-none transition placeholder:text-mute/70 focus:border-clay";
const DRAFT_KEY = "rosi-checkout-v1";

type Delivery = "address" | "office";
type Payment = "card" | "cod";

type Draft = {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  officeCode: string;
  delivery: Delivery;
  payment: Payment;
  promo: string;
};

type Quote = { ok: boolean; message: string; percent: number; total: number };
type ShipQuote = { amount: number; currency: string; description: string };
type Office = {
  code: string;
  name: string;
  kind?: string;
  address?: string;
  city?: string;
  hours?: string;
};
type CityHit = { name: string; postCode: string; region: string };
type FieldName = "name" | "phone" | "email" | "city" | "address" | "office";

const emptyDraft: Draft = {
  name: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  note: "",
  officeCode: "",
  delivery: "address",
  payment: "card",
  promo: "",
};

export function CheckoutForm() {
  const { items, total, ready, clear } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payable, setPayable] = useState<number | null>(null);
  const [promoNote, setPromoNote] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [officesStatus, setOfficesStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [officeRetry, setOfficeRetry] = useState(0);
  const [officeQuery, setOfficeQuery] = useState("");
  const [cityHits, setCityHits] = useState<CityHit[]>([]);
  const [cityStatus, setCityStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [settledCity, setSettledCity] = useState("");
  const settledCityRef = useRef("");
  const [streetHits, setStreetHits] = useState<string[]>([]);
  const [streetStatus, setStreetStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [shipping, setShipping] = useState<number | null>(null);
  const [shippingNote, setShippingNote] = useState("");
  const [shippingStatus, setShippingStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [accepted, setAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");
  const checkoutTracked = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment") === "cancelled") {
      setError("Плащането е прекъснато. Нищо не е удържано — можете да опитате отново.");
      url.searchParams.delete("payment");
      const query = url.searchParams.toString();
      window.history.replaceState(null, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    const saved = readDraft();
    if (saved) {
      setDraft(saved);
      setAppliedCode(saved.promo.trim());
      if (saved.note) setNoteOpen(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;
    setDraft((prev) => ({
      ...prev,
      name: prev.name || user.name,
      email: prev.email || user.email,
    }));
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    const send = () => {
      if (checkoutTracked.current) return;
      const consent = readTrackingConsent();
      if (!consent?.analytics && !consent?.marketing) return;
      checkoutTracked.current = true;
      trackBeginCheckout(items.map(toTrackedItem), payable ?? total);
    };
    send();
    return onConsentChange(send);
  }, [ready, items, payable, total]);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    if (appliedCode) setQuoting(true);
    api<Quote>("/api/promo/quote", {
      method: "POST",
      body: JSON.stringify({
        subtotal: total,
        code: appliedCode,
        items: orderLines(items),
      }),
    })
      .then((quote) => {
        if (cancelled) return;
        setDiscount(quote.ok ? quote.percent : 0);
        setPayable(quote.ok ? quote.total : total);
        setPromoNote(quote.percent > 0 || appliedCode ? quote.message : "");
      })
      .catch(() => {
        if (cancelled) return;
        setPayable(total);
        if (appliedCode) setPromoNote("Кодът не можа да се провери. Опитайте отново.");
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, total, appliedCode, items]);

  useEffect(() => {
    if (draft.delivery !== "office" || draft.city.trim() !== settledCity || settledCity.length < 2) {
      setOffices([]);
      setOfficesStatus("idle");
      return;
    }
    const city = settledCity;

    let cancelled = false;
    setOffices([]);
    setOfficesStatus("loading");
    setOfficeQuery("");
    const handle = window.setTimeout(() => {
      api<Office[]>(`/api/courier/offices?city=${encodeURIComponent(city)}`)
        .then((list) => {
          if (cancelled) return;
          setOffices(list);
          setDraft((prev) => {
            if (list.some((office) => office.code === prev.officeCode)) return prev;
            const next = list.length === 1 ? list[0].code : "";
            if (prev.officeCode === next) return prev;
            return { ...prev, officeCode: next };
          });
          setOfficesStatus("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setOffices([]);
          setOfficesStatus("error");
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [draft.delivery, draft.city, settledCity, officeRetry]);

  useEffect(() => {
    const query = draft.city.trim();
    if (query.length < 2) {
      settledCityRef.current = "";
      setSettledCity("");
      setCityHits([]);
      setCityStatus("idle");
      return;
    }
    if (query === settledCityRef.current) {
      setCityStatus("ready");
      return;
    }
    setCityStatus("loading");
    setCityHits([]);
    let cancelled = false;
    const handle = window.setTimeout(() => {
      api<CityHit[]>(`/api/courier/cities?q=${encodeURIComponent(query)}`)
        .then((list) => {
          if (cancelled) return;
          const match = list.some((city) => city.name === query) ? query : "";
          settledCityRef.current = match;
          setSettledCity(match);
          setCityHits(list);
          setCityStatus("ready");
          if (!match) setDraft((prev) => (prev.officeCode ? { ...prev, officeCode: "" } : prev));
        })
        .catch(() => {
          if (cancelled) return;
          settledCityRef.current = "";
          setSettledCity("");
          setCityHits([]);
          setCityStatus("ready");
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [draft.city]);

  useEffect(() => {
    if (draft.delivery !== "address" || draft.city.trim() !== settledCity || /\d/.test(draft.address)) {
      setStreetHits([]);
      setStreetStatus("idle");
      return;
    }
    const query = draft.address.trim();
    if (settledCity.length < 2 || query.length < 2) {
      setStreetHits([]);
      setStreetStatus("idle");
      return;
    }
    setStreetStatus("loading");
    setStreetHits([]);
    let cancelled = false;
    const handle = window.setTimeout(() => {
      api<string[]>(`/api/courier/streets?city=${encodeURIComponent(settledCity)}&q=${encodeURIComponent(query)}`)
        .then((list) => {
          if (cancelled) return;
          setStreetHits(list);
          setStreetStatus("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setStreetHits([]);
          setStreetStatus("ready");
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [draft.delivery, draft.address, settledCity]);

  useEffect(() => {
    const city = draft.city.trim();
    const readyDestination =
      city !== settledCity || settledCity.length < 2
        ? false
        : draft.delivery === "office"
          ? Boolean(draft.officeCode)
          : /\d/.test(draft.address);
    if (!readyDestination) {
      setShipping(null);
      setShippingNote("");
      setShippingStatus("idle");
      return;
    }

    let cancelled = false;
    setShippingStatus("loading");
    const handle = window.setTimeout(() => {
      api<ShipQuote>("/api/courier/quote", {
        method: "POST",
        body: JSON.stringify({
          city,
          deliveryType: draft.delivery,
          officeCode: draft.delivery === "office" ? draft.officeCode : null,
          address: draft.delivery === "address" ? draft.address.trim() : "",
          paymentMethod: draft.payment,
          total: payable ?? total,
        }),
      })
        .then((quote) => {
          if (cancelled) return;
          setShipping(quote.amount);
          setShippingNote(quote.description);
          setShippingStatus("ready");
        })
        .catch((cause) => {
          if (cancelled) return;
          setShipping(null);
          setShippingNote(cause instanceof Error ? cause.message : "Доставката не се изчисли.");
          setShippingStatus("error");
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [draft.city, draft.delivery, draft.officeCode, draft.address, draft.payment, payable, total, settledCity]);

  function patch(partial: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function applyPromo() {
    setAppliedCode(draft.promo.trim());
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || sending) return;

    const customer: OrderCustomer = {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      city: draft.city.trim(),
      address: draft.address.trim(),
      note: draft.note.trim(),
    };
    const office = offices.find((item) => item.code === draft.officeCode);
    const place =
      draft.delivery === "office" && office
        ? [office.name, office.address].filter(Boolean).join(" · ")
        : customer.address;
    const problems = validate(customer, draft.delivery, office);
    if (!accepted) {
      setTermsError("Приемете условията, за да продължите.");
    }
    if (Object.keys(problems).length > 0 || !accepted) {
      setErrors(problems);
      setError(Object.keys(problems).length > 0 ? "Попълнете отбелязаните полета." : "Приемете условията, за да продължите.");
      const first = Object.keys(problems)[0] ?? "terms";
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const number = nextOrderNumber();
    const eventId = newEventId();
    const goods = payable ?? total;
    if (shipping === null) {
      setError(shippingNote || "Изберете адрес или пункт, за да изчислим доставката.");
      return;
    }
    const amount = goods + shipping;
    setSending(true);
    setError("");
    setErrors({});
    try {
      const created = await api<{ checkoutUrl?: string | null; number?: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          number,
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          note: customer.note,
          paymentMethod: draft.payment,
          deliveryType: draft.delivery,
          officeCode: office?.code ?? null,
          officeName: office?.name ?? null,
          address: place,
          acceptedTerms: true,
          total: amount,
          promoCode: appliedCode || null,
          items: orderLines(items),
          attribution: marketingAttribution(eventId),
        }),
      });
      if (draft.payment === "card") {
        if (!created.checkoutUrl) {
          if (!demoMode) throw new Error("Плащането с карта не се отвори.");
        } else {
          savePendingOrder({
            number: created.number || number,
            createdAt: new Date().toISOString(),
            items,
            total: amount,
            customer: { ...customer, address: place },
            payment: "card",
            delivery: draft.delivery,
            discount,
            shipping,
            eventId,
          });
          window.location.assign(created.checkoutUrl);
          return;
        }
      }
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
      total: amount,
      customer: {
        ...customer,
        address: place,
      },
      payment: draft.payment,
      delivery: draft.delivery,
      discount,
      shipping,
      eventId,
    });
    clear();
    router.push("/porachka/uspeh");
  }

  if (!ready || placed) {
    return (
      <div className="bg-paper">
        <CheckoutBar />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-paper">
        <CheckoutBar />
        <div className="mx-auto max-w-lg px-5 pb-20 pt-10 md:px-8">
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

  const goods = payable ?? total;
  const amount = goods + (shipping ?? 0);
  const cityChosen = settledCity.length >= 2 && draft.city.trim() === settledCity;
  const shipLabel = shippingStatus === "loading" ? "…" : shipping !== null ? formatPrice(shipping) : undefined;
  const payingByCard = draft.payment === "card";
  const actionLabel = sending
    ? payingByCard
      ? "Към плащане…"
      : "Изпращане…"
    : `${payingByCard ? "Плати" : "Завърши"} · ${formatPrice(amount)}`;

  return (
    <div className="bg-paper">
      <CheckoutBar />
      <div className="lg:grid lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.85fr)]">
        <form id="checkout" onSubmit={onSubmit} noValidate className="px-4 py-6 pb-36 sm:px-10 lg:px-14 lg:py-12 lg:pb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-accent">Поръчка</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Данни за доставка</h1>
          <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-ink-soft">
            Потвърждаваме по телефона. Цената за доставка идва от Еконт, след като изберете адрес или пункт.
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-line lg:hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen((open) => !open)}
            >
              <span className="text-[11px] uppercase tracking-[0.16em] text-accent">
                {summaryOpen ? "Скрий поръчката" : "Покажи поръчката"}
              </span>
              <span className="font-display text-xl">{formatPrice(amount)}</span>
            </button>
            {summaryOpen ? (
              <div className="border-t border-line px-4 py-4">
                <SummaryItems />
                <Totals discount={discount} subtotal={total} goods={goods} shipping={shipping} shippingStatus={shippingStatus} />
                <div className="mt-4">
                  <PromoField
                    value={draft.promo}
                    quoting={quoting}
                    note={promoNote}
                    onChange={(promo) => patch({ promo })}
                    onApply={applyPromo}
                  />
                </div>
              </div>
            ) : promoNote ? (
              <p className="border-t border-line px-4 py-2.5 text-[12px] text-ink-soft">{promoNote}</p>
            ) : null}
          </div>

          {error ? (
            <p className="mt-6 text-sm text-ink" role="alert">
              {error}
            </p>
          ) : null}

          <fieldset className="mt-6 lg:mt-8">
            <legend className="font-display text-2xl tracking-tight">Контакт</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Име"
                name="name"
                autoComplete="name"
                placeholder="Име и фамилия"
                value={draft.name}
                error={errors.name}
                onChange={(name) => patch({ name })}
              />
              <Field
                label="Телефон"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="089 …"
                value={draft.phone}
                error={errors.phone}
                onChange={(phone) => patch({ phone })}
              />
              <Field
                label="Имейл"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@email.com"
                className="sm:col-span-2"
                value={draft.email}
                error={errors.email}
                onChange={(email) => patch({ email })}
              />
            </div>
          </fieldset>

          <fieldset className="mt-6 lg:mt-8">
            <legend className="font-display text-2xl tracking-tight">Доставка</legend>
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <Choice
                name="delivery"
                checked={draft.delivery === "address"}
                onChange={() => patch({ delivery: "address" })}
                title="До адрес"
                detail="Куриер до врата"
                price={draft.delivery === "address" ? shipLabel : undefined}
              />
              <div className="border-t border-line">
                <Choice
                  name="delivery"
                  checked={draft.delivery === "office"}
                  onChange={() => patch({ delivery: "office" })}
                  title="До офис или еконтомат"
                  detail="Офис, еконтомат или драйв"
                  price={draft.delivery === "office" ? shipLabel : undefined}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <ComboField
                label="Град"
                name="city"
                autoComplete="address-level2"
                placeholder="Започнете да пишете"
                value={draft.city}
                error={errors.city}
                status={cityStatus}
                loadingText="Търсим града…"
                showEmpty={cityStatus === "ready" && draft.city.trim().length >= 2 && !cityChosen && cityHits.length === 0}
                onChange={(city) => patch(city.trim() === settledCityRef.current ? { city } : { city, officeCode: "" })}
                suggestions={cityChosen
                  ? []
                  : cityHits.map((city) => ({
                      key: city.name,
                      title: city.name,
                      detail: [city.region !== city.name ? city.region : "", city.postCode].filter(Boolean).join(" · "),
                    }))}
                onPick={(city) => {
                  settledCityRef.current = city;
                  setSettledCity(city);
                  setCityStatus("ready");
                  patch({ city });
                }}
              />
              {draft.delivery === "address" ? (
                <ComboField
                  label="Адрес"
                  name="address"
                  autoComplete="street-address"
                  placeholder={cityChosen ? "Улица и номер" : "Първо изберете град"}
                  value={draft.address}
                  error={errors.address}
                  disabled={!cityChosen}
                  status={streetStatus}
                  loadingText="Търсим адреса…"
                  showEmpty={streetStatus === "ready" && draft.address.trim().length >= 2 && !/\d/.test(draft.address) && streetHits.length === 0}
                  onChange={(address) => patch({ address })}
                  suggestions={streetHits
                    .filter((street) => street !== draft.address.trim())
                    .map((street) => ({ key: street, title: street }))}
                  onPick={(address) => patch({ address: `${address} ` })}
                />
              ) : (
                <OfficePicker
                  cityChosen={cityChosen}
                  offices={offices}
                  status={officesStatus}
                  query={officeQuery}
                  selectedCode={draft.officeCode}
                  error={errors.office}
                  onQuery={setOfficeQuery}
                  onSelect={(officeCode) => patch({ officeCode })}
                  onRetry={() => setOfficeRetry((value) => value + 1)}
                />
              )}
            </div>
            {shippingStatus === "error" && shippingNote ? (
              <p className="mt-3 text-[12px] text-ink" role="alert">
                {shippingNote}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="mt-6 lg:mt-8">
            <legend className="font-display text-2xl tracking-tight">Плащане</legend>
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <Choice
                name="payment"
                checked={draft.payment === "card"}
                onChange={() => patch({ payment: "card" })}
                title="С карта"
                detail="Продължавате към сигурно плащане"
              />
              <div className="border-t border-line">
                <Choice
                  name="payment"
                  checked={draft.payment === "cod"}
                  onChange={() => patch({ payment: "cod" })}
                  title="Наложен платеж"
                  detail="Плащате на куриера"
                />
              </div>
            </div>
          </fieldset>

          {noteOpen ? (
            <label className="mt-8 block">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Бележка</span>
              <textarea
                name="note"
                rows={3}
                value={draft.note}
                onChange={(event) => patch({ note: event.target.value })}
                className={`${fieldClass} border-line`}
                placeholder="По желание"
              />
            </label>
          ) : (
            <button
              type="button"
              className="mt-6 text-[12px] uppercase tracking-[0.14em] text-mute underline decoration-ink/20 underline-offset-4 lg:mt-8"
              onClick={() => setNoteOpen(true)}
            >
              Добави бележка
            </button>
          )}

          <div id="field-terms" className="mt-6 scroll-mb-36 lg:mt-8">
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
                termsError ? "border-[#b42318] bg-[#fdf2f2]" : accepted ? "border-clay bg-[#f3eee6]" : "border-line"
              }`}
            >
              <input
                id="accept-terms"
                type="checkbox"
                checked={accepted}
                aria-invalid={termsError ? true : undefined}
                aria-describedby={termsError ? "terms-error" : undefined}
                aria-label="Приемам общите условия, политиката за поверителност и условията за доставка и връщане"
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  if (event.target.checked) setTermsError("");
                }}
                className="sr-only"
              />
              <label
                htmlFor="accept-terms"
                className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 cursor-pointer place-items-center rounded border ${
                  termsError ? "border-[#b42318]" : accepted ? "border-clay bg-clay" : "border-ink/25"
                }`}
              >
                <span className={`mb-0.5 h-2 w-1.5 rotate-45 border-b-2 border-r-2 border-paper ${accepted ? "opacity-100" : "opacity-0"}`} />
              </label>
              <p className={`text-sm font-light leading-relaxed ${termsError ? "text-[#b42318]" : "text-ink-soft"}`}>
                <label htmlFor="accept-terms" className="cursor-pointer">
                  Приемам{" "}
                </label>
                <Link href="/obshti-uslovia" target="_blank" className={`underline underline-offset-4 ${termsError ? "text-[#b42318] decoration-[#b42318]/40" : "text-ink decoration-ink/20"}`}>
                  общите условия
                </Link>
                <label htmlFor="accept-terms" className="cursor-pointer">
                  ,{" "}
                </label>
                <Link href="/poveritelnost" target="_blank" className={`underline underline-offset-4 ${termsError ? "text-[#b42318] decoration-[#b42318]/40" : "text-ink decoration-ink/20"}`}>
                  политиката за поверителност
                </Link>
                <label htmlFor="accept-terms" className="cursor-pointer">
                  {" "}
                  и{" "}
                </label>
                <Link href="/dostavka" target="_blank" className={`underline underline-offset-4 ${termsError ? "text-[#b42318] decoration-[#b42318]/40" : "text-ink decoration-ink/20"}`}>
                  условията за доставка и връщане
                </Link>
                .
              </p>
            </div>
            {termsError ? (
              <p id="terms-error" className="mt-2 text-[12px] text-[#b42318]" role="alert">
                {termsError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={sending || shipping === null}
            aria-busy={sending || undefined}
            className="mt-8 hidden h-12 w-full items-center justify-center gap-2 rounded-lg bg-clay text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition hover:bg-ink disabled:opacity-60 sm:w-auto sm:px-10 lg:flex"
          >
            {sending ? <SpinnerIcon /> : null}
            {actionLabel}
          </button>
          <p className="mt-3 hidden text-[12px] font-light text-ink-soft lg:block">
            {payingByCard
              ? "След тази стъпка плащате с карта. Доставката е по тарифата на Еконт."
              : "Плащате на куриера. Доставката е по тарифата на Еконт."}
          </p>
        </form>

        <aside className="hidden border-l border-line bg-[#f3eee6] lg:block">
          <div className="sticky top-16 px-8 py-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Вашата поръчка</p>
            <div className="mt-6">
              <SummaryItems />
            </div>
            <div className="mt-6">
              <PromoField
                value={draft.promo}
                quoting={quoting}
                note={promoNote}
                onChange={(promo) => patch({ promo })}
                onApply={applyPromo}
              />
            </div>
            <Totals discount={discount} subtotal={total} goods={goods} shipping={shipping} shippingStatus={shippingStatus} />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <button
          type="submit"
          form="checkout"
          disabled={sending || shipping === null}
          aria-busy={sending || undefined}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-clay px-4 text-[13px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink disabled:opacity-60"
        >
          {sending ? <SpinnerIcon /> : null}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function CheckoutBar({ href = "/karti", label = "Назад" }: { href?: string; label?: string }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-10 lg:px-14">
        <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-ink">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {label}
        </Link>
        <Link href="/" aria-label="Росица Неделчева — начало" className="min-w-0 truncate text-right font-display text-[12px] uppercase tracking-[0.12em] text-ink sm:text-[13px] sm:tracking-[0.16em]">
          Росица Неделчева
        </Link>
      </div>
    </header>
  );
}

function Totals({
  discount,
  subtotal,
  goods,
  shipping,
  shippingStatus,
}: {
  discount: number;
  subtotal: number;
  goods: number;
  shipping: number | null;
  shippingStatus: "idle" | "loading" | "ready" | "error";
}) {
  const delivery =
    shippingStatus === "loading" ? "Изчисляване…" : shipping === null ? "След адрес" : formatPrice(shipping);
  return (
    <div className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
      <div className="flex items-baseline justify-between text-ink-soft">
        <span>Междинна сума</span>
        <span className="tabular-nums">{formatPrice(subtotal)}</span>
      </div>
      {discount > 0 ? (
        <div className="flex items-baseline justify-between text-ink-soft">
          <span>Отстъпка −{discount}%</span>
          <span className="tabular-nums">−{formatPrice(subtotal - goods)}</span>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between text-ink-soft">
        <span>Доставка</span>
        <span className="tabular-nums">{delivery}</span>
      </div>
      <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-mute">Общо</span>
        <span className="font-display text-3xl leading-none">{formatPrice(goods + (shipping ?? 0))}</span>
      </div>
    </div>
  );
}

function PromoField({
  value,
  quoting,
  note,
  onChange,
  onApply,
}: {
  value: string;
  quoting: boolean;
  note: string;
  onChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onApply();
            }
          }}
          placeholder="Промокод"
          aria-label="Промокод"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-sm uppercase outline-none focus:border-clay"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={quoting}
          className="h-11 rounded-lg bg-clay px-4 text-[11px] uppercase tracking-[0.14em] text-paper disabled:opacity-60"
        >
          {quoting ? "…" : "Приложи"}
        </button>
      </div>
      {note ? (
        <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
          {note}
        </p>
      ) : null}
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

function OfficePicker({
  cityChosen,
  offices,
  status,
  query,
  selectedCode,
  error,
  onQuery,
  onSelect,
  onRetry,
}: {
  cityChosen: boolean;
  offices: Office[];
  status: "idle" | "loading" | "ready" | "error";
  query: string;
  selectedCode: string;
  error?: string;
  onQuery: (value: string) => void;
  onSelect: (code: string) => void;
  onRetry: () => void;
}) {
  const [kind, setKind] = useState<string>("all");
  const [menu, setMenu] = useState(false);
  const blurTimer = useRef<number | null>(null);
  const selected = offices.find((office) => office.code === selectedCode);
  const present = (["office", "aps", "drive", "mps"] as const).filter((id) => offices.some((office) => (office.kind || "office") === id));
  const activeKind = kind !== "all" && !present.includes(kind as (typeof present)[number]) ? "all" : kind;
  const pool = activeKind === "all" ? offices : offices.filter((office) => (office.kind || "office") === activeKind);
  const needle = query.trim().toLocaleLowerCase("bg");
  const matches = needle
    ? pool.filter((office) => `${office.name} ${office.address ?? ""}`.toLocaleLowerCase("bg").includes(needle))
    : pool;
  const visible = matches.slice(0, 6);

  return (
    <div id="field-office" className="relative">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Място за получаване</span>
      {selected ? (
        <div className="mt-1.5 flex items-start justify-between gap-3 rounded-xl border border-clay bg-paper-2 px-3 py-3">
          <span className="min-w-0">
            <span className="block text-sm text-ink">{selected.name}</span>
            <span className="mt-1 block text-[12px] font-light leading-relaxed text-ink-soft">{pointDetail(selected)}</span>
          </span>
          <button
            type="button"
            className="shrink-0 text-[12px] text-mute underline decoration-ink/20 underline-offset-4"
            onClick={() => onSelect("")}
          >
            Промени
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              onFocus={() => {
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setMenu(true);
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setMenu(false), 120);
              }}
              placeholder={
                !cityChosen ? "Първо изберете град" : status === "loading" ? "Зареждаме пунктовете…" : "Търси офис, еконтомат или драйв"
              }
              disabled={!cityChosen || status !== "ready"}
              aria-invalid={error ? true : undefined}
              aria-busy={status === "loading" || undefined}
              aria-expanded={menu}
              className={`${fieldClass} ${error ? "border-accent" : "border-line"} disabled:cursor-not-allowed disabled:opacity-60 ${status === "loading" ? "pr-10" : ""}`}
            />
            {status === "loading" ? <FieldSpinner label="Зареждаме пунктовете…" /> : null}
          {menu && status === "ready" ? (
            <div className="absolute left-0 right-0 top-full z-[45] mt-1 overflow-hidden rounded-xl border border-line bg-paper shadow-[0_18px_40px_-24px_rgba(78,69,62,0.55)]">
              {present.length > 1 ? (
                <div className="flex gap-1 border-b border-line px-2 py-2">
                  {[{ id: "all", label: "Всички" }, ...present.map((id) => ({ id, label: kindLabel(id) }))].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setKind(filter.id);
                      }}
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        activeKind === filter.id ? "bg-clay text-paper" : "text-mute hover:bg-paper-2"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {visible.length > 0 ? (
                <ul className="max-h-[min(16rem,42svh)] overflow-auto py-1">
                  {visible.map((office) => (
                    <li key={office.code}>
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-paper-2"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          onSelect(office.code);
                          setMenu(false);
                        }}
                      >
                        <span className="block text-sm text-ink">{office.name}</span>
                        <span className="mt-0.5 block text-[12px] font-light text-ink-soft">{pointDetail(office)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-[12px] text-ink-soft">Няма съвпадение.</p>
              )}
              {matches.length > visible.length ? (
                <p className="border-t border-line px-3 py-2 text-[12px] font-light text-ink-soft">
                  Още {matches.length - visible.length}. Продължете да пишете.
                </p>
              ) : null}
            </div>
          ) : null}
          </div>
          {status === "loading" ? (
            <p className="mt-1 text-[12px] text-ink-soft" role="status">
              Зареждаме пунктовете…
            </p>
          ) : null}
        </>
      )}
      {error ? <span className="mt-1 block text-[12px] text-ink">{error}</span> : null}
      {status === "error" ? (
        <button
          type="button"
          className="mt-2 text-[12px] text-ink underline decoration-accent/60 underline-offset-4"
          onClick={onRetry}
        >
          Еконт не отговори. Опитайте пак.
        </button>
      ) : null}
      {status === "ready" && offices.length === 0 ? (
        <span className="mt-1 block text-[12px] text-ink-soft">Няма пункт на Еконт за този град.</span>
      ) : null}
      {!cityChosen && status !== "loading" ? (
        <span className="mt-1 block text-[12px] font-light text-ink-soft">Първо изберете град от списъка.</span>
      ) : null}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 animate-spin" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function FieldSpinner({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute bottom-4 right-3 text-mute" role="status">
      <SpinnerIcon />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ComboField({
  label,
  name,
  autoComplete,
  placeholder,
  value,
  error,
  disabled = false,
  status = "idle",
  loadingText = "Търсим…",
  showEmpty = false,
  suggestions,
  onChange,
  onPick,
}: {
  label: string;
  name: FieldName;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  status?: "idle" | "loading" | "ready";
  loadingText?: string;
  showEmpty?: boolean;
  suggestions: { key: string; title: string; detail?: string }[];
  onChange: (value: string) => void;
  onPick: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loading = status === "loading";
  const hasMenu = loading || suggestions.length > 0 || showEmpty;
  function showMenu() {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setOpen(true);
  }
  useEffect(() => {
    if (document.activeElement === inputRef.current && hasMenu) setOpen(true);
  }, [hasMenu, suggestions, value]);
  return (
    <div className="relative" id={`field-${name}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-busy={loading || undefined}
          aria-expanded={open && hasMenu}
          onPointerDown={showMenu}
          onFocus={showMenu}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => {
              if (document.activeElement === inputRef.current) return;
              setOpen(false);
            }, 120);
          }}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} ${error ? "border-accent" : "border-line"} disabled:cursor-not-allowed disabled:opacity-60 ${loading ? "pr-10" : ""}`}
        />
        {loading ? <FieldSpinner label={loadingText} /> : null}
        {open && loading ? (
          <p className="absolute left-0 right-0 top-full z-[45] mt-1 flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-3 text-sm text-ink-soft shadow-[0_18px_40px_-24px_rgba(78,69,62,0.55)]" role="status">
            <SpinnerIcon />
            {loadingText}
          </p>
        ) : null}
        {open && !loading && suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-[45] mt-1 max-h-[min(15rem,40svh)] overflow-auto rounded-xl border border-line bg-paper py-1 shadow-[0_18px_40px_-24px_rgba(78,69,62,0.55)]">
            {suggestions.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left hover:bg-paper-2"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onPick(item.key);
                    setOpen(false);
                  }}
                >
                  <span className="block text-sm text-ink">{item.title}</span>
                  {item.detail ? <span className="mt-0.5 block text-[12px] font-light text-ink-soft">{item.detail}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && !loading && showEmpty ? (
          <p className="absolute left-0 right-0 top-full z-[45] mt-1 rounded-xl border border-line bg-paper px-3 py-3 text-sm text-ink-soft shadow-[0_18px_40px_-24px_rgba(78,69,62,0.55)]">
            Няма съвпадение.
          </p>
        ) : null}
      </div>
      {error ? <span className="mt-1 block text-[12px] text-ink">{error}</span> : null}
      {loading && !open ? (
        <p className="mt-1 text-[12px] text-ink-soft" role="status">
          {loadingText}
        </p>
      ) : null}
      {disabled ? <span className="mt-1 block text-[12px] font-light text-ink-soft">Първо изберете град от списъка.</span> : null}
    </div>
  );
}

function kindLabel(kind: string) {
  if (kind === "aps") return "Еконтомат";
  if (kind === "drive") return "Еконт Драйв";
  if (kind === "mps") return "Мобилен офис";
  return "Офис";
}

function pointDetail(office: Office) {
  return [kindLabel(office.kind || "office"), office.address, office.hours].filter(Boolean).join(" · ");
}

function Choice({
  name,
  checked,
  onChange,
  title,
  detail,
  price,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  price?: string;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 ${checked ? "bg-[#f3eee6]" : "bg-paper"}`}>
      <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${checked ? "border-clay" : "border-ink/25"}`}>
        <span className={`h-2 w-2 rounded-full bg-clay ${checked ? "opacity-100" : "opacity-0"}`} />
      </span>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] font-light text-ink-soft">{detail}</span>
      </span>
      {price ? <span className="shrink-0 text-sm tabular-nums">{price}</span> : null}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  className = "",
  value,
  error,
  list,
  onChange,
}: {
  label: string;
  name: FieldName;
  type?: string;
  inputMode?: "tel" | "email" | "text";
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  value: string;
  error?: string;
  list?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`} id={`field-${name}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <input
        type={type}
        name={name}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        list={list}
        spellCheck={type === "email" ? false : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} ${error ? "border-accent" : "border-line"}`}
      />
      {error ? (
        <span id={`${name}-error`} className="mt-1 block text-[12px] text-ink">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function validate(customer: OrderCustomer, delivery: Delivery, office: Office | undefined) {
  const problems: Partial<Record<FieldName, string>> = {};
  if (!customer.name) problems.name = "Напишете име и фамилия.";
  if (customer.phone.replace(/\D/g, "").length < 8) problems.phone = "Въведете телефон за връзка.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) problems.email = "Въведете валиден имейл.";
  if (!customer.city) problems.city = "Напишете град.";
  if (delivery === "address" && !customer.address) problems.address = "Напишете адрес.";
  if (delivery === "office" && !office) problems.office = "Изберете офис или еконтомат.";
  return problems;
}

function orderLines(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.id === product.id ? 1 : 0,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
  }));
}

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      name: text(parsed.name),
      phone: text(parsed.phone),
      email: text(parsed.email),
      city: text(parsed.city),
      address: text(parsed.address),
      note: text(parsed.note),
      officeCode: text(parsed.officeCode),
      delivery: parsed.delivery === "office" ? "office" : "address",
      payment: parsed.payment === "cod" ? "cod" : "card",
      promo: text(parsed.promo).toUpperCase(),
    };
  } catch {
    return null;
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
