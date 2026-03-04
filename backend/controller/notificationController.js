import { Notification } from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .populate("recipient", "fullname email profilePic role")
      .populate({
        path: "orderId",
        populate: [
          {
            path: "user",
            select: "fullname email profilePic phone",
          },
          {
            path: "products.productId",
            select: "productName productImg price",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments();

    res.status(200).json({
      success: true,
      notifications,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
      totalNotifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and update the notification
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }, // Return the updated document
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    // req.user.id comes from your auth middleware (JWT)
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
