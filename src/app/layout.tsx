import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundaryWrapper } from '@/components/poker/common/error-boundary-wrapper';
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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <div className="noise-overlay" aria-hidden="true" />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
