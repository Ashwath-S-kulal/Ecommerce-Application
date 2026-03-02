import { Address } from "../models/addressModel.js";

export const addAddress = async (req, res) => {
  try {
    const userId = req.id;
    const newAddress = await Address.create({ ...req.body, userId });
    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.id });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId: req.id },
      req.body,
      { new: true },
    );
    if (!updatedAddress)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, address: updatedAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const deletedAddress = await Address.findOneAndDelete({
      _id: addressId,
      userId: req.id,
    });
    if (!deletedAddress)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
