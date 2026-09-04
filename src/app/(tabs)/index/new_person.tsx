import { ThemedView } from "@/components/themed-view";
import { Form, TextField } from "@expo/ui/swift-ui";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewPerson() {
  return (
    <ThemedView style={{ height: "100%" }}>
      <SafeAreaView>
        <Form>
          <TextField />
        </Form>
        <Text>Hallo</Text>
      </SafeAreaView>
    </ThemedView>
  );
}
