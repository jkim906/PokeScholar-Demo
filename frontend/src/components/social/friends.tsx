import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFriendsStore } from "../../stores/friendsStore";
import { useAuth } from "@clerk/clerk-expo";
import ProfileModal from "./ProfileModal";
import { Friend } from "../../api/friendsHandler";
import { useFocusEffect } from "@react-navigation/native";

export default function Friends() {
  const { isSignedIn, userId } = useAuth();
  const {
    friends,
    isLoading,
    error,
    removeFriend,
    sendFriendRequest,
    sendGift,
    canSendGift,
    loadFriends,
  } = useFriendsStore();
  const [searchInput, setSearchInput] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [giftStatus, setGiftStatus] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>(
    {}
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Refresh friends list whenever the component comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshFriends = async () => {
        if (userId) {
          console.log("Friends component focused, refreshing friends list");
          await loadFriends(userId);
        }
      };

      refreshFriends();

      return () => {
        // Clean up if needed
      };
    }, [userId, loadFriends])
  );

  // Check gift status for each friend
  useEffect(() => {
    const checkGiftStatus = async () => {
      if (!userId) return;
      const status: Record<string, boolean> = {};
      for (const friend of friends) {
        try {
          const canSend = await canSendGift(userId, friend._id);
          status[friend._id] = canSend;
        } catch (error) {
          console.error(
            `Error checking gift status for friend ${friend._id}:`,
            error
          );
          status[friend._id] = false;
        }
      }
      setGiftStatus(status);
    };
    checkGiftStatus();
  }, [userId, friends, canSendGift]);

  useEffect(() => {
    console.log("Friends component state:", {
      isSignedIn,
      userId,
      friendsCount: friends.length,
      isLoading,
      error,
    });
  }, [isSignedIn, userId, friends, isLoading, error]);

  const handleRemoveFriend = async (friendId: string) => {
    if (!userId) return;

    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(userId, friendId);
            } catch (error) {
              Alert.alert("Error", "Failed to remove friend");
            }
          },
        },
      ]
    );
  };

  const handleAddFriend = async () => {
    if (!userId) {
      Alert.alert("Error", "You must be signed in to add friends");
      return;
    }

    if (!searchInput.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    try {
      await sendFriendRequest(userId, searchInput);
      Alert.alert("Success", `Friend request sent to ${searchInput}`);
      setSearchInput("");
    } catch (error) {
      console.error("Error sending friend request:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send friend request";
      Alert.alert("Error", errorMessage);
      setSearchInput("");
    }
  };

  const handleProfilePress = (friend: Friend) => {
    setIsLoadingProfile(true);
    setSelectedFriend(friend);
    setIsProfileModalVisible(true);
    setIsLoadingProfile(false);
  };

  const handleSendGift = async (friendId: string) => {
    if (!userId) return;

    try {
      await sendGift(userId, friendId);
      Alert.alert("Success", "Gift sent successfully!");
      // Update gift status for this friend
      setGiftStatus((prev) => ({ ...prev, [friendId]: false }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send gift";
      Alert.alert("Error", errorMessage);
    }
  };

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to view your friends</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Add Friends Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search for friends to add..."
            style={styles.searchInput}
            placeholderTextColor="#666"
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
            <Ionicons name="person-add" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : friends.length === 0 ? (
        <Text style={styles.message}>No friends yet. Start adding some!</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            // Create handlers with closure over the specific item
            const handleItemPress = () => handleProfilePress(item);
            const handleGiftPress = () => {
              if (giftStatus[item._id]) {
                handleSendGift(item._id);
              }
            };
            const handleDeletePress = () => handleRemoveFriend(item._id);

            return (
              <View style={styles.friendItem}>
                {/* Friend info area - clickable */}
                <TouchableOpacity
                  style={[styles.friendInfo, { flex: 1 }]}
                  onPress={handleItemPress}
                  activeOpacity={0.7}
                >
                  {item.profileImage && !imageErrorMap[item._id] ? (
                    <Image
                      source={{ uri: item.profileImage }}
                      style={styles.profileImage}
                      onError={() =>
                        setImageErrorMap((prev) => ({
                          ...prev,
                          [item._id]: true,
                        }))
                      }
                    />
                  ) : (
                    <Ionicons
                      name="person-circle"
                      size={40}
                      style={[styles.icon, { color: "#2196F3" }]}
                    />
                  )}

                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{item.username}</Text>
                    <Text style={styles.friendLevel}>Level {item.level}</Text>
                  </View>
                </TouchableOpacity>

                {/* Actions area - not part of the clickable friend area */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.giftButton,
                      !giftStatus[item._id] && styles.giftButtonDisabled,
                    ]}
                    onPress={handleGiftPress}
                    disabled={!giftStatus[item._id]}
                  >
                    <Ionicons
                      name="gift-outline"
                      size={20}
                      color={giftStatus[item._id] ? "#007BFF" : "#999"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleDeletePress}
                  >
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <ProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        friend={selectedFriend}
      />
      {isLoadingProfile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
  },
  searchContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
    color: "#666",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  friendLevel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  giftButton: {
    padding: 8,
  },
  giftButtonDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
