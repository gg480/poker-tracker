import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '德扑积分榜 | Poker Tracker',
  description: '朋友局德州扑克积分追踪与分析工具',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
