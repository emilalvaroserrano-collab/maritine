import React, { useState, useMemo } from 'react';
import {
  X,
  Utensils,
  Download,
  Printer,
  Send,
  Calendar,
  Users,
  DollarSign,
  Globe,
  Check,
  FileSpreadsheet,
  PieChart,
  ChefHat,
  Coffee,
  Sun,
  Moon,
  Clock,
  Ship,
  ExternalLink,
  Search,
  Copy,
  ChevronDown,
  ChevronUp,
  Snowflake,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Info
} from 'lucide-react';
import { getAccessToken, saveFoodPlanToFirestore, googleSignIn } from '../services/firebase.ts';
import { createGoogleSpreadsheet } from '../services/workspace.ts';

interface FoodPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
  onShowToast?: (msg: string) => void;
}

export type NationalityPreset = 'mixed' | 'filipino' | 'indian' | 'european' | 'slavic';

interface MealDay {
  day: number;
  breakfast: { main: string; side: string; drinks: string; cals?: number };
  lunch: { soup: string; mainAsian: string; mainWestern: string; veg: string; dessert: string; cals?: number };
  dinner: { mainAsian: string; mainWestern: string; side: string; dessert: string; cals?: number };
  midnightSnack: string;
  nutritionNotes?: string;
}

interface ProvisionItem {
  id: string;
  category: string;
  name: string;
  storage: 'freeze' | 'chill' | 'dry';
  unit: string;
  qtyPerPersonDay: number;
  unitPriceUSD: number;
}

const PROVISION_CATALOG_2026: ProvisionItem[] = [
  { id: 'g1', category: 'Grains & Rice', name: 'Jasmine / Long Grain Rice (AAA Grade)', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.35, unitPriceUSD: 1.95 },
  { id: 'g2', category: 'Grains & Rice', name: 'Wheat Flour & Bakery Mix', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.15, unitPriceUSD: 1.40 },
  { id: 'g3', category: 'Grains & Rice', name: 'Pasta & Egg Noodles', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.08, unitPriceUSD: 2.30 },
  { id: 'g4', category: 'Grains & Rice', name: 'Breakfast Cereals & Rolled Oats', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.05, unitPriceUSD: 4.10 },

  { id: 'm1', category: 'Meat & Poultry', name: 'Chicken Cuts & Breast (IQF)', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.30, unitPriceUSD: 6.20 },
  { id: 'm2', category: 'Meat & Poultry', name: 'Beef Cuts & Ground Beef (Prime/Halal)', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.20, unitPriceUSD: 12.80 },
  { id: 'm3', category: 'Meat & Poultry', name: 'Pork Chops & Belly (or Halal Lamb alt)', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.15, unitPriceUSD: 8.40 },
  { id: 'm4', category: 'Meat & Poultry', name: 'Breakfast Sausages & Bacon', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.08, unitPriceUSD: 9.80 },

  { id: 'f1', category: 'Fish & Seafood', name: 'Fish Fillet (Mackerel / Cod IQF)', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.20, unitPriceUSD: 7.60 },
  { id: 'f2', category: 'Fish & Seafood', name: 'Shrimp & Squid Block', storage: 'freeze', unit: 'kg', qtyPerPersonDay: 0.08, unitPriceUSD: 13.50 },

  { id: 'd1', category: 'Dairy & Eggs', name: 'Fresh Inspected Eggs', storage: 'chill', unit: 'pcs', qtyPerPersonDay: 2.0, unitPriceUSD: 0.35 },
  { id: 'd2', category: 'Dairy & Eggs', name: 'UHT Whole Milk (1L Tetrapak)', storage: 'dry', unit: 'liters', qtyPerPersonDay: 0.30, unitPriceUSD: 2.40 },
  { id: 'd3', category: 'Dairy & Eggs', name: 'Salted Butter & Cheddar Cheese', storage: 'chill', unit: 'kg', qtyPerPersonDay: 0.06, unitPriceUSD: 11.50 },

  { id: 'p1', category: 'Produce', name: 'Potatoes & Yellow Onions', storage: 'chill', unit: 'kg', qtyPerPersonDay: 0.35, unitPriceUSD: 1.65 },
  { id: 'p2', category: 'Produce', name: 'Fresh Green Veg (Cabbage, Carrots, Broccoli)', storage: 'chill', unit: 'kg', qtyPerPersonDay: 0.30, unitPriceUSD: 2.85 },
  { id: 'p3', category: 'Produce', name: 'Fresh Fruits (Apples, Oranges, Bananas)', storage: 'chill', unit: 'kg', qtyPerPersonDay: 0.30, unitPriceUSD: 3.20 },

  { id: 's1', category: 'Condiments & Staples', name: 'Cooking Oil & Margarine', storage: 'dry', unit: 'liters', qtyPerPersonDay: 0.08, unitPriceUSD: 3.40 },
  { id: 's2', category: 'Condiments & Staples', name: 'Asian & Western Sauces (Soy, Vinegar, Tomato)', storage: 'dry', unit: 'liters', qtyPerPersonDay: 0.06, unitPriceUSD: 3.60 },
  { id: 's3', category: 'Condiments & Staples', name: 'Garlic, Ginger & Seasoning Mix', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.05, unitPriceUSD: 5.80 },
  { id: 's4', category: 'Condiments & Staples', name: 'Maritime Blend Coffee, Tea & Pure Sugar', storage: 'dry', unit: 'kg', qtyPerPersonDay: 0.06, unitPriceUSD: 5.90 },
];

const PORT_INDEX_2026: Record<string, { multiplier: number; flag: string }> = {
  'Singapore': { multiplier: 1.00, flag: '🇸🇬' },
  'Rotterdam': { multiplier: 1.06, flag: '🇳🇱' },
  'Houston': { multiplier: 1.12, flag: '🇺🇸' },
  'Fujairah': { multiplier: 1.08, flag: '🇦🇪' },
  'Manila': { multiplier: 0.94, flag: '🇵🇭' },
  'Busan': { multiplier: 1.05, flag: '🇰🇷' },
  'Piraeus': { multiplier: 1.05, flag: '🇬🇷' },
};

