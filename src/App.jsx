import { useState } from 'react'
import './App.css'
import Ticket from './pages/Ticket'
import Home	 from './pages/home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminDashboard from './pages/AdminDashboard'

import { Route, Routes } from 'react-router-dom';

function App() {

  return (
    <>
       <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buy-tickets" element={<Ticket />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default App
