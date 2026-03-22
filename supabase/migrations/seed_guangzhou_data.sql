DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'seed_user1@zhenxiang.local') THEN
    INSERT INTO users (email, password_hash, name, role, avatar_url)
    VALUES ('seed_user1@zhenxiang.local', '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC', '种子用户A', 'user', 'https://api.dicebear.com/7.x/notionists/svg?seed=seeduser1&backgroundColor=ffd5dc');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'seed_user2@zhenxiang.local') THEN
    INSERT INTO users (email, password_hash, name, role, avatar_url)
    VALUES ('seed_user2@zhenxiang.local', '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC', '种子用户B', 'user', 'https://api.dicebear.com/7.x/notionists/svg?seed=seeduser2&backgroundColor=ffdfbf');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'seed_merchant@zhenxiang.local') THEN
    INSERT INTO users (email, password_hash, name, role, avatar_url)
    VALUES ('seed_merchant@zhenxiang.local', '$2a$10$vXc5W9oNRG.T6wnq/qtz9e7Tz/JEFZ9vXG9O08CwKyHjN7/7/kAcC', '种子商家', 'merchant', 'https://api.dicebear.com/7.x/notionists/svg?seed=seedmerchant&backgroundColor=b6e3f4');
  END IF;
END $$;

INSERT INTO categories (name, icon, sort_order)
SELECT '吃得香', '🍜', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '吃得香');

INSERT INTO categories (name, icon, sort_order)
SELECT '玩得嗨', '🎡', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '玩得嗨');

INSERT INTO categories (name, icon, sort_order)
SELECT '美得很', '💇‍♀️', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '美得很');

INSERT INTO categories (name, icon, sort_order)
SELECT '住得爽', '🏨', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '住得爽');

WITH seed_ctx AS (
  SELECT
    (SELECT id FROM users WHERE email = 'seed_user1@zhenxiang.local' LIMIT 1) AS user1_id,
    (SELECT id FROM users WHERE email = 'seed_user2@zhenxiang.local' LIMIT 1) AS user2_id,
    (SELECT id FROM users WHERE email = 'seed_merchant@zhenxiang.local' LIMIT 1) AS owner_id,
    (SELECT id FROM categories WHERE name = '吃得香' LIMIT 1) AS cat_food,
    (SELECT id FROM categories WHERE name = '玩得嗨' LIMIT 1) AS cat_fun,
    (SELECT id FROM categories WHERE name = '美得很' LIMIT 1) AS cat_beauty,
    (SELECT id FROM categories WHERE name = '住得爽' LIMIT 1) AS cat_stay
)

INSERT INTO merchants (name, description, address, city, phone, category_id, business_hours, status, images, owner_id, avg_rating, review_count)
SELECT
  v.name,
  v.description,
  v.address,
  '广州市',
  v.phone,
  v.category_id,
  v.business_hours,
  '营业',
  v.images,
  (SELECT owner_id FROM seed_ctx),
  v.avg_rating,
  v.review_count
