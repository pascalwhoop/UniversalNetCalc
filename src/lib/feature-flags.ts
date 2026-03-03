/**
 * Feature Flags Configuration
 * 
 * This is a lightweight feature flagging system.
 * In the future, this can be swapped with a remote service like Statsig, LaunchDarkly, or PostHog.
 */

export type FeatureFlag = 
  | "History"
  | "Saving"
  | "Billing"
  | "Notifications"
  | "AccountView"
  | "UpgradeToProFlow"
  | "GoogleAuth"
  | "FeedbackCTA"

const FLAGS: Record<FeatureFlag, boolean> = {
  History: false,
  Saving: false,
  Billing: false,
  Notifications: false,
  AccountView: false,
  UpgradeToProFlow: false,
  GoogleAuth: false,
  FeedbackCTA: false,
}

/**
 * Hook or helper to check if a feature is enabled.
 * Simple implementation for now, can be extended to use context or remote config.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // You can add environment-specific overrides here
  // e.g., if (process.env.NODE_ENV === 'development') return true
  
  return FLAGS[flag] ?? false
}

// Client-side hook version if we ever need to respond to live updates
export function useFeatureFlags() {
  return {
    isEnabled: isFeatureEnabled,
    // Add more helper methods if needed
  }
}
