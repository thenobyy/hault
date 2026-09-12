import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFilenameFromPath, getFullImagePath, saveImagePermanently } from "@/components/utils";
import { BlurView } from "expo-blur";
import { File } from "expo-file-system";
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

interface GalaryImages extends ImagePickerAsset {
  pos: number;
}

export default function NewPerson() {
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [notes, setNotes] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [image, setImage] = useState<string>(""); // temporärer Picker-Pfad, bis savePerson() kopiert
  const [galaryImages, setGalaryImages] = useState<GalaryImages[]>([]); // volle, bereits kopierte Pfade
  const router = useRouter();

  function cleanupAndGoBack() {
    for (const item of galaryImages) {
      try {
        new File(item.uri).delete();
      } catch (e) {
        console.log("Datei existierte schon nicht mehr:", item.uri);
      }
    }
    router.back();
  }

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

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 1,
      });
    } catch (e) {
      Alert.alert(
        "Fehler beim Laden",
        "Ein oder mehrere Elemente konnten nicht geladen werden. Bitte erneut versuchen.",
      );
      return;
    }

    if (result.canceled) return;

    // Sofort kopieren (vermeidet den PHPhotosErrorDomain-Bug bei später Nutzung alter Picker-Referenzen).
    // Da es hier noch keine personId gibt (Person existiert erst nach dem Speichern),
    // nutzen wir einen Platzhalter (0) im Dateinamen - eindeutig ist er wegen Date.now() trotzdem.
    const copiedAssets: GalaryImages[] = [];
    for (let i = 0; i < result.assets.length; i++) {
      try {
        const filename = await saveImagePermanently(result.assets[i].uri, Date.now() + i, i);
        copiedAssets.push({ ...result.assets[i], uri: getFullImagePath(filename), pos: i });
      } catch (e) {
        console.log("Konnte Datei nicht kopieren, überspringe:", result.assets[i].uri, e);
      }
    }

    setGalaryImages((prev) => [...prev, ...copiedAssets]);
  };

  function removeGalaryImage(index: number) {
    const item = galaryImages[index];

    try {
      new File(item.uri).delete();
    } catch (e) {
      console.log("Datei existierte schon nicht mehr:", item.uri);
    }

    setGalaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePerson() {
    if (!name.trim()) return;
    const result = await db.runAsync(
      "INSERT INTO persons (name, info, main_img, created_at, usernames) VALUES (?, ?, ?, ?, ?)",
      [name, notes, "", new Date().toISOString(), usernames],
    );

    const personId = result.lastInsertRowId;

    // Hauptbild dauerhaft kopieren, Dateiname (nicht voller Pfad!) in der DB speichern
    if (image) {
      const filename = await saveImagePermanently(image, personId, 0);
      await db.runAsync("UPDATE persons SET main_img = ? WHERE id = ?", [filename, personId]);
    }

    // Galerie-Bilder wurden schon beim Auswählen kopiert (galaryImages enthält volle Pfade) ->
    // hier nur noch Dateinamen extrahieren und in photos eintragen
    for (const [index, item] of galaryImages.entries()) {
      const filename = getFilenameFromPath(item.uri);
      await db.runAsync("INSERT INTO photos (person_id, file_path, position) VALUES (?, ?, ?)", [
        personId,
        filename,
        index,
      ]);
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
          <Pressable onPress={cleanupAndGoBack} style={{ width: 24, height: 24 }}>
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
