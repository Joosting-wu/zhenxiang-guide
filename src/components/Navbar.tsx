import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Avatar, Dropdown, MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined, SearchOutlined, EnvironmentOutlined, DownOutlined, ShopOutlined } from '@ant-design/icons';

const cities = ['广州市', '北京市', '上海市', '深圳市', '杭州市'];

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [currentCity, setCurrentCity] = useState(localStorage.getItem('currentCity') || '广州市');
  // 标记本次 currentCity 变更来自外部同步（定位结果），避免重复派发 cityChange 导致重复请求
  const skipDispatchRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('currentCity', currentCity);
    if (skipDispatchRef.current) {
      skipDispatchRef.current = false;
      return;
    }
    // 触发一个自定义事件，通知其他组件城市已更改
    window.dispatchEvent(new Event('cityChange'));
  }, [currentCity]);

  // 后台定位解析出城市后，同步导航栏显示
  useEffect(() => {
    const handleLocationResolved = () => {
      const stored = localStorage.getItem('currentCity') || '广州市';
      setCurrentCity(prev => {
        if (prev === stored) return prev;
        skipDispatchRef.current = true;
        return stored;
      });
    };
    window.addEventListener('cityLocationResolved', handleLocationResolved);
    return () => window.removeEventListener('cityLocationResolved', handleLocationResolved);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cityMenuItems: MenuProps['items'] = cities.map(city => ({
    key: city,
    label: city,
    onClick: () => setCurrentCity(city),
  }));

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link to="/profile">个人资料</Link>,
      icon: <UserOutlined />,
    },
    ...(user?.role === 'merchant' ? [{
      key: 'merchant_admin',
      label: <Link to="/admin/merchants">门店管理</Link>,
      icon: <ShopOutlined />,
    }] : []),
    ...(user?.role === 'admin' ? [{
      key: 'sys_admin',
      label: <Link to="/admin">真香后台</Link>,
      icon: <ShopOutlined />,
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-orange-500 text-2xl font-bold">我的真香指南</span>
        </Link>

        <Dropdown menu={{ items: cityMenuItems }} placement="bottomLeft">
          <div className="flex items-center gap-1 cursor-pointer text-gray-600 hover:text-orange-500 transition-colors">
            <EnvironmentOutlined />
            <span className="font-medium">{currentCity}</span>
            <DownOutlined className="text-[10px]" />
          </div>
        </Dropdown>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索商户、分类..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/search?keyword=${(e.target as HTMLInputElement).value}`);
              }
            }}
          />
          <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar src={user.avatar_url} icon={<UserOutlined />} />
              <span className="text-gray-700 hidden sm:inline">{user.name}</span>
            </div>
          </Dropdown>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button type="text">登录</Button>
            </Link>
            <Link to="/register">
              <Button type="primary" className="bg-orange-500 hover:bg-orange-600 border-none rounded-full">
                注册
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
