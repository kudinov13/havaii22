import {
  Wifi, FlameKindling, Snowflake, Car, UtensilsCrossed, Waves,
  Sun, PawPrint, Flame, Mountain, Ship, Wine, Eye,
  Tv, ShowerHead, Toilet, Refrigerator, Microwave, Coffee, Utensils,
  Tent, BedDouble, Bath, Sailboat, Fish, Beer,
  type LucideIcon,
} from "lucide-react";
import type { Amenity, ServiceIcon } from "@/lib/types";
import { AMENITY_LABELS } from "@/lib/types";

const AMENITY_MAP: Record<Amenity, LucideIcon> = {
  wifi: Wifi,
  sauna: FlameKindling,
  ac: Snowflake,
  parking: Car,
  kitchen: UtensilsCrossed,
  beach: Waves,
  terrace: Sun,
  pets: PawPrint,
  fireplace: Flame,
  view: Eye,
  tv: Tv,
  shower: ShowerHead,
  toilet: Toilet,
  fridge: Refrigerator,
  microwave: Microwave,
  kettle: Coffee,
  dishes: Utensils,
  bbq: Flame,
  gazebo: Tent,
  linen: BedDouble,
};

const SERVICE_MAP: Record<ServiceIcon, LucideIcon> = {
  flame: FlameKindling,
  bath: Bath,
  tent: Tent,
  waves: Waves,
  sailboat: Sailboat,
  fish: Fish,
  beer: Beer,
  utensils: UtensilsCrossed,
  ship: Ship,
  mountain: Mountain,
  wine: Wine,
};

export function AmenityIcon({ amenity, size = 18, className }: { amenity: Amenity; size?: number; className?: string }) {
  const Icon = AMENITY_MAP[amenity];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

export function ServiceIcon_({ icon, size = 24, className }: { icon: ServiceIcon; size?: number; className?: string }) {
  const Icon = SERVICE_MAP[icon];
  return <Icon size={size} className={className} aria-hidden="true" />;
}

export function AmenityList({ amenities, className }: { amenities: Amenity[]; className?: string }) {
  return (
    <ul className={className}>
      {amenities.map((a) => {
        const Icon = AMENITY_MAP[a];
        return (
          <li key={a} className="flex items-center gap-2 text-sm text-ink-muted">
            <Icon size={18} className="text-emerald" aria-hidden="true" />
            <span>{AMENITY_LABELS[a]}</span>
          </li>
        );
      })}
    </ul>
  );
}
