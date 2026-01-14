const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const User = require("./models/User");
const City = require("./models/City");
const Area = require("./models/Area");
const Slot = require("./models/Slot");
const Booking = require("./models/Booking");
const adminReports = require("./routes/adminReports");



const app = express();
app.use(cors());
app.use(express.json());
app.use("/admin", adminReports);
app.use("/admin", require("./routes/adminReports"));


const JWT_SECRET = "secret123";

/* ---------- DB ---------- */
mongoose
  .connect("mongodb+srv://sam:1234@cluster0.iio2bub.mongodb.net/parking?retryWrites=true&w=majority")
  .then(async () => {
    console.log("MongoDB Connected");
});


/* ---------- MIDDLEWARE ---------- */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  req.user = jwt.verify(token, JWT_SECRET);
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ message: "Admin only" });
  next();
}

/* ---------- AUTH ---------- */
app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.create({ ...req.body, password: hash });
  res.json({ message: "User registered" });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ message: "Invalid user" });

  const ok = await bcrypt.compare(req.body.password, user.password);
  if (!ok) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET
  );

  res.json({ token, role: user.role });
});

/* ---------- CITY ---------- */
app.post("/admin/cities", auth, adminOnly, async (req, res) => {
  const city = await City.create({ name: req.body.name });
  res.json(city);
});

app.get("/admin/cities", auth, adminOnly, async (req, res) => {
  res.json(await City.find());
});

app.delete("/admin/cities/:name", auth, adminOnly, async (req, res) => {
  await City.deleteOne({ name: req.params.name });
  await Area.deleteMany({ city: req.params.name });
  await Slot.deleteMany({ city: req.params.name });
  res.json({ message: "City removed" });
});

/* ---------- AREA ---------- */
app.post("/admin/areas", auth, adminOnly, async (req, res) => {
  const area = await Area.create(req.body);
  res.json(area);
});

app.get("/admin/areas", auth, adminOnly, async (req, res) => {
  res.json(await Area.find());
});

app.delete("/admin/areas/:city/:name", auth, adminOnly, async (req, res) => {
  const { city, name } = req.params;

  await Area.deleteOne({ city, name });
  await Slot.deleteMany({ city, area: name });

  res.json({ message: "Area and related slots removed" });
});


/* ---------- SLOT ---------- */
app.post("/admin/slots", auth, adminOnly, async (req, res) => {
  const { city, area, slotNo, pricePerHour } = req.body;

  if (!city || !area || !slotNo) {
    return res.status(400).json({ message: "Missing slot fields" });
  }

  const cityExists = await City.findOne({ name: city });
  if (!cityExists)
    return res.status(400).json({ message: "City does not exist" });

  const areaExists = await Area.findOne({ city, name: area });
  if (!areaExists)
    return res.status(400).json({ message: "Area does not belong to city" });

  const duplicate = await Slot.findOne({ city, area, slotNo });
  if (duplicate)
    return res.status(400).json({ message: "Slot already exists" });

  const slot = await Slot.create({
    city,
    area,
    slotNo,
    pricePerHour
  });

  res.json(slot);
});





app.get("/admin/slots", auth, adminOnly, async (req, res) => {
  res.json(await Slot.find());
});
/* ================= SLOT CONTROL ================= */

// ENABLE / DISABLE
app.put("/admin/slots/:id/toggle", auth, adminOnly, async (req, res) => {
  const slot = await Slot.findById(req.params.id);

  slot.isEnabled = !slot.isEnabled;

  if (!slot.isEnabled) slot.status = "UNDER_CONSTRUCTION";

  // ❌ DO NOT force status to WORKING
  // leave BUSY untouched

  if (slot.isEnabled && slot.status === "UNDER_CONSTRUCTION") {
    slot.status = "WORKING";
  }

  await slot.save();
  res.json(slot);
});





