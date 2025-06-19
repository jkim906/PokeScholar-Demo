import React from "react";
import {
  View,
  Image,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Card } from "../types/Card";
import { LinearGradient } from "expo-linear-gradient";

interface CardModalProps {
  selectedCard: Card | null;
  isImageLoading: boolean;
  onClose: () => void;
  onLoadStart: () => void;
  onLoad: () => void;
  testID?: string;
}

/**
 * CardModal Component
 *
 * Displays a full-screen modal with a detailed view of the selected card.
 * Features:
 * - Full-screen card image display
 * - Loading indicator while image loads
 * - Close button to dismiss modal
 * - Error handling for image loading
 *
 * @param {CardModalProps} props - Component props
 * @param {Card | null} props.selectedCard - The card to display in the modal
 * @param {boolean} props.isImageLoading - Loading state of the image
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onLoadStart - Callback when image starts loading
 * @param {Function} props.onLoad - Callback when image finishes loading
 */
const CardModal: React.FC<CardModalProps> = ({
  selectedCard,
  isImageLoading,
  onClose,
  onLoadStart,
  onLoad,
  testID,
}) => {
  return (
    <Modal
      visible={selectedCard !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={styles.modalBackground} onPress={onClose}>
        {selectedCard?.large && (
          <View style={styles.cardContainer}>
            <Image
              source={{ uri: selectedCard.large }}
              style={styles.cardImage}
              onLoadStart={onLoadStart}
              onLoad={onLoad}
              onError={() => {
                console.error("Failed to load image:", selectedCard.large);
                onLoad();
              }}
              resizeMode="contain"
              testID="card-image"
            />
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.4)",
                "rgba(255,255,255,0.2)",
                "rgba(255,255,255,0.1)",
                "rgba(255,255,255,0)",
              ]}
              locations={[0, 0.3, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            {isImageLoading && (
              <View style={[styles.loadingContainer, styles.cardImage]}>
                <ActivityIndicator
                  testID="loading-indicator"
                  size="large"
                  color="#007BFF"
                />
              </View>
            )}
          </View>
        )}
        <Text style={styles.tapHint}>Tap anywhere to close</Text>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: 300,
    height: 420,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    borderRadius: 12,
  },
  tapHint: {
    position: "absolute",
    bottom: 20,
    color: "#fff",
    fontSize: 14,
  },
  loadingContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(240,240,240,0.7)",
    borderRadius: 12,
  },
});

export default CardModal;
