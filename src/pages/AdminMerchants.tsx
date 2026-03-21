import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Spin, Tag, Upload } from 'antd';
import { PlusOutlined, EditOutlined, ShopOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Merchant {
  id: number;
  name: string;
  city: string;
  address: string;
  category_name: string;
  category_id: number;
  phone: string;
  business_hours: string;
  status: string;
  images: string | string[];
  owner_id: number;
}

interface Category {
  id: number;
  name: string;
}

const AdminMerchants: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      message.error('请先登录');
      navigate('/login');
      return;
    }
    if (user.role !== 'merchant') {
      message.error('仅商家用户可访问此页面');
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [merchantsRes, categoriesRes] = await Promise.all([
        axios.get(`/api/merchants?limit=1000`),
        axios.get('/api/merchants/categories')
      ]);
      
      const myMerchants = (merchantsRes.data.data || []).filter((m: Merchant) => m.owner_id === user?.userId);
      setMerchants(myMerchants);
      setCategories(categoriesRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMerchant(null);
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleEdit = async (record: Merchant) => {
    try {
      await axios.get(`/api/merchants/${record.id}/owner/check`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('无权限：您只能修改自己创建的门店');
        return;
      }
    }

    setEditingMerchant(record);
    const images = typeof record.images === 'string' ? JSON.parse(record.images) : record.images;
    
    // Convert string URLs to UploadFile objects
    let imagesArr = [];
    if (images) {
      if (Array.isArray(images)) {
        imagesArr = images;
      } else if (typeof images === 'string') {
        imagesArr = [images];
      }
    }
    
    const initialFileList: UploadFile[] = imagesArr.map((url: string, index: number) => ({
        uid: `-${index}`,
        name: `image-${index}.png`,
        status: 'done' as const,
        url,
      }));
    
    setFileList(initialFileList);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    
    // Read from response and show file link
    newFileList = newFileList.map(file => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
      }
      return file;
    });

    setFileList(newFileList);
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

  const handleSubmit = async (values: any) => {
    // Extract URLs from fileList
    const imageUrls = fileList
      .filter(file => file.status === 'done')
      .map(file => file.url || (file.response && file.response.url));

    const formattedValues = {
      ...values,
      images: imageUrls
    };
    
    // Check owner permissions before actual submit
    if (editingMerchant) {
      try {
        await axios.get(`/api/merchants/${editingMerchant.id}/owner/check`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } catch (error: any) {
        if (error.response?.status === 403) {
          message.error('无权限：您只能修改自己创建的门店');
          return;
        }
      }
    }

    try {
      if (editingMerchant) {
        await axios.put(`/api/merchants/${editingMerchant.id}`, formattedValues, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        message.success('更新成功');
      } else {
        await axios.post('/api/merchants', formattedValues, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { 
      title: '门店名称', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string, record: Merchant) => (
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
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      let color = '#f97316'; // orange-500
      if (status === '休息' || status === '休息中') color = '#fdba74'; // orange-300
      if (status === '闭店') color = '#6b7280'; // gray-500
      const displayStatus = status === '营业中' ? '营业' : status === '休息中' ? '休息' : status;
      return <Tag color={color} className="border-none text-white">{displayStatus || '营业'}</Tag>;
    }},
    { title: '城市', dataIndex: 'city', key: 'city', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Merchant) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  if (loading && merchants.length === 0) return <div className="p-20 text-center"><Spin size="large" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShopOutlined className="text-orange-500" />
          门店管理
        </h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="bg-orange-500 rounded-full h-10 px-6 border-none">
          新增门店
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <Table columns={columns} dataSource={merchants} rowKey="id" />
      </div>

      <Modal
        title={editingMerchant ? '编辑门店' : '新增门店'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okButtonProps={{ className: 'bg-orange-500 border-none' }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如：广州酒家" />
            </Form.Item>
            <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请选择城市' }]} initialValue="广州市">
              <Select options={['广州市', '北京市', '上海市', '深圳市', '杭州市'].map(c => ({ label: c, value: c }))} />
            </Form.Item>
          </div>

          <Form.Item name="category_id" label="所属分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={categories.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>

          <Form.Item name="address" label="门店地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="phone" label="联系电话">
              <Input placeholder="例如：020-81380388" />
            </Form.Item>
            <Form.Item name="business_hours" label="营业时间">
              <Input placeholder="例如：09:00-22:00" />
            </Form.Item>
          </div>

          <Form.Item name="status" label="营业状态" initialValue="营业">
            <Select options={[
              { label: '营业', value: '营业' },
              { label: '休息', value: '休息' },
              { label: '闭店', value: '闭店' },
            ]} />
          </Form.Item>

          <Form.Item label="门店图片 (最多4张)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              customRequest={customRequest}
              maxCount={4}
              accept=".jpg,.jpeg,.png"
            >
              {fileList.length < 4 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
            <div className="text-gray-400 text-xs mt-2">支持 jpg、jpeg、png 格式，单张 ≤ 5MB</div>
          </Form.Item>

          <Form.Item name="description" label="门店简介">
            <Input.TextArea rows={3} placeholder="介绍一下你的门店吧..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminMerchants;