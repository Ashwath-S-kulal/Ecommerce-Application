import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import {
  Eye, EyeOff, Mail, Timer, RotateCcw
} from "lucide-react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

const BASE_URL = Constants.expoConfig.extra.apiUrl;

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(60);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (text) => {
    setToastMsg(text);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(""));
  };

  useEffect(() => {
    let interval;
    if (step === 2) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      const res = await axios.post(`${BASE_URL}/api/user/resendotp`, { email: formData.email });
      if (res.data.success) {
        showToast("A fresh code has been sent!");
        setTimeLeft(600);
        setResendCooldown(60);
        setOtp("");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const submitHandler = async () => {
    if (formData.password !== formData.confirmPassword) {
      return showToast("Passwords do not match!");
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/user/register`, formData);
      if (res.data.success) {
        showToast("Verification code sent!");
        setStep(2);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const otpVerifyHandler = async () => {
    if (timeLeft === 0) return showToast("OTP Expired. Please resend code.");
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/user/verifysignup`, {
        email: formData.email,
        otp: otp,
      });
      if (res.data.success) {
        showToast("Welcome to Sanjeevini!");
        setTimeout(() => router.push("/login"), 1000);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">

      <View className="absolute top-0 left-0 w-full h-full bg-slate-50" />
      <View className="absolute bottom-0 right-0 w-full h-full bg-slate-50" />
      <View className="absolute -top-20 -right-20 w-80 h-80 bg-pink-100 rounded-full blur-[60px] opacity-60" />
      <View className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-50 rounded-full blur-[60px] opacity-40" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "padding" : "padding"}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >

            <View className="items-center mb-10 mt-12">
              <TouchableOpacity onPress={() => router.push("/")}
                className="w-28 h-28 bg-white rounded-[32px] items-center justify-center shadow-xl shadow-pink-200 border border-slate-100 mb-6">
                <Image
                  source={require('../../assets/logo_bg_rmv.png')}
                  style={{ width: 80, height: 80 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text className="text-slate-900 text-4xl font-extrabold tracking-tighter" numberOfLines={1}>Sanjeevini Group Avarse</Text>
              <View className="flex-row items-center mt-2">
                <View className="w-8 h-[2px] bg-pink-500/30 mr-2" />
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-[3px]">Rural Livelihood</Text>
                <View className="w-8 h-[2px] bg-pink-500/30 ml-2" />
              </View>
            </View>



            <View className="bg-white p-8 rounded-[32px] shadow-2xl mx-6">
              <View className="bg-white sm:border sm:border-gray-100 sm:rounded-[32px] sm:shadow-xl p-2">
                <View className="items-center mb-8">
                  <Text className="text-3xl font-black text-gray-900" numberOfLines={1}>
                    {step === 1 ? "Create Account" : "Verify Email"}
                  </Text>
                  <View className="w-12 h-1 bg-pink-500 rounded-full mb-6" />
                  <Text className="text-gray-500 font-medium text-center mt-2 px-4 text-sm leading-5">
                    {step === 1
                      ? "Join us today! It only takes a minute."
                      : `We sent a security code to\n${formData.email}`}
                  </Text>
                </View>

                <View className="space-y-5 px-2">
                  {step === 1 ? (
                    <View className="space-y-4">
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">First Name</Text>
                          <TextInput
                            placeholder="John"
                            placeholderTextColor="#bacae0"
                            value={formData.firstName}
                            onChangeText={(val) => setFormData({ ...formData, firstName: val })}
                            className="bg-gray-50 border border-gray-100 rounded-2xl h-14 px-4 text-gray-800"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Last Name</Text>
                          <TextInput
                            placeholder="Doe"
                            placeholderTextColor="#bacae0"
                            value={formData.lastName}
                            onChangeText={(val) => setFormData({ ...formData, lastName: val })}
                            className="bg-gray-50 border border-gray-100 rounded-2xl h-14 px-4 text-gray-800"
                          />
                        </View>
                      </View>

                      <View>
                        <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1 mt-5">Email Address</Text>
                        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 h-14">
                          <Mail size={16} color="#bacae0" />
                          <TextInput
                            placeholder="johndoe@gmail.com"
                            placeholderTextColor="#bacae0"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(val) => setFormData({ ...formData, email: val })}
                            className="flex-1 ml-3 text-gray-800"
                          />
                        </View>
                      </View>

                      <View>
                        <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1 mt-5">Password</Text>
                        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 h-14">
                          <TextInput
                            placeholder="Enter a strong password"
                            placeholderTextColor="#bacae0"
                            secureTextEntry={!showPassword}
                            value={formData.password}
                            onChangeText={(val) => setFormData({ ...formData, password: val })}
                            className="flex-1 text-gray-800"
                          />
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} color="#d1d5db" /> : <Eye size={18} color="#d1d5db" />}
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View>
                        <Text className="text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1 mt-5">Confirm Password</Text>
                        <TextInput
                          placeholder="Re-enter your password"
                          placeholderTextColor="#bacae0"
                          secureTextEntry
                          value={formData.confirmPassword}
                          onChangeText={(val) => setFormData({ ...formData, confirmPassword: val })}
                          className={`bg-gray-50 border rounded-2xl h-14 px-4 text-gray-800 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? "border-red-300" : "border-gray-100"
                            }`}
                        />
                      </View>
                    </View>
                  ) : (
                    <View className="space-y-6">
                      <View className="bg-pink-50/80 border border-pink-100 p-5 rounded-md flex-row justify-between items-center mb-4">
                        <Text className="text-[10px] uppercase font-black text-pink-400 tracking-tighter">Code Expires In</Text>
                        <View className="flex-row items-center gap-2">
                          <Timer size={18} color="#db2777" />
                          <Text className="font-bold text-pink-600 text-xl font-mono">{formatTime(timeLeft)}</Text>
                        </View>
                      </View>

                      <View className="space-y-4">
                        <TextInput
                          maxLength={6}
                          keyboardType="number-pad"
                          placeholder="000000"
                          value={otp}
                          onChangeText={setOtp}
                          className="text-center text-4xl font-black h-24 bg-white border border-pink-100  rounded-md shadow-sm shadow-pink-100 mb-5"
                        />
                        <TouchableOpacity
                          disabled={resendCooldown > 0 || resending}
                          onPress={handleResendOTP}
                          className="flex-row items-center justify-center gap-2"
                        >
                          {resending ? <ActivityIndicator size="small" color="#db2777" /> : <RotateCcw size={14} color={resendCooldown > 0 ? "#9ca3af" : "#db2777"} />}
                          <Text className={`text-xs font-bold ${resendCooldown > 0 ? "text-gray-400" : "text-pink-600"}`} numberOfLines={1}>
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    disabled={loading || (step === 2 && timeLeft === 0)}
                    onPress={step === 1 ? submitHandler : otpVerifyHandler}
                    activeOpacity={0.8}
                    className={`w-full h-16 rounded-md items-center justify-center shadow-lg shadow-gray-200 mt-4 ${step === 1 ? "bg-black" : "bg-emerald-600"
                      }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-black text-lg" numberOfLines={1}>
                        {step === 1 ? "Get OTP Code" : "Verify & Activate"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push("/login")} className="flex-row justify-center items-center py-6">
                    <Text className="text-sm text-gray-500 font-medium" numberOfLines={1}>Already have an account.?</Text>
                    <TouchableOpacity >
                      <Text className="ml-2 text-pink-600 font-black text-base" numberOfLines={1}>Log In</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              </View>
            </View>



          </ScrollView>
        </TouchableWithoutFeedback>


        {toastMsg ? (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              position: 'absolute',
              bottom: 50,
              left: 20,
              right: 20
            }}
            className="bg-gray-900 px-6 py-4 rounded-2xl items-center shadow-2xl"
          >
            <Text className="text-white font-bold text-xs tracking-widest text-center">{toastMsg}</Text>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}