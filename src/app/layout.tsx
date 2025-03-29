'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/next';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import GoogleAnalytics from '@/global-components/GoogleAnalytics';

import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="zh-TW" className="scroll-smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>{children}</ToastProvider>
            <Analytics />
          </QueryClientProvider>
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
};

export default RootLayout;
