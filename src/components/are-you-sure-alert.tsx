import { Alert, Button, Host, Text } from "@expo/ui/swift-ui";
import { useState } from "react";
import { Alert as AlertRN, Button as ButtonRN, Platform } from "react-native";

export default function DestructiveAlertExample() {
  const [isPresented, setIsPresented] = useState(false);

  return (
    <>
      {Platform.OS === "ios" ? (
        <Host style={{ flex: 1 }}>
          <Alert title="Delete account?" isPresented={isPresented} onIsPresentedChange={setIsPresented}>
            <Alert.Trigger>
              <Button label="Delete account" role="destructive" onPress={() => setIsPresented(true)} />
            </Alert.Trigger>
            <Alert.Actions>
              <Button
                label="Delete"
                role="destructive"
                onPress={() => {
                  console.log("Deleted");
                  setIsPresented(false);
                }}
              />
              <Button label="Cancel" role="cancel" />
            </Alert.Actions>
            <Alert.Message>
              <Text>This permanently deletes your account and all data. This cannot be undone.</Text>
            </Alert.Message>
          </Alert>
        </Host>
      ) : (
        <ButtonRN
          title="Delete account"
          color="red"
          onPress={() => {
            AlertRN.alert(
              "Delete account?",
              "This permanently deletes your account and all data. This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    console.log("Deleted");
                  },
                },
              ],
            );
          }}
        />
      )}
    </>
  );
}
