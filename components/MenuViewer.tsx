"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingBag, UtensilsCrossed, AlertCircle, ArrowRight } from "lucide-react";
import { collection, query, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFontClass } from "@/lib/fonts";

function getLuminance(hex: string) {
  if (!hex) return 1;
  const color = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(color.slice(0, 2), 16) || 0;
  const g = parseInt(color.slice(2, 4), 16) || 0;
  const b = parseInt(color.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image?: string;
};

type ShopData = {
  name: string;
  description: string;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  layoutStyle?: "list" | "grid";
  logoUrl?: string;
  logoPlacement?: "center" | "left";
  categories?: string[];
  tableOrderingEnabled?: boolean;
  plan?: string;
  trialStartDate?: string;
};

export default function MenuViewer({ shopId }: { shopId: string }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    let shopLoaded = false;
    let itemsLoaded = false;
    
    const checkLoading = () => {
      if (shopLoaded && itemsLoaded) {
        setLoading(false);
      }
    };

    // Fetch Shop Metadata Live
    const shopRef = doc(db, "shops", shopId);
    const unsubscribeShop = onSnapshot(shopRef, (shopSnap) => {
      if (shopSnap.exists()) {
        setShopData(shopSnap.data() as ShopData);
      } else {
        setError("Shop not found.");
      }
      shopLoaded = true;
      checkLoading();
    }, (err: any) => {
      console.error("Error fetching shop live:", err);
      setError("Could not load shop. Please check the shop link.");
      setLoading(false);
    });

    // Fetch Menu Items Live
    const itemsRef = collection(db, "menus", shopId, "items");
    const unsubscribeItems = onSnapshot(query(itemsRef), (snapshot) => {
      const fetchedItems: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        fetchedItems.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
      });
      setMenuItems(fetchedItems);
      itemsLoaded = true;
      checkLoading();
    }, (err: any) => {
      console.error("Error fetching menu items live:", err);
      setError("Could not load menu. Please check the shop link.");
      setLoading(false);
    });

    return () => {
      unsubscribeShop();
      unsubscribeItems();
    };
  }, [shopId]);

  const dynamicCategories = shopData?.categories && shopData.categories.length > 0 
    ? ["All", ...shopData.categories] 
    : ["All"];
    
  const filteredMenu = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-900"></div>
        <p className="mt-4 text-sm font-medium text-zinc-500 animate-pulse">Loading menu...</p>
      </div>
    );
  }

  if (error || menuItems.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Menu Unavailable</h2>
        <p className="text-sm text-zinc-500">{error || "This shop hasn't added any items yet."}</p>
      </div>
    );
  }

  // Dynamic Theme Variables
  const primaryColor = shopData?.primaryColor || "#E11D48";
  const backgroundColor = shopData?.backgroundColor || "#FFFFFF";
  const primaryColorTransparent = `${primaryColor}1A`; // 10% opacity
  const fontClass = getFontClass(shopData?.fontFamily || "Outfit");
  const layoutStyle = shopData?.layoutStyle || "list";
  const logoPlacement = shopData?.logoPlacement || "center";
  const isCenter = logoPlacement === "center";
  
  let isOrderingEnabled = true;
  if (shopData) {
    if (shopData.tableOrderingEnabled !== undefined) {
      isOrderingEnabled = shopData.tableOrderingEnabled;
    } else {
      const plan = shopData.plan || 'trial';
      let isTrialActive = false;
      if (plan === 'trial' && shopData.trialStartDate) {
        const trialStart = new Date(shopData.trialStartDate);
        const daysElapsed = (new Date().getTime() - trialStart.getTime()) / (1000 * 3600 * 24);
        isTrialActive = daysElapsed < 7;
      }
      isOrderingEnabled = isTrialActive || plan === 'pro';
    }
  }

  const isDarkBg = getLuminance(backgroundColor) < 0.5;

  // Derive CSS Custom Properties based on luminance
  const themeVars = {
    '--theme-primary': primaryColor,
    '--theme-bg': backgroundColor,
    '--theme-text': isDarkBg ? '#FFFFFF' : '#18181B', // zinc-900
    '--theme-text-secondary': isDarkBg ? 'rgba(255, 255, 255, 0.6)' : '#71717A', // zinc-500
    '--theme-card': isDarkBg ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    '--theme-border': isDarkBg ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    '--theme-search': isDarkBg ? 'rgba(255, 255, 255, 0.12)' : '#F4F4F5', // zinc-100
  } as React.CSSProperties;

  return (
    <div 
      className={`w-full max-w-md mx-auto min-h-screen relative ${fontClass}`}
      style={{ ...themeVars, backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 px-5 py-5 transition-all shadow-sm" style={{ backgroundColor: 'var(--theme-bg)', borderBottom: '1px solid var(--theme-border)' }}>
        <div className={`flex mb-5 ${isCenter ? 'flex-col items-center justify-center text-center' : 'flex-row items-center justify-start text-left'} gap-3`}>
          {shopData?.logoUrl ? (
            <div className={`relative ${isCenter ? 'w-16 h-16' : 'w-12 h-12 shrink-0'} rounded-xl overflow-hidden`} style={{ backgroundColor: 'var(--theme-search)', border: '1px solid var(--theme-border)' }}>
              <Image src={shopData.logoUrl} alt="Logo" fill className="object-cover" />
            </div>
          ) : (
            <UtensilsCrossed className={`${isCenter ? 'w-8 h-8' : 'w-6 h-6 shrink-0'}`} style={{ color: primaryColor }} />
          )}
          
          <div className={`${isCenter ? 'mt-2' : ''}`}>
            <h1 className={`text-[20px] font-extrabold flex items-center ${isCenter ? 'justify-center' : ''} gap-2 tracking-tight`} style={{ color: 'var(--theme-text)' }}>
              {shopData?.name || "Your Store"}
            </h1>
            {shopData?.description && (
              <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--theme-text-secondary)' }}>{shopData.description}</p>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors group-focus-within:text-[color:var(--theme-primary)]" style={{ color: 'var(--theme-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search menu..." 
            className="w-full rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all focus:shadow-[0_0_0_2px_var(--theme-primary)]"
            style={{ backgroundColor: 'var(--theme-search)', color: 'var(--theme-text)' }}
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {dynamicCategories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={isActive 
                  ? { backgroundColor: primaryColor, color: '#FFFFFF', borderColor: primaryColor } 
                  : { backgroundColor: 'var(--theme-card)', color: 'var(--theme-text-secondary)', borderColor: 'var(--theme-border)' }
                }
                className={`whitespace-nowrap px-4 py-[6px] rounded-full text-[13px] font-semibold transition-all border ${
                  isActive ? "shadow-sm" : "hover:border-[color:var(--theme-text-secondary)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* Menu Items */}
      <div className={`p-4 ${layoutStyle === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}`}>
        {filteredMenu.map((item) => (
          layoutStyle === 'grid' 
            ? <GridItem key={item.id} item={item} primaryColor={primaryColor} primaryColorTransparent={primaryColorTransparent} isOrderingEnabled={isOrderingEnabled} />
            : <ListItem key={item.id} item={item} primaryColor={primaryColor} primaryColorTransparent={primaryColorTransparent} isOrderingEnabled={isOrderingEnabled} />
        ))}
      </div>

      {/* Powered By Footer */}
      <div className={`mt-8 mb-8 ${isOrderingEnabled ? 'pb-32' : 'pb-12'} flex justify-center`}>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-secondary)' }}>
          Powered by <span className="font-bold tracking-tight text-[13px]">khaoo</span>
        </a>
      </div>

      {/* Floating Action Bar (Cart) */}
      {isOrderingEnabled && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 w-full max-w-md mx-auto pointer-events-none">
          <div className="w-full pointer-events-auto">
            <button 
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColorTransparent}, 0 8px 10px -6px ${primaryColorTransparent}` }}
              className="w-full text-white rounded-[16px] p-4 flex items-center justify-between transition-transform active:scale-95 hover:brightness-110"
            >
              <div className="flex items-center gap-3">
                <div className="relative bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] font-extrabold" style={{ color: primaryColor }}>0</span>
                </div>
                <span className="font-bold text-[14px]">View Order</span>
              </div>
              <span className="font-bold flex items-center gap-1.5 text-[14px] bg-white/20 px-3 py-1.5 rounded-[10px] backdrop-blur-sm">
                Checkout <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents for Layouts

function ListItem({ item, primaryColor, primaryColorTransparent, isOrderingEnabled }: { item: MenuItem, primaryColor: string, primaryColorTransparent: string, isOrderingEnabled: boolean }) {
  return (
    <div className="flex flex-row p-[12px] rounded-[16px] shadow-sm transition-shadow" style={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex-1 pr-3 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-[15px] leading-tight" style={{ color: 'var(--theme-text)' }}>{item.name}</h3>
          <p className="text-[12px] line-clamp-2 mt-1 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{item.description}</p>
        </div>
        
        <div className="flex items-end justify-between mt-3">
          <span className="font-extrabold text-[15px] tracking-tight" style={{ color: 'var(--theme-text)' }}>₹{item.price}</span>
        </div>
      </div>

      <div className="flex flex-col items-center shrink-0 w-[70px]">
        {item.image ? (
          <div className="relative w-full h-[70px] rounded-[12px] overflow-hidden mb-[-12px] shadow-sm" style={{ backgroundColor: 'var(--theme-search)' }}>
            <Image 
              src={item.image} 
              alt={item.name} 
              fill 
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[70px] rounded-[12px] flex items-center justify-center mb-[-12px]" style={{ backgroundColor: 'var(--theme-search)' }}>
             <UtensilsCrossed className="w-5 h-5 opacity-40" style={{ color: 'var(--theme-text-secondary)' }} />
          </div>
        )}
        
        {isOrderingEnabled && (
          <button 
            style={{ backgroundColor: primaryColorTransparent, color: primaryColor, borderColor: primaryColorTransparent }}
            className="px-4 py-1.5 font-bold text-[10px] rounded-[8px] transition-all border border-solid relative z-10 w-full active:scale-95 hover:brightness-95"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
}

function GridItem({ item, primaryColor, primaryColorTransparent, isOrderingEnabled }: { item: MenuItem, primaryColor: string, primaryColorTransparent: string, isOrderingEnabled: boolean }) {
  return (
    <div className="flex flex-col rounded-[16px] shadow-sm transition-shadow overflow-hidden" style={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
      {item.image ? (
        <div className="relative w-full h-[120px]" style={{ backgroundColor: 'var(--theme-search)' }}>
          <Image 
            src={item.image} 
            alt={item.name} 
            fill 
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-[100px] flex items-center justify-center" style={{ backgroundColor: 'var(--theme-search)' }}>
           <UtensilsCrossed className="w-6 h-6 opacity-40" style={{ color: 'var(--theme-text-secondary)' }} />
        </div>
      )}
      
      <div className="p-[12px] flex flex-col flex-1">
        <h3 className="font-bold text-[14px] leading-tight mb-1" style={{ color: 'var(--theme-text)' }}>{item.name}</h3>
        <p className="text-[11px] line-clamp-2 leading-relaxed mb-3 flex-1" style={{ color: 'var(--theme-text-secondary)' }}>{item.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-extrabold text-[15px] tracking-tight" style={{ color: 'var(--theme-text)' }}>₹{item.price}</span>
          {isOrderingEnabled && (
            <button 
              style={{ backgroundColor: primaryColorTransparent, color: primaryColor, borderColor: primaryColorTransparent }}
              className="px-3 py-1 font-bold text-[10px] rounded-[6px] transition-all border border-solid active:scale-95 hover:brightness-95"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
