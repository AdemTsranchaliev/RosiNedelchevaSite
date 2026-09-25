"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmailStudio } from "@/components/admin/EmailStudio";
import { BannerForm, Codes, Newsletter, Promotions, Reports, type EmailCampaign, type PromoCode, type Promotion, type SiteBanner, type Subscriber } from "@/components/admin/MarketingPanels";
import { emptyProduct, mediaSrc, normalizeProduct, ProductEditor, uploadMedia, type ShopProduct } from "@/components/admin/ProductEditor";
import { ReviewsPanel, type ProductReview } from "@/components/admin/ReviewsPanel";
import { api } from "@/lib/session";

type Section =
  | "overview"
  | "orders"
  | "courier"
  | "products"
  | "reviews"
  | "reports"
  | "promotions"
  | "codes"
  | "newsletter"
  | "banner"
  | "emails"
  | "blog"
  | "users";

type OrderLine = { title: string; price: number; quantity: number };
type OrderEvent = { status: string; note: string; at: string };
type ShopOrder = {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  paymentMethod?: string;
  deliveryType?: string;
  officeCode?: string | null;
  officeName?: string | null;
  total: number;
  promoCode?: string | null;
  discountPercent?: number;
  status: string;
  trackingCode?: string | null;
  labelUrl?: string | null;
  createdAt: string;
  items: OrderLine[];
  history?: OrderEvent[];
};
type Product = ShopProduct;
type BlogEntry = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  image: string;
  imageAlt: string;
  body: string;
  isPublished: boolean;
};
type UserRow = { id: number; name: string; email: string; role: string; createdAt: string };

type ReputationCheck = {
  id: number;
  orderId?: number | null;
  name: string;
  email: string;
  phone: string;
  count: number;
  checkedAt: string;
  reports: { id: string; name: string; phone: string; email: string; text: string; date: string; url: string }[];
};

const sectionPath: Record<Section, string> = {
  overview: "/admin",
  orders: "/admin/porachki",
  courier: "/admin/kurieri",
  products: "/admin/produkti",
  reviews: "/admin/revyuta",
  reports: "/admin/otcheti",
  promotions: "/admin/promocii",
  codes: "/admin/promokodove",
  newsletter: "/admin/byuletin",
  emails: "/admin/imeyli",
  banner: "/admin/baner",
  blog: "/admin/blog",
  users: "/admin/potrebiteli",
};

const groups: { title: string; items: { id: Section; label: string }[] }[] = [
  {
    title: "Магазин",
    items: [
      { id: "overview", label: "Табло" },
      { id: "orders", label: "Поръчки" },
      { id: "courier", label: "Куриери" },
      { id: "products", label: "Продукти" },
      { id: "reviews", label: "Ревюта" },
      { id: "reports", label: "Отчети" },
    ],
  },
  {
    title: "Маркетинг",
    items: [
      { id: "promotions", label: "Промоции" },
      { id: "codes", label: "Промокодове" },
      { id: "newsletter", label: "Бюлетин" },
      { id: "emails", label: "Имейли" },
      { id: "banner", label: "Банер" },
    ],
  },
  {
    title: "Съдържание",
    items: [
      { id: "blog", label: "Блог" },
      { id: "users", label: "Потребители" },
    ],
  },
];

function sectionFromPath(pathname: string): Section | null {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const match = (Object.entries(sectionPath) as [Section, string][]).find(([, path]) => path === normalized);
  return match?.[0] ?? null;
}

const navIcon: Record<Section, string> = {
  overview: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  orders: "M6 7h12l-1 12H7L6 7zM9 7V5a3 3 0 016 0v2",
  courier: "M3 15h11V8H3zM14 11h4l3 4v3h-7zM7 18a2 2 0 100-4 2 2 0 000 4zM18 18a2 2 0 100-4 2 2 0 000 4z",
  products: "M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8",
  reviews: "M12 3l2.2 4.6L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.6z",
  reports: "M5 19V9M12 19V5M19 19v-7",
  promotions: "M4 12l8-8h6v6l-8 8-6-6zM16 8h.01",
  codes: "M7 7h.01M17 17h.01M7 17L17 7",
  newsletter: "M4 7h16v10H4zM4 7l8 6 8-6",
  emails: "M4 6h16v12H4zM4 6l8 7 8-7",
  banner: "M6 4v16M6 5h11l-2 3 2 3H6",
  blog: "M6 4h9l3 3v13H6zM15 4v4h4M8 12h8M8 16h5",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zM4 19a5 5 0 0110 0M17 11a2.5 2.5 0 10-2-4M19 19a4 4 0 00-3-3.8",
};

function NavGlyph({ id }: { id: Section }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d={navIcon[id]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statusLabel: Record<string, string> = {
  new: "Нова",
  confirmed: "Потвърдена",
  shipped: "Изпратена",
  completed: "Завършена",
  cancelled: "Отказана",
  unclaimed: "Непотърсена",
  returned: "Върната",
};

const money = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;

function stamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" });
}

type ShipmentView = {
  status: string;
  delivery: string;
  officeCode: string;
  officeName: string;
  cashOnDelivery?: boolean;
  collectedAmount?: number;
  collectedAt?: string | null;
  paidAmount?: number;
  paidAt?: string | null;
};

type NekorektenView = {
  count: number;
  phone: string;
  checkedAt?: string | null;
  reports: { id: string; name: string; phone: string; email: string; text: string; date: string; url: string }[];
};

function phoneKey(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `359${digits.slice(1)}`;
  if (digits.length === 9) return `359${digits}`;
  return digits;
}

function latestCheck(checks: ReputationCheck[], phone: string) {
  const key = phoneKey(phone);
  if (!key) return null;
  return checks.find((item) => phoneKey(item.phone) === key) ?? null;
}

function paymentInfo(order: ShopOrder, shipment: ShipmentView | null) {
  const cod = order.paymentMethod === "cod";
  const paidAt = shipment?.paidAt || shipment?.collectedAt || "";
  const amount = Math.max(shipment?.paidAmount ?? 0, shipment?.collectedAmount ?? 0);
  if (cod && paidAt && amount > 0) {
    return { method: "Наложен платеж", state: `Минало · ${money(amount)}`, when: stamp(paidAt), passed: true };
  }
  if (cod) return { method: "Наложен платеж", state: "Още не е минало", when: "", passed: false };
  return { method: "С карта", state: "Още не е минало", when: "", passed: false };
}

const statusColor: Record<string, string> = {
  new: "#3b6ea5",
  confirmed: "#1f7a6b",
  shipped: "#5b6ad6",
  completed: "#314155",
  cancelled: "#b24a5c",
  unclaimed: "#dc2626",
  returned: "#9f1239",
};

function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function recentDays(count: number) {
  const days: { key: string; label: string }[] = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    days.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      label: `${date.getDate()}.${date.getMonth() + 1}`,
    });
  }
  return days;
}

