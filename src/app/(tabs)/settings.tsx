import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Host, HStack, Toggle, VStack } from "@expo/ui/swift-ui";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../db/database";

export default function SettingsPage() {
  const [faceID, setFaceID] = useState<boolean>();

  async function fetchSettings() {
    const result = await db.getAllAsync<{ app_lock: number }>(`SELECT * FROM settings`);
    if (result[0].app_lock === 1) {
      setFaceID(true);
    } else {
      setFaceID(false);
    }
  }

  async function saveSettings(value: boolean, setting: string) {
    console.log(value);
    switch (setting) {
      case "app_lock":
        setFaceID(value);
        break;
    }
    await db.execAsync(`UPDATE settings SET ${setting}=${value}`);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15 }}>
          <ThemedText type="subtitle" style={{}}>
            Einstellungen
          </ThemedText>
        </View>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.settingsBox}>
            <Host style={{ flex: 1, width: "auto", padding: 55 }}>
              <HStack>
                <VStack spacing={22}>
                  <Toggle
                    isOn={faceID}
                    onIsOnChange={(value) => {
                      saveSettings(value, "app_lock");
                    }}
                    label="Face ID"
                    systemImage="faceid"
                  />
                  <Toggle label="Enable feature" />
                  <Toggle label="Enable feature" />
                </VStack>
              </HStack>
            </Host>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    paddingHorizontal: 15,
  },
  settingsBox: {
    flex: 1,
    backgroundColor: "#ffffff5d",
    padding: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
