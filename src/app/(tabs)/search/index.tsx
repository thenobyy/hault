import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFullImagePath } from "@/components/utils";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../../../../db/database";

type User = {
  id: number;
  name: string;
  info: string;
  main_img: string;
  created_at: string;
};

export default function SearchIndex() {
  const [allUsers, setAllUsers] = useState<User[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchAllUsers = useCallback(async () => {
    const users = await db.getAllAsync<User>(`SELECT * FROM persons ORDER BY created_at DESC`);
    setAllUsers(users);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllUsers();
    }, [fetchAllUsers]),
  );

  const filteredUsers = useMemo(() => {
    if (!allUsers) return allUsers;
    if (!searchQuery.trim()) return allUsers;

    const query = searchQuery.trim().toLowerCase();
    return allUsers.filter((user) => user.name?.toLowerCase().includes(query));
  }, [allUsers, searchQuery]);

  const hasAnyPersons = allUsers && allUsers.length > 0;
  const hasSearchResults = filteredUsers && filteredUsers.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <ThemedView style={{ flex: 1, paddingTop: 70 }}>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Suchen..."
        onChangeText={(e) => setSearchQuery(e.nativeEvent.text)}
      />

      {hasSearchResults ? (
        <FlatList
          data={filteredUsers}
          style={{ height: "100%", width: "100%" }}
          numColumns={3}
          keyExtractor={(user) => user.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={{ width: "33.33%", aspectRatio: 1 / 1 }}
              onPress={() => router.navigate({ pathname: "/persons/[id]", params: { id: item.id } })}
            >
              <ImageBackground source={getFullImagePath(item.main_img)} contentFit="cover" style={{ width: "100%" }}>
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
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <ThemedText type="subtitle">{isSearching ? "Keine Treffer" : "Keine Einträge"}</ThemedText>
          {isSearching && (
            <ThemedText type="default" style={{ color: "#888" }}>
              Niemand mit "{searchQuery}" gefunden
            </ThemedText>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    gap: 20,
  },
});
