import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Houses
export const getHouses = () => api.get('/houses')
export const getHouse = (id) => api.get(`/houses/${id}`)
export const createHouse = (data) => api.post('/houses', data)
export const updateHouse = (id, data) => api.put(`/houses/${id}`, data)
export const deleteHouse = (id) => api.delete(`/houses/${id}`)
export const getHouseHistory = (id) => api.get(`/houses/${id}/history`)
export const getHousePayments = (id, year, month) =>
  api.get(`/houses/${id}/payments`, { params: { year, month } })
export const assignResident = (houseId, data) =>
  api.post(`/houses/${houseId}/assign-resident`, data)
export const removeResident = (houseId) =>
  api.post(`/houses/${houseId}/remove-resident`)

// Residents
export const getResidents = () => api.get('/residents')
export const getResident = (id) => api.get(`/residents/${id}`)
export const createResident = (formData) =>
  api.post('/residents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateResident = (id, formData) =>
  api.post(`/residents/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteResident = (id) => api.delete(`/residents/${id}`)

// Payments
export const getPayments = (year, month) =>
  api.get('/payments', { params: { year, month } })
export const createPayment = (data) => api.post('/payments', data)
export const generateMonthly = (year, month) =>
  api.post('/payments/generate-monthly', { year, month })
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data)
export const deletePayment = (id) => api.delete(`/payments/${id}`)

// Expenses
export const getExpenses = (year, month) =>
  api.get('/expenses', { params: { year, month } })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

// Reports
export const getStats = () => api.get('/reports/stats')
export const getYearlyReport = (year) => api.get(`/reports/yearly/${year}`)
export const getMonthlyReport = (year, month) =>
  api.get(`/reports/monthly/${year}/${month}`)

// Fee categories
export const getFeeCategories = () => api.get('/fee-categories')

export default api
