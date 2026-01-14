const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  city: String,
  area: String,
  slotNo: String,
  pricePerHour: Number,

  isEnabled: { type: Boolean, default: true },
  isBooked: { type: Boolean, default: false },   // ✅ REQUIRED

  status: {
    type: String,
    enum: ["WORKING", "BUSY", "UNDER_CONSTRUCTION"],
    default: "WORKING"
  }
});

SlotSchema.index({ city: 1, area: 1, slotNo: 1 }, { unique: true });

module.exports = mongoose.model("Slot", SlotSchema);
