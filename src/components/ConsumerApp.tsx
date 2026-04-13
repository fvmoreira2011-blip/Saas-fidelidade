import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import PhoneInput from 'react-phone-number-input';
import { 
  Trophy, 
  Search, 
  Smartphone, 
  ChevronRight, 
  Award, 
  Star, 
  Clock,
  LogOut,
  Store,
  Wallet,
  Bell,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types (Redefined for simplicity or imported if exported)
interface CustomerRecord {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  points: number;
  lastPurchaseDate: string;
}

interface StoreConfig {
  id: string;
  campaignName?: string;
  themeColor?: string;
  companyProfile?: {
    companyName: string;
    logoURL?: string;
    photoURL?: string;
  };
  rewardTiers?: {
    points: number;
    prize: string;
  }[];
}

interface Notification {
  id: string;
  customerId: string;
  companyId: string;
  title: string;
  message: string;
  type: 'points' | 'inactivity' | 'birthday' | 'prize_near';
  date: string;
  read: boolean;
}

export default function ConsumerApp() {
  const [phone, setPhone] = useState<string | undefined>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [stores, setStores] = useState<Record<string, StoreConfig>>({});
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'wallet' | 'alerts'>('wallet');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Mark as read when entering alerts view
  useEffect(() => {
    if (activeView === 'alerts' && unreadCount > 0) {
      const markAllAsRead = async () => {
        try {
          const unreadNotifs = notifications.filter(n => !n.read);
          for (const notif of unreadNotifs) {
            await updateDoc(doc(db, 'notifications', notif.id), { read: true });
          }
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };
      markAllAsRead();
    }
  }, [activeView, unreadCount, notifications]);

  const handleDeleteNotification = async (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Load session if exists
  useEffect(() => {
    const savedPhone = localStorage.getItem('consumer_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      handleLogin(savedPhone);
    }

    // PWA Install logic
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    
    // If iOS and not in standalone mode, show banner
    if (isIOSDevice && !(window.navigator as any).standalone) {
      setShowInstallBanner(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('Para instalar no iPhone: Toque no ícone de compartilhar (quadrado com seta) e selecione "Adicionar à Tela de Início".');
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Listen for notifications
  useEffect(() => {
    if (!isAuthenticated || customerRecords.length === 0) return;

    const customerIds = customerRecords.map(r => r.id);
    const q = query(collection(db, 'notifications'), where('customerId', 'in', customerIds));
    
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Notification));
          setNotifications(notifs.sort((a, b) => b.date.localeCompare(a.date)));
          
          // Browser Notification API
          if (Notification.permission === 'granted') {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                const store = stores[data.companyId];
                const companyLogo = store?.companyProfile?.logoURL || store?.companyProfile?.photoURL || 'https://lh3.googleusercontent.com/d/1zZIjvIWtsLVet5ltkAK4dbxYuIX1GnBa';
                
                new Notification(data.title, { 
                  body: data.message,
                  icon: companyLogo
                });
              }
            });
          }
        });

    // Request permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, [isAuthenticated, customerRecords]);

  const handleLogin = async (phoneToUse?: string) => {
    const finalPhone = phoneToUse || phone;
    if (!finalPhone) {
      alert('Por favor, insira seu número de celular.');
      return;
    }

    setLoading(true);
    console.log('Tentando login com telefone:', finalPhone);
    try {
      // Request notification permission on login
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      const allQueries = [];
      
      // 1. Exact match (usually +55...)
      allQueries.push(query(collection(db, 'customers'), where('phone', '==', finalPhone)));
      
      // 2. Clean digits only
      const cleanPhone = finalPhone.replace(/\D/g, '');
      if (cleanPhone !== finalPhone && cleanPhone.length > 0) {
        allQueries.push(query(collection(db, 'customers'), where('phone', '==', cleanPhone)));
      }
      
      // 3. Without +55 prefix if it exists
      if (cleanPhone.startsWith('55') && cleanPhone.length > 10) {
        const localPhone = cleanPhone.substring(2);
        allQueries.push(query(collection(db, 'customers'), where('phone', '==', localPhone)));
      }

      // 4. With + prefix if missing but looks like E.164
      if (!finalPhone.startsWith('+') && cleanPhone.length > 10) {
        allQueries.push(query(collection(db, 'customers'), where('phone', '==', '+' + cleanPhone)));
      }

      // Execute all queries in parallel
      const snapshots = await Promise.all(allQueries.map(q => getDocs(q)));
      
      // Combine results and remove duplicates
      const recordsMap = new Map<string, CustomerRecord>();
      snapshots.forEach(snap => {
        snap.docs.forEach(doc => {
          recordsMap.set(doc.id, { id: doc.id, ...(doc.data() as any) } as CustomerRecord);
        });
      });

      const records = Array.from(recordsMap.values());
      console.log(`Encontrados ${records.length} registros para o telefone.`);

      if (records.length > 0) {
        setCustomerRecords(records);
        setIsAuthenticated(true);
        localStorage.setItem('consumer_phone', finalPhone);
        
        // Fetch store configs for each record
        const storeIds = Array.from(new Set(records.map(r => r.companyId)));
        const storeData: Record<string, StoreConfig> = {};
        
        for (const id of storeIds) {
          const storeDoc = await getDoc(doc(db, 'configs', id));
          if (storeDoc.exists()) {
            storeData[id] = { id, ...storeDoc.data() } as StoreConfig;
          }
        }
        setStores(storeData);
      } else {
        alert('Nenhum cadastro encontrado com este número.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Erro ao acessar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('consumer_phone');
    setIsAuthenticated(false);
    setCustomerRecords([]);
    setStores({});
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 p-4"
            >
              <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl p-1 shrink-0">
                    <img src="https://lh3.googleusercontent.com/d/1zZIjvIWtsLVet5ltkAK4dbxYuIX1GnBa" alt="Icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">BuyPass</p>
                    <p className="text-[10px] text-gray-400 font-bold">Baixe agora nosso aplicativo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleInstallClick}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                  >
                    Instalar
                  </button>
                  <button onClick={() => setShowInstallBanner(false)} className="p-2 text-gray-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-gray-100"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/10 overflow-hidden border border-gray-100">
              <img 
                src="https://lh3.googleusercontent.com/d/1zZIjvIWtsLVet5ltkAK4dbxYuIX1GnBa" 
                alt="Logo" 
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seus Pontos viram Prêmios</h1>
            <p className="text-gray-500 text-sm font-medium">Acesse todos os seus programas de pontos em um só lugar.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu Celular</label>
              <PhoneInput
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={setPhone}
                defaultCountry="BR"
                className="PhoneInput consumer-phone-input"
              />
            </div>

            <button
              onClick={() => handleLogin(phone)}
              disabled={loading || !phone}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-gray-900/20 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Acessando...' : 'Acesse Aqui'}
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            Ao entrar você concorda com nossos termos de uso.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-8 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Meus Pontos</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Olá, {customerRecords[0]?.name.split(' ')[0]}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 space-y-6">
        {activeView === 'wallet' ? (
          <>
            {/* Summary Card */}
            <div className="bg-green-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-green-600/30 relative overflow-hidden">
              <div className="relative z-10 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total de Programas</p>
                <h3 className="text-4xl font-black">{customerRecords.length}</h3>
              </div>
              <Wallet className="absolute -right-4 -bottom-4 text-white/10" size={120} />
            </div>

            {/* Programs List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seus Programas Ativos</h4>
              
              <AnimatePresence>
                {customerRecords.map((record, index) => {
                  const store = stores[record.companyId];
                  const nextTier = store?.rewardTiers?.find(t => t.points > record.points);
                  const progress = nextTier ? (record.points / nextTier.points) * 100 : 100;

                  return (
                    <motion.div 
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedStore(record.companyId)}
                      className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100">
                          {(store?.companyProfile?.logoURL || store?.companyProfile?.photoURL) ? (
                            <img 
                              src={store.companyProfile.logoURL || store.companyProfile.photoURL} 
                              alt={store.companyProfile.companyName} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Store className="text-gray-300" size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-black text-gray-900 tracking-tight">{store?.companyProfile?.companyName || 'Loja Parceira'}</h5>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{store?.campaignName || 'Programa de Fidelidade'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-green-600">{record.points}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Pontos</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-green-600">{nextTier ? `${record.points}/${nextTier.points}` : 'Prêmio Máximo!'}</span>
                        </div>
                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-green-500 rounded-full"
                          />
                        </div>
                      </div>

                      {nextTier && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl">
                          <Award size={14} className="text-green-600" />
                          Próximo: {nextTier.prize}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Suas Notificações</h4>
            <AnimatePresence mode="popLayout">
              {notifications.filter(n => !deletedIds.has(n.id)).map((notif, index) => (
                <div key={notif.id} className="relative group overflow-hidden rounded-3xl">
                  {/* Delete Background */}
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-between px-8 text-white rounded-3xl">
                    <Trash2 size={24} />
                    <Trash2 size={24} />
                  </div>

                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 100) {
                        handleDeleteNotification(notif.id);
                      }
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 500 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2 touch-pan-y"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {!notif.read && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        <h5 className="font-black text-gray-900 text-sm tracking-tight">{notif.title}</h5>
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold uppercase">{new Date(notif.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{notif.message}</p>
                  </motion.div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-400 font-bold text-sm">Nenhuma notificação por enquanto.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Store Detail Modal */}
      <AnimatePresence>
        {selectedStore && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedStore(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[3rem] p-8 space-y-8 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-green-500/20 shadow-xl">
                  {(stores[selectedStore]?.companyProfile?.logoURL || stores[selectedStore]?.companyProfile?.photoURL) ? (
                    <img 
                      src={stores[selectedStore].companyProfile?.logoURL || stores[selectedStore].companyProfile?.photoURL} 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Store className="text-gray-300" size={40} />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stores[selectedStore]?.companyProfile?.companyName}</h3>
                  <p className="text-sm text-gray-500 font-medium">{stores[selectedStore]?.campaignName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100">
                  <p className="text-3xl font-black text-green-600">{customerRecords.find(r => r.companyId === selectedStore)?.points}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Saldo Atual</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100">
                  <p className="text-3xl font-black text-gray-900">{stores[selectedStore]?.rewardTiers?.length || 0}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Prêmios</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Tabela de Prêmios</h4>
                <div className="space-y-3">
                  {stores[selectedStore]?.rewardTiers?.sort((a, b) => a.points - b.points).map((tier, i) => {
                    const currentPoints = customerRecords.find(r => r.companyId === selectedStore)?.points || 0;
                    const isUnlocked = currentPoints >= tier.points;

                    return (
                      <div 
                        key={i}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isUnlocked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {isUnlocked ? <Trophy size={16} /> : <Star size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{tier.prize}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{tier.points} pontos necessários</p>
                          </div>
                        </div>
                        {isUnlocked && (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                            Disponível
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => setSelectedStore(null)}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl"
              >
                Fechar Detalhes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-8 py-4 flex justify-around items-center z-20">
        <button 
          onClick={() => setActiveView('wallet')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeView === 'wallet' ? "text-green-600" : "text-gray-300")}
        >
          <Wallet size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">Carteira</span>
        </button>
        <button 
          onClick={() => setActiveView('alerts')}
          className={cn("flex flex-col items-center gap-1 transition-all relative", activeView === 'alerts' ? "text-green-600" : "text-gray-300")}
        >
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Alertas</span>
        </button>
        <button 
          onClick={handleInstallClick}
          className="text-gray-300 flex flex-col items-center gap-1 hover:text-green-600 transition-all"
        >
          <Smartphone size={24} />
          <span className="text-[8px] font-black uppercase tracking-widest">WebApp</span>
        </button>
      </div>
    </div>
  );
}
