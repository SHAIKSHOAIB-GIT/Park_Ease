const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret123";

/* AUTH */
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

/* ================= REPORT DATA ================= */

/*
Query params:
- from
- to
- slotId
- segment = day | week | user
*/
router.get("/reports", auth, adminOnly, async (req, res) => {
  const { from, to, slotId, segment } = req.query;

  const filter = {};
  if (from && to) {
    filter.createdAt = {
      $gte: new Date(from),
      $lte: new Date(to)
    };
  }
  if (slotId) filter.slotId = slotId;

  const bookings = await Booking.find(filter)
    .populate("slotId")
    .populate("userId");

  const totalBookings = bookings.length;
  const totalHours = bookings.reduce((s, b) => s + b.hours, 0);
  const avgDuration = totalBookings
    ? (totalHours / totalBookings).toFixed(2)
    : 0;

  /* PEAK HOUR */
  const hourMap = {};
  bookings.forEach(b => {
    const h = new Date(b.startTime).getHours();
    hourMap[h] = (hourMap[h] || 0) + 1;
  });

  const peakHour = Object.keys(hourMap).length
    ? Object.keys(hourMap).reduce((a, b) =>
        hourMap[a] > hourMap[b] ? a : b
      )
    : "-";

  /* SEGMENTATION */
  let segmentData = {};
  if (segment === "day") {
    bookings.forEach(b => {
      const d = new Date(b.createdAt).toLocaleDateString();
      segmentData[d] = (segmentData[d] || 0) + 1;
    });
  }

  if (segment === "week") {
    bookings.forEach(b => {
      const w = `Week ${Math.ceil(
        new Date(b.createdAt).getDate() / 7
      )}`;
      segmentData[w] = (segmentData[w] || 0) + 1;
    });
  }

  if (segment === "user") {
    bookings.forEach(b => {
      const role = b.userId.role;
      segmentData[role] = (segmentData[role] || 0) + 1;
    });
  }

  res.json({
    summary: { totalBookings, avgDuration, peakHour },
    segmentData,
    bookings
  });
});

/* ================= CSV EXPORT ================= */

router.get("/reports/export", auth, adminOnly, async (req, res) => {
  const { from, to, slotId } = req.query;

  const filter = {};
  if (from && to) {
    filter.createdAt = {
      $gte: new Date(from),
      $lte: new Date(to)
    };
  }
  if (slotId) filter.slotId = slotId;

  const bookings = await Booking.find(filter)
    .populate("slotId")
    .populate("userId");

  let csv =
    "User,Role,Slot,City,Area,Hours,Amount,Payment,Status,Date\n";

  bookings.forEach(b => {
    csv += `${b.userId.email},${b.userId.role},${b.slotId.slotNo},${b.slotId.city},${b.slotId.area},${b.hours},${b.amount},${b.paymentMethod},${b.status},${b.createdAt.toISOString()}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=parking-report.csv"
  );
  res.send(csv);
});
router.get("/reports/monthly", async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      startTime: { $gte: start, $lte: end }
    }).populate("slotId");

    const byCity = {};
    const byArea = {};
    let revenue = 0;

    bookings.forEach(b => {
      revenue += b.amount || 0;
      if (b.slotId) {
        byCity[b.slotId.city] = (byCity[b.slotId.city] || 0) + 1;
        byArea[b.slotId.area] = (byArea[b.slotId.area] || 0) + 1;
      }
    });

    res.json({
      totalBookings: bookings.length,
      totalRevenue: revenue,
      byCity,
      byArea
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
