import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ThemePalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  cardElevated?: string;
  cardBorder: string;
  mutedBackground: string;
  mutedText: string;
  inputBackground: string;
  inputBorder: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface PlatformSettings {
  id: string;
  is_singleton: boolean;
  visual_assets: {
    primaryLogo?: string;
    logoLight?: string;
    logoDark?: string;
    favicon?: string;
    appIcon?: string;
    socialImage?: string;
    emailLogo?: string;
    documentLogo?: string;
  };
  design_system: {
    lightMode?: ThemePalette;
    darkMode?: ThemePalette;
    typography?: {
      display: string;
      sans: string;
      mono: string;
    };
    borderRadius?: string;
    cardRadius?: string;
    buttonStyles?: string;
    inputStyles?: string;
    shadows?: string;
    surfaceHierarchy?: string;
  };
  contact_info: {
    platformName: string;
    website?: string;
    supportEmail: string;
    phone: string;
    address?: string;
    workingHours?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
    };
  };
  compliance_legal: {
    termsUrl?: string;
    privacyUrl?: string;
    shippingPolicy?: string;
    cookiePolicy?: string;
    refundPolicy?: string;
    otherLegal?: string;
  };
  global_seo: {
    defaultTitle: string;
    defaultDescription: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    robotsConfig?: string;
    sitemapConfig?: string;
  };
  notifications_alerts?: {
    systemNotifications?: boolean;
    shipmentNotifications?: boolean;
    paymentNotifications?: boolean;
    accountNotifications?: boolean;
    securityNotifications?: boolean;
    maintenanceAlerts?: boolean;
  };
}

export interface PlatformFee {
  id: string;
  name: string;
  fee_type: "fixed" | "percentage";
  value: number;
  min_amount: number | null;
  max_amount: number | null;
  is_active: boolean;
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_settings")
        .select("*")
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as PlatformSettings | null;
    },
    // Cache settings for 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function usePlatformFees() {
  return useQuery({
    queryKey: ["platform-fees"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_fees")
        .select("*")
        .eq("is_active", true)
        .order("name");
        
      if (error) throw error;
      return data as PlatformFee[];
    },
    // Cache fees for 5 minutes
    staleTime: 1000 * 60 * 5,
  });
}
