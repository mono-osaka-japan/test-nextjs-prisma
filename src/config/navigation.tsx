import { type ComponentType, type SVGProps } from 'react';
import {
  DashboardIcon,
  ScrapingIcon,
  SettingsIcon,
  HelpIcon,
} from '@/components/icons';
import {
  CampaignsIcon,
  PatternsIcon,
} from '@/components/features/dashboard/icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>> | (() => JSX.Element);

export interface NavItem {
  title: string;
  href: string;
  Icon: IconComponent;
}

export const mainNavItems: NavItem[] = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    Icon: DashboardIcon,
  },
  {
    title: '案件管理',
    href: '/campaigns',
    Icon: CampaignsIcon,
  },
  {
    title: 'パターン',
    href: '/patterns',
    Icon: PatternsIcon,
  },
  {
    title: 'スクレイピング',
    href: '/scraping',
    Icon: ScrapingIcon,
  },
  {
    title: '設定',
    href: '/settings',
    Icon: SettingsIcon,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: 'ヘルプ',
    href: '/help',
    Icon: HelpIcon,
  },
];
