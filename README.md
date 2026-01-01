# ⚡ EVJoints Admin Dashboard

![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

> The premium, high-performance administrative interface for the EVJoints ecosystem. Built with the latest web technologies to provide real-time insights and management capabilities for EV implementation.

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Design System](#-design-system)

---

## 🚀 Features

- **📊 Interactive Dashboard**: Real-time data visualization using ApexCharts.
- **📱 Responsive Design**: Fully responsive UI built with Tailwind CSS.
- **🎨 Modern Aesthetics**: "Elite" design system with glassmorphism, gradients, and dark mode support.
- **🔐 Secure Access**: Role-based access control and secure authentication.
- **⚡ High Performance**: Powered by Next.js 14+ Server Components and optimizations.
- **🗺️ Geo-Mapping**: Integrated vector maps for station and trip tracking.
- **📅 Data Management**: Advanced tables with sorting, filtering, and pagination.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 | React framework for production |
| **UI Library** | React 19 | Library for building user interfaces |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Language** | TypeScript | Static type checking |
| **Icons** | Lucide React | Beautiful & consistent open-source icons |
| **Charts** | ApexCharts | Modern & interactive charting library |
| **Date handling** | Day.js | Immutable date library |

---

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Running Backend**: The EVJoints Backend service should be running (locally or remote).

---

## 💻 Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/HumayunK01/EVJoints-Admin-Dashboard.git
    cd EVJoints-Admin-Dashboard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env.local` file in the root directory (see [Environment Variables](#-environment-variables)).

4.  **Run Locally**:
    ```bash
    npm run dev
    ```

The application will launch on `http://localhost:3000`.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root of your project and add the following:

```env
# API Configuration
NEXT_PUBLIC_PRIMARY_API_URL=https://devapi.evjoints.com
NEXT_PUBLIC_SECONDARY_API_URL=http://localhost:4000/api
SECONDARY_API_URL_SERVER=http://127.0.0.1:4000/api

# App Details
NEXT_PUBLIC_APP_NAME=EVJoints Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.2.1
```

*Note: For production, update the API URLs to point to your deployed backend.*

---

## 📂 Project Structure

```
frontend/
├── public/              # Static assets (images, icons)
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable UI components
│   ├── css/             # Global styles and Tailwind directives
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript interfaces and types
│   └── utils/           # Helper functions and utilities
├── .env.local           # Local environment variables
├── next.config.mjs      # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Dependencies and scripts
```

---

## ☁️ Deployment

This project is optimized for deployment on **Netlify** or **Vercel**.

### Netlify Deployment:
1.  Connect your repository to Netlify.
2.  The `netlify.toml` file will automatically configure the build settings.
3.  Add your environment variables in the Netlify dashboard.
4.  Deploy!

---

## 🎨 Design System

This project follows a strict "Elite" design system:
- **Typography**: Inter / Sans-serif
- **Colors**: High-contrast dark mode with brand-specific glows.
- **Components**: Glassmorphism cards, neon accents, and clean spacing.

---

Made with ❤️ for **EVJoints**
