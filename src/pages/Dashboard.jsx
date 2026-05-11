import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getStats, getYearlyReport, getMonthlyReport } from "../api/client";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const icons = {
  house: { bg: "bg-blue-100", text: "text-blue-600", emoji: "🏠" },
  occupied: { bg: "bg-green-100", text: "text-green-600", emoji: "✅" },
  empty: { bg: "bg-gray-100", text: "text-gray-500", emoji: "🔑" },
  people: { bg: "bg-indigo-100", text: "text-indigo-600", emoji: "👥" },
  permanent: { bg: "bg-teal-100", text: "text-teal-600", emoji: "🏡" },
  contract: { bg: "bg-orange-100", text: "text-orange-500", emoji: "📋" },
  income: { bg: "bg-green-100", text: "text-green-600", emoji: "💰" },
  expense: { bg: "bg-red-100", text: "text-red-500", emoji: "📤" },
  balance: { bg: "bg-blue-100", text: "text-blue-600", emoji: "📊" },
  pending: { bg: "bg-amber-100", text: "text-amber-500", emoji: "⏳" },
};

function StatCard({ label, value, color = "text-gray-900", sub, iconKey }) {
  const icon = icons[iconKey];
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {icon && (
        <div
          className={`w-11 h-11 rounded-xl ${icon.bg} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-xl">{icon.emoji}</span>
        </div>
      )}
    </div>
  );
}

function UnpaidCard({ monthly, now }) {
  const [expanded, setExpanded] = useState(true);

  const allPayments = monthly?.payments || [];
  const unpaid = allPayments.filter((p) => !p.is_paid);
  const paid = allPayments.filter((p) => p.is_paid);
  const totalBilled = allPayments.reduce((s, p) => s + +p.amount, 0);
  const totalPaid = paid.reduce((s, p) => s + +p.amount, 0);
  const totalUnpaid = unpaid.reduce((s, p) => s + +p.amount, 0);
  const progress = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
  const allDone = unpaid.length === 0;

  // Kelompokkan tagihan belum bayar per rumah
  const byHouse = unpaid.reduce((acc, p) => {
    const key = p.house?.house_number || "-";
    if (!acc[key])
      acc[key] = { house: p.house, resident: p.resident, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {});

  if (allPayments.length === 0) return null;

  return (
    <div
      className={`card p-0 overflow-hidden border-l-4 ${allDone ? "border-green-400" : "border-amber-400"}`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between ${allDone ? "bg-green-50" : "bg-amber-50"}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{allDone ? "🎉" : "⚠️"}</span>
          <div>
            <h2
              className={`font-semibold ${allDone ? "text-green-900" : "text-amber-900"}`}
            >
              Belum Bayar Bulan Ini —{" "}
              {now.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p
              className={`text-xs mt-0.5 ${allDone ? "text-green-700" : "text-amber-700"}`}
            >
              {allDone
                ? "Semua tagihan sudah lunas!"
                : `${unpaid.length} tagihan belum lunas · Total ${rupiah(totalUnpaid)}`}
            </p>
          </div>
        </div>
        {!allDone && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-amber-700 hover:text-amber-900 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
          >
            {expanded ? "Sembunyikan ▲" : "Tampilkan ▼"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            {paid.length} dari {allPayments.length} tagihan lunas
          </span>
          <span
            className={`font-semibold ${allDone ? "text-green-600" : "text-amber-600"}`}
          >
            {progress.toFixed(0)}% terkumpul
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : "bg-amber-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Daftar per rumah */}
      {!allDone && expanded && (
        <div className="divide-y divide-gray-50">
          {Object.entries(byHouse).map(([houseNum, data]) => {
            const totalRumah = data.items.reduce((s, i) => s + +i.amount, 0);
            return (
              <div
                key={houseNum}
                className="px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        Rumah {houseNum}
                      </span>
                      {data.resident && (
                        <span className="text-gray-500 text-sm">
                          — {data.resident.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {data.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-xs px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100"
                        >
                          {item.fee_category?.name} · {rupiah(item.amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600 whitespace-nowrap shrink-0">
                    {rupiah(totalRumah)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* State semua lunas */}
      {allDone && (
        <div className="px-6 py-5 text-center text-green-700 font-medium text-sm bg-green-50">
          Semua warga sudah membayar iuran bulan ini ✅
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearly, setYearly] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStats(),
      getYearlyReport(year),
      getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
    ])
      .then(([st, yr, mn]) => {
        setStats(st.data.data);
        setYearly(
          yr.data.data.months.map((m) => ({
            name: MONTHS[m.month - 1],
            Pemasukan: m.income,
            Pengeluaran: m.expense,
            Saldo: m.balance,
          })),
        );
        setMonthly(mn.data.data);
      })
      .finally(() => setLoading(false));
  }, [year, location.key]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-400 text-sm">Memuat data...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan administrasi —{" "}
            {now.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="input w-32"
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {stats && (
        <>
          {/* Data Rumah */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🏘️</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                Data Rumah
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Total Rumah"
                value={stats.houses.total}
                iconKey="house"
                sub={`${stats.houses.occupied} dihuni · ${stats.houses.empty} kosong`}
              />
              <StatCard
                label="Rumah Dihuni"
                value={stats.houses.occupied}
                color="text-green-600"
                iconKey="occupied"
                sub="Berpenghuni aktif"
              />
              <StatCard
                label="Rumah Kosong"
                value={stats.houses.empty}
                color="text-gray-500"
                iconKey="empty"
                sub="Tidak berpenghuni"
              />
            </div>
          </div>

          {/* Data KK */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">👨‍👩‍👧</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                Data Kepala Keluarga (KK)
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Total Kepala Keluarga"
                value={stats.residents.total_kk}
                iconKey="people"
                sub="KK terdaftar & aktif"
              />
              <StatCard
                label="KK Tetap"
                value={stats.residents.permanent}
                color="text-teal-600"
                iconKey="permanent"
                sub="Penghuni tetap"
              />
              <StatCard
                label="KK Kontrak"
                value={stats.residents.contract}
                color="text-orange-500"
                iconKey="contract"
                sub="Penghuni sementara"
              />
            </div>
          </div>

          {/* Keuangan bulan ini */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💳</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                Keuangan —{" "}
                {now.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Pemasukan"
                value={rupiah(stats.this_month.income)}
                color="text-green-600"
                iconKey="income"
              />
              <StatCard
                label="Pengeluaran"
                value={rupiah(stats.this_month.expense)}
                color="text-red-600"
                iconKey="expense"
              />
              <StatCard
                label="Saldo"
                value={rupiah(stats.this_month.balance)}
                color={
                  stats.this_month.balance >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                }
                iconKey="balance"
              />
              <StatCard
                label="Belum Dibayar"
                value={rupiah(
                  stats.this_month.billed - stats.this_month.income,
                )}
                color="text-amber-500"
                iconKey="pending"
                sub={`${stats.this_month.unpaid_count} tagihan pending`}
              />
            </div>
          </div>
        </>
      )}

      {/* Kartu Belum Bayar Bulan Ini */}
      {monthly && <UnpaidCard monthly={monthly} now={now} />}

      {/* Bar chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          📈 Pemasukan vs Pengeluaran {year}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={yearly}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart saldo */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          📉 Tren Saldo {year}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={yearly}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Line
              type="monotone"
              dataKey="Saldo"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
