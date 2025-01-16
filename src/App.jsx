import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Ticket from './Components/Ticket'
import Home	 from './Components/home'
import { ethers } from "ethers";
import Navbar from './Components/Navbar'
import Footer from './Components/Footer'
import AdminDashboard from './Components/AdminDashboard'

import { Route, Routes } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add other routes as needed */}
            <Route path="/buy-tickets" element={<Ticket />} />
            <Route path="/admin" element={<AdminDashboard contract={contract} account={account} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default App
