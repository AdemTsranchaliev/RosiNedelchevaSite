"use client";

import { useState } from "react";
import { api } from "@/lib/session";

export type Promotion = {
  id: number;
  name: string;
  description: string;
  percent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  productIds?: number[];
};
export type PromoCode = {
  id: number;
  code: string;
  percent: number;
  used: number;
  maxUses: number;
  expiresAt: string | null;
  isActive: boolean;
};
export type SiteBanner = { text: string; href: string; isActive: boolean };
export type Subscriber = { id: number; email: string; createdAt: string };
export type EmailCampaign = {
  id: number;
  subject: string;
  body: string;
  recipients: number;
  status: string;
  createdAt: string;
};
type OrderLine = { title: string; price: number; quantity: number };
type OrderEvent = { status: string; note: string; at: string };
type ShopOrder = {
  number: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  total: number;
  promoCode?: string | null;
  discountPercent?: number;
  status: string;
  trackingCode?: string | null;
  createdAt: string;
  items: OrderLine[];
  history?: OrderEvent[];
};

const reportStatus: Record<string, string> = {
  new: "Нова",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  completed: "Завършена",
  cancelled: "Отказана",
  unclaimed: "Непотърсена",
  returned: "Върната",
};

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const field = "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm";
const button = "h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white";

function dayStamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeFor(preset: string) {
  const today = new Date();
  const to = dayStamp(today);
  if (preset === "today") return { from: to, to };
  if (preset === "7") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from: dayStamp(from), to };
  }
  if (preset === "30") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { from: dayStamp(from), to };
  }
  if (preset === "month") return { from: dayStamp(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  return { from: "", to: "" };
}

function money(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function Reports({ orders }: { orders: ShopOrder[] }) {
  const initial = rangeFor("30");
  const [preset, setPreset] = useState("30");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  function applyPreset(next: string) {
    setPreset(next);
    const range = rangeFor(next);
    setFrom(range.from);
    setTo(range.to);
  }

  const period = orders.filter((order) => {
    const day = dayStamp(new Date(order.createdAt));
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });
  const paid = period.filter((order) => order.status !== "cancelled" && order.status !== "returned");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const average = paid.length ? revenue / paid.length : 0;
  const cities = new Map<string, { total: number; count: number }>();
  for (const order of paid) {
    const current = cities.get(order.city) ?? { total: 0, count: 0 };
    cities.set(order.city, { total: current.total + order.total, count: current.count + 1 });
  }
  const cityRows = [...cities.entries()].sort((a, b) => b[1].total - a[1].total);
  const cityMax = cityRows[0]?.[1].total ?? 1;
  const statuses = Object.keys(reportStatus).map((status) => ({
    status,
    count: period.filter((order) => order.status === status).length,
  })).filter((item) => item.count > 0);

  function download() {
    const periodLabel = from && to ? `${from.split("-").reverse().join(".")} – ${to.split("-").reverse().join(".")}` : "Всички поръчки";
    const rows = period
      .map(
        (order) => `<tr>
          <td>${esc(new Date(order.createdAt).toLocaleDateString("bg-BG"))}</td>
          <td>${esc(order.number)}</td>
          <td>${esc(order.customerName)}</td>
          <td>${esc(order.city)}</td>
          <td>${esc(reportStatus[order.status] ?? order.status)}</td>
          <td class="num">${esc(money(order.total))}</td>
        </tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html lang="bg"><head><meta charset="utf-8"><title>Отчет ${esc(periodLabel)}</title>
      <style>
        body{margin:0;background:#f6f1e8;color:#4e453e;font:15px/1.5 Georgia,serif}
        main{max-width:760px;margin:32px auto;background:#fffdf8;padding:36px 40px}
        h1{font-weight:500;font-size:32px;margin:0}
        .meta{color:#8d8176;margin:6px 0 22px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 22px}
        .stats div{background:#efe6d8;border-radius:12px;padding:12px 14px}
        .stats span{display:block;font:11px/1.4 "Segoe UI",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8f7350}
        .stats strong{font-size:20px;font-weight:500}
        h2{font-size:16px;font-weight:500;margin:22px 0 8px}
        ul{margin:0;padding:0;list-style:none}
        li{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(78,69,62,.12)}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th{text-align:left;font:11px/1.4 "Segoe UI",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8d8176;padding:8px 6px;border-bottom:1px solid rgba(78,69,62,.2)}
        td{padding:8px 6px;border-bottom:1px solid rgba(78,69,62,.08)}
        .num,th:last-child{text-align:right}
        @media print{body{background:#fff}main{margin:0;max-width:none}}
      </style></head><body><main>
        <h1>Отчет</h1>
        <p class="meta">${esc(periodLabel)} · Росица Неделчева</p>
        <section class="stats">
          <div><span>Оборот</span><strong>${esc(money(revenue))}</strong></div>
          <div><span>Поръчки</span><strong>${paid.length}</strong></div>
          <div><span>Средна</span><strong>${esc(money(average))}</strong></div>
          <div><span>Отказани</span><strong>${period.length - paid.length}</strong></div>
        </section>
        <h2>По град</h2>
        <ul>${cityRows.map(([city, value]) => `<li><span>${esc(city)}</span><span>${value.count} · ${esc(money(value.total))}</span></li>`).join("") || "<li>Няма оборот</li>"}</ul>
        <h2>Поръчки</h2>
        <table><thead><tr><th>Дата</th><th>Номер</th><th>Клиент</th><th>Град</th><th>Статус</th><th>Сума</th></tr></thead><tbody>${rows}</tbody></table>
      </main></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `otchet-${from || "vsichki"}-${to || "dnes"}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const presets = [
    { id: "today", label: "Днес" },
    { id: "7", label: "7 дни" },
    { id: "30", label: "30 дни" },
    { id: "month", label: "Този месец" },
    { id: "all", label: "Всички" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Отчети</h1>
          <p className="mt-1 text-sm text-slate-500">{period.length} поръчки в периода. Файлът е кратък отчет, готов за четене и печат.</p>
        </div>
        <button type="button" onClick={download} disabled={period.length === 0} className={`${button} disabled:opacity-50`}>
          Изтегли отчета
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => applyPreset(item.id)}
            className={`h-9 rounded-lg px-3 text-sm ${preset === item.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {item.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          От
          <input type="date" value={from} onChange={(event) => { setPreset("custom"); setFrom(event.target.value); }} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          До
          <input type="date" value={to} onChange={(event) => { setPreset("custom"); setTo(event.target.value); }} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900" />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Оборот" value={money(revenue)} />
        <Stat label="Поръчки" value={String(paid.length)} />
        <Stat label="Средна" value={money(average)} />
        <Stat label="Отказани и върнати" value={String(period.length - paid.length)} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className={card}>
          <h2 className="text-sm font-medium">По град</h2>
          {cityRows.length === 0 ? <p className="mt-3 text-sm text-slate-500">Няма оборот в периода.</p> : (
            <ul className="mt-4 space-y-3">
              {cityRows.map(([city, value]) => (
                <li key={city}>
                  <div className="flex justify-between text-sm">
                    <span>{city}</span>
                    <span className="tabular-nums">{value.count} · {money(value.total)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-[#1f6f73]" style={{ width: `${(value.total / cityMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className={card}>
          <h2 className="text-sm font-medium">По статус</h2>
          {statuses.length === 0 ? <p className="mt-3 text-sm text-slate-500">Няма поръчки в периода.</p> : (
            <ul className="mt-4 space-y-2 text-sm">
              {statuses.map((item) => (
                <li key={item.status} className="flex justify-between">
                  <span>{reportStatus[item.status]}</span>
                  <span className="tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Поръчка</th>
              <th className="px-3 py-2 font-medium">Клиент</th>
              <th className="px-3 py-2 font-medium">Град</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-4 py-2 text-right font-medium">Сума</th>
            </tr>
          </thead>
          <tbody>
            {period.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Няма поръчки за този период.</td></tr>
            ) : period.map((order) => (
              <tr key={order.number} className="border-t border-slate-100">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{order.number}</p>
                  <p className="text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleDateString("bg-BG")}</p>
                </td>
                <td className="px-3 py-2.5">{order.customerName}</td>
                <td className="px-3 py-2.5 text-slate-600">{order.city}</td>
                <td className="px-3 py-2.5">{reportStatus[order.status] ?? order.status}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

function promoPhase(item: Promotion) {
  if (!item.isActive) return "paused" as const;
  const now = Date.now();
  if (now < new Date(item.startsAt).getTime()) return "soon" as const;
  if (now > new Date(item.endsAt).getTime()) return "ended" as const;
  return "live" as const;
}

const promoPhaseLabel = {
  live: "Тече сега",
  soon: "Предстои",
  ended: "Изтекла",
  paused: "Спряна",
};

const promoPhaseStyle = {
  live: "bg-teal-50 text-teal-800",
  soon: "bg-sky-50 text-sky-800",
  ended: "bg-slate-100 text-slate-500",
  paused: "bg-rose-50 text-rose-800",
};

function localInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function periodLabel(item: Promotion) {
  const format = (iso: string) => new Date(iso).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" });
  return `${format(item.startsAt)} – ${format(item.endsAt)}`;
}

function scopeText(item: Promotion, products: { id: number; name: string }[]) {
  const ids = item.productIds ?? [];
  if (ids.length === 0) return "Върху всички продукти";
  const names = ids.map((id) => products.find((product) => product.id === id)?.name).filter(Boolean);
  return names.length ? names.join(" · ") : "Избрани продукти";
}

export function Promotions({
  items,
  products,
  onChange,
}: {
  items: Promotion[];
  products: { id: number; name: string; price: number }[];
  onChange: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Promotion | null>(null);
  const [scope, setScope] = useState<"all" | "picked">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function blank(): Promotion {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 14 * 86400000);
    return { id: 0, name: "", description: "", percent: 10, startsAt: start.toISOString(), endsAt: end.toISOString(), isActive: true, productIds: [] };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      setError("Краят трябва да е след началото.");
      return;
    }
    const productIds = scope === "all" ? [] : draft.productIds ?? [];
    if (scope === "picked" && productIds.length === 0) {
      setError("Избери поне един продукт.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const path = draft.id ? `/api/promotions/${draft.id}` : "/api/promotions";
      await api(path, { method: draft.id ? "PUT" : "POST", body: JSON.stringify({ ...draft, productIds }) });
      setDraft(null);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Промоцията не се записа.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Promotion) {
    setError("");
    try {
      await api(`/api/promotions/${item.id}`, { method: "PUT", body: JSON.stringify({ ...item, isActive: !item.isActive }) });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статусът не се смени.");
    }
  }

  const ordered = [...items].sort((a, b) => {
    const rank = { live: 0, soon: 1, paused: 2, ended: 3 };
    return rank[promoPhase(a)] - rank[promoPhase(b)] || +new Date(b.startsAt) - +new Date(a.startsAt);
  });
  const live = ordered.filter((item) => promoPhase(item) === "live");

  function openDraft(item: Promotion) {
    setError("");
    setScope((item.productIds ?? []).length ? "picked" : "all");
    setDraft(item);
  }

  if (draft) {
    const picked = scope === "all" ? products : products.filter((product) => (draft.productIds ?? []).includes(product.id));
    return (
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => { setDraft(null); setScope("all"); }} className="text-sm text-[#1f6f73]">
          ← Всички промоции
        </button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{draft.id ? "Редакция" : "Нова промоция"}</h1>
        <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <label className="block text-xs text-slate-500">
            Име
            <input className={field} required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Есенна грижа" />
          </label>
          <label className="block text-xs text-slate-500">
            Описание
            <textarea className={field} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Какво вижда клиентът" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-slate-500">
              Отстъпка %
              <input className={field} type="number" min={1} max={90} required value={draft.percent} onChange={(event) => setDraft({ ...draft, percent: Number(event.target.value) })} />
            </label>
            <label className="block text-xs text-slate-500">
              Начало
              <input className={field} type="datetime-local" required value={localInput(draft.startsAt)} onChange={(event) => setDraft({ ...draft, startsAt: new Date(event.target.value).toISOString() })} />
            </label>
            <label className="block text-xs text-slate-500">
              Край
              <input className={field} type="datetime-local" required value={localInput(draft.endsAt)} onChange={(event) => setDraft({ ...draft, endsAt: new Date(event.target.value).toISOString() })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
            Пусната
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs text-slate-500">Върху кои продукти</legend>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <input type="radio" name="scope" checked={scope === "all"} onChange={() => { setScope("all"); setDraft({ ...draft, productIds: [] }); }} />
              Всички продукти
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <input type="radio" name="scope" checked={scope === "picked"} onChange={() => setScope("picked")} />
              Избрани продукти
            </label>
            {scope === "picked" ? (
              <ul className="space-y-1 pl-1">
                {products.map((product) => {
                  const checked = (draft.productIds ?? []).includes(product.id);
                  return (
                    <li key={product.id}>
                      <label className="flex items-center gap-2 px-2 py-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const current = draft.productIds ?? [];
                            setDraft({
                              ...draft,
                              productIds: checked ? current.filter((id) => id !== product.id) : [...current, product.id],
                            });
                          }}
                        />
                        {product.name || "Без име"}
                        <span className="text-slate-400">{product.price.toFixed(2).replace(".", ",")} €</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </fieldset>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {picked.length === 0 ? (
              <p>Няма избрани продукти.</p>
            ) : (
              picked.map((product) => {
                const next = Math.round(product.price * (100 - draft.percent)) / 100;
                return (
                  <p key={product.id}>
                    {product.name || "Без име"} {product.price.toFixed(2).replace(".", ",")} € → <span className="font-medium text-slate-950">{next.toFixed(2).replace(".", ",")} €</span>
                  </p>
                );
              })
            )}
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <SaveRow onCancel={() => setDraft(null)} />
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Промоции</h1>
          <p className="mt-1 text-sm text-slate-500">
            {live.length ? `${live.length} ${live.length === 1 ? "тече" : "текат"} в момента` : "Няма активна промоция в момента"}
          </p>
        </div>
        <button type="button" onClick={() => openDraft(blank())} className={button}>
          Нова промоция
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {ordered.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Няма промоции.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {ordered.map((item) => {
            const phase = promoPhase(item);
            return (
              <li key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-slate-950">{item.name || "Без име"}</p>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] ${promoPhaseStyle[phase]}`}>{promoPhaseLabel[phase]}</span>
                    </div>
                    {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">{periodLabel(item)}</p>
                    <p className="mt-1 text-xs text-[#1f6f73]">{scopeText(item, products)}</p>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-950">−{item.percent}%</p>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <button type="button" onClick={() => openDraft({ ...item, productIds: item.productIds ?? [] })} className="text-[#1f6f73]">Редакция</button>
                  <button type="button" onClick={() => toggle(item)} className="text-slate-500">{item.isActive ? "Спри" : "Пусни"}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function codePhase(item: PromoCode) {
  if (!item.isActive) return "paused" as const;
  if (item.expiresAt && Date.now() > new Date(item.expiresAt).getTime()) return "ended" as const;
  if (item.used >= item.maxUses) return "spent" as const;
  return "live" as const;
}

const codePhaseLabel = { live: "Валиден", ended: "Изтекъл", spent: "Изчерпан", paused: "Спрян" };

function CodeIcon({ name, className = "h-4 w-4" }: { name: "ticket" | "check" | "clock" | "ban" | "pause" | "copy" | "edit" | "percent" | "calendar" | "users"; className?: string }) {
  const path: Record<typeof name, string> = {
    ticket: "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z",
    check: "M5 12.5 9.2 17 19 7",
    clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    ban: "M6 6l12 12M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    pause: "M9 7v10M15 7v10",
    copy: "M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16M5.5 8h9A1.5 1.5 0 0 1 16 9.5v9A1.5 1.5 0 0 1 14.5 20h-9A1.5 1.5 0 0 1 4 18.5v-9A1.5 1.5 0 0 1 5.5 8z",
    edit: "M4 20h4l10.2-10.2a1.6 1.6 0 0 0 0-2.3l-1.7-1.7a1.6 1.6 0 0 0-2.3 0L4 16v4z",
    percent: "M7.5 16.5 16.5 7.5M8 8.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM16 17.9a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z",
    calendar: "M7 4v3M17 4v3M5 9h14M6.5 6h11A1.5 1.5 0 0 1 19 7.5v11A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6z",
    users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.5 19a4.5 4.5 0 0 1 9 0M16 11.2a2.4 2.4 0 1 0 0-4.4M16.2 19a4.2 4.2 0 0 0-2-3.5",
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={path[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const codePhaseStyle = {
  live: "bg-teal-50 text-teal-800",
  ended: "bg-slate-100 text-slate-500",
  spent: "bg-amber-50 text-amber-900",
  paused: "bg-rose-50 text-rose-800",
};

export function Codes({ items, onChange }: { items: PromoCode[]; onChange: () => Promise<void> }) {
  const [draft, setDraft] = useState<PromoCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  function blank(): PromoCode {
    const end = new Date();
    end.setMonth(end.getMonth() + 2);
    end.setMinutes(0, 0, 0);
    return { id: 0, code: "", percent: 10, used: 0, maxUses: 50, expiresAt: end.toISOString(), isActive: true };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.code.trim()) {
      setError("Напиши кода.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const path = draft.id ? `/api/promo-codes/${draft.id}` : "/api/promo-codes";
      await api(path, { method: draft.id ? "PUT" : "POST", body: JSON.stringify({ ...draft, code: draft.code.trim().toUpperCase() }) });
      setDraft(null);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Кодът не се записа.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: PromoCode) {
    setError("");
    try {
      await api(`/api/promo-codes/${item.id}`, { method: "PUT", body: JSON.stringify({ ...item, isActive: !item.isActive }) });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статусът не се смени.");
    }
  }

  async function copy(item: PromoCode) {
    try {
      await navigator.clipboard.writeText(item.code);
    } catch {
      const field = document.createElement("textarea");
      field.value = item.code;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(item.id);
    window.setTimeout(() => setCopied((current) => (current === item.id ? null : current)), 1600);
  }

  const ordered = [...items].sort((a, b) => {
    const rank = { live: 0, paused: 1, spent: 2, ended: 3 };
    return rank[codePhase(a)] - rank[codePhase(b)];
  });
  const live = ordered.filter((item) => codePhase(item) === "live");

  if (draft) {
    const price = 79;
    const next = Math.round(price * (100 - draft.percent)) / 100;
    const left = Math.max(0, draft.maxUses - draft.used);
    return (
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => setDraft(null)} className="text-sm text-[#1f6f73]">
          ← Всички кодове
        </button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{draft.id ? draft.code || "Редакция" : "Нов код"}</h1>
        <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <label className="block text-xs text-slate-500">
            Код
            <input className={`${field} font-medium tracking-[0.14em]`} required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="GRIZHA10" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Отстъпка %
              <input className={field} type="number" min={1} max={90} required value={draft.percent} onChange={(event) => setDraft({ ...draft, percent: Number(event.target.value) })} />
            </label>
            <label className="block text-xs text-slate-500">
              Валиден до
              <input
                className={field}
                type="datetime-local"
                value={draft.expiresAt ? localInput(draft.expiresAt) : ""}
                onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
              />
            </label>
          </div>
          {draft.id ? null : (
            <label className="block text-xs text-slate-500">
              Лимит при създаване
              <input className={field} type="number" min={1} required value={draft.maxUses} onChange={(event) => setDraft({ ...draft, maxUses: Number(event.target.value) })} />
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
            Активен
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <CodeIcon name="percent" className="h-4 w-4 text-[#1f6f73]" />
              79,00 € → <span className="font-medium text-slate-950">{next.toFixed(2).replace(".", ",")} €</span>
            </p>
            <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <CodeIcon name="users" className="h-4 w-4 text-[#1f6f73]" />
              {draft.id ? `${draft.used} използвани · ${left} остават` : `Лимит ${draft.maxUses}`}
            </p>
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <SaveRow onCancel={() => setDraft(null)} />
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Промокодове</h1>
          <p className="mt-1 text-sm text-slate-500">
            {live.length ? `${live.length} ${live.length === 1 ? "код е валиден" : "кода са валидни"}` : "Няма валиден код"}
          </p>
        </div>
        <button type="button" onClick={() => { setError(""); setDraft(blank()); }} className={button}>
          Нов код
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {ordered.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Няма промокодове.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {ordered.map((item) => {
            const phase = codePhase(item);
            const used = Math.min(item.maxUses, item.used);
            const width = item.maxUses > 0 ? Math.min(100, (used / item.maxUses) * 100) : 0;
            return (
              <li key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${phase === "live" ? "bg-teal-50 text-[#1f6f73]" : "bg-slate-100 text-slate-500"}`}>
                    <CodeIcon name="ticket" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium tracking-[0.12em] text-slate-950">{item.code}</p>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${codePhaseStyle[phase]}`}>
                          <CodeIcon name={phase === "live" ? "check" : phase === "ended" ? "clock" : phase === "spent" ? "ban" : "pause"} className="h-3 w-3" />
                          {codePhaseLabel[phase]}
                        </span>
                      </div>
                      <p className="inline-flex items-center gap-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
                        <CodeIcon name="percent" className="h-4 w-4 text-[#1f6f73]" />
                        −{item.percent}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CodeIcon name="calendar" className="h-3.5 w-3.5" />
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" }) : "Без краен срок"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CodeIcon name="users" className="h-3.5 w-3.5" />
                        {item.used} от {item.maxUses}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#1f6f73]" style={{ width: `${width}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setError(""); setDraft(item); }} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[#1f6f73] ring-1 ring-slate-200">
                        <CodeIcon name="edit" className="h-3.5 w-3.5" />
                        Редакция
                      </button>
                      <button type="button" onClick={() => copy(item)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[#1f6f73] ring-1 ring-slate-200">
                        <CodeIcon name="copy" className="h-3.5 w-3.5" />
                        {copied === item.id ? "Копиран" : "Копирай"}
                      </button>
                      <button type="button" onClick={() => toggle(item)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
                        <CodeIcon name={item.isActive ? "pause" : "check"} className="h-3.5 w-3.5" />
                        {item.isActive ? "Спри" : "Пусни"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Newsletter({
  subscribers,
  campaigns,
  onChange,
}: {
  subscribers: Subscriber[];
  campaigns: EmailCampaign[];
  onChange: () => Promise<void>;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const campaign = await api<EmailCampaign>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ subject, body }),
    });
    setSubject("");
    setBody("");
    setNote(
      campaign.status === "empty"
        ? "Няма получатели."
        : `Писмото е записано за ${campaign.recipients} получателя.`,
    );
    await onChange();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Бюлетин</h1>
        <p className="mt-1 text-sm text-slate-500">{subscribers.length} абоната</p>
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {subscribers.map((person) => (
            <li key={person.id} className="px-5 py-3 text-sm">
              {person.email}
            </li>
          ))}
        </ul>
      </section>
      <section className={card}>
        <h2 className="text-lg font-semibold">Имейл до всички</h2>
        <p className="mt-1 text-sm text-slate-500">Абонати, клиенти и имейли от поръчки.</p>
        <form onSubmit={send} className="mt-4 grid gap-3">
          <input className={field} required placeholder="Тема" value={subject} onChange={(event) => setSubject(event.target.value)} />
          <textarea className={field} required rows={6} placeholder="Текст" value={body} onChange={(event) => setBody(event.target.value)} />
          <button className={button} type="submit">
            Изпрати до всички
          </button>
          {note ? <p className="text-sm text-slate-600">{note}</p> : null}
        </form>
        <ul className="mt-6 space-y-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="border-t border-slate-100 pt-3 text-sm">
              <p className="font-medium">{campaign.subject}</p>
              <p className="text-slate-500">
                {campaign.recipients} получателя · {campaign.status === "sent" ? "изпратено" : campaign.status}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function BannerForm({ banner, onChange }: { banner: SiteBanner; onChange: () => Promise<void> }) {
  const [draft, setDraft] = useState(banner);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const text = draft.text.trim();
  const href = draft.href.trim() || "/karti";
  const visible = draft.isActive && text.length > 0;

  function edit(next: SiteBanner) {
    setDraft(next);
    setSaved(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api("/api/banner", { method: "PUT", body: JSON.stringify({ ...draft, text, href }) });
      setDraft({ ...draft, text, href });
      setSaved(true);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Банерът не се запази.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Банер</h1>
          <p className="mt-1 text-sm text-slate-500">Тънката лента най-отгоре на сайта. Кликът води към линка.</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs ${visible ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>
          {visible ? "На сайта" : "Скрит"}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-[#f6f1e8] ring-1 ring-slate-200">
        <div className={`px-4 py-2.5 text-center text-sm ${visible ? "bg-[#1c2830] text-white" : "text-slate-400"}`}>
          {text || "Текстът на банера"}
        </div>
        <p className="px-4 py-3 text-xs text-slate-500">
          {visible
            ? `Посетителят вижда лентата и отива на ${href}.`
            : draft.isActive
              ? "Няма текст — лентата няма да се появи."
              : "Изключен. Сайтът е без лента."}
        </p>
      </div>

      <form onSubmit={save} className="mt-4 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <label className="block text-xs text-slate-500">
          Текст
          <textarea
            className={field}
            rows={2}
            maxLength={140}
            value={draft.text}
            onChange={(event) => edit({ ...draft, text: event.target.value })}
            placeholder="Есенна грижа — 10% от комплекта до края на седмицата"
          />
          <span className="mt-1 block text-[11px]">{draft.text.length}/140 · един ред се чете най-добре</span>
        </label>
        <label className="block text-xs text-slate-500">
          Линк
          <input
            className={field}
            value={draft.href}
            onChange={(event) => edit({ ...draft, href: event.target.value })}
            placeholder="/karti"
          />
        </label>
        <button
          type="button"
          onClick={() => edit({ ...draft, isActive: !draft.isActive })}
          className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left text-sm"
        >
          <span>
            <span className="block font-medium text-slate-950">Показвай на сайта</span>
            <span className="mt-0.5 block text-xs text-slate-500">{draft.isActive ? "Включен" : "Изключен"}</span>
          </span>
          <span className={`relative h-6 w-11 rounded-full transition ${draft.isActive ? "bg-slate-900" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${draft.isActive ? "left-5" : "left-0.5"}`} />
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button className={button} type="submit" disabled={busy}>
            {busy ? "Запис…" : "Запази банера"}
          </button>
          {saved ? <p className="text-sm text-slate-600">Запазен.</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>
    </div>
  );
}

function Panel({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <button type="button" onClick={onAction} className={button}>
          {action}
        </button>
      </div>
      {children}
    </div>
  );
}

function Rows({ items }: { items: { id: number; title: string; meta: string; onEdit: () => void }[] }) {
  return (
    <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
          </div>
          <button type="button" onClick={item.onEdit} className="text-sm text-slate-900">
            Редакция
          </button>
        </li>
      ))}
    </ul>
  );
}

function SaveRow({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-3">
      <button className={button} type="submit">
        Запази
      </button>
      <button type="button" onClick={onCancel} className="h-10 px-4 text-sm text-slate-500">
        Отказ
      </button>
    </div>
  );
}
