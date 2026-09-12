import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

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
        screenOptions={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: "", // kein Titel-Text mehr sichtbar
        }}
      />
    </ThemeProvider>
  );
}
