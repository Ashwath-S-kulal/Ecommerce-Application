import mongoose from "mongoose";
import cloudinary from "../utils/cloudinary.js";

export const getSystemStorageStatus = async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ success: false, message: "Database connection not ready" });
    }

    const dbStats = await mongoose.connection.db.stats();
    const mongoData = {
      usedMB: (dbStats.storageSize / (1024 * 1024)).toFixed(2),
      collections: dbStats.collections,
      objects: dbStats.objects,
      limitMB: 512,
      percentUsed: ((dbStats.storageSize / (512 * 1024 * 1024)) * 100).toFixed(2)
    };

    let cloudinaryData = null;
    try {
      const usage = await cloudinary.api.usage();
      
      // Cloudinary Free Tier defaults if API doesn't provide them
      const storageUsedBytes = usage.storage?.usage || 0;
      const storageLimitBytes = usage.storage?.limit || (10 * 1024 * 1024 * 1024); // Fallback to 10GB

      cloudinaryData = {
        storage: {
          used: (storageUsedBytes / (1024 * 1024)).toFixed(2) + " MB",
          limit: (storageLimitBytes / (1024 * 1024)).toFixed(2) + " MB",
          percentUsed: usage.storage?.used_percent?.toFixed(2) || 
                       ((storageUsedBytes / storageLimitBytes) * 100).toFixed(2)
        },
        credits: {
          used: usage.credits?.usage || 0,
          limit: usage.credits?.limit || 25,
          percentUsed: usage.credits?.used_percent?.toFixed(2) || "0.00"
        },
        transformations: {
          used: usage.transformations?.usage || 0,
          limit: usage.transformations?.limit || "Unlimited",
          percentUsed: usage.transformations?.used_percent?.toFixed(2) || "0.00"
        }
      };
    } catch (cldError) {
      console.error("Cloudinary Admin API Error:", cldError.message);
      cloudinaryData = { 
        error: "API Limit reached or Secret missing",
        details: cldError.message 
      };
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date(),
      database: mongoData,
      media: cloudinaryData,
    });

  } catch (error) {
    console.error("Internal Status Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};