export const FoodPlannerModal: React.FC<FoodPlannerModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  onShowToast = () => {},
}) => {
  // Parameters
  const [persons, setPersons] = useState<number>(22);
  const [days, setDays] = useState<number>(14);
  const [nationality, setNationality] = useState<NationalityPreset>('mixed');
  const [budgetPerManDay, setBudgetPerManDay] = useState<number>(14.50);
  const [chandlerPort, setChandlerPort] = useState<string>('Singapore');
  const [showCustomParams, setShowCustomParams] = useState(false);

  // Segmented Main Navigation: 'meals' | 'stores' | 'budget' | 'audit'
  const [activeTab, setActiveTab] = useState<'meals' | 'stores' | 'budget' | 'audit'>('meals');

  // Meal Tab Segmented State
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [mealCourseFilter, setMealCourseFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [showDayNutrition, setShowDayNutrition] = useState(false);

  // Stores Tab Segmented State
  const [provisionCat, setProvisionCat] = useState('all');
  const [provisionQuery, setProvisionQuery] = useState('');

  // Audit Tab Segmented State
  const [auditSection, setAuditSection] = useState<'coldchain' | 'water' | 'checklist'>('coldchain');

  // Checkbox state for MLC audit checklist
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({
    chk1: true,
    chk2: true,
    chk3: true,
    chk4: true,
    chk5: false,
    chk6: true,
  });

  // Export states
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [isSavingFirebase, setIsSavingFirebase] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [copiedMenuDay, setCopiedMenuDay] = useState<number | null>(null);

  const portMultiplier = PORT_INDEX_2026[chandlerPort]?.multiplier || 1.00;
  const totalManDays = persons * days;
  const totalBudgetUSD = Number((totalManDays * budgetPerManDay).toFixed(2));

  // Dynamic 7-day schedule
  const mealSchedule: MealDay[] = useMemo(() => {
    const list: MealDay[] = [];

    const templates: Record<NationalityPreset, Array<Omit<MealDay, 'day'>>> = {
      filipino: [
        {
          breakfast: { main: 'Garlic Sinangag & Fried Eggs', side: 'Corned Beef Hash & Tocino', drinks: 'Coffee, Tea, Calamansi Juice', cals: 650 },
          lunch: { soup: 'Sinigang na Baboy Tamarind Broth', mainAsian: 'Chicken Inasal with Atchara', mainWestern: 'Pan-Seared Beef with Steamed Potatoes', veg: 'Garlic Kangkong', dessert: 'Banana & Leche Flan', cals: 1100 },
          dinner: { mainAsian: 'Crispy Pork Belly (Lechon Kawali)', mainWestern: 'Baked Fish Fillet in Lemon Butter', side: 'Jasmine Rice & Cucumber Salad', dessert: 'Fruit Cocktail', cals: 950 },
          midnightSnack: 'Warm Arroz Caldo (Chicken Rice Porridge) & Boiled Egg',
          nutritionNotes: 'High potassium and sodium replenishment for deck watch tropical sweat loss. Total ~3,100 kcal/day.'
        },
        {
          breakfast: { main: 'Pandesal & Cheddar Cheese', side: 'Longganisa Pork Sausage & Eggs', drinks: 'Hot Chocolate & Coffee', cals: 620 },
          lunch: { soup: 'Bulalo Beef Shank & Corn Soup', mainAsian: 'Pork Adobo with Boiled Eggs', mainWestern: 'Grilled Chicken Breast with Mashed Potatoes', veg: 'Chop Suey Veggies', dessert: 'Fresh Papaya & Mango', cals: 1150 },
          dinner: { mainAsian: 'Bistek Tagalog (Beef & Onions)', mainWestern: 'Spaghetti Bolognese with Garlic Toast', side: 'Steamed Rice', dessert: 'Sweet Corn Pudding', cals: 980 },
          midnightSnack: 'Sopas Macaroni Chicken Soup with Crackers',
          nutritionNotes: 'Balanced complex carbohydrates and adequate protein for mooring duty recovery.'
        },
        {
          breakfast: { main: 'Fried Rice & Daing na Bangus (Milkfish)', side: 'Tomato & Salted Egg Salad', drinks: 'Coffee & Orange Juice', cals: 610 },
          lunch: { soup: 'Tinolang Manok Ginger Broth', mainAsian: 'Kare-Kare (Peanut Beef Stew)', mainWestern: 'Roasted Pork Loin with Roasted Veggies', veg: 'Bok Choy with Oyster Sauce', dessert: 'Fresh Watermelon Slices', cals: 1080 },
          dinner: { mainAsian: 'Fried Tilapia / Cod with Sweet & Sour', mainWestern: 'Braised Beef Stew with Carrots', side: 'Jasmine Rice', dessert: 'Buko Pandan Salad', cals: 920 },
          midnightSnack: 'Pancit Canton Guisado with Toasted Garlic Bread',
          nutritionNotes: 'Rich in zinc, vitamin B12, and electrolytes for engine room duty.'
        },
        {
          breakfast: { main: 'Sinangag & Luncheon Meat', side: 'Sunny-side Up Eggs & Baked Beans', drinks: 'Coffee, Tea, Milk', cals: 640 },
          lunch: { soup: 'Cream of Mushroom Soup', mainAsian: 'Chicken Afritada with Bell Peppers', mainWestern: 'Grilled Pork Chops with Gravy & Corn', veg: 'Sauteed Green Beans', dessert: 'Pineapple Rings', cals: 1120 },
          dinner: { mainAsian: 'Beef Caldereta with Liver Paste', mainWestern: 'Baked Cod with Herbs & Butter', side: 'Jasmine Rice & Tossed Salad', dessert: 'Vanilla Ice Cream', cals: 940 },
          midnightSnack: 'Tuna Salad Sandwiches & Hot Ginger Tea (Salabat)',
          nutritionNotes: 'Vitamin C fortified through fresh bell peppers and pineapple.'
        },
        {
          breakfast: { main: 'Champorado (Sweet Chocolate Rice) & Tuyo', side: 'Cheese Omelette & Toast', drinks: 'Coffee & Milk', cals: 660 },
          lunch: { soup: 'Munggo Bean Soup with Spinach & Chicharon', mainAsian: 'Fried Whole Fish / Squid Adobo', mainWestern: 'Beef Stroganoff with Buttered Noodles', veg: 'Ensaladang Talong (Eggplant Salad)', dessert: 'Ripe Bananas', cals: 1100 },
          dinner: { mainAsian: 'Chicken Curry with Coconut Milk', mainWestern: 'Roast Chicken Quarter with Peas', side: 'Steamed Jasmine Rice', dessert: 'Fruit Jelly Cubes', cals: 930 },
          midnightSnack: 'Pancit Bihon Rice Noodles with Calamansi',
          nutritionNotes: 'Legume fiber support and iron-rich mung bean broth.'
        },
        {
          breakfast: { main: 'Pancake Stack & Maple Syrup', side: 'Crispy Bacon & Scrambled Eggs', drinks: 'Coffee, Tea, Orange Juice', cals: 680 },
          lunch: { soup: 'Chicken & Corn Chowder', mainAsian: 'Sweet & Sour Pork with Pineapple', mainWestern: 'Beef Lasagna with Parmesan & Garlic Bread', veg: 'Steamed Broccoli & Cauliflower', dessert: 'Custard Cake', cals: 1180 },
          dinner: { mainAsian: 'Bicol Express (Pork & Chilies in Coconut)', mainWestern: 'Pan-Fried Fish Fillet with Tartar Sauce', side: 'Rice & Fresh Garden Salad', dessert: 'Fresh Apples & Oranges', cals: 960 },
          midnightSnack: 'Ham & Cheddar Cheese Toasties with Hot Cocoa',
          nutritionNotes: 'Weekend morale booster meal meeting international caloric guidelines.'
        },
        {
          breakfast: { main: 'Sunday Maritime Big Breakfast', side: 'Fried Rice, Sausage, Eggs & Hash Brown', drinks: 'Espresso, Tea, Fresh Juice', cals: 720 },
          lunch: { soup: 'Crab & Sweet Corn Soup', mainAsian: 'Sunday Special BBQ Pork & Chicken Skewers', mainWestern: 'Carved Roast Beef with Yorkshire Pudding & Gravy', veg: 'Buttered Mixed Veggies', dessert: 'Fruit Trifle & Ice Cream', cals: 1250 },
          dinner: { mainAsian: 'Seafood Paella / Fried Rice', mainWestern: 'Grilled Lamb Chops with Mint Jelly', side: 'Baked Potatoes & Coleslaw', dessert: 'Cheesecake Slice', cals: 1020 },
          midnightSnack: 'Assorted Steamed Dimsum (Siomai & Dumplings)',
          nutritionNotes: 'Master & Chief Engineer Sunday mess tradition; full vitamin and protein coverage.'
        }
      ],
      mixed: [
        {
          breakfast: { main: 'Continental Eggs to Order & Hash Browns', side: 'Choice of Sausage, Bacon or Beans', drinks: 'Coffee, Black Tea, Fruit Juice', cals: 620 },
          lunch: { soup: 'Vegetable Minestrone Soup', mainAsian: 'Sweet & Sour Chicken with Jasmine Rice', mainWestern: 'Grilled Beef Steak with Roasted Potatoes', veg: 'Steamed French Beans', dessert: 'Fruit Tart & Oranges', cals: 1100 },
          dinner: { mainAsian: 'Beef Stir-Fry with Broccoli & Oyster Sauce', mainWestern: 'Baked Atlantic Salmon / Whitefish Fillet', side: 'Pilaf Rice & Garden Salad', dessert: 'Chocolate Pudding', cals: 950 },
          midnightSnack: 'Club Sandwiches & Warm Chicken Broth',
          nutritionNotes: 'Dual Asian/Western hot line ensuring both Asian ratings and Western officers preferences.'
        },
        {
          breakfast: { main: 'Oatmeal Porridge & Scrambled Eggs', side: 'Grilled Sausages & Toast with Jam', drinks: 'Coffee, Tea, Fresh Milk', cals: 600 },
          lunch: { soup: 'Cream of Tomato Soup with Croutons', mainAsian: 'Pork or Chicken Adobo with Rice', mainWestern: 'Roast Pork Loin with Apple Sauce & Mash', veg: 'Glazed Carrots & Peas', dessert: 'Fresh Banana & Ice Cream', cals: 1120 },
          dinner: { mainAsian: 'Mild Indian Chicken Curry with Naan', mainWestern: 'Spaghetti with Meat Sauce & Parmesan', side: 'Basmati Rice & Mixed Salad', dessert: 'Apple Crumble', cals: 980 },
          midnightSnack: 'Egg & Cheese Toasties with Hot Lemon Tea',
          nutritionNotes: 'High carbohydrate reserves for rough sea watches.'
        },
        {
          breakfast: { main: 'Pancakes / Waffles with Maple Syrup', side: 'Fried Eggs & Ham Slices', drinks: 'Coffee, Earl Grey, Orange Juice', cals: 640 },
          lunch: { soup: 'Chicken Noodle Soup', mainAsian: 'Crispy Fish Fillet in Sweet Chili Sauce', mainWestern: 'Beef Goulash with Steamed Rice / Noodles', veg: 'Sauteed Cabbage & Onions', dessert: 'Canned Peach Halves & Cream', cals: 1090 },
          dinner: { mainAsian: 'Teriyaki Chicken Thighs with Sesame', mainWestern: 'Pan-Seared Pork Chops with Mushroom Gravy', side: 'Steamed Rice & Potato Wedges', dessert: 'Caramel Custard', cals: 940 },
          midnightSnack: 'Vegetable Samosas & Hot Bouillon',
          nutritionNotes: 'Diversified protein sources per MLC guideline B3.2.1.'
        },
        {
          breakfast: { main: 'Fried Rice & Boiled Eggs', side: 'Corned Beef & Baked Beans on Toast', drinks: 'Coffee, Tea, Juice', cals: 630 },
          lunch: { soup: 'Split Pea & Ham Soup', mainAsian: 'Beef & Onion Stir-Fry with Jasmine Rice', mainWestern: 'Roasted Chicken with Thyme & Roast Potatoes', veg: 'Steamed Cauliflower & Broccoli', dessert: 'Fresh Apple Slices', cals: 1110 },
          dinner: { mainAsian: 'Fried Squid & Shrimp with Garlic Rice', mainWestern: 'Shepherd’s Pie with Minced Beef & Mash', side: 'Mixed Green Salad', dessert: 'Fruit Cocktail', cals: 960 },
          midnightSnack: 'Cheese Crackers, Cold Cuts & Instant Noodles',
          nutritionNotes: 'Seafood omega-3 fatty acids integrated.'
        },
        {
          breakfast: { main: 'French Toast & Scrambled Eggs', side: 'Breakfast Sausages & Stewed Prunes', drinks: 'Coffee, Tea, Juice', cals: 610 },
          lunch: { soup: 'Lentil Vegetable Soup (Dal)', mainAsian: 'Pork or Halal Beef Ribs with Sweet Glaze', mainWestern: 'Baked Fish Fillet with Herb Butter', veg: 'Steamed Green Beans', dessert: 'Fresh Oranges & Grapes', cals: 1070 },
          dinner: { mainAsian: 'Chicken Biryani with Raita', mainWestern: 'Roast Beef Slices with Brown Onion Gravy', side: 'Basmati Rice & Roast Potatoes', dessert: 'Tapioca Pearl Pudding', cals: 970 },
          midnightSnack: 'Warm Chicken Rice Congee & Spring Onions',
          nutritionNotes: 'Nutrient-dense slow digesting legumes.'
        },
        {
          breakfast: { main: 'Scrambled Eggs with Herbs & Toast', side: 'Crispy Bacon & Grilled Tomatoes', drinks: 'Coffee, Tea, Fresh Milk', cals: 650 },
          lunch: { soup: 'Cream of Broccoli Soup', mainAsian: 'Sweet & Spicy Pork Chops with Rice', mainWestern: 'Meat Lasagna with Mozzarella Cheese', veg: 'Buttered Sweet Corn', dessert: 'Lemon Tart Slice', cals: 1160 },
          dinner: { mainAsian: 'Beef Salpicao with Garlic Rice', mainWestern: 'Grilled Whitefish Fillet with Tartar Sauce', side: 'French Fries & Garden Salad', dessert: 'Fresh Watermelon', cals: 950 },
          midnightSnack: 'Ham & Tomato Panini Melt with Cocoa',
          nutritionNotes: 'Sufficient calcium and dairy fats.'
        },
        {
          breakfast: { main: 'Sunday Cooked Breakfast to Order', side: 'Eggs, Bacon, Sausage, Mushroom, Toast', drinks: 'Fresh Brewed Coffee & Fruit Juices', cals: 710 },
          lunch: { soup: 'Cream of Asparagus Soup', mainAsian: 'Asian BBQ Pork Belly with Jasmine Rice', mainWestern: 'Carved Roast Beef Tenderloin & Yorkshire Pudding', veg: 'Medley of Roast Vegetables', dessert: 'Cheesecake & Vanilla Ice Cream', cals: 1220 },
          dinner: { mainAsian: 'Seafood Fried Rice with Crab & Prawns', mainWestern: 'Roast Herb Chicken Quarter with Gravy', side: 'Potato Wedges & Caesar Salad', dessert: 'Fresh Seasonal Fruit Platter', cals: 1000 },
          midnightSnack: 'Steamed Buns (Baozi) & Hot Chocolate',
          nutritionNotes: 'Weekly morale booster meal meeting 3,400+ kcal.'
        }
      ],
      indian: [
        {
          breakfast: { main: 'Masala Omelette & Parathas', side: 'Spiced Baked Beans & Toast', drinks: 'Masala Chai & Coffee', cals: 640 },
          lunch: { soup: 'Mulligatawny Spiced Lentil Soup', mainAsian: 'Mutton Curry / Paneer Butter Masala', mainWestern: 'Grilled Fish with Lemon & Rice', veg: 'Aloo Gobi (Potato & Cauliflower)', dessert: 'Gulab Jamun & Oranges', cals: 1150 },
          dinner: { mainAsian: 'Chicken Tikka Masala with Jeera Rice', mainWestern: 'Vegetable Lasagna with Garlic Bread', side: 'Tandoori Roti & Cucumber Raita', dessert: 'Kheer (Rice Pudding)', cals: 980 },
          midnightSnack: 'Vegetable Samosas & Sweet Cardamom Milk',
          nutritionNotes: 'Strict Halal and vegetarian segregation in galley.'
        },
        {
          breakfast: { main: 'Poha with Peanuts & Boiled Eggs', side: 'Upma with Coconut Chutney', drinks: 'Ginger Tea & Coffee', cals: 610 },
          lunch: { soup: 'Dal Tadka Yellow Lentil Broth', mainAsian: 'Chicken Biryani with Mint Raita', mainWestern: 'Pan-Seared Whitefish with Steamed Veggies', veg: 'Bhindi Masala (Okra)', dessert: 'Rasgulla & Fresh Apple', cals: 1180 },
          dinner: { mainAsian: 'Fish Curry with Steamed Basmati', mainWestern: 'Mushroom & Potato Bake', side: 'Chapati & Onion Salad', dessert: 'Fruit Custard', cals: 960 },
          midnightSnack: 'Egg Bhurji (Scrambled) with Pav / Toast',
          nutritionNotes: 'High iron and plant-based protein balance.'
        },
        {
          breakfast: { main: 'Idli & Sambar with Chutney', side: 'Scrambled Eggs with Green Chilies', drinks: 'Filter Coffee & Tea', cals: 600 },
          lunch: { soup: 'Tomato Rasam Pepper Soup', mainAsian: 'Egg Curry with Basmati Rice', mainWestern: 'Roast Chicken with Herbs & Mash', veg: 'Baingan Bharta (Roasted Eggplant)', dessert: 'Carrot Halwa (Gajar Halwa)', cals: 1100 },
          dinner: { mainAsian: 'Butter Chicken / Shahi Paneer with Naan', mainWestern: 'Spaghetti Neapolitan with Veggies', side: 'Jeera Pulao & Papadum', dessert: 'Fresh Melon Slices', cals: 990 },
          midnightSnack: 'Pakoras (Veg Fritters) with Mint Dip',
          nutritionNotes: 'Ayurvedic digestion support through turmeric and ginger.'
        },
        {
          breakfast: { main: 'Aloo Paratha with Plain Curd / Pickle', side: 'Boiled Eggs & Toast', drinks: 'Masala Chai & Orange Juice', cals: 650 },
          lunch: { soup: 'Sweet Corn Veg Soup', mainAsian: 'Mutton Rogan Josh with Saffron Rice', mainWestern: 'Baked Cod with Rosemary Potatoes', veg: 'Palak Paneer (Spinach & Cottage Cheese)', dessert: 'Mango Kulfi / Ice Cream', cals: 1200 },
          dinner: { mainAsian: 'Kadai Chicken with Fresh Rotis', mainWestern: 'Macaroni & Cheese Gratin', side: 'Steamed Rice & Mixed Pickle', dessert: 'Fruit Chaat', cals: 970 },
          midnightSnack: 'Spiced Chicken Sandwiches with Masala Tea',
          nutritionNotes: 'High calorie replenishment for offshore maneuvering.'
        },
        {
          breakfast: { main: 'Chana Masala with Poori', side: 'Fried Eggs & Toast with Jam', drinks: 'Masala Chai & Coffee', cals: 670 },
          lunch: { soup: 'Moong Dal Broth with Cumin', mainAsian: 'South Indian Fish Fry with Rice', mainWestern: 'Grilled Chicken Breast with Steamed Peas', veg: 'Beans Poriyal with Coconut', dessert: 'Payasam Rice Pudding', cals: 1120 },
          dinner: { mainAsian: 'Chicken Korma with Basmati Rice', mainWestern: 'Veggie Burger with Potato Wedges', side: 'Tandoori Roti & Kachumber Salad', dessert: 'Fresh Banana & Grapes', cals: 960 },
          midnightSnack: 'Maggi Noodles with Egg & Veggies',
          nutritionNotes: 'Rich in dietary fiber and essential minerals.'
        },
        {
          breakfast: { main: 'Masala Dosa with Sambar & Chutney', side: 'Omelette to Order & Toast', drinks: 'Tea, Coffee, Fresh Lime Soda', cals: 630 },
          lunch: { soup: 'Clear Chicken Pepper Soup', mainAsian: 'Lamb Keema Mattar with Rice', mainWestern: 'Baked Whitefish in Garlic Herb Sauce', veg: 'Mixed Vegetable Korma', dessert: 'Jalebi & Vanilla Custard', cals: 1190 },
          dinner: { mainAsian: 'Chicken Tikka Biryani with Mirchi Salan', mainWestern: 'Penne Arrabbiata with Garlic Bread', side: 'Boiiled Eggs & Onion Raita', dessert: 'Fresh Papaya Slices', cals: 1040 },
          midnightSnack: 'Paneer / Chicken Rolls with Mint Mayo',
          nutritionNotes: 'Balanced weekend feast.'
        },
        {
          breakfast: { main: 'Sunday Grand Halwa Puri & Chana', side: 'Masala Omelette, Bacon (Halal) & Toast', drinks: 'Special Saffron Chai & Juices', cals: 730 },
          lunch: { soup: 'Rich Mutton Yakhni Soup', mainAsian: 'Hyderabadi Dum Biryani with Salan', mainWestern: 'Carved Roast Beef / Lamb with Roast Veg', veg: 'Dal Makhani & Paneer Tikka', dessert: 'Gulab Jamun with Ice Cream', cals: 1300 },
          dinner: { mainAsian: 'Prawn Masala with Steamed Basmati', mainWestern: 'Roast Chicken Leg with Fries', side: 'Roomali Roti & Tossed Salad', dessert: 'Assorted Fruit Platter', cals: 1010 },
          midnightSnack: 'Chicken Cutlets & Warm Spiced Milk',
          nutritionNotes: 'Traditional Sunday grand banquet for seafarer morale.'
        }
      ],
      european: [
        {
          breakfast: { main: 'Continental Buffet with Sourdough & Croissant', side: 'Soft Boiled Eggs, Gouda & Ham', drinks: 'Espresso, Filter Coffee, Orange Juice', cals: 620 },
          lunch: { soup: 'French Onion Soup with Cheese Toast', mainAsian: 'Chicken Satay with Peanut Sauce & Rice', mainWestern: 'Carved Roast Beef with Roast Potatoes', veg: 'Green Asparagus & Baby Carrots', dessert: 'Apple Strudel with Cream', cals: 1120 },
          dinner: { mainAsian: 'Sweet & Sour Pork with Jasmine Rice', mainWestern: 'Baked Atlantic Salmon with Dill Sauce', side: 'Boiled Buttered Potatoes & Green Salad', dessert: 'Chocolate Mousse', cals: 980 },
          midnightSnack: 'Open-face Rye Bread with Smoked Salmon & Cream Cheese',
          nutritionNotes: 'High omega-3 fatty acids and dairy fats for cold climate voyages.'
        },
        {
          breakfast: { main: 'Muesli with Yogurt, Honey & Berries', side: 'Fried Eggs & Polish Sausage (Kielbasa)', drinks: 'Coffee, Earl Grey, Fresh Milk', cals: 600 },
          lunch: { soup: 'Cream of Wild Mushroom Soup', mainAsian: 'Beef Teriyaki with Steamed Rice', mainWestern: 'Wiener Schnitzel with Lemon & French Fries', veg: 'Sauteed Spinach with Garlic', dessert: 'Black Forest Cake', cals: 1160 },
          dinner: { mainAsian: 'Thai Red Chicken Curry with Rice', mainWestern: 'Grilled Pork Medallions in Pepper Sauce', side: 'Tagliatelle Pasta & Caprese Salad', dessert: 'Panna Cotta with Berry Coulis', cals: 960 },
          midnightSnack: 'Gouda Cheese & Smoked Ham Toasties',
          nutritionNotes: 'Vitamin C through berries and fresh salads.'
        },
        {
          breakfast: { main: 'Fresh Scrambled Eggs with Chives', side: 'Crispy Bacon & Baked Beans on Toast', drinks: 'Coffee, Tea, Grapefruit Juice', cals: 630 },
          lunch: { soup: 'Minestrone with Basil Pesto', mainAsian: 'Crispy Sweet Chili Chicken with Rice', mainWestern: 'Beef Goulash with Boiled Spätzle Noodles', veg: 'Steamed Red Cabbage', dessert: 'Creme Caramel', cals: 1100 },
          dinner: { mainAsian: 'Cantonese Fried Noodles with Shrimp', mainWestern: 'Pan-Fried Cod Fillet with Remoulade', side: 'Mashed Potatoes & Garden Salad', dessert: 'Fresh Pear & Cheese Platter', cals: 940 },
          midnightSnack: 'Hot Tomato Soup with Cheddar Baguette',
          nutritionNotes: 'Complex carbs and wholesome stews.'
        },
        {
          breakfast: { main: 'Danish Pastries & Fresh Bread Rolls', side: 'Cold Cut Cold Platter & Hard Boiled Eggs', drinks: 'Coffee, Green Tea, Apple Juice', cals: 610 },
          lunch: { soup: 'Cream of Tomato & Basil Soup', mainAsian: 'Beef Rendang with Coconut Rice', mainWestern: 'Roasted Pork Loin with Crackling & Gravy', veg: 'Roasted Brussels Sprouts & Bacon', dessert: 'Tiramisu Slice', cals: 1140 },
          dinner: { mainAsian: 'Egg Fried Rice with Chicken Skewers', mainWestern: 'Lasagna Bolognese with Mozzarella', side: 'Garlic Bread & Mixed Greens', dessert: 'Fruit Salad', cals: 960 },
          midnightSnack: 'Bratwurst Sausage in Roll with Mustard',
          nutritionNotes: 'Adequate vitamin D from cod and dairy.'
        },
        {
          breakfast: { main: 'Oat Porridge with Cinnamon & Raisins', side: 'Poached Eggs on Multigrain Toast', drinks: 'Coffee, Herbal Tea, Fresh Milk', cals: 590 },
          lunch: { soup: 'Split Pea Soup with Smoked Ham', mainAsian: 'Fish Curry with Steamed Rice', mainWestern: 'Grilled Sirloin Steak with Herb Butter', veg: 'Grilled Zucchini & Bell Peppers', dessert: 'Warm Berry Crumble', cals: 1150 },
          dinner: { mainAsian: 'Pork Chow Mein with Veggies', mainWestern: 'Baked Sea Bass with Olive Oil & Herbs', side: 'Boiled New Potatoes & Greek Salad', dessert: 'Vanilla Gelato', cals: 950 },
          midnightSnack: 'Ham & Emmental Baguette',
          nutritionNotes: 'High lean protein and antioxidants.'
        },
        {
          breakfast: { main: 'Pancakes with Blueberries & Syrup', side: 'Breakfast Sausages & Fried Eggs', drinks: 'Coffee, Tea, Orange Juice', cals: 650 },
          lunch: { soup: 'Lobster & Seafood Bisque', mainAsian: 'Chicken Adobo with Garlic Rice', mainWestern: 'Slow-Cooked Lamb Shank in Red Wine Gravy', veg: 'Mashed Sweet Potatoes & Peas', dessert: 'Lemon Meringue Pie', cals: 1220 },
          dinner: { mainAsian: 'Beef Stir-Fry with Cashews & Rice', mainWestern: 'Spaghetti Carbonara with Pancetta', side: 'Caesar Salad with Parmesan', dessert: 'Fresh Seasonal Fruit', cals: 1010 },
          midnightSnack: 'Croque Monsieur (Toasted Ham & Cheese)',
          nutritionNotes: 'Seafarer weekend special.'
        },
        {
          breakfast: { main: 'Sunday Maritime Champagne-style Brunch', side: 'Eggs Benedict, Smoked Salmon & Bacon', drinks: 'Fresh Ground Coffee, Juices, Tea', cals: 720 },
          lunch: { soup: 'Consommé with Julienned Vegetables', mainAsian: 'Singapore Chilli Crab with Fried Buns', mainWestern: 'Carved Prime Rib of Beef with Gravy', veg: 'Roast Root Vegetables & Yorkshire Pudding', dessert: 'Profiteroles with Chocolate Sauce', cals: 1280 },
          dinner: { mainAsian: 'Special Fried Rice with Prawns', mainWestern: 'Roast Duck Breast with Orange Sauce', side: 'Potato Gratin & Buttered Greens', dessert: 'Assorted European Cheeses & Grapes', cals: 1040 },
          midnightSnack: 'Club Sandwiches with Potato Crisps',
          nutritionNotes: 'Top-tier master table service.'
        }
      ],
      slavic: [
        {
          breakfast: { main: 'Syrniki (Cottage Cheese Pancakes) with Sour Cream', side: 'Fried Eggs & Smoked Sausage', drinks: 'Black Tea with Lemon, Coffee', cals: 640 },
          lunch: { soup: 'Red Borscht with Beef & Sour Cream', mainAsian: 'Chicken with Rice & Soy Sauce', mainWestern: 'Beef Stroganoff with Mashed Potatoes', veg: 'Pickled Cucumbers & Tomatoes', dessert: 'Medovik Honey Cake', cals: 1150 },
          dinner: { mainAsian: 'Fried Rice with Pork & Veggies', mainWestern: 'Pan-Fried Fish Fillet with Buckwheat (Grechka)', side: 'Shuba Salad (Herring under Fur Coat)', dessert: 'Stewed Fruit Compote', cals: 960 },
          midnightSnack: 'Boiled Pelmeni Meat Dumplings with Butter & Pepper',
          nutritionNotes: 'Dense hot soups and fermentation probiotics.'
        },
        {
          breakfast: { main: 'Kasha (Buckwheat Porridge) with Butter & Milk', side: 'Hard Boiled Eggs & Doctor Sausage', drinks: 'Tea with Honey, Coffee', cals: 610 },
          lunch: { soup: 'Solyanka Meat Soup with Olives & Lemon', mainAsian: 'Crispy Chicken with Jasmine Rice', mainWestern: 'Kotlety (Minced Pork Cutlets) with Mashed Potatoes', veg: 'Vinegret Beetroot Salad', dessert: 'Apple Sharlotka Sponge', cals: 1180 },
          dinner: { mainAsian: 'Beef & Cabbage Stir-Fry', mainWestern: 'Roast Chicken with Garlic & Roasted Potatoes', side: 'Olivier Potato Salad', dessert: 'Curd Tartlet', cals: 980 },
          midnightSnack: 'Warm Pirozhki with Meat & Potato',
          nutritionNotes: 'Hearty cold weather comfort.'
        },
        {
          breakfast: { main: 'Blini (Thin Crepes) with Sweet Condensed Milk', side: 'Scrambled Eggs & Bacon', drinks: 'Black Tea, Coffee, Apple Juice', cals: 630 },
          lunch: { soup: 'Shchi Fresh Cabbage & Pork Soup', mainAsian: 'Sweet & Sour Fish with Rice', mainWestern: 'Golubtsi (Cabbage Rolls with Meat & Rice)', veg: 'Sour Cream & Dill Pickles', dessert: 'Napoleon Cake Slice', cals: 1120 },
          dinner: { mainAsian: 'Fried Pork Noodles with Vegetables', mainWestern: 'Baked Salmon with Cream & Potatoes', side: 'Kholodets / Fresh Slaw', dessert: 'Kissel Berry Dessert', cals: 950 },
          midnightSnack: 'Rye Bread with Butter & Sprats',
          nutritionNotes: 'Rich in vitamin C and root vegetable carbs.'
        },
        {
          breakfast: { main: 'Fried Eggs with Fried Potatoes & Sausage', side: 'Cottage Cheese with Honey & Walnuts', drinks: 'Tea with Lemon, Coffee', cals: 650 },
          lunch: { soup: 'Ukha Traditional Fish Soup with Herbs', mainAsian: 'Chicken Curry with White Rice', mainWestern: 'Pork Chop with Braised Cabbage (Bigos)', veg: 'Grated Carrot & Garlic Salad', dessert: 'Prianik Spiced Gingerbread', cals: 1100 },
          dinner: { mainAsian: 'Beef Stir-Fry with Onions & Rice', mainWestern: 'Chicken Kiev with Butter Filling & Rice', side: 'Fresh Tomato & Cucumber Salad with Dill', dessert: 'Fruit Compote', cals: 970 },
          midnightSnack: 'Toasted Bread with Cheese & Smoked Sausage',
          nutritionNotes: 'Fresh fish broth providing iodine and collagen.'
        },
        {
          breakfast: { main: 'Millet Kasha with Pumpkin & Butter', side: 'Omelette with Cheese & Ham', drinks: 'Tea, Coffee, Berry Juice', cals: 620 },
          lunch: { soup: 'Rassolnik Pickle & Pearl Barley Soup', mainAsian: 'Asian BBQ Pork with Rice', mainWestern: 'Braised Beef Shank with Egg Noodles', veg: 'Pickled Cabbage (Sauerkraut)', dessert: 'Waffle Cake with Dulce de Leche', cals: 1140 },
          dinner: { mainAsian: 'Sweet & Sour Pork with Fried Rice', mainWestern: 'Pan-Seared Cod with Herb Butter & Potatoes', side: 'Radish & Sour Cream Salad', dessert: 'Fresh Apples & Pears', cals: 960 },
          midnightSnack: 'Vareniki with Potato & Fried Onions',
          nutritionNotes: 'High iron and B-vitamins.'
        },
        {
          breakfast: { main: 'Pancakes with Strawberry Jam & Sour Cream', side: 'Fried Eggs & Grilled Sausages', drinks: 'Coffee, Tea, Milk', cals: 660 },
          lunch: { soup: 'Kharcho Spicy Beef & Rice Soup', mainAsian: 'Spicy Chicken with Noodles', mainWestern: 'Roast Pork Loin with Apple Puree & Fries', veg: 'Roasted Beets with Walnuts & Garlic', dessert: 'Poppy Seed Roll', cals: 1200 },
          dinner: { mainAsian: 'Beef Chow Mein with Vegetables', mainWestern: 'Baked Whitefish in Creamy Mushroom Sauce', side: 'Buckwheat & Fresh Salad', dessert: 'Ice Cream with Berries', cals: 980 },
          midnightSnack: 'Hot Tea with Sausage Sandwiches',
          nutritionNotes: 'Spiced beef broth keeping crew alert during rough seas.'
        },
        {
          breakfast: { main: 'Sunday Maritime Cooked Breakfast', side: 'Eggs to Order, Bacon, Syrniki, Kasha', drinks: 'Fresh Brewed Coffee & Tea Selection', cals: 720 },
          lunch: { soup: 'Royal Solyanka with Lemon & Capers', mainAsian: 'Pork & Chicken Skewers (Shashlik) with Rice', mainWestern: 'Carved Roast Beef with Roasted Potatoes', veg: 'Pickled Vegetables & Fresh Herbs', dessert: 'Kiev Cake with Hazelnuts', cals: 1290 },
          dinner: { mainAsian: 'Seafood Rice with Squid & Mussels', mainWestern: 'Roast Duck with Baked Apples', side: 'Potato Puree & Salad', dessert: 'Assorted Fruit Platter', cals: 1020 },
          midnightSnack: 'Meat Piroshki & Hot Cocoa',
          nutritionNotes: 'Traditional high-morale Sunday feast.'
        }
      ]
    };

    const chosenList = templates[nationality] || templates.mixed;

    for (let d = 1; d <= 7; d++) {
      const template = chosenList[(d - 1) % chosenList.length];
      list.push({
        day: d,
        ...template
      });
    }

    return list;
  }, [nationality]);

  // Calculations for provisions
  const calculatedProvisions = useMemo(() => {
    return PROVISION_CATALOG_2026.map((item) => {
      const totalQty = Number((item.qtyPerPersonDay * totalManDays).toFixed(1));
      const adjustedUnitPrice = Number((item.unitPriceUSD * portMultiplier).toFixed(2));
      const totalCost = Number((totalQty * adjustedUnitPrice).toFixed(2));
      return {
        ...item,
        unitPriceUSD: adjustedUnitPrice,
        totalQty,
        totalCost,
      };
    });
  }, [totalManDays, portMultiplier]);

  const totalCalculatedProvisionsCost = useMemo(() => {
    return Number(calculatedProvisions.reduce((acc, it) => acc + it.totalCost, 0).toFixed(2));
  }, [calculatedProvisions]);

  const costDifference = Number((totalCalculatedProvisionsCost - totalBudgetUSD).toFixed(2));

  // Filtered provisions for tab 2
  const filteredProvisions = useMemo(() => {
    return calculatedProvisions.filter((item) => {
      const matchesCat = provisionCat === 'all' || item.category === provisionCat;
      const matchesSearch = provisionQuery === '' || item.name.toLowerCase().includes(provisionQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [calculatedProvisions, provisionCat, provisionQuery]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = 'Item,Category,Storage,Unit,Qty Per Person/Day,Total Qty,Unit Price (USD),Line Total (USD)\n';
    const rows = calculatedProvisions
      .map(
        (i) =>
          `"${i.name}","${i.category}","${i.storage}","${i.unit}",${i.qtyPerPersonDay},${i.totalQty},${i.unitPriceUSD},${i.totalCost}`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Maritime_Food_Stores_${chandlerPort}_${persons}pax_${days}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('CSV provision manifest downloaded');
  };

  const handleExportToGoogleSheets = async () => {
    setIsExportingSheet(true);
    setIsConfirmSheetOpen(false);

    try {
      const token = await getAccessToken();
      if (!token) {
        await googleSignIn();
      }

      const freshToken = await getAccessToken();
      if (!freshToken) {
        throw new Error('Google Workspace OAuth sign-in required.');
      }

      const sheetData = [
        ['MARITIME FOOD & PROVISIONING MANIFEST (MLC 2006 REGULATION 3.2)'],
        [`Vessel Crew: ${persons} Seafarers`, `Voyage Duration: ${days} Days`, `Total Man-Days: ${totalManDays}`],
        [`Demographics: ${nationality.toUpperCase()}`, `Port Bunkering: ${chandlerPort} (${portMultiplier.toFixed(2)}x)`, `Daily Allowance: $${budgetPerManDay.toFixed(2)} / person-day`],
        [`Allocated Budget: $${totalBudgetUSD} USD`, `Estimated Stores: $${totalCalculatedProvisionsCost} USD`, `Variance: ${costDifference <= 0 ? 'Within Budget' : `Over by $${costDifference}`}`],
        [],
        ['Item Code', 'Category', 'Description', 'Storage Requirement', 'Unit', 'Qty / Person-Day', 'Total Order Qty', '2026 Price (USD)', 'Total Amount (USD)'],
        ...calculatedProvisions.map((i, idx) => [
          `PRV-${(idx + 1).toString().padStart(3, '0')}`,
          i.category,
          i.name,
          i.storage === 'freeze' ? 'Frozen (-18°C)' : i.storage === 'chill' ? 'Chilled (+4°C)' : 'Dry Stores',
          i.unit,
          i.qtyPerPersonDay,
          i.totalQty,
          i.unitPriceUSD,
          i.totalCost,
        ]),
        [],
        ['TOTAL ESTIMATED STORES (USD)', '', '', '', '', '', '', '', totalCalculatedProvisionsCost],
      ];

      const res = await createGoogleSpreadsheet(
        freshToken,
        `Maritime Food & Stores - ${chandlerPort} (${persons}pax ${days}d)`,
        sheetData
      );

      setExportedSheetUrl(res.spreadsheetUrl);
      onShowToast('Google Sheet created in your Google Drive!');
    } catch (err: any) {
      console.error('Export sheets error:', err);
      onShowToast(`Export error: ${err.message || 'Check Google permissions'}`);
    } finally {
      setIsExportingSheet(false);
    }
  };

  const handleSendToChat = () => {
    const promptText = `Review and optimize this shipboard meal plan and catering budget under MLC 2006 Regulation 3.2:
• Crew: ${persons} seafarers | Voyage: ${days} days (${totalManDays} man-days)
• Demographics: ${nationality.toUpperCase()} focus
• Victualing Rate: $${budgetPerManDay.toFixed(2)}/day (Budget: $${totalBudgetUSD} USD)
• Bunkering Port: ${chandlerPort} (Price Index: ${portMultiplier.toFixed(2)}x)
• Estimated Stores Cost: $${totalCalculatedProvisionsCost} USD (Variance: ${costDifference <= 0 ? `-$${Math.abs(costDifference)}` : `+$${costDifference}`})

Please provide Chief Cook recommendations on cold-room temperatures, storage shelf-life, and heavy weather galley safety.`;
    onSendToChat(promptText);
    onClose();
  };

  const copyDayMenu = (m: MealDay) => {
    const text = `DAY ${m.day} SHIPBOARD MENU (${nationality.toUpperCase()})
Breakfast: ${m.breakfast.main} | Side: ${m.breakfast.side}
Lunch: Soup: ${m.lunch.soup} | Main: ${m.lunch.mainAsian} | Alt: ${m.lunch.mainWestern} | Veg: ${m.lunch.veg}
Dinner: Main: ${m.dinner.mainAsian} | Alt: ${m.dinner.mainWestern} | Side: ${m.dinner.side}
Night Watch: ${m.midnightSnack}`;
    navigator.clipboard.writeText(text);
    setCopiedMenuDay(m.day);
    setTimeout(() => setCopiedMenuDay(null), 2000);
    onShowToast(`Day ${m.day} menu copied to clipboard`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="print-area relative flex flex-col w-full max-w-5xl h-[90vh] rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden text-[var(--text-main)] font-sans">

        {/* ============ CODEX-STYLE MINIMALIST HEADER ============ */}
        <div className="no-print flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 grid place-items-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[var(--text-main)]">Food & Provisioning</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                MLC 3.2
              </span>
            </div>
          </div>

          {/* Top Segmented Action Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSendToChat}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
              title="Discuss plan in MarinerAI chat"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            <button
              onClick={() => setIsConfirmSheetOpen(true)}
              disabled={isExportingSheet}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-xs text-emerald-400 flex items-center gap-1.5 transition-colors"
              title="Export to Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sheets</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Print Manifest"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border-subtle)] mx-1" />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Sheet Success Banner */}
        {exportedSheetUrl && (
          <div className="no-print px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn shrink-0">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheet created successfully!</span>
            </span>
            <a
              href={exportedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold flex items-center gap-1 hover:bg-emerald-500 text-[11px]"
            >
              <span>Open Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* ============ SEGMENTED CONTROLS BAR ============ */}
        <div className="no-print px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 space-y-2 shrink-0">
          
          {/* Main 4-Way Segmented Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
              {[
                { id: 'meals', label: '7-Day Rotation', icon: Utensils },
                { id: 'stores', label: 'Stores Manifest', icon: FileSpreadsheet },
                { id: 'budget', label: 'Budget & Metrics', icon: PieChart },
                { id: 'audit', label: 'MLC & Cold Chain', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[var(--bg-surface-hover)] text-[var(--text-main)] shadow-xs font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Segmented Demographics & Port */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value as NationalityPreset)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] outline-hidden cursor-pointer"
              >
                <option value="mixed">🌐 Mixed Multinational</option>
                <option value="filipino">🇵🇭 Filipino Focus</option>
                <option value="indian">🇮🇳 Indian / Halal Focus</option>
                <option value="european">🇪🇺 European Focus</option>
                <option value="slavic">🇺🇦 Slavic / East Europe</option>
              </select>

              <select
                value={chandlerPort}
                onChange={(e) => setChandlerPort(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] outline-hidden cursor-pointer"
              >
                {Object.entries(PORT_INDEX_2026).map(([p, data]) => (
                  <option key={p} value={p}>
                    {data.flag} {p} ({data.multiplier.toFixed(2)}x)
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCustomParams(!showCustomParams)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showCustomParams
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Adjust crew size or voyage days"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Segmented Preset Chips Strip */}
          <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Crew:</span>
              <div className="inline-flex p-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                {[12, 18, 22, 26].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersons(p)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      persons === p
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {p}p
                  </button>
                ))}
              </div>

              <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)] ml-1">Days:</span>
              <div className="inline-flex p-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                {[7, 14, 21, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      days === d
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Line Status summary */}
            <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
              <span>{totalManDays} Man-Days</span>
              <span>·</span>
              <span className="text-[var(--text-main)] font-semibold">${totalBudgetUSD} Budget</span>
              <span>·</span>
              <span className={costDifference <= 0 ? 'text-emerald-400' : 'text-amber-400 font-semibold'}>
                Stores: ${totalCalculatedProvisionsCost} ({costDifference <= 0 ? 'OK' : `+$${costDifference}`})
              </span>
            </div>
          </div>

          {/* On-Demand Custom Inputs (Only opens when sliders button is clicked) */}
          {showCustomParams && (
            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Custom Crew Count</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPersons(p => Math.max(1, p - 1))} className="w-6 h-6 rounded bg-[var(--bg-surface)] text-[var(--text-main)] grid place-items-center"><Minus className="w-3 h-3" /></button>
                  <input type="number" min="1" max="150" value={persons} onChange={e => setPersons(parseInt(e.target.value) || 1)} className="w-full text-center font-mono py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
                  <button onClick={() => setPersons(p => Math.min(150, p + 1))} className="w-6 h-6 rounded bg-[var(--bg-surface)] text-[var(--text-main)] grid place-items-center"><Plus className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Custom Voyage Days</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDays(d => Math.max(1, d - 1))} className="w-6 h-6 rounded bg-[var(--bg-surface)] text-[var(--text-main)] grid place-items-center"><Minus className="w-3 h-3" /></button>
                  <input type="number" min="1" max="120" value={days} onChange={e => setDays(parseInt(e.target.value) || 1)} className="w-full text-center font-mono py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
                  <button onClick={() => setDays(d => Math.min(120, d + 1))} className="w-6 h-6 rounded bg-[var(--bg-surface)] text-[var(--text-main)] grid place-items-center"><Plus className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Victualing Rate ($/man-day)</span>
                <input type="number" step="0.5" min="5" max="50" value={budgetPerManDay} onChange={e => setBudgetPerManDay(parseFloat(e.target.value) || 0)} className="w-full font-mono py-1 px-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
              </div>
            </div>
          )}

        </div>

        {/* ============ TAB CONTENT AREA ============ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">

          {/* TAB 1: 🍽️ 7-DAY MEAL ROTATION */}
          {activeTab === 'meals' && (
            <div className="space-y-3">
              
              {/* Segmented Day Pill Bar + Course Filter */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                  {mealSchedule.map((m) => (
                    <button
                      key={m.day}
                      onClick={() => setSelectedDay(m.day)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                        selectedDay === m.day
                          ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Day {m.day}
                    </button>
                  ))}
                </div>

                {/* Segmented Course Filter */}
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px]">
                  {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((course) => (
                    <button
                      key={course}
                      onClick={() => setMealCourseFilter(course)}
                      className={`px-2 py-0.5 rounded capitalize transition-colors ${
                        mealCourseFilter === course
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {course === 'snack' ? 'Watch Snack' : course}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Day Card */}
              {mealSchedule
                .filter((m) => m.day === selectedDay)
                .map((m) => (
                  <div key={m.day} className="space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--text-main)]">Day {m.day} Menu</span>
                        <span className="text-[11px] text-[var(--text-subtle)] font-mono">
                          {nationality.toUpperCase()} ROTATION
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDayNutrition(!showDayNutrition)}
                          className={`px-2 py-1 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                            showDayNutrition
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <Info className="w-3 h-3" />
                          <span>{showDayNutrition ? 'Hide Notes' : 'Nutrition Info'}</span>
                        </button>

                        <button
                          onClick={() => copyDayMenu(m)}
                          className="px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedMenuDay === m.day ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Nutrition Notes (On-demand) */}
                    {showDayNutrition && m.nutritionNotes && (
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2 animate-fadeIn">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span>{m.nutritionNotes}</span>
                      </div>
                    )}

                    {/* Minimalist Segmented Meal Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      
                      {/* Breakfast */}
                      {(mealCourseFilter === 'all' || mealCourseFilter === 'breakfast') && (
                        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                            <span className="flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5" /> 06:00 Breakfast</span>
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono">{m.breakfast.cals || 600} kcal</span>
                          </div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">{m.breakfast.main}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{m.breakfast.side}</div>
                          <div className="text-[10px] text-[var(--text-subtle)] pt-1">
                            Beverages: {m.breakfast.drinks}
                          </div>
                        </div>
                      )}

                      {/* Lunch */}
                      {(mealCourseFilter === 'all' || mealCourseFilter === 'lunch') && (
                        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                            <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> 11:30 Lunch</span>
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono">{m.lunch.cals || 1100} kcal</span>
                          </div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">{m.lunch.mainAsian}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">Alt: {m.lunch.mainWestern}</div>
                          <div className="text-[10px] text-[var(--text-subtle)] pt-1 flex justify-between">
                            <span>Soup: {m.lunch.soup} · Veg: {m.lunch.veg}</span>
                            <span className="text-emerald-400">{m.lunch.dessert}</span>
                          </div>
                        </div>
                      )}

                      {/* Dinner */}
                      {(mealCourseFilter === 'all' || mealCourseFilter === 'dinner') && (
                        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                            <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> 17:00 Dinner</span>
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono">{m.dinner.cals || 950} kcal</span>
                          </div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">{m.dinner.mainAsian}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">Alt: {m.dinner.mainWestern}</div>
                          <div className="text-[10px] text-[var(--text-subtle)] pt-1 flex justify-between">
                            <span>{m.dinner.side}</span>
                            <span className="text-blue-400">{m.dinner.dessert}</span>
                          </div>
                        </div>
                      )}

                      {/* Watchkeeper Midnight Snack */}
                      {(mealCourseFilter === 'all' || mealCourseFilter === 'snack') && (
                        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-purple-400">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 23:30 Watch Snack</span>
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono">Bridge / Engine Duty</span>
                          </div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">{m.midnightSnack}</div>
                          <div className="text-[10px] text-[var(--text-subtle)] pt-1">
                            Mandatory under MLC 2006 Standard A3.2 for seafarers on night watches.
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: 📦 STORE MANIFEST */}
          {activeTab === 'stores' && (
            <div className="space-y-3">
              
              {/* Category Segmented Filter + Search */}
              <div className="no-print flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs overflow-x-auto scrollbar-none">
                  {['all', 'Grains & Rice', 'Meat & Poultry', 'Fish & Seafood', 'Produce', 'Dairy & Eggs', 'Condiments & Staples'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setProvisionCat(cat)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                        provisionCat === cat
                          ? 'bg-emerald-600 text-white font-medium shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {cat === 'all' ? 'All Items (20)' : cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-44 sm:w-56">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <input
                    type="text"
                    value={provisionQuery}
                    onChange={(e) => setProvisionQuery(e.target.value)}
                    placeholder="Search item..."
                    className="w-full pl-8 pr-2 py-1 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder-[var(--text-subtle)] outline-hidden"
                  />
                </div>
              </div>

              {/* Minimalist Data Table */}
              <div className="rounded-xl border border-[var(--border-subtle)] overflow-x-auto bg-[var(--bg-surface)]/20">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-subtle)] font-mono text-[10.5px]">
                      <th className="py-2 px-3">Item Description</th>
                      <th className="py-2 px-2">Storage</th>
                      <th className="py-2 px-2 text-right">Order Qty</th>
                      <th className="py-2 px-3 text-right">Price ({chandlerPort})</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredProvisions.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--bg-surface)]/60 transition-colors">
                        <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                          {item.name}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            item.storage === 'freeze' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            item.storage === 'chill' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.storage === 'freeze' ? '❄️ -18°C' : item.storage === 'chill' ? '🥬 +4°C' : '📦 Dry'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-semibold text-[var(--text-main)]">
                          {item.totalQty} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[var(--text-muted)]">
                          ${item.unitPriceUSD.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                          ${item.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] font-medium text-[var(--text-main)]">
                      <td colSpan={2} className="py-2 px-3">
                        Total {chandlerPort} Stores Estimate
                      </td>
                      <td colSpan={2} className="py-2 px-3 text-right text-[11px] text-[var(--text-muted)]">
                        Budget: ${totalBudgetUSD.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        ${totalCalculatedProvisionsCost.toFixed(2)} USD
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: ⚖️ BUDGET & METRICS */}
          {activeTab === 'budget' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              
              {/* 4 Minimalist KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Daily Rate</div>
                  <div className="text-base font-bold text-[var(--text-main)] font-mono">${budgetPerManDay.toFixed(2)}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">USD / person-day</div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Total Stores</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">${totalCalculatedProvisionsCost}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{costDifference <= 0 ? 'Within budget' : `+$${costDifference} variance`}</div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Fresh Water</div>
                  <div className="text-base font-bold text-blue-400 font-mono">{(totalManDays * 150).toLocaleString()} L</div>
                  <div className="text-[10px] text-[var(--text-muted)]">WHO 150L/man-day</div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">Port Multiplier</div>
                  <div className="text-base font-bold text-purple-400 font-mono">{portMultiplier.toFixed(2)}x</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{chandlerPort} 2026 Index</div>
                </div>
              </div>

              {/* Provision Category Spend Meters */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
                <div className="flex justify-between items-center font-semibold text-[var(--text-main)]">
                  <span>Category Spend Breakdown</span>
                  <span className="font-mono text-emerald-400">${totalCalculatedProvisionsCost} USD</span>
                </div>

                <div className="space-y-2 pt-1 text-[11px]">
                  <div>
                    <div className="flex justify-between mb-0.5 text-[var(--text-muted)]">
                      <span>Meat & Poultry (38%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(totalCalculatedProvisionsCost * 0.38).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)]"><div className="h-full bg-red-400 rounded-full" style={{ width: '38%' }} /></div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[var(--text-muted)]">
                      <span>Fish & Seafood (18%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(totalCalculatedProvisionsCost * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)]"><div className="h-full bg-blue-400 rounded-full" style={{ width: '18%' }} /></div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[var(--text-muted)]">
                      <span>Fresh Produce & Fruit (16%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(totalCalculatedProvisionsCost * 0.16).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)]"><div className="h-full bg-emerald-400 rounded-full" style={{ width: '16%' }} /></div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[var(--text-muted)]">
                      <span>Grains, Rice & Flour (15%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(totalCalculatedProvisionsCost * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)]"><div className="h-full bg-amber-400 rounded-full" style={{ width: '15%' }} /></div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5 text-[var(--text-muted)]">
                      <span>Dairy & Condiments (13%)</span>
                      <span className="font-mono text-[var(--text-main)]">${(totalCalculatedProvisionsCost * 0.13).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-main)]"><div className="h-full bg-purple-400 rounded-full" style={{ width: '13%' }} /></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: 🛡️ MLC AUDIT & COLD CHAIN */}
          {activeTab === 'audit' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              
              {/* Segmented Sub-Category Tabs */}
              <div className="flex items-center justify-center p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                {(['coldchain', 'water', 'checklist'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setAuditSection(sub)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors ${
                      auditSection === sub
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {sub === 'coldchain' ? 'Cold Storage' : sub === 'water' ? 'Potable Water' : 'Galley Checklist'}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Cold Storage */}
              {auditSection === 'coldchain' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5 animate-fadeIn text-xs">
                  <span className="font-semibold text-[var(--text-main)]">Statutory Cold-Chain Temperatures (MLC 3.2)</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <Snowflake className="w-3.5 h-3.5" />
                        <span>Meat & Fish</span>
                      </div>
                      <div className="text-base font-bold font-mono text-[var(--text-main)]">-18°C or lower</div>
                      <p className="text-[10px] text-[var(--text-subtle)]">Deep freeze compartment; daily log mandatory</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Sun className="w-3.5 h-3.5" />
                        <span>Dairy & Eggs</span>
                      </div>
                      <div className="text-base font-bold font-mono text-[var(--text-main)]">+2°C to +4°C</div>
                      <p className="text-[10px] text-[var(--text-subtle)]">Chill room; eggs inspected and dated</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Fresh Vegetables</span>
                      </div>
                      <div className="text-base font-bold font-mono text-[var(--text-main)]">+4°C to +8°C</div>
                      <p className="text-[10px] text-[var(--text-subtle)]">Ventilated vegetable locker; humidity controlled</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Potable Water */}
              {auditSection === 'water' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 animate-fadeIn text-xs">
                  <span className="font-semibold text-[var(--text-main)]">Drinking Water & Hydration Standards</span>
                  <div className="space-y-2 text-[11px] text-[var(--text-muted)]">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                      <span className="font-semibold text-[var(--text-main)]">Minimum Allowance:</span> 150 liters per seafarer per day total (drinking, cooking, sanitary), with minimum 3-5L dedicated drinking potable water.
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                      <span className="font-semibold text-[var(--text-main)]">Testing Frequencies:</span> Free residual chlorine (0.2 - 0.5 mg/L) tested daily at farthest galley tap. Biological testing at 6-month intervals.
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Galley Inspection Checklist */}
              {auditSection === 'checklist' && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 animate-fadeIn text-xs">
                  <span className="font-semibold text-[var(--text-main)]">Master & Chief Cook Weekly Inspection</span>
                  <div className="space-y-1.5 pt-1">
                    {[
                      { id: 'chk1', text: 'Food store cleanliness and no evidence of pest / rodent contamination' },
                      { id: 'chk2', text: 'Deep freeze (-18°C) and chill rooms (+4°C) digital logbook up to date' },
                      { id: 'chk3', text: 'Galley exhaust hood grease filters cleaned and fire dampers tested' },
                      { id: 'chk4', text: 'Color-coded cutting boards in place (Red: Meat, Blue: Fish, Green: Veg)' },
                      { id: 'chk5', text: 'Potable water chlorine residual 0.2-0.5 ppm verified at galley tap' },
                      { id: 'chk6', text: 'Chief Cook valid MLC ship’s cook certification posted in galley' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checklistState[item.id] || false}
                          onChange={(e) => setChecklistState(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded accent-blue-600"
                        />
                        <span className={checklistState[item.id] ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] line-through'}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Confirmation Modal for Google Sheets */}
        {isConfirmSheetOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-3 text-xs shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Create Google Spreadsheet</span>
              </div>
              <p className="text-[var(--text-muted)]">
                Export current victualing manifest ({calculatedProvisions.length} line items) to your personal Google Drive via Google Workspace API.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsConfirmSheetOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportToGoogleSheets}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                >
                  Confirm & Export
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
