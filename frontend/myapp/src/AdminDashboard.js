import "./AdminDashboard.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Bearer ${token}` };

  const slotRef = useRef(null);
  const bookedRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchCities();
    fetchAreas();
    fetchSlots();
    fetchBookings();
  };

  /* ================= API ================= */

  const fetchCities = async () => {
    const res = await fetch("http://localhost:5000/admin/cities", { headers: auth });
    const data = await res.json();
    setCities(data.map(c => c.name));
  };

  const fetchAreas = async () => {
    const res = await fetch("http://localhost:5000/admin/areas", { headers: auth });
    setAreas(await res.json());
  };

  const fetchSlots = async () => {
    const res = await fetch("http://localhost:5000/admin/slots", {
      headers: { ...auth, "Cache-Control": "no-store" }
    });
    setSlots(await res.json());
  };

  const fetchBookings = async () => {
    const res = await fetch("http://localhost:5000/admin/bookings", { headers: auth });
    const data = await res.json();
    setBookings(data.filter(b => b.slotId));
  };

  /* ================= SLOT CONTROLS ================= */

  const toggleSlot = async (id) => {
    const res = await fetch(`http://localhost:5000/admin/slots/${id}/toggle`, {
      method: "PUT",
      headers: auth
    });
    if (!res.ok) {
      alert("Toggle failed");
      return;
    }
    fetchSlots();
  };

  const updateSlotStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/admin/slots/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      alert("Status update failed");
      return;
    }
    fetchSlots();
  };

  const removeSlot = async (id) => {
    if (!window.confirm("Delete slot?")) return;
    await fetch(`http://localhost:5000/admin/slots/${id}`, {
      method: "DELETE",
      headers: auth
    });
    fetchSlots();
  };

  /* ================= ANALYTICS ================= */

  const totalRevenue = bookings.reduce((s, b) => s + (b.amount || 0), 0);
  const activeSlots = slots.filter(s => !s.isBooked);
const bookedSlots = slots.filter(s => s.isBooked);
const allSlots = slots; // admin sees EVERYTHING


  /* ================= UI ================= */

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">
        <h3>SmartPark</h3>

        <button onClick={() => slotRef.current.scrollIntoView({ behavior: "smooth" })}>
          Parking Slots
        </button>

        <button onClick={() => bookedRef.current.scrollIntoView({ behavior: "smooth" })}>
          Booked Slots
        </button>

        <button onClick={() => navigate("/admin/reports")}>
          Reports
        </button>

        <button onClick={() => navigate("/admin/manage")}>
          Manage
        </button>

        <button
          className="logout"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-content">

        <div className="admin-header">
          <div className="admin-title">
            <h1>Smart Parking</h1>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <div className="stats-grid">
          <Stat title="Revenue">₹ {totalRevenue}</Stat>
          <Stat title="Cities">{cities.length}</Stat>
          <Stat title="Areas">{areas.length}</Stat>
          <Stat title="Slots">{slots.length}</Stat>
        </div>

        {/* ================= FREE SLOTS ================= */}
       <div ref={slotRef}>
  <h2>Parking Slots</h2>

  <div className="slot-grid">
    {slots.map(s => (
      <div
        key={s._id}
        className={`slot-card ${!s.isEnabled ? "disabled" : ""}`}
      >
        <h4>{s.slotNo}</h4>
        <p>{s.city} • {s.area}</p>

        <p className={`status-pill ${s.isEnabled ? "working" : "disabled"}`}>
          {s.isEnabled ? "WORKING" : "UNDER CONSTRUCTION"}
        </p>

        <p>₹ {s.pricePerHour}/hr</p>

        <div className="actions">
          {/* SINGLE TOGGLE BUTTON */}
          <button
            className="btn-toggle"
            onClick={() => toggleSlot(s._id)}
          >
            {s.isEnabled ? "Disable" : "Enable"}
          </button>

          <button
            className="btn-remove"
            onClick={() => removeSlot(s._id)}
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* ================= BOOKED ================= */}
        <div ref={bookedRef}>
          <h2 style={{ color: "#dc2626" }}>Booked Slots</h2>

          <div className="slot-grid">
            {bookedSlots.map(s => {
              const booking = bookings.find(b => b.slotId?._id === s._id);
              return (
                <div key={s._id} className="slot-card booked">
                  <h4>{s.slotNo}</h4>
                  <p>{s.city} • {s.area}</p>

                  {booking && (
                    <div className="user-box">
                      <p><b>User:</b> {booking.userId.email}</p>
                      <p><b>Phone:</b> {booking.userId.phone}</p>
                      <p><b>Vehicle:</b> {booking.userId.vehicleNo}</p>
                      <p><b>Paid:</b> ₹ {booking.amount}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}

const Stat = ({ title, children }) => (
  <div className="stat-card">
    <h4>{title}</h4>
    <p>{children}</p>
  </div>
);
