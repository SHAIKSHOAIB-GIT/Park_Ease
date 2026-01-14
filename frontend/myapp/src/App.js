import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import AdminDashboard from "./AdminDashboard";
import AdminReports from "./AdminReports";
import UserDashboard from "./UserDashboard";
import AdminManage from "./AdminManage";
import "./App.css";

/* ================= ROLE CHECK ================= */
const getRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.role || null;
  } catch {
    return null;
  }
};

/* ================= LOGIN / REGISTER UI ================= */
function LoginUI({
  mode,
  setMode,
  userLogin,
  setUserLogin,
  adminLogin,
  setAdminLogin,
  register,
  setRegister,
  loginUser,
  loginAdmin,
  registerUser,
  msg
}) {
  return (
    <div className="auth-page">

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>Smart Parking System</h1>
          <p>Find, Book & Manage Parking in Seconds</p>
          <div className="hero-features">
            <span>✔ Live Availability</span>
            <span>✔ Time Based Booking</span>
            <span>✔ Secure Payments</span>
          </div>
        </div>

        <div className="hero-right">

          <div className="auth-switch">
            <button onClick={() => setMode("USER_LOGIN")}>Login</button>
            <button onClick={() => setMode("REGISTER")}>Register</button>
            <button onClick={() => setMode("ADMIN_LOGIN")}>Admin</button>
          </div>

          <div className="auth-card">

            {mode === "USER_LOGIN" && (
              <>
                <h3>User Login</h3>
                <input
                  placeholder="Email"
                  value={userLogin.email}
                  onChange={e => setUserLogin({ ...userLogin, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={userLogin.password}
                  onChange={e => setUserLogin({ ...userLogin, password: e.target.value })}
                />
                <button onClick={loginUser}>Login</button>
              </>
            )}

            {mode === "ADMIN_LOGIN" && (
              <>
                <h3>Admin Login</h3>
                <input
                  placeholder="Email"
                  value={adminLogin.email}
                  onChange={e => setAdminLogin({ ...adminLogin, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={adminLogin.password}
                  onChange={e => setAdminLogin({ ...adminLogin, password: e.target.value })}
                />
                <button onClick={loginAdmin}>Login</button>
              </>
            )}

            {mode === "REGISTER" && (
              <>
                <h3>Create Account</h3>
                <input
                  placeholder="Name"
                  value={register.name}
                  onChange={e => setRegister({ ...register, name: e.target.value })}
                />
                <input
                  placeholder="Email"
                  value={register.email}
                  onChange={e => setRegister({ ...register, email: e.target.value })}
                />
                <input
                  placeholder="Phone"
                  value={register.phone || ""}
                  onChange={e => setRegister({ ...register, phone: e.target.value })}
                />
                <input
                  placeholder="Vehicle Number"
                  value={register.vehicleNo || ""}
                  onChange={e => setRegister({ ...register, vehicleNo: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={register.password}
                  onChange={e => setRegister({ ...register, password: e.target.value })}
                />
                <button onClick={registerUser}>Register</button>
              </>
            )}

            {msg && <p className="msg">{msg}</p>}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how">
        <h2>How It Works</h2>
        <div className="steps">
          <div>1️⃣ Login or Register</div>
          <div>2️⃣ Select City & Area</div>
          <div>3️⃣ Pick a Parking Slot</div>
          <div>4️⃣ Pay and Park</div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews">
        <h2>What Users Say</h2>
        <div className="review">
          ⭐⭐⭐⭐⭐ “Saved me a lot of time finding parking” – Rahul
        </div>
        <div className="review">
          ⭐⭐⭐⭐⭐ “Very smooth booking and payments” – Ayesha
        </div>
      </section>

      {/* CONTACT */}
      <footer className="contact">
        <p>📧 support@smartpark.com</p>
        <p>📞 +91 98765 43210</p>
      </footer>

    </div>
  );
}


/* ================= APP ================= */
export default function App() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("USER_LOGIN");
  const [msg, setMsg] = useState("");

  const [userLogin, setUserLogin] = useState({ email: "", password: "" });
  const [adminLogin, setAdminLogin] = useState({ email: "", password: "" });

  const [register, setRegister] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicleNo: "",
    vehicleType: ""
  });

  const loginUser = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userLogin)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate("/user");
    }
  };

  const loginAdmin = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminLogin)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      navigate("/admin");
    }
  };

  const registerUser = async () => {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(register)
    });

    const data = await res.json();
    if (data.success) {
      setMsg("Account created. Login now.");
      setMode("USER_LOGIN");
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <LoginUI
          mode={mode}
          setMode={setMode}
          userLogin={userLogin}
          setUserLogin={setUserLogin}
          adminLogin={adminLogin}
          setAdminLogin={setAdminLogin}
          register={register}
          setRegister={setRegister}
          loginUser={loginUser}
          loginAdmin={loginAdmin}
          registerUser={registerUser}
          msg={msg}
        />
      }/>

      <Route path="/user" element={getRole() === "USER" ? <UserDashboard /> : <Navigate to="/" />} />
      <Route path="/admin" element={getRole() === "ADMIN" ? <AdminDashboard /> : <Navigate to="/" />} />
      <Route path="/admin/reports" element={getRole() === "ADMIN" ? <AdminReports /> : <Navigate to="/" />} />
      <Route path="/admin/manage" element={getRole() === "ADMIN" ? <AdminManage /> : <Navigate to="/" />} />
    </Routes>
  );
}

/* ================= UI STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#1e3a8a,#312e81)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    width: "350px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  title: {
    textAlign: "center",
    marginBottom: "10px"
  },
  switch: {
    display: "flex",
    gap: "8px",
    justifyContent: "center"
  }
  
};
