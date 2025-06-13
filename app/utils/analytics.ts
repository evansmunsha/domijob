// Analytics utility for tracking user behavior
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
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

// Predefined events for DomiJob
export const trackEvents = {
  // User registration and authentication
  userSignUp: (method: 'email' | 'google' | 'linkedin') => {
    event({
      action: 'sign_up',
      category: 'User',
      label: method,
    });
  },

  userLogin: (method: 'email' | 'google' | 'linkedin') => {
    event({
      action: 'login',
      category: 'User',
      label: method,
    });
  },

  // Resume enhancement tracking
  resumeEnhancementStarted: () => {
    event({
      action: 'resume_enhancement_started',
      category: 'AI Tools',
    });
  },

  resumeEnhancementCompleted: (wordCount: number, atsScore: number) => {
    event({
      action: 'resume_enhancement_completed',
      category: 'AI Tools',
      label: `${wordCount}_words`,
      value: atsScore,
    });
  },

  resumeDownloaded: (format: 'pdf' | 'txt') => {
    event({
      action: 'resume_downloaded',
      category: 'AI Tools',
      label: format,
    });
  },

  // Job matching tracking
  jobMatchingStarted: () => {
    event({
      action: 'job_matching_started',
      category: 'Job Search',
    });
  },

  jobMatchingCompleted: (matchCount: number) => {
    event({
      action: 'job_matching_completed',
      category: 'Job Search',
      value: matchCount,
    });
  },

  jobApplicationClicked: (jobId: string, company: string) => {
    event({
      action: 'job_application_clicked',
      category: 'Job Search',
      label: `${company}_${jobId}`,
    });
  },

  // Credit system tracking
  creditsUsed: (feature: string, amount: number) => {
    event({
      action: 'credits_used',
      category: 'Credits',
      label: feature,
      value: amount,
    });
  },

  creditsPurchased: (plan: string, amount: number) => {
    event({
      action: 'credits_purchased',
      category: 'Revenue',
      label: plan,
      value: amount,
    });
  },

  // Subscription tracking
  subscriptionStarted: (plan: 'pro' | 'premium') => {
    event({
      action: 'subscription_started',
      category: 'Revenue',
      label: plan,
    });
  },

  subscriptionCancelled: (plan: 'pro' | 'premium', reason?: string) => {
    event({
      action: 'subscription_cancelled',
      category: 'Revenue',
      label: `${plan}_${reason || 'unknown'}`,
    });
  },

  // Feature usage tracking
  featureUsed: (feature: string) => {
    event({
      action: 'feature_used',
      category: 'Features',
      label: feature,
    });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string) => {
    event({
      action: 'error_occurred',
      category: 'Errors',
      label: `${errorType}: ${errorMessage}`,
    });
  },

  // Conversion funnel tracking
  funnelStep: (step: string, funnel: string) => {
    event({
      action: 'funnel_step',
      category: 'Conversion',
      label: `${funnel}_${step}`,
    });
  },
};

// User properties for better segmentation
export const setUserProperties = (properties: {
  user_id?: string;
  user_type?: 'free' | 'pro' | 'premium';
  signup_date?: string;
  last_active?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      custom_map: properties,
    });
  }
};

// Enhanced ecommerce tracking for subscriptions
export const trackPurchase = ({
  transactionId,
  value,
  currency = 'USD',
  items,
}: {
  transactionId: string;
  value: number;
  currency?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });
  }
};
