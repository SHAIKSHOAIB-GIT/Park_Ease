🚗 ParkEase – Smart Parking System [Live Link](http://3.108.53.229:3000/)


# 🚗 ParkEase – Smart Parking System

**ParkEase** is a full-stack **Smart Parking Management System** built using the **MERN stack**  
(**:contentReference[oaicite:0]{index=0}, :contentReference[oaicite:1]{index=1}, :contentReference[oaicite:2]{index=2}, :contentReference[oaicite:3]{index=3}**).

It allows users to **find, book, extend, and cancel parking slots in real time**, while **administrators manage parking infrastructure, pricing, availability, and analytics**.

🎯 *This project simulates a real-world smart parking platform and is ideal for portfolios, internships, and campus placements.*

---

## 🔥 Core Features

### 👤 User Features
- Secure user **registration & login**
- View parking slots by **City** and **Area**
- **Real-time availability** tracking
- Book parking slots for a selected **time range**
- **Cancel or extend** active bookings
- View **booking history**
- Live **slot status updates**

---

### 🛠️ Admin Features
- Secure **admin login**
- Create & manage:
  - Cities  
  - Areas  
  - Parking Slots
- Set **price per hour** for each slot
- **Enable / Disable** parking slots
- Mark slot status as:
  - `WORKING`
  - `BUSY`
  - `UNDER_CONSTRUCTION`
- View analytics:
  - Total revenue
  - Slot usage
  - Active bookings
- Cancel bookings with **reason**
- Export booking reports to **CSV**

---

## 🧩 System Architecture

Frontend (React)
        ↓ REST API
Backend (Node.js + Express)
        ↓
MongoDB Atlas (Cloud Database)

---

## 🛠️ Tech Stack

| Layer           | Technology |
|-----------------|------------|
| Frontend        | React, CSS, React Router |
| Backend         | Node.js, Express.js |
| Database        | MongoDB Atlas |
| Authentication  | JWT |
| Hosting         | :contentReference[oaicite:4]{index=4} |
| Process Manager | PM2 |

---

## 🚦 Slot Status Rules

| Status | isEnabled | User Can Book |
|------|-----------|---------------|
| WORKING | true | ✅ Yes |
| BUSY | true | ❌ No |
| UNDER_CONSTRUCTION | false | ❌ No |

---

## 📊 Booking Rules
- Only **one active booking per user**
- Slot must be:
  - Enabled
  - Not already booked
  - Not under construction
- When booking ends, the slot **automatically becomes available**

---

## 📈 Reports
Admins can generate reports based on:
- City
- Area
- Time range
- Minimum booking amount

**Report includes:**
- User
- Slot
- City
- Area
- Start time
- End time
- Total amount

---

## 🚀 Future Enhancements
- 📱 Mobile application
- 💳 Online payment gateway  
  (:contentReference[oaicite:5]{index=5} / :contentReference[oaicite:6]{index=6})
- 🔐 QR-code based parking entry
- 📊 Peak-hour analytics
- 🔔 Push notifications

---

✨ *ParkEase demonstrates real-world system design, role-based access control, and scalable backend architecture — making it a strong final-year and portfolio project.*
