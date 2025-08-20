import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAnalytics } from "@/hooks/use-analytics";
import { Sun, Moon } from "lucide-react";

function DarkModeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { trackThemeToggle } = useAnalytics();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the server render
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Toggle theme"
        disabled
      >
        <Moon className="w-4 h-4" />
      </Button>
    );
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    trackThemeToggle(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="h-8 w-8 p-0"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

export default DarkModeToggleButton;