FROM (
  SELECT
    '广州酒家(文昌总店)'::text AS name,
    '老字号粤菜名店，点心与烧味都很能打。'::text AS description,
    '荔湾区文昌南路2号'::text AS address,
    '020-81380388'::text AS phone,
    (SELECT cat_food FROM seed_ctx) AS category_id,
    '08:00-21:00'::text AS business_hours,
    jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('traditional cantonese restaurant exterior, guangzhou, realistic photo, warm lighting'::bytea,'escape') || '&image_size=landscape_16_9')::text AS images,
    4.5::real AS avg_rating,
    2::int AS review_count
  UNION ALL
  SELECT '陶陶居(正佳广场店)', '广式点心热门店，虾饺烧卖与奶黄包很受欢迎。', '天河区天河路228号正佳广场', '020-38331888', (SELECT cat_food FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('dim sum restaurant interior, traditional cantonese tea house, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '炳胜品味(珠江新城店)', '主打粤菜与海鲜，环境和服务在线。', '天河区珠江新城冼村路', '020-38035888', (SELECT cat_food FROM seed_ctx), '11:00-15:00,17:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('high end cantonese restaurant, seafood, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '点都德(北京路店)', '经典广式茶楼体验，出品稳定，上菜速度快。', '越秀区北京路步行街附近', '020-83332888', (SELECT cat_food FROM seed_ctx), '08:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('cantonese tea house, guangzhou, crowded, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '永利饭店(芳村店)', '街坊口碑老店，家常粤菜分量足。', '荔湾区芳村大道附近', '020-81500000', (SELECT cat_food FROM seed_ctx), '10:30-21:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('local cantonese restaurant exterior, guangzhou street, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '南信牛奶甜品专家(上下九店)', '经典广式甜品，姜撞奶与双皮奶很出名。', '荔湾区第十甫路附近(上下九商圈)', '020-81390000', (SELECT cat_food FROM seed_ctx), '10:00-22:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('guangzhou dessert shop, milk pudding, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '莲香楼(北京路店)', '老字号茶楼，传统点心与茶位文化体验。', '越秀区北京路附近', '020-83330000', (SELECT cat_food FROM seed_ctx), '08:00-21:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('historic tea house in guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '利苑酒家(天河店)', '口碑港式酒家，烧味与点心都不错。', '天河区天河路商圈附近', '020-38880000', (SELECT cat_food FROM seed_ctx), '11:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('cantonese fine dining restaurant, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2

  UNION ALL
  SELECT '广州塔(小蛮腰)', '广州地标观景体验，夜景很震撼。', '海珠区阅江西路222号', '020-89338222', (SELECT cat_fun FROM seed_ctx), '09:30-22:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('canton tower at night, guangzhou skyline, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.5::real, 2
  UNION ALL
  SELECT '长隆欢乐世界', '大型游乐园，过山车项目很刺激。', '番禺区汉溪大道东299号', '400-883-0088', (SELECT cat_fun FROM seed_ctx), '09:30-18:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('amusement park roller coaster, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '长隆野生动物世界', '亲子必去，动物种类多，建议工作日错峰。', '番禺区大石街105国道附近', '400-883-0088', (SELECT cat_fun FROM seed_ctx), '09:30-18:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('safari park, animals, family trip, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '正佳极地海洋世界', '室内海洋馆，适合带娃雨天出行。', '天河区天河路228号正佳广场', '020-38332222', (SELECT cat_fun FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('indoor aquarium, penguins, blue lighting, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '广东省博物馆(新馆)', '展陈丰富，周末人多需要提前预约。', '天河区珠江东路2号', '020-38046886', (SELECT cat_fun FROM seed_ctx), '09:00-17:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('modern museum building, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '陈家祠(广东民间工艺博物馆)', '岭南建筑精华，拍照很出片。', '荔湾区中山七路34号', '020-81814559', (SELECT cat_fun FROM seed_ctx), '08:30-17:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('chen clan ancestral hall, lingnan architecture, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '沙面岛', '欧陆风情街区，适合散步和拍照。', '荔湾区沙面南街', '020-00000000', (SELECT cat_fun FROM seed_ctx), '全天开放', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('shamian island european style street, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '珠江夜游(大沙头码头)', '夜游珠江看两岸夜景，建议提前取票。', '越秀区沿江东路466号大沙头码头', '020-83332222', (SELECT cat_fun FROM seed_ctx), '18:30-22:30', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('pearl river night cruise, guangzhou lights, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2

  UNION ALL
  SELECT 'Kraemer Paris 1895(igc店)', '法式发型设计，剪染烫口碑不错。', '天河区兴民路222号天汇广场igc', '020-38833333', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('luxury hair salon interior, paris style, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '苏豪路易士·嘉玛发廊(太古汇店)', '服务细致，适合做染烫与造型。', '天河区天河路383号太古汇', '020-38682222', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('premium hair salon, stylist working, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '美丽田园(珠江新城店)', '美容护理项目多，环境干净。', '天河区珠江新城花城大道商圈附近', '020-38832222', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('spa and beauty salon room, clean minimal, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '奈瑞儿(天河店)', '连锁美容护理，项目标准化。', '天河区天河路商圈附近', '020-38990000', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('beauty clinic reception, modern, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '丝域养发馆(天河城店)', '养发护理和头皮管理，适合放松。', '天河区天河路208号天河城附近', '020-38810000', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('hair scalp treatment salon, relaxing, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '丝域养发馆(北京路店)', '店面不大但服务到位，适合日常护理。', '越秀区北京路商圈附近', '020-83310000', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('small hair treatment shop, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.0::real, 2
  UNION ALL
  SELECT '屈臣氏(正佳广场店)', '日常美妆护理用品齐全，补货快。', '天河区天河路228号正佳广场', '020-38330000', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('cosmetics store shelves, bright lighting, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.0::real, 2
  UNION ALL
  SELECT '丝芙兰(太古汇店)', '国际美妆集合店，适合试色与选礼物。', '天河区天河路383号太古汇', '020-38980000', (SELECT cat_beauty FROM seed_ctx), '10:00-22:00', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('sephora style cosmetics store, modern, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2

  UNION ALL
  SELECT '广州四季酒店', '地标级奢华酒店，景观房夜景很绝。', '天河区珠江新城珠江西路5号', '020-88833888', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('luxury hotel exterior night, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.5::real, 2
  UNION ALL
  SELECT '广州W酒店', '年轻潮流风格，酒吧和泳池氛围感强。', '天河区珠江新城珠江东路26号', '020-66286628', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('w hotel style modern exterior, night, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '白天鹅宾馆', '经典老牌五星，沙面江景很舒服。', '荔湾区沙面南街1号', '020-81886968', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('historic luxury hotel exterior, guangzhou shamian, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '广州柏悦酒店', '高空景观很赞，位置方便适合商务。', '天河区珠江新城华夏路16号', '020-37691234', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('park hyatt style luxury hotel, modern, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '广州香格里拉大酒店', '会展附近，餐饮和亲子配套齐全。', '海珠区会展东路1号', '020-89178888', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('shangri la hotel guangzhou exterior, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
  UNION ALL
  SELECT '广州康莱德酒店', '设计感强，服务到位，适合度假。', '天河区珠江新城兴民路222号', '020-88833888', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('conrad hotel modern lobby, luxury, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 3.5::real, 2
  UNION ALL
  SELECT '广州富力丽思卡尔顿酒店', '经典奢华，行政酒廊体验好。', '天河区珠江新城珠江西路3号', '020-38136888', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('ritz carlton hotel exterior, guangzhou, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.5::real, 2
  UNION ALL
  SELECT '广州文华东方酒店', '位置在天河核心，房间品质稳定。', '天河区天河路389号', '020-38088888', (SELECT cat_stay FROM seed_ctx), '24小时营业', jsonb_build_array('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' || encode('mandarin oriental style luxury hotel exterior, realistic photo'::bytea,'escape') || '&image_size=landscape_16_9')::text, 4.0::real, 2
) v
WHERE NOT EXISTS (
  SELECT 1 FROM merchants m WHERE m.name = v.name AND m.address = v.address
);

WITH seed_ctx AS (
  SELECT
    (SELECT id FROM users WHERE email = 'seed_user1@zhenxiang.local' LIMIT 1) AS user1_id,
    (SELECT id FROM users WHERE email = 'seed_user2@zhenxiang.local' LIMIT 1) AS user2_id
)

INSERT INTO reviews (merchant_id, user_id, rating, content)
SELECT m.id, (SELECT user1_id FROM seed_ctx), r.rating, r.content
FROM merchants m
JOIN (
  SELECT '广州酒家(文昌总店)'::text AS name, '荔湾区文昌南路2号'::text AS address, 5::int AS rating, '点心出品很稳，虾饺皮薄馅足，环境也舒服。'::text AS content
  UNION ALL SELECT '广州酒家(文昌总店)', '荔湾区文昌南路2号', 2, '周末排队太久，服务有点忙不过来。'
  UNION ALL SELECT '陶陶居(正佳广场店)', '天河区天河路228号正佳广场', 4, '奶黄包很香，点心选择多，适合带家人。'
  UNION ALL SELECT '陶陶居(正佳广场店)', '天河区天河路228号正佳广场', 2, '人多上菜慢，菜品有时偏油。'
  UNION ALL SELECT '炳胜品味(珠江新城店)', '天河区珠江新城冼村路', 5, '海鲜新鲜，服务专业，适合请客。'
  UNION ALL SELECT '炳胜品味(珠江新城店)', '天河区珠江新城冼村路', 2, '价格偏高，热门时段等位时间长。'
  UNION ALL SELECT '点都德(北京路店)', '越秀区北京路步行街附近', 4, '早茶氛围很好，出品稳定。'
  UNION ALL SELECT '点都德(北京路店)', '越秀区北京路步行街附近', 2, '口味偏咸，座位有点挤。'
  UNION ALL SELECT '永利饭店(芳村店)', '荔湾区芳村大道附近', 4, '家常粤菜分量足，性价比不错。'
  UNION ALL SELECT '永利饭店(芳村店)', '荔湾区芳村大道附近', 2, '环境比较旧，停车不太方便。'
  UNION ALL SELECT '南信牛奶甜品专家(上下九店)', '荔湾区第十甫路附近(上下九商圈)', 5, '双皮奶细腻，姜撞奶很地道。'
  UNION ALL SELECT '南信牛奶甜品专家(上下九店)', '荔湾区第十甫路附近(上下九商圈)', 2, '人多时出品不够稳定，等位时间长。'
  UNION ALL SELECT '莲香楼(北京路店)', '越秀区北京路附近', 4, '老字号氛围拉满，传统点心很有味道。'
  UNION ALL SELECT '莲香楼(北京路店)', '越秀区北京路附近', 2, '服务节奏慢，茶位费略高。'
  UNION ALL SELECT '利苑酒家(天河店)', '天河区天河路商圈附近', 5, '烧味出色，点心口感细致。'
  UNION ALL SELECT '利苑酒家(天河店)', '天河区天河路商圈附近', 2, '高峰期拥挤，部分菜品偏贵。'

  UNION ALL SELECT '广州塔(小蛮腰)', '海珠区阅江西路222号', 5, '夜景真的震撼，拍照很出片。'
  UNION ALL SELECT '广州塔(小蛮腰)', '海珠区阅江西路222号', 2, '人流大排队久，建议错峰。'
  UNION ALL SELECT '长隆欢乐世界', '番禺区汉溪大道东299号', 5, '项目多很刺激，玩一天都不够。'
  UNION ALL SELECT '长隆欢乐世界', '番禺区汉溪大道东299号', 2, '人太多体验打折，排队时间长。'
  UNION ALL SELECT '长隆野生动物世界', '番禺区大石街105国道附近', 5, '动物很丰富，孩子特别喜欢。'
  UNION ALL SELECT '长隆野生动物世界', '番禺区大石街105国道附近', 2, '夏天太晒，步行路线较长。'
  UNION ALL SELECT '正佳极地海洋世界', '天河区天河路228号正佳广场', 4, '室内项目适合雨天，表演不错。'
  UNION ALL SELECT '正佳极地海洋世界', '天河区天河路228号正佳广场', 2, '票价偏贵，节假日人太多。'
  UNION ALL SELECT '广东省博物馆(新馆)', '天河区珠江东路2号', 5, '展览很棒，知识量很大，值得慢慢逛。'
  UNION ALL SELECT '广东省博物馆(新馆)', '天河区珠江东路2号', 2, '热门展厅拥挤，预约名额紧张。'
  UNION ALL SELECT '陈家祠(广东民间工艺博物馆)', '荔湾区中山七路34号', 5, '建筑细节惊艳，岭南风格很有特色。'
  UNION ALL SELECT '陈家祠(广东民间工艺博物馆)', '荔湾区中山七路34号', 2, '游客多，拍照需要耐心等空位。'
  UNION ALL SELECT '沙面岛', '荔湾区沙面南街', 4, '很适合散步，氛围悠闲舒服。'
  UNION ALL SELECT '沙面岛', '荔湾区沙面南街', 2, '周末人多车多，体验一般。'
  UNION ALL SELECT '珠江夜游(大沙头码头)', '越秀区沿江东路466号大沙头码头', 4, '两岸灯光很美，适合带家人。'
  UNION ALL SELECT '珠江夜游(大沙头码头)', '越秀区沿江东路466号大沙头码头', 2, '有时会延误，建议提前到场。'

  UNION ALL SELECT 'Kraemer Paris 1895(igc店)', '天河区兴民路222号天汇广场igc', 5, '设计师沟通细致，剪完很显气质。'
  UNION ALL SELECT 'Kraemer Paris 1895(igc店)', '天河区兴民路222号天汇广场igc', 2, '价格偏高，热门时段需要等位。'
  UNION ALL SELECT '苏豪路易士·嘉玛发廊(太古汇店)', '天河区天河路383号太古汇', 5, '染发效果自然，护理也很到位。'
  UNION ALL SELECT '苏豪路易士·嘉玛发廊(太古汇店)', '天河区天河路383号太古汇', 2, '项目推销有点多，建议提前沟通。'
  UNION ALL SELECT '美丽田园(珠江新城店)', '天河区珠江新城花城大道商圈附近', 4, '环境干净，护理流程很规范。'
  UNION ALL SELECT '美丽田园(珠江新城店)', '天河区珠江新城花城大道商圈附近', 2, '部分项目价格偏高，体验一般。'
  UNION ALL SELECT '奈瑞儿(天河店)', '天河区天河路商圈附近', 4, '服务态度不错，项目选择多。'
  UNION ALL SELECT '奈瑞儿(天河店)', '天河区天河路商圈附近', 2, '高峰期安排紧，等待时间长。'
  UNION ALL SELECT '丝域养发馆(天河城店)', '天河区天河路208号天河城附近', 4, '头皮护理很舒服，放松效果好。'
  UNION ALL SELECT '丝域养发馆(天河城店)', '天河区天河路208号天河城附近', 2, '项目较多，套餐选择需要研究。'
  UNION ALL SELECT '丝域养发馆(北京路店)', '越秀区北京路商圈附近', 4, '服务挺细致，适合日常养护。'
  UNION ALL SELECT '丝域养发馆(北京路店)', '越秀区北京路商圈附近', 2, '店面较小，预约紧张。'
  UNION ALL SELECT '屈臣氏(正佳广场店)', '天河区天河路228号正佳广场', 4, '商品齐全，补货快，逛起来方便。'
  UNION ALL SELECT '屈臣氏(正佳广场店)', '天河区天河路228号正佳广场', 2, '高峰期结账排队久。'
  UNION ALL SELECT '丝芙兰(太古汇店)', '天河区天河路383号太古汇', 4, '试色体验好，服务比较专业。'
  UNION ALL SELECT '丝芙兰(太古汇店)', '天河区天河路383号太古汇', 2, '热门产品经常缺货。'

  UNION ALL SELECT '广州四季酒店', '天河区珠江新城珠江西路5号', 5, '景观房太赞了，服务细节拉满。'
  UNION ALL SELECT '广州四季酒店', '天河区珠江新城珠江西路5号', 2, '价格偏高，旺季办理入住较慢。'
  UNION ALL SELECT '广州W酒店', '天河区珠江新城珠江东路26号', 4, '氛围很潮，公共区域拍照很好看。'
  UNION ALL SELECT '广州W酒店', '天河区珠江新城珠江东路26号', 2, '隔音一般，周末会比较热闹。'
  UNION ALL SELECT '白天鹅宾馆', '荔湾区沙面南街1号', 5, '江景很舒服，老牌酒店底蕴在。'
  UNION ALL SELECT '白天鹅宾馆', '荔湾区沙面南街1号', 2, '部分设施偏旧，但整体还行。'
  UNION ALL SELECT '广州柏悦酒店', '天河区珠江新城华夏路16号', 5, '位置方便，房间质感很棒。'
  UNION ALL SELECT '广州柏悦酒店', '天河区珠江新城华夏路16号', 2, '早餐一般，性价比不算高。'
  UNION ALL SELECT '广州香格里拉大酒店', '海珠区会展东路1号', 4, '配套齐全，适合家庭出行。'
  UNION ALL SELECT '广州香格里拉大酒店', '海珠区会展东路1号', 2, '会展期间人多，服务响应慢。'
  UNION ALL SELECT '广州康莱德酒店', '天河区珠江新城兴民路222号', 4, '设计感强，服务比较到位。'
  UNION ALL SELECT '广州康莱德酒店', '天河区珠江新城兴民路222号', 2, '部分房型朝向一般，价格偏高。'
  UNION ALL SELECT '广州富力丽思卡尔顿酒店', '天河区珠江新城珠江西路3号', 5, '行政酒廊体验很好，服务一流。'
  UNION ALL SELECT '广州富力丽思卡尔顿酒店', '天河区珠江新城珠江西路3号', 2, '周末入住办理时间略长。'
  UNION ALL SELECT '广州文华东方酒店', '天河区天河路389号', 4, '位置很核心，房间品质稳定。'
  UNION ALL SELECT '广州文华东方酒店', '天河区天河路389号', 2, '高峰期早餐排队，体验一般。'
) r
  ON m.name = r.name AND m.address = r.address
WHERE NOT EXISTS (
  SELECT 1 FROM reviews rr
  WHERE rr.merchant_id = m.id AND rr.user_id = (SELECT user1_id FROM seed_ctx) AND rr.content = r.content
);

WITH seed_ctx AS (
  SELECT
    (SELECT id FROM users WHERE email = 'seed_user1@zhenxiang.local' LIMIT 1) AS user1_id,
    (SELECT id FROM users WHERE email = 'seed_user2@zhenxiang.local' LIMIT 1) AS user2_id
)

INSERT INTO reviews (merchant_id, user_id, rating, content)
SELECT m.id, (SELECT user2_id FROM seed_ctx), r.rating, r.content
FROM merchants m
JOIN (
  SELECT '广州酒家(文昌总店)'::text AS name, '荔湾区文昌南路2号'::text AS address, 4::int AS rating, '烧味很香，整体体验不错，适合聚餐。'::text AS content
  UNION ALL SELECT '陶陶居(正佳广场店)', '天河区天河路228号正佳广场', 3, '出品还可以，但人多时体验一般。'
  UNION ALL SELECT '炳胜品味(珠江新城店)', '天河区珠江新城冼村路', 4, '服务周到，菜品稳定，适合宴请。'
  UNION ALL SELECT '点都德(北京路店)', '越秀区北京路步行街附近', 3, '价格合理，适合早茶打卡。'
  UNION ALL SELECT '永利饭店(芳村店)', '荔湾区芳村大道附近', 3, '口味家常，吃得舒服。'
  UNION ALL SELECT '南信牛奶甜品专家(上下九店)', '荔湾区第十甫路附近(上下九商圈)', 4, '甜品口感好，值得回购。'
  UNION ALL SELECT '莲香楼(北京路店)', '越秀区北京路附近', 3, '氛围复古，适合体验老广州。'
  UNION ALL SELECT '利苑酒家(天河店)', '天河区天河路商圈附近', 4, '点心做工细，整体很满意。'

  UNION ALL SELECT '广州塔(小蛮腰)', '海珠区阅江西路222号', 4, '观景视野很好，夜景很漂亮。'
  UNION ALL SELECT '长隆欢乐世界', '番禺区汉溪大道东299号', 3, '好玩但累，建议准备好防晒。'
  UNION ALL SELECT '长隆野生动物世界', '番禺区大石街105国道附近', 3, '整体不错，建议早到避开人潮。'
  UNION ALL SELECT '正佳极地海洋世界', '天河区天河路228号正佳广场', 3, '适合亲子，性价比一般。'
  UNION ALL SELECT '广东省博物馆(新馆)', '天河区珠江东路2号', 4, '馆藏丰富，适合半天深度游。'
  UNION ALL SELECT '陈家祠(广东民间工艺博物馆)', '荔湾区中山七路34号', 4, '建筑很震撼，值得一看。'
  UNION ALL SELECT '沙面岛', '荔湾区沙面南街', 3, '散步不错，拍照需要避开人流。'
  UNION ALL SELECT '珠江夜游(大沙头码头)', '越秀区沿江东路466号大沙头码头', 3, '体验尚可，建议选天气好的晚上。'

  UNION ALL SELECT 'Kraemer Paris 1895(igc店)', '天河区兴民路222号天汇广场igc', 4, '剪发很细致，效果符合预期。'
  UNION ALL SELECT '苏豪路易士·嘉玛发廊(太古汇店)', '天河区天河路383号太古汇', 3, '效果不错，但要提前预约。'
  UNION ALL SELECT '美丽田园(珠江新城店)', '天河区珠江新城花城大道商圈附近', 3, '护理流程规范，体验中规中矩。'
  UNION ALL SELECT '奈瑞儿(天河店)', '天河区天河路商圈附近', 3, '连锁门店，服务稳定。'
  UNION ALL SELECT '丝域养发馆(天河城店)', '天河区天河路208号天河城附近', 3, '适合放松，效果看个人。'
  UNION ALL SELECT '丝域养发馆(北京路店)', '越秀区北京路商圈附近', 3, '预约方便，服务还行。'
  UNION ALL SELECT '屈臣氏(正佳广场店)', '天河区天河路228号正佳广场', 3, '买日用品方便。'
  UNION ALL SELECT '丝芙兰(太古汇店)', '天河区天河路383号太古汇', 3, '可选品牌多，但热门缺货。'

  UNION ALL SELECT '广州四季酒店', '天河区珠江新城珠江西路5号', 4, '服务很专业，入住体验不错。'
  UNION ALL SELECT '广州W酒店', '天河区珠江新城珠江东路26号', 3, '风格很年轻，住得还行。'
  UNION ALL SELECT '白天鹅宾馆', '荔湾区沙面南街1号', 4, '景观很好，整体很舒适。'
  UNION ALL SELECT '广州柏悦酒店', '天河区珠江新城华夏路16号', 4, '房间质感不错，位置也方便。'
  UNION ALL SELECT '广州香格里拉大酒店', '海珠区会展东路1号', 3, '配套齐全，适合会展出行。'
  UNION ALL SELECT '广州康莱德酒店', '天河区珠江新城兴民路222号', 3, '设计感很强，整体满意。'
  UNION ALL SELECT '广州富力丽思卡尔顿酒店', '天河区珠江新城珠江西路3号', 4, '服务稳定，体验在线。'
  UNION ALL SELECT '广州文华东方酒店', '天河区天河路389号', 3, '位置好，性价比一般。'
) r
  ON m.name = r.name AND m.address = r.address
WHERE NOT EXISTS (
  SELECT 1 FROM reviews rr
  WHERE rr.merchant_id = m.id AND rr.user_id = (SELECT user2_id FROM seed_ctx) AND rr.content = r.content
);

UPDATE merchants m
SET
  avg_rating = s.avg_rating,
  review_count = s.review_count
FROM (
  SELECT merchant_id, AVG(rating)::real AS avg_rating, COUNT(*)::int AS review_count
  FROM reviews
  GROUP BY merchant_id
) s
WHERE s.merchant_id = m.id;

