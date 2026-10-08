"use client";

import { useState } from "react";
import { seller, site } from "@/lib/content";

const productName = "Терапевтични карти за справяне с тревожността";

type Fields = {
  quantity: string;
  orderNumber: string;
  orderDate: string;
  receivedDate: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  iban: string;
  holder: string;
  date: string;
};

const empty: Fields = {
  quantity: "",
  orderNumber: "",
  orderDate: "",
  receivedDate: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  iban: "",
  holder: "",
  date: "",
};

export function WithdrawalForm() {
  const [fields, setFields] = useState<Fields>(empty);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  function patch(partial: Partial<Fields>) {
    setFields((current) => ({ ...current, ...partial }));
  }

  function ready() {
    if (!confirmed) {
      setError("Потвърдете декларацията, преди да изпратите или отпечатате формуляра.");
      return false;
    }
    setError("");
    return true;
  }

  function sendEmail() {
    if (!ready()) return;
    const lines = [
      `До: ${seller.legalName}`,
      `Имейл: ${site.email}`,
      `Адрес за кореспонденция: ${seller.address}`,
      "",
      "С настоящото заявявам, че се отказвам от сключения от мен договор за покупка на следните стоки:",
      `Наименование на продукта: ${productName}`,
      `Брой артикули: ${fields.quantity || "…"} бр.`,
      "",
      `Поръчка №: ${fields.orderNumber || "…"}`,
      `Дата на поръчката: ${showDate(fields.orderDate)}`,
      `Дата на получаване от куриер (Еконт): ${showDate(fields.receivedDate)}`,
      "",
      "Данни на потребителя:",
      `Три имена: ${fields.name || "…"}`,
      `Адрес на потребителя: ${fields.address || "…"}`,
      `Телефон за връзка: ${fields.phone || "…"}`,
      `Имейл: ${fields.email || "…"}`,
      "",
      "Банкова сметка за възстановяване на заплатената сума:",
      `IBAN: ${fields.iban || "…"}`,
      `Титуляр на сметката: ${fields.holder || "…"}`,
      "",
      "ДЕКЛАРАЦИЯ НА ПОТРЕБИТЕЛЯ:",
      "Потвърждавам, че продуктът се връща в пълния си търговски вид, с напълно запазен и ненарушен фабричен целофан/опаковка. Запознат/а съм, че съгласно чл. 57, ал. 5 от ЗЗП, ако защитната опаковка е разпечатана или повредена, правото ми на отказ отпада и търговецът има право да откаже възстановяване на сумата.",
      "",
      `Дата: ${showDate(fields.date)}`,
    ];
    const subject = `Отказ от договор — поръчка ${fields.orderNumber || ""}`.trim();
    window.location.href = `${site.emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <form
      className="border border-line bg-paper-2/40 px-5 py-6 sm:px-6"
      onSubmit={(event) => {
        event.preventDefault();
        sendEmail();
      }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Формуляр</p>
      <p className="mt-3 text-[15px] font-light leading-relaxed text-ink">
        До: {seller.legalName}
        <br />
        Имейл за контакт: {site.email}
        <br />
        Адрес за кореспонденция: {seller.address}
      </p>
      <p className="mt-4 text-[15px] font-light leading-relaxed text-ink-soft">
        С настоящото заявявам, че се отказвам от сключения от мен договор за покупка на следните стоки:
      </p>
      <p className="mt-4 text-[15px] text-ink">Наименование на продукта: {productName}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Брой артикули" value={fields.quantity} onChange={(quantity) => patch({ quantity })} placeholder="бр." />
        <Field label="Поръчка №" value={fields.orderNumber} onChange={(orderNumber) => patch({ orderNumber })} />
        <Field label="Дата на поръчката" type="date" value={fields.orderDate} onChange={(orderDate) => patch({ orderDate })} />
        <Field label="Дата на получаване от Еконт" type="date" value={fields.receivedDate} onChange={(receivedDate) => patch({ receivedDate })} />
        <Field label="Три имена" value={fields.name} onChange={(name) => patch({ name })} className="sm:col-span-2" />
        <Field label="Адрес на потребителя" value={fields.address} onChange={(address) => patch({ address })} className="sm:col-span-2" />
        <Field label="Телефон за връзка" value={fields.phone} onChange={(phone) => patch({ phone })} />
        <Field label="Имейл" type="email" value={fields.email} onChange={(email) => patch({ email })} />
        <Field label="IBAN" value={fields.iban} onChange={(iban) => patch({ iban })} placeholder="BG…" className="sm:col-span-2" />
        <Field label="Титуляр на сметката" value={fields.holder} onChange={(holder) => patch({ holder })} className="sm:col-span-2" />
        <Field label="Дата на заявлението" type="date" value={fields.date} onChange={(date) => patch({ date })} />
      </div>

      <label className="mt-6 flex items-start gap-3 text-[14px] font-light leading-relaxed text-ink">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => {
            setConfirmed(event.target.checked);
            setError("");
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-[#5e5148]"
        />
        <span>
          Потвърждавам, че продуктът се връща в пълния си търговски вид, с напълно запазен и ненарушен фабричен целофан/опаковка. Запознат/а съм, че съгласно чл. 57, ал. 5 от ЗЗП, ако защитната опаковка е разпечатана или повредена, правото ми на отказ отпада и търговецът има право да откаже възстановяване на сумата.
        </span>
      </label>
      <p className="mt-3 text-[13px] font-light leading-relaxed text-mute">
        Подпис се поставя само ако формулярът е на хартия.
      </p>
      {error ? (
        <p className="mt-3 text-sm font-light text-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="no-print mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center bg-clay px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-paper transition hover:bg-ink"
        >
          Изпрати по имейл
        </button>
        <button
          type="button"
          onClick={() => {
            if (ready()) window.print();
          }}
          className="inline-flex h-11 items-center justify-center border border-line px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition hover:border-ink"
        >
          Отпечатай
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border-b border-line bg-transparent py-2.5 text-[15px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent"
      />
    </label>
  );
}

function showDate(value: string) {
  if (!value) return "…";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day} / ${month} / ${year} г.`;
}
