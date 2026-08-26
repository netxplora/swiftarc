import { useEffect } from "react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Helmet } from "react-helmet-async";

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = usePlatformSettings();

  useEffect(() => {
    if (!settings?.design_system) return;

    const { lightMode, darkMode, borderRadius, cardRadius } = settings.design_system;

    // Construct dynamic CSS block
    let css = "";

    if (lightMode) {
      css += `:root {\n`;
      if (lightMode.primary) css += `  --primary: ${lightMode.primary};\n`;
      if (lightMode.primaryHover) css += `  --primary-hover: ${lightMode.primaryHover};\n`;
      if (lightMode.secondary) css += `  --secondary: ${lightMode.secondary};\n`;
      if (lightMode.accent) css += `  --accent: ${lightMode.accent};\n`;
      if (lightMode.background) css += `  --background: ${lightMode.background};\n`;
      if (lightMode.foreground) css += `  --foreground: ${lightMode.foreground};\n`;
      if (lightMode.card) css += `  --card: ${lightMode.card};\n`;
      if (lightMode.cardBorder) css += `  --card-border: ${lightMode.cardBorder};\n`;
      if (lightMode.mutedBackground) css += `  --muted-bg: ${lightMode.mutedBackground};\n`;
      if (lightMode.mutedText) css += `  --muted-text: ${lightMode.mutedText};\n`;
      if (lightMode.inputBackground) css += `  --input-bg: ${lightMode.inputBackground};\n`;
      if (lightMode.inputBorder) css += `  --input-border: ${lightMode.inputBorder};\n`;
      if (lightMode.success) css += `  --success: ${lightMode.success};\n`;
      if (lightMode.warning) css += `  --warning: ${lightMode.warning};\n`;
      if (lightMode.error) css += `  --error: ${lightMode.error};\n`;
      if (lightMode.info) css += `  --info: ${lightMode.info};\n`;
      if (borderRadius) css += `  --radius: ${borderRadius};\n`;
      if (cardRadius) css += `  --card-radius: ${cardRadius};\n`;
      css += `}\n`;
    }

    if (darkMode) {
      css += `.dark {\n`;
      if (darkMode.primary) css += `  --primary: ${darkMode.primary};\n`;
      if (darkMode.primaryHover) css += `  --primary-hover: ${darkMode.primaryHover};\n`;
      if (darkMode.secondary) css += `  --secondary: ${darkMode.secondary};\n`;
      if (darkMode.accent) css += `  --accent: ${darkMode.accent};\n`;
      if (darkMode.background) css += `  --background: ${darkMode.background};\n`;
      if (darkMode.foreground) css += `  --foreground: ${darkMode.foreground};\n`;
      if (darkMode.card) css += `  --card: ${darkMode.card};\n`;
      if (darkMode.cardElevated) css += `  --card-elevated: ${darkMode.cardElevated};\n`;
      if (darkMode.cardBorder) css += `  --card-border: ${darkMode.cardBorder};\n`;
      if (darkMode.mutedBackground) css += `  --muted-bg: ${darkMode.mutedBackground};\n`;
      if (darkMode.mutedText) css += `  --muted-text: ${darkMode.mutedText};\n`;
      if (darkMode.inputBackground) css += `  --input-bg: ${darkMode.inputBackground};\n`;
      if (darkMode.inputBorder) css += `  --input-border: ${darkMode.inputBorder};\n`;
      if (darkMode.success) css += `  --success: ${darkMode.success};\n`;
      if (darkMode.warning) css += `  --warning: ${darkMode.warning};\n`;
      if (darkMode.error) css += `  --error: ${darkMode.error};\n`;
      if (darkMode.info) css += `  --info: ${darkMode.info};\n`;
      css += `}\n`;
    }

    const styleId = "dynamic-theme-overrides";
    let styleTag = document.getElementById(styleId);

    if (css) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = css;
    } else if (styleTag) {
      styleTag.remove();
    }
  }, [settings?.design_system]);

  return (
    <>
      {settings?.global_seo && (
        <Helmet>
          <title>{settings.global_seo.defaultTitle || "SwiftArc"}</title>
          {settings.global_seo.defaultDescription && (
            <meta name="description" content={settings.global_seo.defaultDescription} />
          )}
          {settings.global_seo.canonicalUrl && (
            <link rel="canonical" href={settings.global_seo.canonicalUrl} />
          )}
          {settings.global_seo.ogTitle && (
            <meta property="og:title" content={settings.global_seo.ogTitle} />
          )}
          {settings.global_seo.ogDescription && (
            <meta property="og:description" content={settings.global_seo.ogDescription} />
          )}
          {settings.global_seo.ogImage && (
            <meta property="og:image" content={settings.global_seo.ogImage} />
          )}
          {settings.global_seo.robotsConfig && (
            <meta name="robots" content={settings.global_seo.robotsConfig} />
          )}
          {settings.visual_assets?.favicon && (
            <link rel="icon" type="image/x-icon" href={settings.visual_assets.favicon} />
          )}
        </Helmet>
      )}
      {children}
    </>
  );
}
