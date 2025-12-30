# 🛒 Cartify GnG – Cart UI

This folder contains the **Cart User Interface (Cart UI)** for **Cartify GnG : Smart Shopping Cart**.

The Cart UI runs on the **smart cart display** (or simulated web device) and provides real-time interaction for customers during shopping, including item tracking, optimized navigation, and fraud-prevention feedback.

---

## 📁 Folder Structure

```text

Cart UI/

├── public/

│   ├── logo.png            # App logo

│   ├── placeholder.svg     # Placeholder assets

│   └── robots.txt

│

├── src/

│   ├── components/         # UI components (cards, minimap, modals, alerts)

│   ├── hooks/              # Custom React hooks (cart state, socket, sync)

│   ├── lib/                # Utilities, API clients, helpers

│   ├── pages/              # Screen-level pages (Home, Cart, Navigation)

│   ├── App.tsx             # Root application component

│   ├── App.css             # App-level styles

│   ├── index.css           # Global styles

│   └── main.tsx            # Application entry point

│

├── components.json         # UI component configuration

├── vite-env.d.ts           # Vite environment typings

├── index.html              # HTML entry (Vite)

├── vite.config.ts          # Vite configuration

│

├── tailwind.config.ts      # Tailwind CSS configuration

├── postcss.config.js       # PostCSS setup

│

├── eslint.config.js        # ESLint configuration

├── tsconfig.json           # TypeScript base config

├── tsconfig.app.json       # App-specific TS config

├── tsconfig.node.json      # Node-specific TS config

│

├── package.json            # Project dependencies & scripts

├── package-lock.json       # Dependency lock file

├── bun.lockb               # Bun lock file (optional runtime)

├── .gitignore

└── README.md               # Project documentation
