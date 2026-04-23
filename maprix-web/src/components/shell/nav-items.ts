import { ArrowLeftRight, BookText, FileText, Inbox, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export type Area = 'engenharia' | 'cartorio';

export const AREA_LABELS: Record<Area, string> = {
  engenharia: 'Engenharia',
  cartorio: 'Cartório',
};

export const engenhariaNav: NavItem[] = [
  { to: '/engenharia/conversor', label: 'Conversor', icon: ArrowLeftRight },
  { to: '/engenharia/memorial-e-shapefile', label: 'Memorial & Shapefile', icon: FileText },
];

export const cartorioNav: NavItem[] = [
  { to: '/cartorio/matriculas', label: 'Matrículas', icon: BookText },
  { to: '/cartorio/protocolos', label: 'Protocolos', icon: Inbox },
];

export function getNav(area: Area): NavItem[] {
  return area === 'engenharia' ? engenhariaNav : cartorioNav;
}
