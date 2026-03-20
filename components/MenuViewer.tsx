"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingBag, UtensilsCrossed, AlertCircle, ArrowRight } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image?: string;
};

export default function MenuViewer({ shopId }: { shopId: string }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function fetchMenu() {
      try {
        const itemsRef = collection(db, "menus", shopId, "items");
        const snapshot = await getDocs(query(itemsRef));
        
        const fetchedItems: MenuItem[] = [];
        snapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        
        setMenuItems(fetchedItems);
      } catch (err: any) {
        console.error("Error fetching menu:", err);
        setError("Could not load menu. Please check the shop link.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMenu();
  }, [shopId]);

  // Extract unique categories from items dynamically
  const dynamicCategories = ["All", ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredMenu = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || menuItems.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Menu Unavailable</h2>
        <p className="text-sm text-zinc-500">{error || "This shop hasn't added any items yet."}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-950 min-h-screen shadow-2xl relative pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              Shop Menu
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Scan QR Menu - Khaoo Web</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search menu..." 
            className="w-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat 
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-black" 
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Items */}
      <div className="p-4 space-y-4">
        {filteredMenu.map((item) => (
          <div key={item.id} className="flex flex-row p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors bg-white dark:bg-zinc-950">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full border border-solid flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-tight">{item.name}</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
              
              <div className="flex items-end justify-between mt-3">
                <span className="font-bold text-base text-zinc-900 dark:text-white">₹{item.price}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between shrink-0">
              {item.image ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm mb-[-12px] bg-zinc-100 dark:bg-zinc-900">
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-[-12px]">
                   <UtensilsCrossed className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                </div>
              )}
              
              <button className="px-6 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-sm rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors shadow-sm ring-1 ring-orange-200 dark:ring-orange-500/20 relative z-10 w-20">
                ADD
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar (Cart) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black">
        <div className="max-w-md mx-auto w-full">
          <button className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-2xl p-4 shadow-xl shadow-orange-600/20 flex items-center justify-between transition-transform active:scale-95">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-orange-600 text-[9px] font-bold flex items-center justify-center rounded-full">0</span>
              </div>
              <span className="font-medium">View Order</span>
            </div>
            <span className="font-semibold flex items-center gap-1">Checkout <ArrowRight className="w-4 h-4" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
