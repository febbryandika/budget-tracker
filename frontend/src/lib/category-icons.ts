import {
  BookOpen, Briefcase, Calendar, Car, Film, Globe, Heart, MoreHorizontal,
  ShoppingBag, Smile, Star, Tag, User, Utensils, Zap,
  type LucideIcon,
} from 'lucide-react'

// Categories store their icon as a string in Postgres. This map resolves the
// string to a lucide component so callsites can render it directly.
export const CATEGORY_ICONS = {
  utensils: Utensils,
  car: Car,
  bolt: Zap,
  briefcase: Briefcase,
  film: Film,
  shoppingBag: ShoppingBag,
  heart: Heart,
  star: Star,
  more: MoreHorizontal,
  bookOpen: BookOpen,
  globe: Globe,
  user: User,
  calendar: Calendar,
  smile: Smile,
  tag: Tag,
} satisfies Record<string, LucideIcon>

export type CategoryIconName = keyof typeof CATEGORY_ICONS

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS) as CategoryIconName[]

export function getCategoryIcon(name?: string | null): LucideIcon {
  return (name && CATEGORY_ICONS[name as CategoryIconName]) || Tag
}
