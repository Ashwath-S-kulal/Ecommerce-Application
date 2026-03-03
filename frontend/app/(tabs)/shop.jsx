import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  PanResponder, 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setProducts, setCart, setWishlist } from "../../redux/productSlice";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { debounce } from "lodash"

const { width } = Dimensions.get("window");
const BASE_URL =  Constants.expoConfig.extra.apiUrl;


export default function Shop() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { products, wishlist } = useSelector((state) => state.product);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceLimit, setPriceLimit] = useState(200000);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(200000);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [visibleItems, setVisibleItems] = useState(12);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (query) => {
        if (query.length < 2) {
          setSuggestions([]);
          return;
        }
        try {
          const res = await axios.get(`${BASE_URL}/api/product/search?q=${query}`);
          if (res.data.success) {
            setSuggestions(res.data.products);
          }
        } catch (err) {
          console.error("Suggestion error:", err);
        }
      }, 500),
    []
  );

  const handleSearchChange = (text) => {
    setSearch(text);
    setVisibleItems(12);
    if (text.length > 1) {
      setShowSuggestions(true);
      fetchSuggestions(text);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item) => {
    setSearch(item.productName);
    setShowSuggestions(false);
    router.push(`/product/${item._id}`);
  };

  const showToast = (text) => {
    setToastMsg(text);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(""));
  };

  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const brands = useMemo(() => ["All", ...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/product/getallproducts`);
      if (res.data.success) {
        dispatch(setProducts(res.data.products));
        const max = Math.max(...res.data.products.map((p) => p.productPrice), 0);
        setMaxAvailablePrice(max || 200000);
        setPriceLimit(max || 200000);
      }
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPriceLimit(maxAvailablePrice);
    setVisibleItems(12); 
    showToast("Filters reset");
  };

  const toggleWishlist = async (productId) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Login Required", "Please login.");
    const isInWishlist = wishlist?.items?.some((item) => item.productId?._id === productId);
    try {
      const res = await axios({
        method: isInWishlist ? "delete" : "post",
        url: isInWishlist ? `${BASE_URL}/api/wishlist/remove` : `${BASE_URL}/api/wishlist/add`,
        data: { productId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        dispatch(setWishlist(res.data.wishlist));
        showToast(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
      }
    } catch (e) { showToast("Error updating wishlist"); }
  };

  const addToCart = async (productId) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Login Required", "Please login.");
    try {
      const res = await axios.post(`${BASE_URL}/api/cart/add`, { productId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        showToast("Added to Cart");
      }
    } catch (e) { showToast("Failed to add to cart"); }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.productName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    const matchesPrice = p.productPrice <= priceLimit;
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  });

  const paginatedProducts = filteredProducts.slice(0, visibleItems);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="px-6 py-3 bg-white border-b border-gray-100 z-50">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 bg-gray-100 flex-row items-center px-4 rounded-xl">
            <Feather name="search" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Search products..."
              className="flex-1 h-12 ml-2 font-semibold text-gray-800"
              value={search}
              onChangeText={handleSearchChange}
              onFocus={() => search.length > 1 && setShowSuggestions(true)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => {setSearch(""); setShowSuggestions(false);}}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => setFilterModalVisible(true)} 
            className="border border-gray-200 p-3 rounded-xl flex-row items-center gap-1 bg-white"
          >
            <Feather name="filter" size={13} color="black" />
            <Text className="text-black text-md font-bold">Filters</Text>
          </TouchableOpacity>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View 
            className="absolute top-[60px] left-6 right-6 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden"
            style={{ zIndex: 1000, elevation: 5 }}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => selectSuggestion(item)}
                className="flex-row items-center p-3 border-b border-gray-50 active:bg-gray-50"
              >
                <Image 
                  source={{ uri: item.productImg?.[0]?.url }} 
                  className="w-10 h-10 rounded-lg mr-3 bg-gray-50"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="font-bold text-gray-900 text-[11px]" numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text className="text-pink-500 font-black text-[10px]">
                    ₹{item.productPrice.toLocaleString()}
                  </Text>
                </View>
                <Feather name="arrow-up-left" size={14} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#000" /></View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="px-4 pt-4"
          onTouchStart={() => setShowSuggestions(false)} 
        >
          <View className="flex-row flex-wrap justify-between ">
            {paginatedProducts.map((item) => (
              <ProductCard
                key={item._id}
                item={item}
                isInWishlist={wishlist?.items?.some((w) => w.productId?._id === item._id)}
                onWishlist={() => toggleWishlist(item._id)}
                onAddToCart={() => addToCart(item._id)}
                onPress={() => router.push(`/product/${item._id}`)}
                showToast={showToast}
              />
            ))}
          </View>

          {visibleItems < filteredProducts.length && (
            <TouchableOpacity 
              onPress={() => setVisibleItems(prev => prev + 12)}
              className="mx-3 my-6 py-4 border border-black rounded-2xl items-center"
            >
              <Text className="text-black font-black uppercase text-xs" numberOfLines={1}>Load More</Text>
            </TouchableOpacity>
          )}
          <View className="pb-24" />
        </ScrollView>
      )}

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onReset={resetFilters}
        categories={categories}
        brands={brands}
        selectedCategory={selectedCategory}
        setSelectedCategory={(val) => { setSelectedCategory(val); setVisibleItems(12); }}
        selectedBrand={selectedBrand}
        setSelectedBrand={(val) => { setSelectedBrand(val); setVisibleItems(12); }}
        priceLimit={priceLimit}
        setPriceLimit={(val) => { setPriceLimit(val); setVisibleItems(12); }}
        maxPrice={maxAvailablePrice}
      />
      
      {toastMsg ? (
        <Animated.View 
          style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
          className="absolute bottom-10 self-center bg-black/80 px-6 py-3 rounded-full shadow-lg"
        >
          <Text className="text-white font-bold text-xs tracking-widest">{toastMsg}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}




const ProductCard = ({ item, onWishlist, onAddToCart, isInWishlist, onPress }) => (
  <View style={{ width: width * 0.45 }} className="bg-white rounded-md mb-5 p-2 shadow-sm border border-gray-50">
    <View className="relative bg-white rounded-xl overflow-hidden p-2">
      <TouchableOpacity onPress={onPress} >
        <Image source={{ uri: item?.productImg?.[0]?.url }} className="w-full h-40 rounded-xl" resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onWishlist} className="absolute top-1 right-1 p-2 bg-white shadow-sm rounded-full">
        <FontAwesome name={isInWishlist ? "heart" : "heart-o"} size={18} color={isInWishlist ? "#ec4899" : "#9ca3af"} />
      </TouchableOpacity>
    </View>
    <View className="p-2">
      <Text numberOfLines={1} className="text-[10px] font-bold text-gray-400 uppercase">{item.brand || "Premium"}</Text>
      <Text numberOfLines={1} className="text-[12px] font-black text-gray-900 uppercase">{item.productName}</Text>
      <Text className="text-lg font-black text-black">₹{item.productPrice.toLocaleString()}</Text>
      <TouchableOpacity onPress={onAddToCart} className="bg-black mt-2 py-3 rounded-md items-center">
        <Text className="text-white text-[10px] font-bold uppercase">Add to cart</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PriceSlider = ({ value, max, onValueChange }) => {
    const sliderWidth = width - 80;
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                const moveX = gestureState.moveX - 40; 
                let percentage = moveX / sliderWidth;
                if (percentage < 0) percentage = 0;
                if (percentage > 1) percentage = 1;
                onValueChange(Math.round(percentage * max));
            }
        })
    ).current;

    const currentPos = (value / max) * sliderWidth;

    return (
        <View className="py-6">
            <View className="h-1.5 bg-gray-100 rounded-full w-full relative">
                <View style={{ width: currentPos }} className="h-full bg-black rounded-full" />
                <View 
                    {...panResponder.panHandlers}
                    style={{ left: currentPos - 10 }}
                    className="absolute -top-2 w-6 h-6 bg-white border-2 border-black rounded-full shadow-md" 
                />
            </View>
        </View>
    );
};



const FilterModal = ({ visible, onClose, onReset, categories, brands, selectedCategory, setSelectedCategory, selectedBrand, setSelectedBrand, priceLimit, setPriceLimit, maxPrice }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View className="flex-1 justify-end bg-black/30">
      <Pressable className="flex-1" onPress={onClose} />
      <View className="bg-white rounded-t-[30px] p-8 shadow-2xl">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-xl font-black uppercase">Filters</Text>
          <TouchableOpacity onPress={onReset}><Text className="text-red-500 font-bold text-xs uppercase" numberOfLines={1}>Reset All</Text></TouchableOpacity>
        </View>
        
        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-3">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {categories.map(c => (
            <TouchableOpacity key={c} onPress={() => setSelectedCategory(c)} className={`mr-2 px-5 py-2.5 rounded-xl border ${selectedCategory === c ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
              <Text className={`text-xs font-bold ${selectedCategory === c ? 'text-white' : 'text-gray-500'}`} numberOfLines={1}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-3">Brand</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {brands.map(b => (
            <TouchableOpacity key={b} onPress={() => setSelectedBrand(b)} className={`mr-2 px-5 py-2.5 rounded-xl border ${selectedBrand === b ? 'bg-black border-black' : 'bg-white border-gray-200'}`}>
              <Text className={`text-xs font-bold ${selectedBrand === b ? 'text-white' : 'text-gray-500'}`} numberOfLines={1}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mb-8">
            <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-bold text-gray-400 uppercase">Max Price</Text>
                <Text className="text-lg font-black">₹{priceLimit.toLocaleString()}</Text>
            </View>
            <PriceSlider value={priceLimit} max={maxPrice} onValueChange={setPriceLimit} />
        </View>

        <TouchableOpacity onPress={onClose} className="bg-black py-5 rounded-2xl items-center shadow-lg">
          <Text className="text-white font-black uppercase text-xs tracking-widest">Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);