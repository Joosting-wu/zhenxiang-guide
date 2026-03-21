import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, message, Typography, Table, Tag, Tabs } from 'antd';
import { UserOutlined, ShopOutlined, ArrowUpOutlined, EyeOutlined, GlobalOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface DashboardData {
  totalUsers: number;
  newUsersToday: number;
  totalMerchants: number;
  newMerchantsToday: number;
  dau: number;
  mau: number;
  pv: number;
  uv: number;
  trendData: Array<{
    date: string;
    newUsers: number;
    newMerchants: number;
  }>;
  lastUpdated: string;
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  
  const [usersPagination, setUsersPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [merchantsPagination, setMerchantsPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setData(res.data);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        message.error('权限不足或未登录');
        navigate('/');
      } else {
        message.error('获取统计数据失败');
      }
    }
  };

  const fetchUsers = async (page = 1, limit = 10) => {
    try {
      setUsersLoading(true);
      const res = await axios.get(`/api/admin/users?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setUsers(res.data.data);
      setUsersPagination({ current: page, pageSize: limit, total: res.data.total });
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMerchants = async (page = 1, limit = 100) => {
    try {
      setMerchantsLoading(true);
      const res = await axios.get(`/api/admin/merchants?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setMerchants(res.data.data);
      setMerchantsPagination({ current: page, pageSize: limit, total: res.data.total });
    } catch (error) {
      message.error('获取店铺列表失败');
    } finally {
      setMerchantsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      message.error('无权访问');
      navigate('/');
      return;
    }
    
    const initData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchUsers(),
        fetchMerchants()
      ]);
      setLoading(false);
    };

    initData();
    
    // Auto refresh every hour (3600000 ms)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3600000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '昵称', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone', render: (text: string) => text || '-' },
    { 
      title: '角色', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'merchant' ? 'orange' : 'blue'}>
          {role === 'admin' ? '管理员' : role === 'merchant' ? '商家' : '用户'}
        </Tag>
      )
    },
    { 
      title: '注册时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
  ];

  const merchantColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { 
      title: '店铺名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string, record: any) => (
        <a 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/merchant/${record.id}`);
          }}
          className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
        >
          {text}
        </a>
      )
    },
    { 
      title: '分类', 
      dataIndex: 'category_name', 
      key: 'category_name',
      filters: [
        { text: '吃得香', value: '吃得香' },
        { text: '玩得嗨', value: '玩得嗨' },
        { text: '美得很', value: '美得很' },
        { text: '住得爽', value: '住得爽' },
      ],
      onFilter: (value: string | number | boolean, record: any) => record.category_name === value,
    },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { 
      title: '评分', 
      dataIndex: 'avg_rating', 
      key: 'avg_rating',
      sorter: (a: any, b: any) => a.avg_rating - b.avg_rating,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      filters: [
        { text: '营业', value: '营业' },
        { text: '休息', value: '休息' },
        { text: '闭店', value: '闭店' },
      ],
      onFilter: (value: string | number | boolean, record: any) => (record.status || '营业') === value,
      render: (status: string) => {
        let color = '#f97316'; // orange-500
        if (status === '休息' || status === '休息中') color = '#fdba74'; // orange-300
        if (status === '闭店') color = '#6b7280'; // gray-500
        const displayStatus = status === '营业中' ? '营业' : status === '休息中' ? '休息' : status;
        return <Tag color={color} className="border-none text-white">{displayStatus || '营业'}</Tag>;
      }
    },
    { 
      title: '入驻时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Title level={2} style={{ margin: 0 }}>我的真香后台</Title>
        <div className="text-gray-500">
          最后更新时间: {new Date(data.lastUpdated).toLocaleString('zh-CN')}
        </div>
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <Statistic
              title="注册用户总数"
              value={data.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#ff7875' }}
            />
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              今日新增 <span className="text-red-500 font-bold ml-1">+{data.newUsersToday}</span>
              <ArrowUpOutlined className="text-red-500 text-xs ml-1" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <Statistic
              title="入驻店铺总数"
              value={data.totalMerchants}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#ff9c6e' }}
            />
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              今日新增 <span className="text-orange-500 font-bold ml-1">+{data.newMerchantsToday}</span>
              <ArrowUpOutlined className="text-orange-500 text-xs ml-1" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <Statistic
              title="日活跃用户 (DAU)"
              value={data.dau}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#69c0ff' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              月活跃 (MAU): {data.mau}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <Statistic
              title="页面浏览量 (PV)"
              value={data.pv}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#5cdbd3' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              独立访客 (UV): {data.uv}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} lg={12}>
          <Card title="近7日累计用户数趋势" className="shadow-sm rounded-2xl h-full">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    name="累计用户数"
                    dataKey="newUsers" 
                    stroke="#ff7875" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近7日累计店铺数趋势" className="shadow-sm rounded-2xl h-full">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(255,156,110,0.1)' }}
                  />
                  <Legend />
                  <Bar 
                    name="累计店铺数"
                    dataKey="newMerchants" 
                    fill="#ff9c6e" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm rounded-2xl">
        <Tabs
          defaultActiveKey="users"
          items={[
            {
              key: 'users',
              label: '用户列表',
              children: (
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  loading={usersLoading}
                  pagination={{
                    ...usersPagination,
                    onChange: (page, pageSize) => fetchUsers(page, pageSize),
                    showSizeChanger: true,
                  }}
                  scroll={{ x: 800 }}
                />
              ),
            },
            {
              key: 'merchants',
              label: '店铺列表',
              children: (
                <Table
                  columns={merchantColumns}
                  dataSource={merchants}
                  rowKey="id"
                  loading={merchantsLoading}
                  pagination={{
                    ...merchantsPagination,
                    onChange: (page, pageSize) => fetchMerchants(page, pageSize),
                    showSizeChanger: true,
                  }}
                  scroll={{ x: 800 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
