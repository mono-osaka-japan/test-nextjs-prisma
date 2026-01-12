import { type ComponentType, type SVGProps } from 'react';
import {
  DashboardIcon,
  GlobeIcon,
  ScrapingIcon,
  SettingsIcon,
  HelpIcon,
} from '@/components/icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  title: string;
  href: string;
  Icon: IconComponent;
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    Icon: DashboardIcon,
  },
  {
    title: 'Sites',
    href: '/sites',
    Icon: GlobeIcon,
  },
  {
    title: 'Scraping',
    href: '/scraping',
    Icon: ScrapingIcon,
  },
  {
    title: 'Settings',
    href: '/settings',
    Icon: SettingsIcon,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: 'Help',
    href: '/help',
    Icon: HelpIcon,
  },
];
