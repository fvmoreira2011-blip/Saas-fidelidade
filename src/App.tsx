/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, Component, ReactNode, createContext, useContext } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp,
  updateDoc,
  increment,
  getDocFromServer,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { db, auth, firebaseConfig } from './firebase';
import { Toast, useToast } from './components/Toast';
import { utils, read, writeFile } from 'xlsx';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut, 
  Search, 
  Trophy, 
  Calendar, 
  DollarSign, 
  Users,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Send,
  QrCode,
  MessageSquare,
  ChevronRight,
  BarChart3,
  Edit,
  Trash2,
  MoreVertical,
  Building2,
  Camera,
  ArrowUpCircle,
  XCircle,
  AlertTriangle,
  Save,
  Check,
  X,
  Building,
  Plus,
  Menu,
  ShieldCheck,
  UserCircle,
  TrendingUp,
  Unlock,
  Lock,
  Key,
  Award,
  Info,
  Upload,
  ExternalLink,
  Brain,
  HelpCircle,
  Sparkles,
  Cake,
  Mail,
  MessageCircle,
  RotateCcw,
  Target,
  Edit2,
  LayoutDashboard,
  UserPlus,
  Calculator,
  Percent,
  Pause,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'react-phone-number-input/style.css';
import { GoogleGenAI } from "@google/genai";
import { format, isToday, subDays, differenceInDays, differenceInYears, parseISO, isWithinInterval, startOfDay, endOfDay, subWeeks, subMonths, isBefore, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QRCodeSVG } from 'qrcode.react';
import 'jspdf-autotable';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeCNPJ(cnpj: string) {
  return cnpj.replace(/\D/g, '');
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Types
interface ConfirmContextType {
  askConfirmation: (title: string, message: string, onConfirm: () => void, isDanger?: boolean, confirmText?: string, cancelText?: string) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback to window.confirm if context is not available (shouldn't happen)
    return {
      askConfirmation: (title: string, message: string, onConfirm: () => void) => {
        if (window.confirm(`${title}\n\n${message}`)) onConfirm();
      }
    };
  }
  return context;
}
interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  cashbackBalance?: number;
  authUid?: string;
  age?: number;
  birthDate?: string;
  lastPurchaseDate: string;
  createdAt: string;
}

interface Purchase {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  pointsEarned: number;
}

interface Redemption {
  id: string;
  customerId: string;
  prize: string;
  pointsValue: number;
  cost: number;
  date: string;
}

interface Goal {
  id: string;
  month: string; // YYYY-MM
  value: number;
  workingDays?: number;
}

interface RewardTier {
  points: number;
  prize: string;
  expiryDays?: number;
  cost?: number;
}

interface SeasonalDate {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'state' | 'municipal' | 'custom';
  state?: string;
  city?: string;
}

interface Notification {
  id?: string;
  customerId: string;
  companyId: string;
  title: string;
  message: string;
  type: 'points' | 'inactivity' | 'birthday' | 'prize_near';
  date: string;
  read: boolean;
}

interface CompanyProfile {
  companyName: string;
  tradingName: string;
  cnpj: string;
  phone: string;
  address: string;
  responsible: string;
  contactPhone: string;
  photoURL?: string;
  subscriptionType: 'monthly' | 'quarterly' | 'annual';
  logoURL?: string;
}

interface ProgramStatus {
  status: 'active' | 'paused' | 'ended';
  validityType: 'custom' | '180days' | '365days' | 'indeterminate';
  startDate?: string;
  endDate?: string;
}

interface LoyaltyRule {
  campaignName?: string;
  purchasesForPrize: number;
  minPurchaseValue: number;
  maxDaysBetweenPurchases: number;
  pointsPerReal: number;
  pointsExpiryDays: number;
  welcomeMessage: string;
  rewardTiers?: RewardTier[];
  allowedUserTabs?: string[];
  themeColor?: string;
  seasonalDates?: SeasonalDate[];
  companyProfile?: CompanyProfile;
  extraPointsThreshold?: number;
  extraPointsAmount?: number;
  lifeExpectancy?: number;
  openaiApiKey?: string;
  geminiApiKey?: string;
  aiPrompt?: string;
  redemptionCode?: string;
  rewardMode: 'points' | 'cashback';
  cashbackConfig?: {
    percentage: number;
    minActivationValue: number;
    minRedeemDays: number;
    expiryDays: number;
  };
  pointsStatus?: ProgramStatus;
  cashbackStatus?: ProgramStatus;
  currentAvgTicket?: number;
  currentMonthlyRevenue?: number;
  onboardingComplete?: boolean;
  erpKey?: string;
}

interface AppUser {
  id: string;
  uid: string; // Document ID
  authUid?: string; // Firebase Auth UID
  companyId?: string; // Company ID
  email: string;
  displayName?: string;
  photoURL?: string;
  approved: boolean;
  role: 'admin' | 'user' | 'superadmin';
  createdAt: string;
  clientStatus?: 'free' | 'semestral' | 'anual';
  planStartDate?: string;
  planEndDate?: string;
  companyName?: string;
  cnpj?: string;
  phone?: string;
  themeColor?: string;
  secondaryColor?: string;
  sidebarColor?: string;
  cardColor?: string;
  textColor?: string;
  logoURL?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  companyPhone?: string;
  password?: string;
  isClient?: boolean;
  campaignName?: string;
  address?: string;
  activationDate?: string;
  paymentMethod?: string;
  roleInCompany?: string;
  redemptionCode?: string;
  erpKey?: string;
}

