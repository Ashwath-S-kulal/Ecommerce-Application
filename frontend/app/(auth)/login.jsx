import React, { useState } from "react";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ChevronRight } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View, Text, TouchableWithoutFeedback, Keyboard } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { Image } from "react-native";

export default function Login() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPasswords, setNewPasswords] = useState({ newPassword: "", confirmPassword: "" });

  const BASE_URL = Constants.expoConfig.extra.apiUrl;


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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
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



            <View className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-2xl shadow-pink-200/50">
              <View className="items-center mb-10">
                {mode !== 'login' && (
                  <TouchableOpacity
                    onPress={() => setMode('login')}
                    className="mb-6 w-10 h-10 items-center justify-center bg-white rounded-full border border-slate-100 shadow-sm"
                  >
                    <ArrowLeft size={20} color="#0F172A" />
                  </TouchableOpacity>
                )}
                <Text className="text-3xl font-black text-slate-900 tracking-tighter">
                  {mode === 'login' ? "Welcome." : mode === 'forgot' ? "Recover." : mode === 'verify' ? "Verify." : "Reset."}
                </Text>
                <View className="w-12 h-1 bg-pink-500 rounded-full mb-6" />
                <Text className="text-lg text-slate-500 font-medium mt-2">
                  {mode === 'login' ? "Login with your Email & Password" : "Follow the steps to continue"}
                </Text>
              </View>

              <View className="space-y-5">
                {(mode === 'login' || mode === 'forgot') && (
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</Text>
                    <View className="flex-row items-center bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm shadow-slate-200">
                      <Mail size={18} color="#94a3b8" />
                      <TextInput
                        className="flex-1 ml-3 text-base font-semibold text-slate-900"
                        placeholder="youremail@gmail.com"
                        placeholderTextColor="#cbd5e1"
                        value={formData.email}
                        onChangeText={(t) => setFormData({ ...formData, email: t })}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>
                )}

                {mode === 'login' && (
                  <View>
                    <View className="flex-row justify-between items-center mb-2 mt-5">
                      <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 ">Password</Text>
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

                {mode === 'verify' && (
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">Enter the 6-digit code sent to your email.</Text>
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

                {mode === 'reset' && (
                  <View className="space-y-5">
                    <View className="bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm">
                      <TextInput
                        className="flex-1 font-semibold text-slate-900"
                        placeholder="New Password"
                        secureTextEntry
                        onChangeText={(text) => setNewPasswords({ ...newPasswords, newPassword: text })}
                      />
                    </View>
                    <View className="bg-white h-16 rounded-2xl px-5 border border-slate-100 shadow-sm mt-5">
                      <TextInput
                        className="flex-1 font-semibold text-slate-900"
                        placeholder="Confirm New Password"
                        secureTextEntry
                        onChangeText={(text) => setNewPasswords({ ...newPasswords, confirmPassword: text })}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={
                    mode === 'login' ? handleLogin :
                      mode === 'forgot' ? handleForgotPassword :
                        mode === 'verify' ? handleVerifyOTP : handleResetPassword
                  }
                  activeOpacity={0.8}
                  className="bg-slate-900 h-16 rounded-md items-center justify-center flex-row shadow-lg shadow-slate-400 mt-4"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white text-lg font-bold mr-2" numberOfLines={1}>
                        {mode === 'login' ? "Login" : mode === 'forgot' ? "Send OTP" : mode === 'verify' ? "Verify OTP" : "Update Password"}
                      </Text>
                      <ChevronRight size={18} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {mode === 'login' && (
                <View className="mt-10 items-center">
                  <TouchableOpacity onPress={() => router.push("/signup")}>
                    <Text className="text-slate-500 font-medium text-base">
                      Dont have an account? <Text className="text-pink-600 font-bold">Sign Up</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>


          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}