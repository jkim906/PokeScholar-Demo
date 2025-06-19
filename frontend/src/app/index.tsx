import { router } from "expo-router";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";

export default function Landing() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const pageFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fadeIn = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(500),
    ]);

    Animated.loop(fadeIn).start();
  }, []);

  const handlePress = () => {
    Animated.timing(pageFade, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.navigate("/sign-in");
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: pageFade }]}>
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <View style={styles.container}>
          <Image
            style={styles.titleLogo}
            source={require("../../assets/images/logo.png")}
          />
          <Image
            style={styles.logo}
            source={require("../../assets/images/pikachu.png")}
          />
          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY }],
              },
            ]}
          >
            Tap To Start
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleLogo: {
    width: 350,
    height: 120,
    marginBottom: 30,
    resizeMode: "contain",
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f3542",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
