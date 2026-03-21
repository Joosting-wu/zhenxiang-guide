import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', values);
      setUser(response.data.data);
      message.success('登录成功！');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500">请登录您的账号</p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入电子邮箱！' },
              { type: 'email', message: '请输入有效的电子邮箱地址！' }
            ]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="电子邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 border-none h-12 text-lg font-medium"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-500">还没有账号？ </span>
            <Link to="/register" className="text-orange-500 hover:text-orange-600 font-medium">
              立即注册
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
