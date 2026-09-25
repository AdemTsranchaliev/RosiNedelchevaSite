export const demoMode = process.env.NEXT_PUBLIC_DEMO === "true";

type Order = {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  paymentMethod: string;
  deliveryType: string;
  officeCode: string | null;
  officeName: string | null;
  total: number;
  promoCode: string | null;
  discountPercent: number;
  status: string;
  trackingCode: string | null;
  labelUrl: string | null;
  createdAt: string;
  items: { productId: number; title: string; price: number; quantity: number }[];
  history: { status: string; note: string; at: string }[];
};

type Review = {
  id: number;
  productId: number;
  orderId: number;
  orderNumber: string;
  email: string;
  authorName: string;
  city: string;
  rating: number;
  body: string;
  images: string[];
  status: string;
  createdAt: string;
};

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function iso(daysAgo: number, hours = 0) {
  return new Date(now - daysAgo * day - hours * 60 * 60 * 1000).toISOString();
}

const names = ["Мария Иванова", "Елена Петрова", "Никол Георгиева", "Ива Стоянова", "Теодора Димитрова", "Анна Колева"];
const cities = ["София", "Пловдив", "Варна", "Бургас", "Стара Загора"];
const statuses = ["completed", "completed", "shipped", "confirmed", "new", "cancelled"];

const orders: Order[] = Array.from({ length: 22 }, (_, index) => {
  const status = statuses[index % statuses.length];
  const quantity = index % 5 === 0 ? 2 : 1;
  const createdAt = iso(index % 28, index);
  return {
    id: index + 1,
    number: `RN-DEMO-${1000 + index}`,
    customerName: names[index % names.length],
    phone: "0891234567",
    email: `klient${index + 1}@example.com`,
    city: cities[index % cities.length],
    address: "ул. Примерна 12",
    note: "",
    paymentMethod: index % 2 === 0 ? "card" : "cod",
    deliveryType: "address",
    officeCode: null,
    officeName: null,
    total: status === "cancelled" ? 79 * quantity : 71.1 * quantity,
    discountPercent: status === "cancelled" ? 0 : 10,
    promoCode: index % 3 === 0 ? "GRIZHA10" : null,
    status,
    trackingCode: status === "shipped" || status === "completed" ? `EC1000${index}BG` : null,
    labelUrl: null,
    createdAt,
    items: [{ productId: 1, title: "Справяне с тревожността", price: 79, quantity }],
    history: [{ status, note: "", at: createdAt }],
  };
});

const products = [
  {
    id: 1,
    name: "Справяне с тревожността",
    subtitle: "Инструмент за самопомощ, самоосъзнаване и вътрешна устойчивост",
    description: "Терапевтични карти за самопомощ, самоосъзнаване и вътрешна устойчивост.",
    details: "Създадени са от практиката на Росица Неделчева. Помагат тревожността да се разбира постепенно.",
    price: 79,
    imageUrl: "/images/product-box.jpg",
    images: ["/images/product-box.jpg", "/images/cards-overview.jpg", "/images/site/rosi-portrait.jpg", "/images/site/rosi-wide.jpg"],
    videoUrl: null,
    highlights: ["100 карти", "6 раздела с въпроси, насоки и техники", "За хора с тревожност и за психолози/терапевти", "Създадени от практикуващ психолог и психотерапевт"],
    specs: [
      { lead: "100", detail: "карти" },
      { lead: "6", detail: "раздела" },
      { lead: "Кутия", detail: "целият комплект" },
      { lead: "Език", detail: "български" },
    ],
    stock: 40,
    isActive: true,
  },
];

