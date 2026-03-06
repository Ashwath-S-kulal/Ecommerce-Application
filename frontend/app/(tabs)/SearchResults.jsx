import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Image, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import Constants from "expo-constants";
import { ShoppingCart, Tag } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL = Constants.expoConfig.extra.apiUrl;
const { width } = Dimensions.get("window");

export default function SearchResults() {
  // Capture 'id' instead of 'query'
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch the single product
        const res = await axios.get(`${BASE_URL}/api/product/getproduct/${id}`);
        
        // If the API returns the product directly in res.data (e.g., res.data.product)
        // We wrap it in an array [product] so FlatList works
        if (res.data && res.data.product) {
          setProducts([res.data.product]); 
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-4">
      <FlatList 
        data={products}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={() => router.push(`/product/${item._id}`)}
          />
        )}
        ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No product found</Text>}
      />
    </SafeAreaView>
  );
}

// Ensure ProductCard receives all necessary props for interaction
const ProductCard = ({
  item,
  onWishlist,
  onAddToCart,
  onBuyNow,
  isInWishlist,
  onPress,
  isAddingToCart,
  isWishlistLoading
}) => (
  <View
    style={{ width: (width - 48) / 2 }}
    className="bg-white rounded-md mb-6 overflow-hidden shadow-md border-2 border-slate-200/50"
  >
    <View className="relative bg-white h-44 items-center justify-center border-b-2 border-slate-200/50">
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="w-full h-full p-5 ">
        <Image
          source={{ uri: item?.productImg?.[0]?.url }}
          className="w-full h-full"
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>

    <View className="px-4 py-3 bg-slate-50/50">
      <Text numberOfLines={1} className="text-[9px] font-black text-slate-400 uppercase tracking-[1.5px]">
        {item.brand || "Premium"}
      </Text>

      <Text numberOfLines={1} className="text-[13px] font-semibold text-slate-900 mt-1">
        {item.productName}
      </Text>

      <Text className="text-base font-black text-black mt-1.5">
        ₹{item.productPrice.toLocaleString()}
      </Text>

    </View>
  </View>
);
