// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export const GA_TRACKING_ID = 'G-YGJCLVHHMP';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track decision events
export const trackDecision = (dis: string, dat: string, verdict: string) => {
  event({
    action: 'decision_made',
    category: 'engagement',
    label: `${dis} vs ${dat} → ${verdict}`,
  });
};

// Track genie interactions
export const trackGenieInteraction = (interactionType: string) => {
  event({
    action: 'genie_interaction',
    category: 'engagement',
    label: interactionType,
  });
};
