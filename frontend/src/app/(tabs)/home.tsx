import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Vibration,
  Alert,
  AppState,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useUser } from "@clerk/clerk-react";
import {
  startSession,
  cancelSession,
  completeSession,
  UserLevelInfo,
} from "../../api/sessionHandler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "../../hooks/useAppState";

/**
 * Home/Study Component
 *
 * Main study page
 * - Has Pomodoro Timer
 * - Start/stop function
 * - Reward pop up with vibration
 * - Navigation bar disappears once session start
 * - Cooldown timer (5 minutes between session according to Pomodoro)
 * - Misuse prevention: if user exit the screen or cancel the session, no reward will be given and
 session will be reset. Also, users must claim the reward within 2 minutes, to ensure users are not
 just running sessions without actually using the app for studying sessions. 
 */

export default function Home() {
  const IS_DEV = false; //edit for testing, change to false for real demo
  // timers
  const STUDY_DURATION = IS_DEV ? 0.1 * 60 : 25 * 60;
  const REWARD_DURATION = IS_DEV ? 0.1 * 60 : 2 * 60;
  const COOLDOWN_DURATION = IS_DEV ? 0.1 * 60 : 5 * 60;

  const [timer, setTimer] = useState(STUDY_DURATION); // default 25 minutes for pomodoro
  const [isRunning, setIsRunning] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const navigation = useNavigation();
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(REWARD_DURATION); // 2 minutes
  const [rewardInterval, setRewardInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(COOLDOWN_DURATION); // 5 minutes

  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useUser();
  const { refreshAllData } = useAppState();

  // Animation values for level progress
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [levelUpAnim] = useState(new Animated.Value(1));
  const [bonusAnim] = useState(new Animated.Value(0));

  // Handle tab bar visibility
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        tabBarStyle: isRunning
          ? {
              display: "none",
            }
          : undefined,
      });
    }
  }, [isRunning, navigation]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !showCancelPopup) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsRunning(false);
            Vibration.vibrate();
            setShowReward(true);

            // Start reward countdown and cooldown
            const rewardInt = setInterval(() => {
              setRewardTimer((prevReward) => {
                if (prevReward <= 1) {
                  clearInterval(rewardInt);
                  setShowReward(false);
                  setRewardTimer(REWARD_DURATION);
                  setTimer(STUDY_DURATION);

                  if (sessionId) {
                    console.log("Reward not claimed in time. Cancelling.");
                    handleSessionCancel();
                  }

                  // Start cooldown
                  setIsCooldown(true);
                  const cooldownInt = setInterval(() => {
                    setCooldownTimer((prev) => {
                      if (prev <= 1) {
                        clearInterval(cooldownInt);
                        setIsCooldown(false);
                        setCooldownTimer(COOLDOWN_DURATION);
                        return COOLDOWN_DURATION;
                      }
                      return prev - 1;
                    });
                  }, 1000);

                  return REWARD_DURATION;
                }
                return prevReward - 1;
              });
            }, 1000);

            setRewardInterval(rewardInt);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, showCancelPopup, timer]);

  const handleSessionStart = async () => {
    if (!user?.id) return;

    try {
      setIsRunning(true);
      const response = await startSession(
        user.id,
        Math.floor(STUDY_DURATION / 60)
      );
      console.log("Session started:", response.data);
      setSessionId(response.data._id);
    } catch (error) {
      console.error("Failed to start session", error);
      Alert.alert("Error", "Failed to start study session. Please try again.");
      setIsRunning(false);
    }
  };

  const handleSessionCancel = async () => {
    if (!sessionId || !user?.id) return;

    try {
      await cancelSession(sessionId);
      console.log("Session cancelled");
      setSessionId(null);
    } catch (error) {
      console.error("Failed to cancel session", error);
    }
  };

  const handleSessionComplete = async () => {
    if (!sessionId || !user?.id) return;

    try {
      const response = await completeSession(sessionId);
      console.log("Session completed:", response);

      // Update level info for progress bar
      if (response.userLevelInfo) {
        setLevelInfo(response.userLevelInfo);
        // Show level up notification
        setShowLevelUp(true);

        // Animate the progress bar
        progressAnim.setValue(0);
        fadeAnim.setValue(1);

        const progressPercentage =
          response.userLevelInfo.experience /
          (response.userLevelInfo.nextLevelExperience || 100);

        Animated.timing(progressAnim, {
          toValue: progressPercentage,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        if (response.userLevelInfo.isLevelUp) {
          // Add celebratory animation or highlight for level up
          Animated.sequence([
            Animated.timing(levelUpAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(levelUpAnim, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(levelUpAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          // Animate bonus coins
          Animated.sequence([
            Animated.timing(bonusAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(bonusAnim, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bonusAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }

        // Hide level up notification after a delay
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }).start(() => setShowLevelUp(false));
        }, 5000);
      }

      setSessionId(null);

      // Refresh all app data to update user state across all pages
      await refreshAllData();
    } catch (error) {
      console.error("Failed to complete session", error);
    }
  };

  // Need to ask user for notification permissions
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    // if user leaves screen, session is reset
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        (nextAppState === "background" || nextAppState === "inactive") &&
        isRunning
      ) {
        console.log("App moved to background. Cancelling session.");
        setIsRunning(false);
        setTimer(STUDY_DURATION);
        handleSessionCancel();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [isRunning, sessionId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCooldown = () => {
    setIsCooldown(true);
    const cooldownInt = setInterval(() => {
      setCooldownTimer((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownInt);
          setIsCooldown(false);
          setCooldownTimer(COOLDOWN_DURATION);
          return COOLDOWN_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        //       source={require("./../../../assets/images/pikachu.png")} // add in background later
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.timerContainer}>
            {isCooldown && <Text style={styles.cooldownLabel}>Cooldown</Text>}
            <Text
              style={[
                styles.timerValue,
                isCooldown && styles.timerValueCooldown,
              ]}
            >
              {isCooldown ? formatTime(cooldownTimer) : formatTime(timer)}
            </Text>
            {isRunning && (
              <View style={styles.timerStatusContainer}>
                <Ionicons name="timer-outline" size={16} color="#3498db" />
                <Text style={styles.timerStatus}>Session in progress</Text>
              </View>
            )}

            {!showReward && !isCooldown && (
              <TouchableOpacity
                style={[styles.button, isRunning && styles.buttonCancel]}
                onPress={() => {
                  if (isRunning) {
                    setShowCancelPopup(true);
                  } else {
                    handleSessionStart();
                  }
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isRunning && styles.buttonTextCancel,
                  ]}
                >
                  {isRunning ? "CANCEL" : "START"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* level up notification */}
          {showLevelUp && levelInfo && (
            <Animated.View
              style={[styles.levelUpContainer, { opacity: fadeAnim }]}
            >
              <View style={styles.levelHeader}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>L{levelInfo.level}</Text>
                </View>
                <Text style={styles.levelTitle}>
                  {levelInfo.isLevelUp ? "Level Up!" : "Experience Gained"}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>
                    {levelInfo.experience} / {levelInfo.nextLevelExperience} XP
                  </Text>
                </View>
              </View>

              {/* Special animation when leveling up */}
              {levelInfo.isLevelUp && (
                <Animated.View
                  style={[
                    styles.levelUpBadge,
                    { transform: [{ scale: levelUpAnim }] },
                  ]}
                >
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <Text style={styles.levelUpText}>Level Up!</Text>

                  {levelInfo.levelUpCoins > 0 && (
                    <Animated.View
                      style={[
                        styles.bonusCoinsContainer,
                        {
                          transform: [{ scale: bonusAnim }],
                          opacity: bonusAnim,
                        },
                      ]}
                    >
                      <View style={styles.coinIconContainer}>
                        <Ionicons name="logo-usd" size={16} color="#f39c12" />
                      </View>
                      <Text style={styles.bonusCoinsText}>
                        +{levelInfo.levelUpCoins} bonus coins
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Reward Popup */}
          {showReward && (
            <View style={styles.popup}>
              <View style={styles.popupHeader}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                <Text style={styles.popupTitle}>Session Complete!</Text>
              </View>

              <View style={styles.rewardContainer}>
                <View style={[styles.rewardBox, styles.coinBox]}>
                  <Text style={styles.rewardText}>
                    +50{" "}
                    <Ionicons
                      name="logo-usd"
                      size={16}
                      color="#f39c12"
                      style={styles.rewardIcon}
                    />
                  </Text>
                </View>
                <View style={[styles.rewardBox, styles.expBox]}>
                  <Text style={styles.rewardText}>
                    +20{" "}
                    <Ionicons
                      name="star"
                      size={16}
                      color="#3498db"
                      style={styles.rewardIcon}
                    />
                  </Text>
                </View>
              </View>

              <View style={styles.timerWarning}>
                <Ionicons name="alarm" size={16} color="#e74c3c" />
                <Text style={styles.warningText}>
                  Claim within: {formatTime(rewardTimer)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => {
                  if (rewardInterval) clearInterval(rewardInterval);
                  setShowReward(false);
                  setRewardTimer(REWARD_DURATION);
                  setTimer(STUDY_DURATION);

                  handleSessionComplete();
                  startCooldown();
                }}
              >
                <Text style={styles.claimButtonText} testID="claimButton">CLAIM</Text>
              </TouchableOpacity>
            </View>
          )}

          {showCancelPopup && (
            <View style={styles.popup}>
              <View style={styles.popupHeader}>
                <Ionicons name="alert-circle" size={40} color="#e74c3c" />
                <Text style={styles.popupTitle}>Cancel Session?</Text>
              </View>

              <Text style={styles.cancelWarningText}>
                You'll lose all progress and won't receive any rewards.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCancelPopup(false);
                    setIsRunning(false);
                    setTimer(STUDY_DURATION);
                    handleSessionCancel();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Yes, Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => setShowCancelPopup(false)}
                >
                  <Text style={styles.continueButtonText}>Keep Studying</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timerContainer: {
    width: "100%",
    alignItems: "center",
  },
  timerValue: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#3498db",
    letterSpacing: 2,
    marginBottom: 20,
  },
  timerValueCooldown: {
    color: "#95a5a6",
  },
  cooldownLabel: {
    fontSize: 18,
    color: "#95a5a6",
    fontWeight: "600",
    marginBottom: 8,
  },
  timerStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  timerStatus: {
    fontSize: 15,
    color: "#3498db",
    fontWeight: "500",
    marginLeft: 6,
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 50,
    minWidth: 160,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ecf0f1",
  },
  buttonCancel: {
    backgroundColor: "#e74c3c",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  buttonTextCancel: {
    color: "#fff",
  },
  cooldownContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cooldownText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7f8c8d",
    marginLeft: 8,
  },
  popup: {
    position: "absolute",
    top: "50%",
    left: "5%",
    right: "5%",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginTop: -130,
  },
  popupHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
  },
  rewardContainer: {
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  rewardBox: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  coinBox: {
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(243, 156, 18, 0.2)",
  },
  expBox: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(52, 152, 219, 0.2)",
  },
  rewardText: {
    fontSize: 18,
    color: "#2c3e50",
    fontWeight: "600",
    flexDirection: "row",
    alignItems: "center",
  },
  rewardIcon: {
    marginLeft: 4,
    marginTop: 2,
  },
  timerWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#e74c3c",
    fontWeight: "500",
  },
  claimButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
    width: "100%",
  },
  claimButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  cancelWarningText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e74c3c",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  levelUpContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    width: "85%",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 10,
  },
  levelBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#2980b9",
  },
  levelText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    marginVertical: 0,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#ecf0f1",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498db",
  },
  progressLabels: {
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 13,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "bold",
  },
  levelUpBadge: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(241, 196, 15, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(241, 196, 15, 0.3)",
  },
  levelUpText: {
    color: "#f39c12",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  bonusCoinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(243, 156, 18, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(243, 156, 18, 0.2)",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
  },
  coinIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(243, 156, 18, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  bonusCoinsText: {
    color: "#f39c12",
    fontWeight: "600",
    fontSize: 14,
  },
});
