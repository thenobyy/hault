import { Button, Dimensions, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { db } from "../../db/database";

type User = {
  id: number;
  name: string;
  info: string;
  created_at: string;
};

export default function HomeScreen() {
  const [allUsers, setAllUsers] = useState<User[]>();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAllUsers = useCallback(async () => {
    const users = await db.getAllAsync<User>(`SELECT * FROM persons`);
    setAllUsers(users);
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllUsers();
    setRefreshing(false);
  }, [fetchAllUsers]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15 }}>
          <ThemedText type="subtitle" style={{}}>
            Alle
          </ThemedText>
          <Button title="+" onPress={() => router.navigate("/new_person")} />
        </View>
        <ThemedView style={styles.heroSection}>
          <FlatList
            data={allUsers}
            style={{ height: "100%", width: "100%" }}
            numColumns={3}
            keyExtractor={(user) => user.id.toString()}
            renderItem={({ item }) => (
              <Link href="/new_person" style={{ width: "33%", aspectRatio: 1 / 1 }}>
                <ImageBackground source={item.info} contentFit="cover" style={{ width: "100%" }}>
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
              </Link>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
          {/* {allUsers &&
            allUsers.map((user) => (
              <Link key={user.id} href="/new_person">
              <View style={{ borderWidth: 1, borderColor: "pink", padding: 5 }}>
              <ThemedText type="code">{user.name}</ThemedText>
                  <Image source={{ uri: user.info }} style={styles.image} />
                </View>
              </Link>
            ))} */}
        </ThemedView>

        {Platform.OS === "web" && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    gap: Spacing.one,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    flex: 3,
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  title: {
    textAlign: "center",
  },
  code: {
    textTransform: "uppercase",
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: "stretch",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  image: {
    width: Dimensions.get("screen").width / 3 - 13,
    height: Dimensions.get("screen").width / 3 - 13,
  },
});
