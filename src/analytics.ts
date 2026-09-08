const DEFAULT_MEASUREMENT_ID = 'G-R3N809EVB6';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID;
const scriptId = 'google-analytics-script';

type GtagArguments =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?];

type Gtag = (...args: GtagArguments) => void;

declare global {
  interface Window {
    dataLayer: GtagArguments[];
    gtag?: Gtag;
  }
}

let initialized = false;

function hasValidMeasurementId(): boolean {
  return /^G-[A-Z0-9]+$/.test(measurementId);
}

export function initializeAnalytics(): void {
  if (typeof window === 'undefined' || !hasValidMeasurementId() || initialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: GtagArguments) => {
    window.dataLayer.push(args);
  });

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  initialized = true;
}

export function trackPageView(pagePath?: string): void {
  if (typeof window === 'undefined' || !hasValidMeasurementId()) return;

  initializeAnalytics();
  window.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath || `${window.location.pathname}${window.location.search}`,
  });
}
