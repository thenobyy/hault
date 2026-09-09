import {
  Button,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFullImagePath } from "@/components/utils";
import { WebBadge } from "@/components/web-badge";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { db } from "../../../db/database";

type User = {
  id: number;
  name: string;
  info: string;
  main_img: string;
  created_at: string;
};

export default function HomeScreen() {
  const [allUsers, setAllUsers] = useState<User[]>();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAllUsers = useCallback(async () => {
    const users = await db.getAllAsync<User>(`SELECT * FROM persons ORDER BY created_at DESC`);
    setAllUsers(users);
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useFocusEffect(() => {
    fetchAllUsers();
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllUsers();
    setRefreshing(false);
  }, [fetchAllUsers]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 15,
          }}
        >
          <ThemedText type="subtitle" style={{}}>
            Alle
          </ThemedText>
          <Button title="+" onPress={() => router.navigate("/new_person")} />
        </View>
        <View style={styles.heroSection}>
          {allUsers && allUsers?.length > 0 ? (
            <FlatList
              data={allUsers}
              style={{ height: "100%", width: "100%" }}
              numColumns={3}
              keyExtractor={(user) => user.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={{ width: "33.33%", aspectRatio: 1 / 1 }}
                  onPress={() => router.navigate({ pathname: "/persons/[id]", params: { id: item.id } })}
                >
                  {/* <Link href="/new_person" style={{ width: "33%", aspectRatio: 1 / 1 }}> */}
                  <ImageBackground
                    source={getFullImagePath(item.main_img)}
                    contentFit="cover"
                    style={{ width: "100%" }}
                  >
                    <LinearGradient
                      colors={["#00000000", "#000000"]}
                      locations={[0.5, 1]}
                      style={{
                        height: "100%",
                        flexDirection: "column-reverse",
                        padding: 5,
                      }}
                    >
                      <Text style={{ color: "white" }}>{item.name}</Text>
                    </LinearGradient>
                  </ImageBackground>
                  {/* </Link> */}
                </Pressable>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                gap: 45,
              }}
            >
              <ThemedText type="subtitle">Keine Einträge</ThemedText>
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "blue",
                  borderRadius: 5,
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                }}
                onPress={() => {
                  router.navigate("/new_person");
                }}
              >
                <Plus size={20} color={"white"} strokeWidth={3} />
                <ThemedText type="default" style={{}}>
                  Neue Person
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
        {Platform.OS === "web" && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
  },
  heroSection: {
    flex: 3,
    flexDirection: "row",
    width: "100%",
  },
  title: {
    textAlign: "center",
  },
  image: {
    width: Dimensions.get("screen").width / 3,
    height: Dimensions.get("screen").width / 3,
  },
});
