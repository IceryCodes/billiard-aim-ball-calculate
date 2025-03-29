import { Suspense, useEffect } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

// GA4 事件參數型別
type GtagEventParams = {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  send_page_view?: boolean;
  [key: string]: string | number | boolean | undefined;
};

// GA4 設定參數型別
type GtagConfigParams = {
  send_page_view?: boolean;
  [key: string]: string | number | boolean | undefined;
};

// 定義 gtag 函數的型別
type GtagFunction = {
  (command: 'config', targetId: string, config?: GtagConfigParams): void;
  (command: 'event', action: string, params: GtagEventParams): void;
  (command: 'js', date: Date): void;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFunction;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Analytics 內容組件
const AnalyticsContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !pathname) return;

    const url = pathname + (searchParams?.toString() || '');

    // 發送頁面瀏覽事件到 GA4
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
};

// 主組件
const GoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsContent />
      </Suspense>
    </>
  );
};

export default GoogleAnalytics;
