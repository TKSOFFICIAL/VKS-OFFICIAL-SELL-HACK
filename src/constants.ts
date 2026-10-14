import { Plan } from './types';

export const APP_NAME = "VKS OFFICIAL";
export const APP_SUBTITLE = "WINGO 1 MINUTE";
export const APP_FULL_TITLE = "VKS OFFICIAL × WINGO 1M";

export const LOGO_IMG_URL = "https://i.supaimg.com/0f7fb06a-9122-4153-aaea-0e6022d89dd6/2524e09a-620a-439b-95f1-87afcb1bdc40.png";
export const PAYMENT_QR_URL = "https://i.supaimg.com/0f7fb06a-9122-4153-aaea-0e6022d89dd6/4154415d-05f9-460a-bd64-fbe28b964902.jpg";
export const TELEGRAM_SUPPORT_URL = "https://t.me/VKS_HACKER_57";

export const BALL_IMAGES: Record<number, string> = {
  0:'https://i.postimg.cc/Wzrp0gRV/ball-0-053d2b99.png',
  1:'https://i.postimg.cc/Qt7ZzDfk/ball-1-12ea01b7.png',
  2:'https://i.postimg.cc/zvSZJjZy/ball-2-7d433738.png',
  3:'https://i.postimg.cc/7hyr8Rcv/ball-3-a91cceac.png',
  4:'https://i.postimg.cc/WbTc5Qgg/ball-4-cad06388.png',
  5:'https://i.postimg.cc/28GRM27J/ball-5-8e182f0c.png',
  6:'https://i.postimg.cc/c1QNMsgd/ball-6-44a39882.png',
  7:'https://i.postimg.cc/2S5RDhH5/ball-7-c8babe29.png',
  8:'https://i.postimg.cc/R03k39x5/ball-8-9d781b7c.png',
  9:'https://i.postimg.cc/cL5q4CjB/ball-9-19985870.png'
};

export const STICKER_START = "CAACAgUAAxkBAAEDH3pp1yC5Rq3-WImx-GR3Kem6nXrNKAACUhYAAlEJ-VVZvLkjcrQPSTsE";
export const STICKER_WIN = "CAACAgUAAxkBAAEDUFFp4uG2kqSUPoEhjXOrZvIyRWJZpgAC1B8AAkQuiFfT5S_yymqYUzsE";
export const STICKER_JACKPOT = "CAACAgUAAxkBAAEDH3hp1x01BvGlKApIjJ1zFa1-8da_yAACXhwAAlFs8VWRMlqGL4ul-zsE";

export const WINGO_API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

// Plans requested: 199 rs 2 Hours, 499 rs 1 day, 999 rs 7 day, 1500 rs 30 day
export const PLANS: Plan[] = [
  { price: 199, duration: "2 Hours", hours: 2, label: "Basic" },
  { price: 499, duration: "1 Day", hours: 24, label: "Premium" },
  { price: 999, duration: "7 Days", hours: 168, label: "Premium" },
  { price: 1500, duration: "30 Days", hours: 720, label: "Premium" }
];

export const DEVICE_LIST = [
  "Realme 8", "Realme 8 Pro", "Realme 9", "Realme 9i", "Realme 9 Pro", "Realme 9 Pro+", "Realme 10", "Realme 10 Pro", "Realme 10 Pro+",
  "Realme 11", "Realme 11x", "Realme 11 Pro", "Realme 11 Pro+", "Realme 12", "Realme 12+", "Realme 12 Pro", "Realme 12 Pro+",
  "Realme 13", "Realme 13+", "Realme 13 Pro", "Realme 13 Pro+", "Realme P1", "Realme P1 Pro", "Realme P4 Power", "Realme P4 Pro",
  "Realme Narzo 50", "Realme Narzo 60", "Realme Narzo 70", "Realme Narzo N53", "Realme C55", "Realme C53",
  "Vivo T4 Ultra", "Vivo T4", "Vivo T4x", "Vivo T4 Pro", "Vivo Y16", "Vivo Y18", "Vivo Y28", "Vivo Y36",
  "Vivo T1", "Vivo T2", "Vivo T3", "Vivo V23", "Vivo V25", "Vivo V27", "Vivo V29", "Vivo V30", "Vivo X90", "Vivo X100",
  "Samsung Galaxy A14", "Samsung Galaxy A15", "Samsung Galaxy A23", "Samsung Galaxy A34", "Samsung Galaxy A35", "Samsung Galaxy A54", "Samsung Galaxy A55",
  "Samsung Galaxy M14", "Samsung Galaxy M34", "Samsung Galaxy M35", "Samsung Galaxy S21", "Samsung Galaxy S22", "Samsung Galaxy S23",
  "Samsung Galaxy S24", "Samsung Galaxy S24 Ultra", "Samsung Galaxy Z Flip 5", "Samsung Galaxy Z Fold 5",
  "OPPO A18", "OPPO A38", "OPPO A58", "OPPO F21 Pro", "OPPO F23", "OPPO Reno 8", "OPPO Reno 10", "OPPO Reno 11",
  "Redmi 11", "Redmi 12", "Redmi 13", "Redmi Note 11", "Redmi Note 12", "Redmi Note 13", "Redmi Note 13 Pro+", "Xiaomi 13", "Xiaomi 14",
  "POCO M4", "POCO M6", "POCO X5", "POCO X6 Pro", "POCO F5", "POCO F6",
  "iPhone 12", "iPhone 13", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Pro Max",
  "OnePlus 9", "OnePlus 10", "OnePlus 11", "OnePlus 12", "OnePlus 12R", "OnePlus Nord 2", "OnePlus Nord 3", "OnePlus Nord CE 3", "OnePlus Nord CE 4",
  "Motorola Edge 40", "Motorola Edge 50", "Moto G85", "Nothing Phone 1", "Nothing Phone 2", "Nothing Phone 2a",
  "Google Pixel 7", "Google Pixel 8", "Google Pixel 8 Pro", "Google Pixel 9",
  "iQOO Z7", "iQOO Z9", "iQOO Neo 7", "iQOO Neo 9", "iQOO 12", "Infinix GT 10 Pro", "Infinix Note 40"
];
