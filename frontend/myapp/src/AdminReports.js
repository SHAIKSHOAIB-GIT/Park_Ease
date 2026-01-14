import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminReports.css";

export default function AdminReports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Bearer ${token}` };

  const [bookings, setBookings] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filterCity, setFilterCity] = useState("");
const [filterArea, setFilterArea] = useState("");
const [minAmount, setMinAmount] = useState("");
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [monthly, setMonthly] = useState(null);




  const [search, setSearch] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState("");

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    fetchBookings();
    fetchCities();
    fetchAreas();
}, [filterCity, filterArea, minAmount, fromDate, toDate]);
useEffect(() => {
  const loadMonthly = async () => {
    const res = await fetch("http://localhost:5000/admin/reports/monthly", {
      headers: auth
    });
    const data = await res.json();
    setMonthly(data);
  };
  loadMonthly();
}, []);



  const fetchBookings = async () => {
  const params = new URLSearchParams();

  if (filterCity) params.append("city", filterCity);
  if (filterArea) params.append("area", filterArea);
  if (minAmount) params.append("minAmount", minAmount);
  if (fromDate) params.append("from", fromDate);
  if (toDate) params.append("to", toDate);

  const res = await fetch(
    `http://localhost:5000/admin/bookings?${params.toString()}`,
    { headers: auth }
  );

  const data = await res.json();
  setBookings(data);
};


  const fetchCities = async () => {
    const res = await fetch("http://localhost:5000/admin/cities", {
      headers: auth
    });
    setCities(await res.json());
  };

  const fetchAreas = async () => {
    const res = await fetch("http://localhost:5000/admin/areas", {
      headers: auth
    });
    setAreas(await res.json());
  };

  /* ---------------- CANCEL BOOKING ---------------- */
  const cancelBooking = async () => {
    if (!reason.trim()) {
      alert("Cancellation reason required");
      return;
    }

    await fetch(
      `http://localhost:5000/admin/bookings/${cancelId}/cancel`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...auth
        },
        body: JSON.stringify({ reason })
      }
    );

    setCancelId(null);
    setReason("");
    fetchBookings();
  };

  /* ---------------- DELETE CITY / AREA ---------------- */
  const removeCity = async (name) => {
    if (!window.confirm(`Delete city "${name}"?`)) return;
    await fetch(
      `http://localhost:5000/admin/cities/${encodeURIComponent(name)}`,
      { method: "DELETE", headers: auth }
    );
    fetchCities();
    fetchAreas();
    fetchBookings();
  };

  const removeArea = async (city, name) => {
    if (!window.confirm(`Delete area "${name}"?`)) return;
    await fetch(
      `http://localhost:5000/admin/areas/${encodeURIComponent(city)}/${encodeURIComponent(name)}`,
      { method: "DELETE", headers: auth }
    );
    fetchAreas();
    fetchBookings();
  };

  /* ---------------- FILTER ---------------- */
 const filteredBookings = bookings.filter(b => {
  if (!b.slotId) return false;

  const matchSearch =
    b.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
    b.slotId?.slotNo?.toLowerCase().includes(search.toLowerCase());

  const matchCity =
    !filterCity || b.slotId.city === filterCity;

  const matchArea =
    !filterArea || b.slotId.area === filterArea;

  const matchAmount =
    !minAmount || b.amount >= Number(minAmount);

  const start = new Date(b.startTime).getTime();
  const matchFrom =
    !fromDate || start >= new Date(fromDate).getTime();
  const matchTo =
    !toDate || start <= new Date(toDate).getTime();

  return (
    matchSearch &&
    matchCity &&
    matchArea &&
    matchAmount &&
    matchFrom &&
    matchTo
  );
});



  /* ===================== ANALYTICS (ADDED) ===================== */
  const countBy = (fn) =>
    filteredBookings.reduce((acc, b) => {
      const key = fn(b);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const topValue = (obj) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const peakHour = topValue(
    countBy(b => new Date(b.startTime).getHours() + ":00")
  );

  const topCity = topValue(countBy(b => b.slotId?.city));
  const topArea = topValue(countBy(b => b.slotId?.area));
  const topUser = topValue(countBy(b => b.userId?.email));

  const totalRevenue = filteredBookings.reduce(
    (s, b) => s + (b.amount || 0),
    0
  );

  /* ===================== CSV EXPORT (ADDED) ===================== */
  const exportCSV = () => {
    const header = [
      "User",
      "City",
      "Area",
      "Slot",
      "Start",
      "End",
      "Hours",
      "Amount",
      "Status"
    ];

    const rows = filteredBookings.map(b => [
      b.userId?.email || "-",
      b.slotId?.city || "-",
      b.slotId?.area || "-",
      b.slotId?.slotNo || "-",
      new Date(b.startTime).toLocaleString(),
      new Date(b.endTime).toLocaleString(),
      b.hours,
      b.amount,
      b.status
    ]);

    const csv =
      [header, ...rows]
        .map(r => r.map(x => `"${x}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "parking-report.csv";
    a.click();
  };

  return (
    <div className="admin-report-page">

      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h2>Admin Reports</h2>
          <span>Bookings, cancellations & analytics</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="icon-btn" title="Export CSV" onClick={exportCSV}>
            ⬇
          </button>
          <button className="icon-btn" onClick={() => navigate("/admin")}>
            ←
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        className="search"
        placeholder="Search by user email or slot"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="filter-bar">

  <select value={filterCity} onChange={e => setFilterCity(e.target.value)}>
    <option value="">All Cities</option>
    {cities.map(c => (
      <option key={c.name} value={c.name}>{c.name}</option>
    ))}
  </select>

  <select value={filterArea} onChange={e => setFilterArea(e.target.value)}>
    <option value="">All Areas</option>
    {areas
      .filter(a => !filterCity || a.city === filterCity)
      .map(a => (
        <option key={a._id} value={a.name}>
          {a.city} → {a.name}
        </option>
      ))}
  </select>

  <input
    type="number"
    placeholder="Min Amount ₹"
    value={minAmount}
    onChange={e => setMinAmount(e.target.value)}
  />

  <input
    type="date"
    value={fromDate}
    onChange={e => setFromDate(e.target.value)}
  />

  <input
    type="date"
    value={toDate}
    onChange={e => setToDate(e.target.value)}
  />

</div>


      {/* ANALYTICS */}
      <div className="stats-grid">
        <Stat title="Total Bookings">{filteredBookings.length}</Stat>
        <Stat title="Revenue">₹ {totalRevenue}</Stat>
        <Stat title="Peak Hour">{peakHour}</Stat>
        <Stat title="Top City">{topCity}</Stat>
        <Stat title="Top Area">{topArea}</Stat>
        <Stat title="Top User">{topUser}</Stat>
      </div>

      {/* BOOKINGS TABLE (UNCHANGED) */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Slot</th>
              <th>City</th>
              <th>Area</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => (
              <tr key={b._id}>
                <td>{b.userId?.email}</td>
                <td>{b.slotId?.slotNo}</td>
                <td>{b.slotId?.city}</td>
                <td>{b.slotId?.area}</td>
                <td className={`status ${b.status.toLowerCase()}`}>
                  {b.status}
                </td>
                <td>{b.cancelReason || "-"}</td>
                <td>
                  {b.status === "BOOKED" && (
                    <button
                      className="danger"
                      onClick={() => setCancelId(b._id)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CITY MANAGEMENT (UNCHANGED) */}
      {/* REMOVE CITY */}
{/* <div className="manage-card">
  <h3>Remove City</h3>

  <div className="dropdown-row">
    <select id="removeCitySelect">
      <option value="">Select City</option>
      {cities.map(c => (
        <option key={c.name} value={c.name}>{c.name}</option>
      ))}
    </select>

    <button
      className="icon-delete"
      onClick={() => {
        const city = document.getElementById("removeCitySelect").value;
        if (city) removeCity(city);
      }}
    >
      ✖
    </button>
  </div>
</div> */}


      {/* REMOVE AREA */}
{/* <div className="manage-card">
  <h3>Remove Area</h3>

  <div className="dropdown-row">
    <select id="removeAreaSelect">
      <option value="">Select Area</option>
      {areas.map(a => (
        <option
          key={a._id}
          value={`${a.city}|${a.name}`}
        >
          {a.city} → {a.name}
        </option>
      ))}
    </select>

    <button
      className="icon-delete"
      onClick={() => {
        const val = document.getElementById("removeAreaSelect").value;
        if (!val) return;
        const [city, name] = val.split("|");
        removeArea(city, name);
      }}
    >
      ✖
    </button>
  </div>
</div> */}


      {/* CANCEL MODAL (UNCHANGED) */}
      {cancelId && (
        <div className="modal">
          <div className="modal-card">
            <h3>Cancel Booking</h3>
            <textarea
              placeholder="Enter cancellation reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setCancelId(null)}>Close</button>
              <button className="danger" onClick={cancelBooking}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

       {monthly && (
  <div className="stats-grid">
    <Stat title="This Month Revenue">₹ {monthly.totalRevenue}</Stat>
    <Stat title="This Month Bookings">{monthly.totalBookings}</Stat>
    <Stat title="Top City">
      {Object.entries(monthly.byCity).sort((a,b)=>b[1]-a[1])[0]?.[0]}
    </Stat>
    <Stat title="Top Area">
      {Object.entries(monthly.byArea).sort((a,b)=>b[1]-a[1])[0]?.[0]}
    </Stat>
  </div>
)} 

<div className="card">
  <h3>Bookings by City</h3>

  {monthly && Object.keys(monthly.byCity).length === 0 && (
    <p>No bookings this month</p>
  )}

  {monthly &&
    Object.entries(monthly.byCity).map(([city, count]) => (
      <div key={city} style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{city}</span>
          <b>{count}</b>
        </div>

        <div
          style={{
            height: "10px",
            background: "#e5e7eb",
            borderRadius: "6px",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${count * 15}px`,
              background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
              transition: "0.4s"
            }}
          />
        </div>
      </div>
    ))}
</div>


    </div>
  );
   


  
}

/* ---------------- STAT CARD ---------------- */
const Stat = ({ title, children }) => (
  <div className="stat-card">
    <h4>{title}</h4>
    <p>{children}</p>
  </div>
);
