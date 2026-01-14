const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema({
  city: String,
  name: String
});

/* ✅ SAME AREA NAME CAN EXIST IN DIFFERENT CITIES,
   ❌ BUT NOT TWICE IN SAME CITY */
AreaSchema.index({ city: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Area", AreaSchema);
