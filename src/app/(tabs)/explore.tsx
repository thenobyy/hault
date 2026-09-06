import { Directory, Paths } from "expo-file-system";
import { Image, ScrollView, Text, View } from "react-native";

export default function DebugFiles() {
  const files = new Directory(Paths.document).list();

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {files.map((f) => (
        <View key={f.uri} style={{ marginBottom: 20 }}>
          <Text>{f.name}</Text>
          <Image source={{ uri: f.uri }} style={{ width: 150, height: 150 }} />
        </View>
      ))}
    </ScrollView>
  );
}
