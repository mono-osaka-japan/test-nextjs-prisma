import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'アプリケーションのダッシュボード',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
