import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFriendsStore } from "../../stores/friendsStore";
import { useAuth } from "@clerk/clerk-expo";
import { Mail } from "../../api/friendsHandler";

export default function MailPage() {
  const { isSignedIn, userId } = useAuth();
  const {
    mail,
    isLoading,
    error,
    loadMail,
    collectMail,
    acceptFriendRequest,
    declineFriendRequest,
    loadFriendsRequest,
  } = useFriendsStore();

  useEffect(() => {
    if (userId) {
      loadMail(userId);
      loadFriendsRequest(userId);
    }
  }, [userId]);

  const handleCollectGift = async (mailItem: Mail) => {
    if (!userId) return;

    try {
      await collectMail(mailItem._id, userId);
      Alert.alert(
        "Success",
        `Collected ${mailItem.amount} coins from ${mailItem.senderId.username}!`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to collect gift";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleAcceptRequest = async (username: string) => {
    if (!userId) return;
    try {
      await acceptFriendRequest(userId, username);
      Alert.alert("Success", `Friend request from ${username} accepted!`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to accept friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleDeclineRequest = async (username: string) => {
    if (!userId) return;
    try {
      await declineFriendRequest(userId, username);
      Alert.alert("Success", `Friend request from ${username} declined`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to decline friend request";
      Alert.alert("Error", errorMessage);
    }
  };

  const renderMailItem = ({ item }: { item: Mail }) => {
    if (item.type === "gift") {
      return (
        <View style={styles.mailItem}>
          <View style={styles.mailInfo}>
            <Ionicons
              name="gift"
              size={24}
              color="#007BFF"
              style={styles.icon}
            />
            <View style={styles.mailDetails}>
              <Text style={styles.senderName}>
                Gift from {item.senderId.username}
              </Text>
              <Text style={styles.amount}>{item.amount} coins</Text>
              <Text style={styles.date}>
                Received {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.collectButton}
            onPress={() => handleCollectGift(item)}
          >
            <Text style={styles.collectButtonText}>Collect</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === "friend_request") {
      return (
        <View style={styles.mailItem}>
          <View style={styles.mailInfo}>
            <Ionicons
              name="person-add"
              size={24}
              color="#2196F3"
              style={styles.icon}
            />
            <View style={styles.mailDetails}>
              <Text style={styles.senderName}>
                Friend Request from {item.senderId.username}
              </Text>
              <Text style={styles.date}>
                Received {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(item.senderId.username)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineRequest(item.senderId.username)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to view your mail</Text>
      </View>
    );
  }

  // Sort mail by date with newest first
  const sortedMail = [...mail].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Mail</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : mail.length === 0 ? (
        <Text style={styles.message}>No mail to collect</Text>
      ) : (
        <FlatList
          data={sortedMail}
          keyExtractor={(item) => item._id}
          renderItem={renderMailItem}
          contentContainerStyle={styles.mailList}
        />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  mailList: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  mailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  mailInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  mailDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  amount: {
    fontSize: 14,
    color: "#007BFF",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  collectButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  collectButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  requestButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#007BFF",
  },
  declineButton: {
    backgroundColor: "#f44336",
  },
});
