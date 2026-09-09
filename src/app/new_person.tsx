import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFullImagePath, saveImagePermanently } from "@/components/utils";
import { BlurView } from "expo-blur";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Trash, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Button, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../db/database";

export default function NewPerson() {
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [notes, setNotes] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [image, setImage] = useState<string>("");
  const [galaryImages, setGalaryImages] = useState<ImagePickerAsset[]>([]);
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
      // galaryImages.push(result.assets);
      setGalaryImages([...galaryImages, ...result.assets]);
      // setGalaryImages(result.assets);
    }
  };

  function removeGalaryImage(index: number) {
    setGalaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePerson() {
    if (!name.trim()) return;
    const result = await db.runAsync(
      "INSERT INTO persons (name, info, main_img, created_at, usernames) VALUES (?, ?, ?, ?, ?)",
      [name, notes, image, new Date().toISOString(), usernames],
    );

    const personId = result.lastInsertRowId;

    // Hauptbild ebenfalls dauerhaft kopieren, statt nur die temporäre URI zu speichern
    if (image) {
      const permanentMainImg = await saveImagePermanently(image, personId, 0);
      await db.runAsync("UPDATE persons SET main_img = ? WHERE id = ?", [permanentMainImg, personId]);
    }

    // Galerie-Bilder kopieren und in die photos-Tabelle eintragen
    for (let i = 0; i < galaryImages.length; i++) {
      const permanentPath = await saveImagePermanently(galaryImages[i].uri, personId, i + 1);
      await db.runAsync("INSERT INTO photos (person_id, file_path) VALUES (?, ?)", [personId, permanentPath]);
    }

    router.back();
  }
  return (
    <ThemedView style={{ flex: 1, height: "100%" }}>
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          paddingBottom: 10,
          paddingHorizontal: 25,
          height: 110,
          position: "absolute",
          justifyContent: "flex-end",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#5a3c3c5e",
          zIndex: 100,
          filter: "blur(8px)",
        }}
      >
        <View style={{ alignItems: "center", justifyContent: "space-between", flexDirection: "row" }}>
          <Pressable onPress={() => router.back()} style={{ width: 24, height: 24 }}>
            <X size={24} color="white" />
          </Pressable>
          <Button title="Speichern" onPress={savePerson} />
        </View>
      </BlurView>
      <SafeAreaView style={{ flex: 1, alignItems: "center", width: "100%", paddingTop: 110 }}>
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
              <ImageBackground src={getFullImagePath(image)} style={{ height: "100%" }}></ImageBackground>
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
                minHeight: 250,
                borderRadius: 15,
                backgroundColor: "#ffffff5d",
                overflow: "hidden",
              }}
            >
              <View style={{ width: "100%", flexDirection: "row", flexWrap: "wrap" }}>
                {galaryImages.map((item, index) => (
                  <View key={item.assetId ?? item.uri} style={{ width: "33.33%", aspectRatio: 1 / 1 }}>
                    <Pressable
                      style={{ width: "100%", height: "100%" }}
                      onPress={() => {
                        setSelectedIndex(index);
                        setIsVisible(true);
                      }}
                    >
                      <ImageBackground src={item.uri} style={{ width: "100%", height: "100%" }} />
                    </Pressable>

                    <Pressable
                      onPress={() => removeGalaryImage(index)}
                      style={{ position: "absolute", top: 4, right: 4, backgroundColor: "black", borderRadius: 12 }}
                    >
                      <X size={16} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>

              <ImageView
                images={galaryImages}
                imageIndex={selectedIndex}
                visible={isVisible}
                onRequestClose={() => setIsVisible(false)}
                HeaderComponent={(index) => {
                  return (
                    <View
                      style={{
                        paddingTop: 60,
                        paddingBottom: 10,
                        paddingHorizontal: 25,
                        backgroundColor: "#00000060",
                        flex: 1,
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          removeGalaryImage(index.imageIndex);
                          if (galaryImages.length <= 1) setIsVisible(false);
                          console.log(index.imageIndex);
                        }}
                        style={{ padding: 10 }}
                      >
                        <Trash size={24} color="white" />
                      </Pressable>
                      <Pressable onPress={() => setIsVisible(false)} style={{ padding: 10 }}>
                        <X size={24} color="white" />
                      </Pressable>
                    </View>
                  );
                }}
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
