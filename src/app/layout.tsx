'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/next';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import GoogleAnalytics from '@/global-components/GoogleAnalytics';
import Header from '@/global-components/Header';

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
            <ToastProvider>
              <AuthProvider>
                <Header>
                  {children}
                  <Analytics />
                </Header>
              </AuthProvider>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
};

export default RootLayout;
