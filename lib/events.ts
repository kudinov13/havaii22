"use client";

/**
 * CustomEvent-шина: открыть модал домика.
 * Не требует клиентского провайдера поверх RSC.
 */
export const OPEN_HOUSE_EVENT = "gavai22:open-house";

export function openHouse(houseId: string) {
  window.dispatchEvent(new CustomEvent(OPEN_HOUSE_EVENT, { detail: { houseId } }));
}
