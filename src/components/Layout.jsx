import { Outlet, NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/houses", icon: "🏠", label: "Kelola Rumah" },
  { to: "/residents", icon: "👥", label: "Kelola Penghuni" },
  { to: "/payments", icon: "💰", label: "Pembayaran" },
  { to: "/expenses", icon: "📤", label: "Pengeluaran" },
  { to: "/reports", icon: "📑", label: "Laporan Bulanan" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-600">RT Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Perumahan Elite</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
