import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Form, Input, message, Tabs, List, Rate, Tag } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface FavoriteMerchant {
  id: number;
  name: string;
  description: string;
  category_name: string;
  avg_rating: number;
  review_count: number;
  images: string;
  status: string;
  city: string;
}

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteMerchant[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      message.error('请先登录');
      navigate('/login');
      return;
    }
    form.setFieldsValue({
      name: user.name,
      avatar_url: user.avatar_url || ''
    });
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    setLoadingFavs(true);
    try {
      const res = await axios.get('/api/merchants/favorites', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setFavorites(res.data.data);
    } catch (error) {
      console.error('获取收藏失败', error);
    } finally {
      setLoadingFavs(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setUpdating(true);
    try {
      const res = await axios.put('/api/users/profile', values, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setUser({
        ...user!,
        name: res.data.user.name,
        avatar_url: res.data.user.avatar_url
      });
      message.success('个人信息更新成功');
      setIsEditing(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const renderFavorites = () => (
    <List
      loading={loadingFavs}
      dataSource={favorites}
      locale={{ emptyText: '暂无收藏，快去探索吧！' }}
      renderItem={(item) => {
        let imageUrl = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+restaurant+app+logo+orange+and+white+minimalist&image_size=square';
        try {
          if (item.images) {
            const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          }
        } catch (e) {}

        return (
          <List.Item className="bg-white mb-4 rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <Link to={`/merchant/${item.id}`} className="flex w-full gap-6 text-gray-800 hover:text-gray-800">
              <img src={imageUrl} alt={item.name} className="w-32 h-32 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold m-0">{item.name}</h3>
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded text-xs inline-block text-white ${item.status === '营业' || item.status === '营业中' ? 'bg-orange-500' : item.status === '休息' || item.status === '休息中' ? 'bg-[#fdba74]' : 'bg-[#6b7280]'}`}>
                        {item.status === '营业中' ? '营业' : item.status === '休息中' ? '休息' : item.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 mb-2">
                    <span className="bg-orange-50 text-orange-500 px-2 py-0.5 rounded mr-2">{item.category_name}</span>
                    <span>{item.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rate disabled value={Number(item.avg_rating)} allowHalf className="text-xs text-orange-400" />
                  <span className="text-sm font-medium">{Number(item.avg_rating).toFixed(1)}分</span>
                  <span className="text-xs text-gray-400 ml-2">{item.review_count}条评价</span>
                </div>
              </div>
            </Link>
          </List.Item>
        );
      }}
    />
  );

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="md:flex gap-8">
        {/* Left column: Profile Info */}
        <div className="md:w-1/4 mb-8 md:mb-0">
          <Card className="rounded-2xl shadow-sm border-none text-center sticky top-8">
            <div className="flex flex-col items-center">
              <Avatar 
                size={100} 
                src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}&backgroundColor=ffd5dc`} 
                icon={<UserOutlined />} 
                className="mb-4 shadow-md"
              />
              
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                  <p className="text-gray-500 mb-4">{user.role === 'merchant' ? '商家用户' : '普通用户'}</p>
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-50"
                  >
                    编辑资料
                  </Button>
                </>
              ) : (
                <Form form={form} layout="vertical" onFinish={handleUpdateProfile} className="w-full text-left mt-4">
                  <Form.Item name="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input placeholder="输入新用户名" />
                  </Form.Item>
                  <Form.Item name="avatar_url" label="头像链接">
                    <Input placeholder="输入头像图片URL" />
                  </Form.Item>
                  <div className="flex gap-2 mt-6">
                    <Button type="primary" htmlType="submit" loading={updating} className="flex-1 bg-orange-500 border-none">
                      保存
                    </Button>
                    <Button onClick={() => { setIsEditing(false); form.resetFields(); }} className="flex-1">
                      取消
                    </Button>
                  </div>
                </Form>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Content Tabs */}
        <div className="md:w-3/4">
          <Card className="rounded-2xl shadow-sm border-none min-h-[500px]">
            <Tabs 
              defaultActiveKey="1" 
              items={[
                {
                  key: '1',
                  label: <span className="text-base px-2">❤️ 我的真香预警</span>,
                  children: renderFavorites(),
                }
              ]} 
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
