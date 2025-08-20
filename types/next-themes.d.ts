declare module 'next-themes' {
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    value?: string[];
    forcedTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    storageKey?: string;
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;

  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    forcedTheme?: string;
    resolvedTheme?: string;
    systemTheme?: 'light' | 'dark';
  };
}
