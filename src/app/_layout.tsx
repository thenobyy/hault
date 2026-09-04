import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Button, Platform, useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { db } from "../../db/database";
import { initDatabase } from "../../db/init";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  useDrizzleStudio(db);
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setAutheticated] = useState<boolean>();
  const colorScheme = useColorScheme();

  async function AuthenticateAppUser() {
    const allowedToOpenApp = await LocalAuthentication.authenticateAsync();
    setAutheticated(allowedToOpenApp.success);
  }

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
    if (Platform.OS != "web") AuthenticateAppUser();
  }, []);

  if (!dbReady) {
    return null; // oder ein Ladebildschirm/Splash
  }
  // if (Platform.OS == "ios" || Platform.OS == "android") AuthenticateAppUser();

  return (
    // <Stack screenOptions={{ headerShown: false }}>
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {isAuthenticated ? (
        <AppTabs />
      ) : (
        <ThemedView style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <ThemedText>App gesperrt!</ThemedText>
          <Button title="Entsperren" onPress={AuthenticateAppUser} />
        </ThemedView>
      )}
    </ThemeProvider>
    // </Stack>
  );
}
