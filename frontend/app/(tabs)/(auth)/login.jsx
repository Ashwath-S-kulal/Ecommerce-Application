import React, { useState } from "react";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ChevronRight } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPasswords, setNewPasswords] = useState({ newPassword: "", confirmPassword: "" });

  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL

  // --- Handlers (Existing logic preserved) ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/login`, formData);
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        await AsyncStorage.setItem("accessToken", res.data.accessToken);
        router.replace("/(tabs)");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/forgotpassword`, { email: formData.email });
      if (res.data.success) {
        setMode("verify");
      }
    } catch (error) {
      Alert.alert("Error", "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/verifyotp/${formData.email}`, { otp });
      if (res.data.success) {
        setMode("reset");
      }
    } catch (error) {
      Alert.alert("Error", "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPasswords.newPassword !== newPasswords.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/user/changepassword/${formData.email}`, newPasswords);
      if (res.data.success) {
        Alert.alert("Success", "Password updated successfully!");
        setMode("login");
      }
    } catch (error) {
      Alert.alert("Error", "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView 
          // FIX: Moved 'justifyContent: center' here from className
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header Section */}
          <View className="mb-10">
            {mode !== 'login' && (
              <TouchableOpacity 
                onPress={() => setMode('login')} 
                className="mb-6 w-10 h-10 items-center justify-center bg-white rounded-full border border-slate-100 shadow-sm"
              >
                <ArrowLeft size={20} color="#0F172A" />
              </TouchableOpacity>
            )}
            <Text className="text-4xl font-black text-slate-900 tracking-tighter">
              {mode === 'login' ? "Welcome." : mode === 'forgot' ? "Recover." : mode === 'verify' ? "Verify." : "Reset."}
            </Text>
            <Text className="text-lg text-slate-500 font-medium mt-2">
              {mode === 'login' ? "Sign in to your account" : "Follow the steps to continue"}
            </Text>
          </View>

          {/* Form Container */}
          <View className="space-y-5">
            
            {/* EMAIL */}
            {(mode === 'login' || mode === 'forgot') && (
              <View>
                <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</Text>
                <View className="flex-row items-center bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm shadow-slate-200">
                  <Mail size={18} color="#94a3b8" />
                  <TextInput 
                    className="flex-1 ml-3 text-base font-semibold text-slate-900"
                    placeholder="name@example.com"
                    placeholderTextColor="#cbd5e1"
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
            )}

            {/* PASSWORD */}
            {mode === 'login' && (
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</Text>
                  <TouchableOpacity onPress={() => setMode('forgot')}>
                    <Text className="text-[11px] font-bold text-pink-600 uppercase">Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm shadow-slate-200">
                  <Lock size={18} color="#94a3b8" />
                  <TextInput 
                    className="flex-1 ml-3 text-base font-semibold text-slate-900"
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
                    value={formData.password}
                    onChangeText={(t) => setFormData({ ...formData, password: t })}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* OTP */}
            {mode === 'verify' && (
               <View>
                <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">Enter 6-Digit Code</Text>
                <View className="bg-white h-20 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200 justify-center">
                  <TextInput 
                    className="text-center text-3xl font-black text-slate-900 tracking-[10px]"
                    maxLength={6}
                    keyboardType="number-pad"
                    placeholder="000000"
                    placeholderTextColor="#f1f5f9"
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {/* RESET */}
            {mode === 'reset' && (
              <View className="space-y-4">
                <View className="bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm">
                   <TextInput 
                    className="flex-1 font-semibold text-slate-900"
                    placeholder="New Password"
                    secureTextEntry
                    onChangeText={(text) => setNewPasswords({ ...newPasswords, newPassword: text })}
                  />
                </View>
                <View className="bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm">
                   <TextInput 
                    className="flex-1 font-semibold text-slate-900"
                    placeholder="Confirm New Password"
                    secureTextEntry
                    onChangeText={(text) => setNewPasswords({ ...newPasswords, confirmPassword: text })}
                  />
                </View>
              </View>
            )}

            {/* BUTTON */}
            <TouchableOpacity 
              onPress={
                mode === 'login' ? handleLogin : 
                mode === 'forgot' ? handleForgotPassword : 
                mode === 'verify' ? handleVerifyOTP : handleResetPassword
              }
              activeOpacity={0.8}
              className="bg-slate-900 h-16 rounded-2xl items-center justify-center flex-row shadow-lg shadow-slate-400 mt-4"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold mr-2">
                    {mode === 'login' ? "Sign In" : mode === 'forgot' ? "Send Code" : mode === 'verify' ? "Verify OTP" : "Update Password"}
                  </Text>
                  <ChevronRight size={18} color="white" />
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer */}
          {mode === 'login' && (
            <View className="mt-10 items-center">
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text className="text-slate-500 font-medium text-base">
                  Dont have an account? <Text className="text-pink-600 font-bold">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}