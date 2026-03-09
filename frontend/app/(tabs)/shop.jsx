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
import { ShoppingCart, Tag, TagIcon, Tags } from "lucide-react-native";

const { width } = Dimensions.get("window");
const BASE_URL = Constants.expoConfig.extra.apiUrl;


export default function Shop() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { products, wishlist } = useSelector((state) => state.product);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceLimit, setPriceLimit] = useState(500000);
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(500000);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState(12);
  const [toastMsg, setToastMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user } = useSelector((state) => state.user);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


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

  const handlePlaceOrder = (product) => {
    if (!user) {
      return Alert.alert("Login Required", "Please login to place an order");
    }
    router.push({
      pathname: "/components/AddressFormSingle",
      params: { productId: product._id, buyNow: true }
    });
  };


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

  const displayProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesPrice = p.productPrice <= priceLimit;
      return matchesPrice;
    });
  }, [products, priceLimit]);


  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [selectedCategory, selectedBrand]);



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



  const fetchProducts = async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/product/getallproducts`, {
        params: {
          page: pageNum,
          limit: 12,
          category: selectedCategory,
          brand: selectedBrand,
        }
      });

      if (res.data.success) {
        if (shouldAppend) {
          dispatch(setProducts([...products, ...res.data.products]));
        } else {
          dispatch(setProducts(res.data.products));
        }
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.log("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };


  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setPriceLimit(maxAvailablePrice);
    setVisibleItems(12);
    setShowSuggestions(false);
    showToast("Filters reset");
  };


  const toggleWishlist = async (productId) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Login Required", "Please login.");
    const isInWishlist = wishlist?.items?.some((item) => item.productId?._id === productId);
    setWishlistLoadingId(productId);
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
    finally {
      setWishlistLoadingId(null);
    }
  };


  const addToCart = async (productId) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return Alert.alert("Login Required", "Please login.");
    setActionLoading({ id: productId, type: 'cart' });
    try {
      const res = await axios.post(`${BASE_URL}/api/cart/add`, { productId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        showToast("Added to Cart");
      }
    } catch (e) { showToast("Failed to add to cart"); }
    finally {
      setActionLoading({ id: null, type: null }); // Stop loading
    }
  };



  const ProductSkeleton = () => (
    <View className="bg-white mx-4 mb-4 p-4 flex-row border border-slate-50 rounded-2xl">
      <View className="w-28 h-28 bg-slate-100 rounded-xl animate-pulse" />
      <View className="flex-1 ml-4 justify-between">
        <View>
          <View className="h-4 w-3/4 bg-slate-100 rounded-lg mb-2 animate-pulse" />
          <View className="h-3 w-1/3 bg-slate-100 rounded-lg animate-pulse" />
        </View>
        <View className="h-5 w-20 bg-slate-100 rounded-lg animate-pulse" />
        <View className="flex-row gap-3 mt-2">
          <View className="flex-1 h-10 bg-slate-50 rounded-xl animate-pulse" />
          <View className="flex-[2] h-10 bg-slate-100 rounded-xl animate-pulse" />
        </View>
      </View>
    </View>
  );


  const handleLoadMore = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8F9FA]">
        <View className="px-6 py-3 bg-white border-b border-gray-100">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 bg-gray-100 h-12 rounded-xl flex-row items-center px-4">
              <View className="w-5 h-5 bg-gray-200 rounded-full" />
              <View className="ml-3 h-4 w-32 bg-gray-200 rounded-md" />
            </View>

            <View className="w-24 h-12 bg-gray-100 rounded-xl" />
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} className="pt-4">
          {[1, 2, 3, 4,5,6,7,8].map((key) => (
            <ProductSkeleton key={key} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      <View className="px-6 py-3 bg-white border-b border-gray-100 z-50">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 bg-gray-100 flex-row items-center px-4 rounded-xl">
            <Feather name="search" size={18} color="#64748b" />
            <TextInput
              placeholder="Search products..."
              className="flex-1 h-12 ml-2 font-semibold text-gray-800"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={handleSearchChange}
              onFocus={() => search.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(""); setShowSuggestions(false); }}>
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
                onPress={() => selectSuggestion(item)} // Now filters the current page
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
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#000" /></View>
      ) : (
        <View className="flex-1">

          {/* ACTIVE FILTERS & RESET ALL BAR */}
          {(selectedCategory !== "All" || selectedBrand !== "All" || priceLimit < maxAvailablePrice) && (
            <View className="px-6 py-2 flex-row items-center justify-between bg-white/50 border-b border-gray-100">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                <View className="flex-row gap-2 items-center">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Active:</Text>
                  {selectedCategory !== "All" && <FilterPill label={selectedCategory} onClear={() => setSelectedCategory("All")} />}
                  {selectedBrand !== "All" && <FilterPill label={selectedBrand} onClear={() => setSelectedBrand("All")} />}
                  {priceLimit < maxAvailablePrice && <FilterPill label={`Under ₹${priceLimit.toLocaleString()}`} onClear={() => setPriceLimit(maxAvailablePrice)} />}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={resetFilters}
                className="ml-4 pl-4 border-l border-gray-200"
              >
                <Text className="text-red-500 font-black text-[10px] uppercase tracking-tighter">Reset All</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 100 }}
            onTouchStart={() => setShowSuggestions(false)}
          >
            <View>
              {displayProducts.length > 0 ? (
                displayProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    item={item}
                    isInWishlist={wishlist?.items?.some((w) => w.productId?._id === item._id)}
                    onWishlist={() => toggleWishlist(item._id)}
                    onAddToCart={() => addToCart(item._id)}
                    onPress={() => router.push(`/product/${item._id}`)}
                    onBuyNow={() => handlePlaceOrder(item)}
                    showToast={showToast}
                    isAddingToCart={actionLoading.id === item._id && actionLoading.type === 'cart'}
                    isWishlistLoading={wishlistLoadingId === item._id}
                  />
                ))
              ) : (
                <View className="w-full py-20 items-center">
                  <Text className="text-gray-400 font-bold">No products found</Text>
                </View>
              )}
            </View>

            {hasMore && (
              <TouchableOpacity
                onPress={handleLoadMore}
                className="mx-3 my-4 py-4 border border-slate-200 rounded-2xl items-center bg-white shadow-sm"
              >
                <Text className="text-black font-black uppercase text-[10px] tracking-widest">
                  {loading ? "Loading..." : "View More Products"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

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
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    className="bg-/50 flex-row border-b-4 border-slate-100 p-4 pt-10"
  >
    <View className="w-32 h-32 bg-slate-50 rounded-xl overflow-hidden">
      <Image
        source={{ uri: item?.productImg?.[0]?.url }}
        className="w-full h-full"
        resizeMode="cover"
      />
    </View>
    <View className="flex-1 ml-4 justify-between">
      <View>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text numberOfLines={1} className="text-md font-bold text-slate-900">
              {item.productName}
            </Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {item.brand || "Premium"}
            </Text>
          </View>
          <TouchableOpacity onPress={onWishlist} disabled={isWishlistLoading} className="p-5">
            {isWishlistLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <FontAwesome
                name={isInWishlist ? "heart" : "heart-o"}
                size={20}
                color={isInWishlist ? "#ef4444" : "#cbd5e1"}
              />
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-black text-black mt-1">
          ₹{item.productPrice.toLocaleString()}
        </Text>
      </View>

      <View className="flex-row gap-5">
        <TouchableOpacity
          onPress={onAddToCart}
          disabled={isAddingToCart}
          className="flex-1 h-10 rounded-md items-center justify-center border border-slate-200 bg-white"
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <ShoppingCart size={16} color="#000" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBuyNow}
          className="flex-[2] h-10 bg-slate-900 rounded-lg flex-row items-center justify-center shadow-sm gap-2"
        >
          <Tag size={13} color="white" />
          <Text className="text-[11px] font-black text-white">
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
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
          <View>
            <Text className="text-2xl font-black uppercase tracking-tight text-slate-900">Filters</Text>
            <TouchableOpacity onPress={onReset} className="mt-1">
              <Text className="text-red-500 font-bold text-[10px] uppercase tracking-widest">Reset All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="bg-slate-100 p-2.5 rounded-full"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#0f172a" />
          </TouchableOpacity>
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


const FilterPill = ({ label, onClear }) => (
  <View className="bg-slate-100 px-3 py-1.5 rounded-full flex-row items-center border border-slate-200">
    <Text className="text-[10px] font-bold text-slate-800 mr-2">{label}</Text>
    <TouchableOpacity onPress={onClear}>
      <Ionicons name="close-circle" size={14} color="#94a3b8" />
    </TouchableOpacity>
  </View>
);