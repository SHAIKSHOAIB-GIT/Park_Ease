const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot" },
  hours: Number,
  amount: Number,

  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  paymentMethod: String, // UPI | CARD
  status: { type: String, default: "BOOKED" } // BOOKED | COMPLETED | CANCELLED
});

module.exports = mongoose.model("Booking", BookingSchema);
