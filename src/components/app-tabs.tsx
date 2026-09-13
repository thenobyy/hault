import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { UserSettings } from "./types";

export default function AppTabs({ set }: { set: UserSettings | null }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
    // backgroundColor={"#0000001c"}
    // backgroundColor={colors.background}
    // indicatorColor={"#0000001c"}
    // indicatorColor={colors.backgroundElement}
    // labelStyle={{ selected: { color: colors.text } }}
    // blurEffect="dark"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore" hidden={!set?.devMode}>
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/explore.png")} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="test" hidden={!set?.devMode}>
        <NativeTabs.Trigger.Label>Test</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/home.png")} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Einstellungen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "gear", selected: "gear" }} md="settings" renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Icon md="search" renderingMode="template" />
        <NativeTabs.Trigger.Label>Suchen</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