export function AdminShell() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = sectionFromPath(pathname);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [checks, setChecks] = useState<ReputationCheck[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [banner, setBanner] = useState<SiteBanner>({ text: "", href: "/karti", isActive: false });
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const orderId = Number(searchParams.get("order"));
  const focusId = Number.isFinite(orderId) && orderId > 0 ? orderId : null;

  const load = useCallback(async () => {
    const [nextOrders, nextProducts, nextPosts, nextUsers, nextChecks, nextPromotions, nextCodes, nextSubscribers, nextCampaigns, nextBanner, nextReviews] =
      await Promise.all([
        api<ShopOrder[]>("/api/orders"),
        api<Product[]>("/api/products/manage"),
        api<BlogEntry[]>("/api/blog/manage"),
        api<UserRow[]>("/api/users"),
        api<ReputationCheck[]>("/api/users/reputation"),
        api<Promotion[]>("/api/promotions"),
        api<PromoCode[]>("/api/promo-codes"),
        api<Subscriber[]>("/api/newsletter"),
        api<EmailCampaign[]>("/api/campaigns"),
        api<SiteBanner>("/api/banner"),
        api<ProductReview[]>("/api/reviews/manage"),
      ]);
    setOrders(nextOrders);
    setProducts(nextProducts);
    setPosts(nextPosts);
    setUsers(nextUsers);
    setChecks(nextChecks);
    setPromotions(nextPromotions);
    setCodes(nextCodes);
    setSubscribers(nextSubscribers);
    setCampaigns(nextCampaigns);
    setBanner(nextBanner);
    setReviews(nextReviews);
  }, []);

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = "#e6e0d6";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  const testOpen = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO === "true";

  useEffect(() => {
    if (!ready) return;
    if (!testOpen) {
      if (!user) {
        router.replace("/vhod");
        return;
      }
      if (user.role !== "Admin") {
        router.replace("/profil");
        return;
      }
    }
    load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Данните не се заредиха."));
  }, [ready, user, router, load, testOpen]);

  useEffect(() => {
    if (!ready || section) return;
    if (!testOpen && (!user || user.role !== "Admin")) return;
    router.replace("/admin");
  }, [ready, user, section, router, testOpen]);

  if (!ready || !section || (!testOpen && (!user || user.role !== "Admin"))) {
    return <div className="rn-admin min-h-screen" />;
  }

  const pendingReviews = reviews.filter((item) => item.status === "pending").length;
  const currentLabel = groups.flatMap((group) => group.items).find((item) => item.id === section)?.label ?? "Админ";

  return (
    <div className="rn-admin min-h-screen text-ink md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 md:hidden">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1a1614]">RN</p>
          <p className="truncate text-sm text-[#5e554e]">{currentLabel}</p>
        </div>
        <button type="button" onClick={() => setMenuOpen(true)} className="h-10 shrink-0 rounded-full bg-[#241f1c] px-4 text-sm text-white">
          Меню
        </button>
      </header>

      {menuOpen ? (
        <button type="button" className="fixed inset-0 z-40 bg-[#3f3732]/30 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Затвори менюто" />
      ) : null}

      <aside
        className={`${menuOpen ? "fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] shadow-xl" : "hidden"} flex-col overflow-y-auto border-r border-black/10 bg-white px-3 py-5 md:sticky md:top-0 md:flex md:h-screen md:w-auto md:shadow-none md:py-6`}
      >
        <div className="flex items-center justify-between px-3">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#1a1614]">
            RN
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} className="text-sm text-[#5e554e] md:hidden">
            Затвори
          </button>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-6" aria-label="Админ раздели">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-xs font-medium text-[#5e554e]">{group.title}</p>
              <div className="mt-1">
                {group.items.map((item) => {
                  const active = section === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={sectionPath[item.id]}
                      onClick={() => setMenuOpen(false)}
                      className={`flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-sm ${
                        active ? "bg-[#ebe4da] font-medium text-[#1a1614]" : "text-[#3a332e] hover:bg-[#f4efe8]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <NavGlyph id={item.id} />
                        {item.label}
                      </span>
                      {item.id === "reviews" && pendingReviews > 0 ? <span className="text-xs text-[#5e554e]">{pendingReviews}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <button type="button" onClick={logout} className="mt-4 h-9 rounded-lg px-3 text-left text-sm text-[#5e554e] hover:bg-[#f4efe8]">
          Изход
        </button>
      </aside>

      <section className="min-w-0 px-4 py-5 md:px-8 md:py-8">
        {error ? <p className="mb-6 text-sm text-rose-700">{error}</p> : null}
        {section === "overview" && (
          <Overview
            orders={orders}
            products={products}
            subscribers={subscribers}
            codes={codes}
            campaigns={campaigns}
            banner={banner}
            customers={users.filter((person) => person.role !== "Admin").length}
            promotion={promotions.find((item) => item.isActive) ?? null}
            onOpen={(next) => router.push(sectionPath[next])}
          />
        )}
        {section === "orders" && <Orders orders={orders} checks={checks} reviews={reviews} onChange={load} focusId={focusId} />}
        {section === "courier" && <Couriers orders={orders} onChange={load} />}
        {section === "products" && <Products products={products} onChange={load} />}
        {section === "reviews" && (
          <ReviewsPanel
            reviews={reviews}
            products={products.map((product) => ({ id: product.id, name: product.name }))}
            onChange={load}
            onOpenOrder={(id) => router.push(`${sectionPath.orders}?order=${id}`)}
          />
        )}
        {section === "reports" && <Reports orders={orders} />}
        {section === "promotions" && (
          <Promotions
            items={promotions}
            products={products.map((product) => ({ id: product.id, name: product.name, price: product.price }))}
            onChange={load}
          />
        )}
        {section === "codes" && <Codes items={codes} onChange={load} />}
        {section === "newsletter" && <Newsletter subscribers={subscribers} campaigns={campaigns} onChange={load} />}
        {section === "emails" && <EmailStudio defaultTo={user?.email ?? ""} />}
        {section === "banner" && <BannerForm banner={banner} onChange={load} />}
        {section === "blog" && <Blog posts={posts} onChange={load} />}
        {section === "users" && <Users users={users} orders={orders} checks={checks} />}
      </section>
    </div>
  );
}

function revenueBetween(orders: ShopOrder[], startDaysAgo: number, endDaysAgo: number) {
  const now = Date.now();
  return orders
    .filter((order) => {
      if (order.status === "cancelled") return false;
      const age = (now - new Date(order.createdAt).getTime()) / 86_400_000;
      return age >= endDaysAgo && age < startDaysAgo;
    })
    .reduce((sum, order) => sum + order.total, 0);
}

function shortDate(iso: string) {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Overview({
  orders,
  products,
  subscribers,
  codes,
  campaigns,
  banner,
  customers,
  promotion,
  onOpen,
}: {
  orders: ShopOrder[];
  products: Product[];
  subscribers: Subscriber[];
  codes: PromoCode[];
  campaigns: EmailCampaign[];
  banner: SiteBanner;
  customers: number;
  promotion: Promotion | null;
  onOpen: (section: Section) => void;
}) {
  const paid = orders.filter((order) => order.status !== "cancelled");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const week = revenueBetween(orders, 7, 0);
  const previousWeek = revenueBetween(orders, 14, 7);
  const delta = previousWeek === 0 ? null : Math.round(((week - previousWeek) / previousWeek) * 100);
  const units = paid.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
  const average = paid.length ? revenue / paid.length : 0;
  const withCode = paid.filter((order) => order.promoCode).length;
  const openOrders = orders.filter((item) => item.status === "new" || item.status === "confirmed");
  const latest = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);
  const cities = [...paid.reduce((map, order) => map.set(order.city, (map.get(order.city) ?? 0) + order.total), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const cityMax = cities[0]?.[1] ?? 1;
  const today = new Date().toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

  const cards: { label: string; value: string; hint: string; section: Section }[] = [
    { label: "Оборот", value: money(revenue), hint: delta === null ? "без отказани" : `${delta > 0 ? "+" : ""}${delta}% спрямо миналата седмица`, section: "reports" },
    { label: "Тази седмица", value: money(week), hint: `предишна ${money(previousWeek)}`, section: "reports" },
    { label: "Средна поръчка", value: money(average), hint: `${units} комплекта`, section: "orders" },
    { label: "Отворени", value: String(openOrders.length), hint: `${orders.length} поръчки · ${customers} клиента`, section: "orders" },
    { label: "Бюлетин", value: String(subscribers.length), hint: `${campaigns.length} изпратени писма`, section: "newsletter" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-950">Табло</h1>
          <p className="mt-1 text-sm capitalize text-slate-500">{today}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
            {promotion ? `${promotion.name} · −${promotion.percent}%` : "Няма промоция"}
          </span>
          <span className="rounded-md bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
            Банер {banner.isActive ? "включен" : "скрит"}
          </span>
          <span className="rounded-md bg-white px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
            {withCode} поръчки с код
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onOpen(card.section)}
            className="rounded-xl bg-white px-4 py-3 text-left ring-1 ring-slate-200 transition hover:ring-slate-300"
          >
            <p className="text-[11px] text-slate-500">{card.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{card.hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_320px]">
        <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-950">Оборот по дни</h2>
            <p className="text-[11px] text-slate-500">30 дни · без отказани</p>
          </div>
          <RevenueChart orders={orders} />
        </article>
        <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <h2 className="text-sm font-medium text-slate-950">Статуси</h2>
          <StatusChart orders={orders} />
        </article>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.8fr)]">
        <article className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-medium text-slate-950">Последни поръчки</h2>
            <button type="button" onClick={() => onOpen("orders")} className="text-xs text-[#1f6f73]">
              Всички
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Клиент</th>
                  <th className="px-3 py-2 font-medium">Град</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Код</th>
                  <th className="px-4 py-2 text-right font-medium">Сума</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{shortDate(order.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-950">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">{order.number}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{order.city}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md px-2 py-0.5 text-[11px] text-white" style={{ background: statusColor[order.status] ?? "#64748b" }}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500">{order.promoCode ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">{money(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-3">
          <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-950">По град</h2>
              <button type="button" onClick={() => onOpen("reports")} className="text-xs text-[#1f6f73]">
                Отчет
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {cities.slice(0, 5).map(([city, value]) => (
                <li key={city}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">{city}</span>
                    <span className="tabular-nums text-slate-950">{money(value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-[#1f6f73]" style={{ width: `${(value / cityMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-950">Наличност</h2>
              <button type="button" onClick={() => onOpen("products")} className="text-xs text-[#1f6f73]">
                Продукти
              </button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-slate-700">{product.name}</span>
                  <span className={`tabular-nums ${product.stock < 15 ? "text-rose-700" : "text-slate-950"}`}>{product.stock} бр.</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-950">Промокодове</h2>
            <button type="button" onClick={() => onOpen("codes")} className="text-xs text-[#1f6f73]">
              Кодове
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {codes.map((code) => (
              <li key={code.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-950">{code.code}</span>
                  <span className="text-slate-500">−{code.percent}%</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {code.used} от {code.maxUses} · {code.isActive ? "активен" : "спрян"}
                </p>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${Math.min(100, (code.used / Math.max(code.maxUses, 1)) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-950">Поща и банер</h2>
            <button type="button" onClick={() => onOpen("banner")} className="text-xs text-[#1f6f73]">
              Банер
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-700">{banner.isActive ? banner.text : "Банерът е скрит."}</p>
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {campaigns.slice(0, 3).map((campaign) => (
              <li key={campaign.id} className="text-sm">
                <p className="font-medium text-slate-950">{campaign.subject}</p>
                <p className="text-[11px] text-slate-500">
                  {shortDate(campaign.createdAt)} · {campaign.recipients} получателя
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">Последни абонати: {subscribers.slice(0, 3).map((person) => person.email).join(", ") || "няма"}</p>
        </article>
      </div>
    </div>
  );
}

function RevenueChart({ orders }: { orders: ShopOrder[] }) {
  const days = recentDays(30);
  const values = days.map((day) =>
    orders
      .filter((order) => order.status !== "cancelled" && dayKey(order.createdAt) === day.key)
      .reduce((sum, order) => sum + order.total, 0),
  );
  const max = Math.max(...values, 1);
  const width = 640;
  const height = 168;
  const left = 36;
  const gap = 6;
  const barWidth = (width - left - gap * (values.length - 1)) / values.length;

  return (
    <svg viewBox={`0 0 ${width} ${height + 22}`} className="mt-3 h-56 w-full" role="img" aria-label="Оборот за последните 30 дни">
      {[0, 0.5, 1].map((step) => (
        <g key={step}>
          <line x1={left} x2={width} y1={height * (1 - step)} y2={height * (1 - step)} stroke="#e2e8f0" />
          <text x="0" y={height * (1 - step) + 4} fontSize="10" fill="#94a3b8">
            {Math.round(max * step)}
          </text>
        </g>
      ))}
      {values.map((value, index) => {
        const barHeight = (height * value) / max;
        const x = left + index * (barWidth + gap);
        return (
          <g key={days[index].key}>
            <rect x={x} y={height - barHeight} width={barWidth} height={Math.max(barHeight, 0)} rx="3" fill={value > 0 ? "#1f6f73" : "#e8eef2"} />
            <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {index % 5 === 0 ? days[index].label : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StatusChart({ orders }: { orders: ShopOrder[] }) {
  const slices = Object.keys(statusLabel).map((status) => ({
    status,
    label: statusLabel[status],
    count: orders.filter((order) => order.status === status).length,
    color: statusColor[status],
  }));
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36" role="img" aria-label="Разпределение на поръчките">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {total > 0
          ? slices.map((slice) => {
              if (slice.count === 0) return null;
              const length = (slice.count / total) * circumference;
              const node = (
                <circle
                  key={slice.status}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-cursor}
                  strokeLinecap="butt"
                  transform="rotate(-90 70 70)"
                />
              );
              cursor += length;
              return node;
            })
          : null}
        <text x="70" y="74" textAnchor="middle" fontSize="20" fontWeight="600" fill="#0f172a">
          {total}
        </text>
      </svg>
      <ul className="min-w-40 flex-1 space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.status} className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <span className="ml-auto tabular-nums font-medium text-slate-900">
              {slice.count}
              <span className="font-normal text-slate-400"> · {total ? Math.round((slice.count / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const statusFlow = ["new", "confirmed", "shipped", "completed"] as const;
const exceptionStatuses = ["unclaimed", "returned", "cancelled"] as const;

function statusMoves(status: string) {
  if (status === "new") return { primary: { status: "confirmed", label: "Потвърди" }, more: [{ status: "cancelled", label: "Откажи" }] };
  if (status === "confirmed") return { primary: { status: "shipped", label: "Маркирай като изпратена" }, more: [{ status: "cancelled", label: "Откажи" }] };
  if (status === "shipped") return { primary: { status: "completed", label: "Завърши" }, more: [{ status: "unclaimed", label: "Непотърсена" }, { status: "returned", label: "Върната" }] };
  if (status === "unclaimed") return { primary: { status: "returned", label: "Върната" }, more: [{ status: "completed", label: "Завърши" }] };
  return { primary: null, more: [] as { status: string; label: string }[] };
}

function econtTrack(code: string) {
  return `https://www.econt.com/services/track-shipment/${encodeURIComponent(code)}`;
}

function orderTimeline(order: ShopOrder): OrderEvent[] {
  if (order.history && order.history.length > 0) return order.history;
  const created = { status: "new", note: "Получена поръчка", at: order.createdAt };
  if (order.status === "new") return [created];
  return [created, { status: order.status, note: "", at: order.createdAt }];
}

const statusIcon: Record<string, string> = {
  new: "M4 6h16v12H4z M4 6l8 7 8-7",
  confirmed: "M5 12l4 4 10-10",
  shipped: "M3 15h11V8H3z M14 11h4l3 4v3h-7z M7 18a2 2 0 100-4 2 2 0 000 4z M18 18a2 2 0 100-4 2 2 0 000 4z",
  completed: "M12 3l2.2 4.6L19 8.2l-3.5 3.4.8 4.9L12 14.8 7.7 16.5l.8-4.9L5 8.2l4.8-.6z",
  cancelled: "M6 6l12 12 M18 6L6 18",
  unclaimed: "M12 8v5 M12 16h.01 M12 3a9 9 0 100 18 9 9 0 000-18z",
  returned: "M4 12a8 8 0 101.5-4.7 M4 4v5h5",
};

function StatusGlyph({ status, className = "h-4 w-4" }: { status: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={statusIcon[status] ?? statusIcon.new} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Fact({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone: "date" | "unpaid" | "cod" | "paid" | "address" | "office" | "note" | "empty" }) {
  const toneClass = {
    date: "bg-[#d7e4f6] text-[#16324f]",
    unpaid: "bg-[#f6cfc6] text-[#6d2418]",
    cod: "bg-[#f6e2a8] text-[#5c3d08]",
    paid: "bg-[#c8ecd9] text-[#0f5138]",
    address: "bg-[#d3ebe3] text-[#143d32]",
    office: "bg-[#dddff6] text-[#2a2d68]",
    note: "bg-[#f6ddb0] text-[#5a3a08]",
    empty: "bg-[#fff] text-[#241f1c] ring-1 ring-[#c9bfb2]",
  }[tone];

  return (
    <p className={`rounded-xl px-4 py-3 ${toneClass}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
      <span className="mt-1 block text-[15px] font-semibold leading-snug">{value}</span>
      {detail ? <span className="mt-1 block text-xs font-medium">{detail}</span> : null}
    </p>
  );
}

function DeliveryField({
  label,
  value,
  href,
  wide,
  marked,
}: {
  label: string;
  value: string;
  href?: string;
  wide?: boolean;
  marked?: boolean;
}) {
  return (
    <div className={`border-b border-slate-100 px-4 py-3 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-950">
        {marked ? <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600" title="Непотърсена" /> : null}
        {href ? (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="underline decoration-slate-300 underline-offset-2">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function OrderReview({ review }: { review: ProductReview | null }) {
  if (!review) {
    return (
      <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="text-sm font-medium">Отзив</h2>
        <p className="mt-2 text-sm text-slate-500">Няма отзив за тази поръчка.</p>
      </article>
    );
  }
  const label = review.status === "published" ? "Публикуван" : review.status === "hidden" ? "Скрит" : "Чака";
  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Отзив по поръчката</h2>
        <span className={`rounded-md px-2 py-0.5 text-[11px] ${review.status === "published" ? "bg-teal-50 text-teal-800" : review.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{review.rating} от 5 · {review.authorName}{review.city ? ` · ${review.city}` : ""}</p>
      {review.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{review.body}</p> : null}
      {review.status === "published" ? (
        <a href={`/karti#revyu-${review.id}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
          Виж в продукта
        </a>
      ) : (
        <p className="mt-2 text-xs text-slate-500">На продукта се вижда след публикуване.</p>
      )}
    </article>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function Orders({
  orders,
  checks,
  reviews,
  onChange,
  focusId,
}: {
  orders: ShopOrder[];
  checks: ReputationCheck[];
  reviews: ProductReview[];
  onChange: () => Promise<void>;
  focusId: number | null;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [shipment, setShipment] = useState<ShipmentView | null>(null);
  const [checking, setChecking] = useState(false);
  const [pending, setPending] = useState<{ status: string; label: string } | null>(null);
  const [reputation, setReputation] = useState<NekorektenView | null>(null);
  const [checkingReputation, setCheckingReputation] = useState(false);

  useEffect(() => {
    if (!focusId) return;
    const order = orders.find((item) => item.id === focusId);
    if (!order) return;
    setSelectedId(order.id);
    setTracking(order.trackingCode ?? "");
    setNote("");
    setError("");
  }, [focusId, orders]);

  useEffect(() => {
    setShipment(null);
    setChecking(false);
    setCheckingReputation(false);
    const order = orders.find((item) => item.id === selectedId);
    const saved = order ? latestCheck(checks, order.phone) : null;
    setReputation(saved ? { count: saved.count, phone: saved.phone, checkedAt: saved.checkedAt, reports: saved.reports } : null);
  }, [selectedId, orders, checks]);

  const unclaimedPeople = new Set(
    orders.filter((order) => order.status === "unclaimed").map((order) => order.email.toLowerCase()),
  );

  function askStatus(status: string, label: string) {
    if (status === "returned" && !note.trim()) {
      setError("Напишете причина за връщането в бележката.");
      return;
    }
    setError("");
    setPending({ status, label });
  }

  const visible = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false;
    const haystack = `${order.number} ${order.customerName} ${order.city} ${order.phone}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const selected = orders.find((order) => order.id === selectedId) ?? null;

  async function checkShipment(id: number) {
    setChecking(true);
    setError("");
    try {
      const next = await api<ShipmentView>(`/api/courier/orders/${id}/track`);
      setShipment(next);
    } catch (cause) {
      setShipment(null);
      setError(cause instanceof Error ? cause.message : "Еконт не върна статус.");
    } finally {
      setChecking(false);
    }
  }

  async function checkReputation(id: number) {
    setCheckingReputation(true);
    setError("");
    try {
      setReputation(await api<NekorektenView>(`/api/orders/${id}/nekorekten`));
      await onChange();
    } catch (cause) {
      setReputation(null);
      setError(cause instanceof Error ? cause.message : "Некоректен не върна резултат.");
    } finally {
      setCheckingReputation(false);
    }
  }

  async function createWaybill(id: number) {
    setBusy(true);
    setCreating(true);
    setError("");
    try {
      await api(`/api/courier/orders/${id}/label`, { method: "POST" });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Товарителницата не се създаде.");
    } finally {
      setBusy(false);
      setCreating(false);
    }
  }

  async function setStatus(status: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/orders/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note, trackingCode: tracking }),
      });
      setNote("");
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статусът не се записа.");
    } finally {
      setBusy(false);
    }
  }

  function openOrder(order: ShopOrder) {
    setSelectedId(order.id);
    setTracking(order.trackingCode ?? "");
    setNote("");
    setError("");
  }

  if (selected) {
    const subtotal = selected.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const timeline = orderTimeline(selected);
    const step = statusFlow.indexOf(selected.status as (typeof statusFlow)[number]);
    const moves = statusMoves(selected.status);
    const pay = paymentInfo(selected, shipment);
    const shownSteps = step >= 0 ? statusFlow.slice(0, Math.min(statusFlow.length, step + 2)) : [];

    return (
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => setSelectedId(null)} className="text-sm text-[#1f6f73]">
          ← Всички поръчки
        </button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selected.number}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(selected.createdAt).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white" style={{ background: statusColor[selected.status] }}>
            <StatusGlyph status={selected.status} className="h-3.5 w-3.5" />
            {statusLabel[selected.status]}
          </span>
        </div>

        {shownSteps.length > 0 ? (
          <ol className="mt-5 flex flex-wrap gap-2">
            {shownSteps.map((status, index) => {
              const current = index === step;
              const upcoming = index > step;
              return (
                <li
                  key={status}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  style={{ background: upcoming ? "#e8edf2" : statusColor[status], color: upcoming ? "#64748b" : "#fff", outline: current ? "2px solid #12171c" : undefined, outlineOffset: current ? "2px" : undefined }}
                >
                  <StatusGlyph status={status} className="h-4 w-4 shrink-0" />
                  {statusLabel[status]}
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Fact label="Поръчана" value={stamp(selected.createdAt)} tone="date" />
          <Fact
            label="Плащане"
            value={pay.method}
            detail={`${pay.state}${pay.when ? ` · ${pay.when}` : ""}`}
            tone={pay.passed ? "paid" : selected.paymentMethod === "cod" ? "cod" : "unpaid"}
          />
          <Fact
            label="Доставка"
            value={
              selected.deliveryType === "office" || shipment?.delivery === "До офис"
                ? `Офис ${selected.officeName || shipment?.officeName || selected.officeCode || shipment?.officeCode || ""}`.trim()
                : "До адрес"
            }
            tone={selected.deliveryType === "office" || shipment?.delivery === "До офис" ? "office" : "address"}
          />
          <Fact label="Коментар" value={selected.note || "Няма"} tone={selected.note ? "note" : "empty"} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_300px]">
          <div className="space-y-3">
            <article className="rounded-xl bg-white ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium">Данни за доставка</h2>
              <dl className="grid sm:grid-cols-2">
                <DeliveryField
                  label="Получател"
                  value={selected.customerName}
                  marked={unclaimedPeople.has(selected.email.toLowerCase()) || (latestCheck(checks, selected.phone)?.count ?? 0) > 0}
                />
                <DeliveryField label="Телефон" value={selected.phone} href={`tel:${selected.phone}`} />
                <DeliveryField label="Имейл" value={selected.email} href={`mailto:${selected.email}`} />
                <DeliveryField label="Град" value={selected.city} />
                <DeliveryField label="Адрес" value={selected.address} wide />
                <DeliveryField label="Товарителница" value={selected.trackingCode || "Още няма"} href={selected.trackingCode ? econtTrack(selected.trackingCode) : undefined} />
                <DeliveryField label="Статус в Еконт" value={!selected.trackingCode ? "Няма товарителница" : shipment?.status || "Още не е проверен"} />
              </dl>
            </article>
            <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">Некоректен</h2>
                  <p className="mt-1 text-xs text-slate-500">Проверка по телефон {selected.phone || "—"}</p>
                </div>
                <button
                  type="button"
                  disabled={checkingReputation || !selected.phone}
                  onClick={() => checkReputation(selected.id)}
                  className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white disabled:opacity-60"
                >
                  {checkingReputation ? "Проверява се…" : "Провери в Некоректен"}
                </button>
              </div>
              {reputation ? (
                reputation.count === 0 ? (
                  <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
                    Няма сигнали за този телефон.{reputation.checkedAt ? ` Проверено ${stamp(reputation.checkedAt)}.` : ""}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
                      {reputation.count === 1 ? "1 сигнал" : `${reputation.count} сигнала`} за {reputation.phone}
                    </p>
                    {reputation.reports.map((report) => (
                      <a key={report.id || report.url} href={report.url} target="_blank" rel="noreferrer" className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
                        <span className="font-medium">{report.name || "Сигнал"}{report.date ? ` · ${report.date}` : ""}</span>
                        {report.text ? <span className="mt-1 block text-xs text-slate-600">{report.text}</span> : null}
                      </a>
                    ))}
                  </div>
                )
              ) : null}
            </article>
            <article className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Артикул</th>
                    <th className="px-3 py-2 font-medium">Брой</th>
                    <th className="px-4 py-2 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.title} className="border-t border-slate-100">
                      <td className="px-4 py-2.5">{item.title}</td>
                      <td className="px-3 py-2.5 tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{money(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 border-t border-slate-100 px-4 py-3 text-sm">
                <p className="flex justify-between text-slate-500"><span>Междинна сума</span><span>{money(subtotal)}</span></p>
                {selected.discountPercent ? (
                  <p className="flex justify-between text-slate-500">
                    <span>Отстъпка {selected.discountPercent}%{selected.promoCode ? ` · ${selected.promoCode}` : ""}</span>
                    <span>−{money(subtotal - selected.total)}</span>
                  </p>
                ) : null}
                <p className="flex justify-between font-medium"><span>Общо</span><span>{money(selected.total)}</span></p>
              </div>
            </article>
            <OrderReview review={reviews.find((item) => item.orderId === selected.id) ?? null} />
          </div>

          <div className="space-y-3">
            <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h2 className="text-sm font-medium">Проследяване</h2>
              <label className="mt-3 block text-xs text-slate-500">
                Товарителница
                <input
                  value={tracking}
                  onChange={(event) => setTracking(event.target.value)}
                  placeholder="Номер за проследяване"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="mt-3 block text-xs text-slate-500">
                Бележка или причина за връщане
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="При „Върната“ причината е задължителна"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <button type="button" disabled={busy} onClick={() => setStatus(selected.status)} className="mt-3 text-xs text-[#1f6f73]">
                Запази товарителницата
              </button>
              {!selected.trackingCode ? (
                <button type="button" disabled={busy} onClick={() => createWaybill(selected.id)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1f6f73] text-sm text-white disabled:opacity-70">
                  {creating ? <Spinner /> : null}
                  {creating ? "Създава се товарителница…" : "Създай в Еконт"}
                </button>
              ) : (
                <button type="button" disabled={checking} onClick={() => checkShipment(selected.id)} className="mt-3 h-10 w-full rounded-lg bg-slate-900 text-sm text-white disabled:opacity-60">
                  {checking ? "Проверява се…" : "Провери в Еконт"}
                </button>
              )}
              {selected.labelUrl ? (
                <a href={selected.labelUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white">
                  Отвори етикета
                </a>
              ) : null}
              {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
              <div className="mt-3">
                {moves.primary ? (
                  <button type="button" disabled={busy} onClick={() => askStatus(moves.primary.status, moves.primary.label)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm text-white disabled:opacity-60" style={{ background: statusColor[moves.primary.status] }}>
                    <StatusGlyph status={moves.primary.status} className="h-4 w-4" />
                    {moves.primary.label}
                  </button>
                ) : (
                  <p className="text-sm text-slate-500">Поръчката е приключила.</p>
                )}
                {moves.more.length > 0 ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-500">Ако не продължи нормално</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {moves.more.map((move) => (
                        <button key={move.status} type="button" disabled={busy} onClick={() => askStatus(move.status, move.label)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm ring-1 ring-slate-200 disabled:opacity-60" style={{ color: statusColor[move.status] }}>
                          <StatusGlyph status={move.status} className="h-3.5 w-3.5" />
                          {move.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
            <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <h2 className="text-sm font-medium">История</h2>
              <ol className="mt-3 space-y-3">
                {[...timeline].reverse().map((event, index) => (
                  <li key={`${event.at}-${index}`} className="border-l-2 pl-3" style={{ borderColor: statusColor[event.status] ?? "#e2e8f0" }}>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <StatusGlyph status={event.status} className="h-3.5 w-3.5" />
                      {statusLabel[event.status] ?? event.status}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(event.at).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {event.note ? <p className="mt-1 text-sm text-slate-600">{event.note}</p> : null}
                  </li>
                ))}
              </ol>
              {selected.trackingCode ? (
                <a href={econtTrack(selected.trackingCode)} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[#1f6f73]">
                  Проследи {selected.trackingCode}
                </a>
              ) : null}
            </article>
          </div>
        </div>
        {pending ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <p className="flex items-center gap-2 text-sm font-medium">
                <StatusGlyph status={pending.status} />
                {pending.label}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Статусът на {selected.number} ще стане „{statusLabel[pending.status]}“.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setPending(null)} className="h-9 rounded-lg px-3 text-sm text-slate-600">
                  Назад
                </button>
                <button type="button" disabled={busy} onClick={() => { const nextStatus = pending.status; setPending(null); setStatus(nextStatus); }} className="h-9 rounded-lg px-3 text-sm text-white" style={{ background: statusColor[pending.status] }}>
                  Потвърди
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Поръчки</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Търсене по номер, име, град"
          className="h-10 min-w-56 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        />
        {["all", ...statusFlow].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`h-10 rounded-lg px-3 text-sm ${filter === status ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {status === "all" ? "Всички" : statusLabel[status]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {exceptionStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`h-9 rounded-lg px-3 text-sm ${filter === status ? "text-white" : "bg-white ring-1 ring-slate-200"}`}
            style={filter === status ? { background: statusColor[status] } : { color: statusColor[status] }}
          >
            {statusLabel[status]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Няма поръчки за този филтър.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Поръчка</th>
                <th className="px-3 py-2 font-medium">Клиент</th>
                <th className="px-3 py-2 font-medium">Град</th>
                <th className="px-3 py-2 font-medium">Статус</th>
                <th className="px-3 py-2 font-medium">Етикет</th>
                <th className="px-4 py-2 text-right font-medium">Сума</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => openOrder(order)}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.number}</p>
                    <p className="text-[11px] text-slate-500">{stamp(order.createdAt)}</p>
                    <p className="text-[11px] text-slate-500">{order.paymentMethod === "cod" ? "Наложен платеж" : "С карта"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="flex items-center gap-2">
                      {unclaimedPeople.has(order.email.toLowerCase()) || (latestCheck(checks, order.phone)?.count ?? 0) > 0 ? (
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600" title="Непотърсена или Некоректен" />
                      ) : null}
                      {order.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500">{order.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p>{order.city}</p>
                    <p className="text-[11px] text-slate-500">{order.address}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md px-2 py-0.5 text-[11px] text-white" style={{ background: statusColor[order.status] }}>
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    {order.labelUrl ? (
                      <a href={order.labelUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white">
                        Етикет
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{money(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Products({ products, onChange }: { products: Product[]; onChange: () => Promise<void> }) {
  const [draft, setDraft] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "hidden" | "low">("all");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const catalog = products.map((item) => normalizeProduct(item));
  const activeCount = catalog.filter((item) => item.isActive).length;
  const lowCount = catalog.filter((item) => item.stock < 15).length;
  const needle = query.trim().toLowerCase();
  const visible = catalog.filter((item) => {
    if (filter === "active" && !item.isActive) return false;
    if (filter === "hidden" && item.isActive) return false;
    if (filter === "low" && item.stock >= 15) return false;
    if (!needle) return true;
    return `${item.name} ${item.subtitle} ${item.description}`.toLowerCase().includes(needle);
  });

  async function archive(id: number) {
    setBusyId(id);
    setError("");
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      setConfirmId(null);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Продуктът не се скри.");
    } finally {
      setBusyId(null);
    }
  }

  async function show(product: Product) {
    setBusyId(product.id);
    setError("");
    try {
      await api(`/api/products/${product.id}`, { method: "PUT", body: JSON.stringify({ ...product, isActive: true }) });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Продуктът не се показа.");
    } finally {
      setBusyId(null);
    }
  }

  async function copy(product: Product) {
    setBusyId(product.id);
    setError("");
    try {
      await api("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...product, id: 0, name: `${product.name} (копие)`, isActive: false }),
      });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Копието не се създаде.");
    } finally {
      setBusyId(null);
    }
  }

  if (draft) {
    return <ProductEditor initial={draft} onClose={() => setDraft(null)} onSaved={onChange} />;
  }

  const filters: { id: typeof filter; label: string }[] = [
    { id: "all", label: "Всички" },
    { id: "active", label: "Активни" },
    { id: "hidden", label: "Скрити" },
    { id: "low", label: "Малка наличност" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Продукти</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeCount} {activeCount === 1 ? "активен" : "активни"} · {catalog.length} общо
            {lowCount > 0 ? ` · ${lowCount} с малка наличност` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(emptyProduct())}
          className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white"
        >
          Нов продукт
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Търсене по име или описание"
          className="h-10 min-w-56 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        />
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-10 rounded-lg px-3 text-sm ${filter === item.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {catalog.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Няма продукти.</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Няма продукти за този филтър.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          {visible.map((product) => {
            const cover = product.images[0];
            const stockTone = product.stock === 0 ? "text-rose-700" : product.stock < 15 ? "text-amber-700" : "text-slate-700";
            const busy = busyId === product.id;
            return (
              <li key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {cover ? (
                    <img src={mediaSrc(cover)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-slate-400">Няма</span>
                  )}
                </span>
                <div className="min-w-48 flex-1">
                  <p className="font-medium text-slate-950">{product.name || "Без име"}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{product.subtitle || "Без подзаглавие"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-950">{money(product.price)}</span>
                    <span className={stockTone}> · {product.stock} бр.</span>
                    <span> · {product.isActive ? "Активен" : "Скрит"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDraft(product)} className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
                    Редактирай
                  </button>
                  <button type="button" disabled={busy} onClick={() => copy(product)} className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-slate-800 ring-1 ring-slate-300 disabled:opacity-50">
                    Копирай
                  </button>
                  {product.isActive ? (
                    confirmId === product.id ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => archive(product.id)} className="h-10 rounded-lg bg-rose-700 px-4 text-sm font-medium text-white disabled:opacity-50">
                          Да, скрий
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)} className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-300">
                          Отказ
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(product.id)} className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-rose-700 ring-1 ring-rose-300">
                        Скрий
                      </button>
                    )
                  ) : (
                    <button type="button" disabled={busy} onClick={() => show(product)} className="h-10 rounded-lg bg-[#1f6f73] px-4 text-sm font-medium text-white disabled:opacity-50">
                      Покажи
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Couriers({ orders, onChange }: { orders: ShopOrder[]; onChange: () => Promise<void> }) {
  const [settings, setSettings] = useState<CourierSettings | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api<CourierSettings>("/api/courier")
      .then(setSettings)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Настройките не се заредиха."));
  }, []);

  const waiting = orders.filter((order) => order.status !== "cancelled" && order.status !== "completed" && order.status !== "returned");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setError("");
    setSaved("");
    try {
      const next = await api<CourierSettings>("/api/courier", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(next);
      setSaved("Подателят е записан.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Настройките не се записаха.");
    }
  }

  async function create(id: number) {
    setBusyId(id);
    setError("");
    try {
      await api(`/api/courier/orders/${id}/label`, { method: "POST" });
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Товарителницата не се създаде.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Куриери</h1>
      <p className="mt-2 text-sm text-slate-500">Еконт. Един клик създава товарителница и записва номера към поръчката.</p>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-teal-800">{saved}</p> : null}

      {settings ? (
        <form onSubmit={save} className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Подател</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.useDemo} onChange={(event) => setSettings({ ...settings, useDemo: event.target.checked })} />
              Демо на Еконт
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className={courierField} value={settings.senderName} onChange={(event) => setSettings({ ...settings, senderName: event.target.value })} placeholder="Име" />
            <input className={courierField} value={settings.senderPhone} onChange={(event) => setSettings({ ...settings, senderPhone: event.target.value })} placeholder="Телефон" />
            <input className={courierField} value={settings.city} onChange={(event) => setSettings({ ...settings, city: event.target.value })} placeholder="Град" />
            <input className={courierField} value={settings.postCode} onChange={(event) => setSettings({ ...settings, postCode: event.target.value })} placeholder="Пощенски код" />
            <input className={courierField} value={settings.street} onChange={(event) => setSettings({ ...settings, street: event.target.value })} placeholder="Улица" />
            <input className={courierField} value={settings.streetNumber} onChange={(event) => setSettings({ ...settings, streetNumber: event.target.value })} placeholder="Номер" />
            <input className={courierField} value={settings.username} onChange={(event) => setSettings({ ...settings, username: event.target.value })} placeholder="Потребител в Еконт" />
            <input className={courierField} type="password" value={settings.password} onChange={(event) => setSettings({ ...settings, password: event.target.value })} placeholder="Парола, ако я сменяш" />
          </div>
          <button type="submit" className="mt-3 h-10 rounded-lg bg-slate-900 px-4 text-sm text-white">Запази подателя</button>
        </form>
      ) : null}

      <ul className="mt-4 space-y-3">
        {waiting.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div>
              <p className="font-medium">{order.number}</p>
              <p className="mt-1 text-sm text-slate-600">{order.customerName} · {order.city}</p>
              <p className="text-sm text-slate-500">{order.address}</p>
              {order.trackingCode ? (
                <a href={econtTrack(order.trackingCode)} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-[#1f6f73]">
                  Товарителница {order.trackingCode}
                </a>
              ) : null}
            </div>
            {order.trackingCode ? (
              order.labelUrl ? (
                <a href={order.labelUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
                  Отвори етикета
                </a>
              ) : (
                <span className="text-sm text-slate-500">Има номер</span>
              )
            ) : (
              <button type="button" disabled={busyId === order.id} onClick={() => create(order.id)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1f6f73] px-4 text-sm text-white disabled:opacity-70">
                {busyId === order.id ? <Spinner /> : null}
                {busyId === order.id ? "Създава се товарителница…" : "Създай товарителница"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const courierField = "h-10 rounded-lg border border-slate-200 px-3 text-sm";

type CourierSettings = {
  useDemo: boolean;
  username: string;
  password: string;
  senderName: string;
  senderPhone: string;
  city: string;
  postCode: string;
  street: string;
  streetNumber: string;
  weight: number;
  description: string;
};

function blogInput() {
  return "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm";
}

function Blog({ posts, onChange }: { posts: BlogEntry[]; onChange: () => Promise<void> }) {
  const empty: BlogEntry = {
    id: 0,
    slug: "",
    title: "",
    excerpt: "",
    date: new Date().toISOString().slice(0, 10),
    readMinutes: 4,
    image: "",
    imageAlt: "",
    body: "",
    isPublished: true,
  };
  const [draft, setDraft] = useState<BlogEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.image) {
      setError("Качи снимка за статията.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const path = draft.id ? `/api/blog/${draft.id}` : "/api/blog";
      await api(path, {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify({ ...draft, imageAlt: draft.imageAlt || draft.title }),
      });
      setDraft(null);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статията не се записа.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.kind !== "image") {
        setError("За корицата качи снимка.");
        return;
      }
      setDraft({ ...draft, image: uploaded.url });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Снимката не се качи.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/blog/${id}`, { method: "DELETE" });
      setConfirmId(null);
      await onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статията не се изтри.");
    } finally {
      setBusy(false);
    }
  }

  if (draft) {
    return (
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => setDraft(null)} className="text-sm text-[#1f6f73]">
          ← Всички статии
        </button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{draft.id ? "Редакция" : "Нова статия"}</h1>
        <form onSubmit={save} className="mt-5 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <label className="block">
            <span className="text-xs text-slate-500">Корица</span>
            <span className="mt-1 flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-dashed ring-slate-300">
              {draft.image ? (
                <img src={mediaSrc(draft.image)} alt="" className="h-52 w-full object-cover" />
              ) : (
                <span className="px-4 py-10 text-center text-sm text-slate-500">Пусни или избери снимка</span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(file);
                  event.target.value = "";
                }}
              />
            </span>
          </label>
          <label className="block text-xs text-slate-500">
            Заглавие
            <input className={blogInput()} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>
          <label className="block text-xs text-slate-500">
            Кратко описание
            <textarea className={blogInput()} rows={2} value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} />
          </label>
          <label className="block text-xs text-slate-500">
            Текст
            <textarea className={blogInput()} required rows={8} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Нов абзац с празен ред." />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Дата
              <input className={blogInput()} type="date" required value={draft.date.slice(0, 10)} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </label>
            <label className="block text-xs text-slate-500">
              Минути за четене
              <input className={blogInput()} type="number" min={1} max={60} value={draft.readMinutes} onChange={(event) => setDraft({ ...draft, readMinutes: Number(event.target.value) })} />
            </label>
          </div>
          <label className="block text-xs text-slate-500">
            Описание на снимката
            <input className={blogInput()} value={draft.imageAlt} onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })} placeholder="Ако е празно, ползва се заглавието" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} />
            Публикувана
          </label>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white disabled:opacity-60">
              Запази
            </button>
            <button type="button" onClick={() => setDraft(null)} className="h-10 px-4 text-sm text-slate-500">
              Отказ
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Блог</h1>
          <p className="mt-1 text-sm text-slate-500">{posts.filter((post) => post.isPublished).length} публикувани</p>
        </div>
        <button type="button" onClick={() => { setError(""); setDraft(empty); }} className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
          Нова статия
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {posts.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white px-5 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-200">Няма статии.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <button type="button" onClick={() => setDraft(post)} className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {post.image ? <img src={mediaSrc(post.image)} alt="" className="h-full w-full object-cover" /> : null}
              </button>
              <div className="min-w-0 flex-1 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-950">{post.title}</p>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] ${post.isPublished ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-500"}`}>
                    {post.isPublished ? "Публикувана" : "Скрита"}
                  </span>
                </div>
                {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p> : null}
                <p className="mt-2 text-xs text-slate-500">
                  {post.date.slice(0, 10)} · {post.readMinutes} мин
                </p>
                <div className="mt-2 flex gap-3 text-xs">
                  <button type="button" onClick={() => setDraft(post)} className="text-[#1f6f73]">Редакция</button>
                  {confirmId === post.id ? (
                    <>
                      <button type="button" disabled={busy} onClick={() => remove(post.id)} className="text-rose-700">Потвърди</button>
                      <button type="button" onClick={() => setConfirmId(null)} className="text-slate-500">Назад</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(post.id)} className="text-slate-500">Изтрий</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Users({ users, orders, checks }: { users: UserRow[]; orders: ShopOrder[]; checks: ReputationCheck[] }) {
  const unclaimedEmails = new Set(
    orders.filter((order) => order.status === "unclaimed").map((order) => order.email.toLowerCase()),
  );
  const people = [
    ...users.map((person) => ({
      key: `user-${person.id}`,
      name: person.name,
      email: person.email,
      phone: orders.find((order) => order.email.toLowerCase() === person.email.toLowerCase())?.phone ?? "",
      role: person.role === "Admin" ? "Админ" : "Клиент",
    })),
    ...orders
      .filter((order) => !users.some((person) => person.email.toLowerCase() === order.email.toLowerCase()))
      .filter((order, index, list) => list.findIndex((item) => item.email.toLowerCase() === order.email.toLowerCase() && phoneKey(item.phone) === phoneKey(order.phone)) === index)
      .map((order) => ({
        key: `order-${order.email}-${phoneKey(order.phone)}`,
        name: order.customerName,
        email: order.email,
        phone: order.phone,
        role: "От поръчка",
      })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Потребители</h1>
      <p className="mt-2 text-sm text-slate-500">В червено са непотърсените пратки и телефоните със сигнал в Некоректен.</p>
      <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {people.map((person) => {
          const check = latestCheck(checks, person.phone);
          const missed = unclaimedEmails.has(person.email.toLowerCase());
          const flagged = missed || (check?.count ?? 0) > 0;
          return (
            <li key={person.key} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${flagged ? "bg-rose-50 text-rose-950" : ""}`}>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  {flagged ? <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600" /> : null}
                  {person.name}
                </p>
                <p className={`mt-1 text-sm font-light ${flagged ? "text-rose-800" : "text-slate-500"}`}>
                  {person.email}{person.phone ? ` · ${person.phone}` : ""}
                </p>
                {missed || check ? (
                  <p className={`mt-1 text-xs ${flagged ? "text-rose-800" : "text-slate-500"}`}>
                    {missed ? "Непотърсена пратка" : ""}
                    {missed && check ? " · " : ""}
                    {check ? (check.count > 0 ? `Некоректен · ${check.count === 1 ? "1 сигнал" : `${check.count} сигнала`}` : "Некоректен · няма сигнали") : ""}
                    {check ? ` · ${stamp(check.checkedAt)}` : ""}
                  </p>
                ) : null}
              </div>
              <p className={`text-[11px] uppercase tracking-[0.16em] ${flagged ? "text-rose-700" : "text-slate-500"}`}>{person.role}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
