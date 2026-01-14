import { useEffect, useState } from "react";
import "./UserDashboard.css";

export default function UserDashboard() {
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Bearer ${token}` };

  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  const [showPay, setShowPay] = useState(false);
  const [paySlot, setPaySlot] = useState(null);
  const [method, setMethod] = useState("UPI");

  const now = new Date();

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    fetchSlots();
    fetchBookings();
    const interval = setInterval(() => setBookings(b => [...b]), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSlots = async () => {
  const res = await fetch("http://localhost:5000/slots", { headers: auth });
  const data = await res.json();

  // Force default status if backend didn't send it
  const fixed = data.map(s => ({
    ...s,
    status: s.status || "WORKING"
  }));

  setSlots(fixed);
};


  const fetchBookings = async () => {
    const res = await fetch("http://localhost:5000/bookings/my", {
      headers: auth
    });
    const data = await res.json();

    setBookings(
      data
        .filter(b => b.slotId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  };

  /* ---------------- HELPERS ---------------- */
  const hasActiveBooking = bookings.some(
    b => b.status === "BOOKED" && new Date(b.endTime) > now
  );

  const isOverlap = (slotId) => {
    const start = new Date(fromTime);
    const end = new Date(toTime);
    return bookings.some(
      b =>
        b.slotId?._id === slotId &&
        b.status === "BOOKED" &&
        start < new Date(b.endTime) &&
        end > new Date(b.startTime)
    );
  };

  const countdown = (end) => {
    const diff = new Date(end) - now;
    if (diff <= 0) return "Available now";
    const min = Math.ceil(diff / 60000);
    return `Available in ${min} min`;
  };

  /* ---------------- PAYMENT ---------------- */
  const confirmPayment = async () => {
    if (!fromTime || !toTime) {
      alert("Select booking time");
      return;
    }

    if (new Date(fromTime) >= new Date(toTime)) {
      alert("Invalid time range");
      return;
    }

    if (hasActiveBooking) {
      alert("You already have an active booking");
      return;
    }

    if (isOverlap(paySlot._id)) {
      alert("Slot already booked for this time");
      return;
    }

    await fetch("http://localhost:5000/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth
      },
      body: JSON.stringify({
        slotId: paySlot._id,
        fromTime,
        toTime,
        paymentMethod: method
      })
    });

    setShowPay(false);
    setPaySlot(null);
    fetchSlots();
    fetchBookings();
  };

  /* ---------------- FILTER DATA ---------------- */
  const cities = [...new Set(slots.map(s => s.city))];
  const areas = [
    ...new Set(
      slots
        .filter(s => !city || s.city === city)
        .map(s => s.area)
    )
  ];

  const visibleSlots = slots.filter(
    s =>
      (!city || s.city === city) &&
      (!area || s.area === area)
  );
/* ---------------- EXTEND BOOKING ---------------- */
const extendBooking = async (bookingId) => {
  await fetch(`http://localhost:5000/bookings/${bookingId}/extend`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ extraHours: 1 })
  });

  fetchBookings();
};

/* ---------------- CANCEL BOOKING ---------------- */
const cancelBooking = async (bookingId) => {
  if (!window.confirm("Cancel this booking?")) return;

  await fetch(`http://localhost:5000/bookings/${bookingId}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  fetchSlots();
  fetchBookings();
};

  /* ---------------- UI ---------------- */
  return (
    <div className="user-page">

      {/* HEADER */}
      <div className="user-header">
        <div>
          <h2>Smart Parking</h2>
          <span>User Dashboard</span>
        </div>

        <button
          className="logout-icon-btn"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          ⎋
        </button>
      </div>

      {/* FILTERS */}
      <div className="filters">
        <select value={city} onChange={e => {
          setCity(e.target.value);
          setArea("");
        }}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={area} onChange={e => setArea(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>

        <input type="datetime-local" onChange={e => setFromTime(e.target.value)} />
        <input type="datetime-local" onChange={e => setToTime(e.target.value)} />
      </div>

      {/* SLOTS */}
      <h3>Parking Slots</h3>
      <div className="slot-grid">
        {visibleSlots.map(s => {
          const booking = bookings.find(
            b => b.slotId?._id === s._id && b.status === "BOOKED"
          );

          return (
            <div
              key={s._id}
              className={`slot-card
  ${!s.isEnabled || s.status === "UNDER_CONSTRUCTION" || s.status === "BUSY" ? "disabled" : ""}

  ${s.isBooked ? "booked" : ""}
`}

            >
              <h4>{s.slotNo}</h4>
              <p>{s.city} • {s.area}</p>
              <p>₹ {s.pricePerHour}/hr</p>
              {/* SLOT STATUS */}
{s.status === "BUSY" && (
  <p className="status yellow">Temporarily Busy</p>
)}

{s.status === "UNDER_CONSTRUCTION" && (
  <p className="status red">Under Maintenance</p>
)}


              {/* {!s.isEnabled && <p className="status">DISABLED</p>} */}
              {(s.isBooked || s.status === "BUSY") && booking && (
  <p className="status red">
    {countdown(booking.endTime)}
  </p>
)}


              {s.status === "WORKING" && s.isEnabled && !s.isBooked && (
  <button onClick={() => {
    setPaySlot(s);
    setShowPay(true);
  }}>
    Book Slot
  </button>
)}

            </div>
          );
        })}
      </div>

      {/* PAYMENT MODAL */}
      {showPay && paySlot && (
        <div className="modal">
          <div className="modal-card">
            <h3>Payment</h3>

            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>

            <button onClick={confirmPayment}>
              Pay & Book
            </button>

            <button className="cancel" onClick={() => setShowPay(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* HISTORY */}
      <h3>Booking History</h3>

{bookings.map(b => {
  const isActive =
    b.status === "BOOKED" && new Date(b.endTime) > new Date();

  return (
    <div
      key={b._id}
      className={`history ${b.status.toLowerCase()}`}
    >
      <p><b>Slot:</b> {b.slotId?.slotNo || "Removed Slot"}</p>

      <p>
        {new Date(b.startTime).toLocaleString()} →{" "}
        {new Date(b.endTime).toLocaleString()}
      </p>

      <p><b>Status:</b> {b.status}</p>
      <p><b>Amount:</b> ₹ {b.amount}</p>
      <p><b>Payment:</b> {b.paymentMethod}</p>

      {/* ✅ ACTION BUTTONS */}
      {isActive && (
        <div className="history-actions">
          <button
            className="extend-btn"
            onClick={() => extendBooking(b._id)}
          >
            Extend +1 Hr
          </button>

          <button
            className="cancel-btn"
            onClick={() => cancelBooking(b._id)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Admin cancel reason (if any) */}
      {b.cancelReason && (
        <p className="reason">
          <b>Reason:</b> {b.cancelReason}
        </p>
      )}
    </div>
  );
})}

    </div>
  );
}
