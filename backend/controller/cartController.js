import {Cart} from "../models/cartModel.js"
import { Product } from '../models/productModel.js';

export const getCart = async (req, res) => {
    try {
        const userId= req.id;

        const cart= await Cart.findOne({ userId }).populate('items.productId');

        if(!cart){
            return res.json({ 
                success: true,
                cart: [],
            });
        }

        res.status(200).json({
            success: true,
            cart
        });
        
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message,
        });
    }
}

export const addToCart = async (req, res) => {
    try {
        const userId = req.id;
        const { productId } = req.body;

        if (!userId) throw new Error("User ID is missing from request");

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const priceToUse = product.productPrice || 0; // Fallback to 0 if price is missing
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ productId, quantity: 1, price: priceToUse }],
                totalPrice: priceToUse,
            });
        } else {
            const itemIndex = cart.items.findIndex(
                (item) => item.productId?.toString() === productId
            );

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1;
            } else {
                cart.items.push({ productId, quantity: 1, price: priceToUse });
            }

            // REFIXED: Added ,0 and optional chaining for price
            cart.totalPrice = cart.items.reduce((acc, item) => {
                const itemPrice = item.price || 0;
                return acc + (itemPrice * item.quantity);
            }, 0);
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate('items.productId');
        res.status(200).json({
            success: true,
            message: 'Product added to cart successfully',
            cart: populatedCart,
        });      
        
    } catch (error) {
        console.error("SERVER CRASH:", error.message); // This shows in your terminal
        return res.status(500).json({ 
            success: false,
            message: error.message,
        });
    }
}

export const updateQuantity = async (req, res) => {
    try {
        const userId= req.id;
        const { productId, type } = req.body;

        let cart = await Cart.findOne({ userId });

        if(!cart){
            return res.status(404).json({ 
                success: false,
                message: 'Cart not found',
            });
        }
        const item = cart.items.find(
            item => item.productId.toString() === productId
        );

        if(!item){
            return res.status(404).json({ 
                success: false,
                message: 'Product not found in cart',
            });
        }
        if (type === "increase") {
            item.quantity += 1;
        } 
         if (type === "decrease" && item.quantity > 1) {
            item.quantity -= 1;
        }

        // recalculate total price
        cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        await cart.save();

        cart = await cart.populate('items.productId');
        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cart,
        });
        
    } catch (error) {
          return res.status(500).json({ 
            success: false,
            message: error.message,
        });
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const userId= req.id;
        const { productId } = req.body;

        let cart = await Cart.findOne({ userId });

        if(!cart){
            return res.status(404).json({ 
                success: false,
                message: 'Cart not found',
            });
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );
        // recalculate total price
        cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        cart = await cart.populate('items.productId');

        await cart.save();
        res.status(200).json({
            success: true,
            message: 'Product removed from cart successfully',
            cart,
        });
        
    } catch (error) {
          return res.status(500).json({ 
            success: false,
            message: error.message,
        });
    }
}