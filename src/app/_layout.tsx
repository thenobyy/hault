import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { AppState, Button, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { db } from "../../db/database";
import { initDatabase } from "../../db/init";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useDrizzleStudio(db);
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [userSettings, setUserSettings] = useState<{ app_lock: number }[]>([]);
  const appState = useRef(AppState.currentState);

  async function authenticate() {
    const settings = await getSettings();
    if (Platform.OS !== "web" && settings.app_lock === 1) {
      const result = await LocalAuthentication.authenticateAsync();
      setAuthenticated(result.success);
    } else setAuthenticated(true);
  }

  async function getSettings() {
    const result = await db.getAllAsync<{ id: Number; app_lock: number }>(`SELECT * FROM settings`);
    return result[0];
  }

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appState.current;
      appState.current = nextState;

      if (nextState === "background") {
        setAuthenticated(false);
      } else if (previousState === "background" && nextState === "active") {
        authenticate();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
    authenticate();
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
            fullScreenGestureEnabled: true,
          }}
        />
      </Stack>
    </KeyboardProvider>
  );
}
