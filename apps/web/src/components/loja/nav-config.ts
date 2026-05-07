export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { label: 'NEW IN', href: '/lancamentos' },
  {
    label: 'CATEGORIAS',
    children: [
      { label: 'Vestidos', href: '/categoria/vestidos' },
      { label: 'Blusas', href: '/categoria/blusas' },
      { label: 'Calças', href: '/categoria/calcas' },
      { label: 'Saias', href: '/categoria/saias' },
    ],
  },
  { label: 'SALE', href: '/sale' },
  { label: 'SOBRE', href: '/sobre' },
];
