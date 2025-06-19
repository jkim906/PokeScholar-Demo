import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchUserCards } from "../../api/collectionHandler";
import { Card } from "../../types/Card";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  friend: {
    _id: string;
    username: string;
    level: number;
    coins: number;
    experience: number;
    cardDisplay?: string[];
    profileImage?: string;
  } | null;
}

export default function ProfileModal({
  visible,
  onClose,
  friend,
}: ProfileModalProps) {
  const [displayedCards, setDisplayedCards] = useState<Card[]>([]);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = "http://localhost:3000";

  // Clear cards when modal is not visible or friend changes
  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setDisplayedCards([]);
      return;
    }

    // Reset cards and load new ones when friend changes
    setDisplayedCards([]);
    setIsLoading(true);
    setImageError(false);

    const loadCards = async () => {
      if (friend && friend._id && friend.cardDisplay) {
        try {
          const allCards = await fetchUserCards(friend._id);
          setDisplayedCards(
            friend.cardDisplay
              .map((cardId) => allCards.find((card) => card._id === cardId))
              .filter(Boolean) as Card[]
          );
        } catch (error) {
          console.error("Error loading cards:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [friend?._id, visible]);

  const constructProfileImageUrl = (imagePath: string): string => {
    if (!imagePath) return "";
    if (imagePath.startsWith("/profile")) {
      return `${API_BASE_URL}${imagePath}`;
    }
    return imagePath;
  };

  if (!friend) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          testID="profile-modal"
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profilePicContainer}>
              {friend.profileImage && !imageError ? (
                <Image
                  source={{
                    uri: constructProfileImageUrl(friend.profileImage),
                  }}
                  style={styles.profileImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Ionicons name="person-circle" size={80} color="#2196F3" />
              )}
            </View>
            <Text style={styles.username}>{friend.username}</Text>
            <Text style={styles.level}>Level {friend.level}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : displayedCards.length > 0 ? (
            <View style={styles.cardsRowContainer}>
              {displayedCards.map((card, idx) => (
                <View key={card._id || idx} style={styles.cardContainer}>
                  <Image
                    source={{ uri: card.small }}
                    style={styles.cardImage}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </Pressable>
        <Text style={styles.tapToCloseText}>Tap anywhere to close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get("window").width * 0.9,
    maxWidth: 450,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  profilePicContainer: {
    marginBottom: 15,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  level: {
    fontSize: 16,
    color: "#666",
  },
  tapToCloseText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 15,
    opacity: 0.8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginTop: 10,
  },
  cardsRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    paddingHorizontal: 5,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    width: "100%",
  },
  cardContainer: {
    width: 95,
    height: 133,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
});
