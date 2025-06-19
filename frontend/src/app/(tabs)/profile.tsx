import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SignOutButton } from "../../components/SignOutButton";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAppState } from "../../hooks/useAppState";
import { useCollectionStore } from "../../stores/collectionStore";
import { Card } from "../../types/Card";

/**
 * Profile Component
 *
 * Displays the user's profile information including:
 * - Profile picture and username
 * - Card display section with 3 slots for featured cards
 * - Study tracking graph
 * - Sign out functionality
 *
 * Features:
 * - Card selection modal with smooth animations
 * - Real-time card data fetching
 * - Interactive card slots
 * - Persistent card display saved to user profile
 *
 */

export default function Profile() {
  const navigation = useNavigation();
  const { userProfile, studyTracking, refreshAllData } = useAppState();
  const { userInfo, cardDisplay, updateProfile, updateCardDisplay } =
    userProfile;
  const {
    weeklyStats,
    isLoading: statsLoading,
    error: statsError,
  } = studyTracking;
  const { cards } = useCollectionStore();
  const API_BASE_URL = "http://localhost:3000";

  // State management
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showUsedCardsModal, setShowUsedCardsModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // Animation state for modal
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (showCardModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [showCardModal]);

  useEffect(() => {
    if (userInfo?.profileImage) {
      // Check if the profile image is a base64 string or a URL
      if (userInfo.profileImage.startsWith("data:")) {
        setProfileImage(userInfo.profileImage);
      } else {
        // If it's a URL, make sure it's a complete URL
        const imageUrl = userInfo.profileImage.startsWith("http")
          ? userInfo.profileImage
          : `${API_BASE_URL}${userInfo.profileImage}`;
        setProfileImage(imageUrl);
      }
    } else {
      // Set default image if no profile image is available
      setProfileImage(null);
    }
  }, [userInfo?.profileImage]);

  const handleCardPress = (index: number) => {
    setSelectedSlot(index);
    setShowCardModal(true);
  };

  const handleCardSelect = async (cardId: string) => {
    if (selectedSlot !== null && userInfo?._id) {
      try {
        const newSelectedCards = [...cardDisplay];
        newSelectedCards[selectedSlot] = cardId;
        console.log("Updated card display:", newSelectedCards);
        await updateCardDisplay(newSelectedCards.filter(Boolean) as string[]);
        setShowCardModal(false);
        setSelectedSlot(null);
      } catch (error) {
        console.error("Failed to update card display:", error);
      }
    }
  };

  const pickImage = async () => {
    if (userInfo?._id) {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          quality: 0.5,
          base64: true,
          aspect: [1, 1],
          exif: false,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          const base64Image = result.assets[0].base64;

          if (base64Image) {
            if (base64Image.length > 3000 * 1024) {
              Alert.alert(
                "Image Too Large",
                "Please select a smaller image or try a different photo.",
                [{ text: "OK" }]
              );
              return;
            }

            // Create the base64 data URL
            const base64DataUrl = `data:image/jpeg;base64,${base64Image}`;

            // Update profile with the new image
            const response = await updateProfile({
              profileImage: base64DataUrl,
            });
            await refreshAllData();
          }
        }
      } catch (error) {
        console.error("Error picking/uploading image:", error);
        Alert.alert(
          "Error",
          "Failed to update profile image. Please try again.",
          [{ text: "OK" }]
        );
        // Reset the profile image if upload failed
        if (userInfo?.profileImage) {
          setProfileImage(userInfo.profileImage);
        }
      }
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  };

  /**
   * Calculate experience percentage for progress bar
   */
  const calculateExpPercentage = (
    exp?: number,
    nextLevelExp?: number
  ): number => {
    if (!exp || !nextLevelExp || nextLevelExp === 0) return 0;
    return Math.min(Math.round((exp / nextLevelExp) * 100), 100);
  };

  return (
    <ImageBackground style={styles.background}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.profileTopSection}>
            <TouchableOpacity onPress={pickImage} testID="profile-image">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profilePic}
                  onError={(e) => {
                    console.log(
                      "Error loading profile image:",
                      e.nativeEvent.error
                    );
                    setProfileImage(null);
                  }}
                />
              ) : (
                <Image
                  source={require("../../../assets/images/profile-icon.png")}
                  style={styles.profilePic}
                />
              )}
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.userInfoContainer}>
              <Text style={styles.username}>
                {userInfo?.username || "username"}
              </Text>

              <View style={styles.levelContainer}>
                {/* Experience Progress */}
                <View style={styles.experienceSection}>
                  <View style={styles.expHeaderRow}>
                    <Text style={styles.expTitle}>
                      Level {userInfo?.level || "0"}
                    </Text>
                  </View>

                  <View style={styles.experienceBarContainer}>
                    <View style={styles.experienceBarOuter}>
                      <Animated.View
                        style={[
                          styles.experienceBarInner,
                          {
                            width: `${calculateExpPercentage(
                              userInfo?.experience,
                              userInfo?.nextLevelExp
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.expInfoRow}>
                      <Text style={styles.experienceText}>
                        {userInfo?.experience || 0} /{" "}
                        {userInfo?.nextLevelExp || 100} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Card Display Section */}
        <View style={styles.cardSection}>
          <View style={styles.cardRow}>
            {cardDisplay.map((cardId, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cardContainer}
                onPress={() => handleCardPress(index)}
                testID={`card-slot-${index}`}
              >
                {cardId ? (
                  <Image
                    source={{
                      uri: cards.find((card) => card._id === cardId)?.small,
                    }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={styles.plusContainer}>
                    <Ionicons
                      name="add-circle-outline"
                      size={40}
                      color="#007BFF"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Study Tracking Graph Section */}
        <View style={styles.graphSection}>
          {statsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#007BFF"
                testID="loading-indicator"
              />
            </View>
          ) : statsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{statsError}</Text>
            </View>
          ) : weeklyStats ? (
            <>
              <View style={styles.graphContainer}>
                {weeklyStats.dailyStats.map((day, index) => {
                  const minBarHeight = 4;
                  const maxCompletedDuration = Math.max(
                    ...weeklyStats.dailyStats.map((d) => d.completedDuration),
                    60
                  );
                  const completedHeight =
                    day.completedDuration > 0
                      ? Math.max(
                          (day.completedDuration / maxCompletedDuration) * 150,
                          minBarHeight
                        )
                      : 0;

                  const dayName = getDayName(day.date);
                  return (
                    <View key={index} style={styles.barGroup}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            { height: Math.max(completedHeight, 4) },
                          ]}
                        >
                          {day.completedDuration > 0 && (
                            <Text style={styles.barLabel}>
                              {day.completedDuration}m
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.dayLabel}>{dayName}</Text>
                      <Text style={styles.dateLabel}>
                        {day.date.slice(5).replace("-", "/")}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalText}>
                  Weekly Total: {weeklyStats.weeklyTotal.completedDuration} mins
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No study data available</Text>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <SignOutButton />
      </ScrollView>

      {/* Card Selection Modal */}
      <Modal
        visible={showCardModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowCardModal(false)}
        testID="card-selection-modal"
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>Select a Card</Text>
            <FlatList
              data={cards}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isUsed = cardDisplay.includes(item._id);
                return (
                  <TouchableOpacity
                    style={styles.cardItem}
                    onPress={() => !isUsed && handleCardSelect(item._id)}
                    disabled={isUsed}
                    testID="card-item"
                  >
                    <Image
                      source={{ uri: item.small }}
                      style={[
                        styles.modalCardImage,
                        isUsed && styles.usedCardImage,
                      ]}
                    />
                    {isUsed && (
                      <View style={styles.usedOverlay}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#fff"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              numColumns={3}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCardModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Used Cards Modal */}
      <Modal
        visible={showUsedCardsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUsedCardsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Used Cards</Text>
            <FlatList
              data={cards.filter((card) => cardDisplay.includes(card._id))}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.cardItem}>
                  <Image
                    source={{ uri: item.small }}
                    style={[styles.modalCardImage, styles.usedCardImage]}
                  />
                  <View style={styles.usedOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                </View>
              )}
              numColumns={3}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUsedCardsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Background image
  background: {
    flex: 1,
    resizeMode: "cover",
    paddingTop: 40,
  },
  scrollContent: {
    paddingBottom: 30, // Add padding at the bottom for better scrolling
  },
  // Profile header section
  profileHeader: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    margin: 5,
    marginTop: 30,
  },

  profileTopSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  profilePicTouchable: {
    position: "relative",
    borderRadius: 40,
  },

  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#3498db",
  },

  editOverlay: {
    position: "absolute",
    bottom: 0,
    right: 15,
    backgroundColor: "rgba(52, 152, 219, 0.9)",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  userInfoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#2c3e50",
    marginBottom: 4,
  },
  levelContainer: {
    marginTop: 5, // Reduced from 8
  },

  experienceSection: {
    width: "100%",
  },

  experienceBarContainer: {
    width: "100%",
  },

  experienceBarOuter: {
    height: 8, // Reduced from 12
    backgroundColor: "#ecf0f1",
    borderRadius: 4,
    overflow: "hidden", // Changed from "visible" to hide the indicator
  },

  experienceBarInner: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 4,
  },

  expHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  expTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#34495e",
  },

  expPercentText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3498db",
  },

  expInfoRow: {
    marginTop: 4, // Reduced space
    alignItems: "center", // Center the text
  },

  experienceText: {
    fontSize: 11, // Smaller text
    color: "#7f8c8d",
    fontWeight: "500", // Slightly reduced weight
    textAlign: "center", // Center the text
  },

  nextLevelHint: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 6,
    textAlign: "center",
  },

  // Card section
  cardSection: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    margin: 5,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  cardContainer: {
    width: 100,
    height: 140,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  plusContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // Graph section
  graphSection: {
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    margin: 5,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 14,
    height: 14,
    marginRight: 5,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
    paddingHorizontal: 1,
  },
  barGroup: {
    alignItems: "center",
    width: "14.28%", // 100% / 7 days
    paddingHorizontal: 2,
  },
  barContainer: {
    position: "relative",
    width: 38,
    height: 150,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    borderRadius: 6,
    backgroundColor: "#007BFF",
    justifyContent: "center", // Center the text vertically
    alignItems: "center",
  },
  barLabel: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    // Add shadow to make text readable on any background
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dayLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
    marginTop: 5,
  },
  dateLabel: {
    fontSize: 10,
    color: "#888",
  },
  totalSection: {
    marginTop: 10,
    alignItems: "center",
  },
  totalText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  noDataContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#666",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  cardItem: {
    width: "30%",
    margin: "1.5%",
    alignItems: "center",
  },
  modalCardImage: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  usedCardImage: {
    opacity: 0.7,
  },
  usedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});
