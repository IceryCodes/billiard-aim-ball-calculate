'use client';

import { useEffect } from 'react';

import { Loader } from '@googlemaps/js-api-loader';
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

declare global {
  interface Window {
    initGoogleMaps?: () => Promise<void>;
  }
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    window.initGoogleMaps = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_MAP_KEY || '',
        version: 'weekly',
      });

      try {
        await loader.importLibrary('maps');
        await loader.importLibrary('places');

        if (!window.google?.maps) {
          throw new Error('Google Maps API not loaded');
        }

        // const hasMapIdSupport = Object.hasOwn(Map.prototype, 'mapId');
        // console.log('Map ID support:', hasMapIdSupport);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    window.initGoogleMaps();
  }, []);
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
