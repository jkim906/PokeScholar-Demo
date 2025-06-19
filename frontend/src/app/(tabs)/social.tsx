import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Friends from "../../components/social/friends";
import MailPage from "../../components/social/mail";
import Leaderboard from "../../components/social/leaderboard";
import { Ionicons } from "@expo/vector-icons";
import { useFriendsStore } from "../../stores/friendsStore";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";

export default function Social() {
  const [activeTab, setActiveTab] = useState<
    "friends" | "mail" | "leaderboard"
  >("friends");
  const { userId } = useAuth();
  const { mail, loadMail } = useFriendsStore();

  // Refresh mail data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        if (userId) {
          console.log("Social screen focused, refreshing mail data");
          loadMail(userId);
        }
      };

      refreshData();

      // Optional: set up a refresh interval while the screen is focused
      const intervalId = setInterval(() => {
        if (userId) {
          loadMail(userId);
        }
      }, 30000); // Refresh every 30 seconds

      return () => {
        clearInterval(intervalId); // Clean up interval on blur
      };
    }, [userId, loadMail])
  );

  const mailCount = mail.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            testID="friends-tab"
            style={[styles.tab, activeTab === "friends" && styles.activeTab]}
            onPress={() => setActiveTab("friends")}
          >
            <Ionicons
              name="people"
              size={24}
              color={activeTab === "friends" ? "#fff" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            testID="leaderboard-tab"
            style={[
              styles.tab,
              activeTab === "leaderboard" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("leaderboard")}
          >
            <Ionicons
              name="trophy"
              size={24}
              color={activeTab === "leaderboard" ? "#fff" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            testID="mail-tab"
            style={[styles.tab, activeTab === "mail" && styles.activeTab]}
            onPress={() => setActiveTab("mail")}
          >
            <View style={styles.mailIconContainer}>
              <Ionicons
                name="mail"
                size={24}
                color={activeTab === "mail" ? "#fff" : "#666"}
              />
              {mailCount > 0 && (
                <View style={styles.badgeContainer} testID="mail-badge">
                  <Text style={styles.badgeText}>
                    {mailCount > 99 ? "99+" : mailCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {activeTab === "friends" && <Friends />}
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "mail" && <MailPage />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  contentContainer: {
    flex: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#007BFF",
  },
  mailIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
});
