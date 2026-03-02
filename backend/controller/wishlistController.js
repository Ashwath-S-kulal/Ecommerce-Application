import { Wishlist } from "../models/wishlistModel.js";
import { Product } from "../models/productModel.js";

export const getWishlist = async (req, res) => {
  try {
    const userId = req.id;

    const wishlist = await Wishlist.findOne({ userId }).populate(
      "items.productId",
    );
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        wishlist: { items: [] },
      });
    }
    res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        items: [{ productId }],
      });
    } else {
      const exists = wishlist.items.find(
        (item) => item.productId.toString() === productId,
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Product already in wishlist",
        });
      }

      wishlist.items.push({ productId });
    }

    await wishlist.save();
    wishlist = await wishlist.populate("items.productId");

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    await wishlist.save();
    wishlist = await wishlist.populate("items.productId");

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
