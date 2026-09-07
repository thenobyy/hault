import { type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LinearGradient } from "expo-linear-gradient";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={["#5a3c3c", "#211717"]}
      style={[{ backgroundImage: "linear-gradient(135deg, #5a3c3c 0%, #211717 100%)" }, style]}
      {...otherProps}
    />
  );
}
