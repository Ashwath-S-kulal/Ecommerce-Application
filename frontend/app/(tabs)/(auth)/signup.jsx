import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Timer, 
  RotateCcw, 
  ChevronRight, 
  ArrowLeft 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import axios from "axios";

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

  // Timer Logic
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

  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL // Replace with your IP

  // Handlers
  const submitHandler = async () => {
    if (formData.password !== formData.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match!");
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/register`, formData);
      if (res.data.success) {
        setStep(2);
        setTimeLeft(600);
        setResendCooldown(60);
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const otpVerifyHandler = async () => {
    if (timeLeft === 0) return Alert.alert("Error", "OTP Expired. Please resend code.");
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/verifysignup`, {
        email: formData.email,
        otp: otp,
      });
      if (res.data.success) {
        Alert.alert("Welcome", "Account activated!");
        router.replace("/login");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-8">
          
          {/* Header */}
          <View className="mb-8">
            {step === 2 && (
              <TouchableOpacity onPress={() => setStep(1)} className="mb-4 w-10 h-10 items-center justify-center bg-white rounded-full border border-slate-100 shadow-sm">
                <ArrowLeft size={20} color="#0F172A" />
              </TouchableOpacity>
            )}
            <Text className="text-4xl font-black text-slate-900 tracking-tighter">
              {step === 1 ? "Join Us." : "Verify."}
            </Text>
            <Text className="text-lg text-slate-500 font-medium mt-1">
              {step === 1 ? "Create your account today." : `Code sent to ${formData.email}`}
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {step === 1 ? (
              <>
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">First Name</Text>
                    <TextInput 
                      className="bg-white h-14 rounded-2xl px-5 border border-slate-100 shadow-sm font-semibold"
                      placeholder="John"
                      value={formData.firstName}
                      onChangeText={(t) => setFormData({...formData, firstName: t})}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Last Name</Text>
                    <TextInput 
                      className="bg-white h-14 rounded-2xl px-5 border border-slate-100 shadow-sm font-semibold"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChangeText={(t) => setFormData({...formData, lastName: t})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email</Text>
                  <View className="flex-row items-center bg-white h-14 rounded-2xl px-5 border border-slate-100 shadow-sm">
                    <Mail size={18} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 font-semibold"
                      placeholder="hello@example.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={formData.email}
                      onChangeText={(t) => setFormData({...formData, email: t})}
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Password</Text>
                  <View className="flex-row items-center bg-white h-14 rounded-2xl px-5 border border-slate-100 shadow-sm">
                    <Lock size={18} color="#94a3b8" />
                    <TextInput 
                      className="flex-1 ml-3 font-semibold"
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(t) => setFormData({...formData, password: t})}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              // OTP STEP
              <View className="space-y-6">
                <View className="bg-pink-50 p-4 rounded-2xl flex-row justify-between items-center border border-pink-100">
                  <View className="flex-row items-center">
                    <Timer size={18} color="#db2777" />
                    <Text className="ml-2 font-mono font-bold text-pink-600 text-lg">{formatTime(timeLeft)}</Text>
                  </View>
                  <Text className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Expires In</Text>
                </View>

                <TextInput 
                  className="bg-white h-20 rounded-3xl text-center text-3xl font-black text-pink-600 border border-pink-100 shadow-xl shadow-pink-100 tracking-[15px]"
                  maxLength={6}
                  keyboardType="number-pad"
                  placeholder="000000"
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />

                <TouchableOpacity 
                  disabled={resendCooldown > 0 || resending}
                  className="items-center"
                  onPress={() => {/* Resend Logic */}}
                >
                  <Text className={`font-bold text-xs ${resendCooldown > 0 ? 'text-slate-400' : 'text-pink-600'}`}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity 
              onPress={step === 1 ? submitHandler : otpVerifyHandler}
              disabled={loading}
              activeOpacity={0.8}
              className={`h-16 rounded-2xl items-center justify-center flex-row shadow-lg mt-4 ${step === 1 ? 'bg-pink-600 shadow-pink-200' : 'bg-emerald-600 shadow-emerald-200'}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold mr-2">
                    {step === 1 ? "Get OTP Code" : "Verify & Activate"}
                  </Text>
                  <ChevronRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          {step === 1 && (
            <TouchableOpacity onPress={() => router.push("/login")} className="mt-8 items-center">
              <Text className="text-slate-500 font-medium">
                Member already? <Text className="text-pink-600 font-bold">Log In</Text>
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}