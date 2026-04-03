import './App.css';
import Register from './components/common/Register';
import Login from './components/common/Login';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserHome from './components/user/UserHome';
import ShopDashboard from './components/grocery/ShopDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import NurseDashboard from './components/nurse/NurseDashboard';
import HomeServiceDashboard from './components/homeservice/HomeServiceDashboard';

function App() {
  const [auth, setAuth] = useState(JSON.parse(localStorage.getItem('user')));
  const [usertype, setUsertype] = useState(auth?.usertype);

  const handleLogin = (userData) => {
    setAuth(userData);
    setUsertype(userData.usertype);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setAuth(null);
    setUsertype(null);
  };

  return (
    <>
      <BrowserRouter>
        {auth == null ? (
          <Routes>
            <Route path='/' element={<UserHome onLogout={handleLogout} />} />
            <Route path='/register' element={<Register />} />
            <Route path='/login' element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <Routes>
            {usertype === "user" && (
              <>
                <Route path='/' element={<UserHome user={auth} onLogout={handleLogout} />} />
                <Route path='/home' element={<UserHome user={auth} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
            {usertype === "shop" && (
              <>
                <Route path='/shop-dashboard' element={<ShopDashboard user={auth} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/shop-dashboard" />} />
              </>
            )}
            {usertype === "admin" && (
              <>
                <Route path='/admin-dashboard' element={<AdminDashboard user={auth} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/admin-dashboard" />} />
              </>
            )}
            {usertype === "nurse" && (
              <>
                <Route path='/provider-dashboard' element={<NurseDashboard user={auth} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/provider-dashboard" />} />
              </>
            )}
            {usertype === "homeservice" && (
              <>
                <Route path='/provider-dashboard' element={<HomeServiceDashboard user={auth} onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/provider-dashboard" />} />
              </>
            )}
          </Routes>
        )}
      </BrowserRouter>
    </>
  );
}
export default App;


