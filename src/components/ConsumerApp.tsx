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
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  User,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import PhoneInput from 'react-phone-number-input';
import { differenceInDays, parseISO } from 'date-fns';
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
  Trash2,
  Key,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toast, useToast } from './Toast';

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
  cashbackBalance?: number;
  authUid?: string;
  lastPurchaseDate: string;
  birthDate?: string;
}

interface StoreConfig {
  id: string;
  campaignName?: string;
  themeColor?: string;
  rewardMode?: 'points' | 'cashback';
  maxDaysBetweenPurchases?: number;
  pointsExpiryDays?: number;
  pointsStatus?: {
    status: 'active' | 'paused' | 'ended';
    endDate?: string;
  };
  cashbackStatus?: {
    status: 'active' | 'paused' | 'ended';
    endDate?: string;
  };
  cashbackConfig?: {
    percentage: number;
    minActivationValue: number;
    minRedeemDays: number;
    expiryDays: number;
  };
  companyProfile?: {
    companyName: string;
    logoURL?: string;
    photoURL?: string;
  };
  rewardTiers?: {
    points: number;
    prize: string;
  }[];
  redemptionCode?: string;
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ConsumerApp() {
  const [phone, setPhone] = useState<string | undefined>('');
  const [loginStep, setLoginStep] = useState<'phone' | 'confirm' | 'secure_choice' | 'email_pass' | 'loading'>('phone');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [stores, setStores] = useState<Record<string, StoreConfig>>({});
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [redeemingTier, setRedeemingTier] = useState<any>(null);
  const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [activeView, setActiveView] = useState<'wallet' | 'alerts'>('wallet');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('firestore-quota-exceeded', handler);
    return () => window.removeEventListener('firestore-quota-exceeded', handler);
  }, []);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read && !deletedIds.has(n.id)).length, 
    [notifications, deletedIds]
  );

  // Mark as read when entering alerts view
  useEffect(() => {
    if (activeView === 'alerts' && unreadCount > 0) {
      const markAllAsRead = async () => {
        try {
          const unreadNotifs = notifications.filter(n => !n.read);
          const batch = writeBatch(db);
          unreadNotifs.forEach(notif => {
            batch.update(doc(db, 'notifications', notif.id), { read: true });
          });
          await batch.commit();
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };
      markAllAsRead();
    }
  }, [activeView, unreadCount]);

  const handleDeleteNotification = async (id: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Revert if failed
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast("Não foi possível excluir a notificação. Tente novamente.", "error");
    }
  };

  // Load session if exists
  useEffect(() => {
    localStorage.setItem('pwa_mode', 'consumer');
    
    // Sense selected store from URL
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('companyId');
    if (companyId) {
      setSelectedStore(companyId);
      localStorage.setItem('last_company_id', companyId);
    } else {
      const lastId = localStorage.getItem('last_company_id');
      if (lastId) {
        setSelectedStore(lastId);
      }
    }

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
      showToast('Para instalar: Toque em compartilhar e selecione "Adicionar à Tela de Início".', 'info');
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

  // Listen for customer changes
  useEffect(() => {
    if (!isAuthenticated || customerRecords.length === 0) return;

    const unsubscribers = customerRecords.map(record => {
      return onSnapshot(doc(db, 'customers', record.id), (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = { id: snapshot.id, ...(snapshot.data() as any) } as CustomerRecord;
          setCustomerRecords(prev => prev.map(r => r.id === updatedData.id ? updatedData : r));
        }
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthenticated, customerRecords.length]);

  // Listen for notifications
  useEffect(() => {
    if (!isAuthenticated || customerRecords.length === 0) return;

    const customerIds = customerRecords.map(r => r.id);
    // Batch notifications listener in groups of 10 to avoid 'in' query limit if needed, 
    // but here we likely have few stores per user.
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
            const companyLogo = store?.companyProfile?.logoURL || store?.companyProfile?.photoURL || 'https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui';
            
            new Notification(data.title, { 
              body: data.message,
              icon: companyLogo
            });
          }
        });
      }
    }, (error) => {
      console.error("Notifications listener error:", error);
    });

    return () => unsubscribe();
  }, [isAuthenticated, customerRecords, stores]);

  const handleLogin = async (phoneToUse?: string, uidToUse?: string) => {
    const finalPhone = phoneToUse || phone;
    
    setLoading(true);
    try {
      const allQueries = [];
      
      if (uidToUse) {
        allQueries.push(query(collection(db, 'customers'), where('authUid', '==', uidToUse)));
      }

      if (finalPhone) {
        // 1. Exact match
        allQueries.push(query(collection(db, 'customers'), where('phone', '==', finalPhone)));
        
        // 2. Clean digits
        const cleanPhone = finalPhone.replace(/\D/g, '');
        if (cleanPhone !== finalPhone && cleanPhone.length > 0) {
          allQueries.push(query(collection(db, 'customers'), where('phone', '==', cleanPhone)));
        }
        
        // 3. Without +55 prefix
        if (cleanPhone.startsWith('55') && cleanPhone.length > 10) {
          allQueries.push(query(collection(db, 'customers'), where('phone', '==', cleanPhone.substring(2))));
        }

        // 4. With + prefix
        if (!finalPhone.startsWith('+') && cleanPhone.length > 10) {
          allQueries.push(query(collection(db, 'customers'), where('phone', '==', '+' + cleanPhone)));
        }
      }

      if (allQueries.length === 0) {
        if (!uidToUse) setLoading(false);
        return;
      }

      const snapshots = await Promise.all(allQueries.map(q => getDocs(q)));
      const recordsMap = new Map<string, CustomerRecord>();
      
      snapshots.forEach(snap => {
        snap.docs.forEach(doc => {
          recordsMap.set(doc.id, { id: doc.id, ...(doc.data() as any) } as CustomerRecord);
        });
      });

      const records = Array.from(recordsMap.values());

      if (records.length > 0) {
        const storeIds = Array.from(new Set(records.map(r => r.companyId)));
        const storeData: Record<string, StoreConfig> = {};
        const validRecords: CustomerRecord[] = [];
        
        for (const id of storeIds) {
          if (!id) continue;
          const storeDoc = await getDoc(doc(db, 'configs', id));
          if (storeDoc.exists()) {
            const data = storeDoc.data() as StoreConfig;
            const companyName = data.companyProfile?.companyName?.toLowerCase() || '';
            const campaignName = data.campaignName?.toLowerCase() || '';
            if (!companyName.includes('tentaculos') && !campaignName.includes('tentaculos')) {
              storeData[id] = { id, ...data } as StoreConfig;
            }
          }
        }

        records.forEach(r => {
          if (storeData[r.companyId]) validRecords.push(r);
        });

        if (finalPhone) localStorage.setItem('consumer_phone', finalPhone);
        setCustomerRecords(validRecords);
        setStores(storeData);

        if (auth.currentUser || uidToUse) {
          setIsAuthenticated(true);
        } else {
          setLoginStep('confirm');
        }
      } else if (finalPhone) {
        showToast('Nenhum cadastro encontrado com este número.', 'error');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showToast('Erro ao acessar o sistema.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const linkAccount = async (user: User) => {
    if (customerRecords.length === 0) return;
    try {
      const batch = writeBatch(db);
      customerRecords.forEach(record => {
        if (!record.authUid) {
          batch.update(doc(db, 'customers', record.id), { authUid: user.uid });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Account linking error:", error);
    }
  };

  const handleSecureGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      showToast('Abrindo conexão com Google...', 'info');
      const result = await signInWithPopup(auth, provider);
      showToast('Autenticado com sucesso!', 'success');
      
      const user = result.user;
      const savedPhone = localStorage.getItem('consumer_phone');
      
      // Attempt login with UID
      await handleLogin(savedPhone || undefined, user.uid);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      
      if (error.code === 'auth/popup-blocked') {
        showToast("Janela bloqueada! Habilite pop-ups para continuar.", "error");
      } else if (error.code === 'auth/unauthorized-domain') {
        showToast("Domínio não autorizado no Firebase Console.", "error");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        showToast("Login cancelado.", "info");
      } else {
        showToast(`Erro Google: ${error.code}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecureEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      let user;
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
        showToast('Conta criada e protegida!', 'success');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
        showToast('Acesso confirmado!', 'success');
      }
      if (user) await linkAccount(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Email secure error:", error);
      const msg = error.code === 'auth/email-already-in-use' ? "E-mail em uso. Faça login." :
                  error.code === 'auth/wrong-password' ? "Senha incorreta." : "Erro ao processar.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Digite seu e-mail primeiro.", "warning");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("E-mail de recuperação enviado! Verifique sua caixa de entrada.", "success");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      showToast("Erro ao enviar e-mail de recuperação.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('consumer_phone');
      setIsAuthenticated(false);
      setAuthUser(null);
      setCustomerRecords([]);
      setStores({});
      setLoginStep('phone');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
      const savedPhone = localStorage.getItem('consumer_phone');
      if (user) {
        handleLogin(savedPhone || undefined, user.uid);
      } else if (savedPhone && !isAuthenticated) {
        handleLogin(savedPhone);
      } else {
        setIsAuthenticated(false);
        setCustomerRecords([]);
        setStores({});
      }
    });
    return () => unsubscribe();
  }, []);

  if (quotaExceeded) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-amber-600" size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            ESTAMOS PASSANDO POR MANUTENÇÃO
          </h1>
          <p className="text-gray-600 leading-relaxed">
            EM BREVE VOCÊ PODERÁ ACESSAR O APLICATIVO.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 p-4"
            >
              <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-2xl p-1 shrink-0 overflow-hidden relative">
                    <img src="https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui" alt="Icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <div className="absolute top-0 left-0 bg-green-600 rounded-br-lg p-0.5 border-b border-r border-white/20">
                      <Smartphone size={10} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white">Clientes BuyPass</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Programa de Fidelidade</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleInstallClick} 
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                  >
                    Instalar
                  </button>
                  <button onClick={() => setShowInstallBanner(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
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
          <AnimatePresence mode="wait">
            {loginStep === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto shadow-lg shadow-green-500/10 overflow-hidden border border-gray-100 relative">
                    <img src="https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui" alt="Logo" className="w-full h-full object-contain p-3" referrerPolicy="no-referrer" />
                    <div className="absolute top-0 left-0 bg-green-600 p-1 rounded-br-lg">
                      <Smartphone size={12} className="text-white" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Clientes BuyPass</h1>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-widest text-[10px]">Sua carteira de benefícios digital</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu Celular</label>
                    <PhoneInput placeholder="(00) 00000-0000" value={phone} onChange={setPhone} defaultCountry="BR" className="PhoneInput consumer-phone-input" />
                  </div>
                  <button
                    onClick={() => handleLogin(phone)}
                    disabled={loading || !phone}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-gray-900/20 hover:bg-black transition-all"
                  >
                    {loading ? 'Buscando...' : 'Acessar Carteira'}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center px-4"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative flex justify-center text-center">
                      <span className="bg-white px-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">ou acesse com</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSecureGoogle}
                    className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Gmail / Google</span>
                  </button>

                  <button
                    onClick={() => setLoginStep('email_pass')}
                    className="w-full text-gray-400 font-black uppercase tracking-widest text-[10px] py-1 hover:text-gray-600 transition-all"
                  >
                    Ou usar E-mail e Senha
                  </button>
                </div>
              </motion.div>
            )}

            {loginStep === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <Smartphone size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-900">Este é você?</h2>
                  <p className="text-3xl font-black text-green-600 uppercase tracking-tighter truncate px-4">
                    {customerRecords[0]?.name || 'Cliente'}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Localizamos seu cadastro vinculado ao número {phone}.</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setLoginStep('secure_choice')}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-900/20 hover:bg-black transition-all"
                  >
                    Sim, sou eu!
                  </button>
                  <button
                    onClick={() => setLoginStep('phone')}
                    className="w-full text-gray-400 font-black uppercase tracking-widest text-[10px] py-2"
                  >
                    Não é meu nome, voltar
                  </button>
                </div>
              </motion.div>
            )}

            {loginStep === 'secure_choice' && (
              <motion.div key="secure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                  <Key size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-gray-900">Proteja seu Acesso</h2>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    Para sua segurança e para evitar que seu número seja usado por terceiros, vincule um e-mail ou use o Google.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleSecureGoogle}
                    className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Continuar com Google</span>
                  </button>
                  <button
                    onClick={() => setLoginStep('email_pass')}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                  >
                    Vincular E-mail e Senha
                  </button>
                </div>
              </motion.div>
            )}

            {loginStep === 'email_pass' && (
              <motion.div key="email_pass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-gray-900">{isRegistering ? 'Criar Acesso Seguro' : 'Entrar na Conta'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Crie seus dados para acessos futuros.</p>
                </div>

                <form onSubmit={handleSecureEmail} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email" 
                        value={email || ''}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                        required
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha</label>
                        {!isRegistering && (
                          <button 
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-[9px] text-primary font-black uppercase tracking-widest hover:underline"
                          >
                            Esqueci a senha
                          </button>
                        )}
                      </div>
                      <input 
                        type="password" 
                        value={password || ''}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading || !email || !password}
                      className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                    >
                      {loading ? 'Processando...' : (isRegistering ? 'Criar e Acessar' : 'Entrar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegistering(!isRegistering)}
                      className="w-full text-[10px] text-gray-500 font-black uppercase tracking-widest"
                    >
                      {isRegistering ? 'Já tenho uma conta segura' : 'Cadastrar novo e-mail'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            Plataforma de Relacionamento BuyPass.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-8 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
            <img 
              src="https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui" 
              alt="Logo" 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Meus Pontos</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Olá, {customerRecords[0]?.name?.split(' ')[0] || 'Cliente'}, hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
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
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 font-mono">Resumo da Carteira</p>
                <h3 className="text-2xl font-black leading-tight uppercase tracking-tight">
                  Você está participando de {customerRecords.length} programas
                </h3>
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
                          <h5 className="font-black text-gray-900 tracking-tight leading-none text-base">
                            {store?.companyProfile?.companyName || 'Loja Parceira'}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="text-[11px] font-black text-green-600 uppercase tracking-widest">
                               {store?.rewardMode === 'cashback' ? 'CASHBACK' : 'PONTOS'}
                            </p>
                            {store && (store.rewardMode === 'points' ? store.pointsStatus : store.cashbackStatus)?.status !== 'active' && (
                              <span className={cn(
                                "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                (store.rewardMode === 'points' ? store.pointsStatus : store.cashbackStatus)?.status === 'paused' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              )}>
                                {(store.rewardMode === 'points' ? store.pointsStatus : store.cashbackStatus)?.status === 'paused' ? 'Pausado' : 'Encerrado'}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 opacity-70">
                            {store?.campaignName || 'Programa de Fidelidade'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            {record.points > 0 && (
                              <p className={cn("text-lg font-black leading-none", store?.rewardMode === 'points' ? "text-green-600" : "text-gray-400 opacity-50")}>
                                {formatCurrency(record.points)} {store?.rewardMode === 'points' ? 'pts' : ''}
                              </p>
                            )}
                            {(record.cashbackBalance || 0) > 0 && (
                              <p className={cn("text-lg font-black leading-tight", store?.rewardMode === 'cashback' ? "text-green-600" : "text-gray-400 opacity-50")}>
                                R$ {formatCurrency(record.cashbackBalance || 0)}
                              </p>
                            )}
                            {record.points <= 0 && (!record.cashbackBalance || record.cashbackBalance <= 0) && (
                              <p className="text-lg font-black text-gray-300">0,00</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">Progresso</span>
                          <span className="text-green-600">
                            {store?.rewardMode === 'cashback' 
                              ? `SALDO: R$ ${formatCurrency(record.cashbackBalance || 0)}`
                              : (nextTier ? `${formatCurrency(record.points)}/${formatCurrency(nextTier.points)}` : 'Prêmio Máximo!')
                            }
                          </span>
                        </div>
                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${store?.rewardMode === 'cashback' 
                                ? Math.min(((record.cashbackBalance || 0) / (store.cashbackConfig?.minActivationValue || 1)) * 100, 100)
                                : progress}%` 
                            }}
                            className={cn("h-full rounded-full", store?.rewardMode === 'cashback' ? "bg-green-600" : "bg-green-500")}
                          />
                        </div>
                      </div>

                      {nextTier && store?.rewardMode !== 'cashback' && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 p-3 rounded-xl">
                          <Award size={14} className="text-green-600" />
                          Próximo: {nextTier.prize}
                        </div>
                      )}

                      {/* Expiration Info */}
                      <div className="mt-4 space-y-1">
                        {store?.rewardMode === 'cashback' ? (
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Validade do Programa</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-100 text-left">
                              <Clock size={12} />
                              <div>
                                {store.cashbackConfig?.expiryDays 
                                  ? `Saldo expira em ${store.cashbackConfig.expiryDays} dias de inatividade.` 
                                  : 'Saldo não expira.'}
                                {record.lastPurchaseDate && store.cashbackConfig?.expiryDays && (
                                  <p className="text-[9px] opacity-70 mt-1">
                                    {Math.max(0, store.cashbackConfig.expiryDays - differenceInDays(new Date(), parseISO(record.lastPurchaseDate)))} dias restantes para usar.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expiração de Pontos</p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-100 text-left">
                              <Clock size={12} />
                              <div>
                                {(store.maxDaysBetweenPurchases || store.pointsExpiryDays) 
                                  ? `Pontos expiram em ${store.maxDaysBetweenPurchases || store.pointsExpiryDays} dias de inatividade.` 
                                  : 'Pontos não expiram.'}
                                {record.lastPurchaseDate && (store.maxDaysBetweenPurchases || store.pointsExpiryDays) && (
                                  <p className="text-[9px] opacity-70 mt-1">
                                    {Math.max(0, (store.maxDaysBetweenPurchases || store.pointsExpiryDays || 0) - differenceInDays(new Date(), parseISO(record.lastPurchaseDate)))} dias restantes para usar.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (store?.rewardMode === 'cashback') {
                            const minRedeem = store.cashbackConfig?.minActivationValue || 0;
                            const minDays = store.cashbackConfig?.minRedeemDays || 0;
                            const daysSinceLast = record.lastPurchaseDate ? differenceInDays(new Date(), parseISO(record.lastPurchaseDate)) : 999;
                            
                            if ((record.cashbackBalance || 0) < minRedeem) {
                              showToast(`Saldo insuficiente. Mínimo para resgate: R$ ${formatCurrency(minRedeem)}`, "info");
                              return;
                            }
                            if (daysSinceLast < minDays) {
                              showToast(`Prazo mínimo para resgate não atingido. Aguarde mais ${minDays - daysSinceLast} dia(s).`, "info");
                              return;
                            }
                            setSelectedStore(record.companyId);
                            return;
                          }
                          const availableTiers = store?.rewardTiers?.filter(t => t.points <= record.points) || [];
                          if (availableTiers.length > 0) {
                            setSelectedStore(record.companyId);
                          } else {
                            showToast("Você ainda não tem pontos suficientes para o resgate.", "info");
                          }
                        }}
                        className={cn(
                          "w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          store?.rewardMode === 'cashback'
                            ? ((record.cashbackBalance || 0) > 0 && 
                               (record.cashbackBalance || 0) >= (store.cashbackConfig?.minActivationValue || 0) &&
                               (record.lastPurchaseDate ? differenceInDays(new Date(), parseISO(record.lastPurchaseDate)) : 999) >= (store.cashbackConfig?.minRedeemDays || 0)
                                ? "bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700"
                                : "bg-gray-100 text-gray-400")
                            : (store?.rewardTiers?.some(t => t.points <= record.points)
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600"
                              : "bg-gray-100 text-gray-400")
                        )}
                      >
                        {store?.rewardMode === 'cashback' ? 'Resgatar Cashback' : 'Resgatar Prêmio'}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suas Notificações</h4>
              {notifications.length > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      const batch = writeBatch(db);
                      notifications.forEach(n => {
                        batch.delete(doc(db, 'notifications', n.id));
                      });
                      await batch.commit();
                      setDeletedIds(new Set(notifications.map(n => n.id)));
                      showToast("Notificações limpas!", "success");
                    } catch (err) {
                      console.error("Error deleting all notifications:", err);
                      showToast("Erro ao limpar notificações.", "error");
                    }
                  }}
                  className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                >
                  Limpar Tudo
                </button>
              )}
            </div>
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
                  <div className="flex flex-col items-center">
                    {(customerRecords.find(r => r.companyId === selectedStore)?.points || 0) > 0 && (
                      <p className={cn("text-2xl font-black", stores[selectedStore]?.rewardMode === 'points' ? "text-green-600" : "text-gray-400")}>
                        {formatCurrency(customerRecords.find(r => r.companyId === selectedStore)?.points || 0)} pts
                      </p>
                    )}
                    {(customerRecords.find(r => r.companyId === selectedStore)?.cashbackBalance || 0) > 0 && (
                      <p className={cn("text-2xl font-black", stores[selectedStore]?.rewardMode === 'cashback' ? "text-green-600" : "text-gray-400")}>
                        R$ {formatCurrency(customerRecords.find(r => r.companyId === selectedStore)?.cashbackBalance || 0)}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Saldo Atual</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100">
                  <p className="text-3xl font-black text-gray-900">{stores[selectedStore]?.rewardTiers?.length || 0}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Prêmios</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest ml-1">
                  {stores[selectedStore]?.rewardMode === 'cashback' ? 'Opção de Resgate' : 'Tabela de Prêmios'}
                </h4>
                <div className="space-y-3">
                  {stores[selectedStore]?.rewardMode === 'cashback' ? (
                    <div className="p-4 rounded-2xl border bg-green-50 border-green-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-600 text-white">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Resgatar Saldo Cashback</p>
                          <p className="text-[10px] text-gray-500 font-bold">
                            Mínimo necessário: R$ {formatCurrency(stores[selectedStore]?.cashbackConfig?.minActivationValue || 0)}
                          </p>
                          {/* Expiration Info for Cashback */}
                          {stores[selectedStore]?.cashbackConfig?.expiryDays && (
                            <p className="text-[9px] text-amber-600 font-black uppercase mt-1">
                              Expira em {stores[selectedStore].cashbackConfig.expiryDays} dias
                              {(() => {
                                const record = customerRecords.find(r => r.companyId === selectedStore);
                                if (record?.lastPurchaseDate) {
                                  const daysLeft = Math.max(0, stores[selectedStore].cashbackConfig.expiryDays - differenceInDays(new Date(), parseISO(record.lastPurchaseDate)));
                                  return ` • Faltam ${daysLeft} dias`;
                                }
                                return '';
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                      {(customerRecords.find(r => r.companyId === selectedStore)?.cashbackBalance || 0) >= (stores[selectedStore]?.cashbackConfig?.minActivationValue || 0) && (
                        <button 
                          onClick={() => setRedeemingTier({ 
                            prize: `Saldo Cashback R$ ${formatCurrency(customerRecords.find(r => r.companyId === selectedStore)?.cashbackBalance || 0)}`,
                            points: customerRecords.find(r => r.companyId === selectedStore)?.cashbackBalance || 0,
                            companyId: selectedStore 
                          })}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                        >
                          Resgatar
                        </button>
                      )}
                    </div>
                  ) : (
                    stores[selectedStore]?.rewardTiers?.sort((a, b) => a.points - b.points).map((tier, i) => {
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
                              <p className="text-[10px] text-gray-500 font-bold">{formatCurrency(tier.points)} pontos necessários</p>
                              {/* Expiration Info for Points */}
                              {stores[selectedStore]?.pointsExpiryDays && (
                                <p className="text-[9px] text-amber-600 font-black uppercase mt-1">
                                  Expira em {stores[selectedStore].pointsExpiryDays} dias
                                  {(() => {
                                    const record = customerRecords.find(r => r.companyId === selectedStore);
                                    if (record?.lastPurchaseDate) {
                                      const daysLeft = Math.max(0, stores[selectedStore].pointsExpiryDays - differenceInDays(new Date(), parseISO(record.lastPurchaseDate)));
                                      return ` • Faltam ${daysLeft} dias`;
                                    }
                                    return '';
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                          {isUnlocked && (
                            <button 
                              onClick={() => setRedeemingTier({ ...tier, companyId: selectedStore })}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                            >
                              Resgatar
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
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

      {/* Redemption Code Modal */}
      <AnimatePresence>
        {redeemingTier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Key className="text-green-600" size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Código de Resgate</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Para resgatar o prêmio <span className="text-green-600 font-bold">"{redeemingTier.prize}"</span>, peça o código ao atendente da loja.
                </p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text"
                  value={redemptionCodeInput}
                  onChange={(e) => setRedemptionCodeInput(e.target.value.toUpperCase())}
                  placeholder="DIGITE O CÓDIGO"
                  maxLength={6}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.5em] text-gray-900 outline-none focus:border-green-500 transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-sm"
                />

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setRedeemingTier(null);
                      setRedemptionCodeInput('');
                    }}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      const store = stores[redeemingTier.companyId];
                      if (redemptionCodeInput.toUpperCase() === store.redemptionCode?.toUpperCase()) {
                        setIsRedeeming(true);
                        try {
                          const customerRecord = customerRecords.find(r => r.companyId === redeemingTier.companyId);
                          if (!customerRecord) throw new Error("Registro do cliente não encontrado.");

                          const newPoints = customerRecord.points - redeemingTier.points;
                          
                          await updateDoc(doc(db, 'customers', customerRecord.id), {
                            points: newPoints
                          });

                          showToast("PREMIO RESGATADO COM SUCESSO!", "success");
                          setRedeemingTier(null);
                          setRedemptionCodeInput('');
                        } catch (error) {
                          console.error("Error redeeming prize:", error);
                          showToast("Erro ao resgatar prêmio. Tente novamente.", "error");
                        } finally {
                          setIsRedeeming(false);
                        }
                      } else {
                        showToast("Código inválido. Tente novamente.", "error");
                      }
                    }}
                    disabled={redemptionCodeInput.length !== 6 || isRedeeming}
                    className="flex-[2] px-6 py-4 bg-green-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-600 disabled:opacity-50 transition-all"
                  >
                    {isRedeeming ? 'Validando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
