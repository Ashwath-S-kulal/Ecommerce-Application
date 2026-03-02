import { Notification } from "../models/notification.model.js";
import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";

export const createOrder = async (req, res) => {
  try {
    const { products, address } = req.body;
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products in order",
      });
    }
    if (
      !address ||
      !address.fullName ||
      !address.phone ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zip
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete address is required",
      });
    }

    let subtotal = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.productPrice == null) {
        return res.status(400).json({
          success: false,
          message: "Product price missing",
        });
      }

      subtotal += product.productPrice * item.quantity;
    }

    const shipping = subtotal > 5000 ? 0 : 50;
    const tax = Number((subtotal * 0.0).toFixed(2));
    const totalAmount = subtotal + shipping + tax;

    const order = await Order.create({
      user: userId,
      products,
      address,
      amount: totalAmount,
      subtotal,
      tax,
      shipping,
      status: "Pending",
    });

    const newOrder = await Order.create(order);

    await Notification.create({
      orderId: newOrder._id,
      message: `New Order Received! Order #${newOrder._id.toString().slice(-6)} needs processing.`,
      receiverRole: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email") 
      .populate("products.productId", "productName productPrice productImg")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET ALL ORDERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.id; // from auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const orders = await Order.find({ user: userId })
      .populate("products.productId", "productName productPrice productImg") // <-- use the correct field name
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET USER ORDERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate({
        path: "products.productId",
        select: "productName productImg productPrice category",
      })
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.status === "Cancelled")
      return res
        .status(400)
        .json({ success: false, message: "Order already cancelled" });

    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const diffInHours = (currentDate - orderDate) / (1000 * 60 * 60);

    if (diffInHours > 48) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cancellation window (48h) has expired",
        });
    }

    order.status = "Cancelled";
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
