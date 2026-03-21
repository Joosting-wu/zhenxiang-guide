import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', values);
      setUser(response.data.data);
      message.success('注册成功！');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">创建新账号</h1>
          <p className="text-gray-500">加入“现在，开饭啦！”，分享您的美食体验</p>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入您的昵称！' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="昵称" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入电子邮箱！' },
              { type: 'email', message: '请输入有效的电子邮箱地址！' }
            ]}
          >
            <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="电子邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码！' }]}
          >
            <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="手机号 (可选)" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码！' },
              { min: 6, message: '密码长度至少为 6 位！' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认您的密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不匹配！'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="用户身份"
            initialValue="user"
          >
            <Select>
              <Select.Option value="user">普通用户 (可发表评论)</Select.Option>
              <Select.Option value="merchant">商家用户 (可管理门店、回复评论)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 border-none h-12 text-lg font-medium"
              loading={loading}
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-500">已有账号？ </span>
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