const reviews: Review[] = [
  {
    id: 1,
    productId: 1,
    orderId: 1,
    orderNumber: "RN-DEMO-1000",
    email: "klient1@example.com",
    authorName: "Мария",
    city: "София",
    rating: 5,
    body: "Ползвам ги вечер, когато мислите се завъртят. Въпросите са тихи и конкретни.",
    images: [],
    status: "published",
    createdAt: iso(6),
  },
  {
    id: 2,
    productId: 1,
    orderId: 2,
    orderNumber: "RN-DEMO-1001",
    email: "klient2@example.com",
    authorName: "Елена",
    city: "Пловдив",
    rating: 5,
    body: "Взех ги и за кабинета. Клиентите се задържат по-лесно върху една карта, вместо върху целия разговор.",
    images: [],
    status: "published",
    createdAt: iso(11),
  },
  {
    id: 3,
    productId: 1,
    orderId: 7,
    orderNumber: "RN-DEMO-1006",
    email: "klient7@example.com",
    authorName: "Никол",
    city: "Варна",
    rating: 4,
    body: "Хареса ми, че няма правилен отговор. Чакам одобрение на още едно ревю със снимка.",
    images: [],
    status: "pending",
    createdAt: iso(2),
  },
];

const store = {
  orders,
  products,
  reviews,
  users: [
    { id: 1, name: "Росица Неделчева", email: "admin@ertherapybg.com", role: "Admin", createdAt: iso(40) },
    { id: 2, name: "Мария Иванова", email: "maria@example.com", role: "Customer", createdAt: iso(18) },
    { id: 3, name: "Елена Петрова", email: "elena@example.com", role: "Customer", createdAt: iso(9) },
  ],
  blog: [
    {
      id: 1,
      slug: "kakvo-e-trevozhnost",
      title: "Какво е тревожността и как да я разпознаем",
      excerpt: "Тревожността не е само „мислене твърде много“.",
      date: "2026-03-12",
      readMinutes: 5,
      image: "/images/site/rosi-wide.jpg",
      imageAlt: "Росица Неделчева до купчина книги в кабинета",
      body: "Тревожността е естествена човешка реакция.",
      isPublished: true,
    },
    {
      id: 2,
      slug: "resursi-pri-trevozhnost",
      title: "Ресурси, свързаност и самоподкрепа",
      excerpt: "Когато тревожността ни насочва към това, което не е наред, ресурсите ни връщат към опората.",
      date: "2026-02-20",
      readMinutes: 4,
      image: "/images/site/rosi-portrait-2.jpg",
      imageAlt: "Портрет на Росица Неделчева",
      body: "Ресурсите не означават, че трудността изчезва.",
      isPublished: true,
    },
  ],
  promotions: [
    {
      id: 1,
      name: "Есенна грижа",
      description: "10% от комплекта за две седмици.",
      percent: 10,
      productIds: [] as number[],
      startsAt: iso(-3),
      endsAt: iso(-11),
      isActive: true,
    },
  ],
  codes: [
    { id: 1, code: "GRIZHA10", percent: 10, used: 8, maxUses: 50, expiresAt: iso(-60), isActive: true },
    { id: 2, code: "PRAKTIKA15", percent: 15, used: 3, maxUses: 20, expiresAt: iso(-30), isActive: true },
  ],
  banner: { text: "Есенна грижа — 10% от комплекта до края на седмицата", href: "/karti", isActive: true },
  subscribers: ["maria@example.com", "elena@example.com", "nikol@example.com", "iva@example.com", "anna@example.com"].map((email, index) => ({
    id: index + 1,
    email,
    createdAt: iso(index * 3),
  })),
  campaigns: [
    {
      id: 1,
      subject: "Нов комплект карти",
      body: "Здравейте,\n\nкомплектът „Справяне с тревожността“ вече е наличен.",
      recipients: 5,
      status: "sent",
      createdAt: iso(12),
    },
  ],
  courier: {
    useDemo: true,
    username: "",
    password: "",
    senderName: "Росица Неделчева",
    senderPhone: "0895563333",
    city: "София",
    postCode: "1000",
    street: "Примерна",
    streetNumber: "1",
    weight: 0.6,
    description: "Терапевтични карти",
  },
  checks: [] as { id: number; orderId: number | null; name: string; email: string; phone: string; count: number; checkedAt: string; reports: [] }[],
};

