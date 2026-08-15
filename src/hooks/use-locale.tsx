import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "JPY";
export type Language = "en" | "fr" | "de" | "es" | "ja";

interface LocaleContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amount: number) => string;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

const RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  JPY: 150.0,
};

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.tracking": "Tracking",
    "nav.book": "How to Ship",
    "nav.about": "About Us",
    "nav.support": "Support",
    "hero.title": "Global Freight. Reliable Tracking.",
    "hero.subtitle":
      "Ship, track, and manage freight across 220+ countries with a single platform and a network built for reliability.",
    "footer.rights": "All rights reserved.",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.services": "Services",
    "nav.tracking": "Suivi",
    "nav.book": "Réserver un envoi",
    "nav.about": "À propos",
    "nav.support": "Assistance",
    "hero.title": "Fret mondial. Suivi fiable.",
    "hero.subtitle":
      "Expédiez, suivez et gérez vos envois dans 220+ pays depuis une seule plateforme.",
    "footer.rights": "Tous droits réservés.",
  },
  de: {
    "nav.home": "Startseite",
    "nav.services": "Dienstleistungen",
    "nav.tracking": "Sendungsverfolgung",
    "nav.book": "Sendung Buchen",
    "nav.about": "Über uns",
    "nav.support": "Hilfe",
    "hero.title": "Globaler Frachtversand. Zuverlässige Sendungsverfolgung.",
    "hero.subtitle":
      "Versenden, verfolgen und verwalten Sie Frachtsendungen in 220+ Ländern über eine einzige Plattform.",
    "footer.rights": "Alle Rechte vorbehalten.",
  },
  es: {
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.tracking": "Seguimiento",
    "nav.book": "Reservar Envío",
    "nav.about": "Nosotros",
    "nav.support": "Soporte",
    "hero.title": "Carga global. Seguimiento confiable.",
    "hero.subtitle":
      "Envíe, rastree y gestione envíos en más de 220 países desde una sola plataforma.",
    "footer.rights": "Todos los derechos reservados.",
  },
  ja: {
    "nav.home": "ホーム",
    "nav.services": "サービス",
    "nav.tracking": "追跡",
    "nav.book": "出荷を予約",
    "nav.about": "会社概要",
    "nav.support": "サポート",
    "hero.title": "グローバル輸送。信頼性の高い追跡。",
    "hero.subtitle": "220以上の国での貨物の発送、追跡、管理を一つのプラットフォームで行えます。",
    "footer.rights": "全著作権所有。",
  },
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const storedCur = localStorage.getItem("swiftarc_currency") as Currency | null;
    if (storedCur && RATES[storedCur]) {
      setCurrencyState(storedCur);
    } else {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.startsWith("Europe/London")) setCurrencyState("GBP");
        else if (timezone.startsWith("Europe/")) setCurrencyState("EUR");
        else if (timezone.startsWith("Asia/Tokyo")) setCurrencyState("JPY");
        else if (timezone.startsWith("America/Toronto") || timezone.startsWith("America/Vancouver"))
          setCurrencyState("CAD");
      } catch {
        // Fallback to default currency if timezone detection fails
      }
    }

    const storedLang = localStorage.getItem("swiftarc_language") as Language | null;
    if (storedLang && DICTIONARY[storedLang]) {
      setLanguageState(storedLang);
    } else {
      try {
        const browserLang = navigator.language.split("-")[0] as Language;
        if (DICTIONARY[browserLang]) setLanguageState(browserLang);
      } catch {
        // Fallback to default language if detection fails
      }
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("swiftarc_currency", c);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem("swiftarc_language", l);
  };

  const format = (amount: number) => {
    const rate = RATES[currency] || 1;
    const converted = amount * rate;

    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: currency,
    }).format(converted);
  };

  const t = (key: string) => {
    return DICTIONARY[language]?.[key] || DICTIONARY["en"][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ currency, setCurrency, format, language, setLanguage, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
