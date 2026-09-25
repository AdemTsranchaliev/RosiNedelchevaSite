"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/session";

type TemplateInfo = { id: string; group: string; name: string; description: string };
type Catalog = { configured: boolean; from: string; templates: TemplateInfo[] };
type Preview = TemplateInfo & { subject: string; html: string };

export function EmailStudio({ defaultTo }: { defaultTo: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState("order-received");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [to, setTo] = useState(defaultTo);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Catalog>("/api/emails")
      .then(setCatalog)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Темплейтите не се заредиха."));
  }, []);

  useEffect(() => {
    setPreview(null);
    api<Preview>(`/api/emails/${selected}`)
      .then(setPreview)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Прегледът не се зареди."));
  }, [selected]);

  async function sendTest(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    setError("");
    try {
      await api(`/api/emails/${selected}/test`, { method: "POST", body: JSON.stringify({ to }) });
      setNote(`Тестът е изпратен до ${to}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Тестът не тръгна.");
    } finally {
      setBusy(false);
    }
  }

  const groups = catalog
    ? [...new Set(catalog.templates.map((item) => item.group))].map((group) => ({
        group,
        items: catalog.templates.filter((item) => item.group === group),
      }))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Имейли</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        Писмата са в топлия стил на сайта. Тестът отива само на адреса, който напишеш
        {catalog ? ` — от ${catalog.from}.` : "."}
      </p>
      {catalog && !catalog.configured ? (
        <p className="mt-3 max-w-2xl rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          SMTP още не е въведен, затова тестът не може да излезе. Прегледът е готов.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-teal-800">{note}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="space-y-4">
          {groups.map((group) => (
            <div key={group.group}>
              <p className="px-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">{group.group}</p>
              <ul className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        selected === item.id ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          {preview ? (
            <>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">{preview.description}</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{preview.subject}</p>
              </div>
              <iframe
                title={preview.subject}
                sandbox=""
                srcDoc={preview.html}
                className="mt-3 h-[760px] w-full rounded-2xl bg-[#f6f1e8] ring-1 ring-slate-200"
              />
              <form onSubmit={sendTest} className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  required
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="имейл за теста"
                  className="h-10 min-w-64 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !catalog?.configured}
                  className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white disabled:opacity-50"
                >
                  Изпрати тест
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-500">Зарежда се прегледът…</p>
          )}
        </div>
      </div>
    </div>
  );
}
