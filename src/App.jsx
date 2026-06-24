import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// import { useState } from 'react'
import './App.css'
import Login from './pages/login'
import Chat from './pages/chat'
import ProtectedRoute from './components/ProtectedRoute';
import SetupProfile from './pages/SetupProfile';
import ChatBox from './pages/chatbox'; 

function Home() {
  return <h1>Home Page</h1>;
}

function App() {

  return (
      <BrowserRouter>
        <nav>
          <Link to="/">Home</Link> | <Link to="/login">login</Link> | <Link to="/chatbox">chatbox</Link> | <Link to="/chat">chat</Link> | <Link to="/setup-profile">Profile</Link>
        </nav>


        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chatbox" element={<ProtectedRoute><ChatBox /></ProtectedRoute>} />
          {/* <Route path="/chatbox" element={<ChatBox />} /> */}
          <Route path="/setup-profile" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
  )
}


export default App
