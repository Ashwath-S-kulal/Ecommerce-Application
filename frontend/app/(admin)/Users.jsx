import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, Modal,
  TextInput, ActivityIndicator, Alert, ScrollView, StyleSheet,
  Platform
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../redux/userSlice";
import { Mail, Phone, MapPin, Calendar, Edit2, Trash2, X, Camera, ShieldCheck, Search, Filter } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import Constants from "expo-constants";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // For filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoleFilter, setActiveRoleFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateUser, setUpdateUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.user);
  const BASE_URL = Constants.expoConfig.extra.apiUrl;

  const roleData = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
  ];

  const fetchUsers = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        setError("Missing Access Token");
        return;
      }
      const res = await axios.get(`${BASE_URL}/api/user/alluser`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(res.data.users);
      setFilteredUsers(res.data.users); // Initialize filtered list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = users;

    if (searchQuery) {
      result = result.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeRoleFilter !== "all") {
      result = result.filter(user => user.role === activeRoleFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, activeRoleFilter, users]);

  const handleEditClick = (user) => {
    setUpdateUser({ ...user });
    setUserId(user._id);
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  const handleChange = (name, value) => {
    setUpdateUser((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const formData = new FormData();

      formData.append("firstName", updateUser.firstName);
      formData.append("lastName", updateUser.lastName);
      formData.append("email", updateUser.email);
      formData.append("phoneNo", updateUser.phoneNo || "");
      formData.append("role", updateUser.role);
      formData.append("city", updateUser.city || "");
      formData.append("address", updateUser.address || "");
      formData.append("zipCode", updateUser.zipCode || "");

      if (selectedImage) {
        const uri = selectedImage;
        const fileType = uri.split('.').pop();
        formData.append("file", {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: `profile_${Date.now()}.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });
      }

      const res = await axios.put(`${BASE_URL}/api/user/updateuser/${userId}`, formData, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        // Update local state immediately
        const updatedList = users.map(u => u._id === userId ? res.data.user : u);
        setUsers(updatedList);
        Alert.alert("Success", "Account synchronization complete.");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.log("SERVER ERROR LOG:", err.response?.data);
      Alert.alert("Update Failed", err.response?.data?.message || "Network Error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = (user) => {
    Alert.alert(
      "Confirm Deletion",
      `Delete ${user.firstName}'s account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const res = await axios.delete(`${BASE_URL}/api/user/deleteuser/${user._id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (res.data.success) {
                setUsers((prev) => prev.filter((u) => u._id !== user._id));
                if (currentUser?._id === user._id) {
                  dispatch(setUser(null));
                  await AsyncStorage.removeItem("accessToken");
                }
                setIsModalOpen(false);
              }
            } catch (e) { Alert.alert("Error", "Delete failed"); }
          }
        }
      ]
    );
  };

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <View className="flex-1 bg-[#f8fafc] pt-12">
      <View className="px-6 mb-4 flex-row justify-between items-end">
        <View className="flex-1">
          <Text className="text-4xl font-black text-slate-900 tracking-tight">All Users</Text>
          <Text className="text-slate-500 mt-1">Manage Users and Admins accounts.</Text>
        </View>
        <View className="flex flex-row items-center gap-2 bg-white px-5 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Text className="text-xs text-slate-400 uppercase font-bold" numberOfLines={1}>Total User :</Text>
          <Text className="text-2xl font-bold text-indigo-600">{filteredUsers.length}</Text>
        </View>
      </View>

      {/* --- SEARCH & FILTERS SECTION --- */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-1 shadow-sm mb-3">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search by name or email..."
            className="flex-1 h-10 ml-2 font-medium text-slate-700"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-x-2">
          {['all', 'admin', 'user'].map((role) => (
            <TouchableOpacity
              key={role}
              onPress={() => setActiveRoleFilter(role)}
              className={`px-4 py-2 rounded-md w-20 border flex items-center ${activeRoleFilter === role ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
            >
              <Text numberOfLines={1} className={`text-xs font-bold uppercase tracking-wider ${activeRoleFilter === role ? 'text-white' : 'text-slate-500'}`}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchUsers(); }}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View className="bg-white mx-4 mb-3 p-4 rounded-md border border-slate-100 shadow-sm">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={{ uri: item.profilePic || `https://ui-avatars.com/api/?name=${item.firstName}` }}
                  className="h-14 w-14 rounded-full bg-slate-200"
                />
                <View className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${item.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-sm font-bold text-slate-900">{item.firstName} {item.lastName}</Text>
                <View className="flex-row items-center mt-1">
                  <Mail size={10} color="#94a3b8" />
                  <Text className="text-[11px] text-slate-400 ml-1">{item.email}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleEditClick(item)}
                className="flex-row items-center bg-white border border-slate-200 px-4 py-2 rounded-md"
              >
                <Edit2 size={14} color="#64748b" />
                <Text className="text-[#64748b] text-base font-bold ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 h-[92%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-bold">Edit Profile</Text>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">User ID: {userId}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={20} color="#64748b" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="items-center mb-8">
                <TouchableOpacity onPress={pickImage} className="relative">
                  <Image source={{ uri: selectedImage || updateUser.profilePic || `https://ui-avatars.com/api/?name=${updateUser.firstName}` }} className="h-28 w-28 rounded-[40px] bg-slate-100" />
                  <View className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-4 border-white"><Camera size={18} color="white" /></View>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-x-3 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">First Name</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold" value={updateUser.firstName} onChangeText={(v) => handleChange('firstName', v)} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Last Name</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold" value={updateUser.lastName} onChangeText={(v) => handleChange('lastName', v)} />
                </View>
              </View>

              <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Email Address</Text>
              <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold mb-4" value={updateUser.email} onChangeText={(v) => handleChange('email', v)} />

              <View className="flex-row gap-x-3 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Phone Number</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold" value={updateUser.phoneNo} onChangeText={(v) => handleChange('phoneNo', v)} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Account Role</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={roleData}
                    labelField="label"
                    valueField="value"
                    value={updateUser.role}
                    onChange={item => handleChange('role', item.value)}
                    renderLeftIcon={() => <ShieldCheck size={16} color="#4f46e5" style={{ marginRight: 8 }} />}
                  />
                </View>
              </View>

              <View className="flex-row gap-x-3 mb-4">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">City</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold" value={updateUser.city} onChangeText={(v) => handleChange('city', v)} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Zip Code</Text>
                  <TextInput className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold" value={updateUser.zipCode} onChangeText={(v) => handleChange('zipCode', v)} />
                </View>
              </View>

              <Text className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase">Full Address</Text>
              <TextInput multiline className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-semibold mb-6 h-20 text-start" value={updateUser.address} onChangeText={(v) => handleChange('address', v)} />

              <View className="pb-12">
                <TouchableOpacity onPress={handleSubmit} disabled={isUpdating} className="bg-indigo-600 p-5 rounded-2xl items-center shadow-lg">
                  {isUpdating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteAccount(updateUser)} className="mt-6 flex-row justify-center items-center py-2">
                  <Trash2 size={18} color="#ef4444" />
                  <Text className="text-red-500 font-bold ml-2">Delete Account</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: { height: 58, backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  placeholderStyle: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  selectedTextStyle: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
});

export default AllUsers;