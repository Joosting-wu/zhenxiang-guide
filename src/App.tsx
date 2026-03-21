import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDetail from './pages/MerchantDetail';
import Search from './pages/Search';
import AdminMerchants from './pages/AdminMerchants';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './store/authStore';

// Configure global message positioning
message.config({
  top: window.innerHeight / 2 - 50,
  duration: 2,
  maxCount: 3,
});

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  
  if (!user || user.role !== 'merchant') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const ProtectedSystemAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    // Handle window resize to keep message centered
    const handleResize = () => {
      message.config({
        top: window.innerHeight / 2 - 50,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B35',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow flex flex-col">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<Search />} />
                <Route path="/merchant/:id" element={<MerchantDetail />} />
              <Route path="/admin" element={
                <ProtectedSystemAdminRoute>
                  <AdminDashboard />
                </ProtectedSystemAdminRoute>
              } />
              <Route path="/admin/merchants" element={
                <ProtectedAdminRoute>
                  <AdminMerchants />
                </ProtectedAdminRoute>
              } />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <footer className="bg-white py-12 border-t border-gray-100 mt-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-400">© 2026 我的真香指南 由无限美好公司荣誉出品&nbsp; Crazy Guy by Esther Wu</p>
            </div>
          </footer>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;
