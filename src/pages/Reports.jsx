import { useState, useEffect } from "react";
import { getMonthlyReport } from "../api/client";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

function SummaryCard({ label, value, color, icon, bg }) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{rupiah(value)}</p>
      </div>
      <div
        className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMonthlyReport(year, month)
      .then((r) => setReport(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [year, month]);

  const paidPayments = report?.payments?.filter((p) => p.is_paid) || [];
  const unpaidPayments = report?.payments?.filter((p) => !p.is_paid) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Detail pemasukan dan pengeluaran per bulan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-36"
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="input w-24"
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Memuat laporan...
        </div>
      ) : (
        report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Pemasukan"
                value={report.summary.total_income}
                color="text-green-600"
                icon="💰"
                bg="bg-green-100"
              />
              <SummaryCard
                label="Total Pengeluaran"
                value={report.summary.total_expense}
                color="text-red-600"
                icon="📤"
                bg="bg-red-100"
              />
              <SummaryCard
                label="Saldo"
                value={report.summary.balance}
                color={
                  report.summary.balance >= 0 ? "text-blue-600" : "text-red-600"
                }
                icon="📊"
                bg="bg-blue-100"
              />
              <div className="card flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status Tagihan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {report.summary.paid_count}
                    <span className="text-sm font-normal text-gray-400">
                      {" "}
                      lunas
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {report.summary.unpaid_count} belum dibayar
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📋</span>
                </div>
              </div>
            </div>

            {/* Pemasukan - Tagihan Lunas */}
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-green-50">
                <span className="text-green-600 text-lg">💰</span>
                <h2 className="font-semibold text-green-800">
                  Pemasukan — Tagihan Lunas ({paidPayments.length} tagihan)
                </h2>
                <span className="ml-auto font-bold text-green-600">
                  {rupiah(report.summary.total_income)}
                </span>
              </div>
              {paidPayments.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-400 text-sm">
                  Belum ada pembayaran yang masuk
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Rumah
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Kepala Keluarga
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Jenis Iuran
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Tgl Bayar
                      </th>
                      <th className="text-right px-6 py-3 text-gray-500 font-medium">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 font-medium">
                          {p.house?.house_number}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {p.resident?.name || "-"}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {p.fee_category?.name}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-green-600">
                          {rupiah(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-green-50 border-t-2 border-green-200">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-3 text-sm font-semibold text-green-700"
                      >
                        Total Pemasukan
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-green-700">
                        {rupiah(report.summary.total_income)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Tagihan Belum Lunas */}
            {unpaidPayments.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-amber-50">
                  <span className="text-amber-500 text-lg">⏳</span>
                  <h2 className="font-semibold text-amber-800">
                    Tagihan Belum Lunas ({unpaidPayments.length} tagihan)
                  </h2>
                  <span className="ml-auto font-bold text-amber-600">
                    {rupiah(unpaidPayments.reduce((s, p) => s + +p.amount, 0))}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Rumah
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Kepala Keluarga
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Jenis Iuran
                      </th>
                      <th className="text-right px-6 py-3 text-gray-500 font-medium">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-red-50"
                      >
                        <td className="px-6 py-3 font-medium">
                          {p.house?.house_number}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {p.resident?.name || "-"}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {p.fee_category?.name}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-red-500">
                          {rupiah(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pengeluaran */}
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-red-50">
                <span className="text-red-500 text-lg">📤</span>
                <h2 className="font-semibold text-red-800">
                  Pengeluaran ({report.expenses?.length || 0} item)
                </h2>
                <span className="ml-auto font-bold text-red-600">
                  {rupiah(report.summary.total_expense)}
                </span>
              </div>
              {report.expenses?.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-400 text-sm">
                  Tidak ada pengeluaran bulan ini
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Tanggal
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Kategori
                      </th>
                      <th className="text-left px-6 py-3 text-gray-500 font-medium">
                        Keterangan
                      </th>
                      <th className="text-right px-6 py-3 text-gray-500 font-medium">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(e.expense_date).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {e.description}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-red-600">
                          {rupiah(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-red-50 border-t-2 border-red-200">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-3 text-sm font-semibold text-red-700"
                      >
                        Total Pengeluaran
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-red-700">
                        {rupiah(report.summary.total_expense)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Saldo akhir */}
            <div
              className={`card border-2 ${report.summary.balance >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Saldo Akhir Bulan
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {MONTHS[month - 1]} {year} = Pemasukan{" "}
                    {rupiah(report.summary.total_income)} — Pengeluaran{" "}
                    {rupiah(report.summary.total_expense)}
                  </p>
                </div>
                <p
                  className={`text-3xl font-bold ${report.summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {rupiah(report.summary.balance)}
                </p>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
