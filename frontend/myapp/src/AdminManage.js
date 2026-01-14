import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminManage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Bearer ${token}` };

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [slots, setSlots] = useState([]);

  const [cityName, setCityName] = useState("");
  const [areaForm, setAreaForm] = useState({ city: "", name: "" });
  const [slotForm, setSlotForm] = useState({
    city: "",
    area: "",
    slotNo: "",
    pricePerHour: ""
  });

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    fetchCities();
    fetchAreas();
    fetchSlots();
  }, []);

  /* ---------------- API ---------------- */
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
    const res = await fetch("http://localhost:5000/admin/slots", { headers: auth });
    setSlots(await res.json());
  };

  /* ---------------- CITY ---------------- */
  const addCity = async () => {
    if (!cityName.trim()) return;
    await fetch("http://localhost:5000/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ name: cityName })
    });
    setCityName("");
    fetchCities();
  };

  const removeCity = async (name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await fetch(`http://localhost:5000/admin/cities/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: auth
    });
    fetchCities();
    fetchAreas();
    fetchSlots();
  };

  /* ---------------- AREA ---------------- */
  const addArea = async () => {
    if (!areaForm.city || !areaForm.name) return;
    await fetch("http://localhost:5000/admin/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(areaForm)
    });
    setAreaForm({ city: "", name: "" });
    fetchAreas();
  };

  const removeArea = async (city, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await fetch(
      `http://localhost:5000/admin/areas/${encodeURIComponent(city)}/${encodeURIComponent(name)}`,
      { method: "DELETE", headers: auth }
    );
    fetchAreas();
    fetchSlots();
  };

  /* ---------------- SLOT ---------------- */
  const addSlot = async () => {
    if (!slotForm.city || !slotForm.area || !slotForm.slotNo || !slotForm.pricePerHour) return;

    await fetch("http://localhost:5000/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        city: slotForm.city,
        area: slotForm.area,
        slotNo: slotForm.slotNo,
        pricePerHour: Number(slotForm.pricePerHour)
      })
    });

    setSlotForm({ city: "", area: "", slotNo: "", pricePerHour: "" });
    fetchSlots();
  };

  const toggleSlot = async (id) => {
    await fetch(`http://localhost:5000/admin/slots/${id}/toggle`, {
      method: "PUT",
      headers: auth
    });
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

  /* ---------------- UI ---------------- */
  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h3>Admin</h3>
        <button onClick={() => navigate("/admin")}>Dashboard</button>
        <button className="active">Manage</button>
        <button onClick={() => navigate("/admin/reports")}>Reports</button>
        <hr />
        <button
          className="logout"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </aside>

      {/* CONTENT */}
      <main className="admin-content">

        <h2>System Management</h2>

        {/* CITY */}
        <div className="card">
          <h3>Add City</h3>
          <input value={cityName} onChange={e => setCityName(e.target.value)} placeholder="City name" />
          <button onClick={addCity}>Add City</button>

          <div className="list">
           <div className="dropdown-row">
  <select id="deleteCity">
    <option value="">Select City to Delete</option>
    {cities.map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>

  <button
    className="icon-delete"
    onClick={() => {
      const city = document.getElementById("deleteCity").value;
      if (!city) return;
      removeCity(city);
    }}
  >
    🗑
  </button>
</div>

          </div>
        </div>

        {/* AREA */}
        <div className="card">
          <h3>Add Area</h3>
          <select value={areaForm.city} onChange={e => setAreaForm({ ...areaForm, city: e.target.value })}>
            <option value="">City</option>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={areaForm.name} onChange={e => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="Area name" />
          <button onClick={addArea}>Add Area</button>

         <div className="dropdown-row">
  <select id="deleteArea">
    <option value="">Select Area to Delete</option>
    {areas.map(a => (
      <option key={a._id} value={`${a.city}|${a.name}`}>
        {a.city} → {a.name}
      </option>
    ))}
  </select>

  <button
    className="icon-delete"
    onClick={() => {
      const val = document.getElementById("deleteArea").value;
      if (!val) return;
      const [city, name] = val.split("|");
      removeArea(city, name);
    }}
  >
    🗑
  </button>
</div>

        </div>

        {/* SLOT */}
        <div className="card">
          <h3>Add Slot</h3>
          <div className="grid-4">
            <select value={slotForm.city} onChange={e => setSlotForm({ ...slotForm, city: e.target.value })}>
              <option value="">City</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>

            <select value={slotForm.area} onChange={e => setSlotForm({ ...slotForm, area: e.target.value })}>
              <option value="">Area</option>
              {areas.filter(a => a.city === slotForm.city).map(a => <option key={a._id}>{a.name}</option>)}
            </select>

            <input placeholder="Slot No" value={slotForm.slotNo} onChange={e => setSlotForm({ ...slotForm, slotNo: e.target.value })} />
            <input type="number" placeholder="₹/hr" value={slotForm.pricePerHour} onChange={e => setSlotForm({ ...slotForm, pricePerHour: e.target.value })} />
          </div>

          <button onClick={addSlot}>Add Slot</button>
        </div>

        {/* SLOT LIST */}
        <div className="slot-grid">
          {slots.map(s => (
            <div key={s._id} className={`slot-card ${!s.isEnabled ? "disabled" : ""}`}>
              <h4>{s.slotNo}</h4>
              <p>{s.city} • {s.area}</p>
              <p>₹ {s.pricePerHour}/hr</p>

              <div className="actions">
                <button onClick={() => toggleSlot(s._id)}>
                  {s.isEnabled ? "Disable" : "Enable"}
                </button>
                <button className="btn-remove" onClick={() => removeSlot(s._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