// CHANGE STATUS
app.put("/admin/slots/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    // Admin override – always allow status change
    slot.status = status;

    // Only booking logic uses isEnabled, not admin logic
    if (status === "UNDER_CONSTRUCTION") {
      slot.isEnabled = false;
    }

    if (status === "WORKING") {
      slot.isEnabled = true;
    }

    if (status === "BUSY") {
      slot.isEnabled = true;   // still enabled but blocked by status
    }

    await slot.save();
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
});





app.delete("/admin/slots/:id", auth, adminOnly, async (req, res) => {
  await Slot.findByIdAndDelete(req.params.id);
  res.json({ message: "Slot removed" });
});

/* ---------- USER SLOT VIEW ---------- */
app.get("/slots", auth, async (req, res) => {
  res.json(await Slot.find());
});

/* ---------- BOOKING ---------- */
app.post("/bookings", auth, async (req, res) => {
  const { slotId, fromTime, toTime, paymentMethod } = req.body;

  // ❌ one active booking per user
  const activeBooking = await Booking.findOne({
    userId: req.user.id,
    status: "BOOKED"
  });

  if (activeBooking) {
    return res.status(400).json({
      message: "You already have an active booking"
    });
  }

  const slot = await Slot.findById(slotId);
  if (!slot || slot.isBooked || !slot.isEnabled) {
    return res.status(400).json({ message: "Slot unavailable" });
  }

  const start = new Date(fromTime);
  const end = new Date(toTime);

  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  const amount = hours * slot.pricePerHour;

  const booking = await Booking.create({
    userId: req.user.id,
    slotId,
    startTime: start,
    endTime: end,
    hours,
    amount,
    paymentMethod,
    status: "BOOKED"
  });

  slot.isBooked = true;
  await slot.save();

  res.json({ booking, payment: "SUCCESS (MOCK)" });
});


app.put("/bookings/:id/extend", auth, async (req, res) => {
  const { extraHours } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.status !== "BOOKED")
    return res.status(400).json({ message: "Cannot extend" });

  const slot = await Slot.findById(booking.slotId);

  booking.hours += extraHours;
  booking.amount += extraHours * slot.pricePerHour;
  booking.endTime = new Date(
    booking.endTime.getTime() + extraHours * 60 * 60 * 1000
  );

  booking.status = "EXTENDED";
  await booking.save();

  res.json({ message: "Extended", booking });
});



app.put("/bookings/:id/cancel", auth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking || booking.status !== "BOOKED") {
    return res.status(400).json({ message: "Cannot cancel" });
  }

  booking.status = "CANCELLED";
  await booking.save();

  const slot = await Slot.findById(booking.slotId);
  if (slot) {
    slot.isBooked = false;
    await slot.save();
  }

  res.json({ message: "Booking cancelled" });
});


app.get("/bookings/my", auth, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id })
    .populate("slotId");
  res.json(bookings);
});

app.get("/admin/bookings", auth, adminOnly, async (req, res) => {
 const { city, area, minAmount, from, to } = req.query;

  const query = {};

  if (city) query["slotId.city"] = city;
  if (area) query["slotId.area"] = area;
  if (minAmount) query.amount = { $gte: Number(minAmount) };

  if (from || to) {
    query.startTime = {};
    if (from) query.startTime.$gte = new Date(from);
    if (to) query.startTime.$lte = new Date(to);
  }

  const bookings = await Booking.find(query)
    .populate("userId")
    .populate("slotId");

  res.json(bookings);
});




/* ---------- AUTOMATIC BOOKING COMPLETION ---------- */
setInterval(async () => {
  const now = new Date();

  const expired = await Booking.find({
    status: "BOOKED",
    endTime: { $lte: now }
  });

  for (let b of expired) {
    b.status = "COMPLETED";
    await b.save();

    const slot = await require("./models/Slot").findById(b.slotId);
    if (slot) {
      slot.isBooked = false;
      await slot.save();
    }
  }
}, 60 * 1000); // every 1 minute

/* ---------- SERVER ---------- */
app.listen(5000, () => console.log("Server running on port 5000"));
