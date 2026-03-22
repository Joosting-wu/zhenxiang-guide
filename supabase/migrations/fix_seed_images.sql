UPDATE merchants
SET images = CASE name
  WHEN '广州酒家(文昌总店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=traditional+cantonese+restaurant+exterior+guangzhou+warm+lighting+realistic+photo&image_size=landscape_16_9"]'
  WHEN '陶陶居(正佳广场店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=dim+sum+tea+house+interior+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '炳胜品味(珠江新城店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=high+end+cantonese+seafood+restaurant+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '点都德(北京路店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cantonese+tea+house+guangzhou+busy+morning+realistic+photo&image_size=landscape_16_9"]'
  WHEN '永利饭店(芳村店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=local+cantonese+restaurant+guangzhou+street+realistic+photo&image_size=landscape_16_9"]'
  WHEN '南信牛奶甜品专家(上下九店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=guangzhou+dessert+shop+double+skin+milk+realistic+photo&image_size=landscape_16_9"]'
  WHEN '莲香楼(北京路店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=historic+tea+house+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '利苑酒家(天河店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cantonese+fine+dining+restaurant+guangzhou+realistic+photo&image_size=landscape_16_9"]'

  WHEN '广州塔(小蛮腰)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=canton+tower+guangzhou+night+skyline+realistic+photo&image_size=landscape_16_9"]'
  WHEN '长隆欢乐世界' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=amusement+park+roller+coaster+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '长隆野生动物世界' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=safari+park+guangzhou+animals+family+realistic+photo&image_size=landscape_16_9"]'
  WHEN '正佳极地海洋世界' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=indoor+aquarium+guangzhou+blue+lighting+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广东省博物馆(新馆)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=guangdong+museum+modern+building+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '陈家祠(广东民间工艺博物馆)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=chen+clan+ancestral+hall+guangzhou+lingnan+architecture+realistic+photo&image_size=landscape_16_9"]'
  WHEN '沙面岛' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=shamian+island+guangzhou+european+style+street+realistic+photo&image_size=landscape_16_9"]'
  WHEN '珠江夜游(大沙头码头)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=pearl+river+night+cruise+guangzhou+city+lights+realistic+photo&image_size=landscape_16_9"]'

  WHEN 'Kraemer Paris 1895(igc店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury+hair+salon+interior+modern+realistic+photo&image_size=landscape_16_9"]'
  WHEN '苏豪路易士·嘉玛发廊(太古汇店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium+hair+salon+stylist+working+realistic+photo&image_size=landscape_16_9"]'
  WHEN '美丽田园(珠江新城店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=spa+beauty+salon+clean+minimal+realistic+photo&image_size=landscape_16_9"]'
  WHEN '奈瑞儿(天河店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+clinic+reception+modern+realistic+photo&image_size=landscape_16_9"]'
  WHEN '丝域养发馆(天河城店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=scalp+treatment+salon+relaxing+realistic+photo&image_size=landscape_16_9"]'
  WHEN '丝域养发馆(北京路店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=small+hair+treatment+shop+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '屈臣氏(正佳广场店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cosmetics+store+shelves+bright+lighting+realistic+photo&image_size=landscape_16_9"]'
  WHEN '丝芙兰(太古汇店)' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beauty+store+makeup+display+modern+realistic+photo&image_size=landscape_16_9"]'

  WHEN '广州四季酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury+hotel+exterior+night+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州W酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern+design+hotel+exterior+night+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '白天鹅宾馆' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=historic+luxury+hotel+exterior+shamian+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州柏悦酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=park+hyatt+style+luxury+hotel+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州香格里拉大酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=shangri+la+hotel+guangzhou+exterior+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州康莱德酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=conrad+hotel+modern+luxury+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州富力丽思卡尔顿酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=ritz+carlton+hotel+exterior+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  WHEN '广州文华东方酒店' THEN '["https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=mandarin+oriental+style+luxury+hotel+guangzhou+realistic+photo&image_size=landscape_16_9"]'
  ELSE images
END
WHERE name IN (
  '广州酒家(文昌总店)','陶陶居(正佳广场店)','炳胜品味(珠江新城店)','点都德(北京路店)','永利饭店(芳村店)','南信牛奶甜品专家(上下九店)','莲香楼(北京路店)','利苑酒家(天河店)',
  '广州塔(小蛮腰)','长隆欢乐世界','长隆野生动物世界','正佳极地海洋世界','广东省博物馆(新馆)','陈家祠(广东民间工艺博物馆)','沙面岛','珠江夜游(大沙头码头)',
  'Kraemer Paris 1895(igc店)','苏豪路易士·嘉玛发廊(太古汇店)','美丽田园(珠江新城店)','奈瑞儿(天河店)','丝域养发馆(天河城店)','丝域养发馆(北京路店)','屈臣氏(正佳广场店)','丝芙兰(太古汇店)',
  '广州四季酒店','广州W酒店','白天鹅宾馆','广州柏悦酒店','广州香格里拉大酒店','广州康莱德酒店','广州富力丽思卡尔顿酒店','广州文华东方酒店'
);

