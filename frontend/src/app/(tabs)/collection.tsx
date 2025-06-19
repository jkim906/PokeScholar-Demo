import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import CardGridItem from "../../components/CardGridItem";
import CardModal from "../../components/CardModal";
import SortModal from "../../components/SortModal";
import { Card } from "../../types/Card";
import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "../../hooks/useAppState";

/**
 * Collection Component
 *
 * Displays the user's Pokemon card collection with filtering and sorting capabilities.
 *
 * Features:
 * - Card grid display with duplicate count
 * - Search functionality
 * - Rarity filtering
 * - Multiple sorting options (Recent, Type, Rarity, Duplicates)
 * - Card detail modal
 * - Loading states and error handling
 */

// Define the order of card rarities for sorting
const RARITY_ORDER = [
  "Common",
  "Uncommon",
  "Rare",
  "Illustration Rare",
  "Double Rare",
  "Special Illustration Rare",
] as const;

type Rarity = (typeof RARITY_ORDER)[number];

const Collection: React.FC = () => {
  // Get user authentication state and collection data
  const { user, isSignedIn } = useUser();
  const { cards, filteredTotal, isLoading, error, loadCollection } =
    useAppState().collection;

  // Component state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>("Recent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load collection when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isSignedIn && user?.id) {
        loadCollection(selectedRarity ? { rarity: selectedRarity } : {});
      }
    }, [isSignedIn, user?.id, selectedRarity])
  );

  // Filter and sort cards based on current criteria
  const filteredCards = React.useMemo(() => {
    let result = [...cards];

    // Apply search filter
    if (searchText) {
      result = result.filter((card) =>
        card.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "Recent":
            comparison =
              new Date(b.collectedAt).getTime() -
              new Date(a.collectedAt).getTime();
            break;
          case "Type":
            comparison = (a.types[0] || "").localeCompare(b.types[0] || "");
            if (comparison === 0) comparison = a.name.localeCompare(b.name);
            break;
          case "Rarity":
            comparison =
              RARITY_ORDER.indexOf(b.rarity as Rarity) -
              RARITY_ORDER.indexOf(a.rarity as Rarity);
            break;
          case "Duplicates":
            comparison = b.copies - a.copies;
            break;
        }
        return sortDirection === "desc" ? comparison : -comparison;
      });
    }
    return result;
  }, [cards, searchText, sortBy, sortDirection]);

  // Show sign in message if user is not authenticated
  if (!isSignedIn) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Please sign in to view your collection
        </Text>
      </View>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar with card count and search */}
      <View style={styles.topContainer}>
        <View style={styles.cardCountContainer}>
          <Image
            source={require("../../../assets/images/pokemon-card.png")}
            style={styles.cardCountImage}
          />
          <Text style={styles.cardCount}>
            {filteredCards.length}/{filteredTotal}
          </Text>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Search cards..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Rarity filter buttons */}
      <View style={styles.rarityContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rarityScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.rarityButton,
              selectedRarity === null && styles.selectedRarity,
            ]}
            onPress={() => setSelectedRarity(null)}
          >
            <Text style={styles.rarityButtonText}>All</Text>
          </TouchableOpacity>
          {RARITY_ORDER.map((rarity) => (
            <TouchableOpacity
              key={rarity}
              style={[
                styles.rarityButton,
                selectedRarity === rarity && styles.selectedRarity,
              ]}
              onPress={() => setSelectedRarity(rarity)}
            >
              <Text style={styles.rarityButtonText}>{rarity}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Card grid */}
      <View style={styles.cardGridContainer}>
        <FlatList
          data={filteredCards}
          renderItem={({ item }) => (
            <CardGridItem
              card={item}
              onPress={() => setSelectedCard(item)}
              showDuplicates={!isScrolling}
            />
          )}
          keyExtractor={(item) => item._id}
          numColumns={4}
          contentContainerStyle={styles.cardList}
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={() => setIsScrolling(false)}
          onMomentumScrollEnd={() => setIsScrolling(false)}
        />
        {isLoading && (
          <View style={styles.cardGridLoading}>
            <ActivityIndicator
              testID="loading-indicator"
              size="large"
              color="#007BFF"
            />
          </View>
        )}
        {!isLoading && filteredCards.length === 0 && (
          <View style={styles.messageCentered}>
            <Text style={styles.message}>No cards found.</Text>
          </View>
        )}
      </View>

      {/* Conditionally render Card detail modal */}
      {selectedCard && (
        <CardModal
          selectedCard={selectedCard}
          isImageLoading={isImageLoading}
          onClose={() => setSelectedCard(null)}
          onLoadStart={() => setIsImageLoading(true)}
          onLoad={() => setIsImageLoading(false)}
        />
      )}

      {/* Sort button */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setSortModalVisible(true)}
      >
        <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
        <Ionicons
          name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
          size={16}
          color="#fff"
          style={styles.sortIcon}
        />
      </TouchableOpacity>

      {/* Sort options modal */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={(option) => {
          if (sortBy === option) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
          } else {
            setSortBy(option);
            setSortDirection("desc");
          }
        }}
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  messageCentered: {
    flex: 100,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 60,
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 5,
    height: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  cardCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardCountImage: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  cardCount: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "600",
  },
  searchBar: {
    width: 200,
    height: 40,
    borderColor: "#e9ecef",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    fontSize: 16,
    marginRight: 10,
  },
  rarityContainer: {
    height: 50,
    marginTop: 10,
    marginBottom: 15,
  },
  rarityScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  rarityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
  },
  selectedRarity: {
    backgroundColor: "#007BFF",
  },
  rarityButtonText: {
    color: "#495057",
    fontSize: 14,
    fontWeight: "600",
  },
  cardGridContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f8f9fa",
  },
  cardList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  cardGridLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    zIndex: 1,
  },
  sortButton: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  sortButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sortIcon: {
    marginLeft: 8,
  },
});

export default Collection;
