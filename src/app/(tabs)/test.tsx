import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import "../../../global.css";

export default function ImagePickerExample() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setCamaraActiv] = useState(false);
  const [productInfo, setProductInfo] = useState();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function fetchProductData(ean: string) {
    const req = await fetch(`https://world.openfoodfacts.net/api/v2/product/${ean}?fields=ingredients`, {
      method: "POST",
      headers: {
        "User-Agent": "TestAppForNewProject/0.1 (mail@richlack-webdesign.de)",
      },
    });
    const result = await req.json();
    console.log(result.product.ingredients[0].vegan);
    setProductInfo(result);
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.viewContainer}>
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing={facing}
            ratio="1:1"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8"],
            }}
            onBarcodeScanned={(response) => {
              fetchProductData(response.data);
              console.log(response.data);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCamaraActiv(false);
              CameraView.dismissScanner();
            }}
          />
        )}
        <View>
          <ThemedText>Vegan: {productInfo?.product.ingredients[0].vegan}</ThemedText>
        </View>
        <Button title="Scanner öffnen" onPress={() => setCamaraActiv(true)} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  viewContainer: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    height: "80%",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
