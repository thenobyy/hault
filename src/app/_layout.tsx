import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AppState, Button, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { db } from "../../db/database";
import { initDatabase } from "../../db/init";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useDrizzleStudio(db);
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [userSettings, setUserSettings] = useState<{ app_lock: number }[]>([]);

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync();
    setAuthenticated(result.success);
  }

  async function getSettings() {
    const result = await db.getAllAsync<{ id: Number; app_lock: number }>(`SELECT * FROM settings`);
    return result[0];
  }

  useEffect(() => {
    const init = async () => {
      const settings = await getSettings();
      if (settings.app_lock === 0) return;
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "background") {
          setAuthenticated(false);
        } else if (nextState === "active") {
          authenticate();
        }
      });

      return () => subscription.remove();
    };

    init();
  }, []);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
    const init = async () => {
      const settings = await getSettings();
      if (Platform.OS !== "web" && settings.app_lock === 1) authenticate();
      else setAuthenticated(true);
    };

    init();
  }, []);

  if (!dbReady) return null;

  if (!isAuthenticated) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <AnimatedSplashOverlay />
        <ThemedText>App gesperrt!</ThemedText>
        <Button title="Entsperren" onPress={authenticate} />
      </ThemedView>
    );
  }

  return (
    <KeyboardProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new_person" options={{ presentation: "fullScreenModal" }}></Stack.Screen>
        <Stack.Screen
          name="persons/[id]"
          options={{
            presentation: "fullScreenModal",
          }}
        />
      </Stack>
    </KeyboardProvider>
  );
}
