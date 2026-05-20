import {
  LayoutDashboard,
  Package,
  Tag,
  BarChart3,
  ShoppingBag,
  Ticket,
  FileText,
  HelpCircle,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: Tag },
  { label: 'Estoque', href: '/admin/estoque', icon: BarChart3 },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
  { label: 'Cupons', href: '/admin/cupons', icon: Ticket },
  { label: 'Páginas', href: '/admin/paginas', icon: FileText },
  { label: 'Ajuda', href: '/admin/ajuda', icon: HelpCircle },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export const segmentLabels: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  produtos: 'Produtos',
  categorias: 'Categorias',
  estoque: 'Estoque',
  pedidos: 'Pedidos',
  cupons: 'Cupons',
  paginas: 'Páginas',
  ajuda: 'Ajuda',
  configuracoes: 'Configurações',
  frete: 'Frete',
  aparencia: 'Aparência',
  usuarios: 'Usuários',
  novo: 'Novo',
  nova: 'Nova',
  editar: 'Editar',
};
