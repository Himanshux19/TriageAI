import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './pages/Landing'
import ClinicDashboard from './pages/ClinicDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientBook from './pages/PatientBook'
import PatientTrack from './pages/PatientTrack'
import ResetPassword from './pages/ResetPassword'
import './index.css'

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('triageai_token')
  const userRole = localStorage.getItem('triageai_role')
  if (!token) return <Navigate to="/" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/patient/book/:clinicId" element={<PatientBook />} />
          <Route path="/patient/track/:tokenNumber" element={<PatientTrack />} />
          <Route path="/clinic/dashboard" element={
            <PrivateRoute role="CLINIC"><ClinicDashboard /></PrivateRoute>
          } />
          <Route path="/doctor/dashboard" element={
            <PrivateRoute role="DOCTOR"><DoctorDashboard /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
