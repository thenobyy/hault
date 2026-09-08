import { ThemedView } from "@/components/themed-view";
import { Directory, Paths } from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

export default function DebugFiles() {
  const files = new Directory(Paths.document).list();
  const router = useRouter();
  useFocusEffect(() => {
    router.navigate("/(tabs)/explore");
  });
  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {files.map((f) => (
          <View key={f.uri} style={{ marginBottom: 20 }}>
            <Text>{f.name}</Text>
            <Image source={{ uri: f.uri }} style={{ width: 150, height: 150 }} />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}