function RedemptionCodesTab() {
  const [configs, setConfigs] = useState<LoyaltyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [unlockedCodes, setUnlockedCodes] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const { askConfirmation } = useConfirm();

  const toggleLock = (id: string) => {
    setUnlockedCodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const q = query(collection(db, 'configs'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      setConfigs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateCode = async (id: string) => {
    if (!newCode || newCode.length !== 6) {
      showToast("O código deve ter exatamente 6 caracteres.", "warning");
      return;
    }
    try {
      await updateDoc(doc(db, 'configs', id), { redemptionCode: newCode.toUpperCase() });
      setEditingId(null);
      setNewCode('');
      showToast("Código atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Error updating code:", error);
      showToast("Erro ao atualizar código.", "error");
    }
  };

  const handleDeleteConfig = async (id: string, name: string) => {
    askConfirmation(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir permanentemente o programa "${name}"? Esta ação não pode ser desfeita.`,
      async () => {
        setIsDeleting(id);
        try {
          await deleteDoc(doc(db, 'configs', id));
          showToast('Programa excluído com sucesso.', "success");
        } catch (error) {
          console.error('Error deleting config:', error);
          showToast('Erro ao excluir programa. Verifique suas permissões.', "error");
        } finally {
          setIsDeleting(null);
        }
      },
      true
    );
  };

  if (loading) return <div className="p-8 text-center text-white">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Códigos de Resgate</h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código Atual</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {configs.map((config: any) => (
              <tr key={config.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                      {(config.companyProfile?.logoURL || config.companyProfile?.photoURL) ? (
                        <img src={config.companyProfile?.logoURL || config.companyProfile?.photoURL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Trophy className="text-green-500" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold">{config.companyProfile?.companyName || 'Sem Nome'}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{config.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingId === config.id ? (
                    <input 
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white font-mono outline-none focus:border-primary"
                    />
                  ) : (
                    <span className="text-primary font-mono font-black text-lg tracking-widest">{config.redemptionCode || '---'}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {editingId === config.id ? (
                      <>
                        <button onClick={() => handleUpdateCode(config.id)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                          <Check size={16} />
                        </button>
                        <button onClick={() => { setEditingId(null); setNewCode(''); }} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { 
                            // This would ideally open a modal to edit the client profile
                            // For now, let's use the existing impersonation logic or similar
                            localStorage.setItem('impersonatedClientId', config.id);
                            window.location.reload();
                          }} 
                          className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                          title="Editar Cliente"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                          <button 
                            onClick={() => toggleLock(config.id)}
                            className={cn(
                              "p-2 transition-all",
                              unlockedCodes.has(config.id) ? "text-green-500 bg-green-500/10" : "text-gray-500 hover:text-white"
                            )}
                            title={unlockedCodes.has(config.id) ? "Bloquear Geração" : "Desbloquear Geração"}
                          >
                            {unlockedCodes.has(config.id) ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (!unlockedCodes.has(config.id)) return;
                              const generated = generateRedemptionCode();
                              updateDoc(doc(db, 'configs', config.id), { redemptionCode: generated });
                              toggleLock(config.id); // Re-lock after generation
                            }} 
                            disabled={!unlockedCodes.has(config.id)}
                            className={cn(
                              "p-2 transition-all border-l border-white/10",
                              unlockedCodes.has(config.id) ? "text-white hover:bg-white/10" : "text-gray-700 cursor-not-allowed"
                            )}
                            title="Gerar Aleatório"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>

                        <button 
                          onClick={() => handleDeleteConfig(config.id, config.companyProfile?.companyName || 'Sem nome')}
                          disabled={isDeleting === config.id}
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Excluir Programa"
                        >
                          {isDeleting === config.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DEFAULT_RULES: LoyaltyRule = {
  campaignName: 'PROGRAMA DE FIDELIDADE',
  purchasesForPrize: 10,
  minPurchaseValue: 0,
  maxDaysBetweenPurchases: 30,
  pointsPerReal: 1,
  pointsExpiryDays: 365,
  welcomeMessage: 'Olá! Você acaba de entrar para o nosso programa de fidelidade. Acumule pontos e troque por prêmios incríveis!',
  rewardTiers: [{ points: 10, prize: 'Prêmio Padrão' }],
  allowedUserTabs: ['score', 'reports'],
  themeColor: '#000000',
  rewardMode: 'points',
  cashbackConfig: {
    percentage: 5,
    minActivationValue: 0,
    minRedeemDays: 0,
    expiryDays: 90
  },
  pointsStatus: { status: 'active', validityType: 'indeterminate' },
  cashbackStatus: { status: 'ended', validityType: 'indeterminate' },
  currentAvgTicket: 0,
  currentMonthlyRevenue: 0,
  onboardingComplete: false,
  companyProfile: {
    companyName: 'SUA EMPRESA',
    tradingName: 'NOME FANTASIA',
    cnpj: '',
    phone: '',
    address: '',
    responsible: '',
    contactPhone: '',
    subscriptionType: 'monthly'
  },
  seasonalDates: [
    // Nacionais (Google Calendar - Feriados no Brasil)
    { id: '1', name: 'Confraternização Universal', date: '2026-01-01', type: 'national' },
    { id: '2', name: 'Carnaval', date: '2026-02-16', type: 'national' },
    { id: '3', name: 'Carnaval', date: '2026-02-17', type: 'national' },
    { id: '4', name: 'Quarta-feira de Cinzas', date: '2026-02-18', type: 'national' },
    { id: '5', name: 'Sexta-feira Santa', date: '2026-04-03', type: 'national' },
    { id: '6', name: 'Páscoa', date: '2026-04-05', type: 'national' },
    { id: '7', name: 'Tiradentes', date: '2026-04-21', type: 'national' },
    { id: '8', name: 'Dia do Trabalhador', date: '2026-05-01', type: 'national' },
    { id: '9', name: 'Corpus Christi', date: '2026-06-04', type: 'national' },
    { id: '10', name: 'Independência do Brasil', date: '2026-09-07', type: 'national' },
    { id: '11', name: 'Nossa Senhora Aparecida', date: '2026-10-12', type: 'national' },
    { id: '12', name: 'Finados', date: '2026-11-02', type: 'national' },
    { id: '13', name: 'Proclamação da República', date: '2026-11-15', type: 'national' },
    { id: '14', name: 'Dia da Consciência Negra', date: '2026-11-20', type: 'national' },
    { id: '15', name: 'Natal', date: '2026-12-25', type: 'national' },
    
    // Estaduais (Exemplos)
    { id: '16', name: 'Revolução Constitucionalista', date: '2026-07-09', type: 'state', state: 'SP' },
    { id: '17', name: 'Data Magna de Pernambuco', date: '2026-03-06', type: 'state', state: 'PE' },
    { id: '18', name: 'Revolução Farroupilha', date: '2026-09-20', type: 'state', state: 'RS' },
    { id: '19', name: 'Independência da Bahia', date: '2026-07-02', type: 'state', state: 'BA' },
    
    // Municipais (Exemplos)
    { id: '20', name: 'Aniversário de São Paulo', date: '2026-01-25', type: 'municipal', state: 'SP', city: 'São Paulo' },
    { id: '21', name: 'São Sebastião', date: '2026-01-20', type: 'municipal', state: 'RJ', city: 'Rio de Janeiro' },
    { id: '22', name: 'Nossa Senhora da Conceição', date: '2026-12-08', type: 'municipal', state: 'PE', city: 'Recife' },
    { id: '23', name: 'Assunção de Nossa Senhora', date: '2026-08-15', type: 'municipal', state: 'MG', city: 'Belo Horizonte' },
    
    // Personalizadas
    { id: '24', name: 'Semana do Consumidor', date: '2026-03-15', type: 'custom' },
    { id: '25', name: 'Dia do Cliente', date: '2026-09-15', type: 'custom' },
    { id: '26', name: 'Black Friday', date: '2026-11-27', type: 'custom' },
    { id: '27', name: 'Aniversário da Loja', date: '2026-10-01', type: 'custom' }
  ],
  extraPointsThreshold: 0,
  extraPointsAmount: 0,
  lifeExpectancy: 75,
  aiPrompt: 'Você é um consultor estratégico de negócios. Analise os dados fornecidos e forneça um diagnóstico detalhado, riscos, oportunidades e recomendações práticas para o crescimento da empresa.'
};

const APP_LOGO = "https://lh3.googleusercontent.com/d/1ZhXnY35i4ewk-duviq6ilIMGmDhzy0Ui";
const FALLBACK_LOGO = "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop";
const LOGIN_BG_IMAGE = "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2070&auto=format&fit=crop";
const SUPER_ADMIN_CNPJ = "40.732.831/0001-72";
const SUPER_ADMIN_PASS = "Admin01";
const SUPER_ADMIN_EMAIL = "fidelidade@sliceshare.com.br";

// Components
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  isDanger = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText?: string; 
  cancelText?: string;
  isDanger?: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-white font-bold transition-colors",
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; key?: any; onClick?: () => void }) => (
  <div 
    onClick={onClick} 
    className={cn(
      "bg-white rounded-xl shadow-sm relative overflow-hidden border-gradient-green",
      className
    )}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className, 
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
    secondary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder,
  required = false,
  min
}: { 
  label: string; 
  value: string | number; 
  onChange: (val: any) => void; 
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
    />
  </div>
);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Check for quota exceeded
  if (errorMessage.includes("Quota exceeded") || errorMessage.includes("quota limit exceeded") || errorMessage.includes("resource-exhausted")) {
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: errInfo }));
  }

  // We still throw to stop execution, but the event will trigger the UI
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isQuotaError = false;

      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error) {
          if (parsed.error.includes("Missing or insufficient permissions")) {
            errorMessage = "Você não tem permissão para acessar estes dados. Verifique se seu cadastro foi aprovado.";
          } else if (parsed.error.includes("Quota exceeded") || parsed.error.includes("quota limit exceeded")) {
            errorMessage = "O limite de uso gratuito do banco de dados foi atingido para hoje. O sistema voltará a funcionar automaticamente em breve (geralmente à meia-noite).";
            isQuotaError = true;
          }
        }
      } catch (e) {
        if ((this as any).state.error.message?.includes("Quota exceeded")) {
          errorMessage = "Limite de cota excedido. Por favor, tente novamente mais tarde.";
          isQuotaError = true;
        }
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isQuotaError ? "Limite de Acesso Atingido" : "Ops! Algo deu errado."}
            </h1>
            <p className="text-gray-600">{errorMessage}</p>
            {!isQuotaError && (
              <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
                Recarregar Página
              </Button>
            )}
            {isQuotaError && (
              <p className="text-sm text-gray-400 mt-8">
                Este é um limite do plano gratuito do Firebase. Se você é o proprietário, considere fazer o upgrade para o plano Blaze.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

import ConsumerApp from './components/ConsumerApp';

function FloatingWhatsApp({ isAdminArea = false }: { isAdminArea?: boolean }) {
  if (isAdminArea) return null;
  
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 group">
      <div className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-green-500/20">
        Suporte Técnico
      </div>
      <a 
        href="https://wa.me/552140421034?text=Gostaria%20de%20uma%20ajuda%20com%20o%20sistema%20de%20gest%C3%A3o%20de%20clientes%20e%20neg%C3%B3cios."
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center justify-center"
        title="Suporte WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const generateRedemptionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'business' | 'consumer'>('business');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'score' | 'customers' | 'rewarded_customers' | 'rewards' | 'seasonal_dates' | 'ltv' | 'goals' | 'promotion' | 'reset' | 'admin' | 'company_profile' | 'plans' | 'super_admin_profile' | 'super_admin_management' | 'painel_master' | 'notificar' | 'redemption_codes'>('dashboard');
  const { toast, showToast, hideToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void, isDanger = false, confirmText = "Confirmar", cancelText = "Cancelar") => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isDanger,
      confirmText,
      cancelText
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'consumer') {
      setMode('consumer');
    }
  }, []);
  const [contractCancelled, setContractCancelled] = useState(false);
  const [rules, setRules] = useState<LoyaltyRule>(DEFAULT_RULES);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allClients, setAllClients] = useState<AppUser[]>([]);
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [isSuperAdminPanelActive, setIsSuperAdminPanelActive] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('firestore-quota-exceeded', handler);
    return () => window.removeEventListener('firestore-quota-exceeded', handler);
  }, []);

  const isAdminUser = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user?.email?.toLowerCase() === 'fvmoreira2011@gmail.com' || appUser?.role === 'admin' || appUser?.role === 'superadmin';
  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user?.email?.toLowerCase() === 'fvmoreira2011@gmail.com' || appUser?.role === 'superadmin';
  const isOnboarding = rules.onboardingComplete === false && !isSuperAdmin; 

  useEffect(() => {
    if (isAuthReady && isSuperAdmin && activeTab === 'dashboard') {
      setActiveTab('super_admin_profile');
    } else if (isAuthReady && !isSuperAdmin && !isOnboarding && (activeTab === 'super_admin_profile' || activeTab === 'super_admin_management' || activeTab === 'painel_master')) {
      setActiveTab('dashboard');
    }
  }, [isAuthReady, isSuperAdmin, activeTab, isOnboarding]);

  useEffect(() => {
    if (isSuperAdmin) {
      const q = query(collection(db, 'users'), where('isClient', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const clients = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
        setAllClients(clients);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
      return () => unsubscribe();
    }
  }, [isSuperAdmin]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // Set initial selectedCompanyId
  useEffect(() => {
    const impersonatedId = localStorage.getItem('impersonatedClientId');
    if (impersonatedId) {
      setSelectedCompanyId(impersonatedId);
    } else if (appUser) {
      setSelectedCompanyId(appUser.uid);
    }
  }, [appUser]);

  const isUserOnly = appUser?.role === 'user';
  const allowedTabs = ['dashboard', ...(rules.allowedUserTabs || [])];
  const [onboardingTour, setOnboardingTour] = useState<'welcome' | 'profile' | 'goals' | 'reference_data_ticket' | 'reference_data_revenue' | 'finished' | null>(null);

  useEffect(() => {
    if (isOnboarding && !onboardingTour) {
      setOnboardingTour('welcome');
    }
  }, [isOnboarding, onboardingTour]);

  // Enforcement: Force active tab based on onboarding step
  useEffect(() => {
    if (isOnboarding && onboardingTour) {
      if (onboardingTour === 'profile' && activeTab !== 'super_admin_profile') {
        setActiveTab('super_admin_profile');
      } else if ((onboardingTour === 'goals' || onboardingTour === 'reference_data_ticket' || onboardingTour === 'reference_data_revenue') && activeTab !== 'goals') {
        setActiveTab('goals');
      } else if (onboardingTour === 'rewards' && activeTab !== 'rewards') {
        setActiveTab('rewards');
      }
    }
  }, [isOnboarding, onboardingTour, activeTab]);

  const handleTabChange = (tab: any) => {
    if (isOnboarding) {
      // If onboarding is active, strongly restrict navigation
      if (onboardingTour === 'welcome') return;
      
      if (onboardingTour === 'profile' && tab !== 'super_admin_profile') {
        showToast("Por favor, preencha seu perfil para continuar o passo a passo obrigatório.", "warning");
        return;
      }
      if (onboardingTour === 'goals' && tab !== 'goals') {
        showToast("Por favor, preencha as metas de 12 meses para continuar o passo a passo obrigatório.", "warning");
        return;
      }
      
      // Allow specific transitions between onboarding tabs
      if (onboardingTour === 'profile' && tab === 'super_admin_profile') { setActiveTab(tab); return; }
      if (onboardingTour === 'goals' && tab === 'goals') { setActiveTab(tab); return; }
      if (onboardingTour === 'finished') { setActiveTab(tab); return; }

      // If they are in middle of onboarding, they can't just switch to dashboard
      if (onboardingTour && tab !== 'super_admin_profile' && tab !== 'goals') {
        showToast("O preenchimento da configuração inicial é obrigatório.", "warning");
        return;
      }
    }
    if (isUserOnly && !allowedTabs.includes(tab)) {
      showToast("Peça acesso ao administrador para acessar esta aba.", "warning");
      return;
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const prevUserRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (user && !prevUserRef.current) {
      if (!isSuperAdmin) {
        setActiveTab('dashboard');
      }
    }
    prevUserRef.current = user?.uid || null;
  }, [user, isSuperAdmin]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setAppUser(null);
        setSelectedCompanyId(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time User Data Listener
  useEffect(() => {
    if (!user) return;

    const unsubscribeUserDoc = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        setAppUser({ ...snapshot.data(), uid: user.uid } as AppUser);
        setLoading(false);
        setIsAuthReady(true);
      } else {
        // Fallback logic if doc doesn't exist yet (migration/auto-creation)
        try {
          // First try to fetch by document ID (preferred)
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            setAppUser({ ...userDoc.data(), uid: user.uid } as AppUser);
          } else {
            // Fallback 1: search by authUid field (for accounts not yet migrated)
            const q1 = query(collection(db, 'users'), where('authUid', '==', user.uid));
            const snap1 = await getDocs(q1);
            
            if (!snap1.empty) {
              const docData = snap1.docs[0].data();
              const userData = { ...docData, uid: user.uid } as AppUser;
              setAppUser(userData);
              // Migrate to UID-based document ID
              await setDoc(doc(db, 'users', user.uid), docData);
              await deleteDoc(doc(db, 'users', snap1.docs[0].id));
            } else {
              // Fallback 2: search by email (for pre-registered accounts)
              const q2 = query(collection(db, 'users'), where('email', '==', user.email));
              const snap2 = await getDocs(q2);

              if (!snap2.empty) {
                const docData = snap2.docs[0].data();
                const userData = { ...docData, uid: user.uid, authUid: user.uid } as AppUser;
                setAppUser(userData);
                // Link to UID
                await setDoc(doc(db, 'users', user.uid), userData);
                if (snap2.docs[0].id !== user.uid) {
                  await deleteDoc(doc(db, 'users', snap2.docs[0].id));
                }
              } else {
                // If admin email, auto-create as approved admin
                const isMasterAdmin = user.email?.toLowerCase() === 'fvmoreira2011@gmail.com' || user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                const isSuper = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                
                const newUser = {
                  authUid: user.uid,
                  email: user.email || '',
                  approved: isMasterAdmin,
                  role: isSuper ? 'superadmin' : (isMasterAdmin ? 'admin' : 'user'),
                  createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', user.uid), newUser);
                setAppUser({ ...newUser, uid: user.uid } as AppUser);
              }
            }
          }
        } catch (error: any) {
          console.error("Error in user doc fallback:", error);
          if (error.message?.includes("Quota exceeded") || error.message?.includes("resource-exhausted")) {
            window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
          }
        } finally {
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribeUserDoc();
  }, [user?.uid]);

  const handleLogout = async () => {
    localStorage.removeItem('impersonatedClientId');
    setActiveTab('dashboard');
    await signOut(auth);
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem('impersonatedClientId');
    window.location.reload();
  };

  useEffect(() => {
    const impersonatedId = localStorage.getItem('impersonatedClientId');
    if (impersonatedId && allClients.length > 0) {
      const client = allClients.find(c => c.uid === impersonatedId);
      if (client) {
        // No longer using identifiedCompany
      }
    }
  }, [allClients]);

  // Connection Test
  useEffect(() => {
    if (isAuthReady && user && appUser?.approved) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
    }
  }, [isAuthReady, user]);

  // Data Listeners
  useEffect(() => {
    if (!user || (!appUser?.approved && !isAdminUser) || !selectedCompanyId) return;

    const companyId = selectedCompanyId;

    // Rules
    const unsubRules = onSnapshot(doc(db, 'configs', companyId), (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as LoyaltyRule;
        
        // Check for missing redemption code and generate if admin
        if (!data.redemptionCode && isAdminUser) {
          const newCode = generateRedemptionCode();
          updateDoc(snapshot.ref, { redemptionCode: newCode });
          return; // Let the next snapshot handle it
        }

        // Auto-merge national holidays from Google Calendar defaults if missing
        const currentDates = data.seasonalDates || [];
        const nationalDefaults = DEFAULT_RULES.seasonalDates?.filter(d => d.type === 'national') || [];
        const missingNationals = nationalDefaults.filter(nd => 
          !currentDates.some(cd => cd.name === nd.name && cd.date === nd.date)
        );

        if (missingNationals.length > 0 && isAdminUser) {
          const updatedDates = [...currentDates, ...missingNationals].sort((a, b) => a.date.localeCompare(b.date));
          updateDoc(snapshot.ref, { seasonalDates: updatedDates });
          return; // Let the next snapshot handle it
        }
        
        setRules(data);
      } else if (isAdminUser) {
        // Initialize default rules if not exist
        const initialRules = { 
          ...DEFAULT_RULES, 
          companyId,
          redemptionCode: generateRedemptionCode()
        };
        setDoc(snapshot.ref, initialRules).catch(err => handleFirestoreError(err, OperationType.WRITE, `configs/${companyId}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `configs/${companyId}`));

    // Customers
    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), where('companyId', '==', companyId)), (snapshot) => {
      const custs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(custs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'customers'));

    // Purchases
    const unsubPurchases = onSnapshot(
      query(collection(db, 'purchases'), where('companyId', '==', companyId), orderBy('date', 'desc'), limit(100)), 
      (snapshot) => {
        const purcs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Purchase));
        setPurchases(purcs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'purchases')
    );

    // Redemptions
    const unsubRedemptions = onSnapshot(
      query(collection(db, 'redemptions'), where('companyId', '==', companyId), orderBy('date', 'desc')),
      (snapshot) => {
        const reds = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Redemption));
        setRedemptions(reds);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'redemptions')
    );

    // Goals
    const unsubGoals = onSnapshot(
      query(collection(db, 'goals'), where('companyId', '==', companyId)),
      (snapshot) => {
        const g = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
        setGoals(g);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'goals')
    );

    return () => {
      unsubRules();
      unsubCustomers();
      unsubPurchases();
      unsubRedemptions();
      unsubGoals();
      // Reset states to prevent data leakage between clients
      setRules(DEFAULT_RULES);
      setCustomers([]);
      setPurchases([]);
      setRedemptions([]);
      setGoals([]);
    };
  }, [user?.uid, appUser?.approved, isAdminUser, selectedCompanyId]);

  const handleUpdateRules = async (newRules: LoyaltyRule) => {
    if (!selectedCompanyId) return;
    try {
      await setDoc(doc(db, 'configs', selectedCompanyId), newRules);
    } catch (error) {
      console.error("Error updating rules:", error);
      showToast("Erro ao atualizar configurações.", "error");
    }
  };

  // Logic to check expiration
  const customersRef = React.useRef(customers);
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  useEffect(() => {
    if (!rules.maxDaysBetweenPurchases || !selectedCompanyId) return;

    const checkExpirations = async () => {
      const now = new Date();
      const currentCustomers = customersRef.current;
      
      for (const customer of currentCustomers) {
        if (customer.points > 0 || (customer.cashbackBalance && customer.cashbackBalance > 0)) {
          const lastDate = parseISO(customer.lastPurchaseDate);
          const daysSince = differenceInDays(now, lastDate);
          
          if (daysSince > rules.maxDaysBetweenPurchases) {
            // Reset both if expired
            try {
              await updateDoc(doc(db, 'customers', customer.id), {
                points: 0,
                cashbackBalance: 0
              });
            } catch (error) {
              console.error("Error resetting balances for customer:", customer.id, error);
            }
          }
        }
      }
    };

    const interval = setInterval(checkExpirations, 1000 * 60 * 60); // Check every hour
    checkExpirations();
    return () => clearInterval(interval);
  }, [rules.maxDaysBetweenPurchases, selectedCompanyId]);

  const renderContent = () => {
    if (quotaExceeded) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="text-amber-500" size={40} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              ESTAMOS PASSANDO POR MANUTENÇÃO
            </h1>
            <p className="text-gray-400 leading-relaxed">
              EM BREVE VOCÊ PODERÁ ACESSAR O APLICATIVO.
            </p>
          </div>
        </div>
      );
    }

    if (contractCancelled) {
      return <ContractCancelledScreen />;
    }

    if (loading || !isAuthReady || (user && !appUser)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-black uppercase tracking-widest text-xs animate-pulse">
              Carregando Sistema...
            </p>
          </div>
        </div>
      );
    }

    if (mode === 'consumer') {
      return <ConsumerApp />;
    }

    if (!user) {
      return <LoginScreen />;
    }

    if (isSuperAdminPanelActive) {
      return <SuperAdminPanel onBack={() => setIsSuperAdminPanelActive(false)} isSuperAdmin={isSuperAdmin} appUser={appUser!} />;
    }

    if (appUser && !appUser.approved && !isAdminUser) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-white text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
            <img 
              src={APP_LOGO} 
              alt="Logo" 
              className="mx-auto w-48 h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
            <h1 className="text-2xl font-bold">Aguardando Aprovação</h1>
            <p className="text-gray-400">
              Seu cadastro foi realizado com sucesso. <br />
              Aguarde a aprovação do administrador para acessar o sistema.
            </p>
            <Button onClick={handleLogout} variant="outline" className="text-white border-white hover:bg-white/10">
              Sair
            </Button>
          </motion.div>
        </div>
      );
    }

    const currentLogo = isSuperAdmin ? (appUser?.photoURL || `https://ui-avatars.com/api/?name=${appUser?.displayName || user.email}&background=random`) : (appUser?.logoURL || rules.companyProfile?.photoURL || APP_LOGO);
    const currentCompanyName = isSuperAdmin ? (appUser?.displayName || 'Administrador') : (appUser?.companyName || rules.companyProfile?.companyName || rules.campaignName || 'PROGRAMA DE FIDELIDADE');
    const currentThemeColor = appUser?.themeColor || rules.themeColor || '#000000';
    const currentSecondaryColor = appUser?.secondaryColor || '#ffffff';

    const themeStyle = {
      '--primary-color': currentThemeColor,
      '--tw-color-primary': currentThemeColor,
      '--secondary-color': currentSecondaryColor,
      '--active-tab-color': '#22c55e', // Green-500
    } as React.CSSProperties;

    return (
      <div className={cn("min-h-screen flex flex-col lg:flex-row shadow-inner", isSuperAdminPanelActive ? "bg-black text-white" : "bg-white text-gray-900")} style={themeStyle}>
        
        {/* Onboarding Overlay */}
        <AnimatePresence>
          {onboardingTour === 'welcome' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-2xl space-y-8">
                <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 rotate-3">
                  <CheckCircle2 size={48} className="text-white" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Bem-vindo à sua plataforma de gestão de clientes</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Você precisa configurar algumas informações como usuários do sistema, metas mês a mês, 
                    vendas dos últimos 12 meses em moeda, ticket médio dos últimos 12 meses e tipo de premiação - pontos ou cashback.
                  </p>
                  <p className="text-green-500 font-bold uppercase tracking-widest text-sm">
                    Isso deve levar cerca de 20 minutos. Você tem todas essas informações?
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button 
                    onClick={handleLogout}
                    className="flex-1 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all order-2 sm:order-1"
                  >
                    Sair e Configurar Depois
                  </button>
                  <button 
                    onClick={() => {
                      setOnboardingTour('profile');
                      setActiveTab('super_admin_profile');
                    }}
                    className="flex-1 bg-green-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-white shadow-2xl shadow-green-600/30 hover:bg-green-700 transition-all active:scale-95 order-1 sm:order-2"
                  >
                    Iniciar Configuração Obrigatória
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {onboardingTour === 'finished' && (
             <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-md space-y-8">
                <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 animate-bounce">
                  <Trophy size={48} className="text-white" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Parabéns!</h1>
                  <p className="text-gray-400 text-lg">
                    Tudo pronto para você começar a gerenciar seus clientes.
                  </p>
                </div>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'configs', selectedCompanyId!), { onboardingComplete: true });
                    setOnboardingTour(null);
                    setActiveTab('dashboard');
                  }}
                  className="w-full bg-green-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-white"
                >
                  Começar Agora
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar for Desktop */}
      <aside className={cn("hidden lg:flex flex-col w-72 sticky top-0 h-screen p-6 z-20 bg-black border-r border-white/10")}>
        <div className="flex items-center gap-4 mb-10 w-full px-2">
          <div className={cn("w-14 h-14 overflow-hidden shadow-lg rounded-full border-2 border-white/10 shrink-0")}>
            <img 
              src={currentLogo} 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
          </div>
          <div className="text-left min-w-0">
            <h1 className={cn("text-sm font-bold uppercase tracking-tight leading-tight text-white truncate")}>
              {currentCompanyName}
            </h1>
            {!isSuperAdmin && (
              <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1 truncate">
                {rules.campaignName}
              </p>
            )}
            {!isSuperAdmin && (
              <button 
                onClick={() => handleTabChange('company_profile')}
                disabled={isOnboarding}
                className={cn(
                  "mt-2 text-[10px] font-bold uppercase tracking-tighter block",
                  isOnboarding ? "text-gray-700 cursor-not-allowed" : "text-gray-500 hover:text-white hover:underline"
                )}
              >
                CONFIGURAÇÃO
              </button>
            )}
          </div>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 w-full items-start">
          {isSuperAdmin ? (
            <>
              <SidebarButton active={activeTab === 'super_admin_profile'} onClick={() => handleTabChange('super_admin_profile')} icon={<UserCircle size={20} />} label="Meu Perfil" isSuperAdmin={true} />
              <SidebarButton active={activeTab === 'super_admin_management'} onClick={() => handleTabChange('super_admin_management')} icon={<ShieldCheck size={20} />} label="Gestão Admins" isSuperAdmin={true} />
              <SidebarButton active={activeTab === 'redemption_codes'} onClick={() => handleTabChange('redemption_codes')} icon={<Key size={20} />} label="Códigos Resgate" isSuperAdmin={true} />
              <SidebarButton active={activeTab === 'painel_master'} onClick={() => handleTabChange('painel_master')} icon={<Users size={20} />} label="Gestão de clientes" isSuperAdmin={true} />
            </>
          ) : (
            <>
              <SidebarButton active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} icon={<FileText size={20} />} label="Dashboard" disabled={isOnboarding} />
              <SidebarButton active={activeTab === 'goals'} onClick={() => handleTabChange('goals')} icon={<Target size={20} />} label="Metas Gerais" disabled={isOnboarding && onboardingTour !== 'goals'} />
              {(!isUserOnly || allowedTabs.includes('customers')) && (
                <SidebarButton active={activeTab === 'customers'} onClick={() => handleTabChange('customers')} icon={<Users size={20} />} label="Clientes" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('score')) && (
                <SidebarButton active={activeTab === 'score'} onClick={() => handleTabChange('score')} icon={<PlusCircle size={20} />} label="Pontuar" disabled={isOnboarding} />
              )}
              <SidebarButton active={activeTab === 'notificar'} onClick={() => handleTabChange('notificar')} icon={<Bell size={20} />} label="Notificar" disabled={isOnboarding} />
              {(!isUserOnly || allowedTabs.includes('rewarded_customers')) && (
                <SidebarButton active={activeTab === 'rewarded_customers'} onClick={() => handleTabChange('rewarded_customers')} icon={<Award size={20} />} label="Premiados" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('rewards')) && (
                <SidebarButton active={activeTab === 'rewards'} onClick={() => handleTabChange('rewards')} icon={<Trophy size={20} />} label="Premiação" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('seasonal_dates')) && (
                <SidebarButton active={activeTab === 'seasonal_dates'} onClick={() => handleTabChange('seasonal_dates')} icon={<Calendar size={20} />} label="Datas Sazonais" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('ltv')) && (
                <SidebarButton active={activeTab === 'ltv'} onClick={() => handleTabChange('ltv')} icon={<TrendingUp size={20} />} label="LTV" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('promotion')) && (
                <SidebarButton active={activeTab === 'promotion'} onClick={() => handleTabChange('promotion')} icon={<MessageSquare size={20} />} label="Envio WhatsApp" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('strategic_analysis')) && (
                <SidebarButton active={activeTab === 'strategic_analysis'} onClick={() => handleTabChange('strategic_analysis')} icon={<BarChart3 size={20} />} label="Análise Estratégica" disabled={isOnboarding} />
              )}
              {isAdminUser && (
                <>
                  <SidebarButton active={activeTab === 'reset'} onClick={() => handleTabChange('reset')} icon={<RotateCcw size={20} />} label="Zerar Sistema" disabled={isOnboarding} />
                </>
              )}
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={cn("hidden lg:flex px-8 py-4 items-center justify-end sticky top-0 z-10 bg-white border-b border-gray-100")}>
          <div className="flex items-center gap-6">
            {localStorage.getItem('impersonatedClientId') && (
              <Button 
                onClick={handleExitImpersonation} 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-8 border-red-500/50 text-red-500 hover:bg-red-500/10 px-3"
              >
                Sair do Sistema do Cliente
              </Button>
            )}
            <div className="flex items-center gap-4 py-1 px-4 bg-gray-50 rounded-2xl border border-gray-100">
              {!isSuperAdmin && (
                <button 
                  onClick={() => setShowQRCodeModal(true)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all flex items-center gap-2"
                  title="Gerar QR Code do WebApp"
                >
                  <QrCode size={20} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">QR Code</span>
                </button>
              )}
              <div className="w-px h-8 bg-gray-200 mx-1" />
              <div className="text-right">
                <p className={cn("text-sm font-black leading-tight text-gray-900")}>
                  {appUser?.displayName || user.displayName || 'Usuário'}
                </p>
                <p className={cn("text-[10px] font-bold text-gray-500")}>
                  {appUser?.email || user.email}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 shadow-sm">
                <img 
                  src={appUser?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all" title="Sair">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        {/* Mobile Header with Hamburger */}
        <header className={cn("lg:hidden px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-black border-b border-white/10")}>
          <div className="flex items-center gap-3">
            <img 
              src={currentLogo} 
              alt="Logo" 
              className={cn("w-10 h-10 object-contain rounded-full")}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
            <h1 className={cn("text-xs font-bold uppercase tracking-wider text-white")}>
              {currentCompanyName}
            </h1>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn("p-2 rounded-lg flex items-center gap-2", isSuperAdmin ? "text-gray-900 bg-gray-100" : "text-white bg-gray-800")}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="lg:hidden fixed inset-0 bg-gray-900 z-40 p-6 pt-24 overflow-y-auto"
            >
              <nav className="flex flex-col gap-4" translate="no">
                {isSuperAdmin ? (
                  <>
                    <SidebarButton active={activeTab === 'super_admin_profile'} onClick={() => { handleTabChange('super_admin_profile'); setIsMobileMenuOpen(false); }} icon={<UserCircle size={20} />} label="Meu Perfil" isSuperAdmin={true} />
                    <SidebarButton active={activeTab === 'super_admin_management'} onClick={() => { handleTabChange('super_admin_management'); setIsMobileMenuOpen(false); }} icon={<ShieldCheck size={20} />} label="Gestão Admins" isSuperAdmin={true} />
                    <SidebarButton active={activeTab === 'painel_master'} onClick={() => { handleTabChange('painel_master'); setIsMobileMenuOpen(false); }} icon={<Users size={20} />} label="Gestão de clientes" isSuperAdmin={true} />
                  </>
                ) : (
                  <>
                    <SidebarButton active={activeTab === 'dashboard'} onClick={() => { handleTabChange('dashboard'); setIsMobileMenuOpen(false); }} icon={<FileText size={20} />} label="Dashboard" />
                    <SidebarButton active={activeTab === 'goals'} onClick={() => { handleTabChange('goals'); setIsMobileMenuOpen(false); }} icon={<Target size={20} />} label="Metas Gerais" />
                    <SidebarButton active={activeTab === 'strategic_analysis'} onClick={() => { handleTabChange('strategic_analysis'); setIsMobileMenuOpen(false); }} icon={<BarChart3 size={20} />} label="Análise Estratégica" />
                    <SidebarButton active={activeTab === 'customers'} onClick={() => { handleTabChange('customers'); setIsMobileMenuOpen(false); }} icon={<Users size={20} />} label="Clientes" />
                    <SidebarButton active={activeTab === 'score'} onClick={() => { handleTabChange('score'); setIsMobileMenuOpen(false); }} icon={<PlusCircle size={20} />} label="Pontuar" />
                    <SidebarButton active={activeTab === 'notificar'} onClick={() => { handleTabChange('notificar'); setIsMobileMenuOpen(false); }} icon={<Bell size={20} />} label="Notificar" />
                    <SidebarButton active={activeTab === 'rewarded_customers'} onClick={() => { handleTabChange('rewarded_customers'); setIsMobileMenuOpen(false); }} icon={<Award size={20} />} label="Premiados" />
                    <SidebarButton active={activeTab === 'rewards'} onClick={() => { handleTabChange('rewards'); setIsMobileMenuOpen(false); }} icon={<Trophy size={20} />} label="Premiação" />
                    <SidebarButton active={activeTab === 'seasonal_dates'} onClick={() => { handleTabChange('seasonal_dates'); setIsMobileMenuOpen(false); }} icon={<Calendar size={20} />} label="Datas Sazonais" />
                    <SidebarButton active={activeTab === 'ltv'} onClick={() => { handleTabChange('ltv'); setIsMobileMenuOpen(false); }} icon={<TrendingUp size={20} />} label="LTV" />
                    <SidebarButton active={activeTab === 'promotion'} onClick={() => { handleTabChange('promotion'); setIsMobileMenuOpen(false); }} icon={<MessageSquare size={20} />} label="Envio WhatsApp" />
                    {isAdminUser && (
                      <SidebarButton active={activeTab === 'reset'} onClick={() => { handleTabChange('reset'); setIsMobileMenuOpen(false); }} icon={<RotateCcw size={20} />} label="Zerar Sistema" />
                    )}
                  </>
                )}
                {isSuperAdmin && (
                  <SidebarButton 
                    active={isSuperAdminPanelActive} 
                    onClick={() => { setIsSuperAdminPanelActive(true); setIsMobileMenuOpen(false); }} 
                    icon={<ShieldCheck size={20} />} 
                    label="Painel Master" 
                  />
                )}
                <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                      <img 
                        src={appUser?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold">{appUser?.displayName || user.displayName || 'Administrador'}</p>
                      <p className="text-xs text-gray-500 font-medium">{appUser?.email || user.email}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 font-bold py-4">
                    <LogOut size={20} />
                    Sair do Sistema
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {isOnboarding && onboardingTour !== 'welcome' && onboardingTour !== 'finished' && (
            <div className="mb-8 p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-black" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-amber-500 uppercase tracking-tight">O preenchimento é obrigatório</h3>
                  <p className="text-sm text-gray-400 font-medium">Você precisa concluir todas as etapas de configuração para liberar as funcionalidades do sistema.</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Status do Setup</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((s, i) => {
                    const steps: typeof onboardingTour[] = ['profile', 'goals', 'reference_data_ticket', 'reference_data_revenue', 'finished'];
                    const currentIndex = steps.indexOf(onboardingTour);
                    const isActive = i <= currentIndex;
                    return (
                      <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all", isActive ? "bg-amber-500" : "bg-gray-800")} />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && !isSuperAdmin && <div key="dashboard"><DashboardTab purchases={purchases} customers={customers} rules={rules} goals={goals} appUser={appUser} /></div>}
            {activeTab === 'notificar' && !isSuperAdmin && <div key="notificar"><NotifyTab customers={customers} rules={rules} companyId={selectedCompanyId} /></div>}
            {activeTab === 'customers' && !isSuperAdmin && <div key="customers"><CustomersTab customers={customers} purchases={purchases} isAdmin={isAdminUser} rules={rules} companyId={selectedCompanyId} /></div>}
            {activeTab === 'rewarded_customers' && !isSuperAdmin && <div key="rewarded_customers"><RewardedCustomersTab customers={customers} rules={rules} /></div>}
            {activeTab === 'rewards' && !isSuperAdmin && (
              <div key="rewards">
                <RewardsTab 
                  rules={rules} 
                  goals={goals}
                  customers={customers}
                  isAdmin={isAdminUser} 
                  onUpdateRules={handleUpdateRules} 
                  onboardingMode={onboardingTour === 'rewards'}
                  onOnboardingFinish={() => setOnboardingTour('finished')}
                  companyId={selectedCompanyId}
                />
              </div>
            )}
            {activeTab === 'seasonal_dates' && !isSuperAdmin && <div key="seasonal_dates"><SeasonalDatesTab rules={rules} isAdmin={isAdminUser} onTabChange={handleTabChange} onUpdateRules={handleUpdateRules} /></div>}
            {activeTab === 'ltv' && !isSuperAdmin && <div key="ltv"><LTVTab purchases={purchases} customers={customers} rules={rules} isAdmin={isAdminUser} onUpdateRules={handleUpdateRules} /></div>}
            {activeTab === 'goals' && !isSuperAdmin && (
              <div key="goals">
                <GoalsTab 
                  goals={goals} 
                  purchases={purchases} 
                  onUpdateRules={handleUpdateRules} 
                  rules={rules} 
                  isAdmin={isAdminUser} 
                  companyId={selectedCompanyId} 
                  onboardingStep={(onboardingTour === 'goals' || onboardingTour === 'reference_data_ticket' || onboardingTour === 'reference_data_revenue') ? 'onboarding' : 'normal'}
                  onOnboardingComplete={() => {
                    setOnboardingTour('rewards');
                    setActiveTab('rewards');
                  }}
                />
              </div>
            )}
            {activeTab === 'score' && !isSuperAdmin && <div key="score"><ScoreTab rules={rules} customers={customers} purchases={purchases} redemptions={redemptions} appUser={appUser} companyId={selectedCompanyId} /></div>}
            {activeTab === 'promotion' && !isSuperAdmin && <div key="promotion"><PromotionTab customers={customers} purchases={purchases} /></div>}
            {activeTab === 'strategic_analysis' && !isSuperAdmin && <div key="strategic_analysis"><StrategicAnalysisTab purchases={purchases} customers={customers} rules={rules} goals={goals} companyId={selectedCompanyId} /></div>}
            {activeTab === 'reset' && !isSuperAdmin && <div key="reset"><ResetSystemTab companyId={selectedCompanyId} isAdmin={isAdminUser} /></div>}
            {activeTab === 'company_profile' && !isSuperAdmin && <div key="company_profile"><CompanyProfileTab rules={rules} isAdmin={isAdminUser} appUser={appUser} onCancelContract={() => setContractCancelled(true)} onUpgrade={() => setActiveTab('strategic_analysis')} onUpdateRules={handleUpdateRules} /></div>}
            
            {/* Super Admin Tabs / Profile */}
            {activeTab === 'super_admin_profile' && appUser && <div key="super_admin_profile"><SuperAdminProfileTab appUser={appUser} onboardingMode={onboardingTour === 'profile'} onOnboardingNext={() => { setOnboardingTour('goals'); setActiveTab('goals'); }} /></div>}
            {activeTab === 'super_admin_management' && isSuperAdmin && <div key="super_admin_management"><SuperAdminManagementTab /></div>}
            {activeTab === 'redemption_codes' && isSuperAdmin && <div key="redemption_codes"><RedemptionCodesTab /></div>}
            {activeTab === 'painel_master' && isSuperAdmin && <div key="painel_master"><SuperAdminPanel onBack={() => setActiveTab('super_admin_profile')} isSuperAdmin={isSuperAdmin} appUser={appUser!} /></div>}
          </AnimatePresence>
        </main>
        <FloatingWhatsApp isAdminArea={isSuperAdmin || isAdminUser} />
        
        {/* QR Code Modal */}
        <AnimatePresence>
          {showQRCodeModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-2xl max-w-2xl w-full relative"
              >
                <button 
                  onClick={() => setShowQRCodeModal(false)}
                  className="absolute top-8 right-8 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all z-10"
                >
                  <X size={24} className="text-gray-900" />
                </button>

                <div className="h-[580px] flex items-center justify-center overflow-hidden bg-gray-50 relative">
                  <div id="printable-qr" className="bg-white p-16 flex flex-col items-center justify-center text-center shrink-0" style={{ width: '1080px', height: '1080px', transform: 'scale(0.5)', transformOrigin: 'center center' }}>
                    {/* Logo */}
                    <div className="mb-12">
                      <img 
                        src={currentLogo} 
                        alt="Logo" 
                        className="h-32 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-green-500 mb-12">
                      <QRCodeSVG 
                        value={`${window.location.origin}/?mode=consumer&companyId=${selectedCompanyId}`}
                        size={500}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    {/* Text */}
                    <div className="space-y-4">
                      <h2 className="text-6xl font-black text-gray-900 tracking-tighter">
                        Participe agora do nosso programa de fidelidade
                      </h2>
                      <p className="text-4xl font-bold text-green-600 uppercase tracking-widest">
                        Baixe o app e comece a ganhar!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white border-t border-gray-100 flex justify-center gap-4">
                  <Button 
                    onClick={() => {
                      const printContent = document.getElementById('printable-qr');
                      const windowUrl = 'about:blank';
                      const uniqueName = new Date().getTime();
                      const printWindow = window.open(windowUrl, uniqueName.toString(), 'left=0,top=0,width=1080,height=1080,toolbar=0,scrollbars=0,status=0');
                      
                      if (printWindow && printContent) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Imprimir QR Code - ${rules.companyProfile?.companyName}</title>
                              <script src="https://cdn.tailwindcss.com"></script>
                              <style>
                                @media print {
                                  @page { size: 1080px 1080px; margin: 0; }
                                  body { margin: 0; }
                                }
                              </style>
                            </head>
                            <body style="margin:0; padding:0;">
                              <div style="width:1080px; height:1080px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:80px; background:white;">
                                ${printContent.innerHTML}
                              </div>
                              <script>
                                window.onload = () => {
                                  window.print();
                                  setTimeout(() => window.close(), 500);
                                };
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="px-12 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3"
                  >
                    <Download size={20} /> Imprimir QR Code (1080x1080)
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {onboardingTour === 'reference_data_ticket' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-md space-y-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                  <DollarSign size={40} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Agora informe os dados de referência</h3>
                  <p className="text-gray-400 font-medium">Qual é o seu ticket médio atual?</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white font-black text-2xl outline-none focus:border-green-500 transition-all"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          if (val > 0) {
                            handleUpdateRules({ ...rules, currentAvgTicket: val });
                            setOnboardingTour('reference_data_revenue');
                          } else {
                            showToast("Por favor, informe um valor válido.", "warning");
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 italic">Pressione Enter para confirmar</p>
                </div>
              </div>
            </motion.div>
          )}

          {onboardingTour === 'reference_data_revenue' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-md space-y-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                  <TrendingUp size={40} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Ótimo!</h3>
                  <p className="text-gray-400 font-medium">Agora informe seu faturamento médio mensal atual:</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white font-black text-2xl outline-none focus:border-green-500 transition-all"
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          if (val > 0) {
                            await handleUpdateRules({ ...rules, currentMonthlyRevenue: val, onboardingComplete: true });
                            setOnboardingTour('finished');
                          } else {
                            showToast("Por favor, informe um valor válido.", "warning");
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 italic">Pressione Enter para finalizar o onboarding</p>
                </div>
              </div>
            </motion.div>
          )}

          {onboardingTour === 'finished' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-md space-y-8">
                <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 rotate-12">
                  <CheckCircle2 size={48} className="text-white" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Tudo Pronto!</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Sua plataforma foi configurada com sucesso. Agora você pode gerenciar seus clientes e metas com facilidade.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setOnboardingTour(null);
                    setActiveTab('dashboard');
                  }}
                  className="w-full bg-green-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-white shadow-2xl shadow-green-600/30 hover:bg-green-700 transition-all active:scale-95"
                >
                  Entrar no Painel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label, isSuperAdmin, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isSuperAdmin?: boolean; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-left",
        active 
          ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
          : "text-gray-400 hover:text-white hover:bg-white/10",
        disabled && "opacity-20 cursor-not-allowed grayscale"
      )}
      translate="no"
    >
      <span className={cn("transition-colors", active ? "text-white" : "text-gray-400 group-hover:text-white")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all shrink-0",
        active ? "text-green-500" : "text-gray-500"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'token'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setMessage({ type: 'success', text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada (e o spam) para o link de redefinição.' });
      // Firebase's standard flow uses a link, but the user asked for a token flow.
      // To simulate a token flow with Firebase, we'd need a custom backend.
      // For now, I'll stick to the standard Firebase flow but inform the user.
      // If they really want a "token" input, I'll add it but explain it's the code from the URL.
      setStep('token');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { confirmPasswordReset } = await import('firebase/auth');
      await confirmPasswordReset(auth, token, newPassword);
      setMessage({ type: 'success', text: 'Senha alterada com sucesso! Você já pode fazer login.' });
      setTimeout(onClose, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Token inválido ou expirado. Verifique o código no link do e-mail.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Recuperar Senha</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <p className="text-sm text-gray-400">Informe seu e-mail para receber as instruções de recuperação.</p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary"
                placeholder="seu@email.com"
                required
              />
            </div>
            {message && <div className={cn("p-3 rounded-lg text-xs font-bold", message.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{message.text}</div>}
            <Button type="submit" disabled={loading} className="w-full py-4 uppercase tracking-widest text-sm font-black">
              {loading ? 'Enviando...' : 'Enviar E-mail'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-400">Insira o código (oobCode) recebido no link do e-mail e sua nova senha.</p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Token / Código</label>
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary"
                placeholder="Código do e-mail"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>
            {message && <div className={cn("p-3 rounded-lg text-xs font-bold", message.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{message.text}</div>}
            <Button type="submit" disabled={loading} className="w-full py-4 uppercase tracking-widest text-sm font-black">
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
            <button type="button" onClick={() => setStep('email')} className="w-full text-xs text-gray-500 hover:text-white font-bold">Voltar para o e-mail</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function LoginScreen() {
  const [loginMode, setLoginMode] = useState<'client' | 'admin'>('admin');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    
    // Apply mask: 00.000.000/0001-00
    let masked = value;
    if (value.length > 2) masked = value.slice(0, 2) + '.' + value.slice(2);
    if (value.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
    if (value.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
    if (value.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
    
    setCnpj(masked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginMode === 'admin') {
        // Admin Login (Email/Password)
        try {
          await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
          setLoading(false);
          return;
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            // Check if it's the hardcoded super admin and try to create it
            const lowerEmail = email.toLowerCase();
            if (lowerEmail === SUPER_ADMIN_EMAIL.toLowerCase() && password === SUPER_ADMIN_PASS) {
              try {
                await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL.toLowerCase(), SUPER_ADMIN_PASS);
                await setDoc(doc(db, 'users', auth.currentUser!.uid), {
                  email: SUPER_ADMIN_EMAIL.toLowerCase(),
                  role: 'superadmin',
                  approved: true,
                  createdAt: new Date().toISOString()
                });
                setLoading(false);
                return;
              } catch (createErr: any) {
                if (createErr.code === 'auth/email-already-in-use') {
                  setError('Credenciais de Administrador inválidas.');
                  setLoading(false);
                  return;
                }
                throw createErr;
              }
            }
          }
          throw err;
        }
      } else {
        // Regular Client Login (CNPJ/Password)
        const normalizedCnpj = normalizeCNPJ(cnpj);
        
        // Try normalized first
        let q = query(collection(db, 'users'), where('cnpj', '==', normalizedCnpj), limit(1));
        let snap = await getDocs(q);
        
        // If not found, try with mask (fallback for older records)
        if (snap.empty && cnpj !== normalizedCnpj) {
          q = query(collection(db, 'users'), where('cnpj', '==', cnpj), limit(1));
          snap = await getDocs(q);
        }
        
        // If still not found, try searching by email (in case the user is trying to use email in CNPJ field)
        if (snap.empty && cnpj.includes('@')) {
          q = query(collection(db, 'users'), where('email', '==', cnpj.toLowerCase()), limit(1));
          snap = await getDocs(q);
        }

        if (snap.empty) {
          setError('CNPJ não encontrado. Verifique os dados ou entre em contato com o suporte.');
          setLoading(false);
          return;
        }

        const userData = snap.docs[0].data() as AppUser;
        await signInWithEmailAndPassword(auth, userData.email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por E-mail/Senha não está ativado no Firebase. Por favor, peça ao administrador para ativar o método "E-mail/Senha" no Console do Firebase (Authentication > Sign-in method).');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(loginMode === 'admin' ? 'E-mail ou Senha incorretos.' : 'CNPJ ou Senha incorretos.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de rede: Não foi possível conectar aos servidores do Firebase. Verifique sua conexão com a internet ou se algum ad-blocker está bloqueando o acesso.');
      } else {
        setError(err.message || 'Ocorreu um erro ao tentar entrar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      if (email !== 'fvmoreira2011@gmail.com' && email !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        setError('Acesso negado. Apenas administradores master podem entrar via Google.');
        await signOut(auth);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // Just stop loading, no need to show error
        return;
      }
      console.error(err);
      setError('Erro ao entrar com Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={LOGIN_BG_IMAGE} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-green-900/40 to-black/90"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] [background-size:64px_64px] opacity-20"></div>
        
        {/* Animated Holographic Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        
        <div className="relative z-10 p-20 flex flex-col justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter">
              ESTRATÉGIA PARA <br />
              <span className="text-green-400">O SEU NEGÓCIO.</span>
            </h1>
            <p className="text-xl text-white/90 max-w-md mt-6 leading-relaxed font-medium">
              A plataforma definitiva para gerenciar o futuro do seu negócio através de estratégias de relacionamento com seus clientes.
            </p>
          </motion.div>
          
          <div className="flex gap-12 pt-12">
            <div>
              <p className="text-4xl font-black text-white">100%</p>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-2">Digital</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white">+500</p>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-2">Empresas</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 w-full p-4 text-center text-[10px] text-white/50 bg-black/20 backdrop-blur-sm">
          CNPJ: 60.391.496/0001-01 | SLICESHARE CONSULTORIA E ESTRATEGIA EMPRESARIAL LTDA
        </footer>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-12"
        >
          <div className="space-y-6">
            <img 
              src={APP_LOGO} 
              alt="Logo" 
              className="w-48 h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_LOGO;
              }}
            />
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                {loginMode === 'admin' ? 'Acesso Administrativo' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-gray-500 font-medium">
                {loginMode === 'admin' 
                  ? 'Entre com seu e-mail administrativo para gerenciar o sistema.' 
                  : 'Entre com o CNPJ da sua empresa para acessar o painel.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {loginMode === 'admin' ? (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">E-mail Administrativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold outline-none focus:bg-white focus:border-green-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">CNPJ da Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={cnpj}
                    onChange={handleCnpjChange}
                    required
                    placeholder="00.000.000/0001-00"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold outline-none focus:bg-white focus:border-green-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold outline-none focus:bg-white focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </Button>

            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
              <button 
                type="button"
                onClick={() => setLoginMode(loginMode === 'client' ? 'admin' : 'client')}
                className="w-full text-[10px] text-green-600 hover:text-green-700 font-bold transition-colors uppercase tracking-widest"
              >
                {loginMode === 'client' ? 'Acesso Administrativo' : 'Voltar para Acesso Cliente'}
              </button>
              
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full text-[10px] text-gray-400 hover:text-gray-600 font-bold transition-colors uppercase tracking-widest"
              >
                Entrar com Google (Master)
              </button>
            </div>
          </form>

          <p className="text-center text-gray-400 text-xs font-medium">
            Problemas com o acesso? <br />
            <a href="#" className="text-green-600 hover:underline mt-2 inline-block">Falar com o suporte técnico</a>
          </p>
        </motion.div>
      </div>

      {/* Floating WhatsApp Button for Inquiries */}
      <a 
        href="https://wa.me/552140421034?text=Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20sistema%20de%20gest%C3%A3o%20de%20clientes%20e%20neg%C3%B3cios%20para%20o%20varejo"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all hover:scale-110 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}


function OnboardingOverlay({ rules, onUpdateRules, onAddAdmin }: { rules: LoyaltyRule; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; onAddAdmin: (email: string) => Promise<void> }) {
  const [step, setStep] = useState(1);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const { showToast } = useToast();

  const handleFinish = async () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    setIsFinishing(true);
    try {
      await onUpdateRules({ ...rules, onboardingComplete: true });
      showToast("Configuração concluída com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao concluir onboarding.", "error");
    } finally {
      setIsFinishing(false);
    }
  };

  const steps = [
    { title: "Bem-vindo!", description: "Vamos configurar os dados essenciais para o seu programa de fidelidade." },
    { title: "Equipe", description: "Deseja adicionar outros administradores agora?", type: 'admin' },
    { title: "Premiação", description: "Defina o modelo de premiação (Pontos ou Cashback) na aba Premiação.", type: 'nav', tab: 'rewards' },
    { title: "Metas Gerais", description: "Configure seu ticket médio e faturamento atual para habilitar as estatísticas.", type: 'nav', tab: 'goals' },
    { title: "Tudo Pronto!", description: "Agora você pode acessar todas as funcionalidades do sistema." }
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={150} />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={cn("w-8 h-1.5 rounded-full transition-all", i <= step ? "bg-primary" : "bg-gray-100")} />
              ))}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Passo {step} de 5</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">{steps[step-1].title}</h2>
            <p className="text-gray-500 font-medium leading-relaxed">{steps[step-1].description}</p>
          </div>

          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">E-mail do novo administrador</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <Button onClick={() => { onAddAdmin(newAdminEmail); setNewAdminEmail(''); }} disabled={!newAdminEmail}>Add</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Voltar</Button>
            )}
            <Button className="flex-[2] shadow-xl shadow-primary/20" onClick={handleFinish} disabled={isFinishing}>
              {step < 5 ? 'Próximo' : (isFinishing ? 'Finalizando...' : 'Começar Agora!')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SuperAdminProfileTab({ appUser, onboardingMode, onOnboardingNext }: { appUser: AppUser; onboardingMode?: boolean; onOnboardingNext?: () => void }) {
  const [displayName, setDisplayName] = useState(appUser?.displayName || '');
  const [phone, setPhone] = useState(appUser?.phone || '');
  const [roleInCompany, setRoleInCompany] = useState(appUser?.roleInCompany || '');
  const [photoURL, setPhotoURL] = useState(appUser?.photoURL || '');
  const { showToast } = useToast();

  useEffect(() => {
    if (appUser) {
      setDisplayName(appUser.displayName || '');
      setPhone(appUser.phone || '');
      setRoleInCompany(appUser.roleInCompany || '');
      setPhotoURL(appUser.photoURL || '');
    }
  }, [appUser]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onboardingMode) {
      if (!displayName || !phone || !photoURL) {
        showToast("Por favor, preencha nome, celular e foto de perfil.", "warning");
        return;
      }
    }

    setLoading(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        displayName,
        phone,
        roleInCompany,
        photoURL
      });
      showToast('Perfil atualizado com sucesso!', 'success');
      if (onboardingMode && onOnboardingNext) {
        onOnboardingNext();
      }
    } catch (err: any) {
      showToast('Erro ao atualizar perfil: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { updatePassword } = await import('firebase/auth');
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Configuração de Dados</h2>
          <p className="text-gray-400 font-medium">Gerencie suas informações pessoais e de acesso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="bg-white/5 border border-white/10 shadow-sm rounded-3xl p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">E-mail (Automático)</label>
                <input 
                  type="text" 
                  value={appUser.email}
                  disabled
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Celular</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cargo na Empresa</label>
                <input 
                  type="text" 
                  value={roleInCompany}
                  onChange={(e) => setRoleInCompany(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Foto de Perfil</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
                    <Camera size={20} />
                    <span>{photoURL ? 'Alterar Foto' : 'Escolher Foto do Computador'}</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoURL && (
                  <button 
                    type="button" 
                    onClick={() => setPhotoURL('')}
                    className="p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {message && (
              <div className={cn(
                "p-4 rounded-2xl text-sm font-bold text-center",
                message.type === 'success' ? "bg-green-500/10 border border-green-500/20 text-green-500" : "bg-red-500/10 border border-red-500/20 text-red-500"
              )}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPasswordModal(true)}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-white/10 hover:bg-white/5 text-white"
              >
                Alterar Senha
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 shadow-sm rounded-3xl p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-2xl shadow-primary/20">
              <img 
                src={photoURL || appUser.photoURL || `https://ui-avatars.com/api/?name=${displayName || appUser.email}&background=random`} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{displayName || 'Seu Nome'}</h3>
              <p className="text-primary font-bold uppercase tracking-widest text-xs">{roleInCompany || 'Cargo'}</p>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Alterar Senha</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest">
                {loading ? 'Alterando...' : 'Confirmar Nova Senha'}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SuperAdminManagementTab() {
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AppUser | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    displayName: '',
    email: '',
    phone: '',
    roleInCompany: '',
    password: '',
    photoURL: ''
  });
  const { showToast } = useToast();
  const { askConfirmation } = useConfirm();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'superadmin'));
      const unsub = onSnapshot(q, (snapshot) => {
        setAdmins(snapshot.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() } as AppUser)));
        setLoading(false);
      });
    return () => unsub();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = newAdmin.email.toLowerCase();
    try {
      if (editingAdmin) {
        await updateDoc(doc(db, 'users', editingAdmin.id), {
          displayName: newAdmin.displayName,
          email: normalizedEmail,
          phone: newAdmin.phone,
          roleInCompany: newAdmin.roleInCompany,
          photoURL: newAdmin.photoURL,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create Auth User using secondary app
        const secondaryApp = initializeApp(firebaseConfig, `AdminAuth_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const result = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, newAdmin.password);
        const uid = result.user.uid;
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        await setDoc(doc(db, 'users', uid), {
          displayName: newAdmin.displayName,
          email: normalizedEmail,
          phone: newAdmin.phone,
          roleInCompany: newAdmin.roleInCompany,
          photoURL: newAdmin.photoURL,
          role: 'superadmin',
          approved: true,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
      setEditingAdmin(null);
      setNewAdmin({ displayName: '', email: '', phone: '', roleInCompany: '', password: '', photoURL: '' });
      showToast("Administrador salvo com sucesso!", "success");
    } catch (err: any) {
      showToast('Erro ao salvar administrador: ' + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    askConfirmation(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este administrador?",
      async () => {
        try {
          await deleteDoc(doc(db, 'users', adminId));
          showToast("Administrador excluído com sucesso!", "success");
        } catch (err: any) {
          showToast('Erro ao excluir administrador: ' + err.message, "error");
        }
      },
      true
    );
  };

  const handleEditClick = (admin: AppUser) => {
    setEditingAdmin(admin);
    setNewAdmin({
      displayName: admin.displayName || '',
      email: admin.email || '',
      phone: admin.phone || '',
      roleInCompany: admin.roleInCompany || '',
      password: '', // Don't show password on edit
      photoURL: admin.photoURL || ''
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Gestão de Administradores</h2>
          <p className="text-gray-400 font-medium">Inclua e gerencie outros administradores master.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="px-6 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2">
          <Plus size={20} /> Novo Administrador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white/5 border border-white/10 shadow-sm rounded-3xl p-6 flex items-center gap-4 group relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shrink-0">
              <img 
                src={admin.photoURL || `https://ui-avatars.com/api/?name=${admin.displayName || admin.email}&background=random`} 
                alt={admin.displayName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold truncate">{admin.displayName || 'Sem Nome'}</h3>
              <p className="text-gray-500 text-xs truncate">{admin.email}</p>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">{admin.roleInCompany || 'Administrador'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleEditClick(admin)}
                className="p-2 text-gray-500 hover:text-primary transition-colors"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDeleteAdmin(admin.id)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-2xl space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
              </h3>
              <button onClick={() => {
                setShowAddModal(false);
                setEditingAdmin(null);
                setNewAdmin({ displayName: '', email: '', phone: '', roleInCompany: '', password: '' });
              }} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-gray-50 flex items-center justify-center shadow-lg">
                    {newAdmin.photoURL ? (
                      <img src={newAdmin.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={48} className="text-gray-400" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Camera className="text-white" size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewAdmin(prev => ({ ...prev, photoURL: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-2">Foto de Perfil</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newAdmin.displayName}
                  onChange={(e) => setNewAdmin({...newAdmin, displayName: e.target.value})}
                  required
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <input 
                  type="email" 
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Celular</label>
                <input 
                  type="text" 
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cargo</label>
                <input 
                  type="text" 
                  value={newAdmin.roleInCompany}
                  onChange={(e) => setNewAdmin({...newAdmin, roleInCompany: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              {!editingAdmin && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                  <input 
                    type="password" 
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    required
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <Button type="submit" disabled={loading} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest">
                  {loading ? 'Salvando...' : (editingAdmin ? 'Salvar Alterações' : 'Criar Administrador')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SuperAdminPanel({ onBack, isSuperAdmin, appUser }: { onBack: () => void; isSuperAdmin: boolean; appUser: AppUser }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isSuperAdmin);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<AppUser[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'reports'>('clients');
  const [editingClient, setEditingClient] = useState<AppUser | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const { showToast } = useToast();
  const { askConfirmation } = useConfirm();

  useEffect(() => {
    if (isAuthenticated) {
      const q = query(collection(db, 'users'), where('isClient', '==', true));
      const unsub = onSnapshot(q, (snapshot) => {
        setClients(snapshot.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() } as AppUser)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
      return () => unsub();
    }
  }, [isAuthenticated]);

  const handleImpersonate = (client: AppUser) => {
    localStorage.setItem('impersonatedClientId', client.id);
    window.location.reload();
  };

  const handleToggleBlock = async (client: AppUser) => {
    try {
      await updateDoc(doc(db, 'users', client.id), {
        approved: !client.approved
      });
      showToast(`Cliente ${client.approved ? 'bloqueado' : 'desbloqueado'} com sucesso!`, "success");
    } catch (err: any) {
      showToast('Erro ao alterar status do cliente: ' + err.message, "error");
    }
  };

  const handleDeleteClient = async (client: AppUser) => {
    askConfirmation(
      "CONFIRMAR EXCLUSÃO ABSOLUTA",
      `TEM CERTEZA ABSOLUTA? Esta ação irá apagar permanentemente o cliente ${client.companyName} e TODOS os seus dados (configurações, clientes, vendas, metas). Esta operação NÃO PODE SER DESFEITA.`,
      async () => {
        try {
          setLoading(true);
          // 1. Delete configs
          await deleteDoc(doc(db, 'configs', client.id));
          
          // 2. Delete customers
          const qCust = query(collection(db, 'customers'), where('companyId', '==', client.id));
          const snapCust = await getDocs(qCust);
          const batchCust = writeBatch(db);
          snapCust.docs.forEach(d => batchCust.delete(d.ref));
          await batchCust.commit();

          // 3. Delete purchases
          const qPurc = query(collection(db, 'purchases'), where('companyId', '==', client.id));
          const snapPurc = await getDocs(qPurc);
          const batchPurc = writeBatch(db);
          snapPurc.docs.forEach(d => batchPurc.delete(d.ref));
          await batchPurc.commit();

          // 4. Delete goals
          const qGoal = query(collection(db, 'goals'), where('companyId', '==', client.id));
          const snapGoal = await getDocs(qGoal);
          const batchGoal = writeBatch(db);
          snapGoal.docs.forEach(d => batchGoal.delete(d.ref));
          await batchGoal.commit();

          // 5. Delete user document
          await deleteDoc(doc(db, 'users', client.id));

          showToast('Cliente e todos os seus dados foram excluídos com sucesso.', "success");
        } catch (err: any) {
          showToast('Erro ao excluir cliente: ' + err.message, "error");
        } finally {
          setLoading(false);
        }
      },
      true
    );
  };

  const handleEditClient = (client: AppUser) => {
    setEditingClient(client);
    setShowFormModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <ShieldCheck className="text-primary mx-auto" size={48} />
          <h2 className="text-2xl font-black text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar esta área.</p>
          <Button onClick={onBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Gestão de Assinaturas</h2>
          <p className="text-gray-400 font-medium">Gerencie clientes e visualize relatórios consolidados.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowFormModal(true)} className="px-6 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={20} /> Novo Cliente
          </Button>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveSubTab('clients')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeSubTab === 'clients' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
              )}
            >
              Clientes
            </button>
            <button 
              onClick={() => setActiveSubTab('reports')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeSubTab === 'reports' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
              )}
            >
              Relatórios
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'clients' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-black border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white/10 shadow-inner">
                  <img 
                    src={client.logoURL || FALLBACK_LOGO} 
                    alt={client.companyName} 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  client.approved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                )}>
                  {client.approved ? 'Ativo' : 'Bloqueado'}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white truncate tracking-tight">{client.companyName}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-white/40 text-sm font-bold uppercase tracking-widest">{client.cnpj}</p>
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Mail size={12} /> {client.email}
                  </p>
                  {client.erpKey && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] bg-white/10 text-white/60 px-2 py-0.5 rounded border border-white/5 uppercase font-bold">ERP: {client.erpKey}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-6 border-t border-white/10">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleToggleBlock(client)}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-white/10 bg-white/5",
                      client.approved ? "text-red-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" : "text-green-400 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20"
                    )}
                  >
                    {client.approved ? 'Bloquear' : 'Desbloquear'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleEditClient(client)}
                    className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Editar
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleImpersonate(client)}
                    className="flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Acessar Painel
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDeleteClient(client)}
                    className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SuperAdminReportsTab clients={clients} appUser={appUser} />
      )}

      {showFormModal && (
        <ClientFormModal 
          client={editingClient} 
          onClose={() => {
            setShowFormModal(false);
            setEditingClient(null);
          }} 
        />
      )}
    </div>
  );
}

function SuperAdminReportsTab({ clients, appUser }: { clients: AppUser[], appUser: AppUser }) {
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<any[] | null>(null);

  const generateReport = async (type: 'general' | 'faturamento' | 'clientes' | 'ranking' | 'conversao' | 'tickets' | 'pontos' | 'metas' = 'general', pointsValue?: number) => {
    setLoading(true);
    setReportData(null);
    try {
      let q = query(collection(db, 'purchases'));
      
      if (selectedClient !== 'all') {
        q = query(q, where('companyId', '==', selectedClient));
      }
      
      const snapshot = await getDocs(q);
      let purchases = snapshot.docs.map(d => d.data());
      
      // For automatic reports, we might want to default to current month if no range is selected
      let start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
      let end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;

      if (!start && !end && type !== 'general') {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      
      if (start || end) {
        purchases = purchases.filter((p: any) => {
          const pDate = new Date(p.date);
          if (start && pDate < start) return false;
          if (end && pDate > end) return false;
          return true;
        });
      }
      
      if (purchases.length === 0) {
        setReportData([]);
        return;
      }
      
      let finalData: any[] = [];

      if (type === 'general' || type === 'faturamento') {
        const grouped = purchases.reduce((acc: any, p: any) => {
          if (!acc[p.companyId]) {
            acc[p.companyId] = { sales: 0, orders: 0 };
          }
          acc[p.companyId].sales += Number(p.amount) || 0;
          acc[p.companyId].orders += 1;
          return acc;
        }, {});
        
        finalData = Object.keys(grouped).map(companyId => {
          const client = clients.find(c => c.id === companyId);
          return {
            company: client?.companyName || 'Desconhecido',
            logo: client?.logoURL || client?.photoURL || FALLBACK_LOGO,
            sales: grouped[companyId].sales,
            orders: grouped[companyId].orders,
            avgTicket: grouped[companyId].orders > 0 ? grouped[companyId].sales / grouped[companyId].orders : 0
          };
        });
      } else if (type === 'clientes') {
        // Clientes do período
        const uniqueClients = new Set(purchases.map((p: any) => p.companyId));
        finalData = Array.from(uniqueClients).map(companyId => {
          const client = clients.find(c => c.id === companyId);
          const clientPurchases = purchases.filter((p: any) => p.companyId === companyId);
          return {
            company: client?.companyName || 'Desconhecido',
            sales: clientPurchases.reduce((acc: any, p: any) => acc + p.amount, 0),
            orders: clientPurchases.length,
            avgTicket: clientPurchases.length > 0 ? clientPurchases.reduce((acc: any, p: any) => acc + p.amount, 0) / clientPurchases.length : 0
          };
        });
      } else if (type === 'ranking') {
        // Ranking de vendas por cliente
        const grouped = purchases.reduce((acc: any, p: any) => {
          if (!acc[p.companyId]) acc[p.companyId] = 0;
          acc[p.companyId] += p.amount;
          return acc;
        }, {});
        finalData = Object.keys(grouped).map(companyId => {
          const client = clients.find(c => c.id === companyId);
          return {
            company: client?.companyName || 'Desconhecido',
            sales: grouped[companyId],
            orders: purchases.filter((p: any) => p.companyId === companyId).length,
            avgTicket: grouped[companyId] / purchases.filter((p: any) => p.companyId === companyId).length
          };
        }).sort((a, b) => b.sales - a.sales);
      } else if (type === 'conversao') {
        // Ticket Médio x Taxa de Conversão
        // Note: Conversion rate here is simplified as orders/total_potential (mocked or based on some logic)
        const grouped = purchases.reduce((acc: any, p: any) => {
          if (!acc[p.companyId]) acc[p.companyId] = { sales: 0, orders: 0 };
          acc[p.companyId].sales += p.amount;
          acc[p.companyId].orders += 1;
          return acc;
        }, {});
        finalData = Object.keys(grouped).map(companyId => {
          const client = clients.find(c => c.id === companyId);
          const avgTicket = grouped[companyId].sales / grouped[companyId].orders;
          // Mock conversion rate for report demonstration
          const conversionRate = (grouped[companyId].orders / 100) * 100; 
          return {
            company: client?.companyName || 'Desconhecido',
            sales: grouped[companyId].sales,
            orders: grouped[companyId].orders,
            avgTicket,
            conversion: conversionRate.toFixed(2) + '%'
          };
        });
      } else if (type === 'tickets') {
        // 10 maiores Tickets médios
        const grouped = purchases.reduce((acc: any, p: any) => {
          if (!acc[p.companyId]) acc[p.companyId] = { sales: 0, orders: 0 };
          acc[p.companyId].sales += p.amount;
          acc[p.companyId].orders += 1;
          return acc;
        }, {});
        finalData = Object.keys(grouped).map(companyId => {
          const client = clients.find(c => c.id === companyId);
          return {
            company: client?.companyName || 'Desconhecido',
            sales: grouped[companyId].sales,
            orders: grouped[companyId].orders,
            avgTicket: grouped[companyId].sales / grouped[companyId].orders
          };
        }).sort((a, b) => b.avgTicket - a.avgTicket).slice(0, 10);
      } else if (type === 'pontos') {
        // Clientes com X pontos
        // This requires fetching customers collection
        const customersSnap = await getDocs(collection(db, 'customers'));
        const allCustomers = customersSnap.docs.map(d => d.data());
        const filteredCustomers = allCustomers.filter((c: any) => c.points === pointsValue);
        
        finalData = filteredCustomers.map((c: any) => {
          const client = clients.find(cl => cl.id === c.companyId);
          return {
            company: client?.companyName || 'Desconhecido',
            customerName: c.name,
            points: c.points,
            sales: 0, // Not applicable directly here
            orders: 0
          };
        });
      } else if (type === 'metas') {
        // Metas de faturamento x orçado
        const goalsSnap = await getDocs(collection(db, 'goals'));
        const allGoals = goalsSnap.docs.map(d => d.data());
        
        finalData = clients.map(client => {
          const clientPurchases = purchases.filter((p: any) => p.companyId === client.id);
          const actual = clientPurchases.reduce((acc: any, p: any) => acc + p.amount, 0);
          const goal = allGoals.find((g: any) => g.companyId === client.id);
          return {
            company: client.companyName,
            sales: actual,
            goal: goal?.value || 0,
            diff: actual - (goal?.value || 0),
            orders: clientPurchases.length,
            avgTicket: clientPurchases.length > 0 ? actual / clientPurchases.length : 0
          };
        });
      }
      
      setReportData(finalData);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const setQuickFilter = (period: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let start = new Date();
    
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    }
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  };

  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    try {
      // Header Section
      const logoToUse = selectedClient !== 'all' 
        ? (clients.find(c => c.id === selectedClient)?.logoURL || clients.find(c => c.id === selectedClient)?.photoURL || FALLBACK_LOGO)
        : (appUser.photoURL || APP_LOGO);

      try {
        const base64Logo = await getBase64ImageFromURL(logoToUse);
        doc.addImage(base64Logo, 'PNG', 14, 10, 30, 30);
      } catch (e) {
        console.warn('Could not load logo for PDF', e);
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Gerencial', 50, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 50, 32);
      if (selectedClient !== 'all') {
        const client = clients.find(c => c.id === selectedClient);
        doc.text(`Cliente: ${client?.companyName}`, 50, 37);
      } else {
        doc.text('Abrangência: Todos os Clientes', 50, 37);
      }

      if (dateRange.start || dateRange.end) {
        doc.text(`Período: ${dateRange.start || 'Início'} até ${dateRange.end || 'Hoje'}`, 50, 42);
      }

      const tableData = reportData.map(d => [
        d.company,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.sales),
        d.orders,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.avgTicket)
      ]);

      autoTable(doc, {
        head: [['Empresa', 'Vendas Totais', 'Qtd. Pedidos', 'Ticket Médio']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [251, 133, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 50 }
      });

      doc.save(`relatorio-gerencial-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Erro ao exportar PDF');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 space-y-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setQuickFilter('today')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">Hoje</button>
          <button onClick={() => setQuickFilter('week')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">Últimos 7 dias</button>
          <button onClick={() => setQuickFilter('month')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">Últimos 30 dias</button>
          <button onClick={() => setQuickFilter('year')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all">Último ano</button>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Relatórios Automáticos</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => generateReport('faturamento')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Faturamento</button>
            <button onClick={() => generateReport('clientes')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Clientes do Período</button>
            <button onClick={() => generateReport('ranking')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Ranking de Vendas</button>
            <button onClick={() => generateReport('conversao')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Ticket Médio x Conversão</button>
            <button onClick={() => generateReport('tickets')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">10 Maiores Tickets</button>
            <button onClick={() => generateReport('pontos', 3)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Clientes 3 Pontos</button>
            <button onClick={() => generateReport('pontos', 6)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Clientes 6 Pontos</button>
            <button onClick={() => generateReport('pontos', 10)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Clientes 10 Pontos</button>
            <button onClick={() => generateReport('metas')} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-green-500/20">Metas x Orçado</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cliente</label>
            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all appearance-none"
            >
              <option value="all" className="bg-white text-gray-900">Todos os Clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-white text-gray-900">{c.companyName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Data Início</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Data Fim</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={generateReport} disabled={loading} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest">
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          {reportData && reportData.length > 0 && (
            <Button onClick={exportPDF} variant="outline" className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-gray-100 hover:bg-gray-50">
              Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {reportData && reportData.length === 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Search className="text-gray-300" size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900">Nenhum dado encontrado</h3>
            <p className="text-gray-500 font-medium">Não existem registros de compras para os filtros selecionados.</p>
          </div>
        </div>
      )}

      {reportData && reportData.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Empresa</th>
                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendas</th>
                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Pedidos</th>
                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-4 font-bold text-gray-900">{d.company}</td>
                  <td className="px-8 py-4 font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.sales)}
                  </td>
                  <td className="px-8 py-4 font-bold text-gray-500">{d.orders}</td>
                  <td className="px-8 py-4 font-bold text-gray-900 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.avgTicket)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientFormModal({ client, onClose }: { client: AppUser | null; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<AppUser>>(client || {
    companyName: '',
    campaignName: '',
    address: '',
    cnpj: '',
    phone: '',
    themeColor: '#fb8500',
    secondaryColor: '#000000',
    clientStatus: 'monthly',
    activationDate: new Date().toISOString(),
    erpKey: '',
    email: '',
    password: '',
    role: 'admin',
    approved: true,
    isClient: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<'idle' | 'auth' | 'firestore' | 'config' | 'done'>('idle');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStep('auth');
    const normalizedEmail = formData.email?.toLowerCase();
    try {
      let uid = client?.uid;
      
      if (!uid) {
        // Create new auth user using secondary app to avoid logging out super admin
        const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const result = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail!, formData.password!);
        uid = result.user.uid;
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
      }

      setSaveStep('firestore');
      const normalizedCnpj = normalizeCNPJ(formData.cnpj || '');
      const clientData = {
        ...formData,
        email: normalizedEmail,
        cnpj: normalizedCnpj,
        uid,
        companyId: uid, // Important for AdminTab
        updatedAt: new Date().toISOString()
      };
      delete clientData.password; // Don't store plain password in Firestore

      await setDoc(doc(db, 'users', uid), clientData);
      
      setSaveStep('config');
      // Initialize config for the client
      if (!client) {
        await setDoc(doc(db, 'configs', uid), {
          ...DEFAULT_RULES,
          companyId: uid,
          campaignName: formData.campaignName,
          themeColor: formData.themeColor,
          companyProfile: {
            companyName: formData.companyName,
            cnpj: normalizedCnpj,
            phone: formData.phone,
            address: formData.address,
            photoURL: formData.logoURL || '',
            logoURL: formData.logoURL || '',
            subscriptionType: formData.clientStatus
          }
        });
      } else {
        // Update existing config
        await updateDoc(doc(db, 'configs', uid), {
          campaignName: formData.campaignName,
          themeColor: formData.themeColor,
          'companyProfile.companyName': formData.companyName,
          'companyProfile.cnpj': normalizedCnpj,
          'companyProfile.phone': formData.phone,
          'companyProfile.address': formData.address,
          'companyProfile.photoURL': formData.logoURL || '',
          'companyProfile.logoURL': formData.logoURL || '',
          'companyProfile.subscriptionType': formData.clientStatus
        });
      }

      setSaveStep('done');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar cliente: " + err.message);
      setSaveStep('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[2.5rem] w-full max-w-4xl my-8 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-gray-900">{client ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Preencha todas as informações para configurar o ambiente do cliente.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 rounded-xl"><X size={24} /></button>
        </div>

        <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Section */}
          <div className="md:col-span-2 flex flex-col items-center gap-4 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl bg-white border-2 border-primary flex items-center justify-center overflow-hidden shadow-xl">
                {formData.logoURL ? (
                  <img src={formData.logoURL} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={40} className="text-gray-300" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo da Empresa (Upload)</p>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Informações Básicas</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                <input type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Programa</label>
                <input type="text" value={formData.campaignName} onChange={e => setFormData({ ...formData, campaignName: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                <input 
                  type="text" 
                  value={formData.cnpj} 
                  onChange={e => {
                    const val = e.target.value;
                    const digits = val.replace(/\D/g, '');
                    let masked = digits;
                    if (digits.length > 2) masked = digits.slice(0, 2) + '.' + digits.slice(2);
                    if (digits.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
                    if (digits.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
                    if (digits.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15);
                    setFormData({ ...formData, cnpj: masked.slice(0, 18) });
                  }} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" 
                  placeholder="00.000.000/0001-00"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Celular</label>
                <PhoneInput placeholder="Ex: +55 21 99999-9999" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val || '' })} defaultCountry="BR" className="PhoneInput text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Configurações de Sistema</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Primária</label>
                <div className="flex gap-2">
                  <input type="color" value={formData.themeColor} onChange={e => setFormData({ ...formData, themeColor: e.target.value })} className="h-14 w-14 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer" />
                  <input type="text" value={formData.themeColor} onChange={e => setFormData({ ...formData, themeColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-mono text-xs font-bold outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input type="color" value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} className="h-14 w-14 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer" />
                  <input type="text" value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-mono text-xs font-bold outline-none focus:border-primary transition-all" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Plano</label>
              <select value={formData.clientStatus} onChange={e => setFormData({ ...formData, clientStatus: e.target.value as any })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all appearance-none">
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave ERP / Integração</label>
              <input 
                type="text" 
                value={formData.erpKey || ''} 
                onChange={e => setFormData({ ...formData, erpKey: e.target.value })} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" 
                placeholder="Ex: ERP-XYZ-123"
              />
              <div className="mt-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest">Informações para o ERP:</p>
                <p className="text-[9px] text-indigo-600 leading-relaxed font-medium">
                  Solicite ao fabricante do seu ERP o mapeamento dos seguintes campos para esta chave:<br/>
                  • <span className="font-bold">Celular</span> (campo: Phone/Telefone)<br/>
                  • <span className="font-bold">Nome Completo</span> (campo: Nome/Sobrenome)<br/>
                  • <span className="font-bold">Data de Nascimento</span> (formato: DD/MM/AAAA)<br/>
                  • <span className="font-bold">Valor da Venda</span> (campo: Valor Total/Compra)
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
            </div>

            {!client && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-8 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {isSaving && (
                <div className="flex items-center gap-3 text-primary font-black">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  <span className="text-[10px] uppercase tracking-widest">
                    {saveStep === 'auth' && 'Autenticando...'}
                    {saveStep === 'firestore' && 'Salvando Perfil...'}
                    {saveStep === 'config' && 'Configurando Sistema...'}
                    {saveStep === 'done' && 'Concluído!'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onClose} className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest border-gray-100 hover:bg-gray-50">Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                {isSaving ? 'Processando...' : (client ? 'Salvar Alterações' : 'Criar Cliente')}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// --- Tabs ---

function ScoreTab({ rules, customers, purchases, redemptions, appUser, companyId }: { rules: LoyaltyRule; customers: Customer[]; purchases: Purchase[]; redemptions: Redemption[]; appUser: AppUser | null; companyId: string | null }) {
  const [phone, setPhone] = useState<string | undefined>();
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  const [desktopStep, setDesktopStep] = useState(0); // 0: phone, 1: confirm/register, 2: amount, 3: success

  // Filter specific customer data
  const customerMetrics = useMemo(() => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const customer = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
    if (!customer) return null;

    const customerPurchases = purchases.filter(p => p.customerId === customer.id);
    const customerRedemptions = redemptions.filter(r => r.customerId === customer.id);

    const totalSpent = customerPurchases.reduce((acc, p) => acc + p.amount, 0);
    const totalPrizeCost = customerRedemptions.reduce((acc, r) => acc + (r.cost || 0), 0);
    const efficiency = totalSpent > 0 ? (totalPrizeCost / totalSpent) * 100 : 0;

    return {
      customer,
      purchases: customerPurchases,
      redemptions: customerRedemptions,
      totalSpent,
      totalPrizeCost,
      efficiency
    };
  }, [phone, customers, purchases, redemptions]);

  const foundCustomer = customerMetrics?.customer;

  const handleScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    // Check program status
    const currentStatus = rules.rewardMode === 'points' ? rules.pointsStatus?.status : rules.cashbackStatus?.status;
    if (currentStatus === 'paused') {
      showToast("Este programa está pausado no momento.", "warning");
      return;
    }
    if (currentStatus === 'ended') {
      showToast("Este programa foi encerrado.", "warning");
      return;
    }

    if (!foundCustomer) {
      setMessage({ type: 'error', text: "Selecione um cliente cadastrado para pontuar." });
      showToast("Selecione um cliente cadastrado para pontuar.", "warning");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: "Informe um valor de compra válido." });
      return;
    }

    setIsSubmitting(true);
    try {
      const val = parseFloat(amount);
      let pointsEarned = 0;
      let cashbackEarned = 0;
      
      if (rules.rewardMode === 'cashback') {
        if (val >= (rules.cashbackConfig?.minActivationValue || 0)) {
          cashbackEarned = val * ((rules.cashbackConfig?.percentage || 0) / 100);
        }
      } else {
        if (val >= (rules.minPurchaseValue || 0)) {
          pointsEarned = 1;
          if (rules.extraPointsThreshold && rules.extraPointsAmount && val >= rules.extraPointsThreshold) {
            pointsEarned += rules.extraPointsAmount;
          }
        }
      }
      
      const now = new Date().toISOString();

      // Check for point expiry (Separate logic for Points and Cashback)
      let currentPoints = foundCustomer.points;
      let currentCashback = foundCustomer.cashbackBalance || 0;
      
      if (foundCustomer.lastPurchaseDate) {
        const lastPurchase = parseISO(foundCustomer.lastPurchaseDate);
        const daysSinceLast = differenceInDays(new Date(), lastPurchase);
        
        // 1. Points Expiry
        if (currentPoints > 0) {
          const tiers = [...(rules.rewardTiers || [])].sort((a, b) => b.points - a.points);
          const currentTier = tiers.find(t => currentPoints >= t.points);
          const pointsExpiryDays = currentTier?.expiryDays || rules.maxDaysBetweenPurchases || 999;
          if (daysSinceLast > pointsExpiryDays) {
            currentPoints = 0;
          }
        }
        
        // 2. Cashback Expiry
        if (currentCashback > 0) {
          const cashbackExpiryDays = rules.cashbackConfig?.expiryDays || 90;
          if (daysSinceLast > cashbackExpiryDays) {
            currentCashback = 0;
          }
        }
      }

      // Update customer balances
      const customerRef = doc(db, 'customers', foundCustomer.id);
      const newPoints = currentPoints + pointsEarned;
      const newCashback = currentCashback + cashbackEarned;
      
      await updateDoc(customerRef, {
        points: newPoints,
        cashbackBalance: newCashback,
        lastPurchaseDate: now
      });

      // Send notification if something earned
      if (pointsEarned > 0 || cashbackEarned > 0) {
        await addDoc(collection(db, 'notifications'), {
          customerId: foundCustomer.id,
          companyId,
          title: rules.rewardMode === 'cashback' ? 'Você ganhou cashback!' : 'Você ganhou pontos!',
          message: rules.rewardMode === 'cashback' 
            ? `Parabéns! Você acaba de ganhar R$ ${formatCurrency(cashbackEarned)} de cashback na ${rules.companyProfile?.companyName || 'nossa loja'}. Seu saldo agora é de R$ ${formatCurrency(newCashback)}.`
            : `Parabéns! Você acaba de ganhar ${pointsEarned} ponto(s) na ${rules.companyProfile?.companyName || 'nossa loja'}. Seu saldo agora é de ${newPoints} pontos.`,
          type: 'points',
          date: now,
          read: false
        });

        // Check if close to prize (within 2 points)
        const tiers = [...(rules.rewardTiers || [])].sort((a, b) => a.points - b.points);
        const nextTier = tiers.find(t => t.points > newPoints);
        if (nextTier && (nextTier.points - newPoints) <= 2) {
          await addDoc(collection(db, 'notifications'), {
            customerId: foundCustomer.id,
            companyId,
            title: 'Quase lá!',
            message: `Faltam apenas ${nextTier.points - newPoints} ponto(s) para você resgatar seu prêmio: ${nextTier.prize}!`,
            type: 'prize_near',
            date: now,
            read: false
          });
        }
      }

      // Record purchase
      await addDoc(collection(db, 'purchases'), {
        companyId,
        customerId: foundCustomer.id,
        customerName: foundCustomer.name,
        amount: val,
        date: now,
        pointsEarned,
        cashbackEarned
      });

      setMessage({ 
        type: 'success', 
        text: pointsEarned > 0 
          ? (rules.rewardMode === 'cashback' 
              ? `Cashback confirmado! +R$ ${formatCurrency(pointsEarned)} para ${foundCustomer.name}`
              : `Pontuação confirmada! +${pointsEarned} ponto(s) para ${foundCustomer.name}`)
          : `Compra registrada para ${foundCustomer.name}. (Abaixo do valor mínimo)`
      });
      setAmount('');
      setPhone(undefined);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'score');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    if (!foundCustomer || !companyId) return;
    setIsSubmitting(true);
    try {
      const customerRef = doc(db, 'customers', foundCustomer.id);
      
      const isCashback = rules.rewardMode === 'cashback';
      let prizeName = 'Brinde Especial';
      let pointsToRedeem = 0;
      let prizeCost = 0;

      if (isCashback) {
        prizeName = 'Resgate de Cashback';
        pointsToRedeem = foundCustomer.cashbackBalance || 0;
        prizeCost = pointsToRedeem;
      } else {
        const tiers = [...(rules.rewardTiers || [])].sort((a, b) => b.points - a.points);
        const currentTier = tiers.find(t => foundCustomer.points >= t.points);
        prizeName = currentTier?.prize || 'Brinde Especial';
        pointsToRedeem = rules.purchasesForPrize || 10;
        prizeCost = currentTier?.cost || 0;
      }

      // Record redemption
      await addDoc(collection(db, 'redemptions'), {
        companyId,
        customerId: foundCustomer.id,
        prize: prizeName,
        pointsValue: pointsToRedeem,
        cost: prizeCost,
        date: new Date().toISOString()
      });

      // Update customer balances
      if (isCashback) {
        await updateDoc(customerRef, {
          cashbackBalance: 0,
          lastPurchaseDate: new Date().toISOString()
        });
      } else {
        await updateDoc(customerRef, {
          points: Math.max(0, foundCustomer.points - (rules.purchasesForPrize || 10)),
          lastPurchaseDate: new Date().toISOString()
        });
      }

      setMessage({ type: 'success', text: `Prêmio resgatado com sucesso para ${foundCustomer.name}!` });
      setShowRedeemConfirm(false);
      setPhone(undefined);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'redeem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    
    const nameParts = newName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setMessage({ type: 'error', text: "Insira nome e sobrenome para finalizar o cadastro" });
      showToast("Insira nome e sobrenome para finalizar o cadastro", "warning");
      return;
    }

    if (!newName || !phone) {
      setMessage({ type: 'error', text: "Preencha o nome e o celular para cadastrar." });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'customers'), {
        companyId,
        name: newName,
        phone,
        birthDate: newBirthDate,
        points: 0,
        lastPurchaseDate: now,
        createdAt: now
      });
      
      setMessage({ type: 'success', text: "Cliente cadastrado com sucesso!" });
      setShowRegister(false);
      setNewName('');
      setNewBirthDate('');
      // Keep the phone selected so the user can score immediately
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers_score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center justify-center min-h-[700px] py-8 w-full">
      {/* Mobile View - iPhone Frame (Hidden on Desktop) */}
      <div className="lg:hidden relative w-[320px] h-[650px] bg-gray-950 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        {/* iPhone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
        
        {/* App Content inside iPhone */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-10 space-y-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-lg p-2">
              {appUser?.logoURL ? (
                <img src={appUser.logoURL} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={36} className="text-primary" />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black text-white tracking-tighter uppercase">Pontuar Agora</h2>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{rules.campaignName || 'Programa de Fidelidade'}</p>
            </div>
          </div>

          {!showRegister ? (
            <form onSubmit={handleScore} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-2 block tracking-[0.15em]">Digite o celular do cliente</label>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2 transition-all focus-within:border-primary">
                  <PhoneInput
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={setPhone}
                    defaultCountry="BR"
                    className="PhoneInput dark text-sm text-white font-bold"
                  />
                </div>
              </div>

              {phone && phone.replace(/\D/g, '').length >= 10 && !foundCustomer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-900/20 border border-blue-800/50 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="text-blue-400 shrink-0" size={16} />
                  <div className="flex-1">
                    <p className="text-[10px] text-blue-200 font-bold">Cliente não encontrado.</p>
                    <button 
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className="text-[10px] text-blue-400 underline mt-0.5 hover:text-blue-300 font-bold"
                    >
                      Cadastrar agora?
                    </button>
                  </div>
                </motion.div>
              )}

              {foundCustomer && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-900/20 p-3 rounded-xl border border-green-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-green-200 font-black uppercase tracking-tight">{foundCustomer.name}</p>
                      <div className="flex gap-2 mt-1">
                        {foundCustomer.points > 0 && <p className="text-[9px] text-green-400 font-bold">P: {foundCustomer.points}</p>}
                        {(foundCustomer.cashbackBalance || 0) > 0 && <p className="text-[9px] text-green-400 font-bold">C: R${formatCurrency(foundCustomer.cashbackBalance || 0)}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Customer Metrics Overlay for Mobile */}
                  {customerMetrics && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 bg-black/40 rounded-lg border border-white/5 text-center">
                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Custo</p>
                        <p className="text-[10px] text-white font-black">R$ {formatCurrency(customerMetrics.totalPrizeCost)}</p>
                      </div>
                      <div className="p-2 bg-black/40 rounded-lg border border-white/5 text-center">
                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Eficiência</p>
                        <p className="text-[10px] text-green-400 font-black">{customerMetrics.efficiency.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  {/* Progress Visualizer - ONLY FOR POINTS */}
                  {rules.rewardMode === 'points' && (
                    <>
                      <div className="flex gap-0.5 justify-center mb-3">
                        {[...Array(rules.purchasesForPrize || 10)].map((_, i) => (
                          <div 
                             key={i} 
                             className={cn(
                               "w-1.5 h-1.5 rounded-full",
                               i < foundCustomer.points ? "bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" : "bg-gray-800"
                             )} 
                          />
                        ))}
                      </div>

                      {foundCustomer.points >= (rules.purchasesForPrize || 10) && (
                        <div className="mt-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-1.5 text-primary font-black text-[10px] animate-pulse mb-2 uppercase tracking-widest">
                            <Trophy size={12} />
                            PRÊMIO DISPONÍVEL!
                          </div>
                          {!showRedeemConfirm ? (
                            <Button 
                              variant="secondary" 
                              className="w-full text-[10px] py-1.5 font-black uppercase tracking-widest"
                              onClick={() => setShowRedeemConfirm(true)}
                              disabled={isSubmitting}
                            >
                              Resgatar Prêmio
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[9px] text-center font-bold text-white uppercase">Confirmar resgate?</p>
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 text-[9px] py-1 border-gray-800 text-gray-400 font-black uppercase" onClick={() => setShowRedeemConfirm(false)}>Não</Button>
                                <Button variant="secondary" className="flex-1 text-[9px] py-1 font-black uppercase" onClick={handleRedeem}>Sim</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor da Compra (R$)</label>
                  {(rules.minPurchaseValue || 0) > 0 && (
                    <span className="text-[8px] text-primary font-bold uppercase tracking-tighter">Mín: R$ {formatCurrency(rules.minPurchaseValue || 0)}</span>
                  )}
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={cn(
                    "p-3 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest",
                    message.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                  )}
                >
                  {message.text}
                </motion.div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting || !foundCustomer} 
                className="w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              >
                {isSubmitting ? 'Processando...' : (rules.rewardMode === 'cashback' ? 'Confirmar Cashback' : 'Confirmar Pontos')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm outline-none focus:border-primary transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Celular</label>
                <PhoneInput
                  placeholder="Ex: +55 11 99999-9999"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="BR"
                  className="PhoneInput dark text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                <input 
                  type="date" 
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm outline-none focus:border-primary transition-all font-bold"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-3.5 font-black uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Cliente'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-[10px] text-gray-500 font-black uppercase tracking-widest py-2 hover:text-white transition-colors"
                >
                  Voltar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Home Indicator */}
        <div className="h-1.5 w-1/3 bg-gray-800 rounded-full mx-auto mb-2" />
      </div>

      {/* Desktop Sequential Flow Layout (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col items-center w-full max-w-5xl bg-white rounded-[3rem] p-16 shadow-2xl border border-gray-100 overflow-hidden relative min-h-[600px] justify-center">
        <AnimatePresence mode="wait">
          {!foundCustomer && !showRegister ? (
            <motion.div 
              key="step-phone"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full space-y-12 text-center"
            >
              <div className="space-y-4">
                <div className="w-32 h-32 bg-white rounded-[2rem] mx-auto shadow-2xl flex items-center justify-center overflow-hidden p-4 mb-4 border border-gray-100">
                  {appUser?.logoURL ? (
                    <img src={appUser.logoURL} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 size={48} className="text-primary" />
                  )}
                </div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">Digite o celular do cliente</h2>
                <p className="text-xl text-gray-400 font-medium tracking-tight">Utilize o número do WhatsApp para localizar ou cadastrar o cliente.</p>
              </div>
              <div className="max-w-2xl mx-auto p-4 bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 focus-within:border-primary transition-all shadow-inner scale-110">
                <PhoneInput
                  placeholder="Ex: +55 11 99999-9999"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="BR"
                  className="PhoneInput desktop-phone-input"
                  autoFocus
                />
              </div>

              {phone && phone.replace(/\D/g, '').length >= 10 && !foundCustomer && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="text-lg text-amber-600 font-bold">Cliente não localizado em nossa base de dados.</p>
                  <Button 
                    onClick={() => setShowRegister(true)}
                    className="px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20"
                  >
                    Cadastrar Novo Cliente
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : showRegister ? (
            <motion.div 
              key="step-register"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-2xl space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl border border-amber-100 mb-4">
                  <AlertCircle size={24} />
                  <span className="text-lg font-black uppercase tracking-widest">Cliente não encontrado!</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Realize o Cadastro</h2>
                <p className="text-lg text-gray-500 font-medium">É rápido! Apenas nome e data de nascimento para começar.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nome Completo</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nome do cliente"
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-xl outline-none focus:border-primary transition-all font-bold placeholder:text-gray-300"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-xl outline-none focus:border-primary transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => setPhone(undefined)}
                    className="flex-1 px-8 py-6 rounded-3xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all text-sm"
                  >
                    Voltar
                  </button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-[2] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-lg shadow-2xl shadow-primary/30"
                  >
                    {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : foundCustomer ? (
            <motion.div 
              key="step-score"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full flex gap-12 items-center"
            >
              <div className="flex-1 space-y-10">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden p-3 border border-gray-100">
                  {appUser?.logoURL ? (
                    <img src={appUser.logoURL} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 size={36} className="text-primary" />
                  )}
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-3 bg-green-50 text-green-600 px-6 py-3 rounded-2xl border border-green-100 mb-2">
                    <CheckCircle2 size={24} />
                    <span className="text-lg font-black uppercase tracking-widest">Cliente Identificado!</span>
                  </div>
                  <h2 className="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">{foundCustomer.name}</h2>
                  <div className="flex flex-col gap-2">
                    <p className="text-xl text-gray-500 font-bold tracking-tight">Saldo Atual:</p>
                    <div className="flex flex-wrap gap-4">
                      {foundCustomer.points > 0 && (
                        <div className={cn(
                          "px-4 py-2 rounded-2xl border transition-all",
                          rules.rewardMode === 'points' ? "bg-primary/10 border-primary/20" : "bg-gray-100 border-gray-200 opacity-60"
                        )}>
                          <p className={cn("text-xs font-black uppercase", rules.rewardMode === 'points' ? "text-primary" : "text-gray-500")}>
                            {rules.rewardMode === 'points' ? 'Pontos Atuais' : 'Pontos Acumulados'}
                          </p>
                          <p className={cn("text-2xl font-black leading-none", rules.rewardMode === 'points' ? "text-primary" : "text-gray-700")}>
                            {Math.floor(foundCustomer.points)} PTS
                          </p>
                        </div>
                      )}
                      {(foundCustomer.cashbackBalance || 0) > 0 && (
                        <div className={cn(
                          "px-4 py-2 rounded-2xl border transition-all",
                          rules.rewardMode === 'cashback' ? "bg-green-100 border-green-200" : "bg-gray-100 border-gray-200 opacity-60"
                        )}>
                          <p className={cn("text-xs font-black uppercase", rules.rewardMode === 'cashback' ? "text-green-600" : "text-gray-500")}>
                            {rules.rewardMode === 'cashback' ? 'Cashback Atual' : 'Cashback Acumulado'}
                          </p>
                          <p className={cn("text-2xl font-black leading-none", rules.rewardMode === 'cashback' ? "text-green-700" : "text-gray-700")}>
                            R$ {formatCurrency(foundCustomer.cashbackBalance || 0)}
                          </p>
                        </div>
                      )}
                      {foundCustomer.points <= 0 && (!foundCustomer.cashbackBalance || foundCustomer.cashbackBalance <= 0) && (
                        <p className="text-3xl font-black text-gray-200 uppercase tracking-tighter">Sem Saldo</p>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleScore} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Valor da Compra (R$)</label>
                    <div className="relative group">
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-350 text-4xl font-black opacity-30 group-focus-within:opacity-100 transition-all">R$</div>
                      <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-24 pr-8 py-8 bg-gray-50 border-4 border-gray-100 rounded-[2.5rem] text-6xl outline-none focus:border-primary transition-all font-black placeholder:text-gray-200 tracking-tighter"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !amount} 
                      className="w-full py-10 rounded-[3rem] font-black uppercase tracking-[0.3em] text-2xl shadow-3xl shadow-primary/40 relative overflow-hidden group/btn"
                    >
                      <span className="relative z-10">{isSubmitting ? 'Processando...' : (rules.rewardMode === 'cashback' ? 'Confirmar Cashback' : 'Confirmar Pontos')}</span>
                      <motion.div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Right Panel - Stats/Redeem */}
              <div className="w-96 space-y-6">
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                   <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-200 pb-4">Status no Programa</h3>
                   
                   {/* Customer Analytics Metrics */}
                   {customerMetrics && (
                     <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Custo ao Lojista</p>
                            <p className="text-lg font-black text-primary">R$ {formatCurrency(customerMetrics.totalPrizeCost)}</p>
                          </div>
                          <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Eficiência</p>
                            <p className="text-lg font-black text-green-600">{customerMetrics.efficiency.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">LTV (Total Consumido)</p>
                          <p className="text-lg font-black text-gray-900 tracking-tight">R$ {formatCurrency(customerMetrics.totalSpent)}</p>
                        </div>
                     </div>
                   )}

                   {/* Progress Visualizer/Cashback Info */}
                   <div className="space-y-4 pt-4 border-t border-gray-100">
                      {rules.rewardMode === 'points' && (
                        <>
                          <div className="grid grid-cols-5 gap-2">
                            {[...Array(rules.purchasesForPrize || 10)].map((_, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "aspect-square rounded-xl border-2 transition-all duration-300 transform",
                                  i < foundCustomer.points 
                                    ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-105" 
                                    : "bg-white border-gray-200"
                                )} 
                              >
                                {i < foundCustomer.points && <Check size={16} className="text-white m-auto mt-3" />}
                              </div>
                            ))}
                          </div>

                          {foundCustomer.points >= (rules.purchasesForPrize || 10) && (
                            <motion.div 
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="bg-primary text-white p-6 rounded-3xl shadow-2xl shadow-primary/30 space-y-4 text-center"
                            >
                              <Trophy size={48} className="mx-auto" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 decoration-white">PRÊMIO DISPONÍVEL</p>
                                <h2 className="text-xl font-black tracking-tight">{rules.rewardTiers?.sort((a,b) => b.points - a.points).find(t => foundCustomer.points >= t.points)?.prize || 'Brinde Especial'}</h2>
                              </div>
                              {!showRedeemConfirm ? (
                                <button 
                                  onClick={() => setShowRedeemConfirm(true)}
                                  className="w-full bg-white text-primary py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all font-bold"
                                >
                                  Resgatar Agora
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button onClick={() => setShowRedeemConfirm(false)} className="flex-1 bg-black/20 py-3 rounded-2xl font-black text-xs uppercase tracking-widest font-bold">Não</button>
                                  <button onClick={handleRedeem} className="flex-1 bg-white text-primary py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl font-bold">Confirmar</button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </>
                      )}

                      {rules.rewardMode === 'cashback' && (foundCustomer.cashbackBalance || 0) >= (rules.cashbackConfig?.minActivationValue || 0) && (
                        <div className="p-6 bg-green-50 rounded-3xl border border-green-100 text-center space-y-2">
                           <p className="text-xs font-black text-green-600 uppercase tracking-widest">Saldo de Cashback Disponível</p>
                           <p className="text-3xl font-black text-gray-900 tracking-tighter">R$ {formatCurrency(foundCustomer.cashbackBalance || 0)}</p>
                           <p className="text-[10px] text-gray-500 font-medium italic leading-tight">O cliente pode utilizar este valor para abater em novas compras.</p>
                           <Button onClick={() => setShowRedeemConfirm(true)} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl text-xs font-black">
                              Utilizar Cashback
                           </Button>
                        </div>
                      )}
                   </div>
                </div>

                <button 
                  onClick={() => setPhone(undefined)}
                  className="w-full py-4 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-red-500 transition-colors"
                >
                  Cancelar Atendimento
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Global Feedback Overlay */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md"
            >
              <div className={cn(
                "px-8 py-6 rounded-3xl shadow-2xl text-center flex items-center justify-center gap-4 border-2",
                message.type === 'success' ? "bg-green-600 text-white border-green-500 shadow-green-600/20" : "bg-red-600 text-white border-red-500 shadow-red-600/20"
              )}>
                {message.type === 'success' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                <p className="text-lg font-black uppercase tracking-tight">{message.text}</p>
                <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100"><X size={20}/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CustomersTab({ customers, purchases, isAdmin, rules, companyId }: { customers: Customer[]; purchases: Purchase[]; isAdmin: boolean; rules: LoyaltyRule; companyId: string | null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !companyId) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'customers', editingCustomer.id), {
        phone: editPhone,
        birthDate: editBirthDate
      });
      showToast("Dados do cliente atualizados com sucesso!", "success");
      setEditingCustomer(null);
    } catch (error) {
      showToast("Erro ao atualizar dados do cliente.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateRFV = (customer: Customer) => {
    const now = new Date();
    const lastPurchase = parseISO(customer.lastPurchaseDate || new Date().toISOString());
    const recency = differenceInDays(now, lastPurchase);
    
    const customerPurchases = purchases.filter(p => p.customerId === customer.id);
    const freq = customerPurchases.length;
    const value = customerPurchases.reduce((acc, p) => acc + p.amount, 0);
    
    return { recency, freq, value };
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const downloadTemplate = () => {
    const headers = [['Nome', 'Telefone', 'Data Nascimento (AAAA-MM-DD)', 'Email']];
    const ws = utils.aoa_to_sheet(headers);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Modelo Importacao");
    writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

  const handleExportXLSX = () => {
    const data = filteredCustomers.map(c => {
      const rfv = calculateRFV(c);
      return {
        'Nome': c.name,
        'Telefone': c.phone,
        'Pontos': c.points,
        'Última Compra': c.lastPurchaseDate,
        'R (Recência)': `${rfv.recency} dias`,
        'F (Frequência)': rfv.freq,
        'V (Valor Total)': rfv.value
      };
    });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Clientes");
    writeFile(wb, `clientes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws) as any[];
        
        const batchSize = 500;
        let processed = 0;

        for (let i = 0; i < data.length; i += batchSize) {
          const chunk = data.slice(i, i + batchSize);
          const batch = writeBatch(db);
          
          chunk.forEach(row => {
            const phone = String(row['Telefone'] || row['telefone'] || '').replace(/\D/g, '');
            if (!phone || !row['Nome']) return;
            
            const customerRef = doc(collection(db, 'customers'));
            batch.set(customerRef, {
              companyId,
              name: row['Nome'] || row['nome'],
              phone,
              email: row['Email'] || row['email'] || '',
              birthDate: row['Data Nascimento'] || row['Data Nascimento (AAAA-MM-DD)'] || '',
              points: 0,
              lastPurchaseDate: new Date().toISOString(),
              totalSpent: 0,
              purchasesCount: 0,
              createdAt: new Date().toISOString()
            });
          });
          
          await batch.commit();
          processed += chunk.length;
        }
        showToast(`${processed} clientes importados com sucesso!`, "success");
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error(error);
      showToast("Erro ao importar arquivo Excel.", "error");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Base de Clientes</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Gerencie seu público e veja indicadores RFV</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={downloadTemplate} variant="outline" className="text-[10px] font-black uppercase tracking-widest gap-2">
            <Download size={14} /> Template
          </Button>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Upload size={14} /> {isImporting ? 'Importando...' : 'Importar XLSX'}
            </div>
            <input type="file" accept=".xlsx, .xls" onChange={handleImportXLSX} className="hidden" disabled={isImporting} />
          </label>
          <Button onClick={handleExportXLSX} className="bg-primary text-white text-[10px] font-black uppercase tracking-widest gap-2">
            <ExternalLink size={14} /> Exportar XLSX
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-white border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => {
          const rfv = calculateRFV(customer);
          return (
            <Card key={customer.id} className="p-5 bg-white border-gray-100 shadow-sm group hover:border-primary/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{customer.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{customer.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {customer.points > 0 && (
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black">
                      {Math.floor(customer.points)} PTS
                    </div>
                  )}
                  {(customer.cashbackBalance || 0) > 0 && (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black">
                      R$ {formatCurrency(customer.cashbackBalance || 0)}
                    </div>
                  )}
                  {customer.points <= 0 && (!customer.cashbackBalance || customer.cashbackBalance <= 0) && (
                    <div className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-[10px] font-black">
                      0 PTS
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 bg-gray-50 rounded-xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Recência</p>
                  <p className="text-xs font-bold text-gray-900">{rfv.recency}d</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Frequência</p>
                  <p className="text-xs font-bold text-gray-900">{rfv.freq}x</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Valor</p>
                  <p className="text-xs font-bold text-gray-900">R${formatCurrency(rfv.value)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                <p className="text-[8px] text-gray-400 font-bold uppercase">Última: {format(parseISO(customer.lastPurchaseDate || new Date().toISOString()), 'dd/MM/yy')}</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                      setEditingCustomer(customer);
                      setEditPhone(customer.phone);
                      setEditBirthDate(customer.birthDate || '');
                    }}
                    className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-[10px] uppercase font-black"
                   >
                     <Edit size={14} /> Editar
                   </button>
                   <button className="text-blue-400 hover:text-blue-500 transition-colors"><MessageSquare size={16} /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Editar Cadastro</h3>
                <button onClick={() => setEditingCustomer(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Nome (Não editável)</label>
                  <input 
                    type="text" 
                    value={editingCustomer.name}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 font-sans">Telefone</label>
                  <PhoneInput
                    value={editPhone}
                    onChange={v => setEditPhone(v || '')}
                    defaultCountry="BR"
                    className="PhoneInput dark text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingCustomer(null)}
                    className="flex-1 py-4 font-black uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="flex-1 py-4 font-black uppercase tracking-widest text-xs"
                  >
                    {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GoalsTab({ goals, purchases, onUpdateRules, rules, isAdmin, companyId, onboardingStep, onOnboardingComplete }: { goals: Goal[]; purchases: Purchase[]; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; rules: LoyaltyRule; isAdmin: boolean; companyId: string | null; onboardingStep?: 'onboarding' | 'normal'; onOnboardingComplete?: () => void }) {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [value, setValue] = useState('');
  const [workingDays, setWorkingDays] = useState('22');
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboardingFinish, setShowOnboardingFinish] = useState(false);
  
  // Reference data state
  const [avgTicket, setAvgTicket] = useState(rules.currentAvgTicket?.toString() || '');
  const [monthlyRevenue, setMonthlyRevenue] = useState(rules.currentMonthlyRevenue?.toString() || '');

  const { showToast } = useToast();

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !month || !value) return;
    setIsSaving(true);
    try {
      const goalValue = parseFloat(value);
      const days = parseInt(workingDays) || 22;
      const existingGoal = goals.find(g => g.month === month);
      
      if (existingGoal) {
        await updateDoc(doc(db, 'goals', existingGoal.id), { 
          value: goalValue,
          workingDays: days
        });
      } else {
        await addDoc(collection(db, 'goals'), { 
          companyId, 
          month, 
          value: goalValue,
          workingDays: days
        });
      }
      
      setValue('');
      setWorkingDays('22');
      showToast("Meta salva com sucesso!", "success");

      if (onboardingStep === 'onboarding') {
        const nextCount = goals.length + (existingGoal ? 0 : 1);
        if (nextCount >= 12) {
          onOnboardingComplete?.();
        } else {
          const nextMonth = addMonths(parse(month, 'yyyy-MM', new Date()), 1);
          setMonth(format(nextMonth, 'yyyy-MM'));
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReference = async () => {
    setIsSaving(true);
    try {
      await onUpdateRules({
        ...rules,
        currentAvgTicket: parseFloat(avgTicket) || 0,
        currentMonthlyRevenue: parseFloat(monthlyRevenue) || 0
      });
      showToast("Dados de referência salvos!", "success");
    } catch (error) {
      showToast("Erro ao salvar referência.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishGoalsOnboarding = async () => {
    if (goals.length < 12) {
      showToast(`Você ainda precisa definir metas para mais ${12 - goals.length} meses.`, "warning");
      return;
    }
    if (parseFloat(avgTicket) <= 0 || parseFloat(monthlyRevenue) <= 0) {
      showToast("Por favor, preencha o Ticket Médio e o Faturamento Médio para finalizar.", "warning");
      return;
    }
    await handleSaveReference();
    setShowOnboardingFinish(true);
  };

  const activeClientsNeeded = useMemo(() => {
    const rev = parseFloat(monthlyRevenue) || 0;
    const tkt = parseFloat(avgTicket) || 0;
    return tkt > 0 ? Math.ceil(rev / tkt) : 0;
  }, [monthlyRevenue, avgTicket]);

  const sortedGoals = [...goals].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Metas Gerais</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Planejamento e Estatísticas Comparativas</p>
        </div>
        <Target className="text-primary" size={28} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-gray-900">Definir Meta de Faturamento</h3>
          </div>
          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês de Referência</label>
                <input 
                  type="month" 
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold outline-none focus:border-primary transition-all shadow-inner"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dias Úteis</label>
                <input 
                  type="number" 
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  placeholder="22"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold outline-none focus:border-primary transition-all shadow-inner"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Faturamento (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="number" 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className={cn(
                    "w-full bg-gray-50 border rounded-2xl pl-14 pr-6 py-4 text-gray-900 font-black text-xl outline-none transition-all shadow-inner",
                    onboardingStep === 'onboarding' && !value ? "border-amber-400 animate-pulse" : "border-gray-100 focus:border-primary"
                  )}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSaving || (onboardingStep === 'onboarding' && !value)} 
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all",
                (onboardingStep === 'onboarding' && !value) ? "opacity-30 cursor-not-allowed bg-gray-400" : "shadow-lg shadow-primary/20 shadow-primary/20"
              )}
            >
              {isSaving ? 'Gravando...' : (onboardingStep === 'onboarding' ? `Salvar Meta (${goals.length}/12)` : 'Salvar Meta Mensal')}
            </Button>
          </form>
        </Card>

        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-gray-900">Dados de Referência Atual</h3>
            <div className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded text-[8px] font-black uppercase tracking-widest">Estatísticas</div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ticket Médio Atual</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="number" 
                    value={avgTicket}
                    onChange={(e) => setAvgTicket(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-4 text-gray-900 font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Faturamento Médio Atual</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="number" 
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-4 text-gray-900 font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Cálculo de Clientes Ativos</p>
                <Users className="text-primary" size={16} />
              </div>
              <p className="text-3xl font-black text-gray-900 italic tracking-tighter">
                {activeClientsNeeded} <span className="text-xs font-bold text-gray-400 uppercase not-italic">Clientes</span>
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1 italic">Baseado no faturamento dividido pelo ticket médio.</p>
            </div>

            <Button onClick={handleFinishGoalsOnboarding} disabled={isSaving} variant="outline" className="w-full py-4 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase tracking-widest">
              {onboardingStep === 'onboarding' ? 'Próxima Etapa: Premiação' : (isSaving ? 'Gravando...' : 'Atualizar Referências')}
            </Button>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showOnboardingFinish && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md shadow-2xl space-y-6"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Parabéns!</h3>
                <p className="text-gray-500 font-medium">Agora vamos definir qual será o seu tipo de campanha.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => onOnboardingComplete?.()} className="w-full py-4">Vamos Lá</Button>
                <button onClick={handleLogout} className="text-gray-400 font-bold uppercase tracking-widest text-xs py-2">Deixar para depois</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Histórico de Metas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map(goal => {
            const realSales = purchases.filter(p => p.date.startsWith(goal.month)).reduce((acc, p) => acc + p.amount, 0);
            const percent = goal.value > 0 ? (realSales / goal.value) * 100 : 0;
            
            return (
              <Card key={goal.id} className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full" />
                <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${Math.min(percent, 100)}%` }} />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-gray-900 uppercase tracking-tighter text-lg">{format(parseISO(goal.month + '-01'), 'MMMM yyyy', { locale: ptBR })}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{goal.workingDays} dias úteis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{Math.round(percent)}%</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Meta: R$ {formatCurrency(goal.value)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Vendas Reais</p>
                    <p className="text-xl font-black text-gray-900 tracking-tighter italic">R$ {formatCurrency(realSales)}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Meta Diária</span>
                    <span className="text-[10px] text-gray-900 font-black">R$ {formatCurrency(goal.value / goal.workingDays)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function NotifyTab({ customers, rules, companyId }: { customers: Customer[]; rules: LoyaltyRule; companyId: string | null }) {
  const [filter, setFilter] = useState<'all' | 'inactivity_1w' | 'inactivity_2w' | 'inactivity_1m' | 'birthday_today' | 'birthday_week' | 'birthday_month' | 'prize_near_3' | 'prize_near_4'>('all');
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');

  const filteredCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      const lastPurchase = parseISO(c.lastPurchaseDate);
      const daysSince = differenceInDays(now, lastPurchase);
      
      const birthDate = c.birthDate ? parseISO(c.birthDate) : null;
      const isBirthdayToday = birthDate ? (birthDate.getMonth() === now.getMonth() && birthDate.getDate() === now.getDate()) : false;
      
      // Check prize/cashback near
      const tiers = [...(rules.rewardTiers || [])].sort((a, b) => a.points - b.points);
      const nextTier = tiers.find(t => t.points > c.points);
      const pointsNeeded = nextTier ? nextTier.points - c.points : 999;
      
      const minActivation = rules.cashbackConfig?.minActivationValue || 0;
      const currentCashback = c.cashbackBalance || 0;
      const cashbackNeeded = Math.max(0, minActivation - currentCashback);

      if (filter === 'inactivity_1w') return daysSince >= 7 && daysSince < 14;
      if (filter === 'inactivity_2w') return daysSince >= 14 && daysSince < 30;
      if (filter === 'inactivity_1m') return daysSince >= 30;
      if (filter === 'birthday_today') return isBirthdayToday;
      if (filter === 'birthday_week') {
        if (!birthDate) return false;
        const start = startOfDay(now);
        const end = endOfDay(subDays(now, -7));
        const bThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        return bThisYear >= start && bThisYear <= end;
      }
      if (filter === 'birthday_month') return birthDate ? birthDate.getMonth() === now.getMonth() : false;
      
      if (rules.rewardMode === 'points') {
        if (filter === 'prize_near_3') return pointsNeeded <= 3;
        if (filter === 'prize_near_4') return pointsNeeded <= 4;
      } else {
        if (filter === 'prize_near_3') return cashbackNeeded > 0 && cashbackNeeded <= 10;
        if (filter === 'prize_near_4') return cashbackNeeded > 10 && cashbackNeeded <= 20;
      }
      
      return true;
    });
  }, [customers, filter, rules]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleSendBulk = async () => {
    if (!companyId || selectedIds.size === 0) return;
    if (!customMessage.trim()) {
      alert("Por favor, escreva uma mensagem para enviar.");
      return;
    }

    setSending(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      
      selectedIds.forEach(id => {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          customerId: id,
          companyId,
          title: `Mensagem da ${rules.companyProfile?.companyName || 'Loja'} para você`,
          message: customMessage,
          type: 'manual',
          date: now,
          read: false
        });
      });

      await batch.commit();
      alert(`${selectedIds.size} notificações enviadas com sucesso!`);
      setCustomMessage('');
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error sending notifications:", error);
      alert("Erro ao enviar notificações.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Notificar Clientes</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Envie mensagens push diretamente para o WebApp dos seus clientes</p>
        </div>
      </div>

      {/* Bulk Message Area */}
      <Card className="p-6 bg-gray-900 border-gray-800 space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensagem Push Personalizada</label>
          <textarea 
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Escreva aqui a mensagem que seus clientes receberão no celular..."
            className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-medium outline-none focus:border-primary transition-all resize-none"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-all"
            >
              <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all", selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0 ? "bg-primary border-primary" : "border-gray-700")}>
                {selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0 && <Check size={14} className="text-white" />}
              </div>
              Selecionar Todos ({filteredCustomers.length})
            </button>
          </div>
          <Button 
            onClick={handleSendBulk}
            disabled={sending || selectedIds.size === 0 || !customMessage.trim()}
            className="px-8 py-3 rounded-2xl"
          >
            {sending ? 'Enviando...' : `Enviar para ${selectedIds.size} selecionados`}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-primary text-white" : "bg-gray-800 text-gray-400")}>Todos</button>
        <button onClick={() => setFilter('inactivity_1w')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'inactivity_1w' ? "bg-yellow-600 text-white" : "bg-gray-800 text-gray-400")}>+1 Semana Inativa</button>
        <button onClick={() => setFilter('inactivity_2w')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'inactivity_2w' ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400")}>+2 Semanas Inativas</button>
        <button onClick={() => setFilter('inactivity_1m')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'inactivity_1m' ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400")}>+1 Mês Inativo</button>
        <button onClick={() => setFilter('birthday_today')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'birthday_today' ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-400")}>Aniversário Hoje</button>
        <button onClick={() => setFilter('birthday_week')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'birthday_week' ? "bg-pink-600/50 text-white" : "bg-gray-800 text-gray-400")}>Aniversário na Semana</button>
        {rules.rewardMode === 'points' ? (
          <>
            <button onClick={() => setFilter('prize_near_3')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'prize_near_3' ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400")}>Faltam 3 Pontos</button>
            <button onClick={() => setFilter('prize_near_4')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'prize_near_4' ? "bg-green-600/50 text-white" : "bg-gray-800 text-gray-400")}>Faltam 4 Pontos</button>
          </>
        ) : (
          <>
            <button onClick={() => setFilter('prize_near_3')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'prize_near_3' ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400")}>Faltam R$ 10 p/ Resgate</button>
            <button onClick={() => setFilter('prize_near_4')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'prize_near_4' ? "bg-green-600/50 text-white" : "bg-gray-800 text-gray-400")}>Faltam R$ 20 p/ Resgate</button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <Card 
            key={customer.id} 
            onClick={() => toggleSelect(customer.id)}
            className={cn(
              "p-5 bg-gray-900 border-2 transition-all cursor-pointer",
              selectedIds.has(customer.id) ? "border-primary" : "border-gray-800"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all", selectedIds.has(customer.id) ? "bg-primary border-primary" : "border-gray-700")}>
                  {selectedIds.has(customer.id) && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <h4 className="text-white font-bold">{customer.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{customer.phone}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                {customer.points > 0 && (
                  <p className="text-xs font-black text-primary">
                    {Math.floor(customer.points)} PTS
                  </p>
                )}
                {(customer.cashbackBalance || 0) > 0 && (
                  <p className="text-xs font-black text-green-600">
                    R$ {formatCurrency(customer.cashbackBalance || 0)}
                  </p>
                )}
                {customer.points <= 0 && (!customer.cashbackBalance || customer.cashbackBalance <= 0) && (
                  <p className="text-xs font-black text-gray-400">0 PTS</p>
                )}
                
                <div className="mt-1 flex justify-end">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(() => {
                      const lastPurchase = parseISO(customer.lastPurchaseDate || new Date().toISOString());
                      const daysSince = differenceInDays(new Date(), lastPurchase);
                      
                      const pointsExpiry = (rules.maxDaysBetweenPurchases || rules.pointsExpiryDays || 999);
                      const pointsValid = daysSince <= pointsExpiry && customer.points > 0;

                      const cashbackExpiry = (rules.cashbackConfig?.expiryDays || 90);
                      const cashbackValid = daysSince <= cashbackExpiry && (customer.cashbackBalance || 0) > 0;

                      return (
                        <>
                          {customer.points > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-gray-400">P</span>
                              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white", pointsValid ? "bg-green-500" : "bg-red-500")}>
                                {pointsValid ? 'V' : 'E'}
                              </div>
                            </div>
                          )}
                          {(customer.cashbackBalance || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-gray-400">C</span>
                              <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white", cashbackValid ? "bg-green-500" : "bg-red-500")}>
                                {cashbackValid ? 'V' : 'E'}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
              <p>Última Compra: {format(parseISO(customer.lastPurchaseDate), 'dd/MM/yyyy')}</p>
              {customer.birthDate && <p>Aniversário: {format(parseISO(customer.birthDate), 'dd/MM')}</p>}
            </div>
          </Card>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Users className="text-gray-600" size={32} />
            </div>
            <p className="text-gray-500 font-bold">Nenhum cliente encontrado para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ purchases, customers, rules, goals, appUser }: { purchases: Purchase[]; customers: Customer[]; rules: LoyaltyRule; goals: Goal[]; appUser: AppUser | null }) {
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [detailView, setDetailView] = useState<'vendas' | 'clientes' | 'ticket' | null>(null);

  const filteredPurchases = useMemo(() => {
    const now = new Date();
    return purchases.filter(p => {
      const date = parseISO(p.date);
      if (period === 'today') return isToday(date);
      if (period === 'week') return isWithinInterval(date, { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) });
      if (period === 'month') return isWithinInterval(date, { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) });
      if (period === 'custom' && startDate && endDate) {
        return isWithinInterval(date, { 
          start: startOfDay(parseISO(startDate)), 
          end: endOfDay(parseISO(endDate)) 
        });
      }
      return period === 'all';
    });
  }, [purchases, period, startDate, endDate]);

  const stats = useMemo(() => {
    const totalValue = filteredPurchases.reduce((acc, p) => acc + p.amount, 0);
    const count = filteredPurchases.length;
    const avgTicket = count > 0 ? totalValue / count : 0;
    
    // Customers in the period (unique customers who bought)
    const uniqueCustomersInPeriod = new Set(filteredPurchases.map(p => p.customerId));
    const customerCountInPeriod = uniqueCustomersInPeriod.size;

    // Within vs Outside rules
    // Rule: minPurchaseValue
    const withinRules = filteredPurchases.filter(p => p.amount >= rules.minPurchaseValue).length;
    const outsideRules = count - withinRules;

    // Conversion rate: (total customers and sales) / (people who bought within rule)
    const uniqueCustomersWithinRules = new Set(filteredPurchases.filter(p => p.amount >= rules.minPurchaseValue).map(p => p.customerId)).size;
    const conversionRate = uniqueCustomersWithinRules > 0 ? (customers.length + purchases.length) / uniqueCustomersWithinRules : 0;

    const now = new Date();
    const todayP = purchases.filter(p => isToday(parseISO(p.date)));
    const weekP = purchases.filter(p => isWithinInterval(parseISO(p.date), { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) }));
    const biweekP = purchases.filter(p => isWithinInterval(parseISO(p.date), { start: startOfDay(subDays(now, 15)), end: endOfDay(now) }));

    const dailyAvg = todayP.length > 0 ? todayP.reduce((acc, p) => acc + p.amount, 0) / todayP.length : 0;
    const weeklyAvg = weekP.length > 0 ? weekP.reduce((acc, p) => acc + p.amount, 0) / weekP.length : 0;
    const biweeklyAvg = biweekP.length > 0 ? biweekP.reduce((acc, p) => acc + p.amount, 0) / biweekP.length : 0;

    const activeCustomersCount = rules.currentAvgTicket && rules.currentMonthlyRevenue ? Math.round(rules.currentMonthlyRevenue / rules.currentAvgTicket) : 0;

    return {
      totalValue,
      count,
      avgTicket,
      dailyAvg,
      weeklyAvg,
      biweeklyAvg,
      customerCount: customers.length,
      customerCountInPeriod,
      withinRules,
      outsideRules,
      conversionRate,
      activeCustomersCount
    };
  }, [filteredPurchases, purchases, customers, rules]);

  const monthlySalesData = useMemo(() => {
    const months: Record<string, number> = {};
    purchases.forEach(p => {
      const monthStr = format(parseISO(p.date), 'MM/yyyy');
      months[monthStr] = (months[monthStr] || 0) + p.amount;
    });
    return Object.entries(months)
      .map(([name, valor]) => ({ name, valor }))
      .sort((a, b) => {
        const [mA, yA] = a.name.split('/').map(Number);
        const [mB, yB] = b.name.split('/').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      })
      .slice(-12); // Last 12 months
  }, [purchases]);

  const ticketEvolutionData = useMemo(() => {
    const days: Record<string, { total: number, count: number, loyaltyTotal: number, loyaltyCount: number }> = {};
    
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayStr = format(d, 'dd/MM');
      days[dayStr] = { total: 0, count: 0, loyaltyTotal: 0, loyaltyCount: 0 };
    }

    purchases.forEach(p => {
      const dayStr = format(parseISO(p.date), 'dd/MM');
      if (days[dayStr]) {
        days[dayStr].total += p.amount;
        days[dayStr].count += 1;
        
        const customer = customers.find(c => c.id === p.customerId);
        if (customer && customer.points > 0) {
          days[dayStr].loyaltyTotal += p.amount;
          days[dayStr].loyaltyCount += 1;
        }
      }
    });

    return Object.entries(days).map(([name, data]) => ({
      name,
      total: data.count > 0 ? data.total / data.count : 0,
      loyalty: data.loyaltyCount > 0 ? data.loyaltyTotal / data.loyaltyCount : 0
    }));
  }, [purchases, customers]);

  const goalsComparisonData = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    
    // Group goals by month to avoid duplicates if they exist
    const uniqueGoals = Array.from(new Map(goals.map(g => [g.month, g])).values());

    return uniqueGoals.map(g => {
      const monthPurchases = purchases.filter(p => {
        try {
          return p.date && p.date.substring(0, 7) === g.month;
        } catch {
          return false;
        }
      });
      const actual = monthPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      let formattedName = g.month;
      try {
        formattedName = format(parseISO(g.month + '-01'), 'MMM/yy', { locale: ptBR });
      } catch (e) {
        console.error("Error formatting goal month:", e);
      }

      return {
        month: g.month,
        name: formattedName,
        planejado: g.value || 0,
        realizado: actual
      };
    }).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [goals, purchases]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = subDays(new Date(), i);
      const daysStr = format(d, 'dd/MM');
      const dayPurchases = purchases.filter(p => format(parseISO(p.date), 'dd/MM') === daysStr);
      return {
        name: daysStr,
        valor: dayPurchases.reduce((acc, p) => acc + p.amount, 0),
        vendas: dayPurchases.length
      };
    }).reverse();
    return last7Days;
  }, [purchases]);

  const ruleData = useMemo(() => {
    return [
      { name: 'Dentro da Regra', value: stats.withinRules },
      { name: 'Fora da Regra', value: stats.outsideRules }
    ];
  }, [stats]);

  const COLORS = ['#3B82F6', '#22C55E']; // Blue and Green

  const todayFormatted = format(new Date(), "'Hoje é dia' dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right hidden sm:block w-full">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status do Sistema</p>
          <div className="flex items-center gap-2 justify-end mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase">Online</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Olá, {appUser?.displayName?.split(' ')[0] || rules.companyProfile?.responsible?.split(' ')[0] || 'Administrador'}</h2>
          <p className="text-sm text-gray-500 mt-1">Bem-vindo ao seu Dashboard • {todayFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todo Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
        {period === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 bg-white border-gray-100 shadow-sm flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-500 uppercase">Início</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-500 uppercase">Fim</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Vendas" 
          value={stats.count} 
          icon={<Calendar size={16} />} 
          color="bg-blue-50 text-blue-600" 
          onClick={() => setDetailView(detailView === 'vendas' ? null : 'vendas')}
        />
        <StatCard 
          label="Valor Total" 
          value={`R$ ${formatCurrency(stats.totalValue)}`} 
          icon={<DollarSign size={16} />} 
          color="bg-green-50 text-green-600" 
          onClick={() => setDetailView(detailView === 'vendas' ? null : 'vendas')}
        />
        <StatCard 
          label="Ticket Médio" 
          value={`R$ ${formatCurrency(stats.avgTicket)}`} 
          icon={<TrendingUp size={16} />} 
          color="bg-purple-50 text-purple-600" 
          onClick={() => setDetailView(detailView === 'ticket' ? null : 'ticket')}
        />
        <StatCard 
          label="Clientes" 
          value={stats.customerCount} 
          icon={<Users size={16} />} 
          color="bg-orange-50 text-orange-600" 
          onClick={() => setDetailView(detailView === 'clientes' ? null : 'clientes')}
        />
      </div>

      <AnimatePresence>
        {detailView && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card className="p-6 bg-white border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {detailView === 'vendas' && <><Calendar size={20} className="text-blue-600" /> Detalhamento de Vendas</>}
                  {detailView === 'clientes' && <><Users size={20} className="text-orange-600" /> Detalhamento de Clientes</>}
                  {detailView === 'ticket' && <><TrendingUp size={20} className="text-purple-600" /> Detalhamento de Ticket Médio</>}
                </h3>
                <button onClick={() => setDetailView(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-x-auto">
                {detailView === 'vendas' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Pontos</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPurchases.map(p => (
                        <tr key={p.id} className="text-sm hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500">{format(parseISO(p.date), "dd/MM/yy HH:mm")}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{p.customerName}</td>
                          <td className="px-4 py-3 text-primary font-bold">R$ {formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-green-600">+{p.pointsEarned}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => {
                                askConfirmation(
                                  "Confirmar Exclusão",
                                  `Deseja realmente excluir esta venda de R$ ${formatCurrency(p.amount)}?`,
                                  async () => {
                                    try {
                                      await deleteDoc(doc(db, 'purchases', p.id));
                                      showToast("Venda excluída com sucesso!", "success");
                                    } catch (error) {
                                      console.error(error);
                                      showToast("Erro ao excluir venda.", "error");
                                    }
                                  },
                                  true
                                );
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                              title="Excluir Venda"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredPurchases.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">Nenhuma venda encontrada no período.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {detailView === 'clientes' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Celular</th>
                        <th className="px-4 py-3">Última Compra</th>
                        <th className="px-4 py-3">Total Compras</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customers.filter(c => {
                        const hasPurchase = filteredPurchases.some(p => p.customerId === c.id);
                        return period === 'all' ? true : hasPurchase;
                      }).map(c => {
                        const customerPurchases = purchases.filter(p => p.customerId === c.id);
                        return (
                          <tr key={c.id} className="text-sm hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                            <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                            <td className="px-4 py-3 text-gray-500">{c.lastPurchaseDate ? format(parseISO(c.lastPurchaseDate), "dd/MM/yy") : 'N/A'}</td>
                            <td className="px-4 py-3 text-primary font-bold">{customerPurchases.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {detailView === 'ticket' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ticket Médio Hoje</p>
                        <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(stats.dailyAvg)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ticket Médio Semanal</p>
                        <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(stats.weeklyAvg)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ticket Médio Quinzenal</p>
                        <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(stats.biweeklyAvg)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">
                      * O ticket médio é calculado dividindo o valor total das vendas pelo número de vendas no período selecionado.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Ticket Médio por Período</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Diário</span>
              <span className="text-sm font-bold text-gray-900">R$ {formatCurrency(stats.dailyAvg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Semanal</span>
              <span className="text-sm font-bold text-gray-900">R$ {formatCurrency(stats.weeklyAvg)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Quinzenal</span>
              <span className="text-sm font-bold text-gray-900">R$ {formatCurrency(stats.biweeklyAvg)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-gray-100 shadow-sm lg:col-span-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Vendas nos Últimos 7 Dias</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Bar dataKey="valor" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 bg-white border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Clientes no Período</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.customerCountInPeriod}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Total de clientes únicos que realizaram compras no período selecionado.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">Ticket Médio do Período</span>
            <span className="text-sm font-bold text-green-600">R$ {formatCurrency(stats.avgTicket)}</span>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Taxa de Conversão</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(2)}x</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Relação entre base total e vendas sobre clientes que compraram dentro da regra.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Venda Mês a Mês</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Bar dataKey="valor" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Evolução Ticket Médio Diário</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="total" name="Total Geral" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="loyalty" name="Clientes Fidelidade" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Metas: Planejado x Realizado</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="planejado" name="Planejado" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" name="Realizado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Distribuição por Regra</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ruleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ruleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  itemStyle={{ color: '#111827' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white border-gray-100 shadow-sm overflow-hidden">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Últimas Compras</h4>
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredPurchases.slice(0, 20).map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">{p.customerName}</p>
                <p className="text-[10px] text-gray-500">{format(parseISO(p.date), "dd/MM/yy HH:mm")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">R$ {formatCurrency(p.amount)}</p>
                {p.pointsEarned > 0 && <p className="text-[10px] text-green-600">+{p.pointsEarned} ponto(s)</p>}
                {(p as any).cashbackEarned > 0 && <p className="text-[10px] text-green-600">+R$ {formatCurrency((p as any).cashbackEarned)} cashback</p>}
              </div>
            </div>
          ))}
          {filteredPurchases.length === 0 && (
            <p className="text-center py-8 text-gray-500 text-sm">Nenhuma compra no período.</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color, onClick }: { label: string; value: string | number; icon: React.ReactNode; color: string; onClick?: () => void }) {
  return (
    <Card 
      className={cn(
        "p-4 space-y-2 bg-white border-gray-100 shadow-sm transition-all",
        onClick ? "cursor-pointer active:scale-95 hover:border-green-500/30" : ""
      )}
      onClick={onClick}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

function PromotionTab({ customers, purchases }: { customers: Customer[]; purchases: Purchase[] }) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | '7days' | '14days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredByDate = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      const customerPurchases = purchases.filter(p => p.customerId === c.id);
      if (customerPurchases.length === 0) return filterType === 'all';
      
      const lastPurchase = parseISO(customerPurchases.sort((a, b) => b.date.localeCompare(a.date))[0].date);
      
      if (filterType === '7days') return isWithinInterval(lastPurchase, { start: startOfDay(subDays(now, 7)), end: endOfDay(now) });
      if (filterType === '14days') return isWithinInterval(lastPurchase, { start: startOfDay(subDays(now, 14)), end: endOfDay(now) });
      if (filterType === '30days') return isWithinInterval(lastPurchase, { start: startOfDay(subDays(now, 30)), end: endOfDay(now) });
      if (filterType === 'custom' && startDate && endDate) {
        return isWithinInterval(lastPurchase, { 
          start: startOfDay(parseISO(startDate)), 
          end: endOfDay(parseISO(endDate)) 
        });
      }
      return true;
    });
  }, [customers, purchases, filterType, startDate, endDate]);

  const filtered = filteredByDate.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  useEffect(() => {
    // Auto-select filtered customers when filter changes
    setSelectedCustomers(filtered.map(c => c.id));
  }, [filterType, startDate, endDate, search]);

  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCustomers.length === filtered.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filtered.map(c => c.id));
    }
  };

  const sendWhatsApp = (customer: Customer) => {
    const phone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Envio WhatsApp</h2>
        <MessageSquare className="text-green-600" size={28} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white border-gray-100 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Selecionar Clientes ({selectedCustomers.length})</h3>
                <button 
                  onClick={toggleAll}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {selectedCustomers.length === filtered.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Filtro de Compra</label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Todos os Clientes</option>
                    <option value="7days">Últimos 7 dias</option>
                    <option value="14days">Últimos 14 dias</option>
                    <option value="30days">Últimos 30 dias</option>
                    <option value="custom">Período Personalizado</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrar clientes..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {filterType === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Início</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Fim</label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => toggleCustomer(c.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      selectedCustomers.includes(c.id) 
                        ? "bg-primary/10 border-primary" 
                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        selectedCustomers.includes(c.id) ? "bg-primary border-primary" : "border-gray-300"
                      )}>
                        {selectedCustomers.includes(c.id) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-500">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {c.points > 0 && (
                        <p className="text-xs font-black text-primary">
                          {Math.floor(c.points)} PTS
                        </p>
                      )}
                      {(c.cashbackBalance || 0) > 0 && (
                        <p className="text-xs font-black text-green-600">
                          R$ {formatCurrency(c.cashbackBalance || 0)}
                        </p>
                      )}
                      {!(c.points > 0) && !((c.cashbackBalance || 0) > 0) && (
                         <p className="text-xs font-black text-gray-400">0 PTS</p>
                      )}
                      <div className="mt-1 flex justify-end">
                        <div className="flex flex-wrap gap-2 justify-end">
                          {(() => {
                            const lastPurchase = parseISO(c.lastPurchaseDate || new Date().toISOString());
                            const daysSince = differenceInDays(new Date(), lastPurchase);
                            
                            // Points Expiry
                            const pointsExpiry = (rules.maxDaysBetweenPurchases || rules.pointsExpiryDays || 999);
                            const pointsValid = daysSince <= pointsExpiry && c.points > 0;

                            // Cashback Expiry
                            const cashbackExpiry = (rules.cashbackConfig?.expiryDays || 90);
                            const cashbackValid = daysSince <= cashbackExpiry && (c.cashbackBalance || 0) > 0;

                            return (
                              <>
                                {c.points > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-black uppercase text-gray-400">P</span>
                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white", pointsValid ? "bg-green-500" : "bg-red-500")}>
                                      {pointsValid ? 'V' : 'E'}
                                    </div>
                                  </div>
                                )}
                                {(c.cashbackBalance || 0) > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-black uppercase text-gray-400">C</span>
                                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white", cashbackValid ? "bg-green-500" : "bg-red-500")}>
                                      {cashbackValid ? 'V' : 'E'}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white border-gray-100 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Mensagem</h3>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="DIGITE SUA MENSAGEM..."
              className="w-full h-48 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-gray-400"
            />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <QrCode size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-600">
                  Ao clicar em enviar, você será redirecionado para o WhatsApp Web/App. Escaneie o QR Code se necessário.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {selectedCustomers.length > 0 ? (
                <Button 
                  onClick={() => {
                    // Send to the first selected customer
                    const firstId = selectedCustomers[0];
                    const customer = customers.find(c => c.id === firstId);
                    if (customer) sendWhatsApp(customer);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 font-bold py-4 text-white"
                >
                  <Send size={18} className="mr-2" />
                  Enviar para {selectedCustomers.length} Selecionados
                </Button>
              ) : (
                <Button disabled className="w-full bg-green-600 hover:bg-green-700 font-bold py-4 text-white opacity-50">
                  SELECIONE CLIENTES PARA ENVIAR
                </Button>
              )}
              <p className="text-[10px] text-gray-500 text-center">
                O envio será feito individualmente via WhatsApp.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function RewardedCustomersTab({ customers, rules }: { customers: Customer[]; rules: LoyaltyRule }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [rewardSearch, setRewardSearch] = useState('');

  const tiers = useMemo(() => {
    return (rules.rewardTiers || []).sort((a, b) => b.points - a.points);
  }, [rules.rewardTiers]);

  const rewardedCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(rewardSearch.toLowerCase()) || 
                             c.phone.includes(rewardSearch);
        return matchesSearch;
      })
      .sort((a, b) => {
        if (rules.rewardMode === 'cashback') return (b.cashbackBalance || 0) - (a.cashbackBalance || 0);
        return b.points - a.points;
      });
  }, [customers, rules.rewardMode, rewardSearch]);

  const selectedCustomer = useMemo(() => {
    return rewardedCustomers.find(c => c.id === selectedCustomerId) || rewardedCustomers[0];
  }, [rewardedCustomers, selectedCustomerId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Clientes Premiados</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Visualize e gere o cartão fidelidade</p>
        </div>
        <Award className="text-yellow-500" size={28} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loyalty Card Visualization */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cartão Fidelidade Digital</h3>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text"
                placeholder="Buscar cliente..."
                value={rewardSearch}
                onChange={(e) => setRewardSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>
          
          <div className="relative aspect-[1.586/1] w-full max-w-md mx-auto">
            {/* The Card Body */}
            <motion.div 
              key={selectedCustomer?.id}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="w-full h-full bg-black rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Background Patterns */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full -ml-24 -mb-24 blur-2xl" />
              
              {/* Card Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                    {rules.companyProfile?.logoURL ? (
                      <img src={rules.companyProfile.logoURL} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="text-primary" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      {rules.campaignName || 'Programa de Fidelidade'}
                    </p>
                    <p className="text-xs font-bold text-white/60 uppercase">
                      {rules.companyProfile?.tradingName || rules.companyProfile?.companyName || 'Sua Empresa'}
                    </p>
                  </div>
                </div>
                <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <Trophy size={20} className="text-yellow-500" />
                </div>
              </div>

              {/* Card Middle - Chip and Name Stripe */}
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-10 bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="grid grid-cols-2 gap-1 w-full h-full p-1 opacity-40">
                    <div className="border border-black/20 rounded-sm" />
                    <div className="border border-black/20 rounded-sm" />
                    <div className="border border-black/20 rounded-sm" />
                    <div className="border border-black/20 rounded-sm" />
                  </div>
                </div>
                
                <div className="h-12 bg-green-600 flex items-center px-6 -mx-8 shadow-inner">
                  <p className="text-white font-black text-lg tracking-widest uppercase truncate w-full">
                    {selectedCustomer?.name || 'NOME DO CLIENTE'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-2">
                  {selectedCustomer?.points > 0 && (
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Pontuação Acumulada</p>
                      <p className="text-xl font-black text-white tracking-tighter leading-none">
                        {Math.floor(selectedCustomer.points)} <span className="text-xs font-bold text-primary ml-1">PTS</span>
                      </p>
                    </div>
                  )}
                  {(selectedCustomer?.cashbackBalance || 0) > 0 && (
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Cashback Atual</p>
                      <p className="text-xl font-black text-white tracking-tighter leading-none">
                        R$ {formatCurrency(selectedCustomer?.cashbackBalance || 0)}
                      </p>
                    </div>
                  )}
                  {!selectedCustomer?.points && !(selectedCustomer?.cashbackBalance > 0) && (
                    <p className="text-xl font-black text-white/20 uppercase tracking-widest">Sem Saldo</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Status do Prêmio</p>
                  <p className="text-xs font-black text-green-500 uppercase">
                    {rules.rewardMode === 'cashback' 
                      ? ((selectedCustomer?.cashbackBalance || 0) >= (rules.cashbackConfig?.minActivationValue || 0) ? 'RESGATE DISPONÍVEL' : 
                         `FALTAM R$ ${formatCurrency(Math.max(0, (rules.cashbackConfig?.minActivationValue || 0) - (selectedCustomer?.cashbackBalance || 0)))}`)
                      : (tiers.find(t => (selectedCustomer?.points || 0) >= t.points)?.prize || 'EM PROGRESSO')}
                  </p>
                </div>
              </div>

              {/* Expiration and Rescue Info */}
              <div className="px-8 mt-2 relative z-10 flex justify-between items-center bg-white/5 backdrop-blur-sm py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-white/60" />
                  <p className="text-[8px] font-bold text-white/80 uppercase">
                    {(() => {
                      const lastPurchase = parseISO(selectedCustomer?.lastPurchaseDate || new Date().toISOString());
                      const daysSince = differenceInDays(new Date(), lastPurchase);
                      
                      // Show expiry for the active mode's balance, or the primary one if both exist
                      const activeProgram = rules.rewardMode;
                      const hasPoints = (selectedCustomer?.points || 0) > 0;
                      const hasCashback = (selectedCustomer?.cashbackBalance || 0) > 0;
                      
                      const pointsExpiry = (rules.maxDaysBetweenPurchases || rules.pointsExpiryDays || 999);
                      const cashbackExpiry = (rules.cashbackConfig?.expiryDays || 90);
                      
                      let expiry = activeProgram === 'cashback' ? cashbackExpiry : pointsExpiry;
                      
                      // If the selected mode has no balance but the other does, show other's expiry
                      if (activeProgram === 'cashback' && !hasCashback && hasPoints) expiry = pointsExpiry;
                      if (activeProgram === 'points' && !hasPoints && hasCashback) expiry = cashbackExpiry;

                      const remaining = Math.max(0, expiry - daysSince);
                      return `Expira em: ${remaining} dias`;
                    })()}
                  </p>
                </div>
                {rules.rewardMode === 'cashback' && (selectedCustomer?.cashbackBalance || 0) < (rules.cashbackConfig?.minActivationValue || 0) && (
                  <p className="text-[8px] font-black text-yellow-500 uppercase">
                    Faltam R$ {formatCurrency(Math.max(0, (rules.cashbackConfig?.minActivationValue || 0) - (selectedCustomer?.cashbackBalance || 0)))} p/ resgate
                  </p>
                )}
                {rules.rewardMode === 'points' && (selectedCustomer?.points || 0) < (tiers[tiers.length - 1]?.points || 0) && (
                  <p className="text-[8px] font-black text-yellow-500 uppercase">
                     Faltam {Math.max(0, (tiers[tiers.length - 1]?.points || 0) - (selectedCustomer?.points || 0))} pts p/ prêmio
                  </p>
                )}
              </div>

              {/* Holographic Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          </div>

          <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Cartão Fidelidade Digital</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Este cartão é gerado dinamicamente para cada cliente que atinge a pontuação necessária. 
                  Você pode tirar um print e enviar para o cliente via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* List of Rewarded Customers */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Selecione um Cliente</h3>
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {rewardedCustomers.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCustomerId(c.id)}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-4 transition-all text-left",
                  (selectedCustomerId === c.id || (!selectedCustomerId && rewardedCustomers[0]?.id === c.id))
                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                    : "bg-white border-gray-100 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  (selectedCustomerId === c.id || (!selectedCustomerId && rewardedCustomers[0]?.id === c.id))
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-yellow-500"
                )}>
                  <Trophy size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                    <a 
                      href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${c.name} você tem ${rules.rewardMode === 'cashback' ? `R$ ${formatCurrency(c.cashbackBalance || 0)} de cashback` : `${Math.floor(c.points)} pontos`} disponível em nosso programa de fidelidade. Venha em nossa loja e resgate seu prêmio.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-500 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle size={16} />
                    </a>
                  </div>
                  <p className="text-[10px] text-gray-500">{c.phone}</p>
                  <div className="mt-1 inline-flex items-center gap-2">
                    {rules.rewardMode === 'points' ? (
                      <div className="px-2 py-0.5 rounded-full bg-yellow-500 border border-yellow-500 text-[10px] font-black text-white uppercase shadow-lg">
                        {tiers.find(t => c.points >= t.points)?.prize || 'Em Progressso'}
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded-full bg-green-600 border border-green-600 text-[10px] font-black text-white uppercase shadow-lg">
                        Cashback Ativo
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-black text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex flex-col items-end leading-tight">
                    {c.points > 0 && <span className="text-primary text-xs">{Math.floor(c.points)} PTS</span>}
                    {(c.cashbackBalance || 0) > 0 && <span className="text-green-700 text-xs">R$ {formatCurrency(c.cashbackBalance || 0)}</span>}
                    {!(c.points > 0) && !((c.cashbackBalance || 0) > 0) && <span className="text-gray-400 text-xs">0 PTS</span>}
                  </p>
                  <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">
                    SALDO ATUAL
                  </p>
                </div>
              </button>
            ))}
            {rewardedCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <Award className="mx-auto mb-3 opacity-20" size={48} />
                <p className="text-sm italic">Nenhum cliente atingiu as faixas de premiação ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RewardsTab({ rules, goals, customers, isAdmin, onUpdateRules, onboardingMode, onOnboardingFinish, companyId }: { rules: LoyaltyRule; goals: Goal[]; customers: Customer[]; isAdmin: boolean; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; onboardingMode?: boolean; onOnboardingFinish?: () => void; companyId: string | null }) {
  const [localTiers, setLocalTiers] = useState<RewardTier[]>(rules.rewardTiers || [{ points: 10, prize: 'Prêmio Padrão', expiryDays: 30 }]);
  const [minPurchaseValue, setMinPurchaseValue] = useState(rules.minPurchaseValue || 0);
  const [extraPointsThreshold, setExtraPointsThreshold] = useState(rules.extraPointsThreshold || 0);
  const [extraPointsAmount, setExtraPointsAmount] = useState(rules.extraPointsAmount || 0);
  const [rewardMode, setRewardMode] = useState<'points' | 'cashback'>(rules.rewardMode || 'points');
  const [cashbackConfig, setCashbackConfig] = useState(rules.cashbackConfig || {
    percentage: 5,
    minActivationValue: 0,
    minRedeemDays: 0,
    expiryDays: 90
  });
  
  const [pointsStatus, setPointsStatus] = useState<ProgramStatus>(rules.pointsStatus || { status: 'active', validityType: 'indeterminate' });
  const [cashbackStatus, setCashbackStatus] = useState<ProgramStatus>(rules.cashbackStatus || { status: 'ended', validityType: 'indeterminate' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState('');
  const [isLocked, setIsLocked] = useState(!onboardingMode);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const { showToast } = useToast();
  const { askConfirmation } = useConfirm();

  const handleNotifyCustomers = async (type: 'paused' | 'ended', programName: string) => {
    if (!companyId || customers.length === 0) return;
    
    const title = type === 'paused' ? 'Programa Pausado' : 'Programa Encerrado';
    const message = type === 'paused' 
      ? `O programa ${programName} foi pausado. Você tem 30 dias para realizar seus resgates na loja.`
      : `O programa ${programName} foi encerrado. Você tem 30 dias para realizar seus resgates na loja.`;

    try {
      const batch = writeBatch(db);
      customers.forEach(customer => {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          customerId: customer.id,
          companyId,
          title,
          message,
          type: type === 'paused' ? 'inactivity' : 'points',
          date: new Date().toISOString(),
          read: false
        });
      });
      await batch.commit();
      showToast(`Notificação enviada para ${customers.length} clientes.`, "success");
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      showToast("Erro ao notificar clientes.", "error");
    }
  };

  const handleProgramAction = async (action: 'pause' | 'end') => {
    if (!isAdmin || isLocked) return;
    
    const programName = rewardMode === 'points' ? 'Pontos' : 'Cashback';
    const newStatus = action === 'pause' ? 'paused' : 'ended';
    
    askConfirmation(
      action === 'pause' ? 'Pausar Programa' : 'Encerrar Programa',
      `Tem certeza que deseja ${action === 'pause' ? 'pausar' : 'encerrar'} o programa de ${programName}? Os clientes serão notificados.`,
      async () => {
        setIsSaving(true);
        try {
          const updatedRules = { ...rules };
          if (rewardMode === 'points') {
            updatedRules.pointsStatus = { ...pointsStatus, status: newStatus };
            setPointsStatus(updatedRules.pointsStatus);
          } else {
            updatedRules.cashbackStatus = { ...cashbackStatus, status: newStatus };
            setCashbackStatus(updatedRules.cashbackStatus);
          }
          
          await onUpdateRules(updatedRules);
          await handleNotifyCustomers(newStatus as any, programName);
          showToast(`Programa de ${programName} ${newStatus === 'paused' ? 'pausado' : 'encerrado'}.`, "success");
        } catch (error) {
          console.error("Error updating program status:", error);
        } finally {
          setIsSaving(false);
        }
      },
      action === 'end'
    );
  };

  const addTier = () => {
    if (!isAdmin || isLocked) return;
    setLocalTiers([...localTiers, { points: 0, prize: '', expiryDays: 30, cost: 0 }]);
  };

  const removeTier = (index: number) => {
    if (!isAdmin || isLocked) return;
    setLocalTiers(localTiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof RewardTier, value: any) => {
    if (!isAdmin || isLocked) return;
    const newTiers = [...localTiers];
    newTiers[index] = { 
      ...newTiers[index], 
      [field]: (field === 'points' || field === 'expiryDays' || field === 'cost') ? parseFloat(value) || 0 : value 
    };
    setLocalTiers(newTiers);
  };

  const handleSaveAttempt = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!isAdmin || isLocked) return;
    
    if (onboardingMode) {
      setIsSaving(true);
      try {
        const updatedRules = { 
          ...rules, 
          rewardTiers: localTiers,
          minPurchaseValue,
          extraPointsThreshold,
          extraPointsAmount,
          rewardMode,
          cashbackConfig
        };
        await onUpdateRules(updatedRules);
        setShowSuccess(true);
        setIsLocked(true);
        setTimeout(() => {
          setShowSuccess(false);
          onOnboardingFinish?.();
        }, 1500);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'configs');
      } finally {
        setIsSaving(false);
      }
    } else {
      setShowReauth(true);
    }
  };

  const handleConfirmSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setReauthError('');
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser!.email!, reauthPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      const updatedRules = { 
        ...rules, 
        rewardTiers: localTiers,
        minPurchaseValue,
        extraPointsThreshold,
        extraPointsAmount,
        rewardMode,
        cashbackConfig,
        pointsStatus,
        cashbackStatus
      };
      await onUpdateRules(updatedRules);
      setShowSuccess(true);
      setShowReauth(false);
      setReauthPassword('');
      setIsLocked(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setReauthError('Senha incorreta.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, 'configs');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Configurar Campanha</h2>
          <Trophy className="text-green-500" size={28} />
        </div>
        {isAdmin && (
          <button 
            onClick={() => isLocked ? setShowUnlockConfirm(true) : setIsLocked(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
              isLocked ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-100 text-green-600 hover:bg-green-200"
            )}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            {isLocked ? 'Desbloquear Edição' : 'Bloquear Edição'}
          </button>
        )}
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Modelo de Campanha Objetivo</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  if (pointsStatus.status === 'ended' && cashbackStatus.status === 'ended') {
                    setRewardMode('points');
                    setPointsStatus({ ...pointsStatus, status: 'active' });
                  } else if (rewardMode === 'cashback' && cashbackStatus.status === 'ended') {
                    setRewardMode('points');
                    if (pointsStatus.status === 'ended') setPointsStatus({ ...pointsStatus, status: 'active' });
                  } else {
                    showToast("Você precisa encerrar o programa atual antes de configurar outro.", "warning");
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left group relative",
                  rewardMode === 'points' ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50 opacity-50 grayscale"
                )}
                disabled={isLocked || (rewardMode === 'cashback' && cashbackStatus.status !== 'ended')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", rewardMode === 'points' ? "bg-primary text-white" : "bg-gray-200 text-gray-400")}>
                    <Award size={20} />
                  </div>
                  {rewardMode === 'points' && pointsStatus.status === 'active' && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  {rewardMode === 'points' && pointsStatus.status === 'paused' && <Pause size={16} className="text-amber-500" />}
                </div>
                <h4 className="font-bold text-gray-900">Programa de Pontos</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">Clientes acumulam pontos em cada compra e trocam por prêmios definidos.</p>
                {rewardMode === 'points' && pointsStatus.status === 'paused' && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-full">Pausado</span>
                )}
              </button>

              <button 
                onClick={() => {
                  if (pointsStatus.status === 'ended' && cashbackStatus.status === 'ended') {
                    setRewardMode('cashback');
                    setCashbackStatus({ ...cashbackStatus, status: 'active' });
                  } else if (rewardMode === 'points' && pointsStatus.status === 'ended') {
                    setRewardMode('cashback');
                    if (cashbackStatus.status === 'ended') setCashbackStatus({ ...cashbackStatus, status: 'active' });
                  } else {
                    showToast("Você precisa encerrar o programa atual antes de configurar outro.", "warning");
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left group relative",
                  rewardMode === 'cashback' ? "border-green-600 bg-green-50" : "border-gray-100 bg-gray-50 opacity-50 grayscale"
                )}
                disabled={isLocked || (rewardMode === 'points' && pointsStatus.status !== 'ended')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", rewardMode === 'cashback' ? "bg-green-600 text-white" : "bg-gray-200 text-gray-400")}>
                    <DollarSign size={20} />
                  </div>
                  {rewardMode === 'cashback' && cashbackStatus.status === 'active' && <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />}
                  {rewardMode === 'cashback' && cashbackStatus.status === 'paused' && <Pause size={16} className="text-amber-500" />}
                </div>
                <h4 className="font-bold text-gray-900">Cashback</h4>
                <p className="text-[10px] text-gray-500 leading-tight mt-1">Clientes recebem um percentual do valor gasto de volta como saldo na loja.</p>
                {rewardMode === 'cashback' && cashbackStatus.status === 'paused' && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-full">Pausado</span>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Program Controls and Validity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Settings size={16} />
                Status e Validade do Programa
              </h3>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleProgramAction('pause')} 
                  disabled={isLocked || (rewardMode === 'points' ? pointsStatus.status !== 'active' : cashbackStatus.status !== 'active')}
                  className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl py-4"
                >
                  <Pause size={18} className="mr-2" />
                  Pausar Programa
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleProgramAction('end')} 
                  disabled={isLocked || (rewardMode === 'points' ? pointsStatus.status === 'ended' : cashbackStatus.status === 'ended')}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 rounded-xl py-4"
                >
                  <XCircle size={18} className="mr-2" />
                  Encerrar Programa
                </Button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Validade do Programa</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'custom', label: 'Calendário' },
                    { id: '180days', label: '180 Dias' },
                    { id: '365days', label: '365 Dias' },
                    { id: 'indeterminate', label: 'Indeterminado' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const newStatus = { ...(rewardMode === 'points' ? pointsStatus : cashbackStatus), validityType: opt.id as any };
                        if (rewardMode === 'points') setPointsStatus(newStatus);
                        else setCashbackStatus(newStatus);
                      }}
                      disabled={isLocked}
                      className={cn(
                        "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                        (rewardMode === 'points' ? pointsStatus.validityType : cashbackStatus.validityType) === opt.id
                         ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {(rewardMode === 'points' ? pointsStatus.validityType : cashbackStatus.validityType) === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Início</label>
                      <input 
                        type="date" 
                        value={(rewardMode === 'points' ? pointsStatus.startDate : cashbackStatus.startDate) || ''}
                        onChange={(e) => {
                          const newStatus = { ...(rewardMode === 'points' ? pointsStatus : cashbackStatus), startDate: e.target.value };
                          if (rewardMode === 'points') setPointsStatus(newStatus);
                          else setCashbackStatus(newStatus);
                        }}
                        disabled={isLocked}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Término</label>
                      <input 
                        type="date" 
                        value={(rewardMode === 'points' ? pointsStatus.endDate : cashbackStatus.endDate) || ''}
                        onChange={(e) => {
                          const newStatus = { ...(rewardMode === 'points' ? pointsStatus : cashbackStatus), endDate: e.target.value };
                          if (rewardMode === 'points') setPointsStatus(newStatus);
                          else setCashbackStatus(newStatus);
                        }}
                        disabled={isLocked}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col justify-center">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                  <Info size={24} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Regras de Ativação</h4>
                  <ul className="text-[10px] text-blue-800 font-medium space-y-2 leading-relaxed">
                    <li>• Apenas 01 programa pode estar ATIVO por vez.</li>
                    <li>• "Pausar" suspende o acúmulo temporariamente, mas bloqueia troca de modelo.</li>
                    <li>• "Encerrar" libera a configuração de um NOVO modelo de fidelidade.</li>
                    <li>• Todos os campos são de preenchimento OBRIGATÓRIO para garantir a integridade do sistema.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {rewardMode === 'points' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    Valor Mínimo para Pontuar
                    <span className="text-green-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <input 
                      type="number" 
                      value={minPurchaseValue}
                      onChange={(e) => setMinPurchaseValue(parseFloat(e.target.value) || 0)}
                      disabled={isLocked}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Meta pontos Extra (R$)</label>
                  <input 
                    type="number" 
                    value={extraPointsThreshold}
                    onChange={(e) => setExtraPointsThreshold(parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qtd Pontos Extra</label>
                  <input 
                    type="number" 
                    value={extraPointsAmount}
                    onChange={(e) => setExtraPointsAmount(parseInt(e.target.value) || 0)}
                    disabled={isLocked}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Faixas de Premiação</h3>
                {isAdmin && !isLocked && (
                  <button onClick={addTier} type="button" className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                    <PlusCircle size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {localTiers.map((tier, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl items-end sm:items-center">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Pontos</label>
                      <input type="number" value={tier.points} onChange={(e) => updateTier(index, 'points', e.target.value)} disabled={isLocked} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    <div className="flex-[2] space-y-1.5 w-full">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Prêmio</label>
                      <input type="text" value={tier.prize} onChange={(e) => updateTier(index, 'prize', e.target.value)} disabled={isLocked} placeholder="Ex: Vale Compras R$ 50" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Custo (R$)</label>
                      <input type="number" value={tier.cost || 0} onChange={(e) => updateTier(index, 'cost', e.target.value)} disabled={isLocked} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Dias/Expira</label>
                      <input type="number" value={tier.expiryDays || 30} onChange={(e) => updateTier(index, 'expiryDays', e.target.value)} disabled={isLocked} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    {isAdmin && !isLocked && localTiers.length > 1 && (
                      <button type="button" onClick={() => removeTier(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Percentual de Cashback (%)</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    <input 
                      type="number" 
                      value={cashbackConfig.percentage}
                      onChange={(e) => setCashbackConfig({...cashbackConfig, percentage: parseFloat(e.target.value) || 0})}
                      disabled={isLocked}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Mínimo p/ Ativação</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={cashbackConfig.minActivationValue}
                      onChange={(e) => setCashbackConfig({...cashbackConfig, minActivationValue: parseFloat(e.target.value) || 0})}
                      disabled={isLocked}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Estimated cost box */}
                <div className="md:col-span-2 p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Calculator size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Custo Aproximado do Programa</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">
                      R$ {formatCurrency(
                        (() => {
                          const currentMonthStr = format(new Date(), 'yyyy-MM');
                          const currentGoal = goals.find(g => g.month === currentMonthStr)?.value || 0;
                          const billing = currentGoal || 0;
                          const factor = cashbackConfig.minActivationValue > 0 ? (billing / cashbackConfig.minActivationValue) : 0;
                          return factor * (cashbackConfig.percentage);
                        })()
                      )}
                    </p>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Mensal Estimado</span>
                  </div>
                  <p className="text-[9px] text-amber-600 leading-tight">
                    Fórmula solicitada: (Faturamento Mensal Planejado / Valor Mínimo de Ativação) * Valor do Cashback.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prazo Mínimo p/ Resgate (Dias)</label>
                  <input 
                    type="number" 
                    value={cashbackConfig.minRedeemDays}
                    onChange={(e) => setCashbackConfig({...cashbackConfig, minRedeemDays: parseInt(e.target.value) || 0})}
                    disabled={isLocked}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Validade do Cashback (Dias)</label>
                  <input 
                    type="number" 
                    value={cashbackConfig.expiryDays}
                    onChange={(e) => setCashbackConfig({...cashbackConfig, expiryDays: parseInt(e.target.value) || 0})}
                    disabled={isLocked}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveAttempt}
              disabled={isSaving || isLocked}
              className="px-8 py-3 rounded-xl font-black uppercase tracking-widest"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showUnlockConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Desbloquear Edição</h3>
              <p className="text-sm text-gray-500 mb-8">Cuidado ao alterar as regras, isso impacta a pontuação atual dos seus clientes.</p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowUnlockConfirm(false)}>Cancelar</Button>
                <Button className="flex-1 bg-green-600" onClick={() => { setIsLocked(false); setShowUnlockConfirm(false); }}>Desbloquear</Button>
              </div>
            </motion.div>
          </div>
        )}

        {showReauth && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Confirmar Alterações</h3>
              <input 
                type="password" 
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4 outline-none"
                placeholder="Sua senha"
              />
              {reauthError && <p className="text-xs text-red-500 mb-4">{reauthError}</p>}
              <Button onClick={handleConfirmSave} className="w-full">Confirmar e Salvar</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SeasonalDatesTab({ rules, isAdmin, onTabChange, onUpdateRules }: { rules: LoyaltyRule; isAdmin: boolean; onTabChange: (tab: any) => void; onUpdateRules: (rules: LoyaltyRule) => Promise<void> }) {
  const [dates, setDates] = useState<SeasonalDate[]>(rules.seasonalDates || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState<Partial<SeasonalDate>>({ type: 'custom' });

  const handleSave = async (updatedDates: SeasonalDate[]) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const updatedRules = { ...rules, seasonalDates: updatedDates };
      await onUpdateRules(updatedRules);
      setDates(updatedDates);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'configs');
    } finally {
      setIsSaving(false);
    }
  };

  const addDate = () => {
    if (!newDate.name || !newDate.date) return;
    const date: SeasonalDate = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDate.name,
      date: newDate.date,
      type: newDate.type as any,
      state: newDate.state,
      city: newDate.city
    };
    const updated = [...dates, date].sort((a, b) => a.date.localeCompare(b.date));
    handleSave(updated);
    setShowAddModal(false);
    setNewDate({ type: 'custom' });
  };

  const removeDate = (id: string) => {
    const updated = dates.filter(d => d.id !== id);
    handleSave(updated);
  };

  const groupedDates = useMemo(() => {
    const groups: { [key: string]: SeasonalDate[] } = {
      'Nacionais': dates.filter(d => d.type === 'national'),
      'Estaduais': dates.filter(d => d.type === 'state'),
      'Municipais': dates.filter(d => d.type === 'municipal'),
      'Personalizadas': dates.filter(d => d.type === 'custom'),
    };
    return groups;
  }, [dates]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-24 lg:pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Datas Sazonais</h2>
        <Calendar className="text-white" size={28} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedDates).map(([group, items]: [string, SeasonalDate[]]) => (
          <Card key={group} className="p-6 bg-white border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
              {group}
              <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-500">{items.length}</span>
            </h3>
            <div className="space-y-3">
              {items.map((d: SeasonalDate) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
                      <span className="text-[10px] font-bold uppercase leading-none">{format(parseISO(d.date), 'MMM', { locale: ptBR })}</span>
                      <span className="text-sm font-bold leading-none">{format(parseISO(d.date), 'dd')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{d.name}</p>
                      <button 
                        onClick={() => onTabChange('promotion')}
                        className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Envio WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => removeDate(d.id)}
                      className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4 italic">Nenhuma data cadastrada nesta categoria.</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:text-primary transition-all text-sm font-bold border border-gray-200 shadow-sm"
          >
            <PlusCircle size={18} />
            Adicionar Nova Data Personalizada
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Nova Data Sazonal</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome da Data</label>
                <input 
                  type="text"
                  value={newDate.name || ''}
                  onChange={e => setNewDate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Aniversário da Loja"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                <input 
                  type="date"
                  value={newDate.date || ''}
                  onChange={e => setNewDate(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                <select 
                  value={newDate.type}
                  onChange={e => setNewDate(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="custom">Personalizada</option>
                  <option value="state">Estadual</option>
                  <option value="municipal">Municipal</option>
                </select>
              </div>
              {newDate.type === 'state' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Estado (UF)</label>
                  <input 
                    type="text"
                    value={newDate.state || ''}
                    onChange={e => setNewDate(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    placeholder="Ex: SP"
                    maxLength={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              {newDate.type === 'municipal' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Estado (UF)</label>
                    <input 
                      type="text"
                      value={newDate.state || ''}
                      onChange={e => setNewDate(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                    <input 
                      type="text"
                      value={newDate.city || ''}
                      onChange={e => setNewDate(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Ex: São Paulo"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowAddModal(false)} variant="outline" className="flex-1 border-gray-700 text-gray-400">Cancelar</Button>
                <Button onClick={addDate} className="flex-1">Adicionar</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function LTVTab({ purchases, customers, rules, onUpdateRules, isAdmin }: { purchases: Purchase[]; customers: Customer[]; rules: LoyaltyRule; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; isAdmin: boolean }) {
  const [lifeExpectancy, setLifeExpectancy] = useState(rules.lifeExpectancy || 75);
  const [isLocked, setIsLocked] = useState(true);

  const handleUpdateLifeExpectancy = async (val: number) => {
    setLifeExpectancy(val);
    if (isAdmin) {
      try {
        await onUpdateRules({ ...rules, lifeExpectancy: val });
      } catch (error) {
        console.error("Erro ao atualizar expectativa de vida:", error);
      }
    }
  };

  const ltvStats = useMemo(() => {
    const now = new Date();
    
    // Group customers
    const campaignCustomers = customers.filter(c => c.points > 0);
    const nonCampaignCustomers = customers.filter(c => c.points === 0);

    const calculateMetrics = (groupCustomers: Customer[]) => {
      const groupIds = new Set(groupCustomers.map(c => c.id));
      const groupPurchases = purchases.filter(p => groupIds.has(p.customerId));
      
      if (groupCustomers.length === 0) return { ltv: 0, frequency: 0, avgValue: 0, recency: 0, projectedLtv: 0 };

      const totalValue = groupPurchases.reduce((acc, p) => acc + p.amount, 0);
      const totalFrequency = groupPurchases.length / groupCustomers.length;
      const avgValue = groupPurchases.length > 0 ? totalValue / groupPurchases.length : 0;
      
      const recencySum = groupCustomers.reduce((acc, c) => {
        const lastDate = parseISO(c.lastPurchaseDate);
        return acc + differenceInDays(now, lastDate);
      }, 0);
      const avgRecency = recencySum / groupCustomers.length;

      // Projected LTV based on life expectancy
      // LTV = Avg Ticket * Frequency (per year) * Remaining Years
      const avgAge = groupCustomers.reduce((acc, c) => acc + (c.age || 30), 0) / groupCustomers.length;
      const remainingYears = Math.max(0, lifeExpectancy - avgAge);
      
      // Frequency per year (assuming 1 year of data or normalizing)
      const projectedLtv = avgValue * totalFrequency * remainingYears;

      return {
        ltv: totalValue / groupCustomers.length,
        frequency: totalFrequency,
        avgValue,
        recency: avgRecency,
        projectedLtv
      };
    };

    const campaign = calculateMetrics(campaignCustomers);
    const nonCampaign = calculateMetrics(nonCampaignCustomers);
    const averageProjectedLtv = (campaign.projectedLtv + nonCampaign.projectedLtv) / 2;

    return {
      campaign,
      nonCampaign,
      averageProjectedLtv
    };
  }, [purchases, customers, lifeExpectancy]);

  const ltvChartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = subDays(new Date(), i);
      const dayStr = format(d, 'dd/MM');
      
      const dayPurchases = purchases.filter(p => format(parseISO(p.date), 'dd/MM') === dayStr);
      const uniqueCustomers = new Set(dayPurchases.map(p => p.customerId));
      const totalValue = dayPurchases.reduce((acc, p) => acc + p.amount, 0);
      
      return {
        name: dayStr,
        ltv: uniqueCustomers.size > 0 ? totalValue / uniqueCustomers.size : 0
      };
    }).reverse();
    return days;
  }, [purchases]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Life Time Value (LTV)</h2>
          <TrendingUp className="text-gray-900" size={28} />
        </div>
        
        <div className="flex items-center gap-3 bg-green-600 p-2 rounded-2xl border border-green-500 shadow-xl">
          <div className="flex items-center gap-2 px-3 border-r border-green-500">
            <button onClick={() => setIsLocked(!isLocked)} className={cn("transition-colors", isLocked ? "text-white" : "text-white/50")}>
              {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Expectativa</span>
          </div>
          <div className="flex gap-1">
            {[60, 65, 70, 75].map(val => (
              <button
                key={val}
                disabled={isLocked}
                onClick={() => handleUpdateLifeExpectancy(val)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                  lifeExpectancy === val 
                    ? "bg-white text-green-600 shadow-lg shadow-black/10" 
                    : "text-white/70 hover:text-white disabled:opacity-30"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prominent Average LTV Card */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-green-600">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-xs mb-2">LTV Médio Projetado da Empresa</p>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 text-2xl font-black">R$</span>
            <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter">
              {formatCurrency(ltvStats.averageProjectedLtv)}
            </h1>
          </div>
          <p className="text-gray-400 text-[10px] font-bold mt-4 uppercase tracking-widest">
            Baseado em uma expectativa de vida de {lifeExpectancy} anos
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-primary" size={20} />
            Participantes da Campanha
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">LTV Projetado</p>
              <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(ltvStats.campaign.projectedLtv)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Frequência</p>
              <p className="text-xl font-bold text-gray-900">{ltvStats.campaign.frequency.toFixed(1)}x</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Ticket Médio</p>
              <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(ltvStats.campaign.avgValue)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Recência Média</p>
              <p className="text-xl font-bold text-gray-900">{ltvStats.campaign.recency.toFixed(0)} dias</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-primary" size={20} />
            Apenas Compradores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">LTV Projetado</p>
              <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(ltvStats.nonCampaign.projectedLtv)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Frequência</p>
              <p className="text-xl font-bold text-gray-900">{ltvStats.nonCampaign.frequency.toFixed(1)}x</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Ticket Médio</p>
              <p className="text-xl font-bold text-gray-900">R$ {formatCurrency(ltvStats.nonCampaign.avgValue)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Recência Média</p>
              <p className="text-xl font-bold text-gray-900">{ltvStats.nonCampaign.recency.toFixed(0)} dias</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Análise de Impacto</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <p className="text-sm font-bold text-gray-900">Aumento no LTV</p>
              <p className="text-xs text-gray-500">Diferença de valor entre participantes e não participantes</p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {ltvStats.nonCampaign.ltv > 0 
                ? `+${((ltvStats.campaign.ltv / ltvStats.nonCampaign.ltv - 1) * 100).toFixed(1)}%` 
                : <span className="text-gray-400">N/A</span>}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">Evolução do LTV (Últimos 7 Dias)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ltvChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
              <YAxis stroke="#9CA3AF" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                itemStyle={{ color: '#111827' }}
              />
              <Line type="monotone" dataKey="ltv" name="LTV Médio" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}

function SettingsTab({ rules, isAdmin, onUpdateRules }: { rules: LoyaltyRule; isAdmin: boolean; onUpdateRules: (rules: LoyaltyRule) => Promise<void> }) {
  const [localRules, setLocalRules] = useState<LoyaltyRule>(rules);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReauthenticated, setIsReauthenticated] = useState(false);

  useEffect(() => {
    setLocalRules(rules);
  }, [rules]);

  const handleReauthenticate = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsReauthenticated(true);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      console.error(error);
      alert("Erro ao reautenticar. Por favor, entre com sua conta Google de administrador.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !isReauthenticated) return;
    setIsSaving(true);
    try {
      await onUpdateRules(localRules);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setIsReauthenticated(false); // Lock again after save
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'configs');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = isAdmin && isReauthenticated;

  const BG_PALETTE = [
    { name: 'Preto (Padrão)', color: '#000000' },
    { name: 'Cinza Escuro', color: '#111827' },
    { name: 'Azul Marinho', color: '#0f172a' },
    { name: 'Verde Escuro', color: '#064e3b' },
    { name: 'Roxo Escuro', color: '#2e1065' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Regras de Negócio</h2>
        <Settings className="text-gray-400" size={28} />
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className={cn(isReauthenticated ? "text-green-500" : "text-gray-400")} />
            <span className="text-sm font-bold text-gray-500">
              {isReauthenticated ? "Edição Liberada" : "Configurações Bloqueadas"}
            </span>
          </div>
          {!isReauthenticated && isAdmin && (
            <Button onClick={handleReauthenticate} size="sm" variant="outline" className="border-gray-200 text-gray-600">
              <Unlock size={14} className="mr-2" />
              Liberar para Alterar
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Nome da Campanha de Fidelidade</label>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            <input 
              value={localRules.campaignName || ''} 
              onChange={(e) => setLocalRules(prev => ({ ...prev, campaignName: e.target.value }))} 
              placeholder="Ex: Programa de Fidelidade da Loja"
              disabled={!canEdit || isSaving}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Compras para ser premiado</label>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            <input 
              type="number" 
              value={localRules.purchasesForPrize} 
              onChange={(e) => setLocalRules(prev => ({ ...prev, purchasesForPrize: parseInt(e.target.value) }))} 
              min={1}
              required
              disabled={!canEdit || isSaving}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Valor mínimo de compra para pontuar (R$)</label>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            <input 
              type="number" 
              value={localRules.minPurchaseValue} 
              onChange={(e) => setLocalRules(prev => ({ ...prev, minPurchaseValue: parseFloat(e.target.value) }))} 
              min={0}
              step="0.01"
              required
              disabled={!canEdit || isSaving}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Tempo máximo entre compras (dias)</label>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            <input 
              type="number" 
              value={localRules.maxDaysBetweenPurchases} 
              onChange={(e) => setLocalRules(prev => ({ ...prev, maxDaysBetweenPurchases: parseInt(e.target.value) }))} 
              min={1}
              required
              disabled={!canEdit || isSaving}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Permissões do Perfil Usuário</h3>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            <p className="text-xs text-gray-500">Selecione quais abas o perfil "Usuário" terá acesso além do Dashboard.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'customers', label: 'Clientes' },
                { id: 'rewarded_customers', label: 'Premiados' },
                { id: 'rewards', label: 'Premiação' },
                { id: 'seasonal_dates', label: 'Datas Sazonais' },
                { id: 'ltv', label: 'LTV' },
                { id: 'score', label: 'Pontuar' },
                { id: 'promotion', label: 'Promoção' },
              ].map(tab => (
                <label key={tab.id} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input 
                    type="checkbox"
                    checked={localRules.allowedUserTabs?.includes(tab.id)}
                    disabled={!canEdit}
                    onChange={(e) => {
                      const current = localRules.allowedUserTabs || [];
                      const next = e.target.checked 
                        ? [...current, tab.id]
                        : current.filter(id => id !== tab.id);
                      setLocalRules(prev => ({ ...prev, allowedUserTabs: next }));
                    }}
                    className="w-4 h-4 rounded border-gray-200 text-primary focus:ring-primary bg-white"
                  />
                  <span className="text-xs text-gray-600 font-medium">{tab.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Cores do Sistema</h3>
              {!canEdit && <Lock size={14} className="text-gray-400" />}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cor de Destaque (Botões, Ícones)</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Laranja', color: '#fb8500' },
                    { name: 'Azul', color: '#3B82F6' },
                    { name: 'Verde', color: '#10B981' },
                    { name: 'Roxo', color: '#8B5CF6' },
                    { name: 'Rosa', color: '#EC4899' },
                    { name: 'Vermelho', color: '#EF4444' },
                  ].map(palette => (
                    <button
                      key={palette.color}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setLocalRules(prev => ({ ...prev, themeColor: palette.color }))}
                      className={cn(
                        "w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center",
                        localRules.themeColor === palette.color 
                          ? "border-gray-900 scale-110 shadow-lg" 
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: palette.color }}
                      title={palette.name}
                    >
                      {localRules.themeColor === palette.color && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cor de Fundo do Sistema</p>
                <div className="flex flex-wrap gap-3">
                  {BG_PALETTE.map(palette => (
                    <button
                      key={palette.color}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setLocalRules(prev => ({ ...prev, secondaryColor: palette.color }))}
                      className={cn(
                        "w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center",
                        localRules.secondaryColor === palette.color 
                          ? "border-primary scale-110 shadow-lg" 
                          : "border-gray-200 hover:scale-105"
                      )}
                      style={{ backgroundColor: palette.color }}
                      title={palette.name}
                    >
                      {localRules.secondaryColor === palette.color && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {showSuccess && (
              <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-lg text-center text-sm font-bold">
                Regras atualizadas com sucesso! O sistema foi bloqueado novamente.
              </div>
            )}
            <Button type="submit" disabled={isSaving || !canEdit} className="w-full py-4 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              {isSaving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

function ContractCancelledScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-gray-800 p-10 rounded-3xl shadow-2xl max-w-md w-full"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Contrato Cancelado</h1>
        <p className="text-gray-400 mb-8">
          Seu contrato foi encerrado com sucesso. Sentiremos sua falta!
        </p>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
          <p className="text-red-400 text-sm font-bold">
            Erro de Acesso: Assinatura Inativa.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          Voltar para o Login
        </button>
      </motion.div>
    </div>
  );
}

function ResetSystemTab({ companyId, isAdmin }: { companyId: string | null; isAdmin: boolean }) {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!companyId || !isAdmin) return;
    setIsResetting(true);
    setError('');

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(auth.currentUser!.email!, password);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      // Deletion logic
      const collectionsToDelete = ['customers', 'purchases', 'goals'];
      
      for (const collName of collectionsToDelete) {
        const q = query(collection(db, collName), where('companyId', '==', companyId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Reset onboarding flag
      await updateDoc(doc(db, 'configs', companyId), { onboardingComplete: false });

      alert("Sistema zerado com sucesso! Todos os dados foram removidos e o onboarding foi reiniciado.");
      window.location.reload(); // Reload to clear local state
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else {
        setError('Erro ao zerar sistema: ' + err.message);
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Zerar Sistema</h2>
        <RotateCcw className="text-red-500" size={28} />
      </div>

      <Card className="p-8 bg-white border-gray-200 border-2 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Atenção Total!</h3>
            <p className="text-red-600 font-bold max-w-md mx-auto">
              Esta ação irá apagar permanentemente **TODOS** os dados de clientes, vendas e metas do seu sistema. 
              Esta operação **NÃO PODE SER DESFEITA**.
            </p>
          </div>

          <div className="w-full max-w-sm p-6 bg-gray-50 rounded-3xl border border-gray-200 space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Confirme sua Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

            <Button 
              onClick={() => setShowConfirm(true)}
              disabled={!password || isResetting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-xl shadow-red-600/20"
            >
              {isResetting ? 'Processando...' : 'Zerar Todo o Sistema'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Total Alert Confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={56} className="text-red-600" />
              </div>
              
              <h2 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">CONFIRMAÇÃO FINAL</h2>
              <p className="text-xl text-gray-600 mb-8 font-medium">
                Você tem certeza absoluta? <br/>
                <span className="text-red-600 font-black underline">TUDO SERÁ APAGADO AGORA.</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReset}
                  disabled={isResetting}
                  className="py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-sm shadow-lg shadow-red-600/20"
                >
                  {isResetting ? 'Zerando...' : 'Sim, Apagar Tudo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PlansTab() {
  const plans = [
    {
      name: 'Mensal',
      price: '599,00',
      period: 'mês',
      description: 'Acesso total à ferramenta',
      whatsapp: 'https://wa.me/552140421034?text=Vi%20a%20ferramenta%20no%20site%20e%20desejo%20assinar%20a%20Ferramenta%20de%20Fidelidade%20RFV%20Slice%20-%20Plano%20Mensal'
    },
    {
      name: 'Semestral',
      price: '499,00',
      period: 'mês',
      description: 'Acesso total à ferramenta',
      whatsapp: 'https://wa.me/552140421034?text=Vi%20a%20ferramenta%20no%20site%20e%20desejo%20assinar%20a%20Ferramenta%20de%20Fidelidade%20RFV%20Slice%20-%20Plano%20Semestral',
      popular: true
    },
    {
      name: 'Anual',
      price: '429,00',
      period: 'mês',
      description: 'Acesso total à ferramenta',
      whatsapp: 'https://wa.me/552140421034?text=Vi%20a%20ferramenta%20no%20site%20e%20desejo%20assinar%20a%20Ferramenta%20de%20Fidelidade%20RFV%20Slice%20-%20Plano%20Anual'
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Planos e Assinaturas</h2>
        <p className="text-white">Escolha o melhor plano para o seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`p-8 bg-gray-900 border-gray-800 flex flex-col relative overflow-hidden ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                Mais Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-4">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-4xl font-bold text-white">{plan.price}</span>
              <span className="text-sm text-gray-400">/{plan.period}</span>
            </div>
            <p className="text-gray-400 text-sm mb-8 flex-1">{plan.description}</p>
            <ul className="space-y-3 mb-8">
              {['Dashboard Completo', 'Gestão de Clientes', 'Regras de Fidelidade', 'Promoções WhatsApp', 'LTV & RFV'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check size={16} className="text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <a 
              href={plan.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.popular ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Assinar Agora
            </a>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

function CompanyProfileTab({ rules, isAdmin, appUser, onCancelContract, onUpgrade, onUpdateRules }: { rules: LoyaltyRule; isAdmin: boolean; appUser: AppUser | null; onCancelContract: () => void; onUpgrade: () => void; onUpdateRules: (rules: LoyaltyRule) => Promise<void> }) {
  const [profile, setProfile] = useState<CompanyProfile>(rules.companyProfile || {
    companyName: '',
    tradingName: '',
    cnpj: '',
    phone: '',
    address: '',
    responsible: '',
    contactPhone: '',
    subscriptionType: 'monthly'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelFinalConfirm, setShowCancelFinalConfirm] = useState(false);

  // User Management State (from AdminTab)
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', phone: '', role: 'user' as 'admin' | 'user', photoURL: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { askConfirmation } = useConfirm();

  useEffect(() => {
    if (!appUser?.companyId) {
      setLoadingUsers(false);
      return;
    }
    const q = query(
      collection(db, 'users'), 
      where('companyId', '==', appUser.companyId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));
      setAllUsers(users);
      setLoadingUsers(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));
    return () => unsub();
  }, [appUser?.companyId]);

  const handleDeleteUser = async (uid: string) => {
    if (uid === appUser?.uid) {
      showToast("Você não pode excluir seu próprio usuário.", "warning");
      return;
    }
    askConfirmation(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este administrador?",
      async () => {
        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
        }
      },
      true
    );
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.companyId) return;
    
    const userCount = allUsers.filter(u => u.role === 'user').length;
    if (userCount >= 2) {
      showToast("Limite de 2 usuários atingido.", "warning");
      return;
    }

    setIsCreatingUser(true);
    try {
      const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(secondaryAuth, newUserData.email.toLowerCase(), newUserData.password);
      const uid = result.user.uid;
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: newUserData.name,
        email: newUserData.email.toLowerCase(),
        phone: newUserData.phone,
        role: newUserData.role,
        photoURL: newUserData.photoURL,
        companyId: appUser.companyId,
        approved: true,
        createdAt: new Date().toISOString()
      });

      setShowCreateUser(false);
      setNewUserData({ name: '', email: '', password: '', phone: '', role: 'user', photoURL: '' });
      showToast("Usuário criado com sucesso!", "success");
    } catch (error: any) {
      console.error(error);
      showToast("Erro ao criar usuário: " + error.message, "error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setNewUserData({
      name: user.displayName || '',
      email: user.email || '',
      password: '', // Password cannot be retrieved
      phone: user.phone || '',
      role: user.role || 'user',
      photoURL: user.photoURL || ''
    });
    setShowCreateUser(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsCreatingUser(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: newUserData.name,
        phone: newUserData.phone,
        role: newUserData.role,
        photoURL: newUserData.photoURL
      });
      
      setShowCreateUser(false);
      setEditingUser(null);
      setNewUserData({ name: '', email: '', password: '', phone: '', role: 'user', photoURL: '' });
      showToast("Usuário atualizado com sucesso!", "success");
    } catch (error: any) {
      console.error(error);
      showToast("Erro ao atualizar usuário: " + error.message, "error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const [isGeminiLocked, setIsGeminiLocked] = useState(true);
  const [isPromptLocked, setIsPromptLocked] = useState(true);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB to stay safe within 1MB Firestore limit
        alert("A imagem é muito grande. Por favor, escolha uma imagem menor que 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUserData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [erpKey, setErpKey] = useState(rules.erpKey || '');

  const generateERPKey = () => {
    const key = 'ERP_' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
    askConfirmation(
      "Gerar Nova Chave ERP",
      "Ao gerar uma nova chave, a integração atual do seu sistema ERP deixará de funcionar até que a nova chave seja atualizada lá. Deseja continuar?",
      () => {
        setErpKey(key);
        onUpdateRules({ ...rules, erpKey: key, companyProfile: profile });
        showToast("Nova chave ERP gerada!", "success");
      },
      true
    );
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    
    // Validation: Check if all required fields are filled
    const requiredFields: (keyof CompanyProfile)[] = ['companyName', 'cnpj', 'phone', 'address', 'responsible', 'contactPhone'];
    const missingFields = requiredFields.filter(field => !profile[field]);
    
    if (missingFields.length > 0) {
      showToast("Por favor, preencha todos os campos obrigatórios antes de salvar.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateRules({ ...rules, companyProfile: profile, erpKey });
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Erro ao atualizar perfil. Por favor, tente novamente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfile({ ...profile, photoURL: dataUrl });
          // Immediate update for visual feedback
          onUpdateRules({ ...rules, companyProfile: { ...profile, photoURL: dataUrl } });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCNPJ = (value: string) => {
    const cnpj = value.replace(/\D/g, '');
    return cnpj
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Administração Geral da Empresa</h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            profile.subscriptionType === 'annual' ? 'bg-green-500/20 text-green-500' :
            profile.subscriptionType === 'quarterly' ? 'bg-blue-500/20 text-blue-500' :
            'bg-primary/20 text-primary'
          }`}>
            Plano {profile.subscriptionType === 'monthly' ? 'Mensal' : profile.subscriptionType === 'quarterly' ? 'Trimestral' : 'Anual'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-gray-100 shadow-sm lg:col-span-1 flex flex-col items-center text-center">
          <div className="relative group mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500/20 bg-gray-50 flex items-center justify-center shadow-xl">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={48} className="text-gray-400" />
              )}
            </div>
            {isAdmin && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera className="text-white" size={24} />
                <input type="file" accept="image/*" className="hidden" onChange={handleCompanyPhotoUpload} />
              </label>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{profile.companyName || 'Nome da Empresa'}</h3>
          <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">{profile.tradingName || 'Nome Fantasia'}</p>
          
          <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Chave ERP / Integração</label>
              {isAdmin && (
                <button onClick={generateERPKey} className="text-[9px] font-black text-primary uppercase hover:underline">Gerar Nova</button>
              )}
            </div>
            {erpKey ? (
              <div className="flex items-center justify-between gap-2 p-2 bg-white border border-gray-200 rounded-lg">
                <code className="text-[10px] font-bold text-gray-700 truncate">{erpKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(erpKey); showToast("Chave copiada!", "success"); }} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                  <Copy size={14} />
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 italic">Nenhuma chave gerada.</div>
            )}
            <p className="text-[8px] text-gray-400 leading-tight">
              A chave de integração deve ser gerada por nós no SaaS e fornecida ao desenvolvedor do seu ERP para habilitar a pontuação automática.
            </p>
          </div>

          <div className="w-full space-y-6 mb-6 pt-6 border-t border-gray-100">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={12} className="text-green-600" />
                  Chave API Gemini
                </div>
                <button 
                  onClick={() => setIsGeminiLocked(!isGeminiLocked)}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                >
                  {isGeminiLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </label>
              <input 
                type={isGeminiLocked ? "password" : "text"} 
                value={rules.geminiApiKey || ''}
                onChange={(e) => onUpdateRules({ ...rules, geminiApiKey: e.target.value })}
                disabled={isGeminiLocked}
                placeholder="AIza..."
                className={cn(
                  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono",
                  isGeminiLocked && "opacity-60 cursor-not-allowed"
                )}
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={12} className="text-green-600" />
                  Prompt para Análise
                </div>
                <button 
                  onClick={() => setIsPromptLocked(!isPromptLocked)}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                >
                  {isPromptLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </label>
              <textarea 
                value={rules.aiPrompt || ''}
                onChange={(e) => onUpdateRules({ ...rules, aiPrompt: e.target.value })}
                disabled={isPromptLocked}
                rows={5}
                className={cn(
                  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none leading-relaxed",
                  isPromptLocked && "opacity-60 cursor-not-allowed"
                )}
                placeholder="Instruções para a IA..."
              />
            </div>
          </div>

          <div className="w-full pt-6">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-green-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-600/20"
            >
              {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save size={18} />}
              Salvar Configurações
            </Button>
          </div>
        </Card>

        <Card className="p-8 bg-white border-gray-100 shadow-sm lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Empresa</label>
              <input 
                type="text" 
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Razão Social"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome Fantasia</label>
              <input 
                type="text" 
                value={profile.tradingName}
                onChange={(e) => setProfile({ ...profile, tradingName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Nome Fantasia"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">CNPJ</label>
              <input 
                type="text" 
                value={profile.cnpj}
                onChange={(e) => setProfile({ ...profile, cnpj: formatCNPJ(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Celular da Empresa</label>
              <PhoneInput
                international
                defaultCountry="BR"
                value={profile.phone}
                onChange={(val) => setProfile({ ...profile, phone: val || '' })}
                className="phone-input-custom"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endereço Completo</label>
              <input 
                type="text" 
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Responsável Imediato</label>
              <input 
                type="text" 
                value={profile.responsible}
                onChange={(e) => setProfile({ ...profile, responsible: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Nome do Responsável"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Celular de Contato</label>
              <PhoneInput
                international
                defaultCountry="BR"
                value={profile.contactPhone}
                onChange={(val) => setProfile({ ...profile, contactPhone: val || '' })}
                className="phone-input-custom"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Assinatura</label>
              <select 
                value={profile.subscriptionType}
                onChange={(e) => setProfile({ ...profile, subscriptionType: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-600/20"
              >
                {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save size={20} />}
                Salvar Alterações
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Gestão de Usuários Section */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gestão de Administradores</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Controle de acesso ao sistema</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateUser(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-none">
              <PlusCircle size={18} />
              Novo Admin
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map(user => (
            <div key={user.uid} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt={user.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <button onClick={() => handleEditUser(user)} className="p-2 text-gray-400 hover:text-primary transition-all">
                    <Edit size={16} />
                  </button>
                )}
                {isAdmin && user.uid !== appUser?.uid && (
                  <button onClick={() => handleDeleteUser(user.uid)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showCreateUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingUser ? 'Editar Administrador' : 'Novo Administrador'}</h3>
              <button onClick={() => { setShowCreateUser(false); setEditingUser(null); }} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500/20 bg-gray-50 flex items-center justify-center shadow-lg">
                    {newUserData.photoURL ? (
                      <img src={newUserData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={48} className="text-gray-400" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Camera className="text-white" size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-2">Foto de Perfil</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={newUserData.name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                <input 
                  type="email" 
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingUser}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  placeholder="joao@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Celular</label>
                <input 
                  type="text" 
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Senha Inicial</label>
                  <input 
                    type="password" 
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
              <Button type="submit" disabled={isCreatingUser} className="w-full py-4 uppercase tracking-widest text-sm font-black bg-green-600 hover:bg-green-700 text-white">
                {isCreatingUser ? 'Salvando...' : (editingUser ? 'Salvar Alterações' : 'Criar Administrador')}
              </Button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ERP Integration Section */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Integração ERP</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Conecte seu sistema de gestão externa</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave de API / Conector</label>
            <div className="relative">
              <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={rules.erpKey || 'NÃO CONFIGURADA'}
                readOnly
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-gray-900 font-mono text-sm font-bold"
              />
            </div>
            <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
              Esta chave deve ser solicitada ao administrador master do sistema. Ela permite a sincronização de vendas diretamente com o seu ERP via Webhook ou API REST.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
              O modelo de integração Saas ERP v2.0 já está disponível para sua conta. Consulte a documentação técnica para endpoints de pontuação automática.
            </p>
          </div>
        </div>
      </Card>

      {/* Cancellation Modals */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Deseja cancelar seu plano?</h3>
            <p className="text-gray-400 mb-8">Ao cancelar, você perderá acesso a todas as funcionalidades de fidelização e dados de seus clientes.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowCancelConfirm(false); setShowCancelFinalConfirm(true); }}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
              >
                Sim, desejo cancelar
              </button>
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all"
              >
                Não, manter meu plano
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showCancelFinalConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-red-500/50 rounded-2xl p-8 w-full max-w-md text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <h3 className="text-2xl font-bold text-white mb-4">Último Aviso!</h3>
            <p className="text-gray-400 mb-8">Tem certeza absoluta que deseja cancelar? Esta ação é irreversível e todos os dados serão perdidos.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onCancelContract}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                CONFIRMAR CANCELAMENTO DEFINITIVO
              </button>
              <button 
                onClick={() => setShowCancelFinalConfirm(false)}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all"
              >
                Desistir e Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function AIConfigTab({ rules, onUpdateRules }: { rules: LoyaltyRule; onUpdateRules: (rules: LoyaltyRule) => Promise<void> }) {
  const [prompt, setPrompt] = useState(rules.aiPrompt || 'Você é um consultor estratégico de negócios especializado em varejo e fidelização de clientes. Analise os dados fornecidos e forneça um diagnóstico detalhado, identificando riscos, oportunidades e recomendações práticas para aumentar o faturamento e a retenção de clientes.');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateRules({ ...rules, aiPrompt: prompt });
      showToast("Configurações de IA salvas com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar configurações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuração da IA</h2>
        <Brain className="text-primary" size={28} />
      </div>

      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prompt Padrão para Análise Estratégica</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-sm leading-relaxed"
              placeholder="Digite as instruções para a IA..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="px-12 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StrategicAnalysisTab({ purchases, customers, rules, goals, companyId }: { purchases: Purchase[]; customers: Customer[]; rules: LoyaltyRule; goals: Goal[]; companyId: string | null }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { showToast } = useToast();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const currentGoal = goals.find(g => g.month === currentMonthStr);
    
    const monthPurchases = purchases.filter(p => p.date.startsWith(currentMonthStr));
    const totalSales = monthPurchases.reduce((acc, p) => acc + p.amount, 0);
    
    const daysWithSales = new Set(monthPurchases.map(p => p.date.split('T')[0])).size || 1;
    const dailyAvg = totalSales / daysWithSales;
    const workingDays = currentGoal?.workingDays || 22;
    
    const projectedRevenue = dailyAvg * workingDays;
    const goalTrend = currentGoal ? (projectedRevenue / currentGoal.value) * 100 : 0;
    
    const avgTicket = purchases.length > 0 ? purchases.reduce((acc, p) => acc + p.amount, 0) / purchases.length : 0;
    const configuredAvgTicket = rules.currentAvgTicket || 0;
    const configuredMonthlyRevenue = rules.currentMonthlyRevenue || 0;
    const configuredActiveClients = configuredAvgTicket > 0 ? configuredMonthlyRevenue / configuredAvgTicket : 0;
    
    const avgFrequency = customers.length > 0 ? purchases.length / customers.length : 0;
    
    const repeatCustomers = customers.filter(c => purchases.filter(p => p.customerId === c.id).length > 1).length;
    const repurchaseRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;
    
    const churnThreshold = subDays(now, 60);
    const churnedCustomers = customers.filter(c => {
      const lastPurchase = purchases.filter(p => p.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      return lastPurchase ? parseISO(lastPurchase.date) < churnThreshold : true;
    }).length;
    const churnRate = customers.length > 0 ? (churnedCustomers / customers.length) * 100 : 0;

    const avgLtv = avgTicket * avgFrequency;
    const ltvProjections = [12, 24, 36, 60].map(months => ({
      months,
      value: avgLtv * months,
      conservative: avgLtv * months * 0.7
    }));

    const activeCustomers = customers.length - churnedCustomers;
    const baseValue = activeCustomers * avgLtv;

    let expectedCost = 0;
    if (rules.rewardTiers) {
      rules.rewardTiers.forEach(tier => {
        const reachingProb = customers.filter(c => c.points >= tier.points).length / (customers.length || 1);
        expectedCost += (tier.cost || 0) * reachingProb * customers.length;
      });
    }

    const payback = totalSales > 0 ? expectedCost / totalSales : 0;

    return {
      projectedRevenue,
      goalTrend,
      avgTicket,
      configuredAvgTicket,
      configuredMonthlyRevenue,
      configuredActiveClients,
      avgFrequency,
      repurchaseRate,
      churnRate,
      baseValue,
      ltvProjections,
      expectedCost,
      payback,
      currentGoalValue: currentGoal?.value || 0,
      activeCustomers
    };
  }, [purchases, customers, goals, rules]);

  const handleGenerateAnalysis = async () => {
    if (!rules.geminiApiKey) {
      showToast("Por favor, configure sua API Key do Gemini na aba 'Seu Perfil'.", "warning");
      return;
    }

    // Simple Cache Implementation
    const cacheKey = `analysis_cache_${companyId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const now = Date.now();
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    if (cachedData) {
      const { timestamp, result, dataHash } = JSON.parse(cachedData);
      const currentDataHash = JSON.stringify({
        metrics,
        companyName: rules.companyProfile?.companyName,
        campaignName: rules.campaignName
      });

      if (now - timestamp < CACHE_TTL && dataHash === currentDataHash) {
        setAnalysis(result);
        return;
      }
    }

    setIsAnalyzing(true);
    try {
      const dataToAnalyze = {
        metrics,
        companyName: rules.companyProfile?.companyName,
        campaignName: rules.campaignName,
        currentMonth: format(new Date(), 'MMMM yyyy', { locale: ptBR })
      };

      const prompt = rules.aiPrompt || 'Analise os dados estratégicos do negócio.';
      const context = `Aqui estão os dados do meu negócio para análise: ${JSON.stringify(dataToAnalyze)}`;

      const ai = new GoogleGenAI({ apiKey: rules.geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${prompt}\n\n${context}`
      });
      
      const resultText = response.text || '';
      setAnalysis(resultText);

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: now,
        result: resultText,
        dataHash: JSON.stringify({
          metrics,
          companyName: rules.companyProfile?.companyName,
          campaignName: rules.campaignName
        })
      }));
    } catch (error: any) {
      console.error(error);
      showToast("Erro ao gerar análise: " + error.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysis) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    const addHeader = (doc: any) => {
      if (rules.companyProfile?.logoURL) {
        try {
          doc.addImage(rules.companyProfile.logoURL, 'PNG', margin, 10, 20, 20);
        } catch (e) {
          console.error("Error adding logo to PDF", e);
        }
      }
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise Estratégica de Negócios Saas', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, 15, { align: 'right' });
      
      doc.setDrawColor(200);
      doc.line(margin, 35, pageWidth - margin, 35);
    };

    const addFooter = (doc: any, pageNumber: number) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      const disclaimer = "Observação: Esta análise representa apenas os dados extraídos do sistema Saas de análise de Clientes e Mercados.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2));
      doc.text(splitDisclaimer, margin, pageHeight - 15);
      doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    addHeader(doc);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    
    const splitText = doc.splitTextToSize(analysis, pageWidth - (margin * 2));
    let cursorY = 45;
    
    splitText.forEach((line: string) => {
      if (cursorY > pageHeight - 30) {
        addFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        addHeader(doc);
        cursorY = 45;
      }
      doc.text(line, margin, cursorY);
      cursorY += 7;
    });

    addFooter(doc, doc.getNumberOfPages());
    doc.save(`analise_estrategica_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-green-600 px-6 py-2 rounded-full shadow-lg shadow-green-600/20">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Análise Estratégica</h2>
        </div>
        <BarChart3 className="text-primary" size={28} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Projeção Faturamento" 
          value={`R$ ${formatCurrency(metrics.projectedRevenue)}`}
          subtitle={`Meta: R$ ${formatCurrency(metrics.currentGoalValue)}`}
          icon={DollarSign}
          className="bg-white border-gray-100 shadow-sm"
        />
        <MetricCard 
          title="Calculado: Faturamento" 
          value={`R$ ${formatCurrency(metrics.configuredMonthlyRevenue)}`}
          subtitle="Valor configurado"
          icon={TrendingUp}
          className="bg-white border-gray-100 shadow-sm"
        />
        <MetricCard 
          title="Ticket Médio" 
          value={`R$ ${formatCurrency(metrics.avgTicket)}`}
          subtitle={`Ref: R$ ${formatCurrency(metrics.configuredAvgTicket)}`}
          icon={ArrowUpCircle}
          className="bg-white border-gray-100 shadow-sm"
        />
        <MetricCard 
          title="Clientes Ativos" 
          value={`${metrics.activeCustomers}`}
          subtitle={`Metas: ${Math.ceil(metrics.configuredActiveClients)}`}
          icon={Users}
          className="bg-white border-gray-100 shadow-sm"
        />
      </div>

      <Card className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateAnalysis} 
              disabled={isAnalyzing}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-green-500/20"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="animate-spin" size={20} />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Acesse Aqui
                </>
              )}
            </Button>
            {analysis && (
              <Button 
                variant="outline"
                onClick={handleExportPDF}
                className="px-8 py-4 text-sm font-black uppercase tracking-widest"
              >
                <Download size={20} />
                Gerar PDF
              </Button>
            )}
          </div>
        </div>

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-8 p-8 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <div className="prose prose-green max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                {analysis}
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-gray-900" size={20} />
            Saúde da Base de Clientes
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-500">Frequência Média</span>
              <span className="text-lg font-bold text-gray-900">{metrics.avgFrequency.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-500">Churn Rate (60 dias)</span>
              <span className="text-lg font-bold text-gray-900">{metrics.churnRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <span className="text-sm font-bold text-gray-900">Valor da Base (Ativos)</span>
              <span className="text-xl font-black text-gray-900">R$ {formatCurrency(metrics.baseValue)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-gray-900" size={20} />
            Projeções de LTV
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="pb-3">Período</th>
                  <th className="pb-3">LTV Projetado</th>
                  <th className="pb-3">LTV Conservador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.ltvProjections.map(proj => (
                  <tr key={proj.months}>
                    <td className="py-3 text-gray-900 font-bold">{proj.months} meses</td>
                    <td className="py-3 text-gray-900 font-bold">R$ {formatCurrency(proj.value)}</td>
                    <td className="py-3 text-gray-500">R$ {formatCurrency(proj.conservative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="text-gray-900" size={20} />
          Viabilidade do Programa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Custo Esperado</p>
            <p className="text-2xl font-black text-gray-900">R$ {formatCurrency(metrics.expectedCost)}</p>
            <p className="text-[10px] text-gray-500 mt-2">Baseado no resgate provável</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Payback do Programa</p>
            <p className="text-2xl font-black text-gray-900">{metrics.payback.toFixed(2)}%</p>
            <p className="text-[10px] text-gray-500 mt-2">Custo vs. Faturamento Mensal</p>
          </div>
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">Retorno Tangível</p>
              <div className="flex items-center gap-2 text-gray-900 font-black text-xl">
                <ArrowUpCircle size={24} />
                ALTO
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-white border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900">
          <Brain size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="bg-green-600 px-6 py-2 rounded-full shadow-lg shadow-green-600/20 inline-block">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Análise Estratégica</h3>
            </div>
          </div>
          <button 
            onClick={handleGenerateAnalysis}
            disabled={isAnalyzing}
            className="px-8 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/20 flex items-center gap-3 whitespace-nowrap disabled:opacity-50"
          >
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Brain size={24} />}
            acesse aqui
          </button>
        </div>

        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={20} />
                <h4 className="font-bold uppercase tracking-widest text-xs">Diagnóstico da IA</h4>
              </div>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-900 rounded-xl text-xs font-bold transition-all"
              >
                <Download size={16} />
                Exportar PDF
              </button>
            </div>
            <div className="prose prose-green max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
    );
  };

  return (
    <ConfirmContext.Provider value={{ askConfirmation }}>
      {renderContent()}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDanger={confirmModal.isDanger}
      />
    </ConfirmContext.Provider>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, className }: { title: string; value: string; subtitle: string; icon?: any; className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        {Icon && <Icon size={16} className="text-gray-900" />}
      </div>
      <h3 className="text-2xl font-black mb-1 text-gray-900">{value}</h3>
      <p className="text-[10px] text-gray-500 font-medium">{subtitle}</p>
    </Card>
  );
}
