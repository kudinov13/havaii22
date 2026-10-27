"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Service, ServiceIcon } from "@/lib/types";
import { saveServices, useServices } from "@/lib/siteStore";
import { cn } from "@/lib/utils";
import { Field, inputCls, btnPrimary, iconBtn } from "./ui";
import { ServiceIcon_ } from "@/components/AmenityIcon";

const ICON_OPTIONS: { value: ServiceIcon; label: string }[] = [
  { value: "flame", label: "Костёр / дрова" },
  { value: "bath", label: "Баня" },
  { value: "tent", label: "Беседка / тент" },
  { value: "waves", label: "Вода / SUP" },
  { value: "sailboat", label: "Катамаран" },
  { value: "fish", label: "Рыбалка" },
  { value: "beer", label: "Мини-бар" },
  { value: "utensils", label: "Кухня / еда" },
  { value: "ship", label: "Катер" },
  { value: "mountain", label: "Природа" },
  { value: "wine", label: "Вино / вечер" },
];

export function ServicesAdmin() {
  const services = useServices();

  function patch(i: number, p: Partial<Service>) {
    saveServices(services.map((s, j) => (j === i ? { ...s, ...p } : s)));
  }

  function remove(i: number) {
    saveServices(services.filter((_, j) => j !== i));
  }

  function add() {
    saveServices([...services, { icon: "tent", title: "Новая услуга", description: "", price: "" }]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{services.length} услуг в секции «Больше, чем просто ночёвка»</p>
        <button onClick={add} className={btnPrimary}>
          <Plus size={16} /> Добавить услугу
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {services.map((s, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-soft bg-paper p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <ServiceIcon_ icon={s.icon} size={20} />
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_auto]">
                <Field label="Название">
                  <input className={inputCls} value={s.title} onChange={(e) => patch(i, { title: e.target.value })} />
                </Field>
                <Field label="Цена / подпись">
                  <input className={cn(inputCls, "sm:w-44")} value={s.price} onChange={(e) => patch(i, { price: e.target.value })} placeholder="1 500 ₽/час" />
                </Field>
              </div>
              <button onClick={() => remove(i)} className={iconBtn} aria-label="Удалить услугу" title="Удалить">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Field label="Описание">
                <input className={inputCls} value={s.description} onChange={(e) => patch(i, { description: e.target.value })} />
              </Field>
              <Field label="Иконка">
                <select className={cn(inputCls, "sm:w-48")} value={s.icon} onChange={(e) => patch(i, { icon: e.target.value as ServiceIcon })}>
                  {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
