# 🛒 Cartify GnG – Admin Dashboard UI

This folder contains the **Admin Dashboard User Interface** for **Cartify GnG : Smart Shopping Cart**.

The Admin Dashboard is used by **store administrators** to manage items, layouts, inventory data, and to support backend features such as **shopping list matching**, **optimized path generation**, and **fraud prevention workflows**.

---

## 📁 Folder Structure

```text
Admin Dashboard UI/
├── src/
│   ├── components/      # Reusable UI components (forms, tables, cards)
│   ├── guidelines/      # UI rules, constants, enums, helper logic
│   ├── styles/          # Component-level and global styles
│   ├── App.tsx          # Root React component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global CSS
│
├── index.html           # HTML entry (Vite)
├── vite.config.ts       # Vite configuration
├── package.json         # Project dependencies & scripts
├── package-lock.json    # Locked dependency versions
├── Attributions.md      # Third-party libraries & asset credits
└── README.md            # Project documentation
````

---

## 🎯 Purpose

The Admin Dashboard UI serves as the **configuration and monitoring layer** for Cartify GnG.
It enables admins to:

* Add and update **store items**
* Define **rack / row / column** locations
* Search and highlight items on the store layout
* Monitor **inventory and stock levels**
* Provide accurate data for **optimized cart navigation**
* Support backend **fraud detection validation**

---

## 🧩 Core Features

### 1️⃣ Item Management

* Add items using admin forms
* Update pricing, weight type, and location
* Items are stored directly in backend DB
* No JSON import/export required

**Item Data Example**

```json
{
  "item_id": "ITEM001",
  "name": "Apple - Royal Gala",
  "rack": "R1",
  "row": 1,
  "col": 1,
  "weight_type": "variable",
  "unit_price_per_kg": 180,
  "label_variants": ["apple", "royal gala"]
}
```

---

### 2️⃣ Item Search & Highlight

* Search items by name or label variants
* Highlight the corresponding rack cell
* Used to verify correct item placement

---

### 3️⃣ Layout Awareness

* Rack-based layout using **row & column indexing**
* Layout data is shared with backend for:

  * Shopping list item matching
  * Path optimization logic
* Supports flexible supermarket layouts

---

### 4️⃣ Inventory Monitoring

* Displays stock using a dedicated inventory table
* Shows:

  * Recently updated stock
  * Low-stock items
* Inventory linked using `item_id`

---

## 🔗 Backend Integration

This UI communicates with backend APIs such as:

* `/items/create`
* `/items/update`
* `/items/search`
* `/inventory/list`
* `/layout/get`

These APIs directly support:

* Cart UI minimap rendering
* Shopping list matching
* Optimized navigation path generation

---

## 🧠 Relation to Path Optimization

Item positions defined here are consumed by the backend **path optimizer**, which:

* Groups racks in odd-even traversal pairs
* Sorts items column-wise (ascending / descending)
* Generates an efficient shopping path for the cart UI

Correct admin configuration = accurate navigation.

---

## 🚨 Fraud Prevention Support

Although detection runs on cart hardware, this dashboard enables:

* Accurate weight & price reference
* Correct item-to-location mapping
* Backend validation for weight mismatch detection

---

## ⚙️ Tech Stack

* **Framework**: React + TypeScript
* **Build Tool**: Vite
* **Styling**: CSS (modular + global)
* **Backend**: Node.js / Express
* **Database**: MongoDB / Firestore

---

## ▶️ Running the Project

```bash
npm install
npm run dev
```

App runs by default at:

```
http://localhost:5173
```

---

## 🚀 Future Enhancements

* Drag-and-drop layout editor
* Visual rack heatmap
* Role-based admin access
* Multi-store configuration
* Stock anomaly alerts

---

## 📌 Project

**Cartify GnG : Smart Shopping Cart**
Final Year Smart Retail Automation System
Primary Focus: **Fraud Prevention + Seamless Shopping**

