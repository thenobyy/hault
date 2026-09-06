import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { File, Paths } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Button, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../db/database";

type User = {
  id: number;
  name: string;
  info: string;
  main_img: string;
  created_at: string;
  usernames: string;
  notes: string;
};

export default function Persons() {
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [notes, setNotes] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editable, setEditable] = useState(false);
  const [isPresented, setIsPresented] = useState(false);

  const [image, setImage] = useState<string>("");
  const [galaryImages, setGalaryImages] = useState<ImagePickerAsset[]>([]);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  async function getPersonData() {
    const result = await db.getFirstAsync<User>("SELECT * FROM persons WHERE id = ?", [id as string]);
    if (result) {
      setImage(result.main_img);
      setName(result.name);
      setUsernames(result.usernames);
      setNotes(result.info);
    }

    const galary = await db.getAllAsync<{ id: number; person_id: number; file_path: string }>(
      "SELECT * FROM photos WHERE person_id = ?",
      [id as string],
    );
    if (galary) {
      console.log(galary.length);
      setGalaryImages(galary.map((g) => ({ uri: g.file_path }) as ImagePickerAsset));
    }
  }

  useEffect(() => {
    getPersonData();
  }, [getPersonData]);

  async function saveImagePermanently(tempUri: string, personId: number, index: number) {
    const filename = `${personId}_${Date.now()}_${index}.jpg`;
    const sourceFile = new File(tempUri);
    const destFile = new File(Paths.document, filename);

    sourceFile.copy(destFile);
    return destFile.uri;
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

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    console.log(result?.assets);

    if (!result.canceled) {
      let tempImagesArray = [];
      for (let i = 0; i < result.assets.length; i++) {
        tempImagesArray.push(result.assets[i].uri);
      }
      setGalaryImages([...galaryImages, ...result.assets]);
    }
  };

  function removeGalaryImage(index: number) {
    setGalaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePerson() {
    if (!name.trim()) return;
    const result = await db.runAsync(
      "UPDATE persons SET name = ?, info = ?, main_img = ?, created_at = ?, usernames = ? WHERE id = ?",
      [name, notes, image, new Date().toISOString(), usernames, id as string],
    );

    const personId = result.lastInsertRowId;

    if (image) {
      const permanentMainImg = await saveImagePermanently(image, personId, 0);
      await db.runAsync("UPDATE persons SET main_img = ? WHERE id = ?", [permanentMainImg, personId]);
    }

    for (let i = 0; i < galaryImages.length; i++) {
      const permanentPath = await saveImagePermanently(galaryImages[i].uri, personId, i + 1);
      await db.runAsync("INSERT INTO photos (person_id, file_path) VALUES (?, ?)", [personId, permanentPath]);
    }
  }

  async function deletePerson() {
    Alert.alert("Bist du dir sicher?", "Das löschen ist unwiderruflich", [
      {
        text: "Abbrechen",
        style: "cancel",
      },
      {
        text: "Löschen",
        onPress: async () => {
          const person = await db.getFirstAsync<{ main_img: string }>("SELECT main_img FROM persons WHERE id = ?", [
            id as string,
          ]);
          const photos = await db.getAllAsync<{ file_path: string }>(
            "SELECT file_path FROM photos WHERE person_id = ?",
            [id as string],
          );

          const allPaths = [person?.main_img, ...photos.map((p) => p.file_path)].filter(Boolean) as string[];

          for (const path of allPaths) {
            try {
              new File(path).delete();
            } catch (e) {
              console.log("Datei existierte schon nicht mehr:", path);
            }
          }

          await db.runAsync("DELETE FROM persons WHERE id = ?", [id as string]);
          router.back();
        },
      },
    ]);
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
        {!editable ? (
          <Button title="Bearbeiten" onPress={() => setEditable(true)} />
        ) : (
          <View>
            <Button
              title="Abbrechen"
              onPress={() => {
                setEditable(false);
                getPersonData();
              }}
            />
            <Button
              title="Speichern"
              onPress={() => {
                savePerson();
                setEditable(false);
              }}
            />
          </View>
        )}
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
              disabled={!editable}
            >
              <ImageBackground src={image} style={{ height: "100%" }}></ImageBackground>
            </Pressable>
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Name</ThemedText>
            <TextInput
              placeholder="Name"
              onChangeText={setName}
              style={styles.input}
              value={name}
              editable={editable}
            />
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Benutzernamen</ThemedText>
            <TextInput
              placeholder="Benutzernamen"
              onChangeText={setUsernames}
              style={styles.input}
              value={usernames}
              editable={editable}
            />
          </View>
          <View style={{ width: "100%", gap: 6 }}>
            <ThemedText type="default">Notizen</ThemedText>
            <TextInput
              placeholder="Notizen"
              onChangeText={setNotes}
              style={styles.input}
              multiline
              numberOfLines={4}
              editable={editable}
              value={notes}
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

                    {editable && (
                      <Pressable
                        onPress={() => removeGalaryImage(index)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          backgroundColor: "black",
                          borderRadius: 12,
                        }}
                      >
                        <X size={16} color="white" />
                      </Pressable>
                    )}
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
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: "red",
              borderRadius: 25,
              paddingVertical: 20,
              paddingHorizontal: 10,
              marginTop: 35,
            }}
            onPress={() => deletePerson()}
          >
            <Trash size={24} color="white" />
            <ThemedText>Löschen</ThemedText>
          </Pressable>
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
