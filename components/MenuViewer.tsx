"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingBag, UtensilsCrossed, AlertCircle, ArrowRight, X, Clock, Bell, Receipt } from "lucide-react";
import { collection, query, doc, onSnapshot, addDoc, serverTimestamp, where } from "firebase/firestore";
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
  isAvailable?: boolean;
  menuId?: string;
};

type CartItem = MenuItem & { quantity: number };

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
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get('table');
      if (urlTable) setTableNumber(urlTable);

      let sid = localStorage.getItem("khao_session_id");
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem("khao_session_id", sid);
      }
      setSessionId(sid);
    }

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
        const data = docSnap.data();
        if (data.isAvailable !== false) {
          fetchedItems.push({ id: docSnap.id, ...data } as MenuItem);
        }
      });
      setAllMenuItems(fetchedItems);
      itemsLoaded = true;
      checkLoading();
    }, (err: any) => {
      console.error("Error fetching menu items live:", err);
      setError("Could not load menu. Please check the shop link.");
      setLoading(false);
    });

    // Fetch Active Menu
    const menusRef = collection(db, "menus");
    const unsubscribeMenus = onSnapshot(query(menusRef, where("shopId", "==", shopId), where("isActive", "==", true)), (snapshot) => {
      if (!snapshot.empty) {
        setActiveMenuId(snapshot.docs[0].id);
      } else {
        setActiveMenuId(null);
      }
    });

    return () => {
      unsubscribeShop();
      unsubscribeItems();
      unsubscribeMenus();
    };
  }, [shopId]);

  useEffect(() => {
    if (!sessionId || !shopId) return;
    const myOrdersRef = collection(db, "orders");
    const unsubscribeOrders = onSnapshot(
      query(myOrdersRef, where("shopId", "==", shopId), where("sessionId", "==", sessionId)),
      (snapshot) => {
        const fetchedOrders: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedOrders.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setMyOrders(fetchedOrders);
      }
    );
    return () => unsubscribeOrders();
  }, [sessionId, shopId]);

  const menuItems = (activeMenuId && allMenuItems.some(i => i.menuId)) 
    ? allMenuItems.filter(i => i.menuId === activeMenuId) 
    : allMenuItems;

  const dynamicCategories = shopData?.categories && shopData.categories.length > 0 
    ? ["All", ...shopData.categories] 
    : ["All"];
    
  const filteredMenu = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const getQuantity = (itemId: string) => cart.find((i) => i.id === itemId)?.quantity || 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "orders"), {
        shopId: shopId,
        sessionId: sessionId,
        tableNumber: tableNumber ? tableNumber.trim() : null,
        items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
        timestamp: serverTimestamp(),
        status: "incoming"
      });
      setCart([]);
      setTableNumber("");
      setIsCheckoutOpen(false);
      setIsTrackerOpen(true);
    } catch (err) {
      console.error("Failed to place order", err);
      alert("Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerRequest = async (type: 'waiter' | 'bill') => {
    if (!tableNumber) return;
    setIsSubmittingRequest(true);
    try {
      await addDoc(collection(db, "customer_requests"), {
        shopId: shopId,
        sessionId: sessionId,
        tableNumber: tableNumber.trim(),
        type: type,
        status: "pending",
        timestamp: serverTimestamp()
      });
      alert(type === 'waiter' ? "Waiter has been notified!" : "Bill requested successfully!");
    } catch (err) {
      console.error("Failed to send request", err);
      alert("Failed to send request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-900"></div>
        <p className="mt-4 text-sm font-medium text-zinc-500 animate-pulse">Loading menu...</p>
      </div>
    );
  }

  if (error || (menuItems.length === 0 && !loading)) {
    return (
      <div className="w-full max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Menu Unavailable</h2>
        <p className="text-sm text-zinc-500">{error || "This shop hasn't added any items yet."}</p>
      </div>
    );
  }

  // Dynamic Theme Variables
  const primaryColor = shopData?.primaryColor || "#DC2626";
  const backgroundColor = shopData?.backgroundColor || "#FFFFFF";
  const primaryColorTransparent = `${primaryColor}1A`; // 10% opacity
  const fontClass = getFontClass(shopData?.fontFamily || "Outfit");
  const layoutStyle = shopData?.layoutStyle || "list";
  const logoPlacement = shopData?.logoPlacement || "center";
  const isCenter = logoPlacement === "center";
  const isOrderingEnabled = shopData?.tableOrderingEnabled !== false;

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
        {filteredMenu.map((item) => {
          const quantity = getQuantity(item.id);
          return layoutStyle === 'grid' 
            ? <GridItem key={item.id} item={item} primaryColor={primaryColor} primaryColorTransparent={primaryColorTransparent} isOrderingEnabled={isOrderingEnabled} quantity={quantity} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />
            : <ListItem key={item.id} item={item} primaryColor={primaryColor} primaryColorTransparent={primaryColorTransparent} isOrderingEnabled={isOrderingEnabled} quantity={quantity} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />;
        })}
      </div>

      {/* Service Actions */}
      {isOrderingEnabled && tableNumber && (
        <div className="flex justify-center gap-3 mt-4 mb-4 px-4 w-full max-w-md mx-auto">
          <button
            onClick={() => handleCustomerRequest('waiter')}
            disabled={isSubmittingRequest}
            className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-[12px] font-bold text-[13px] tracking-tight shadow-sm flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Bell className="w-4 h-4" style={{ color: primaryColor }} /> Call Waiter
          </button>
          <button
            onClick={() => handleCustomerRequest('bill')}
            disabled={isSubmittingRequest}
            className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-[12px] font-bold text-[13px] tracking-tight shadow-sm flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Receipt className="w-4 h-4" style={{ color: primaryColor }} /> Ask for Bill
          </button>
        </div>
      )}

      {/* Powered By Footer */}
      <div className={`mt-8 mb-8 ${isOrderingEnabled ? 'pb-32' : 'pb-12'} flex justify-center`}>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-secondary)' }}>
          Powered by <span className="font-bold tracking-tight text-[13px]">khao</span>
        </a>
      </div>

      {/* Floating Action Bar (Cart) */}
      {isOrderingEnabled && totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 w-full max-w-md mx-auto pointer-events-none">
          <div className="w-full pointer-events-auto">
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColorTransparent}, 0 8px 10px -6px ${primaryColorTransparent}` }}
              className="w-full text-white rounded-[16px] p-4 flex items-center justify-between transition-transform active:scale-95 hover:brightness-110"
            >
              <div className="flex items-center gap-3">
                <div className="relative bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] font-extrabold" style={{ color: primaryColor }}>{totalItems}</span>
                </div>
                <span className="font-bold text-[14px]">View Order</span>
              </div>
              <span className="font-bold flex items-center gap-1.5 text-[14px] bg-white/20 px-3 py-1.5 rounded-[10px] backdrop-blur-sm">
                ₹{totalPrice} <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Track Orders Floating Button */}
      {myOrders.length > 0 && !isTrackerOpen && (
        <div className={`fixed left-0 right-0 z-30 p-4 w-full max-w-md mx-auto pointer-events-none transition-all duration-300 ${totalItems > 0 ? 'bottom-24' : 'bottom-0'}`}>
          <div className="w-full pointer-events-auto flex justify-center">
             <button 
               onClick={() => setIsTrackerOpen(true)}
               className="bg-zinc-900 border-zinc-700 text-white px-5 py-3 rounded-full font-bold text-[14px] shadow-xl flex items-center gap-2 border active:scale-95 transition-transform"
             >
               <Clock className="w-4 h-4" style={{ color: '#fff' }} />
               Track {myOrders.length} Order{myOrders.length !== 1 ? 's' : ''}
             </button>
          </div>
        </div>
      )}

      {/* Tracker Modal */}
      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md mx-auto rounded-t-[24px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: 'var(--theme-bg)', maxHeight: '90vh' }}>
            <div className="p-5 border-b shadow-sm flex justify-between items-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}>
              <h2 className="text-[18px] font-extrabold tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Clock className="w-5 h-5" style={{ color: primaryColor }} /> My Orders
              </h2>
              <button 
                onClick={() => setIsTrackerOpen(false)} 
                className="p-2 rounded-full transition-colors active:scale-95 hover:bg-black/5"
                style={{ backgroundColor: 'var(--theme-search)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--theme-text-secondary)' }} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {myOrders.map(order => {
                let statusLabel = "Order Placed";
                let statusColor = "text-zinc-500 font-bold";
                let statusBg = "bg-zinc-100 dark:bg-zinc-800";
                
                if (order.status === "accepted") { 
                  statusLabel = "Preparing Your Food"; 
                  statusColor = "text-amber-700 dark:text-amber-400 font-bold";
                  statusBg = "bg-amber-100 dark:bg-amber-900/30";
                }
                if (order.status === "completed") { 
                  statusLabel = "Delivered to Table"; 
                  statusColor = "text-emerald-700 dark:text-emerald-400 font-bold";
                  statusBg = "bg-emerald-100 dark:bg-emerald-900/30";
                }
                if (order.status === "cancelled") { 
                  statusLabel = "Order Cancelled"; 
                  statusColor = "text-red-700 dark:text-red-400 font-bold";
                  statusBg = "bg-red-100 dark:bg-red-900/30";
                }
                
                return (
                  <div key={order.id} className="p-4 rounded-2xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg ${statusColor} ${statusBg}`}>
                        {statusLabel}
                      </span>
                      <span className="text-[12px] opacity-60 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                        {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                    </div>
                    <div className="space-y-2.5 mb-2">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[14px] font-medium">
                          <span style={{ color: 'var(--theme-text)' }}><span className="opacity-50 mr-2 font-bold">{it.quantity}x</span> {it.name}</span>
                          <span className="font-extrabold opacity-80" style={{ color: 'var(--theme-text)' }}>₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md mx-auto rounded-t-[24px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: 'var(--theme-bg)', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div className="p-5 border-b shadow-sm flex justify-between items-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}>
              <h2 className="text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--theme-text)' }}>Your Order</h2>
              <button 
                onClick={() => setIsCheckoutOpen(false)} 
                className="p-2 rounded-full transition-colors active:scale-95 hover:bg-black/5"
                style={{ backgroundColor: 'var(--theme-search)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--theme-text-secondary)' }} />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="p-5 overflow-y-auto flex-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3 flex-1 overflow-hidden pr-3">
                    <span className="font-bold px-2 py-0.5 rounded-[6px] text-[13px]" style={{ backgroundColor: primaryColorTransparent, color: primaryColor }}>{item.quantity}x</span>
                    <span className="font-semibold text-[14px] truncate" style={{ color: 'var(--theme-text)' }}>{item.name}</span>
                  </div>
                  <span className="font-extrabold text-[15px]" style={{ color: 'var(--theme-text)' }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="text-center py-8 opacity-50 font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Your order is empty.
                </div>
              )}
            </div>

            {/* Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}>
                {tableNumber && (
                  <div className="mb-4 flex items-center justify-between p-3 rounded-[12px]" style={{ backgroundColor: 'var(--theme-search)' }}>
                    <span className="text-[12px] font-bold tracking-wide uppercase" style={{ color: 'var(--theme-text-secondary)' }}>Delivering To</span>
                    <span className="font-extrabold text-[15px]" style={{ color: 'var(--theme-text)' }}>{tableNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4 pt-1">
                  <span className="font-bold text-[16px]" style={{ color: 'var(--theme-text-secondary)' }}>Total</span>
                  <span className="font-extrabold text-[22px] tracking-tight" style={{ color: 'var(--theme-text)' }}>₹{totalPrice}</span>
                </div>
                
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  style={{ backgroundColor: isSubmitting ? 'var(--theme-search)' : primaryColor, color: isSubmitting ? 'var(--theme-text-secondary)' : '#FFF' }}
                  className="w-full py-4 rounded-[16px] font-bold text-[15px] transition-all active:scale-95 disabled:active:scale-100 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending Order...' : 'Place Order Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents for Layouts

function ListItem({ 
  item, primaryColor, primaryColorTransparent, isOrderingEnabled, quantity, onAdd, onRemove 
}: { 
  item: MenuItem, primaryColor: string, primaryColorTransparent: string, isOrderingEnabled: boolean, quantity: number, onAdd: () => void, onRemove: () => void 
}) {
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
          quantity === 0 ? (
            <button 
              onClick={onAdd}
              style={{ backgroundColor: primaryColorTransparent, color: primaryColor, borderColor: primaryColorTransparent }}
              className="px-4 py-1.5 font-bold text-[10px] rounded-[8px] transition-all border border-solid relative z-10 w-full active:scale-95 hover:brightness-95 mt-[-2px]"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center justify-between w-full h-[28px] rounded-[8px] overflow-hidden shadow-sm relative z-10 mt-[-2px]" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
              <button onClick={onRemove} className="w-1/3 h-full flex items-center justify-center font-bold text-[14px] active:bg-black/20 transition-colors">-</button>
              <span className="w-1/3 text-center font-bold text-[12px]">{quantity}</span>
              <button onClick={onAdd} className="w-1/3 h-full flex items-center justify-center font-bold text-[14px] active:bg-black/20 transition-colors">+</button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function GridItem({ 
  item, primaryColor, primaryColorTransparent, isOrderingEnabled, quantity, onAdd, onRemove 
}: { 
  item: MenuItem, primaryColor: string, primaryColorTransparent: string, isOrderingEnabled: boolean, quantity: number, onAdd: () => void, onRemove: () => void 
}) {
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
            quantity === 0 ? (
              <button 
                onClick={onAdd}
                style={{ backgroundColor: primaryColorTransparent, color: primaryColor, borderColor: primaryColorTransparent }}
                className="px-3 py-1 font-bold text-[10px] rounded-[6px] transition-all border border-solid active:scale-95 hover:brightness-95"
              >
                ADD
              </button>
            ) : (
              <div className="flex items-center justify-between w-[64px] h-[24px] rounded-[6px] overflow-hidden shadow-sm" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
                <button onClick={onRemove} className="flex-1 h-full flex items-center justify-center font-bold text-[12px] active:bg-black/20 transition-colors">-</button>
                <span className="flex-1 text-center font-bold text-[11px]">{quantity}</span>
                <button onClick={onAdd} className="flex-1 h-full flex items-center justify-center font-bold text-[12px] active:bg-black/20 transition-colors">+</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
