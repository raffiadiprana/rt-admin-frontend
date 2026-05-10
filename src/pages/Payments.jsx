import { useState, useEffect } from "react";
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  generateMonthly,
  getFeeCategories,
  getHouses,
} from "../api/client";
import Modal from "../components/Modal";

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
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

export default function Payments() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [houses, setHouses] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    house_id: "",
    fee_category_id: "",
    period_year: now.getFullYear(),
    period_month: now.getMonth() + 1,
    months_count: 1,
    amount: "",
    notes: "",
  });

  const load = () => {
    setLoading(true);
    getPayments(year, month)
      .then((r) => setPayments(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getFeeCategories().then((r) => setCategories(r.data.data));
    getHouses().then((r) => setHouses(r.data.data));
  }, []);

  useEffect(() => {
    load();
  }, [year, month]);

  const handleGenerate = async () => {
    if (!confirm(`Generate tagihan ${MONTHS[month - 1]} ${year}?`)) return;
    setGenerating(true);
    try {
      const res = await generateMonthly(year, month);
      alert(res.data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryChange = (catId) => {
    const cat = categories.find((c) => c.id === +catId);
    setForm((f) => ({
      ...f,
      fee_category_id: catId,
      amount: cat?.default_amount || "",
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const selectedHouse = houses.find((h) => h.id === +form.house_id);
      const residentId = selectedHouse?.current_resident?.id || null;
      await createPayment({
        ...form,
        house_id: +form.house_id,
        fee_category_id: +form.fee_category_id,
        resident_id: residentId,
      });
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (p) => {
    try {
      await updatePayment(p.id, { is_paid: !p.is_paid });
      load();
    } catch {
      alert("Gagal memperbarui");
    }
  };

  const handleDelete = async (p) => {
    if (!confirm("Hapus tagihan ini?")) return;
    try {
      await deletePayment(p.id);
      load();
    } catch {
      alert("Gagal menghapus");
    }
  };

  const totalIncome = payments
    .filter((p) => p.is_paid)
    .reduce((s, p) => s + +p.amount, 0);
  const totalBilled = payments.reduce((s, p) => s + +p.amount, 0);
  const paidCount = payments.filter((p) => p.is_paid).length;
  const unpaidCount = payments.filter((p) => !p.is_paid).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran Iuran</h1>
          <p className="text-sm text-gray-500 mt-1">
            {MONTHS[month - 1]} {year}
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
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary whitespace-nowrap"
          >
            {generating ? "Generate..." : "⚡ Generate Tagihan"}
          </button>
          <button
            onClick={() => {
              setForm({
                house_id: "",
                fee_category_id: "",
                period_year: year,
                period_month: month,
                months_count: 1,
                amount: "",
                notes: "",
              });
              setModal(true);
            }}
            className="btn-primary whitespace-nowrap"
          >
            + Catat Bayar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Tagihan",
            value: rupiah(totalBilled),
            color: "text-gray-800",
          },
          {
            label: "Sudah Dibayar",
            value: rupiah(totalIncome),
            color: "text-green-600",
          },
          {
            label: "Belum Dibayar",
            value: rupiah(totalBilled - totalIncome),
            color: "text-red-600",
          },
          {
            label: "Lunas / Pending",
            value: `${paidCount} / ${unpaidCount}`,
            color: "text-blue-600",
          },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Payments table */}
      <div className="card overflow-x-auto p-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Daftar Tagihan</h2>
          <span className="text-xs text-gray-400">
            {payments.length} tagihan
          </span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            Memuat...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Rumah
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Penghuni
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Jenis Iuran
                </th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">
                  Jumlah
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">
                  Tgl Bayar
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 ${!p.is_paid ? "bg-red-50/30" : ""}`}
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
                  <td className="px-6 py-3 text-right font-medium">
                    {rupiah(p.amount)}
                  </td>
                  <td className="px-6 py-3">
                    <span className={p.is_paid ? "badge-paid" : "badge-unpaid"}>
                      {p.is_paid ? "Lunas" : "Belum"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePaid(p)}
                        className={`text-xs px-2 py-1 rounded font-medium ${p.is_paid ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                      >
                        {p.is_paid ? "Batalkan" : "Lunas ✓"}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Belum ada tagihan. Klik "Generate Tagihan" untuk membuat
                    tagihan bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal catat pembayaran */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Catat Pembayaran"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Rumah *</label>
            <select
              className="input"
              value={form.house_id}
              onChange={(e) => setForm({ ...form, house_id: e.target.value })}
            >
              <option value="">-- Pilih Rumah --</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.house_number}{" "}
                  {h.current_resident
                    ? `(${h.current_resident.name})`
                    : "(Kosong)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jenis Iuran *</label>
            <select
              className="input"
              value={form.fee_category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">-- Pilih Jenis Iuran --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({rupiah(c.default_amount)})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bulan *</label>
              <select
                className="input"
                value={form.period_month}
                onChange={(e) =>
                  setForm({ ...form, period_month: +e.target.value })
                }
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tahun *</label>
              <select
                className="input"
                value={form.period_year}
                onChange={(e) =>
                  setForm({ ...form, period_year: +e.target.value })
                }
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Jumlah Bulan *</label>
              <select
                className="input"
                value={form.months_count}
                onChange={(e) =>
                  setForm({ ...form, months_count: +e.target.value })
                }
              >
                {[1, 2, 3, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} bulan
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nominal (per bulan) *</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="115000"
              />
            </div>
          </div>
          <div>
            <label className="label">Catatan</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Opsional"
            />
          </div>
          {form.months_count > 1 && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
              Pembayaran akan dicatat untuk {form.months_count} bulan mulai{" "}
              {MONTHS[form.period_month - 1]} {form.period_year}. Total:{" "}
              {rupiah(+form.amount * form.months_count)}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">
              Batal
            </button>
            <button
              onClick={save}
              disabled={
                saving ||
                !form.house_id ||
                !form.fee_category_id ||
                !form.amount
              }
              className="btn-primary"
            >
              {saving ? "Menyimpan..." : "Catat Pembayaran"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
