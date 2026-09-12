import AppTabs from "@/components/app-tabs";
import { UserSettings } from "@/components/types";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { db } from "../../../db/database";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);

  async function getSettings() {
    const req = await db.getAllAsync<UserSettings>(`SELECT * FROM settings`);
    setSettings(req[0] ?? null);
  }

  useEffect(() => {
    const init = async () => {
      await getSettings();
    };

    init();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AppTabs set={settings} />
    </ThemeProvider>
  );
}
