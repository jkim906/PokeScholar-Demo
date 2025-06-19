import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Card } from "../types/Card";

interface CardGridItemProps {
  card: Card;
  onPress: (card: Card) => void;
  showDuplicates: boolean;
}

/**
 * CardGridItem Component
 *
 * Displays a single card in the collection grid with the following features:
 * - Thumbnail image of the card
 * - Duplicate count overlay (when not scrolling)
 * - Tap to view full card details
 * - Loading state handling
 *
 * @param {CardGridItemProps} props - Component props
 * @param {Card} props.card - The card data to display
 * @param {Function} props.onPress - Callback when card is pressed
 * @param {boolean} props.showDuplicates - Whether to show duplicate count
 */
const CardGridItem: React.FC<CardGridItemProps> = ({
  card,
  onPress,
  showDuplicates,
}) => {
  // State for tracking image loading
  const [isLoading, setIsLoading] = useState(true);

  return (
    <TouchableOpacity onPress={() => onPress(card)}>
      <View style={styles.container}>
        <Image
          source={{ uri: card.small }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error("Image load error:", {
              error: e.nativeEvent.error,
              url: card.small,
              cardName: card.name,
            });
            setIsLoading(false);
          }}
        />
        {showDuplicates && card.copies > 1 && (
          <View style={styles.duplicateCount}>
            <Text style={styles.duplicateText}>x{card.copies}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 120,
    margin: 4,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  duplicateCount: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  duplicateText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default CardGridItem;
