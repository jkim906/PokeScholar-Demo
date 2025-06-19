import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-react";
import { Pack, Card, fetchAllPacks, buyPack } from "../../api/packHandler";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useAppState } from "../../hooks/useAppState";

const { width: windowWidth } = Dimensions.get("window");

export default function Shop() {
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [returnCards, setReturnCards] = useState<Card[]>([]);
  const [showCard, setShowCard] = useState<boolean>(false);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const { user } = useUser();
  const { userProfile, collection } = useAppState();
  const { userInfo } = userProfile;
  const userPoints = userInfo?.coins || 0;
  const { setCards } = collection;

  const fetchPacks = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res = await fetchAllPacks();
      if (res.length === 0) {
        Alert.alert("Error", "Unable to load pack data.");
      }
      // Don't duplicate the packs
      setPacks(res);
    } catch (error) {
      console.error("Failed to fetch packs:", error);
      Alert.alert("Error", "Unable to load pack data.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch packs when the component mounts
    fetchPacks();
  }, [fetchPacks]);

  // Fetch packs when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPacks();
    }, [fetchPacks])
  );

  // Preload images when cards are received
  useEffect(() => {
    if (returnCards.length > 0) {
      returnCards.forEach((card) => {
        Image.prefetch(card.large);
      });
    }
  }, [returnCards]);

  const preloadImages = async (cards: Card[]) => {
    setIsPreloading(true);
    try {
      await Promise.all(cards.map((card) => Image.prefetch(card.large)));
    } catch (error) {
      console.error("Error preloading images:", error);
    } finally {
      setIsPreloading(false);
    }
  };

  const confirmPurchase = async (pack: Pack): Promise<void> => {
    const userId = user?.id;
    if (!userId) {
      Alert.alert("Error", "User not found.");
      return;
    }
    try {
      const response = await buyPack(pack.code, userId);
      if (response.length === 0) {
        Alert.alert("Error", "Failed to buy packs.");
        return;
      }
      if (Array.isArray(response)) {
        // Update user coins and add cards to collection
        await userProfile.deductCoins(pack.cost);
        const newCards = response.map((card) => ({
          _id: card.name,
          name: card.name,
          rarity: card.rarity,
          types: [],
          small: card.small,
          large: card.large,
          copies: 1,
          collectedAt: new Date().toISOString(),
        }));
        await setCards([...collection.cards, ...newCards]);
        setReturnCards(response);
        setSelectedPack(null);
        // Preload images before showing modal
        await preloadImages(response);
        setShowCard(true);
        // Start fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        Alert.alert("Error", "Failed to buy packs.");
      }
    } catch (error) {
      console.error("Error confirming purchase:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const shakeCoin = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePurchase = (pack: Pack): void => {
    if (userInfo?.coins && userInfo.coins >= pack.cost) {
      confirmPurchase(pack);
    } else {
      shakeCoin();
    }
  };

  const renderPackItem = ({ item, index }: { item: Pack; index: number }) => {
    const canAfford = userPoints >= item.cost;

    return (
      <View
        key={`${item.code}-${index}`}
        style={{ width: windowWidth, padding: 20 }}
      >
        <View style={styles.packWrapper}>
          <TouchableOpacity
            onPress={() => handlePurchase(item)}
            style={styles.packContainer}
            activeOpacity={0.7}
          >
            <Image
              source={
                index % 2 === 0
                  ? require("../../../assets/images/eevee-pack.png")
                  : require("../../../assets/images/pikachu-pack.png")
              }
              style={styles.packImage}
              resizeMode="contain"
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
              style={styles.packGradient}
            />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.packCostContainer,
              {
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            <Image
              source={require("../../../assets/images/pokecoin.png")}
              style={styles.packCostIcon}
            />
            <Text
              style={[styles.packCost, !canAfford && styles.insufficientFunds]}
            >
              {item.cost}
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderCard = (card: Card) => {
    return (
      <View style={styles.cardContainer}>
        <Image
          style={styles.cardImage}
          source={{ uri: card.large }}
          resizeMode="contain"
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <>
          {/* Points Display */}
          <View style={styles.pointsContainer}>
            <View style={styles.pointsBadge}>
              <Image
                source={require("../../../assets/images/pokecoin.png")}
                style={styles.coinIcon}
              />
              <Text style={styles.points}>{userPoints}</Text>
            </View>
          </View>

          <View style={styles.scrollContainer}>
            <ScrollView
              horizontal={true}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={1}
            >
              {packs.map((pack, index) =>
                renderPackItem({ item: pack, index })
              )}
            </ScrollView>
            <View style={styles.indicatorContainer}>
              {packs.map((_, index) => {
                const width = scrollX.interpolate({
                  inputRange: [
                    windowWidth * (index - 1),
                    windowWidth * index,
                    windowWidth * (index + 1),
                  ],
                  outputRange: [8, 16, 8],
                  extrapolate: "clamp",
                });
                return (
                  <Animated.View
                    key={`dot-${index}`}
                    style={[styles.normalDot, { width }]}
                  />
                );
              })}
            </View>
          </View>
        </>
      )}

      <Modal visible={showCard} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <SafeAreaView style={styles.modalContainer}>
            {returnCards.length > 0 && (
              <Swiper
                cards={returnCards}
                renderCard={renderCard}
                onSwipedAll={() => {
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(() => setShowCard(false));
                }}
                cardIndex={0}
                backgroundColor={"transparent"}
                stackSize={2}
                stackSeparation={15}
                animateOverlayLabelsOpacity
                animateCardOpacity
                swipeBackCard
                showSecondCard={true}
                stackScale={3}
                stackAnimationFriction={7}
                stackAnimationTension={40}
              />
            )}
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  points: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  packWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 500,
  },
  packContainer: {
    width: "100%",
    height: 450,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  packImage: {
    width: "100%",
    height: "100%",
  },
  packGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    borderRadius: 12,
  },
  insufficientFunds: {
    color: "#e74c3c",
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  normalDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#3498db",
    marginHorizontal: 4,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  packCostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#ecf0f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  packCostIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  packCost: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  cardContainer: {
    width: 300,
    height: 420,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -150 }, { translateY: -210 }],
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
});
