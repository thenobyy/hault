import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { Platform, useColorScheme } from "react-native";

export default function SearchLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...theme,
        colors: { ...theme.colors, background: "transparent" },
      }}
    >
      <Stack
        screenOptions={
          Platform.OS === "ios"
            ? {
                headerTransparent: true,
                headerShadowVisible: false,
                headerTitle: "",
              }
            : {
                headerTitle: "Suchen",
                headerShown: false, // Android braucht die Suchleisten-Header-Krücke nicht
              }
        }
      />
    </ThemeProvider>
  );
}
