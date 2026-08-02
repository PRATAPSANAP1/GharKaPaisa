import hdfcImg from "../CreditCards/image/HDFC/hdfc.png";
import sbiImg from "../CreditCards/image/SBI/SBI.png";
import axisImg from "../CreditCards/image/AXIS/AXIS.png";
import iciciImg from "../CreditCards/image/icici/ICICI.png";
import yesImg from "../CreditCards/image/yes/yes bank.png";
import kotakImg from "../CreditCards/image/kotak/KOTAK.png";

export const popularCards = [
  { 
    name: "HDFC Millennia", 
    bank: "HDFC Bank", 
    features: ["5% Cashback", "Lounge Access", "Zero Forex"],
    image: hdfcImg
  },
  { 
    name: "SBI SimplyCLICK", 
    bank: "SBI Card", 
    features: ["10X Rewards", "Amazon Voucher", "Fuel Waiver"],
    image: sbiImg
  },
  { 
    name: "Axis Neo", 
    bank: "Axis Bank", 
    features: ["10% Off Dining", "BookMyShow Deals", "Reward Points"],
    image: axisImg
  },
  { 
    name: "ICICI Coral", 
    bank: "ICICI Bank", 
    features: ["Movie Discounts", "Dining Rewards", "Lounge Access"],
    image: iciciImg
  },
  { 
    name: "Yes Bank BYOC", 
    bank: "Yes Bank", 
    features: ["Custom Rewards", "Flexible Categories", "Welcome Bonus"],
    image: yesImg
  },
  { 
    name: "Kotak League", 
    bank: "Kotak Bank", 
    features: ["Premium Rewards", "Zero Annual Fee", "Travel Perks"],
    image: kotakImg
  }
];
