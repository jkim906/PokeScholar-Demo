import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { ClerkAPIError } from "@clerk/types";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<ClerkAPIError[]>();

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setErrors(undefined);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        username,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err: any) {
      const clerkErrors = err?.errors;
      if (clerkErrors && Array.isArray(clerkErrors)) {
        setErrors(clerkErrors);
      }
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setErrors(undefined);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/home");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      const clerkErrors = err?.errors;
      if (clerkErrors && Array.isArray(clerkErrors)) {
        setErrors(clerkErrors);
      }
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const renderVerificationInputs = () => {
    const digits = code.split("");
    const inputs = [];

    for (let i = 0; i < 6; i++) {
      inputs.push(
        <TextInput
          key={i}
          style={styles.verificationInput}
          maxLength={1}
          keyboardType="number-pad"
          value={digits[i] || ""}
          onChangeText={(value) => {
            const newCode = code.split("");
            newCode[i] = value;
            setCode(newCode.join(""));
          }}
          placeholderTextColor="#808080"
          testID={`verification-input-${i}`}
        />
      );
    }

    return inputs;
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color="#007fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.verificationText}>
            We've sent a 6-digit verification code to:
          </Text>
          <Text style={styles.emailText}>{emailAddress}</Text>
          <Text style={styles.verificationSubtext}>
            Enter the code below to verify your email address
          </Text>
          {errors && (
            <View style={styles.errorContainer}>
              {errors.map((el, index) => (
                <Text key={index} style={styles.errorText}>
                  * {el.longMessage}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.verificationContainer}>
            {renderVerificationInputs()}
          </View>
          <TouchableOpacity onPress={onVerifyPress} style={styles.button}>
            <Text style={styles.buttonText}>Verify Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendButton}>
            <Text style={styles.resendText}>
              Didn't receive the code? Resend
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color="#007fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Sign Up</Text>
        {errors && (
          <View style={styles.errorContainer}>
            {errors.map((el, index) => (
              <Text key={index} style={styles.errorText}>
                * {el.longMessage}
              </Text>
            ))}
          </View>
        )}
        <TextInput
          autoCapitalize="none"
          value={username}
          placeholder="Enter username"
          onChangeText={(username) => setUsername(username)}
          style={styles.input}
          placeholderTextColor="#808080"
          testID="username-input"
        />
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
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
        <TouchableOpacity onPress={onSignUpPress} style={styles.button} testID="continue-button">
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" testID="sign-in-link">
            <Text style={styles.linkText}>Sign in</Text>
          </Link>
        </View>
      </View>
    </View>
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
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
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
  verificationText: {
    fontSize: 16,
    color: "#2f3542",
    textAlign: "center",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: "#007fff",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
  },
  verificationSubtext: {
    fontSize: 14,
    color: "#808080",
    textAlign: "center",
    marginBottom: 24,
  },
  verificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  verificationInput: {
    width: 45,
    height: 50,
    borderColor: "#e8e8e8",
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#2f3542",
    backgroundColor: "#ffffff",
  },
  resendButton: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    color: "#007fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
