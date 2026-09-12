import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useMemo, useRef, useState } from "react";
import { Dimensions, Image, Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

type Rect = { x: number; y: number; width: number; height: number };
type Corner = "tl" | "tr" | "bl" | "br" | "move";

const MIN_SIZE = 40;

export default function ImageCropper({
  visible,
  uri,
  onCancel,
  onDone,
}: {
  visible: boolean;
  uri: string;
  onCancel: () => void;
  onDone: (newUri: string) => void;
}) {
  const screen = Dimensions.get("window");
  const containerWidth = screen.width;
  const containerHeight = screen.height * 0.65;

  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const displaySizeRef = useRef(displaySize);
  displaySizeRef.current = displaySize;

  const [rect, setRectState] = useState<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const rectRef = useRef<Rect>(rect);
  const startRect = useRef<Rect>({ x: 0, y: 0, width: 0, height: 0 });

  function setRect(next: Rect) {
    rectRef.current = next;
    setRectState(next);
  }

  useMemo(() => {
    if (!uri) return;
    Image.getSize(uri, (w, h) => {
      setNaturalSize({ width: w, height: h });
      const ratio = Math.min(containerWidth / w, containerHeight / h);
      const dispW = w * ratio;
      const dispH = h * ratio;
      setDisplaySize({ width: dispW, height: dispH });
      setRect({ x: 0, y: 0, width: dispW, height: dispH });
    });
  }, [uri]);

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  function makeResponder(corner: Corner) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRect.current = { ...rectRef.current };
      },
      onPanResponderMove: (_evt, gesture) => {
        const s = startRect.current;
        const { dx, dy } = gesture;
        const ds = displaySizeRef.current;
        let next: Rect = { ...s };

        if (corner === "move") {
          next.x = clamp(s.x + dx, 0, ds.width - s.width);
          next.y = clamp(s.y + dy, 0, ds.height - s.height);
        } else {
          if (corner === "tl" || corner === "bl") {
            const newX = clamp(s.x + dx, 0, s.x + s.width - MIN_SIZE);
            next.width = s.width - (newX - s.x);
            next.x = newX;
          }
          if (corner === "tr" || corner === "br") {
            next.width = clamp(s.width + dx, MIN_SIZE, ds.width - s.x);
          }
          if (corner === "tl" || corner === "tr") {
            const newY = clamp(s.y + dy, 0, s.y + s.height - MIN_SIZE);
            next.height = s.height - (newY - s.y);
            next.y = newY;
          }
          if (corner === "bl" || corner === "br") {
            next.height = clamp(s.height + dy, MIN_SIZE, ds.height - s.y);
          }
        }

        setRect(next);
      },
    });
  }

  const respondersRef = useRef({
    tl: makeResponder("tl"),
    tr: makeResponder("tr"),
    bl: makeResponder("bl"),
    br: makeResponder("br"),
    move: makeResponder("move"),
  });
  const responders = respondersRef.current;

  async function confirmCrop() {
    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    const cropRect = {
      originX: Math.round(rect.x * scaleX),
      originY: Math.round(rect.y * scaleY),
      width: Math.round(rect.width * scaleX),
      height: Math.round(rect.height * scaleY),
    };

    const context = ImageManipulator.manipulate(uri);
    context.crop(cropRect);
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.PNG });

    onDone(result.uri);
  }

  const handleStyle = (x: number, y: number) => ({
    position: "absolute" as const,
    left: x - 14,
    top: y - 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#3478F6",
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={{ width: displaySize.width, height: displaySize.height }}>
          <Image source={{ uri }} style={{ width: displaySize.width, height: displaySize.height }} />

          <View
            {...responders.move.panHandlers}
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderWidth: 2,
              borderColor: "white",
            }}
          />

          <View {...responders.tl.panHandlers} style={handleStyle(rect.x, rect.y)} />
          <View {...responders.tr.panHandlers} style={handleStyle(rect.x + rect.width, rect.y)} />
          <View {...responders.bl.panHandlers} style={handleStyle(rect.x, rect.y + rect.height)} />
          <View {...responders.br.panHandlers} style={handleStyle(rect.x + rect.width, rect.y + rect.height)} />
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={onCancel} style={styles.button}>
            <Text style={{ color: "white" }}>Abbrechen</Text>
          </Pressable>
          <Pressable onPress={confirmCrop} style={[styles.button, { backgroundColor: "#3478F6" }]}>
            <Text style={{ color: "white" }}>Fertig</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" },
  buttonRow: { flexDirection: "row", gap: 20, marginTop: 30 },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: "#333" },
});
