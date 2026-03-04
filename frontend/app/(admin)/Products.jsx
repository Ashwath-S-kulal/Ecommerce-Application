import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Image,
  TouchableOpacity, Modal, ActivityIndicator,
  Alert, Dimensions,
  Platform,
  UIManager,
  LayoutAnimation
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package, Search, ArrowUpDown, Edit,
  Trash2, Info, IndianRupee, Tag,
  LayoutGrid, X, Plus, Image as ImageIcon
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { setProducts } from '@/redux/productSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Constants from "expo-constants";
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_URL = Constants.expoConfig.extra.apiUrl;
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminProduct() {
  const { products } = useSelector((store) => store?.product);
  const [editProduct, setEditProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [sortOrder, setSortOrder] = useState("recent");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const [deletingId, setDeletingId] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setIsUpdating(true);
      try {
        const processedImages = await Promise.all(
          result.assets.map(async (asset) => {
            const manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 1000 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );

            return {
              uri: manipResult.uri,
              name: asset.fileName || `update_${Date.now()}.jpg`,
              type: 'image/jpeg',
              isNew: true
            };
          })
        );

        setEditProduct(prev => ({
          ...prev,
          productImg: [...prev.productImg, ...processedImages]
        }));
      } catch (error) {
        Alert.alert("Error", "Failed to process images.");
        console.log(error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...editProduct.productImg];
    updatedImages.splice(index, 1);
    setEditProduct({ ...editProduct, productImg: updatedImages });
  };


  const handleSave = async () => {
    if (!editProduct.productName || !editProduct.productPrice) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    Alert.alert(
      "Confirm Changes",
      "Are you sure you want to save these changes to the product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            setIsUpdating(true);
            const formData = new FormData();
            formData.append("productName", editProduct.productName);
            formData.append("productDesc", editProduct.productDesc);
            formData.append("productPrice", editProduct.productPrice);
            formData.append("category", editProduct.category);

            const existingImages = editProduct.productImg
              .filter(img => !img.isNew && img.public_id)
              .map(img => img.public_id);
            formData.append("existingImages", JSON.stringify(existingImages));

            editProduct.productImg
              .filter(img => img.isNew)
              .forEach((file) => {
                formData.append("files", {
                  uri: file.uri,
                  name: file.name,
                  type: file.type,
                });
              });

            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const res = await axios.put(`${BASE_URL}/api/product/update/${editProduct._id}`, formData, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'multipart/form-data'
                }
              });

              if (res.data.success) {
                const updatedList = products.map((item) =>
                  item._id === editProduct._id ? res.data.product : item
                );
                dispatch(setProducts(updatedList));

                Alert.alert("Success", "Product updated successfully");
                setModalVisible(false);
              }
            } catch (e) {
              console.log("Update Error:", e.response?.data || e.message);
              Alert.alert("Error", "Failed to update product");
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const filteredProducts = (products || [])
    .filter((p) => p.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "lowToHigh") return a.productPrice - b.productPrice;
      if (sortOrder === "highToLow") return b.productPrice - a.productPrice;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });



  const handleDelete = (productId, productName) => {
    Alert.alert(
      "Confirm Removal",
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(productId);
            try {
              const accessToken = await AsyncStorage.getItem("accessToken");
              const res = await axios.delete(`${BASE_URL}/api/product/delete/${productId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });

              if (res.data.success) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                dispatch(setProducts(products.filter(p => p._id !== productId)));
              }
            } catch (e) {
              console.log("Delete Error:", e.message);
              Alert.alert("Error", "Could not delete from server");
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f9fafb]">
      <View className="p-4">
        <View className="mb-6">
          <View className="flex-row items-center gap-2" numberOfLines={1}>
            <Text className="text-2xl font-black text-slate-900 tracking-tighter">
              Sanjeevini Products
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 relative justify-center">
            <View className="absolute left-3 z-10"><Search size={16} color="#64748b" /></View>
            <TextInput
              placeholder="Search products..."
               placeholderTextColor="#94a3b8"
              className="bg-white border border-slate-100 rounded-md h-12 pl-10 pr-4 shadow-sm"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="relative ">
            <TouchableOpacity
              onPress={() => setShowSortDropdown(!showSortDropdown)}
              className="flex-row items-center bg-white border border-slate-200 px-4 h-12 rounded-md shadow-sm" numberOfLines={1}
            >
              <ArrowUpDown size={16} color="#64748b" />
              <Text className="ml-2 text-slate-600 font-semibold text-sm" numberOfLines={1}>
                {sortOrder === "recent"
                  ? "Recent"
                  : sortOrder === "lowToHigh"
                    ? "Low to High"
                    : "High to Low"}
              </Text>
            </TouchableOpacity>

            {showSortDropdown && (
              <View className="absolute top-14 right-0 bg-white border border-slate-200 rounded-xl shadow-md w-40 z-20">

                <TouchableOpacity
                  onPress={() => {
                    setSortOrder("recent");
                    setShowSortDropdown(false);
                  }}
                  className="px-4 py-3 border-b border-slate-100"
                >
                  <Text className="text-slate-700">Recent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSortOrder("lowToHigh");
                    setShowSortDropdown(false);
                  }}
                  className="px-4 py-3 border-b border-slate-100"
                >
                  <Text className="text-slate-700">Low to High</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSortOrder("highToLow");
                    setShowSortDropdown(false);
                  }}
                  className="px-4 py-3"
                >
                  <Text className="text-slate-700">High to Low</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-20 ">
          <View className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mb-20">
            {filteredProducts.map((product, index) => (
              <View
                key={product._id}
                className={`p-4 ${index !== filteredProducts.length - 1
                  ? "border-b border-slate-200"
                  : ""
                  }`}
              >
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => router.push(`/product/${product._id}`)}
                  >
                    <Image
                      source={{ uri: product?.productImg[0]?.url }}
                      className="w-14 h-14 rounded-xl bg-slate-100"
                    />
                  </TouchableOpacity>

                  <View className="flex-1 ml-4">
                    <Text
                      className="font-bold text-slate-900"
                      numberOfLines={1}
                    >
                      {product.productName}
                    </Text>
                    <Text className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                      {product.category}
                    </Text>
                  </View>

                  <Text className="font-black text-slate-900">
                    ₹{product.productPrice}
                  </Text>
                </View>

                <View className="flex-row justify-end mt-4 gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setEditProduct(product);
                      setModalVisible(true);
                    }}
                    className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <Edit size={14} color="#3b82f6" />
                    <Text className="ml-2 text-blue-500 font-semibold">
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      handleDelete(product._id, product.productName)
                    }
                    className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
                  >
                    {deletingId === product._id ? (
                      <ActivityIndicator color="#ef4444" />
                    ) : (
                      <Trash2 size={14} color="#ef4444" />
                    )}
                    <Text className="ml-2 text-red-500 font-semibold">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-900" numberOfLines={1}>Edit Product</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-y-5">
                <View>
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Product Gallery</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <TouchableOpacity onPress={pickImage} className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl items-center justify-center mr-3">
                      <Plus size={24} color="#94a3b8" />
                    </TouchableOpacity>
                    {editProduct?.productImg?.map((img, idx) => (
                      <View key={idx} className="relative mr-3">
                        <Image source={{ uri: img.uri || img.url }} className="w-24 h-24 rounded-3xl border border-slate-100" />
                        <TouchableOpacity onPress={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white">
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <LabelInput label="Product Name" icon={<Info size={12} color="#94a3b8" />} value={editProduct?.productName} onChangeText={(t) => setEditProduct({ ...editProduct, productName: t })} />

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <LabelInput label="Price" icon={<IndianRupee size={12} color="#94a3b8" />} value={editProduct?.productPrice?.toString()} keyboardType="numeric" onChangeText={(t) => setEditProduct({ ...editProduct, productPrice: t })} />
                  </View>
                  <View className="flex-1">
                    <LabelInput label="Category" icon={<Tag size={12} color="#94a3b8" />} value={editProduct?.category} onChangeText={(t) => setEditProduct({ ...editProduct, category: t })} />
                  </View>
                </View>

                <LabelInput label="Description" icon={<LayoutGrid size={12} color="#94a3b8" />} value={editProduct?.productDesc} multiline onChangeText={(t) => setEditProduct({ ...editProduct, productDesc: t })} />

                <TouchableOpacity onPress={handleSave} disabled={isUpdating} className="bg-pink-600 h-16 rounded-xl items-center justify-center mt-4 mb-10 shadow-lg shadow-pink-200">
                  {isUpdating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const LabelInput = ({ label, icon, value, ...props }) => (
  <View className="gap-y-1">
    <View className="flex-row items-center gap-2 ml-1">
      {icon}
      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</Text>
    </View>
    <TextInput
      value={value}
      className={`bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium ${props.multiline ? 'h-32 text-top' : 'h-14'}`}
      placeholderTextColor="#cbd5e1"
      {...props}
    />
  </View>
);