const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  vehicleNo: String,
  carType: String,
  role: { type: String, default: "USER" }
});

module.exports = mongoose.model("User", UserSchema);
