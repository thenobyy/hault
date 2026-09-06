import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Button, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { db } from "../../db/database";
import { initDatabase } from "../../db/init";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useDrizzleStudio(db);
  const [dbReady, setDbReady] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync();
    setAuthenticated(result.success);
  }

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
    if (Platform.OS !== "web") authenticate();
    else setAuthenticated(true);
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
        <Stack.Screen name="persons/[id]" options={{ presentation: "fullScreenModal" }}>
          {/* <Stack.Header blurEffect="systemMaterial" /> */}
        </Stack.Screen>
      </Stack>
    </KeyboardProvider>
  );
}
