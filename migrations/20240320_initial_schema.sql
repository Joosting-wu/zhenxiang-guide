-- 创建分类表 (categories)
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化分类数据
INSERT INTO categories (name, icon, sort_order) VALUES
('吃得香', '🍽️', 1),
('玩得嗨', '🎬', 2),
('美得很', '🛍️', 3),
('住得爽', '🏨', 4);

-- 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- 商户表 (merchants)
CREATE TABLE IF NOT EXISTS merchants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    category_id INT NOT NULL,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    business_hours VARCHAR(200),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_rating (avg_rating DESC),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 评论表 (reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    merchant_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_merchant (user_id, merchant_id),
    INDEX idx_merchant_created (merchant_id, created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

-- 初始化一些商户数据
INSERT INTO merchants (name, description, address, phone, category_id, avg_rating, review_count, business_hours, image_url) VALUES
('老火锅店', '地道的重庆老火锅', '南京路123号', '021-12345678', 1, 4.5, 120, '10:00-22:00', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=delicious+hotpot+restaurant+interior&image_size=landscape_16_9'),
('精品超市', '进口商品齐全', '北京路456号', '021-87654321', 2, 4.2, 85, '08:00-22:00', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury+supermarket+interior&image_size=landscape_16_9'),
('超级影城', 'IMAX巨幕体验', '上海路789号', '021-13572468', 3, 4.8, 350, '10:00-24:00', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern+cinema+hall&image_size=landscape_16_9');
