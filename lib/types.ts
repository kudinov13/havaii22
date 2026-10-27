export type Amenity =
  | "wifi"
  | "sauna"
  | "ac"
  | "parking"
  | "kitchen"
  | "beach"
  | "terrace"
  | "pets"
  | "fireplace"
  | "view"
  | "tv"
  | "shower"
  | "toilet"
  | "fridge"
  | "microwave"
  | "kettle"
  | "dishes"
  | "bbq"
  | "gazebo"
  | "linen";

export type HouseType = "family" | "couple" | "sauna" | "waterfront";
export type HouseStatus = "free" | "busy" | "ondate";

export interface HouseImage {
  id: string;
  src: string;
  alt: string;
  order: number;
  isCover: boolean;
}

export interface House {
  id: string;
  slug: string;
  name: string;
  type: HouseType;
  status: HouseStatus;
  shortDesc: string;
  description: string;
  pricePerNight: number;
  guests: number;
  /** 0 = площадь неизвестна, не показывать */
  area: number;
  amenities: Amenity[];
  images: HouseImage[];
  featured?: boolean;
  /** Занятые даты (ISO "YYYY-MM-DD") — не даём забронировать дважды */
  blockedDates?: string[];
}

export type ServiceIcon =
  | "flame"
  | "bath"
  | "tent"
  | "waves"
  | "sailboat"
  | "fish"
  | "beer"
  | "utensils"
  | "ship"
  | "mountain"
  | "wine";

export interface Service {
  icon: ServiceIcon;
  title: string;
  description: string;
  price: string;
}

export interface Review {
  name: string;
  text: string;
  rating: number;
  date: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
}

export type MapPointType = "house" | "facility" | "water";

export interface MapPoint {
  id: string;
  x: number; // 0–100 (процент от ширины SVG)
  y: number; // 0–100 (процент от высоты SVG)
  label: string;
  type: MapPointType;
  description: string;
  /** Для точек типа "house" — id домика, открывает HouseModal */
  houseId?: string;
}

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  family: "Семейный",
  couple: "Для двоих / семьи",
  sauna: "С баней",
  waterfront: "У воды",
};

export const HOUSE_STATUS_LABELS: Record<HouseStatus, string> = {
  free: "Свободен",
  busy: "Занят",
  ondate: "На даты",
};

export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: "Wi-Fi",
  sauna: "Баня",
  ac: "Кондиционер",
  parking: "Парковка",
  kitchen: "Кухня",
  beach: "Пляж рядом",
  terrace: "Терраса",
  pets: "Можно с питомцами",
  fireplace: "Камин",
  view: "Вид на воду",
  tv: "ТВ",
  shower: "Душ",
  toilet: "Туалет",
  fridge: "Холодильник",
  microwave: "Микроволновка",
  kettle: "Чайник",
  dishes: "Посуда",
  bbq: "Мангальная зона",
  gazebo: "Беседка",
  linen: "Постельное и полотенца",
};
