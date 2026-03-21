import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Form, Input, message, Tabs, List, Rate, Upload } from 'antd';
import { UserOutlined, EditOutlined, HeartOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

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
    setAvatarUrl(user.avatar_url || '');
    fetchFavorites();
  }, [user, navigate, form]);

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

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只允许上传 JPG 或 PNG 格式的图片！');
    }
    const isLt5M = file.size / 1024 / 1024 <= 5;
    if (!isLt5M) {
      message.error('图片大小必须小于 5MB！');
    }
    return isJpgOrPng && isLt5M;
  };

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`
        }
      });
      onSuccess(response.data);
    } catch (error) {
      onError(error);
      message.error('上传失败');
    }
  };

  const handleAvatarChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploadingAvatar(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploadingAvatar(false);
      const url = info.file.response?.url;
      if (url) {
        setAvatarUrl(url);
        form.setFieldsValue({ avatar_url: url });
        message.success('头像上传成功');
      }
    } else if (info.file.status === 'error') {
      setUploadingAvatar(false);
      message.error('头像上传失败');
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
        avatar_url: res.data.user.avatar_url || ''
      });
      message.success('个人信息更新成功');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Update profile error:', error);
      message.error(error.response?.data?.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const renderFavorites = () => (
    <List
      loading={loadingFavs}
      dataSource={favorites}
      className="w-full"
      locale={{ 
        emptyText: (
          <div className="text-center py-12 w-full flex flex-col items-center justify-center">
            <div className="text-gray-400 mb-4">暂无收藏，快去探索吧！</div>
            <Button 
              type="primary" 
              icon={<HeartOutlined />}
              onClick={() => navigate('/')}
              className="bg-orange-500 border-none rounded-full px-6"
            >
              探测真相预警
            </Button>
          </div>
        )
      }}
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
            <Link to={`/merchant/${item.id}`} className="flex flex-col sm:flex-row w-full gap-4 sm:gap-6 text-gray-800 hover:text-gray-800">
              <div className="w-full sm:w-2/5 h-48 sm:h-48 flex-shrink-0 relative">
                <img src={imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="flex-1 sm:w-3/5 flex flex-col justify-between py-1 overflow-hidden">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold m-0 truncate" title={item.name}>{item.name}</h3>
                    {item.status && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs inline-block text-white ${item.status === '营业' || item.status === '营业中' ? 'bg-orange-500' : item.status === '休息' || item.status === '休息中' ? 'bg-[#fdba74]' : 'bg-[#6b7280]'}`}>
                        {item.status === '营业中' ? '营业' : item.status === '休息中' ? '休息' : item.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 mb-2 flex items-center flex-wrap gap-2">
                    <span className="bg-orange-50 text-orange-500 px-2 py-0.5 rounded">{item.category_name}</span>
                    <span className="text-gray-400">{item.city}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2 mb-0">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex flex-nowrap items-center gap-2 w-full whitespace-nowrap">
                    <Rate disabled value={Number(item.avg_rating)} allowHalf className="text-sm text-orange-400" />
                    <span className="text-gray-500 text-sm font-medium">{Number(item.avg_rating).toFixed(1)}分</span>
                    <span className="text-orange-500 font-bold text-xs ml-1">
                      {Number(item.avg_rating) >= 4.5 ? '太香了！' : Number(item.avg_rating) >= 4.0 ? '真香！' : '还行'}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">
                      <span className="text-orange-500 font-bold">{item.review_count}</span>个真香现场
                    </span>
                  </div>
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
        <div className="md:w-1/3 mb-8 md:mb-0">
          <Card className="rounded-2xl shadow-sm border-none text-center sticky top-8">
            <div className="flex flex-col items-center">
              <Avatar 
                size={80} 
                src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=ffd5dc`} 
                icon={<UserOutlined />} 
                className="mb-4 shadow-md"
              />
              
              {!isEditing ? (
                <>
                  <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                  <p className="text-gray-500 mb-1">{user.role === 'merchant' ? '商家用户' : '普通用户'}</p>
                  <p className="text-gray-400 text-xs mb-4">
                    注册于：{user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '近期'}
                  </p>
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-50"
                    size="small"
                  >
                    编辑资料
                  </Button>
                </>
              ) : (
                <Form form={form} layout="vertical" onFinish={handleUpdateProfile} className="w-full text-left mt-4">
                  <Form.Item name="name" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input placeholder="输入新用户名" />
                  </Form.Item>
                  <Form.Item name="avatar_url" label="头像" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label="头像上传">
                    <Upload
                      name="file"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      customRequest={customRequest}
                      onChange={handleAvatarChange}
                      accept=".jpg,.jpeg,.png"
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div>
                          {uploadingAvatar ? <LoadingOutlined /> : <UploadOutlined />}
                          <div style={{ marginTop: 8 }}>点击上传</div>
                        </div>
                      )}
                    </Upload>
                    <div className="text-gray-400 text-xs mt-1">支持 jpg、png 格式，单张 ≤ 5MB</div>
                  </Form.Item>
                  <div className="flex gap-2 mt-6">
                    <Button type="primary" htmlType="submit" loading={updating} className="flex-1 bg-orange-500 border-none">
                      保存
                    </Button>
                    <Button onClick={() => { setIsEditing(false); form.resetFields(); setAvatarUrl(user?.avatar_url || ''); }} className="flex-1">
                      取消
                    </Button>
                  </div>
                </Form>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: Content Tabs */}
        <div className="md:w-2/3">
          <Card className="rounded-2xl shadow-sm border-none min-h-[500px]">
            <Tabs 
              defaultActiveKey="1" 
              items={[
                {
                  key: '1',
                  label: <span className="text-base px-2">❤️ 我的真香预警（{favorites.length}）</span>,
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
