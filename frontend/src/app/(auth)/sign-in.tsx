import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
} from "react-native";
import React from "react";
import { ClerkAPIError } from "@clerk/types";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<ClerkAPIError[]>();

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    // Clear any errors that may have occurred during previous form submission
    setErrors(undefined);

    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setActive({ session: signInAttempt.createdSessionId });
          router.replace("/home");
        });
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      const clerkErrors = err?.errors;
      if (clerkErrors && Array.isArray(clerkErrors)) {
        // Map known error codes to more specific messages.
        const mappedErrors = clerkErrors.map((e) => {
          switch (e.code) {
            case "form_identifier_not_found":
              return {
                ...e,
                longMessage:
                  "* We couldn't find an account with that email. Try signing up.",
              };
            case "form_password_incorrect":
              return {
                ...e,
                longMessage: "* Incorrect Password.",
              };
            case "form_param_format_invalid":
              if (e.meta?.paramName === "identifier") {
                return {
                  ...e,
                  longMessage:
                    "* That doesn't look like a valid email address.",
                };
              }
              if (e.meta?.paramName === "password") {
                return {
                  ...e,
                  longMessage: "* Incorrect password.",
                };
              }
              return e;
            default:
              return e;
          }
        });

        setErrors(mappedErrors);
      } else {
        setErrors([
          {
            message: "Something went wrong",
            code: "unknown_error",
            longMessage:
              "An unexpected error occurred. Please try again later.",
          } as ClerkAPIError,
        ]);
      }

      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        {errors && (
          <View style={styles.errorContainer}>
            {errors.map((el, index) => (
              <Text key={index} style={styles.errorText}>
                {el.longMessage}
              </Text>
            ))}
          </View>
        )}
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          style={styles.input}
          placeholderTextColor="#808080"
          testID="email-input"
        />
        <TextInput
          value={password}
          placeholder="Enter password"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          style={styles.input}
          placeholderTextColor="#808080"
          testID="password-input"
        />
        <TouchableOpacity onPress={onSignInPress} style={styles.button} testID="continue-button">
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Link href="/sign-up" testID="sign-up-link">
            <Text style={styles.linkText}> Sign up</Text>
          </Link>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2f3542",
    marginBottom: 25,
    textAlign: "center",
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#e8e8e8",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#2f3542",
  },
  button: {
    backgroundColor: "#007fff",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  footerText: {
    fontSize: 15,
    color: "#808080",
  },
  linkText: {
    fontSize: 15,
    color: "#007fff",
    fontWeight: "600",
  },
  errorContainer: {
    marginBottom: 15,
    width: "100%",
  },
  errorText: {
    color: "#ff4757",
    fontSize: 14,
    marginBottom: 5,
  },
});
