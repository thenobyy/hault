import ImageCropper from "@/components/image-cropper";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFilenameFromPath, getFullImagePath, saveImagePermanently } from "@/components/utils";
import * as Sentry from "@sentry/react-native";
import { BlurView } from "expo-blur";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Crop, RotateCcw, Share, Trash, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Button, ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";
import ImageView from "react-native-image-viewing";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../../db/database";

type User = {
  id: number;
  name: string;
  info: string;
  main_img: string;
  created_at: string;
  usernames: string;
  notes: string;
};

interface GalaryImages extends ImagePickerAsset {
  pos: number;
  dbId?: number;
}

export default function Persons() {
  const [name, setName] = useState("");
  const [usernames, setUsernames] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isMainVisible, setIsMainVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editable, setEditable] = useState(false);
  const [isPresented, setIsPresented] = useState(false);
  const [isPending, setPending] = useState(false);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);

  const [image, setImage] = useState<string>("");
  const [mainImageView, setMainImageView] = useState<GalaryImages[]>([]);
  const [galaryImages, setGalaryImages] = useState<GalaryImages[]>([]);
  const [originalGalaryImages, setOriginalGalaryImages] = useState<GalaryImages[]>([]);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  async function getPersonData() {
    const result = await db.getFirstAsync<User>("SELECT * FROM persons WHERE id = ?", [id as string]);
    if (result) {
      setImage(getFullImagePath(result.main_img));
      setName(result.name);
      setUsernames(result.usernames);
      setNotes(result.info);
      const [date, _time] = result.created_at.split("T");
      const [sek, min, h] = date.split("-");
      setDate(h + "." + min + "." + sek);
    }
    if (result?.main_img) {
      const mimg = [{ uri: getFullImagePath(result.main_img) }];
      const mimgis = mimg.map(
        (image) =>
          ({
            uri: image.uri,
          }) as GalaryImages,
      );

      setMainImageView(mimgis);
    }

    const galary = await db.getAllAsync<{ id: number; person_id: number; file_path: string; position: number }>(
      "SELECT * FROM photos WHERE person_id = ? ORDER BY position ASC",
      [id as string],
    );
    if (galary) {
      const fullPathImages = galary.map(
        (g) =>
          ({
            uri: getFullImagePath(g.file_path),
            fileName: g.file_path,
            pos: g.position,
            dbId: g.id,
          }) as GalaryImages,
      );
      setGalaryImages(fullPathImages);
      setOriginalGalaryImages(fullPathImages);
    }
  }

  useEffect(() => {
    getPersonData();
  }, [id]);

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
      Sentry.captureException(e);
      return;
    }

    if (result.canceled) return;

    const copiedAssets: GalaryImages[] = [];

    for (let i = 0; i < result.assets.length; i++) {
      try {
        const filename = await saveImagePermanently(result.assets[i].uri, Number(id), Date.now() + i);
        copiedAssets.push({ ...result.assets[i], uri: getFullImagePath(filename), pos: i });
      } catch (e) {
        console.log("Konnte Datei nicht kopieren, überspringe:", result.assets[i].uri, e);
        Sentry.captureException(e);
      }
    }

    setGalaryImages((prev) => [...prev, ...copiedAssets]);
  };

  function removeGalaryImage(index: number) {
    setGalaryImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePerson() {
    if (!name.trim()) return;
    const personId = id as string;

    const current = await db.getFirstAsync<{ main_img: string }>("SELECT main_img FROM persons WHERE id = ?", [
      personId,
    ]);
    const oldMainImgFilename = current?.main_img;

    const isNewMainImg = image && !image.startsWith(Paths.document.uri);
    let finalMainImgFilename: string;

    if (isNewMainImg) {
      finalMainImgFilename = await saveImagePermanently(image, Number(personId), 0);
      console.log(finalMainImgFilename);

      if (oldMainImgFilename && oldMainImgFilename !== finalMainImgFilename) {
        try {
          new File(getFullImagePath(oldMainImgFilename)).delete();
        } catch (e) {
          console.log("Altes Profilbild existierte schon nicht mehr:", oldMainImgFilename);
          Sentry.captureException(e);
        }
      }
    } else {
      finalMainImgFilename = getFilenameFromPath(image);
    }

    await db.runAsync("UPDATE persons SET name = ?, info = ?, main_img = ?, usernames = ? WHERE id = ?", [
      name,
      notes,
      finalMainImgFilename,
      usernames,
      personId,
    ]);

    // Galerie: Bilder, die im Ausgangszustand da waren, jetzt aber nicht mehr in
    // galaryImages stehen, wurden während der Bearbeitung entfernt -> jetzt final löschen
    const originalPaths = originalGalaryImages.map((g) => g.uri);
    const currentPaths = galaryImages.map((g) => g.uri);
    const removedDuringEdit = originalPaths.filter((p) => !currentPaths.includes(p));

    for (const path of removedDuringEdit) {
      try {
        new File(path).delete();
      } catch (e) {
        console.log("Datei existierte schon nicht mehr:", path);
        Sentry.captureException(e);
      }
    }

    await db.runAsync("DELETE FROM photos WHERE person_id = ?", [personId]);

    for (const [index, item] of galaryImages.entries()) {
      const filename = getFilenameFromPath(item.uri);
      await db.runAsync("INSERT INTO photos (person_id, file_path, position) VALUES (?, ?, ?)", [
        personId,
        filename,
        index,
      ]);
    }

    await getPersonData();
  }

  // Neu hinzugefügte (aber nie gespeicherte) Galerie-Bilder werden gelöscht,
  // der Rest bleibt unangetastet - dann wird der alte DB-Stand neu geladen.
  async function cancelEditing() {
    const originalPaths = originalGalaryImages.map((g) => g.uri);
    const addedDuringEdit = galaryImages.filter((g) => !originalPaths.includes(g.uri));

    for (const item of addedDuringEdit) {
      try {
        new File(item.uri).delete();
      } catch (e) {
        console.log("Konnte neu kopierte Datei nicht löschen:", item.uri);
        Sentry.captureException(e);
      }
    }

    setEditable(false);
    await getPersonData();
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

          const allFilenames = [person?.main_img, ...photos.map((p) => p.file_path)].filter(Boolean) as string[];

          for (const filename of allFilenames) {
            try {
              new File(getFullImagePath(filename)).delete();
            } catch (e) {
              console.log("Datei existierte schon nicht mehr:", filename);
              Sentry.captureException(e);
            }
          }

          await db.runAsync("DELETE FROM persons WHERE id = ?", [id as string]);
          router.back();
        },
      },
    ]);
  }

  async function rotate90(index: number) {
    if (isPending) return;
    setPending(true);

    const personId = id as string;
    const item = galaryImages[index];
    const uri = item.uri;

    try {
      const context = ImageManipulator.manipulate(uri);
      context.rotate(90);
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ format: SaveFormat.PNG });

      const newFileName = await saveImagePermanently(result.uri, Number(personId), index);

      // Nur wenn das Bild schon gespeichert ist (dbId vorhanden), die DB aktualisieren.
      // Frisch hinzugefügte, noch ungespeicherte Bilder existieren noch nicht in "photos"
      // und werden erst bei savePerson() ganz normal mit dem (bereits gedrehten) Pfad eingetragen.
      if (item.dbId) {
        db.runSync("UPDATE photos SET file_path = ? WHERE id = ?", [newFileName, item.dbId]);
      }

      const updated = [...galaryImages];
      updated[index] = { ...item, uri: getFullImagePath(newFileName) };
      setGalaryImages(updated);

      try {
        new File(uri).delete();
      } catch (e) {
        console.log("Alte Bildversion existierte schon nicht mehr:", uri);
        Sentry.captureException(e);
      }
    } finally {
      setPending(false); // läuft jetzt IMMER, auch falls oben was fehlschlägt
    }
  }

  async function handleCropDone(newUri: string) {
    if (croppingIndex === null) return;
    const personId = id as string;
    const item = galaryImages[croppingIndex];
    const oldUri = item.uri;

    const newFileName = await saveImagePermanently(newUri, Number(personId), croppingIndex);

    if (item.dbId) {
      db.runSync("UPDATE photos SET file_path = ? WHERE id = ?", [newFileName, item.dbId]);
    }

    const updated = [...galaryImages];
    updated[croppingIndex] = { ...item, uri: getFullImagePath(newFileName) };
    setGalaryImages(updated);

    try {
      new File(oldUri).delete();
    } catch (e) {
      console.log("Alte Bildversion existierte schon nicht mehr:", oldUri);
      Sentry.captureException(e);
    }

    setCroppingIndex(null);
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
          {!editable ? (
            <Button
              title="Bearbeiten"
              onPress={() => {
                setOriginalGalaryImages(galaryImages);
                setEditable(true);
              }}
            />
          ) : (
            <View style={{ flexDirection: "row" }}>
              <Button title="Abbrechen" onPress={cancelEditing} />
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
      </BlurView>

      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={{ flex: 1, alignItems: "center", width: "100%", paddingTop: 110 }}
      >
        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, gap: 12 }} bottomOffset={40}>
          <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
            <Pressable
              onPress={() => {
                {
                  editable ? pickImage() : setIsMainVisible(true);
                }
              }}
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
                {editable && (
                  <Pressable onPress={() => pickGalaryImages()} style={{ width: 24, height: 24 }}>
                    <X size={24} color="blue" />
                  </Pressable>
                )}
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
              disabled={!editable}
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
            </Pressable>
            <ImageView
              images={mainImageView}
              imageIndex={0}
              visible={isMainVisible}
              onRequestClose={() => setIsMainVisible(false)}
              HeaderComponent={(index) => {
                return (
                  <View
                    style={{
                      paddingTop: 60,
                      paddingBottom: 10,
                      paddingHorizontal: 20,
                      backgroundColor: "#00000060",
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Pressable onPress={() => setIsMainVisible(false)} style={{ padding: 10 }}>
                      <X size={24} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => Sharing.shareAsync(galaryImages[index.imageIndex].uri)}
                      style={{ padding: 10 }}
                    >
                      <Share size={24} color="white" />
                    </Pressable>
                  </View>
                );
              }}
            />
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
                      paddingHorizontal: 20,
                      backgroundColor: "#00000060",
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Pressable onPress={() => setIsVisible(false)} style={{ padding: 10 }}>
                      <X size={24} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setIsVisible(false); // Viewer-Modal schließen...
                        setCroppingIndex(index.imageIndex); // ...bevor der Cropper-Modal aufgeht
                      }}
                      style={{ padding: 10 }}
                    >
                      <Crop size={24} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={async () => await rotate90(index.imageIndex)}
                      style={{ padding: 10 }}
                      disabled={isPending}
                    >
                      <RotateCcw size={24} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => Sharing.shareAsync(galaryImages[index.imageIndex].uri)}
                      style={{ padding: 10 }}
                    >
                      <Share size={24} color="white" />
                    </Pressable>

                    {editable && (
                      <Pressable
                        onPress={() => {
                          removeGalaryImage(index.imageIndex);
                          if (galaryImages.length <= 1) setIsVisible(false);
                        }}
                        style={{ padding: 10 }}
                      >
                        <Trash size={24} color="white" />
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
            <ImageCropper
              visible={croppingIndex !== null}
              uri={croppingIndex !== null ? galaryImages[croppingIndex].uri : ""}
              onCancel={() => setCroppingIndex(null)}
              onDone={handleCropDone}
            />
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
          <ThemedText type="small" style={{ paddingTop: 25, textAlign: "right", color: "#727272" }}>
            Erstellt am: {date}
          </ThemedText>
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
