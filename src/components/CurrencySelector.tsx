import { useLocale, type Currency, type Language } from "@/hooks/use-locale";
import { Check, ChevronDown, Globe, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencies: { id: Currency; label: string; symbol: string }[] = [
  { id: "USD", label: "US Dollar", symbol: "$" },
  { id: "EUR", label: "Euro", symbol: "€" },
  { id: "GBP", label: "British Pound", symbol: "£" },
  { id: "CAD", label: "Canadian Dollar", symbol: "$" },
  { id: "JPY", label: "Japanese Yen", symbol: "¥" },
];

const languages: { id: Language; label: string }[] = [
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" },
  { id: "es", label: "Español" },
  { id: "ja", label: "日本語" },
];

export function LocaleSelector() {
  const { currency, setCurrency, language, setLanguage } = useLocale();
  const selectedCur = currencies.find((c) => c.id === currency);
  const selectedLang = languages.find((l) => l.id === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 focus:ring-offset-background">
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {selectedLang?.id.toUpperCase()} / {selectedCur?.id}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Language
        </DropdownMenuLabel>
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.id}
            onClick={() => setLanguage(l.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{l.label}</span>
            {language === l.id && <Check className="h-4 w-4 text-amber" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Currency
        </DropdownMenuLabel>
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setCurrency(c.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">{c.symbol}</span>
              <span>{c.label}</span>
            </div>
            {currency === c.id && <Check className="h-4 w-4 text-amber" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