const admin = {
  id: 1,
  name: "Росица Неделчева",
  email: "admin@ertherapybg.com",
  role: "Admin",
  createdAt: iso(40),
};

const emailCatalog = [
  ["order-received", "Поръчки", "Нова поръчка", "Потвърждение към клиента веднага след поръчка."],
  ["order-admin", "Поръчки", "Нова поръчка към теб", "Известие с данните за доставка."],
  ["order-confirmed", "Поръчки", "Потвърдена", "Поръчката се подготвя."],
  ["order-shipped", "Поръчки", "Изпратена", "Товарителница и очакване на пратката."],
  ["order-completed", "Поръчки", "Завършена", "След като комплектът е получен."],
  ["welcome", "Хора", "Добре дошъл", "След регистрация в профила."],
  ["newsletter", "Хора", "Бюлетин", "Потвърждение за абонамент."],
  ["review-invite", "Магазин", "Покана за ревю", "След завършена поръчка, с линк за оценка и снимки."],
].map(([id, group, name, description]) => ({ id, group, name, description }));

function nextId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function jsonBody(init: RequestInit) {
  if (typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function publishedReviews(productId: number) {
  const list = store.reviews.filter((item) => item.productId === productId && item.status === "published");
  const average = list.length ? list.reduce((sum, item) => sum + item.rating, 0) / list.length : 0;
  return {
    productId,
    average,
    count: list.length,
    reviews: list.map((item) => ({
      id: item.id,
      authorName: item.authorName,
      city: item.city,
      rating: item.rating,
      body: item.body,
      images: item.images,
      createdAt: item.createdAt,
    })),
  };
}

export function demoCall(path: string, init: RequestInit = {}): unknown {
  const method = (init.method ?? "GET").toUpperCase();
  const url = new URL(path, "http://demo.local");
  const route = url.pathname.replace(/\/$/, "");
  const body = jsonBody(init);

  if (route === "/api/auth/login") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (email === admin.email && password === "RosiAdmin2026!") {
      return { token: "demo-admin", user: admin };
    }
    const customer = store.users.find((user) => user.email === email && user.role !== "Admin");
    if (customer && password.length >= 6) return { token: `demo-${customer.id}`, user: customer };
    throw new Error("Имейлът или паролата не съвпадат.");
  }

  if (route === "/api/auth/register") {
    const user = {
      id: nextId(store.users),
      name: String(body.name ?? "Клиент"),
      email: String(body.email ?? "").trim().toLowerCase(),
      role: "Customer",
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return { token: `demo-${user.id}`, user };
  }

  if (route === "/api/auth/me") return admin;

  if (route === "/api/offers") {
    return { promotion: store.promotions.find((item) => item.isActive) ?? null, banner: store.banner.isActive ? store.banner : { text: "", href: "", isActive: false } };
  }

  if (route === "/api/orders" && method === "GET") return store.orders;
  if (route === "/api/orders" && method === "POST") {
    const order: Order = {
      id: nextId(store.orders),
      number: String(body.number ?? `RN-DEMO-${1100 + store.orders.length}`),
      customerName: String(body.customerName ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      city: String(body.city ?? ""),
      address: String(body.address ?? ""),
      note: String(body.note ?? ""),
      paymentMethod: String(body.paymentMethod ?? "card"),
      deliveryType: String(body.deliveryType ?? "address"),
      officeCode: (body.officeCode as string | null) ?? null,
      officeName: (body.officeName as string | null) ?? null,
      total: Number(body.total ?? 0),
      promoCode: (body.promoCode as string | null) ?? null,
      discountPercent: 0,
      status: "new",
      trackingCode: null,
      labelUrl: null,
      createdAt: new Date().toISOString(),
      items: Array.isArray(body.items) ? (body.items as Order["items"]) : [],
      history: [{ status: "new", note: "", at: new Date().toISOString() }],
    };
    store.orders.unshift(order);
    return order;
  }
  if (route === "/api/orders/mine") return store.orders.slice(0, 2);

  const statusMatch = route.match(/^\/api\/orders\/(\d+)\/status$/);
  if (statusMatch && method === "PATCH") {
    const order = store.orders.find((item) => item.id === Number(statusMatch[1]));
    if (!order) throw new Error("Поръчката не е намерена.");
    order.status = String(body.status ?? order.status);
    order.history.push({ status: order.status, note: String(body.note ?? ""), at: new Date().toISOString() });
    return order;
  }

  const nekoMatch = route.match(/^\/api\/orders\/(\d+)\/nekorekten$/);
  if (nekoMatch) {
    const order = store.orders.find((item) => item.id === Number(nekoMatch[1]));
    return { count: 0, phone: order?.phone ?? "", checkedAt: new Date().toISOString(), reports: [] };
  }

  if (route === "/api/products/manage" || (route === "/api/products" && method === "GET")) return store.products;
  if (route === "/api/products" && method === "POST") {
    const product = { ...products[0], ...(body as object), id: nextId(store.products), isActive: true };
    store.products.push(product);
    return product;
  }
  const productMatch = route.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && method === "PUT") {
    const product = store.products.find((item) => item.id === Number(productMatch[1]));
    if (!product) throw new Error("Продуктът не е намерен.");
    Object.assign(product, body);
    return product;
  }
  if (productMatch && method === "DELETE") {
    const product = store.products.find((item) => item.id === Number(productMatch[1]));
    if (product) product.isActive = false;
    return undefined;
  }

  if (route === "/api/blog/manage") return store.blog;
  if (route === "/api/blog" && method === "POST") {
    const post = { id: nextId(store.blog), isPublished: true, ...(body as object) };
    store.blog.unshift(post as (typeof store.blog)[number]);
    return post;
  }
  const blogMatch = route.match(/^\/api\/blog\/(\d+)$/);
  if (blogMatch && method === "PUT") {
    const post = store.blog.find((item) => item.id === Number(blogMatch[1]));
    if (post) Object.assign(post, body);
    return post;
  }
  if (blogMatch && method === "DELETE") {
    const index = store.blog.findIndex((item) => item.id === Number(blogMatch[1]));
    if (index >= 0) store.blog.splice(index, 1);
    return undefined;
  }

  if (route === "/api/users") return store.users;
  if (route === "/api/users/reputation") return store.checks;
  if (route === "/api/promotions" && method === "GET") return store.promotions;
  if (route === "/api/promotions" && method === "POST") {
    const item = { id: nextId(store.promotions), name: "", description: "", percent: 0, productIds: [] as number[], startsAt: "", endsAt: "", isActive: true, ...(body as object) };
    store.promotions.unshift(item);
    return item;
  }
  const promoMatch = route.match(/^\/api\/promotions\/(\d+)$/);
  if (promoMatch) {
    const item = store.promotions.find((entry) => entry.id === Number(promoMatch[1]));
    if (item) Object.assign(item, body);
    return item;
  }
  if (route === "/api/promo-codes" && method === "GET") return store.codes;
  if (route === "/api/promo-codes" && method === "POST") {
    const item = { id: nextId(store.codes), used: 0, isActive: true, ...(body as object) };
    store.codes.unshift(item as (typeof store.codes)[number]);
    return item;
  }
  const codeMatch = route.match(/^\/api\/promo-codes\/(\d+)$/);
  if (codeMatch) {
    const item = store.codes.find((entry) => entry.id === Number(codeMatch[1]));
    if (item) Object.assign(item, body);
    return item;
  }
  if (route === "/api/promo/quote") {
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);
    const match = store.codes.find((item) => item.code === code && item.isActive);
    const promotion = store.promotions.find((item) => item.isActive);
    const percent = match?.percent ?? promotion?.percent ?? 0;
    const total = Math.round((subtotal - (subtotal * percent) / 100) * 100) / 100;
    if (code && !match) return { ok: false, message: "Този код не е валиден.", percent: 0, subtotal, total: subtotal };
    return { ok: true, message: percent > 0 ? `${match?.code ?? promotion?.name} · −${percent}%` : "Няма активна отстъпка.", percent, subtotal, total };
  }
  if (route === "/api/banner" && method === "GET") return store.banner;
  if (route === "/api/banner" && method === "PUT") {
    Object.assign(store.banner, body);
    return store.banner;
  }
  if (route === "/api/newsletter" && method === "GET") return store.subscribers;
  if (route === "/api/newsletter" && method === "POST") {
    const email = String(body.email ?? "").trim();
    if (!email.includes("@") || !email.includes(".")) throw new Error("Въведете валиден имейл.");
    const subscriber = { id: nextId(store.subscribers), email, createdAt: new Date().toISOString() };
    store.subscribers.unshift(subscriber);
    return subscriber;
  }
  if (route === "/api/campaigns" && method === "GET") return store.campaigns;
  if (route === "/api/campaigns" && method === "POST") {
    const campaign = {
      id: nextId(store.campaigns),
      subject: String(body.subject ?? ""),
      body: String(body.body ?? ""),
      recipients: store.subscribers.length,
      status: store.subscribers.length ? "sent" : "empty",
      createdAt: new Date().toISOString(),
    };
    store.campaigns.unshift(campaign);
    return campaign;
  }
  if (route === "/api/reviews/manage") return store.reviews;
  if (route === "/api/reviews/mine") return [];
  if (route === "/api/reviews" && method === "GET") return publishedReviews(Number(url.searchParams.get("productId") ?? 1));
  const inviteMatch = route.match(/^\/api\/reviews\/invite\/(.+)$/);
  if (inviteMatch) {
    return { productName: "Справяне с тревожността", authorName: "Мария", city: "София", used: false };
  }
  if (route === "/api/reviews" && method === "POST") {
    return { id: nextId(store.reviews), status: "pending" };
  }
  const reviewMatch = route.match(/^\/api\/reviews\/(\d+)$/);
  if (reviewMatch) {
    const review = store.reviews.find((item) => item.id === Number(reviewMatch[1]));
    if (review) review.status = String(body.status ?? review.status);
    return review;
  }
  if (route === "/api/messages" && method === "POST") return { id: 1 };
  if (route === "/api/courier/offices") {
    const city = url.searchParams.get("city") || "София";
    return [
      { code: "1001", name: `${city} — офис Център` },
      { code: "1002", name: `${city} — офис Младост` },
    ];
  }
  if (route === "/api/courier" && method === "GET") return store.courier;
  if (route === "/api/courier" && method === "PUT") {
    Object.assign(store.courier, body, { password: "" });
    return store.courier;
  }
  const trackMatch = route.match(/^\/api\/courier\/orders\/(\d+)\/track$/);
  if (trackMatch) {
    const order = store.orders.find((item) => item.id === Number(trackMatch[1]));
    return { status: order?.status ?? "new", delivery: "address", officeCode: "", officeName: "", cashOnDelivery: order?.paymentMethod === "cod" };
  }
  const labelMatch = route.match(/^\/api\/courier\/orders\/(\d+)\/label$/);
  if (labelMatch) {
    const order = store.orders.find((item) => item.id === Number(labelMatch[1]));
    if (order) {
      order.trackingCode = order.trackingCode || `EC${order.id}000BG`;
      order.labelUrl = "#";
      order.status = "shipped";
    }
    return order;
  }
  if (route === "/api/emails") {
    return { configured: false, from: "info@ertherapybg.com", templates: emailCatalog };
  }
  const emailMatch = route.match(/^\/api\/emails\/([^/]+)$/);
  if (emailMatch) {
    const info = emailCatalog.find((item) => item.id === emailMatch[1]) ?? emailCatalog[0];
    return { ...info, subject: info.name, html: `<p style="font-family:Georgia,serif">${info.description}</p>` };
  }
  if (route.endsWith("/test")) throw new Error("SMTP не е настроен. Прегледът е готов, но писмото не може да излезе.");
  if (route === "/api/uploads") return { url: "/images/product-box.jpg", kind: "image" };

  throw new Error("Тази заявка не е част от демото.");
}
