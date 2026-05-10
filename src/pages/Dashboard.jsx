import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { getStats, getYearlyReport, getMonthlyReport } from '../api/client'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const icons = {
  house:    { bg: 'bg-blue-100',   text: 'text-blue-600',   emoji: '🏠' },
  occupied: { bg: 'bg-green-100',  text: 'text-green-600',  emoji: '✅' },
  empty:    { bg: 'bg-gray-100',   text: 'text-gray-500',   emoji: '🔑' },
  people:   { bg: 'bg-indigo-100', text: 'text-indigo-600', emoji: '👥' },
  permanent:{ bg: 'bg-teal-100',   text: 'text-teal-600',   emoji: '🏡' },
  contract: { bg: 'bg-orange-100', text: 'text-orange-500', emoji: '📋' },
  income:   { bg: 'bg-green-100',  text: 'text-green-600',  emoji: '💰' },
  expense:  { bg: 'bg-red-100',    text: 'text-red-500',    emoji: '📤' },
  balance:  { bg: 'bg-blue-100',   text: 'text-blue-600',   emoji: '📊' },
  pending:  { bg: 'bg-amber-100',  text: 'text-amber-500',  emoji: '⏳' },
}

function StatCard({ label, value, color = 'text-gray-900', sub, iconKey }) {
  const icon = icons[iconKey]
  return (
    <div className="card flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {icon && (
        <div className={`w-11 h-11 rounded-xl ${icon.bg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">{icon.emoji}</span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [year, setYear]       = useState(new Date().getFullYear())
  const [yearly, setYearly]   = useState([])
  const [stats, setStats]     = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const now = new Date()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getStats(),
      getYearlyReport(year),
      getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
    ]).then(([st, yr, mn]) => {
      setStats(st.data.data)
      setYearly(yr.data.data.months.map((m) => ({
        name: MONTHS[m.month - 1],
        Pemasukan: m.income,
        Pengeluaran: m.expense,
        Saldo: m.balance,
      })))
      setMonthly(mn.data.data)
    }).finally(() => setLoading(false))
  }, [year])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p className="text-gray-400 text-sm">Memuat data...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan administrasi — {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <select value={year} onChange={(e) => setYear(+e.target.value)} className="input w-32">
          {[2023, 2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {stats && (
        <>
          {/* Data Rumah */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🏘️</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Data Rumah</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Rumah" value={stats.houses.total} iconKey="house"
                sub={`${stats.houses.occupied} dihuni · ${stats.houses.empty} kosong`} />
              <StatCard label="Rumah Dihuni" value={stats.houses.occupied} color="text-green-600" iconKey="occupied"
                sub="Berpenghuni aktif" />
              <StatCard label="Rumah Kosong" value={stats.houses.empty} color="text-gray-500" iconKey="empty"
                sub="Tidak berpenghuni" />
            </div>
          </div>

          {/* Data KK */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">👨‍👩‍👧</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Data Kepala Keluarga (KK)</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Kepala Keluarga" value={stats.residents.total_kk} iconKey="people"
                sub="KK terdaftar & aktif" />
              <StatCard label="KK Tetap" value={stats.residents.permanent} color="text-teal-600" iconKey="permanent"
                sub="Penghuni tetap" />
              <StatCard label="KK Kontrak" value={stats.residents.contract} color="text-orange-500" iconKey="contract"
                sub="Penghuni sementara" />
            </div>
          </div>

          {/* Keuangan bulan ini */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💳</span>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                Keuangan — {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Pemasukan" value={rupiah(stats.this_month.income)} color="text-green-600" iconKey="income" />
              <StatCard label="Pengeluaran" value={rupiah(stats.this_month.expense)} color="text-red-600" iconKey="expense" />
              <StatCard label="Saldo" value={rupiah(stats.this_month.balance)}
                color={stats.this_month.balance >= 0 ? 'text-blue-600' : 'text-red-600'} iconKey="balance" />
              <StatCard label="Belum Dibayar" value={rupiah(stats.this_month.billed - stats.this_month.income)}
                color="text-amber-500" iconKey="pending" sub={`${stats.this_month.unpaid_count} tagihan pending`} />
            </div>
          </div>
        </>
      )}

      {/* Bar chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">📈 Pemasukan vs Pengeluaran {year}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={yearly} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart saldo */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">📉 Tren Saldo {year}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={yearly} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => rupiah(v)} />
            <Line type="monotone" dataKey="Saldo" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tagihan belum lunas */}
      {monthly && monthly.payments.filter((p) => !p.is_paid).length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            ⚠️ Tagihan Belum Lunas — {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Rumah</th>
                <th className="text-left py-2 text-gray-500 font-medium">Kepala Keluarga</th>
                <th className="text-left py-2 text-gray-500 font-medium">Jenis Iuran</th>
                <th className="text-right py-2 text-gray-500 font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {monthly.payments.filter((p) => !p.is_paid).map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-medium">{p.house?.house_number}</td>
                  <td className="py-2 text-gray-600">{p.resident?.name || '-'}</td>
                  <td className="py-2 text-gray-600">{p.fee_category?.name}</td>
                  <td className="py-2 text-right text-red-600 font-medium">{rupiah(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
