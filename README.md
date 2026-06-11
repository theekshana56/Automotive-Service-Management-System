# AutoElite 🚗💨
### Automotive Service Management System

AutoElite is a comprehensive, premium full-stack web application designed to streamline and automate operations in modern automotive service centers. It features a complete booking engine, dynamic role-based dashboards, real-time waiting room queues, a PDF generation payroll engine, and a machine learning module for inventory forecasting.

---

## 🌟 Key Modules & Features

### 📅 Booking & Service Request Management
- **Customer Booking Portal**: Customers can register, browse real-time available time slots, book service appointments, and manage their bookings.
- **Mechanic Finder**: Interactive map interface using Leaflet to locate nearby mechanics or centers.

### 🕒 Real-Time Waiting Room Queue
- Dynamic waiting room dashboards powered by **Socket.io** so customers and managers can track real-time queue states and vehicle service statuses.

### 👥 Role-Based Dashboards
- **Admin Dashboard**: System settings, user role management, and detailed [system audit logs](file:///d:/Ant/server/src/models/AuditLog.js) for security and accountability.
- **Service Advisor**: Vehicle inspection sheets, service request generation, job estimations, and allocation.
- **Mechanic**: Pick up and claim jobs, update repair progress, and log time spent on repairs.
- **Inventory Manager**: Complete stock monitoring, part usage logs, and integration with the machine learning forecast module to prevent stockouts.
- **HR & Staff Manager**: Manage employee profiles, log work/overtime hours, compute statutory deductions (EPF/ETF), and process payroll.
- **Finance Manager**: Oversee finances, generate monthly salary sheets, and download official payroll slips as PDFs.

### 🧠 Machine Learning Inventory Forecasting
- Python FastAPI microservice that pulls historical stock consumption logs from MongoDB.
- Employs **Facebook Prophet** and **Scikit-learn (Linear Regression)** algorithms to forecast future spare part requirements, helping optimize supply chains.

---

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React (v18), Vite, Tailwind CSS, Chart.js, Recharts, React Router Dom, SweetAlert2 |
| **Backend** | Node.js (ES Modules), Express.js, Socket.io (WebSocket), PDFKit (PDF generation) |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **ML Service** | Python (v3.13 compatible), FastAPI, Uvicorn, Facebook Prophet, Scikit-learn, PyMongo, Motor |
| **Tooling** | Concurrently, Dotenv, Nodemon |

---

## 📂 Project Structure

```
Automotive-Service-Management-System/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── pages/              # Dashboards, Booking, Auth, and Profiles
│   │   ├── components/         # Reusable UI components
│   │   └── context/            # Global React state management
├── server/                     # Express.js Node API Backend
│   ├── src/
│   │   ├── controllers/        # REST API controller handlers
│   │   ├── models/             # Mongoose Database schemas (Finance, Staff, Inventory)
│   │   ├── routes/             # API Router endpoints
│   │   └── services/           # Helper services (PDF generator, etc.)
├── ml/                         # Python ML inventory prediction service
│   └── ml-inventory-system/    # FastAPI, data pipelines, and training scripts
├── src/                        # Global shared assets / Modern layout wrappers
├── start-all.bat               # Windows batch script to launch all services
├── seed-parts-direct.mjs       # Seed script to prepopulate database with parts
└── .env.example                # Template for environment configuration
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.10 to v3.13)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or a remote MongoDB Atlas URI)

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/theekshana56/Automotive-Service-Management-System.git
   cd Automotive-Service-Management-System
   ```

2. **Configure Environment Variables:**
   Copy the example environment file and fill in your local keys, database URI, and credentials:
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies:**
   Install top-level, client, and server Node modules:
   ```bash
   # Root directory dependencies
   npm install

   # Server dependencies
   cd server && npm install
   
   # Client dependencies
   cd ../client && npm install
   
   # Back to root
   cd ..
   ```

4. **Populate Database (Database Seeding):**
   Seed the database with sample spare parts inventory data:
   ```bash
   node seed-parts-direct.mjs
   ```

5. **Train the ML Models:**
   Set up the virtual environment for Python and train the initial Prophet and Linear Regression forecasting models:
   ```bash
   cd ml/ml-inventory-system
   python -m venv venv
   
   # Windows activation:
   venv\Scripts\activate.bat
   # Linux/macOS activation:
   # source venv/bin/activate
   
   pip install -r requirements_mongodb.txt
   python train_models_mongodb.py
   cd ../..
   ```

---

## 💻 Running the Application

For a quick setup on Windows, you can launch the client, backend server, and ML forecast service simultaneously using the startup script in the root directory:

```bash
.\start-all.bat
```

Alternatively, you can run them manually:

### 1. Start the Machine Learning Microservice
```bash
cd ml/ml-inventory-system
venv\Scripts\activate
start_ml_service_mongodb.bat
```
The ML API runs on **`http://localhost:8001`**.

### 2. Start the Backend API Server
```bash
cd server
npm run dev
```
The Node backend runs on **`http://localhost:5000`**.

### 3. Start the Vite Frontend Client
```bash
cd client
npm run dev
```
The React frontend runs on **`http://localhost:5173`**.

---

## 📝 License
This project is licensed under the ISC License. See the respective package configurations for dependency licensing details.