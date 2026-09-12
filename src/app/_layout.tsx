import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import * as Sentry from "@sentry/react-native";
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

interface UserSettings {
  id: number;
  app_lock: number;
  devMode: number;
}

export default function RootLayout() {
  useDrizzleStudio(db);
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const appState = useRef(AppState.currentState);
  let settings: UserSettings;

  Sentry.init({
    dsn: "https://53fd710bd934b9d5e15bc60b5a6e064d@o4508585788833792.ingest.de.sentry.io/4512074411278416",

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: false,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });

  async function authenticate() {
    settings = await getSettings();
    if (Platform.OS !== "web" && settings.app_lock === 1) {
      const result = await LocalAuthentication.authenticateAsync();
      setAuthenticated(result.success);
    } else setAuthenticated(true);
  }

  async function getSettings() {
    const result = await db.getAllAsync<UserSettings>(`SELECT * FROM settings`);
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
    const init = async () => {
      await initDatabase().then(() => setDbReady(true));
      await authenticate();
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
        <Stack.Screen
          name="(tabs)"
          options={{
            presentation: "fullScreenModal",
            fullScreenGestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen
          name="new_person"
          options={{
            presentation: "fullScreenModal",
            fullScreenGestureEnabled: true,
            gestureDirection: "vertical",
          }}
        ></Stack.Screen>
        <Stack.Screen
          name="persons/[id]"
          options={{
            presentation: "fullScreenModal",
            fullScreenGestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
      </Stack>
    </KeyboardProvider>
  );
}
