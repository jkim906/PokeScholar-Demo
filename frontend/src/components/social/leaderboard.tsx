import React, { useState, useEffect } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { useUser } from "@clerk/clerk-react";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchUserLeaderboard,
  LeaderboardItem,
  fetchUserData,
  fetchUserCardDisplay,
} from "../../api/userHandler";
import ProfileModal from "./ProfileModal";

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<"session" | "point">(
    "session"
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [fadeAnim] = useState(new Animated.Value(0));
  const API_BASE_URL = "http://localhost:3000";
  const [selectedUser, setSelectedUser] = useState<LeaderboardItem | null>(
    null
  );
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch leaderboard data when component mounts or leaderboardType changes
  useEffect(() => {
    fetchLeaderboardData();
  }, [leaderboardType]);

  useEffect(() => {
    if (!loading && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error]);

  const fetchLeaderboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    fadeAnim.setValue(0);

    try {
      const response = await fetchUserLeaderboard(user.id, leaderboardType);
      if (response.length === 0) {
        throw new Error("Failed to fetch leaderboard data");
      }
      setLeaderboardData(response);
    } catch (err) {
      console.error("Failed to fetch leaderboard data:", err);
      setError("Could not load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  const constructAvatarUrl = (avatar: string): string => {
    if (!avatar) return "";
    // Check if the avatar URL is valid
    if (avatar.startsWith("/profile")) {
      return `${API_BASE_URL}${avatar}`;
    } else return "";
  };

  const handleProfilePress = async (item: LeaderboardItem) => {
    setIsLoadingProfile(true);
    try {
      const [userData, cardDisplay] = await Promise.all([
        fetchUserData(item.id),
        fetchUserCardDisplay(item.id),
      ]);

      if (userData) {
        setSelectedUser({
          ...item,
          level: userData.level,
          coins: userData.coins,
          experience: userData.experience,
          cardDisplay: cardDisplay.filter((id): id is string => id !== null),
        });
        setIsProfileModalVisible(true);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardItem;
    index: number;
  }) => {
    const isCurrentUser = user?.id === item.id;
    const medalIcon = getMedalIcon(index);

    return (
      <Animated.View
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          index < 3 && styles.topThreeItem,
          { opacity: fadeAnim },
          {
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Rank with Medal */}
        <View
          style={[styles.rankContainer, index < 3 && styles.topRankContainer]}
        >
          {medalIcon ? (
            <Text style={styles.medalText}>{medalIcon}</Text>
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>
        {/* User Image */}
        <TouchableOpacity
          style={[
            styles.userImageContainer,
            index < 3 && styles.topThreeImageContainer,
            isCurrentUser && styles.currentUserImageContainer,
          ]}
          onPress={() => handleProfilePress(item)}
        >
          {item.avatar &&
          constructAvatarUrl(item.avatar) &&
          !imageErrorMap[item.id] ? (
            <Image
              source={{ uri: constructAvatarUrl(item.avatar) }}
              style={styles.userImage}
              onError={(e) => {
                console.warn("Image load failed for:", item.avatar);
                setImageErrorMap((prev) => ({ ...prev, [item.id]: true }));
              }}
            />
          ) : (
            <Ionicons
              name="person-circle"
              size={40}
              style={[styles.icon, { color: "#2196F3" }]}
            />
          )}
        </TouchableOpacity>

        {/* User */}
        <TouchableOpacity
          style={styles.userContainer}
          onPress={() => handleProfilePress(item)}
        >
          <Text
            style={[
              styles.userName,
              isCurrentUser && styles.currentUserText,
              index === 0 && styles.firstPlaceText,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          {isCurrentUser && <Text style={styles.youLabel}>(You)</Text>}
        </TouchableOpacity>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreWithIconContainer}>
            <Text
              style={[
                styles.scoreText,
                index === 0 && styles.firstPlaceScore,
                index === 1 && styles.secondPlaceScore,
                index === 2 && styles.thirdPlaceScore,
              ]}
            >
              {item.score}
              {leaderboardType === "session" ? (
                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#95a5a6"
                  style={styles.scoreIcon}
                />
              ) : (
                <Ionicons
                  name="logo-usd"
                  size={15}
                  color="#f39c12"
                  style={styles.scoreIcon}
                />
              )}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with title and segment control */}
      <View style={styles.header}>
        <Text style={styles.title} testId="leaderboard-title">Leaderboard</Text>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              leaderboardType === "session" && styles.activeSegment,
            ]}
            onPress={() => setLeaderboardType("session")}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={leaderboardType === "session" ? "#ffffff" : "#666666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              leaderboardType === "point" && styles.activeSegment,
            ]}
            onPress={() => setLeaderboardType("point")}
          >
            <Ionicons
              name="logo-usd"
              size={18}
              color={leaderboardType === "point" ? "#ffffff" : "#666666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Leaderboard content */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchLeaderboardData}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : leaderboardData.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="logo-usd" size={60} color="#bdc3c7" />
          <Text style={styles.emptyText}>No users on the leaderboard yet</Text>
          <Text style={styles.emptySubText}>
            Complete study sessions to appear here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboardData}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        friend={
          selectedUser
            ? {
                _id: selectedUser.id,
                username: selectedUser.name,
                level: selectedUser.level || 1,
                coins: selectedUser.coins || 0,
                experience: selectedUser.experience || 0,
                cardDisplay: selectedUser.cardDisplay || [],
                profileImage: selectedUser.avatar || undefined,
              }
            : null
        }
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
  header: {
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  activeSegment: {
    backgroundColor: "#3498db",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    marginLeft: 4,
  },
  activeSegmentText: {
    color: "#ffffff",
  },
  trophyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  trophyIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  trophyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 10,
  },
  list: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  leaderboardItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  currentUserItem: {
    backgroundColor: "#e6f7ff",
    borderWidth: 1,
    borderColor: "#bde0fe",
  },
  topThreeItem: {
    marginVertical: 6,
    padding: 18,
  },
  topRankContainer: {
    width: 45,
  },
  rankContainer: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  medalText: {
    fontSize: 22,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  userContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 5,
  },
  userImageContainer: {
    marginRight: 10,
    height: 38,
    width: 38,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    justifyContent: "center",
    alignItems: "center",
  },
  topThreeImageContainer: {
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  currentUserImageContainer: {
    borderWidth: 2,
    borderColor: "#3498db",
  },
  userImage: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },
  userInitialContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#bdc3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  userName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  youLabel: {
    marginLeft: 5,
    fontSize: 13,
    fontStyle: "italic",
    color: "#3498db",
  },
  currentUserText: {
    fontWeight: "600",
  },
  firstPlaceText: {
    fontWeight: "bold",
    color: "#000",
  },
  scoreContainer: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3498db",
    marginRight: 8,
  },
  unitText: {
    fontSize: 13,
    fontWeight: "normal",
    color: "#95a5a6",
  },
  firstPlaceScore: {
    color: "#f39c12", // Gold
    fontSize: 18,
  },
  secondPlaceScore: {
    color: "#7f8c8d", // Silver
  },
  thirdPlaceScore: {
    color: "#e67e22", // Bronze
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
    marginTop: 8,
  },
  scoreWithIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  scoreIcon: {
    marginLeft: 2,
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
  icon: {
    marginRight: 0,
  },
});
