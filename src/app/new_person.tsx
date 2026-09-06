import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Button, FlatList, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db/database";

export default function NewPerson() {
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [notes, setNotes] = useState("");

  const [image, setImage] = useState<string>("");
  const [galaryImages, setGalaryImages] = useState<ImagePickerAsset[]>();

  if (galaryImages != undefined) {
    const images = galaryImages.map((p) => ({ uri: p.uri }));
  }
  const router = useRouter();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the media library is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri as string);
    }
  };

  const pickGalaryImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the media library is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    console.log(result?.assets);

    if (!result.canceled) {
      setGalaryImages(result.assets);
    }
  };

  async function savePerson() {
    if (!name.trim()) return;
    await db.runAsync("INSERT INTO persons (name, info, main_img, created_at, usernames) VALUES (?, ?, ?, ?, ?)", [
      name,
      notes,
      image,
      new Date().toISOString(),
      usernames,
    ]);
    router.back();
  }
  return (
    <ThemedView style={{ flex: 1, height: "100%" }}>
      <View
        style={{
          marginTop: 85,
          marginBottom: 25,
          paddingHorizontal: 15,
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row",
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 24, height: 24 }}>
          <X size={24} color="white" />
        </Pressable>
        <Button title="Speichern" onPress={savePerson} />
      </View>
      <SafeAreaView style={{ flex: 1, alignItems: "center", width: "100%" }}>
        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, gap: 12 }} bottomOffset={40}>
          <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
            <Pressable
              onPress={pickImage}
              style={{
                width: "100%",
                aspectRatio: 1 / 1,
                borderRadius: 15,
                backgroundColor: "#ffffff5d",
                overflow: "hidden",
              }}
            >
              <ImageBackground src={image} style={{ height: "100%" }}></ImageBackground>
            </Pressable>
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Name</ThemedText>
            <TextInput placeholder="Name" onChangeText={setName} style={styles.input} />
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Benutzernamen</ThemedText>
            <TextInput placeholder="Benutzernamen" onChangeText={setUsernames} style={styles.input} />
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Notizen</ThemedText>
            <TextInput
              placeholder="Notizen"
              onChangeText={setNotes}
              style={styles.input}
              multiline
              numberOfLines={4}
              editable
            />
          </View>
          <View style={{ width: "100%", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
              <ThemedText type="default">Gallerie</ThemedText>
              <View style={{ transform: [{ rotate: "45deg" }] }}>
                <Pressable onPress={() => pickGalaryImages()} style={{ width: 24, height: 24 }}>
                  <X size={24} color="blue" />
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={pickGalaryImages}
              style={{
                width: "100%",
                aspectRatio: 1 / 1,
                borderRadius: 15,
                backgroundColor: "#ffffff5d",
                overflow: "hidden",
              }}
            >
              <FlatList
                data={galaryImages}
                style={{ height: "100%", width: "100%" }}
                numColumns={3}
                keyExtractor={(item, index) => String(item.uri ?? item.fileName ?? index)}
                renderItem={({ item }) => (
                  <Pressable
                    style={{ width: "33%", aspectRatio: 1 / 1 }}
                    onPress={() => router.navigate("/new_person")}
                  >
                    {/* <Link href="/new_person" style={{ width: "33%", aspectRatio: 1 / 1 }}> */}
                    <ImageBackground src={item.uri} style={{ width: "100%", aspectRatio: 1 / 1 }}></ImageBackground>
                    {/* </Link> */}
                  </Pressable>
                )}
              />

              <ImageView
                images={galaryImages}
                imageIndex={selectedIndex}
                visible={isVisible}
                onRequestClose={() => setIsVisible(false)}
              />
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 12,
    paddingVertical: 18,
    backgroundColor: "#ffffff5d",
    color: "black",
    borderRadius: 15,
    fontSize: 16,
    fontWeight: 500,
    width: "100%",
  },
});
