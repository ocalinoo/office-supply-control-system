# Office Supply Control System (OSCS)

Aplikasi web-based untuk pendataan barang inventaris yang berkaitan dengan perangkat pendukung operasional kantor.

## 🚀 Features

### Dashboard
- Summary stock dalam bentuk Pie Chart berdasarkan kategori
- Quick stats: Total Items, Low Stock, Categories, Total Quantity
- Low Stock Alert untuk barang yang hampir habis
- Quick actions untuk navigasi cepat

### RBAC (Role-Based Access Control)
- **Admin**: Full access untuk CRUD operations
- **User**: View only dan Generate Report

### Inventory Management
- View semua barang inventaris dengan filter kategori dan pencarian
- CRUD operations untuk Admin
- Import/Export CSV untuk bulk data
- Generate QR Code untuk setiap barang (download sebagai PNG)
- Edit/Unlock functionality untuk mengubah data

### Reports
- Generate report harian, mingguan, bulanan
- Top 5 barang/category yang paling cepat habis
- Export report ke CSV

### Version History
- Tracking semua perubahan barang
- Highlight data yang berubah hari ini
- Auto generate report setiap pukul 22.00WIB

### AI Assistant
- Chat-based interface untuk pencarian data
- Quick actions untuk query umum
- Rule-based AI untuk pertanyaan inventaris

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite + Prisma ORM
- **Real-time**: SWR
- **Charts**: Recharts
- **QR Code**: qrcode.react
- **Auth**: JWT (localStorage, no session)
- **State Management**: Zustand

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## 🔐 Default Credentials

- **Admin**: username: `admin`, password: `admin123`
- **User**: username: `user`, password: `user123`

## 📁 Project Structure

```
oscs/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeder
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── inventory/      # Inventory page
│   │   ├── reports/        # Reports page
│   │   ├── versions/       # Version history page
│   │   ├── assistant/      # AI Assistant page
│   │   └── login/          # Login page
│   ├── components/
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   └── DashboardLayout.tsx
│   ├── hooks/
│   │   └── useData.ts      # SWR hooks
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client
│   │   ├── auth.ts         # Auth utilities
│   │   └── utils.ts        # Utility functions
│   └── store/
│       └── app-store.ts    # Zustand store
└── .env                    # Environment variables
```

## 🌐 Deployment (Cloudflare Pages)

1. Build the application:
```bash
npm run build
```

2. Deploy to Cloudflare Pages:
- Push code to GitHub
- Connect repository to Cloudflare Pages
- Set build command: `npm run build`
- Set build output directory: `.next`
- Add environment variables

### Environment Variables

```
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_APP_NAME=Office Supply Control System
```

## 📊 Database Schema

- **User**: Admin dan User accounts
- **Category**: Kategori barang
- **Item**: Barang inventaris
- **InventoryLog**: Log keluar/masuk barang
- **VersionHistory**: History perubahan barang
- **Report**: Generated reports
- **AIChatMessage**: AI chat history

## 🔌 API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/stats` - Dashboard stats
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category (Admin)
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create item (Admin)
- `PUT /api/inventory` - Update item (Admin)
- `DELETE /api/inventory` - Delete item (Admin)
- `GET /api/reports` - Generate reports
- `GET /api/versions` - Get version history
- `POST /api/assistant` - AI Assistant chat

## 📝 CSV Import Format

```csv
name,sku,category,quantity,minStock,unit,location,description
Kertas A4,STAT-001,Stationery,50,20,rim,Rak A1,Kertas HVS 80gsm
```

## 🎨 Design Principles

- Modern dan Simple
- Responsive untuk semua device
- Real-time updates tanpa refresh
- No session (persistent login dengan JWT)

## 📄 License

ISC
