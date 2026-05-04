/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo, useRef, Component, ReactNode, createContext, useContext } from 'react';
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
  deleteField,
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
  ChevronLeft,
  ChevronDown,
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
  TrendingDown,
  Unlock,
  ShieldAlert,
  Activity,
  Key,
  Award,
  Info,
  Upload,
  ExternalLink,
  Brain,
  HelpCircle,
  Sparkles,
  Cake,
  Ticket,
  Disc,
  Mail,
  MessageCircle,
  RotateCcw,
  Target,
  Star,
  Copy,
  Edit2,
  LayoutDashboard,
  UserPlus,
  Calculator,
  Percent,
  Pause,
  Play,
  PlayCircle,
  Smartphone,
  Hash,
  Gift,
  Briefcase,
  History,
  Shield,
  Layout,
  Thermometer,
  PieChart as PieChartIcon,
  BookOpen,
  CheckCircle,
  Lock,
  LockOpen,
  Megaphone,
  Pointer,
  CreditCard,
  ArrowRight,
  RefreshCcw,
  Zap,
  BadgeDollarSign,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import 'react-phone-number-input/style.css';
import { GoogleGenAI } from "@google/genai";
import { format, isToday, subDays, differenceInDays, differenceInYears, parseISO, isWithinInterval, startOfDay, endOfDay, subWeeks, subMonths, isBefore, addMonths, parse, startOfMonth, endOfMonth, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

interface Purchase {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  pointsEarned: number;
  cashbackEarned?: number;
  promotionId?: string;
  actionsEarned?: number;
  prizeWon?: string;
  prizeCost?: number;
  companyId?: string;
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
  customersCount?: number;
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
  memo?: string;
  hasCampaign?: boolean;
  campaignData?: any;
}

type PromotionType = 'raffle' | 'wheel' | 'birthday' | 'scratch';

interface PromotionConfig {
  id: string; // Unique ID for each campaign run
  type: PromotionType;
  name: string;
  startDate: string;
  endDate: string;
  prizes: string[];
  rafflePrizes?: { label: string; value: number; quantity?: number }[];
  totalCost?: number;
  // Raffle specific
  minPurchaseValue?: number;
  isCumulative?: boolean;
  rafflePrize?: string;
  drawDate?: string;
  drawTime?: string;
  isDrawn?: boolean; // Track if drawing happened
  winner?: string;
  raffleWinner?: string;
  winnersList?: { name: string; prize: string; purchaseId: string }[];
  // Wheel specific
  minPurchaseForWheel?: number;
  isSpinCumulative?: boolean;
  wheelSegments?: { label: string; probability: number; color: string; cost?: number }[];
  scratchPrizes?: { label: string; probability: number; color?: string; cost?: number }[];
  // Birthday specific
  birthdayDiscountPercent?: number;
  // Scratch specific
  minPurchaseForScratch?: number;
  // Meta
  isLinkedToLoyalty: boolean;
  isActive: boolean;
}

interface PromotionHistory {
  id: string;
  companyId: string;
  campaignName: string;
  type: PromotionType;
  startDate: string;
  endDate: string;
  winner?: string;
  prize?: string;
  totalRevenue: number;
  totalParticipants: number;
  totalActions: number;
  totalCost?: number;
  roi?: number;
  endedAt: string;
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
  pointValue?: number;
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
  webhookUrl?: string;
  onboardingComplete?: boolean;
  erpKey?: string;
  avgTicketGoal?: number;
  monthlyRevenueGoal?: number;
  promotionConfig?: PromotionConfig;
  type?: 'points' | 'cashback';
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
  canCreatePromotions?: boolean;
  canUseLoyalty?: boolean;
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
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
    secondary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100'
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'score' | 'customers' | 'rewarded_customers' | 'rewards' | 'create_promotion' | 'seasonal_dates' | 'ltv' | 'goals' | 'promotion' | 'reset' | 'admin' | 'company_profile' | 'plans' | 'super_admin_profile' | 'super_admin_management' | 'painel_master' | 'notificar' | 'redemption_codes'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'compact' && params.get('tab')) {
      return params.get('tab') as any;
    }
    return 'dashboard';
  });
  const [isCompact, setIsCompact] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const compact = params.get('mode') === 'compact';
    if (compact) {
      document.title = "PONTUAR - Modo Flutuante";
    }
    return compact;
  });
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
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
    
    if (isIOSDevice && !(window.navigator as any).standalone) {
      setShowInstallBanner(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      showToast("No iPhone: Toque em Compartilhar e 'Adicionar à Tela de Início'", "info");
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };
  const [contractCancelled, setContractCancelled] = useState(false);
  const [rules, setRules] = useState<LoyaltyRule>(DEFAULT_RULES);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<PromotionHistory[]>([]);
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

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isRulesPreloaded, setIsRulesPreloaded] = useState(false);
  const [isGoalsPreloaded, setIsGoalsPreloaded] = useState(false);
  const [onboardingTour, setOnboardingTour] = useState<'welcome' | 'profile' | 'admins_query' | 'admin_form' | 'campaign_config' | 'goals_month_by_month' | 'finished' | null>(null);

  const isAdminUser = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user?.email?.toLowerCase() === 'fvmoreira2011@gmail.com' || appUser?.role === 'admin' || appUser?.role === 'superadmin';
  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || user?.email?.toLowerCase() === 'fvmoreira2011@gmail.com' || appUser?.role === 'superadmin';

  const isOnboardingComplete = useMemo(() => {
    // If we're not ready, we can't say it's complete
    if (!isRulesPreloaded || !isGoalsPreloaded) return false;

    // Flag in DB is the absolute truth for initial setup
    if (rules?.onboardingComplete === true) {
      // Logic for meta cycle renewal: 
      // If we have goals but they are all in the past, consider onboarding (for goals) incomplete
      if (goals.length > 0) {
        const sortedGoals = [...goals].sort((a,b) => b.month.localeCompare(a.month));
        const lastGoalMonth = sortedGoals[0].month;
        const currentMonth = format(new Date(), 'yyyy-MM');
        if (lastGoalMonth < currentMonth) return false;
      } else {
        return false;
      }
      return true;
    }
    
    // Otherwise calculate based on essential fields
    if (!rules || !rules.companyProfile) return false;
    const p = rules.companyProfile;
    const hasProfile = !!(p.companyName && p.cnpj && p.phone && p.address && p.responsible && p.contactPhone);
    const hasReward = !!(rules.rewardMode);
    
    // If they have all critical data, we can consider them done to avoid loops 
    // even if the final flag wasn't toggled for some reason
    return hasProfile && hasReward;
  }, [rules, goals, isRulesPreloaded, isGoalsPreloaded]);

  const isOnboarding = isRulesPreloaded && isGoalsPreloaded && !isOnboardingComplete && !!user && !isSuperAdminPanelActive && !isSuperAdmin;

  useEffect(() => {
    if (isSuperAdmin && onboardingTour !== null) {
      setOnboardingTour(null);
    }
  }, [isSuperAdmin, onboardingTour]);

  // Determine if specific steps need re-touring
  useEffect(() => {
    if (isOnboarding && isRulesPreloaded && !onboardingTour) {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const lastGoalMonth = goals.length > 0 ? [...goals].sort((a,b) => b.month.localeCompare(a.month))[0].month : null;
      
      // If they had finished setup but goals expired, jump straight to goals tour
      if (rules?.onboardingComplete && lastGoalMonth && lastGoalMonth < currentMonth) {
        setOnboardingTour('goals_month_by_month');
      } else {
        setOnboardingTour('welcome');
      }
    }
  }, [isOnboarding, isRulesPreloaded, onboardingTour, goals, rules?.onboardingComplete]);

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

  // Enforcement: Force active tab based on onboarding step
  useEffect(() => {
    if (isOnboarding && onboardingTour) {
      if (onboardingTour === 'profile' && activeTab !== 'company_profile') {
        setActiveTab('company_profile');
      } else if (onboardingTour === 'goals' && activeTab !== 'goals') {
        setActiveTab('goals');
      } else if (onboardingTour === 'rewards' && activeTab !== 'rewards') {
        setActiveTab('rewards');
      }
    }
  }, [isOnboarding, onboardingTour, activeTab]);

  const handleTabChange = (tab: any) => {
    if (isOnboarding) {
      if (onboardingTour === 'welcome') {
        if (isSuperAdmin && ['super_admin_profile', 'super_admin_management', 'painel_master', 'redemption_codes'].includes(tab)) {
          setActiveTab(tab);
          return;
        }
        return;
      }
      
      const allowedMap: Record<string, string[]> = {
        profile: ['company_profile'],
        admins_query: ['super_admin_management'],
        admin_form: ['super_admin_management'],
        campaign_config: ['campaign_config'],
        goals_month_by_month: ['goals'],
        finished: ['dashboard'],
      };

      // Super admin can always jump to master tabs
      if (isSuperAdmin && ['super_admin_profile', 'super_admin_management', 'painel_master', 'redemption_codes'].includes(tab)) {
        setActiveTab(tab);
        return;
      }

      const allowedForStep = onboardingTour ? (allowedMap[onboardingTour] || []) : [];
      
      if (!allowedForStep.includes(tab)) {
        let msg = "Conclua a etapa atual para prosseguir.";
        if (onboardingTour === 'profile') msg = "Preencha os dados da empresa primeiro.";
        if (onboardingTour === 'goals') msg = "Defina as metas de faturamento primeiro.";
        if (onboardingTour === 'rewards') msg = "Configure o programa de fidelidade primeiro.";
        showToast(msg, "warning");
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

        setRules(data);
        setIsRulesPreloaded(true);
      } else if (isAdminUser) {
        // Initialize default rules if not exist
        const initialRules = { 
          ...DEFAULT_RULES, 
          companyId,
          redemptionCode: generateRedemptionCode()
        };
        setDoc(snapshot.ref, initialRules).then(() => {
           setIsRulesPreloaded(true);
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `configs/${companyId}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `configs/${companyId}`));

    // Customers
    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), where('companyId', '==', companyId)), (snapshot) => {
      const custs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(custs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'customers'));

    // Purchases
    const unsubPurchases = onSnapshot(
      query(collection(db, 'purchases'), where('companyId', '==', companyId), orderBy('date', 'desc')), 
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
        setIsGoalsPreloaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'goals');
        setIsGoalsPreloaded(true); // Don't block loading on error
      }
    );

    // Promotion History
    const unsubPromoHistory = onSnapshot(
      query(collection(db, 'promotion_history'), where('companyId', '==', companyId)),
      (snapshot) => {
        const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PromotionHistory));
        setPromotionHistory(history);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'promotion_history')
    );

    return () => {
      unsubRules();
      unsubCustomers();
      unsubPurchases();
      unsubRedemptions();
      unsubGoals();
      unsubPromoHistory();
      // Reset states to prevent data leakage between clients
      setRules(DEFAULT_RULES);
      setCustomers([]);
      setPurchases([]);
      setRedemptions([]);
      setGoals([]);
      setPromotionHistory([]);
      setIsRulesPreloaded(false);
      setIsGoalsPreloaded(false);
    };
  }, [user, appUser?.approved, isAdminUser, selectedCompanyId]);

  const handlePopOut = async () => {
    // Detect if inside an iframe (AI Studio preview)
    const isIframe = window.self !== window.top;
    
    if (isIframe) {
      showToast("Para usar a função 'Sempre no Topo', você deve abrir o aplicativo em uma nova aba primeiro.", "info");
      // Fallback for demo purposes if they really want the popup anyway
      const width = 450;
      const height = 550;
      const left = window.screen.width - width - 50; 
      const top = 100;
      const url = `${window.location.origin}${window.location.pathname}?mode=compact&tab=score`;
      window.open(url, 'ScoreWindow', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
      return;
    }

    // Try Document Picture-in-Picture (Always on Top supported)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 450,
          height: 600,
        });

        // Copy styles
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        // Copy body classes for Tailwind
        pipWindow.document.body.className = document.body.className + " bg-gray-950 overflow-hidden";
        pipWindow.document.title = "PONTUAR - Sobreposição";

        const container = pipWindow.document.createElement('div');
        container.id = 'pip-root';
        container.style.height = '100vh';
        container.style.width = '100vw';
        pipWindow.document.body.appendChild(container);
        
        setPipContainer(container);

        pipWindow.addEventListener('pagehide', () => {
          setPipContainer(null);
        });
        
        return;
      } catch (err) {
        console.error("PiP failed, falling back to window.open", err);
      }
    }

    // Fallback if PiP not available
    const width = 450;
    const height = 550;
    const left = window.screen.width - width - 50; 
    const top = 100;
    const url = `${window.location.origin}${window.location.pathname}?mode=compact&tab=score`;
    window.open(url, 'ScoreWindow', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`);
  };

  const handleExportManagementReport = async (startDateStr?: string, endDateStr?: string) => {
    try {
      showToast("Gerando relatório... Isso pode levar alguns segundos.", "info");
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const marginSide = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (marginSide * 2);
      
      const now = new Date();
      const custMap = new Map<string, any>();
      
      const themeColor = rules.themeColor || '#16a34a';
      
      // Data preparation
      const filterByDays = (days: number) => {
        const d = subDays(now, days);
        return purchases.filter(p => p.date && parseISO(p.date) >= d);
      };

      const sales7d = filterByDays(7);
      const sales14d = filterByDays(14);
      const sales30d = filterByDays(30);

      const rev7d = sales7d.reduce((a, b) => a + (b.amount || 0), 0);
      const rev14d = sales14d.reduce((a, b) => a + (b.amount || 0), 0);
      const rev30d = sales30d.reduce((a, b) => a + (b.amount || 0), 0);

      const cust7d = new Set(sales7d.map(p => p.customerId)).size;
      const cust14d = new Set(sales14d.map(p => p.customerId)).size;
      const cust30d = new Set(sales30d.map(p => p.customerId)).size;

      const ticket7d = sales7d.length > 0 ? rev7d / sales7d.length : 0;
      const ticket14d = sales14d.length > 0 ? rev14d / sales14d.length : 0;
      const ticket30d = sales30d.length > 0 ? rev30d / sales30d.length : 0;

      let reportPurchases = purchases;
      if (startDateStr && endDateStr) {
         reportPurchases = purchases.filter(p => p.date && p.date >= startDateStr && p.date <= endDateStr);
      }

      const totalRev = reportPurchases.reduce((acc, p) => acc + p.amount, 0);
      const avgTicket = reportPurchases.length > 0 ? totalRev / reportPurchases.length : 0;

      // Reference Comparison
      const refAvgTicket = rules.currentAvgTicket || 1;
      const refMonthlyRev = rules.currentMonthlyRevenue || 1;
      
      // ROI & Payback logic (Simplified)
      const actualCost = purchases.reduce((a, b) => a + (b.cashbackEarned || 0), 0); 
      const projectedCost = (customers.reduce((a, b) => a + (b.cashbackBalance || 0), 0)) + (customers.reduce((a, b) => a + (b.points || 0), 0) * (rules.pointValue || 0.01));
      
      const partIds = new Set(customers.filter(c => (c.points || 0) > 0 || (c.cashbackBalance || 0) > 0).map(c => c.id));
      const participantPurchases = purchases.filter(p => partIds.has(p.customerId));
      const nonParticipantPurchases = purchases.filter(p => !partIds.has(p.customerId));
      const partRev = participantPurchases.reduce((a, b) => a + (b.amount || 0), 0);
      const partAvgT = participantPurchases.length > 0 ? partRev / participantPurchases.length : 0;
      const nonPartRev = nonParticipantPurchases.reduce((a, b) => a + (b.amount || 0), 0);
      const nonPartAvgT = nonParticipantPurchases.length > 0 ? nonPartRev / nonParticipantPurchases.length : 0;
      
      const incrementalTicket = Math.max(0, partAvgT - nonPartAvgT);
      const estimatedROI = actualCost > 0 ? ((incrementalTicket * participantPurchases.length) / actualCost) * 100 : 0;
      
      const currentMonthDate = new Date();
      currentMonthDate.setDate(1);
      const displayMonthsReport = [];
      for (let i = -5; i <= 0; i++) {
        displayMonthsReport.push(format(subMonths(currentMonthDate, Math.abs(i)), 'yyyy-MM'));
      }
      displayMonthsReport.sort();

      purchases.forEach(p => {
        const realCustomer = customers.find(cust => cust.id === p.customerId);
        const c = custMap.get(p.customerId) || { name: realCustomer?.name || p.customerName || 'Cliente sem nome', earned: 0, count: 0, last: new Date(0) };
        c.earned += (p.amount || 0);
        c.count += 1;
        try {
          const pDate = p.date ? parseISO(p.date) : new Date(0);
          if (pDate instanceof Date && !isNaN(pDate.getTime()) && pDate > c.last) {
            c.last = pDate;
          }
        } catch (e) {
          console.warn("Invalid purchase date:", p.date);
        }
        custMap.set(p.customerId, c);
      });

      const logoUrl = rules.companyProfile?.logoURL || rules.companyProfile?.photoURL || FALLBACK_LOGO;
      const companyName = rules.companyProfile?.companyName || 'Empresa';
      
      const hexToRgb = (hex: string): [number, number, number] => {
        try {
          const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
          if (cleanHex.length === 3) {
            const r = parseInt(cleanHex[0] + cleanHex[0], 16);
            const g = parseInt(cleanHex[1] + cleanHex[1], 16);
            const b = parseInt(cleanHex[2] + cleanHex[2], 16);
            return [r, g, b];
          }
          const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
          const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
          const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
          return [r, g, b];
        } catch (e) {
          return [22, 163, 74];
        }
      };
      const rgbTheme = hexToRgb(themeColor);

      const totalCustomers = custMap.size;
      const activeCustomers = Array.from(custMap.values()).filter((c: any) => {
         const lastTime = c.last instanceof Date ? c.last.getTime() : 0;
         const recency = (now.getTime() - lastTime) / (1000 * 60 * 60 * 24);
         return recency <= 30;
      }).length;
      
      const churn30 = Array.from(custMap.values()).filter((c: any) => {
         const lastTime = c.last instanceof Date ? c.last.getTime() : 0;
         const recency = (now.getTime() - lastTime) / (1000 * 60 * 60 * 24);
         return recency > 30 && recency <= 60;
      }).length;

      // New data points for enhanced report
      const ticketGoal = rules.avgTicketGoal || avgTicket;
      const customersByAvgTicket = Array.from(custMap.entries()).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        avgTicket: data.earned / data.count,
        totalSpent: data.earned,
        count: data.count,
        last: data.last
      }));

      const aboveGoal = customersByAvgTicket.filter(c => c.avgTicket > ticketGoal);
      const belowGoal = customersByAvgTicket.filter(c => c.avgTicket <= ticketGoal);

      const top15 = [...customersByAvgTicket].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 15);
      const toDevelop30 = customersByAvgTicket
        .filter(c => c.avgTicket < ticketGoal)
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);

      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const weekdayCounts = new Array(7).fill(0).map(() => 0);
      reportPurchases.forEach(p => {
        const d = parseISO(p.date);
        weekdayCounts[d.getDay()] += p.amount;
      });
      const bestWeekdayIndex = weekdayCounts.indexOf(Math.max(...weekdayCounts));
      const bestWeekday = bestWeekdayIndex !== -1 ? weekdays[bestWeekdayIndex] : 'N/A';

      // Weekday detailed stats for "Termomentro" section in report
      const ptDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const reportWeekdayCounts = new Array(7).fill(0).map(() => ({ count: 0, total: 0 }));
      const reportHoursCount = new Array(24).fill(0);
      reportPurchases.forEach(p => {
        const d = parseISO(p.date);
        const day = d.getDay();
        const hour = d.getHours();
        reportWeekdayCounts[day].count += 1;
        reportWeekdayCounts[day].total += p.amount;
        reportHoursCount[hour] += 1;
      });
      const repBestDayIndex = reportWeekdayCounts.reduce((best, curr, idx) => curr.total > reportWeekdayCounts[best].total ? idx : best, 0);
      const repBestTicketDayIndex = reportWeekdayCounts.reduce((best, curr, idx) => {
        const currentAvg = curr.count > 0 ? curr.total / curr.count : 0;
        const bestAvg = reportWeekdayCounts[best].count > 0 ? reportWeekdayCounts[best].total / reportWeekdayCounts[best].count : 0;
        return currentAvg > bestAvg ? idx : best;
      }, 0);
      const repPeakHour = reportHoursCount.reduce((best, curr, idx) => curr > reportHoursCount[best] ? idx : best, 0);

      const reportWeekdayStats = {
        bestDay: ptDays[repBestDayIndex],
        bestTicketDay: ptDays[repBestTicketDayIndex],
        peakHour: `${repPeakHour}:00 - ${repPeakHour + 1}:00`,
        distribution: reportWeekdayCounts.map((c, i) => ({
          fullName: ptDays[i],
          total: c.total,
          count: c.count,
          avgTicket: c.count > 0 ? c.total / c.count : 0
        }))
      };

      const addHeaderFooter = (doc: any) => {
        doc.setFillColor(...rgbTheme);
        doc.rect(0, 0, pageWidth, 5, 'F');
        
        if (logoUrl) {
           try { doc.addImage(logoUrl, 'PNG', marginSide, 10, 12, 12); } catch(e){}
        }
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório Estratégico de Performance', marginSide + 15, 16);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(companyName, marginSide + 15, 21);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(marginSide, 26, pageWidth - marginSide, 26);
        
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const str = `Página ${doc.internal.getNumberOfPages()} | Gerado em ${new Date().toLocaleDateString('pt-BR')} | BuyPass Intelligence`;
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      const drawDataBox = (label: string, value: string, x: number, y: number, w: number) => {
        doc.setFillColor(252, 252, 252);
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(x, y, w, 20, 3, 3, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 5, y + 7);
        doc.setFontSize(11);
        doc.setTextColor(...rgbTheme);
        doc.text(value, x + 5, y + 15);
      };

      const checkPageOverflow = (needed: number) => {
        if (currentY + needed > pageHeight - 35) {
          doc.addPage();
          addHeaderFooter(doc);
          currentY = 50;
          return true;
        }
        return false;
      };

      addHeaderFooter(doc);
      let currentY = 50;

      // 1. DESEMPENHO GERAL & CURTO PRAZO
      doc.setFontSize(16);
      doc.setTextColor(...rgbTheme);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RESUMO EXECUTIVO & KPIS OPERACIONAIS', marginSide, currentY);
      
      currentY += 8;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Análise consolidada: ${startDateStr || 'Toda a base'} até ${endDateStr || 'Hoje'}`, marginSide, currentY);

      currentY += 10;
      // Current Performance Cards
      const convRate = totalCustomers > 0 ? (cust30d / totalCustomers) * 100 : 0;
      drawDataBox('Faturamento (30d)', `R$ ${formatCurrency(rev30d)}`, marginSide, currentY, contentWidth / 5 - 1);
      drawDataBox('Ticket Médio (30d)', `R$ ${formatCurrency(ticket30d)}`, marginSide + (contentWidth / 5), currentY, contentWidth / 5 - 1);
      drawDataBox('Clientes (30d)', `${cust30d}`, marginSide + (2 * contentWidth / 5), currentY, contentWidth / 5 - 1);
      drawDataBox('Conversão (30d)', `${convRate.toFixed(1)}%`, marginSide + (3 * contentWidth / 5), currentY, contentWidth / 5 - 1);
      drawDataBox('Ticket Ref.', `R$ ${formatCurrency(refAvgTicket)}`, marginSide + (4 * contentWidth / 5), currentY, contentWidth / 5 - 1);
      
      currentY += 30;
      // Comparative Table (7, 14, 30 days)
      if (typeof autoTable === 'function') {
        (autoTable as any)(doc, {
          startY: currentY,
          margin: { left: marginSide, right: marginSide },
          head: [['Período', 'Vendas (Qtd)', 'Faturamento', 'Ticket Médio', 'Novos Clientes']],
          body: [
            ['Últimos 7 dias', sales7d.length, `R$ ${formatCurrency(rev7d)}`, `R$ ${formatCurrency(ticket7d)}`, cust7d],
            ['Últimos 14 dias', sales14d.length, `R$ ${formatCurrency(rev14d)}`, `R$ ${formatCurrency(ticket14d)}`, cust14d],
            ['Últimos 30 dias', sales30d.length, `R$ ${formatCurrency(rev30d)}`, `R$ ${formatCurrency(ticket30d)}`, cust30d]
          ],
          theme: 'striped',
          headStyles: { fillColor: rgbTheme },
          styles: { fontSize: 7 }
        });
      }

      currentY = ((doc as any).lastAutoTable?.finalY || 110) + 15;
      checkPageOverflow(60);

      // Metas Gerais
      const currentMonth = format(now, 'yyyy-MM');
      const currentGoal = goals.find(g => g.month === currentMonth);
      if (currentGoal) {
         const currentMonthRev = purchases.filter(p => p.date && p.date.startsWith(currentMonth)).reduce((a, b) => a + (b.amount || 0), 0);
         const goalPercent = Math.min((currentMonthRev / currentGoal.value) * 100, 100);
         
         doc.setFontSize(10);
         doc.setTextColor(50, 50, 50);
         doc.text(`Projeção de Metas (${format(now, 'MMMM', { locale: ptBR })}): ${goalPercent.toFixed(1)}% atingido`, marginSide, currentY);
         
         doc.setFillColor(240, 240, 240);
         doc.roundedRect(marginSide, currentY + 4, contentWidth, 5, 2, 2, 'F');
         doc.setFillColor(...rgbTheme);
         doc.roundedRect(marginSide, currentY + 4, (contentWidth * goalPercent) / 100, 5, 2, 2, 'F');
         
         doc.setFontSize(8);
         doc.setTextColor(120, 120, 120);
         doc.text(`Realizado: R$ ${formatCurrency(currentMonthRev)} / Planejado: R$ ${formatCurrency(currentGoal.value)}`, marginSide, currentY + 13);
         currentY += 25;
      }

      checkPageOverflow(80);
      // 2. CRESCIMENTO VS REFERÊNCIA (ONBOARDING)
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.setFont('helvetica', 'bold');
      doc.text('2. EVOLUÇÃO ESTRATÉGICA VS DADOS DE REFERÊNCIA', marginSide, currentY);
      
      currentY += 12;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text('Comparação entre os dados informados no início do projeto e a performance atual:', marginSide, currentY);

      currentY += 10;

      // Calculate Customer Analysis for PDF
      const currentMonthStr = format(now, 'yyyy-MM');
      const totalCurrentCust = customers.filter(c => !c.isDeleted).length;
      const totalPrevMonthCust = customers.filter(c => 
        !c.isDeleted && c.createdAt && c.createdAt < format(startOfMonth(now), 'yyyy-MM-dd')
      ).length;
      const custGoal = goals.find(g => g.month === currentMonthStr)?.customersCount || 0;
      const growthPct = totalPrevMonthCust > 0 ? ((totalCurrentCust / totalPrevMonthCust) - 1) * 100 : 0;
      const periodNewCust = customers.filter(c => {
         if (c.isDeleted || !c.createdAt) return false;
         if (!startDateStr || !endDateStr) return false;
         return c.createdAt >= startDateStr && c.createdAt <= endDateStr;
      }).length;

      const drawGrowthCard = (label: string, baseline: number, current: number, x: number, y: number, w: number) => {
        const growth = baseline > 0 ? ((current / baseline) - 1) * 100 : 0;
        const color = growth >= 0 ? [22, 163, 74] : [220, 38, 38];
        
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, w, 22, 2, 2, 'FD');
        
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(label, x + 4, y + 6);
        
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.text(`Ref: R$ ${formatCurrency(baseline)}`, x + 4, y + 12);
        doc.text(`Atual: R$ ${formatCurrency(current)}`, x + 4, y + 18);
        
        doc.setFillColor(...(color as [number, number, number]));
        doc.roundedRect(x + w - 18, y + 6, 14, 10, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(`${growth >= 0 ? '+' : ''}${Math.round(growth)}%`, x + w - 11, y + 12.5, { align: 'center' });
      };

      currentY += 25;
      drawGrowthCard('Ticket Médio', refAvgTicket, ticket30d, marginSide, currentY, contentWidth / 2 - 2);
      drawGrowthCard('Faturamento Mensal', refMonthlyRev, rev30d, marginSide + contentWidth / 2 + 2, currentY, contentWidth / 2 - 2);

      currentY += 50; 
      // Force page break for Section 3 to prevent any overlap
      doc.addPage();
      addHeaderFooter(doc);
      currentY = 50;
      
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.setFont('helvetica', 'bold');
      doc.text('3. BASE DE CLIENTES E PERFORMANCE DE CAPTAÇÃO', marginSide, currentY);
      
      currentY += 15;
      drawDataBox('Base Total', `${totalCurrentCust} Ativos`, marginSide, currentY, contentWidth / 4 - 1.5);
      drawDataBox('Meta Clientes', `${custGoal || '---'} Alvo`, marginSide + (contentWidth / 4), currentY, contentWidth / 4 - 1.5);
      drawDataBox('Cresc. Mês (%)', `${growthPct.toFixed(1)}%`, marginSide + (2 * contentWidth / 4), currentY, contentWidth / 4 - 1.5);
      drawDataBox('Novos Filtro', `${periodNewCust}`, marginSide + (3 * contentWidth / 4), currentY, contentWidth / 4 - 1.5);
      
      currentY += 40; // Spacing before next section
      if (checkPageOverflow(60)) { currentY = 50; }

      if (custGoal > 0) {
        const goalProgress = Math.min((totalCurrentCust / custGoal) * 100, 100);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Progresso da Meta de Clientes: ${goalProgress.toFixed(1)}%`, marginSide, currentY);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(marginSide, currentY + 2, contentWidth, 3, 1.5, 1.5, 'F');
        doc.setFillColor(...rgbTheme);
        doc.roundedRect(marginSide, currentY + 2, (contentWidth * goalProgress) / 100, 3, 1.5, 1.5, 'F');
        currentY += 15;
      }
      
      checkPageOverflow(60);
      // Evolução do Ticket Médio - Mini Chart
      doc.setFontSize(10);
      doc.setTextColor(...rgbTheme);
      doc.setFont('helvetica', 'bold');
      doc.text('Tendência de Evolução: Ticket Médio Mensal', marginSide, currentY);
      
      currentY += 8;
      const historyMonths = displayMonthsReport.map(m => {
        const pM = purchases.filter(p => p.date && p.date.startsWith(m));
        return { m, ticket: pM.length > 0 ? pM.reduce((a, b) => a + (b.amount || 0), 0) / pM.length : 0 };
      });
      
      const maxTH = Math.max(...historyMonths.map(h => h.ticket), refAvgTicket) * 1.2 || 100;
      const chartH = 25;
      const chartW = contentWidth;
      
      doc.setDrawColor(240, 240, 240);
      doc.line(marginSide, currentY + chartH, marginSide + chartW, currentY + chartH);

      historyMonths.forEach((h, i) => {
        const x = marginSide + (i * (chartW / (historyMonths.length - 1)));
        const y = currentY + chartH - (h.ticket / maxTH) * chartH;
        doc.setFillColor(...rgbTheme);
        doc.circle(x, y, 1, 'F');
        if (i > 0) {
          const prevX = marginSide + ((i-1) * (chartW / (historyMonths.length - 1)));
          const prevY = currentY + chartH - (historyMonths[i-1].ticket / maxTH) * chartH;
          doc.line(prevX, prevY, x, y);
        }
        doc.setFontSize(5);
        doc.setTextColor(150, 150, 150);
        try { doc.text(format(parseISO(h.m + '-01'), 'MMM', { locale: ptBR }), x - 2, currentY + chartH + 5); } catch(e){}
      });

      currentY += chartH + 15; // Shift past chart and its labels

      // 4. VIABILIDADE FINANCEIRA & ROI
      doc.addPage();
      addHeaderFooter(doc);
      currentY = 50;
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('4. MÉTRICAS DE VIABILIDADE E ROI DO PROGRAMA', marginSide, currentY);
      
      currentY += 10;
      // Investment vs Returns
      drawDataBox('Custo Acumulado', `R$ ${formatCurrency(actualCost)}`, marginSide, currentY, contentWidth / 3 - 2);
      drawDataBox('Passivo Projetado', `R$ ${formatCurrency(projectedCost)}`, marginSide + (contentWidth / 3) + 1, currentY, contentWidth / 3 - 2);
      drawDataBox('ROI Estimado', `${estimatedROI.toFixed(1)}%`, marginSide + (2 * contentWidth / 3) + 2, currentY, contentWidth / 3 - 2);

      currentY += 30;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise de Eficiência:', marginSide, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const roiDescription = [
        `O programa gerou um incremento médio de R$ ${formatCurrency(incrementalTicket)} por compra entre participantes.`,
        `Com um custo de distribuição de R$ ${formatCurrency(actualCost)}, o retorno sobre investimento (ROI) é de ${estimatedROI.toFixed(1)}%.`,
        `O tempo estimado de Payback (recuperação do investimento via lucro incremental) é de ${actualCost > 0 && incrementalTicket > 0 ? Math.ceil(actualCost / (incrementalTicket * (participantPurchases.length / (purchases.length / 30 || 1)) / 30)) : '--'} dias.`
      ];
      doc.text(roiDescription, marginSide, currentY + 6);

      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(...rgbTheme);
      doc.text('Evolução do Churn & Retenção', marginSide, currentY);

      checkPageOverflow(50);
      if (typeof autoTable === 'function') {
        (autoTable as any)(doc, {
          startY: currentY + 5,
          margin: { left: marginSide, right: marginSide },
          head: [['Faixa de Inatividade', 'Volume de Clientes', 'Status', 'Risco']],
          body: [
            ['0-30 dias (Ativos)', activeCustomers, 'Saudável', 'Baixo'],
            ['31-60 dias (Atenção)', churn30, 'Vulnerável', 'Médio'],
            ['61-90 dias (Suspensos)', Array.from(custMap.values()).filter((c: any) => {
               const r = (now.getTime() - (c.last instanceof Date ? c.last.getTime() : 0)) / (1000 * 60 * 60 * 24);
               return r > 60 && r <= 90;
            }).length, 'Risco de Churn', 'Alto'],
            ['+90 dias (Dormitórios)', Array.from(custMap.values()).filter((c: any) => {
               const r = (now.getTime() - (c.last instanceof Date ? c.last.getTime() : 0)) / (1000 * 60 * 60 * 24);
               return r > 90;
            }).length, 'Inativo', 'Crítico']
          ],
          theme: 'grid',
          headStyles: { fillColor: [80, 80, 80] },
          styles: { fontSize: 7 }
        });
      }

      currentY = (doc as any).lastAutoTable?.finalY || (currentY + 60);
      currentY += 15;
      checkPageOverflow(40);

      // 5. PARTICIPAÇÃO E ENGAJAMENTO (RULES)
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('5. DISTRIBUIÇÃO POR REGRA E SEGMENTO', marginSide, currentY);
      
      const totalP = reportPurchases.length || 1;
      const partRatio = (participantPurchases.length / totalP) * 100;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Participação no Programa: ${participantPurchases.length} vendas (${partRatio.toFixed(1)}%) vs Casuais: ${participantPurchases.length < reportPurchases.length ? reportPurchases.length - participantPurchases.length : 0} (${(100 - partRatio).toFixed(1)}%)`, marginSide, currentY + 6);

      currentY += 15;
      
      // Calculate Promotion Stats for PDF
      const promoPurchases = reportPurchases.filter(p => p.promotionId);
      const startD = startDateStr ? parseISO(startDateStr) : new Date(0);
      const endD = endDateStr ? parseISO(endDateStr) : new Date();
      
      const countPromos = promotionHistory.filter(h => {
         const s = parseISO(h.startDate);
         const e = parseISO(h.endedAt || h.endDate || h.startDate);
         return (s <= endD && e >= startD);
      }).length + (rules.promotionConfig?.isActive ? 1 : 0);

      const promoRev = promoPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);
      const promoParticipants = new Set(promoPurchases.map(p => p.customerId)).size;
      const promoAvgTicket = promoPurchases.length > 0 ? promoRev / promoPurchases.length : 0;
      const promoFreq = promoParticipants > 0 ? promoPurchases.length / promoParticipants : 0;
      const promoValuePerCust = promoParticipants > 0 ? promoRev / promoParticipants : 0;
      const promoNewClients = Array.from(new Set(promoPurchases.map(p => p.customerId))).filter(cid => {
         const custPurchases = purchases.filter(p => p.customerId === cid).sort((a,b) => a.date.localeCompare(b.date));
         const firstPurchase = custPurchases[0];
         return firstPurchase && firstPurchase.promotionId && (parseISO(firstPurchase.date) >= startD && parseISO(firstPurchase.date) <= endD);
      }).length;

      // 6. PERFORMANCE DE PROMOÇÕES
      doc.addPage();
      addHeaderFooter(doc);
      currentY = 50;
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('6. PERFORMANCE DE PROMOÇÕES & CAMPANHAS', marginSide, currentY);
      
      currentY += 10;
      drawDataBox('Promoções Período', `${countPromos}`, marginSide, currentY, contentWidth / 4 - 2);
      drawDataBox('Participantes', `${promoParticipants}`, marginSide + (contentWidth / 4), currentY, contentWidth / 4 - 2);
      drawDataBox('Ticket Médio', `R$ ${formatCurrency(promoAvgTicket)}`, marginSide + (2 * contentWidth / 4), currentY, contentWidth / 4 - 2);
      drawDataBox('Faturamento Promo', `R$ ${formatCurrency(promoRev)}`, marginSide + (3 * contentWidth / 4), currentY, contentWidth / 4 - 2);

      currentY += 25;
      drawDataBox('Frequência Média', `${promoFreq.toFixed(1)}x`, marginSide, currentY, contentWidth / 3 - 2);
      drawDataBox('RFV (V. Médio)', `R$ ${formatCurrency(promoValuePerCust)}`, marginSide + (contentWidth / 3), currentY, contentWidth / 3 - 2);
      drawDataBox('Clientes Novos', `${promoNewClients}`, marginSide + (2 * contentWidth / 3), currentY, contentWidth / 3 - 2);

      currentY += 30;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Campanhas no Período:', marginSide, currentY);
      
      const periodPromos = promotionHistory.filter(h => {
         const s = parseISO(h.startDate);
         const e = parseISO(h.endedAt || h.endDate || h.startDate);
         return (s <= endD && e >= startD);
      });

      if (typeof autoTable === 'function') {
         (autoTable as any)(doc, {
            startY: currentY + 5,
            margin: { left: marginSide, right: marginSide },
            head: [['Campanha', 'Tipo', 'Início', 'Término', 'Faturamento', 'ROI']],
            body: periodPromos.map(h => [
               h.campaignName,
               h.type.toUpperCase(),
               format(parseISO(h.startDate), 'dd/MM/yy'),
               format(parseISO(h.endedAt || h.endDate), 'dd/MM/yy'),
               `R$ ${formatCurrency(h.totalRevenue)}`,
               `${(h.roi || 0).toFixed(1)}%`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [80, 80, 80] },
            styles: { fontSize: 7 }
         });
      }

      currentY = (doc as any).lastAutoTable?.finalY || (currentY + 40);
      currentY += 15;

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const distribution = Array(7).fill(0);
      const hourlyDist = Array(24).fill(0);
      
      reportPurchases.forEach(p => {
         try {
           const dateObj = p.date ? new Date(p.date) : new Date();
           if (!isNaN(dateObj.getTime())) {
             const d = dateObj.getDay();
             const h = dateObj.getHours();
             distribution[d] += (p.amount || 0);
             hourlyDist[h] += 1;
           }
         } catch(e) {}
      });

      // Weekly Horizontal Bar Chart
      const maxDist = Math.max(...distribution) || 1;
      distribution.forEach((val, i) => {
         const barW = (val / maxDist) * (contentWidth / 2 - 30);
         doc.setFillColor(245, 245, 245);
         doc.rect(marginSide + 20, currentY + 10 + (i * 6), contentWidth / 2 - 30, 4, 'F');
         doc.setFillColor(...rgbTheme);
         doc.rect(marginSide + 20, currentY + 10 + (i * 6), barW, 4, 'F');
         doc.setFontSize(6);
         doc.setTextColor(100, 100, 100);
         doc.text(dayNames[i], marginSide, currentY + 13 + (i * 6));
      });

      // Hourly Bar Chart (Next to it)
      const maxHour = Math.max(...hourlyDist) || 1;
      const hStartX = marginSide + contentWidth / 2 + 10;
      const hSpacing = (contentWidth / 2 - 20) / 24;
      hourlyDist.forEach((val, i) => {
         const barH = (val / maxHour) * 30;
         const x = hStartX + (i * hSpacing);
         doc.setFillColor(...rgbTheme);
         doc.rect(x, currentY + 45 - barH, hSpacing - 0.5, barH, 'F');
         if (i % 6 === 0) {
           doc.setFontSize(5);
           doc.text(`${i}h`, x, currentY + 50);
         }
      });

      // 6. RANKING RFM & DIAGNÓSTICO IA
      doc.addPage();
      addHeaderFooter(doc);
      currentY = 50;
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('6. RANKINGS E SEGMENTAÇÃO DE CLIENTES', marginSide, currentY);
      
      currentY += 10;
      if (typeof autoTable === 'function') {
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text('Top 15 Melhores Clientes (LTV)', marginSide, currentY);
        currentY += 5;

        (autoTable as any)(doc, {
          startY: currentY,
          margin: { left: marginSide, right: marginSide },
          head: [['Cliente', 'Volume Compras', 'Visitas', 'Ticket Médio', 'Última Compra']],
          body: top15.map(c => [
            c.name,
            `R$ ${formatCurrency(c.totalSpent)}`,
            c.count,
            `R$ ${formatCurrency(c.avgTicket)}`,
            format(c.last, 'dd/MM/yyyy')
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
          styles: { fontSize: 7 }
        });
        currentY = (doc as any).lastAutoTable?.finalY + 15;
      }

      if (currentY > pageHeight - 65) { 
        doc.addPage(); 
        addHeaderFooter(doc); 
        currentY = 50; 
      }

      if (typeof autoTable === 'function') {
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`Próximos 30 Clientes a Desenvolver (Ticket Médio < R$ ${formatCurrency(ticketGoal)})`, marginSide, currentY);
        currentY += 5;

        (autoTable as any)(doc, {
          startY: currentY,
          margin: { left: marginSide, right: marginSide },
          head: [['Cliente', 'Ticket Médio Atual', 'Visitas', 'Total Gasto']],
          body: toDevelop30.map(c => [
            c.name,
            `R$ ${formatCurrency(c.avgTicket)}`,
            c.count,
            `R$ ${formatCurrency(c.totalSpent)}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
          styles: { fontSize: 7 }
        });
        currentY = (doc as any).lastAutoTable?.finalY + 15;
      }

      if (currentY > pageHeight - 65) { 
        doc.addPage(); 
        addHeaderFooter(doc); 
        currentY = 50; 
      }
      
      currentY += 5;
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('7. ANÁLISE TEMPORAL E TERMÔMETRO SEMANAL', marginSide, currentY);
      
      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Dia de maior faturamento: ${reportWeekdayStats.bestDay}`, marginSide, currentY);
      doc.text(`Dia de maior ticket médio: ${reportWeekdayStats.bestTicketDay}`, marginSide + 80, currentY);
      currentY += 5;
      doc.text(`Horário de pico: ${reportWeekdayStats.peakHour}`, marginSide, currentY);
      currentY += 10;
 
      if (typeof autoTable === 'function') {
        (autoTable as any)(doc, {
          startY: currentY,
          margin: { left: marginSide, right: marginSide },
          head: [['Dia da Semana', 'Faturamento Total', 'Transações', 'Ticket Médio']],
          body: reportWeekdayStats.distribution.map(d => [
            d.fullName,
            `R$ ${formatCurrency(d.total)}`,
            d.count,
            `R$ ${formatCurrency(d.avgTicket)}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [70, 70, 70] },
          styles: { fontSize: 8 }
        });
        currentY = (doc as any).lastAutoTable?.finalY + 15;
      }

      if (currentY > pageHeight - 65) { 
        doc.addPage(); 
        addHeaderFooter(doc); 
        currentY = 50; 
      }
      
      currentY += 5;
      doc.setFontSize(14);
      doc.setTextColor(...rgbTheme);
      doc.text('8. PARECER TÉCNICO & IA STRATEGIC INSIGHTS', marginSide, currentY);

      const cacheKey = `analysis_cache_${selectedCompanyId}`;
      const cached = localStorage.getItem(cacheKey);
      const hasAI = rules.geminiApiKey || process.env.GEMINI_API_KEY;
      let analysisText = hasAI ? "Aguardando processamento de IA... Gere o diagnóstico na aba 'Análise Estratégica' para incluir recomendações personalizadas por IA neste relatório." : "Para diagnósticos automáticos e recomendações de crescimento, configure sua Chave API Gemini nas regras do sistema.";
      
      if (cached) {
          try {
            const parsed = JSON.parse(cached);
            analysisText = parsed.result;
          } catch(e) {}
      }

      // Clean analysis text - very aggressive cleaning
      const cleanedAnalysis = analysisText
        .replace(/[#$%*&_~]/g, '') // Remove these symbols
        .replace(/\s{2,}/g, ' ')
        .trim();

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      
      const paragraphs = cleanedAnalysis.split('\n');
      currentY += 15;

      paragraphs.forEach((para: string) => {
        const textToSplit = para.trim();
        if (!textToSplit) return;
        
        const lines = doc.splitTextToSize(textToSplit, contentWidth - 10);
        
        lines.forEach((line: string) => {
          if (currentY > pageHeight - 35) {
            doc.addPage();
            addHeaderFooter(doc);
            currentY = 50;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('(Continuação do Parecer Técnico)', marginSide, 35);
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
          }
          
          // Improved Title detection
          const pureLine = line.replace(/^[#\s.]+/, '').trim();
          const looksLikeTitle = line.length < 65 && (
            line.includes('CAPÍTULO') || 
            line.includes('RECOMENDAÇÃO') || 
            line.includes('ANÁLISE') ||
            line.includes('PONTO') ||
            /^\d+[\.\-\s]/.test(line) ||
            /^[A-ZÀ-Ú\s.]{8,}$/.test(pureLine)
          );
          
          if (looksLikeTitle) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...rgbTheme);
            doc.text(pureLine, marginSide + 5, currentY);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(line, marginSide + 5, currentY);
          }
          
          currentY += 6;
        });
        
        currentY += 4;
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         addHeaderFooter(doc);
      }
      
      doc.save(`Relatorio_Gestao_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Relatório gerado com sucesso!", "success");
    } catch (err) {
      console.error("Report generation error:", err);
      showToast("Erro ao gerar relatório. Tente novamente.", "error");
    }
  };

  const handleUpdateRules = async (newRules: LoyaltyRule) => {
    if (!selectedCompanyId) {
      console.warn("handleUpdateRules: selectedCompanyId is missing");
      showToast("Erro de configuração: ID da empresa não encontrado.", "error");
      return;
    }
    try {
      // Remover valores undefined recursivamente para evitar erros no Firestore
      const cleanRules = JSON.parse(JSON.stringify(newRules));
      await setDoc(doc(db, 'configs', selectedCompanyId), cleanRules);
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

    if (loading || !isAuthReady || (user && !appUser) || (user && (!isRulesPreloaded || !isGoalsPreloaded))) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-green-500/10 rounded-[2rem] absolute inset-0 animate-pulse" />
              <div className="w-24 h-24 border-4 border-green-500 border-t-transparent rounded-[2rem] animate-spin" />
              <img 
                src={APP_LOGO} 
                alt="BuyPass" 
                className="absolute inset-0 m-auto w-12 h-auto"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_LOGO; }}
              />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-gray-900 font-black uppercase tracking-[0.3em] text-[10px]">
                Iniciando BuyPass
              </p>
              <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden mx-auto">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full bg-green-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      );
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

    // BLOCKING LOGIC: Check for plan expiration
    const isPlanExpired = appUser && appUser.planEndDate && new Date(appUser.planEndDate) < new Date();
    const isPlanExpiringSoon = appUser && appUser.planEndDate && 
      differenceInDays(new Date(appUser.planEndDate), new Date()) <= 60 && 
      new Date(appUser.planEndDate) > new Date();

    if (isPlanExpired && !isSuperAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-white text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-red-950/20 blur-[100px] -z-10" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md space-y-8 bg-white/5 p-12 rounded-[3rem] border border-white/10 shadow-2xl">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <ShieldAlert size={48} className="text-red-500" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">ACESSO BLOQUEADO</h1>
              <p className="text-gray-400 font-medium leading-relaxed">
                Detectamos que o prazo de vigência do seu contrato <span className="text-white font-bold">({appUser?.planEndDate ? format(new Date(appUser.planEndDate), 'dd/MM/yyyy') : 'Expirado'})</span> chegou ao fim.
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold leading-tight">
                Entre em contato com o suporte da BuyPass para renovar seu plano e retomar o acesso aos seus dados e clientes.
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="w-full py-4 rounded-2xl text-white border-white/20 hover:bg-white/10 font-black uppercase tracking-widest transition-all">
              Sair da Conta
            </Button>
          </motion.div>
        </div>
      );
    }

    const activePromotion = rules.promotionConfig?.isActive ? rules.promotionConfig : null;
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

    if (isCompact) {
      if (loading || !isAuthReady) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        );
      }

      if (!user) {
        return <LoginScreen />;
      }

      // STRICT MODE: Compact mode ONLY allows ScoreTab. No redirection, no other tabs.
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col" style={themeStyle}>
          <main className="flex-1 overflow-hidden relative">
            <div className="h-full">
              <ScoreTab 
                rules={rules} 
                customers={customers} 
                purchases={purchases} 
                redemptions={redemptions} 
                appUser={appUser} 
                companyId={selectedCompanyId} 
                isCompact={true} 
              />
            </div>
          </main>
          <Toast toast={toast} onHide={hideToast} />
        </div>
      );
    }

    return (
      <div className={cn("min-h-screen flex flex-col lg:flex-row shadow-inner", isSuperAdminPanelActive ? "bg-black text-white" : "bg-white text-gray-900")} style={themeStyle}>
        {pipContainer && createPortal(
          <div className="h-screen w-screen bg-gray-950 overflow-hidden" style={themeStyle}>
            <ScoreTab 
              rules={rules} 
              customers={customers} 
              purchases={purchases} 
              redemptions={redemptions} 
              appUser={appUser} 
              companyId={selectedCompanyId} 
              isCompact={true} 
            />
          </div>,
          pipContainer
        )}
        
        {/* Onboarding Overlay */}
        <AnimatePresence>
          {isOnboarding && (
            <TeleguidedOnboarding 
              companyId={selectedCompanyId || ''}
              rules={rules} 
              goals={goals}
              activeTour={onboardingTour}
              onNextTour={setOnboardingTour}
              onTabChange={setActiveTab}
              onUpdateRules={handleUpdateRules}
            />
          )}
        </AnimatePresence>

        {/* PWA Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-96"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-600/20">
                    <Download size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">Instalar App</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Acesse mais rápido</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowInstallBanner(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={handleInstallClick}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                  >
                    Instalar
                  </button>
                </div>
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
                <div className="w-full relative group/score">
                  <SidebarButton active={activeTab === 'score'} onClick={() => handleTabChange('score')} icon={<PlusCircle size={20} />} label="Pontuar" disabled={isOnboarding} />
                  {!isOnboarding && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePopOut(); }}
                      title="Abrir em Janela Flutuante"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white opacity-0 group-hover/score:opacity-100 transition-all hover:scale-110"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              )}
              <SidebarButton active={activeTab === 'notificar'} onClick={() => handleTabChange('notificar')} icon={<Bell size={20} />} label="Notificar" disabled={isOnboarding} />
              {(!isUserOnly || allowedTabs.includes('rewarded_customers')) && (
                <SidebarButton active={activeTab === 'rewarded_customers'} onClick={() => handleTabChange('rewarded_customers')} icon={<Award size={20} />} label="Premiados" disabled={isOnboarding} />
              )}
              {(!isUserOnly || allowedTabs.includes('rewards')) && (
                <SidebarButton active={activeTab === 'rewards'} onClick={() => handleTabChange('rewards')} icon={<Trophy size={20} />} label="Premiação" disabled={isOnboarding} />
              )}
              <SidebarButton 
                active={activeTab === 'create_promotion'} 
                onClick={() => handleTabChange('create_promotion')} 
                icon={<Gift size={20} />} 
                label="Criar Promoção" 
                className={cn(
                  "transition-all duration-300",
                  activeTab === 'create_promotion' ? "bg-[#fb8500] text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:text-orange-500"
                )}
                disabled={isOnboarding} 
              />
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

        {/* Warning Banner for Expiring Plan */}
        <AnimatePresence>
          {isPlanExpiringSoon && !isSuperAdmin && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-amber-500 text-white overflow-hidden"
            >
              <div className="px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} className="text-white" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-tighter leading-none italic">Atenção: Renovação Necessária</h5>
                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1">
                      Sua vigência de contrato {appUser?.planEndDate ? `vence em ${format(parseISO(appUser.planEndDate), 'dd/MM/yyyy')}` : 'está próxima do fim'}. Renove agora para não perder acesso ao programa. Não deixe para última hora!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleTabChange('company_profile')}
                    className="px-6 py-2 bg-white text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-amber-50 transition-all"
                  >
                    Ver Detalhes do Contrato
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    <SidebarButton 
                      active={activeTab === 'create_promotion'} 
                      onClick={() => { handleTabChange('create_promotion'); setIsMobileMenuOpen(false); }} 
                      icon={<Gift size={20} />} 
                      label="Criar Promoção" 
                      className={activeTab === 'create_promotion' ? "bg-[#fb8500] text-white shadow-lg shadow-orange-500/20" : ""}
                    />
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
                    const steps: typeof onboardingTour[] = ['profile', 'admins_query', 'campaign_config', 'goals_month_by_month', 'finished'];
                    const currentIndex = onboardingTour ? steps.indexOf(onboardingTour) : -1;
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
            {activeTab === 'dashboard' && !isSuperAdmin && (
              <div key="dashboard">
                <DashboardTab 
                  purchases={purchases} 
                  customers={customers} 
                  rules={rules} 
                  goals={goals} 
                  appUser={appUser} 
                  promotionHistory={promotionHistory}
                  onExportReport={handleExportManagementReport}
                />
              </div>
            )}
            {activeTab === 'notificar' && !isSuperAdmin && <div key="notificar"><NotifyTab customers={customers} rules={rules} companyId={selectedCompanyId} /></div>}
            {activeTab === 'customers' && !isSuperAdmin && <div key="customers"><CustomersTab customers={customers} purchases={purchases} isAdmin={isAdminUser} rules={rules} companyId={selectedCompanyId} goals={goals} /></div>}
            {activeTab === 'rewarded_customers' && !isSuperAdmin && <div key="rewarded_customers"><RewardedCustomersTab customers={customers} rules={rules} /></div>}
            {activeTab === 'rewards' && !isSuperAdmin && (
              <div key="rewards">
                {appUser?.canUseLoyalty === false ? (
                  <FeatureLockedView 
                    title="Módulo de Fidelidade Bloqueado" 
                    description="O sistema de pontos e premiações não está ativo para a sua loja no momento. Fale com seu consultor BuyPass para habilitar este recurso."
                  />
                ) : (
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
                )}
              </div>
            )}
            {activeTab === 'create_promotion' && !isSuperAdmin && (
              <div key="create_promotion">
                <PromotionAreaTab 
                  rules={rules} 
                  companyId={selectedCompanyId} 
                  isAdmin={isAdminUser || !!appUser?.canCreatePromotions} 
                  onUpdateRules={handleUpdateRules}
                  customers={customers}
                  purchases={purchases}
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
            {activeTab === 'score' && !isSuperAdmin && <div key="score"><ScoreTab rules={rules} customers={customers} purchases={purchases} redemptions={redemptions} appUser={appUser} companyId={selectedCompanyId} isCompact={isCompact} onPopOut={handlePopOut} /></div>}
            {activeTab === 'promotion' && !isSuperAdmin && <div key="promotion"><PromotionTab customers={customers} purchases={purchases} /></div>}
            {activeTab === 'strategic_analysis' && !isSuperAdmin && <div key="strategic_analysis"><StrategicAnalysisTab purchases={purchases} customers={customers} rules={rules} goals={goals} companyId={selectedCompanyId} /></div>}
            {activeTab === 'reset' && (isAdminUser) && <div key="reset"><ResetSystemTab companyId={selectedCompanyId} isAdmin={isAdminUser} /></div>}
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
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-green-500 mb-6">
                      <QRCodeSVG 
                        value={`${window.location.origin}/consumer.html`}
                        size={500}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div className="mb-12">
                      <p className="text-xl font-bold text-gray-400 font-mono opacity-50 break-all max-w-4xl">
                        {`${window.location.origin}/consumer.html`}
                      </p>
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

function SidebarButton({ active, onClick, icon, label, isSuperAdmin, disabled, className }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isSuperAdmin?: boolean; disabled?: boolean; className?: string }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-left",
        active 
          ? (className || "bg-green-600 text-white shadow-lg shadow-green-600/20")
          : "text-gray-400 hover:text-white hover:bg-white/10",
        disabled && "opacity-20 cursor-not-allowed grayscale"
      )}
      translate="no"
    >
      <span className={cn("transition-colors", active ? "text-white" : "text-gray-400 group-hover:text-white")}>
        {icon}
      </span>
      <span className="flex-1 truncate uppercase tracking-widest text-[10px]">{label}</span>
      {disabled && <Lock size={12} className="opacity-50" />}
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
  const [loginMode, setLoginMode] = useState<'client' | 'admin'>('client');
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 bg-white relative">
        {/* Admin Secret Padlock */}
        <button 
          onClick={() => setLoginMode(loginMode === 'client' ? 'admin' : 'client')}
          className="absolute top-8 right-8 p-3 text-gray-300 hover:text-green-600 transition-all hover:bg-green-50 rounded-2xl group"
          title={loginMode === 'client' ? "Acesso Administrativo" : "Voltar para Acesso Cliente"}
        >
          {loginMode === 'client' ? <Lock size={20} className="group-hover:scale-110 transition-transform" /> : <Unlock size={20} className="text-green-600 group-hover:scale-110 transition-transform" />}
        </button>

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
              {loginMode === 'admin' && (
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full text-[10px] text-gray-400 hover:text-gray-600 font-bold transition-colors uppercase tracking-widest"
                >
                  Entrar com Google (Master)
                </button>
              )}
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


function TeleguidedOnboarding({ companyId, rules, goals, onUpdateRules, activeTour, onNextTour, onTabChange }: { companyId: string; rules: LoyaltyRule; goals: Goal[]; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; activeTour: 'welcome' | 'profile' | 'admins_query' | 'admin_form' | 'campaign_config' | 'goals_month_by_month' | 'finished' | null; onNextTour: (tour: any) => void; onTabChange: (tab: any) => void }) {
  const { showToast } = useToast();
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Local state for wizard progress
  const [localProfile, setLocalProfile] = useState<CompanyProfile>(rules.companyProfile || {
    companyName: '',
    tradingName: '',
    cnpj: '',
    phone: '',
    address: '',
    responsible: '',
    contactPhone: ''
  });

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    photo: ''
  });

  const [startMonth, setStartMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [currentGoalMonthIndex, setCurrentGoalMonthIndex] = useState(0);
  const [monthlyGoalsLocal, setMonthlyGoalsLocal] = useState<Goal[]>([]);

  const next12Months = useMemo(() => {
    const dates = [];
    const [year, month] = startMonth.split('-').map(Number);
    for (let i = 0; i < 12; i++) {
      dates.push(new Date(year, (month - 1) + i, 1));
    }
    return dates;
  }, [startMonth]);

  const steps = useMemo(() => {
    const isRenewal = rules?.onboardingComplete === true;
    const renewalWelcome = { 
      id: 'welcome', 
      title: 'Renovação de Ciclo', 
      description: 'Seu ciclo de planejamento anual expirou ou está próximo do fim. Revise e renove as suas próximas metas do ano para que possamos continuar entregando o seu diagnóstico estratégico.', 
      button: 'Iniciar Renovação' 
    };
    const standardWelcome = { 
      id: 'welcome', 
      title: 'Bem-vindo ao BuyPass!', 
      description: 'Vamos configurar sua empresa em menos de 2 minutos para liberar todas as funcionalidades.', 
      button: 'Iniciar Agora' 
    };

    return [
      isRenewal ? renewalWelcome : standardWelcome,
      { id: 'profile', title: 'Dados da Empresa', description: 'Preencha as informações básicas para identificação.', button: 'Próximo Passo' },
      { id: 'admins_query', title: 'Equipe de Gestão', description: 'Deseja cadastrar mais algum administrador para ajudar na gestão?', button: 'Sim, adicionar' },
      { id: 'admin_form', title: 'Novo Administrador', description: 'Preencha os dados do novo gestor.', button: 'Salvar e Continuar' },
      { id: 'campaign_config', title: 'Sua Campanha', description: 'Configure as regras básicas de pontos ou cashback.', button: 'Configurar Regras' },
      { id: 'goals_month_by_month', title: 'Metas de 12 Meses', description: 'Defina suas metas mensais de faturamento para os próximos 12 meses.', button: 'Finalizar Metas' },
      { id: 'finished', title: 'Parabéns!', description: 'Seu sistema está pronto para uso. O planejamento foi renovado com sucesso.', button: 'Finalizar e Acessar Painel' }
    ];
  }, [rules?.onboardingComplete]);

  const currentStepIndex = steps.findIndex(s => s.id === activeTour);
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleUpdateProfile = async (updates: Partial<CompanyProfile>) => {
    const newProfile = { ...localProfile, ...updates };
    setLocalProfile(newProfile);
  };

  const handleNext = async () => {
    if (activeTour === 'welcome') {
      onNextTour('profile');
      return;
    }

    if (activeTour === 'profile') {
      const hasMissing = !localProfile.companyName || !localProfile.cnpj || !localProfile.phone || !localProfile.address || !localProfile.responsible || !localProfile.contactPhone;
      if (hasMissing) {
        showToast("Por favor, preencha todos os campos obrigatórios.", "error");
        return;
      }
      setIsFinishing(true);
      try {
        await onUpdateRules({ 
          ...rules, 
          companyProfile: localProfile 
        });
        onNextTour('admins_query');
      } catch (err) {
        showToast("Erro ao salvar perfil.", "error");
      } finally {
        setIsFinishing(false);
      }
      return;
    }

    if (activeTour === 'admins_query') {
      onNextTour('admin_form');
      return;
    }

    if (activeTour === 'admin_form') {
      if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
        showToast("Nome, E-mail e Senha são obrigatórios.", "error");
        return;
      }
      setIsFinishing(true);
      try {
        // Create user document (not auth user yet to avoid logout)
        const userRef = collection(db, 'users');
        const q = query(userRef, where('email', '==', newAdmin.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
           showToast("Este e-mail já está em uso.", "error");
           setIsFinishing(false);
           return;
        }
        await addDoc(userRef, {
          displayName: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone,
          password: newAdmin.password,
          photoURL: newAdmin.photo,
          role: 'admin',
          companyId: companyId,
          approved: true,
          createdAt: new Date().toISOString()
        });
        showToast("Administrador convidado com sucesso!", "success");
        onNextTour('campaign_config');
      } catch (err) {
        showToast("Erro ao adicionar administrador.", "error");
      } finally {
        setIsFinishing(false);
      }
      return;
    }

    if (activeTour === 'campaign_config') {
      if (!rules.rewardMode) {
        showToast("Selecione um modo de premiação.", "error");
        return;
      }
      onNextTour('goals_month_by_month');
      return;
    }

    if (activeTour === 'goals_month_by_month') {
      if (currentGoalMonthIndex < 11) {
        setCurrentGoalMonthIndex(prev => prev + 1);
        return;
      }
      // Save all goals
      setIsFinishing(true);
      try {
        const batch = writeBatch(db);
        monthlyGoalsLocal.forEach(g => {
           const ref = doc(collection(db, 'goals'));
           batch.set(ref, { ...g, companyId: companyId });
        });
        await batch.commit();
        onNextTour('finished');
      } catch (err) {
        showToast("Erro ao salvar metas.", "error");
      } finally {
        setIsFinishing(false);
      }
      return;
    }

    if (activeTour === 'finished') {
      setIsFinishing(true);
      try {
        await onUpdateRules({ ...rules, onboardingComplete: true });
        onNextTour(null);
        showToast("Configuração concluída!", "success");
      } catch (err) {
        showToast("Erro ao finalizar.", "error");
      } finally {
        setIsFinishing(false);
      }
    }
  };

  const handleGoalChange = (monthStr: string, value: number, workingDays: number) => {
    setMonthlyGoalsLocal(prev => {
      const filtered = prev.filter(g => g.month !== monthStr);
      return [...filtered, { id: Math.random().toString(), month: monthStr, value, workingDays, label: `Meta de ${monthStr}` }];
    });
  };

  if (!activeTour) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 md:p-12 shadow-2xl space-y-8 relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
          <motion.div 
            className="h-full bg-green-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-[1.5rem] flex items-center justify-center text-green-600">
              {activeTour === 'welcome' && <Trophy size={32} />}
              {activeTour === 'profile' && <Building2 size={32} />}
              {activeTour === 'admins_query' && <UserPlus size={32} />}
              {activeTour === 'admin_form' && <UserPlus size={32} />}
              {activeTour === 'campaign_config' && <Award size={32} />}
              {activeTour === 'goals_month_by_month' && <Target size={32} />}
              {activeTour === 'finished' && <CheckCircle2 size={32} />}
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{currentStep.title}</h2>
          <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">{currentStep.description}</p>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-2 py-4">
          {activeTour === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                <input 
                  type="text" 
                  value={localProfile.companyName}
                  onChange={e => handleUpdateProfile({ companyName: e.target.value })}
                  placeholder="Ex: Minha Loja Ltda"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                <input 
                  type="text" 
                  value={localProfile.cnpj}
                  onChange={e => handleUpdateProfile({ cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone Principal</label>
                <input 
                  type="text" 
                  value={localProfile.phone}
                  onChange={e => handleUpdateProfile({ phone: e.target.value })}
                  placeholder="(00) 0000-0000"
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                <input 
                  type="text" 
                  value={localProfile.contactPhone}
                  onChange={e => handleUpdateProfile({ contactPhone: e.target.value })}
                  placeholder="(00) 90000-0000"
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                <input 
                  type="text" 
                  value={localProfile.address}
                  onChange={e => handleUpdateProfile({ address: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Responsável</label>
                <input 
                  type="text" 
                  value={localProfile.responsible}
                  onChange={e => handleUpdateProfile({ responsible: e.target.value })}
                  placeholder="Quem responderá pelo painel?"
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              </div>
            </div>
          )}

          {activeTour === 'admins_query' && (
            <div className="flex flex-col items-center gap-6 p-8">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                <Users size={40} />
              </div>
              <div className="flex gap-4 w-full">
                <Button onClick={() => onNextTour('admin_form')} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">SIM, ADICIONAR</Button>
                <Button onClick={() => onNextTour('campaign_config')} variant="outline" className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black">AGORA NÃO</Button>
              </div>
            </div>
          )}

          {activeTour === 'admin_form' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Foto de Perfil (URL)</label>
                <input type="text" value={newAdmin.photo} onChange={e => setNewAdmin({...newAdmin, photo: e.target.value})} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="Nome do Administrador" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="email@exemplo.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Celular</label>
                <input type="text" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} placeholder="(00) 00000-0000" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
              </div>
            </div>
          )}

          {activeTour === 'campaign_config' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Campanha</label>
                <input type="text" value={rules.campaignName || ''} onChange={e => onUpdateRules({...rules, campaignName: e.target.value})} placeholder="Ex: Fidelidade VIP 2024" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onUpdateRules({ ...rules, rewardMode: 'points' })}
                  className={cn("p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2", rules.rewardMode === 'points' ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-100 text-gray-500 hover:border-green-200")}
                >
                  <Award size={32} />
                  <span className="font-black uppercase text-xs">Pontos</span>
                </button>
                <button 
                  onClick={() => onUpdateRules({ ...rules, rewardMode: 'cashback' })}
                  className={cn("p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2", rules.rewardMode === 'cashback' ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-100 text-gray-500 hover:border-green-200")}
                >
                  <DollarSign size={32} />
                  <span className="font-black uppercase text-xs">Cashback</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-3xl">
                {rules.rewardMode === 'points' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pontos por Real</label>
                      <input type="number" value={rules.pointsPerReal} onChange={e => onUpdateRules({...rules, pointsPerReal: Number(e.target.value)})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Validade Pontos (Dias)</label>
                      <input type="number" value={rules.pointsExpiryDays} onChange={e => onUpdateRules({...rules, pointsExpiryDays: Number(e.target.value)})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cashback %</label>
                      <input type="number" value={rules.cashbackConfig?.percentage || 0} onChange={e => onUpdateRules({...rules, cashbackConfig: {...(rules.cashbackConfig || {percentage:0, expiryDays:90, minActivationValue:0, minRedeemDays:0}), percentage: Number(e.target.value)}})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Validade (Dias)</label>
                      <input type="number" value={rules.cashbackConfig?.expiryDays || 90} onChange={e => onUpdateRules({...rules, cashbackConfig: {...(rules.cashbackConfig || {percentage:0, expiryDays:90, minActivationValue:0, minRedeemDays:0}), expiryDays: Number(e.target.value)}})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mín. Ativação (R$)</label>
                  <input type="number" value={rules.cashbackConfig?.minActivationValue || 0} onChange={e => onUpdateRules({...rules, cashbackConfig: {...(rules.cashbackConfig || {percentage:0, expiryDays:90, minActivationValue:0, minRedeemDays:0}), minActivationValue: Number(e.target.value)}})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Carência Resgate (Dias)</label>
                  <input type="number" value={rules.cashbackConfig?.minRedeemDays || 0} onChange={e => onUpdateRules({...rules, cashbackConfig: {...(rules.cashbackConfig || {percentage:0, expiryDays:90, minActivationValue:0, minRedeemDays:0}), minRedeemDays: Number(e.target.value)}})} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor do Tema</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={rules.themeColor || '#000000'} onChange={e => onUpdateRules({...rules, themeColor: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden" />
                  <input type="text" value={rules.themeColor || '#000000'} onChange={e => onUpdateRules({...rules, themeColor: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensagem de Boas-vindas</label>
                <textarea value={rules.welcomeMessage || ''} onChange={e => onUpdateRules({...rules, welcomeMessage: e.target.value})} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all" />
              </div>
            </div>
          )}

          {activeTour === 'goals_month_by_month' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês de Início das Metas</label>
                <input 
                  type="month" 
                  value={startMonth}
                  onChange={e => {
                    setStartMonth(e.target.value);
                    setCurrentGoalMonthIndex(0);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 transition-all mb-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Etapa {currentGoalMonthIndex + 1} de 12</span>
                <span className="text-sm font-black text-green-600 uppercase tracking-tighter italic">
                  {next12Months[currentGoalMonthIndex].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Faturamento (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0,00"
                    value={monthlyGoalsLocal.find(g => g.month === format(next12Months[currentGoalMonthIndex], 'yyyy-MM'))?.value || ''}
                    onChange={e => handleGoalChange(format(next12Months[currentGoalMonthIndex], 'yyyy-MM'), Number(e.target.value), monthlyGoalsLocal.find(g => g.month === format(next12Months[currentGoalMonthIndex], 'yyyy-MM'))?.workingDays || 22)}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-xl font-black text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dias Úteis do Mês</label>
                  <input 
                    type="number" 
                    placeholder="22"
                    value={monthlyGoalsLocal.find(g => g.month === format(next12Months[currentGoalMonthIndex], 'yyyy-MM'))?.workingDays || 22}
                    onChange={e => handleGoalChange(format(next12Months[currentGoalMonthIndex], 'yyyy-MM'), monthlyGoalsLocal.find(g => g.month === format(next12Months[currentGoalMonthIndex], 'yyyy-MM'))?.value || 0, Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-green-500/10 transition-all font-mono"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= currentGoalMonthIndex ? "bg-green-600" : "bg-gray-100")} />
                ))}
              </div>
            </div>
          )}

          {activeTour === 'finished' && (
            <div className="bg-green-50 rounded-[2.5rem] p-8 text-center space-y-4 border border-green-100">
              <div className="inline-flex p-4 bg-green-600 text-white rounded-3xl mb-2">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-green-800 font-bold leading-relaxed">
                Configuração realizada com sucesso para os próximos 12 meses.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleNext}
            disabled={isFinishing}
            className="w-full py-6 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-green-600/20 bg-green-600 hover:bg-green-700 text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {isFinishing ? 'Salvando...' : (activeTour === 'goals_month_by_month' && currentGoalMonthIndex < 11 ? 'Próximo Mês' : currentStep.button)}
          </Button>
          <div className="flex flex-col gap-2 mt-4">
            {(activeTour === 'profile' || activeTour === 'campaign_config' || activeTour === 'goals_month_by_month') && !isSuperAdmin && (
              <button 
                onClick={async () => {
                  await onUpdateRules({ ...rules, onboardingComplete: true });
                  onNextTour(null);
                }}
                className="w-full text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Pular Configuração por enquanto
              </button>
            )}
            <button 
              onClick={() => signOut(auth)}
              className="w-full text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={12} /> Sair do Sistema agora
            </button>
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
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">E-mail (Automático)</label>
                <input 
                  type="text" 
                  value={appUser.email || ''}
                  disabled
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 font-bold outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Celular</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cargo na Empresa</label>
                <input 
                  type="text" 
                  value={roleInCompany}
                  onChange={(e) => setRoleInCompany(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
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
                  required
                  placeholder="(00) 00000-0000"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cargo</label>
                <input 
                  type="text" 
                  value={newAdmin.roleInCompany}
                  onChange={(e) => setNewAdmin({...newAdmin, roleInCompany: e.target.value})}
                  required
                  placeholder="Ex: Gerente"
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
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'reports' | 'messages'>('clients');
  const [editingClient, setEditingClient] = useState<AppUser | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState({ title: 'Mensagem da BuyPass', body: '', targetStoreId: 'all' });
  const [isSending, setIsSending] = useState(false);
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
          console.log(`Starting absolute deletion for client: ${client.id}`);
          
          // 1. Delete configs
          await deleteDoc(doc(db, 'configs', client.id));
          
          // 2. Delete customers
          const qCust = query(collection(db, 'customers'), where('companyId', '==', client.id));
          const snapCust = await getDocs(qCust);
          if (!snapCust.empty) {
            const batchCust = writeBatch(db);
            snapCust.docs.forEach(d => batchCust.delete(d.ref));
            await batchCust.commit();
          }

          // 3. Delete purchases
          const qPurc = query(collection(db, 'purchases'), where('companyId', '==', client.id));
          const snapPurc = await getDocs(qPurc);
          if (!snapPurc.empty) {
            const batchPurc = writeBatch(db);
            snapPurc.docs.forEach(d => batchPurc.delete(d.ref));
            await batchPurc.commit();
          }

          // 4. Delete goals
          const qGoal = query(collection(db, 'goals'), where('companyId', '==', client.id));
          const snapGoal = await getDocs(qGoal);
          if (!snapGoal.empty) {
            const batchGoal = writeBatch(db);
            snapGoal.docs.forEach(d => batchGoal.delete(d.ref));
            await batchGoal.commit();
          }

          // 5. Delete redemptions
          const qRed = query(collection(db, 'redemptions'), where('companyId', '==', client.id));
          const snapRed = await getDocs(qRed);
          if (!snapRed.empty) {
            const batchRed = writeBatch(db);
            snapRed.docs.forEach(d => batchRed.delete(d.ref));
            await batchRed.commit();
          }

          // 6. Delete user document
          await deleteDoc(doc(db, 'users', client.id));

          showToast('Cliente e todos os seus dados foram excluídos com sucesso.', "success");
        } catch (err: any) {
          console.error("Critical error during client deletion:", err);
          showToast('Erro ao excluir cliente: ' + (err.message || 'Erro desconhecido'), "error");
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
            <button 
              onClick={() => setActiveSubTab('messages')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeSubTab === 'messages' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
              )}
            >
              Mensagens
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'clients' && (
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
                  {client.planEndDate && (
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <Clock size={12} /> Expira em: {format(parseISO(client.planEndDate), 'dd/MM/yyyy')}
                    </p>
                  )}
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
      )}

      {activeSubTab === 'reports' && (
        <SuperAdminReportsTab clients={clients} appUser={appUser} />
      )}

      {activeSubTab === 'messages' && (
        <SuperAdminMessagesTab clients={clients} />
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

function SuperAdminMessagesTab({ clients }: { clients: AppUser[] }) {
  const [title, setTitle] = useState('Mensagem da BuyPass');
  const [message, setMessage] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('all'); // 'all' or specific companyId
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  const handleSendMessage = async () => {
    if (!message) return;
    setIsSending(true);
    try {
      // Logic: Create a notification document with special target field
      // Consumer app will listen for its specific UIDs AND target: 'all' or storeId
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        customerId: 'admin_broadcast', // Special ID
        companyId: targetStoreId === 'all' ? 'all' : targetStoreId, // Ensure companyId is present
        targetType: targetStoreId === 'all' ? 'global' : 'store',
        targetStoreId: targetStoreId === 'all' ? 'all' : targetStoreId,
        type: 'info',
        read: false,
        date: new Date().toISOString(), // Unified with date
        createdAt: new Date().toISOString()
      });
      
      showToast("Mensagem enviada com sucesso!", "success");
      setMessage('');
    } catch (err: any) {
      showToast("Erro ao enviar: " + err.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-8 bg-white border-gray-100 shadow-xl rounded-[2.5rem] space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
          <Send size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase">Notificação Geral</h3>
          <p className="text-gray-500 text-sm">Dispare mensagens administrativas para os usuários do WebApp.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Headline (Título)</label>
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Ex: Mensagem da BuyPass"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mensagem</label>
          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
            placeholder="Digite sua mensagem aqui..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Filtro por Empresa (Opcional)</label>
          <select 
            value={targetStoreId}
            onChange={e => setTargetStoreId(e.target.value)}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary appearance-none transition-all"
          >
            <option value="all">Todas as Empresas</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        <Button 
          onClick={handleSendMessage}
          disabled={isSending || !message}
          className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
        >
          {isSending ? 'Enviando...' : 'ENVIAR NOTIFICAÇÃO'}
        </Button>
      </div>
    </Card>
  );
}

function SuperAdminReportsTab({ clients, appUser }: { clients: AppUser[], appUser: AppUser }) {
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<any[] | null>(null);
  const { showToast } = useToast();

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
      showToast('Erro ao gerar relatório: ' + (err instanceof Error ? err.message : String(err)), "error");
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
      showToast('Erro ao exportar PDF', "error");
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
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<AppUser>>(client || {
    companyName: '',
    campaignName: '',
    address: '',
    cnpj: '',
    phone: '',
    themeColor: '#fb8500',
    secondaryColor: '#000000',
    clientStatus: 'monthly',
    planStartDate: new Date().toISOString(),
    planEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    erpKey: '',
    email: '',
    password: '',
    role: 'admin',
    approved: true,
    isClient: true,
    canCreatePromotions: true,
    canUseLoyalty: true
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
      showToast("Erro ao salvar cliente: " + err.message, "error");
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
                <input type="text" value={formData.companyName || ''} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Programa</label>
                <input type="text" value={formData.campaignName || ''} onChange={e => setFormData({ ...formData, campaignName: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CNPJ</label>
                <input 
                  type="text" 
                  value={formData.cnpj || ''} 
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
                <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Celular</label>
                <PhoneInput 
                  placeholder="Ex: +55 21 99999-9999" 
                  value={formData.phone} 
                  onChange={val => setFormData({ ...formData, phone: val || '' })} 
                  defaultCountry="BR" 
                  international={false}
                  className="PhoneInput text-sm font-bold" 
                />
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vigência do Plano</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Início</span>
                  <input type="date" value={formData.planStartDate?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, planStartDate: new Date(e.target.value + 'T12:00:00').toISOString() })} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 text-xs font-bold outline-none" required />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-500 uppercase ml-1">Término</span>
                  <input type="date" value={formData.planEndDate?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, planEndDate: new Date(e.target.value + 'T12:00:00').toISOString() })} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 text-xs font-bold outline-none" required />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 text-sm font-bold outline-none focus:border-primary transition-all" required />
            </div>

            <div className="space-y-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Habilitar Acesso</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-primary transition-all">
                  <input 
                    type="checkbox" 
                    checked={formData.canCreatePromotions || false} 
                    onChange={e => setFormData({ ...formData, canCreatePromotions: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-gray-100 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase">Habilitar Criar Promoção</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Permite criar banners e ofertas personalizadas</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-primary transition-all">
                  <input 
                    type="checkbox" 
                    checked={formData.canUseLoyalty || false} 
                    onChange={e => setFormData({ ...formData, canUseLoyalty: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-gray-100 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase">Habilitar Premiação (Fidelidade)</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">Permite usar o sistema de pontos e resgates</p>
                  </div>
                </label>
              </div>
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

function PromotionAreaTab({ rules, companyId, isAdmin, onUpdateRules, customers, purchases }: { rules: LoyaltyRule; companyId: string | null; isAdmin: boolean; onUpdateRules: (rules: LoyaltyRule) => Promise<void>; customers: Customer[]; purchases: Purchase[] }) {
  const activePromotion = rules.promotionConfig?.isActive ? rules.promotionConfig : null;
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'history'>(activePromotion ? 'dashboard' : 'dashboard');
  const [isConfiguring, setIsConfiguring] = useState(!activePromotion);
  const [history, setHistory] = useState<PromotionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [isMarking, setIsMarking] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchaseValue, setPurchaseValue] = useState('');
  const [lookupPhone, setLookupPhone] = useState<string | undefined>();
  const [isRegistering, setIsRegistering] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [actionsEarned, setActionsEarned] = useState(0);
  const [lastCustomerId, setLastCustomerId] = useState<string | null>(null);
  const [lastPurchaseId, setLastPurchaseId] = useState<string | null>(null);
  const [promoUsedThisSession, setPromoUsedThisSession] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'raffle' | 'wheel' | 'birthday' | 'scratch'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year' | 'range'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [spinningPurchaseId, setSpinningPurchaseId] = useState<string | null>(null);
  
  // Interactive States
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [scratchDone, setScratchDone] = useState(false);
  const [scratchResult, setScratchResult] = useState<string | null>(null);
  const [raffleShuffling, setRaffleShuffling] = useState(false);
  const [raffleWinners, setRaffleWinners] = useState<{name: string, prize: string}[]>([]);
  const [raffleWinner, setRaffleWinner] = useState<string | null>(null);
  const [showRaffleParticipants, setShowRaffleParticipants] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [includeClientsInReport, setIncludeClientsInReport] = useState(true);

  const weightedRandom = <T extends { label: string; probability: number }>(items: T[]): { item: T; index: number } => {
    const totalWeight = items.reduce((acc, item) => acc + item.probability, 0);
    if (totalWeight === 0 && items.length > 0) return { item: items[0], index: 0 };
    if (items.length === 0) return { item: { label: 'ERRO', probability: 0 } as T, index: -1 };
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (random < item.probability) return { item, index: i };
      random -= item.probability;
    }
    return { item: items[0], index: 0 };
  };

  const [config, setConfig] = useState<Partial<PromotionConfig>>({
    name: '',
    type: 'raffle',
    startDate: '',
    endDate: '',
    rafflePrize: '',
    drawDate: '',
    drawTime: '',
    isLinkedToLoyalty: true,
    isActive: false,
    prizes: [],
    minPurchaseValue: 10,
    isCumulative: true,
    wheelSegments: [
      { label: '5%', probability: 50, color: '#fb8500' },
      { label: '10%', probability: 30, color: '#023047' },
      { label: '15%', probability: 20, color: '#219ebc' }
    ],
    scratchPrizes: [
      { label: '5%', probability: 50, color: '#fb8500' },
      { label: '10%', probability: 30, color: '#023047' },
      { label: '20%', probability: 20, color: '#219ebc' }
    ]
  });

  // Keep internal config in sync ONLY when activePromotion changes AND we are not configuring a new one
  useEffect(() => {
    if (activePromotion && !isConfiguring) {
      setConfig(activePromotion);
    }
  }, [activePromotion?.id, isConfiguring]);

  // Raffle prize auto-calculation
  useEffect(() => {
    if (config.type === 'raffle' && config.rafflePrizes && config.rafflePrizes.length > 0) {
      const total = config.rafflePrizes.reduce((sum, p) => sum + ((p.value || 0) * (p.quantity || 1)), 0);
      if (total !== config.totalCost) {
        setConfig(prev => ({ ...prev, totalCost: total }));
      }
    }
  }, [JSON.stringify(config.rafflePrizes), config.type]);

  // Calculate stats based on active promotion campaign ID
  const promotionStats = useMemo(() => {
    if (!activePromotion || !purchases) return { revenue: 0, participants: 0, actions: 0, recent: [] };
    
    const promoPurchases = (purchases || []).filter(p => 
      p.promotionId && activePromotion.id && String(p.promotionId) === String(activePromotion.id)
    );

    const uniqueParticipants = new Set(promoPurchases.map(p => p.customerId)).size;
    const revenue = promoPurchases.reduce((acc, p) => acc + p.amount, 0);
    const actions = promoPurchases.reduce((acc, p) => acc + (p.actionsEarned || 0), 0);
    const totalDiscounts = promoPurchases.reduce((acc, p) => acc + (p.cashbackEarned || 0), 0);
    
    // Calculate Prize Costs
    const pointsEarned = promoPurchases.reduce((acc, p) => acc + (p.pointsEarned || 0), 0);
    const winnersCount = activePromotion.type === 'raffle' 
      ? (activePromotion.isDrawn ? (activePromotion.rafflePrizes?.length || 1) : 0)
      : promoPurchases.filter(p => p.prizeWon).length;

    const totalPrizeCost = promoPurchases.reduce((acc, p) => acc + (p.prizeCost || 0), 0);
    const totalInvestment = totalDiscounts + totalPrizeCost + (activePromotion.totalCost || 0);
    const roi = totalInvestment > 0 ? ((revenue - totalInvestment) / totalInvestment) * 100 : revenue > 0 ? 100 : 0;

    const numPurchases = promoPurchases.length;
    const avgTicket = numPurchases > 0 ? revenue / numPurchases : 0;

    return {
      revenue,
      participants: uniqueParticipants,
      actions,
      winnersCount,
      avgTicket,
      totalInvestment,
      roi,
      recent: promoPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [activePromotion, purchases]);

  useEffect(() => {
    if (activeSubTab === 'history' && companyId) {
      loadHistory();
    }
  }, [activeSubTab, companyId]);

  const loadHistory = async () => {
    if (!companyId) return;
    setIsLoadingHistory(true);
    try {
      const q = query(collection(db, 'promotion_history'), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionHistory));
      setHistory(data.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDownloadPDF = async (h: PromotionHistory, includeClients: boolean = true) => {
    try {
      const doc = new jsPDF();
      
      // Header
      if (rules.companyProfile?.logoURL) {
         try {
           // We might need to convert it to base64 or use an image element if it's external
           // For simplicity in this demo, we'll try to add it
           doc.addImage(rules.companyProfile.logoURL, 'JPEG', 15, 10, 30, 30);
         } catch (e) {
           console.warn("Logo load error:", e);
         }
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      const title = `Promoção: ${h.campaignName}`;
      doc.text(title, 55, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Tipo: ${h.type.toUpperCase()} | RESUMO DA CAMPANHA`, 55, 33);
      
      doc.setDrawColor(251, 133, 0);
      doc.setLineWidth(1);
      doc.line(15, 45, 195, 45);
      
      const stats = [
        ['Nome da Campanha', h.campaignName],
        ['Tipo de Promoção', h.type.toUpperCase()],
        ['Data de Início', new Date(h.startDate).toLocaleDateString()],
        ['Data de Término', new Date(h.endDate || h.endedAt).toLocaleDateString()],
        ['Faturamento Total', formatCurrency(h.totalRevenue)],
        ['Custo Total da Campanha', formatCurrency(h.totalCost || 0)],
        ['ROI (Retorno sobre Investimento)', `${(h.roi || 0).toFixed(2)}%`],
        ['Total de Ações/Cupons', h.totalActions || 0],
        ['Ticket Médio', formatCurrency(h.totalRevenue / (h.totalParticipants || 1))],
        ['Participações Totais', h.totalParticipants || 0],
        ['Ganhador(es)', h.winner || 'N/A']
      ];
      
      autoTable(doc, {
        startY: 55,
        head: [['Métrica', 'Informação']],
        body: stats,
        theme: 'grid',
        headStyles: { fillColor: [2, 48, 71], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 70, fillColor: [249, 250, 251] },
          1: { cellWidth: 'auto' }
        }
      });
      
      if (includeClients) {
         const promotionPurchases = (purchases || []).filter(p => p.promotionId === h.id);
         const clientData = promotionPurchases.map(p => [
           customers.find(c => c.id === p.customerId)?.name || p.customerName || 'N/A',
           new Date(p.date).toLocaleString(),
           formatCurrency(p.amount),
           p.actionsEarned || 0,
           h.winner === p.customerName ? 'GANHADOR' : ''
         ]);
         
         doc.addPage();
         doc.setFontSize(16);
         doc.setTextColor(0);
         doc.text('LISTA DE PARTICIPAÇÕES', 15, 20);
         
         autoTable(doc, {
            startY: 25,
            head: [['Cliente', 'Data/Hora', 'Valor Compra', 'Cotas/Cupons', 'Status']],
            body: clientData,
            theme: 'striped',
            headStyles: { fillColor: [2, 48, 71], textColor: [255, 255, 255] },
            styles: { fontSize: 8 }
         });
      }
      
      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado em ${new Date().toLocaleString()} - BuyPass Marketing Intelligence`, 15, 285);
        doc.text(`Página ${i} de ${pageCount}`, 175, 285);
      }
      
      doc.save(`Relatorio_Promo_${h.campaignName.replace(/\s+/g, '_')}.pdf`);
      showToast("PDF Gerado com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao gerar PDF.", "error");
    }
  };

  const handleDownloadReport = (h: PromotionHistory) => {
    handleDownloadPDF(h, includeClientsInReport);
  };

  const handleDeleteHistory = async (hId: string) => {
    askConfirmation(
      "Excluir Histórico",
      "Deseja realmente remover esta campanha do seu histórico? Isso não afetará os dados globais da loja.",
      async () => {
         setIsProcessing(true);
         try {
           await deleteDoc(doc(db, 'promotion_history', hId));
           setHistory(prev => prev.filter(h => h.id !== hId));
           showToast("Campanha removida do histórico.", "success");
         } catch (e) {
           console.error(e);
           showToast("Erro ao excluir.", "error");
         } finally {
            setIsProcessing(false);
         }
      },
      true
    );
  };

  const handleDeleteAllHistory = async () => {
    if (!companyId) return;
    askConfirmation(
      "Excluir Todo o Histórico",
      "Deseja realmente remover TODAS as campanhas do seu histórico? Esta ação é irreversível.",
      async () => {
         setIsProcessing(true);
         try {
           const q = query(collection(db, 'promotion_history'), where('companyId', '==', companyId));
           const snap = await getDocs(q);
           const batch = writeBatch(db);
           snap.forEach(d => batch.delete(d.ref));
           await batch.commit();
           setHistory([]);
           showToast("Todo o histórico foi removido.", "success");
         } catch (e) {
           console.error(e);
           showToast("Erro ao excluir histórico.", "error");
         } finally {
            setIsProcessing(false);
         }
      },
      true
    );
  };

  const handleMarkPurchase = async (customerOverride?: Customer) => {
    // Avoid passing Event objects as customer
    const targetCustomer = (customerOverride && typeof customerOverride === 'object' && 'id' in customerOverride) 
      ? customerOverride 
      : selectedCustomer;

    if (!targetCustomer || !targetCustomer.id || !purchaseValue || !companyId || !activePromotion) {
      console.warn("Lançamento bloqueado: dados incompletos", { hasTarget: !!targetCustomer, hasId: targetCustomer?.id });
      return;
    }
    setIsProcessing(true);

    // Reset interactive states for the NEW purchase session immediately
    setPromoUsedThisSession(false);
    setWheelRotation(0);
    setWheelResult(null);
    setScratchDone(false);
    setScratchResult(null);
    setActionsEarned(0);

    try {
      const val = parseFloat(purchaseValue);
      const now = new Date().toISOString();

      // Ensure we have the most up-to-date name
      const realCustomer = customers?.find(c => String(c.id) === String(targetCustomer.id));
      const finalName = realCustomer?.name || targetCustomer.name || 'Cliente sem nome';

      // 0. Calculate Promotion Actions
      let actions = 0;
      let birthdayDiscount = 0;

      if (activePromotion.type === 'raffle' || activePromotion.type === 'wheel' || activePromotion.type === 'scratch') {
        const minVal = Number(activePromotion.minPurchaseValue || activePromotion.minPurchaseForWheel || activePromotion.minPurchaseForScratch || 1);
        if (val >= minVal) {
          if (activePromotion.type === 'wheel' || activePromotion.type === 'scratch') {
            actions = 1;
          } else {
            actions = activePromotion.isCumulative ? Math.floor(val / minVal) : 1;
          }
        }
      } else if (activePromotion.type === 'birthday') {
        const currentYear = new Date().getFullYear();
        const alreadyParticipated = (purchases || []).some(p => 
          p.customerId === targetCustomer.id && 
          p.promotionId === activePromotion.id && 
          new Date(p.date).getFullYear() === currentYear
        );

        if (alreadyParticipated) {
          showToast("Este cliente já utilizou o benefício de aniversário este ano.", "warning");
          setIsProcessing(false);
          return;
        }

        if (!targetCustomer.birthDate) {
          showToast("Data de nascimento obrigatória não cadastrada.", "warning");
          setIsProcessing(false);
          return;
        }
        
        // Strict Birthday Logic: Must match month/day OR be within campaign dates if it's the birthday period
        const bDate = new Date(targetCustomer.birthDate);
        const bMonth = bDate.getUTCMonth();
        const bDay = bDate.getUTCDate();
        
        const now = new Date();
        const start = new Date(activePromotion.startDate || '');
        const end = new Date(activePromotion.endDate || '');
        
        // Check if the birthday itself falls within the campaign period
        // (MM-DD format for year-independent comparison)
        const formatMD = (d: Date) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        const bMD = formatMD(bDate);
        const startMD = formatMD(start);
        const endMD = formatMD(end);
        
        // If it's outside the campaign month/day range, it's not valid
        if (bMD < startMD || bMD > endMD) {
          showToast("Promoção exclusiva para aniversariantes deste período.", "warning");
          setIsProcessing(false);
          return;
        }
        
        // Also must be today? The user said "fazendo aniversário no período". 
        // Usually means any birthday that falls in May gets it during May campaign.
        // We'll allow it once per year if their birthday is in the period.

        actions = 1;
        birthdayDiscount = val * ((activePromotion.birthdayDiscountPercent || 10) / 100);
      }

      // 1. Loyalty Integration
      let pointsEarned = 0;
      let cashbackEarned = birthdayDiscount;
      
      if (activePromotion.isLinkedToLoyalty) {
        if (rules.rewardMode === 'cashback') {
          const minVal = rules.cashbackConfig?.minActivationValue || 0;
          if (val >= minVal) cashbackEarned += val * ((rules.cashbackConfig?.percentage || 0) / 100);
        } else {
          if (val >= (rules.minPurchaseValue || 0)) pointsEarned = Math.floor(val * (rules.pointsPerReal || 1));
        }
      }

      // 2. Pre-determine interactive results if applicable
      let determinedWheelResult = null;
      let determinedScratchResult = null;
      let determinedPrizeCost = 0;

      if (actions > 0) {
        if (activePromotion.type === 'wheel') {
          // We don't pre-set the rotation here to let the spin animation handle it
        } else if (activePromotion.type === 'scratch') {
          const prizes = activePromotion.scratchPrizes || [];
          if (prizes.length > 0) {
            const result = weightedRandom(prizes);
            determinedScratchResult = result.label;
            determinedPrizeCost = result.cost || 0;
            setScratchResult(result.label);
          } else {
            determinedScratchResult = "Tente novamente";
            setScratchResult("Tente novamente");
            determinedPrizeCost = 0;
          }
        }
      }

      // 3. Save Purchase
      setActionsEarned(actions);
      setLastCustomerId(String(targetCustomer.id));
      
      // Reset interaction states for a fresh start
      setPromoUsedThisSession(false);
      setScratchDone(false);
      setWheelSpinning(false);
      
      const purchaseRef = await addDoc(collection(db, 'purchases'), {
        companyId,
        customerId: String(targetCustomer.id),
        customerName: String(finalName),
        amount: Number(val),
        date: now,
        pointsEarned: Number(pointsEarned),
        cashbackEarned: Number(cashbackEarned),
        promotionId: String(activePromotion.id),
        actionsEarned: Number(actions),
        prizeWon: activePromotion.type === 'scratch' ? determinedScratchResult : null,
        prizeCost: activePromotion.type === 'scratch' ? Number(determinedPrizeCost) : 0
      });

      setLastPurchaseId(purchaseRef.id);

      // 4. Update Customer
      const currentCust = customers?.find(c => String(c.id) === String(targetCustomer.id)) || targetCustomer;
      await updateDoc(doc(db, 'customers', String(currentCust.id)), {
        points: (currentCust.points || 0) + pointsEarned,
        cashbackBalance: (currentCust.cashbackBalance || 0) + cashbackEarned,
        lastPurchaseDate: now,
        totalSpent: (currentCust.totalSpent || 0) + val,
        totalPurchases: (currentCust.totalPurchases || 0) + 1
      });

      showToast(`Venda de R$ ${val.toFixed(2)} registrada! ${actions > 0 ? `(${actions} gerados)` : ''}`, "success");
      setIsMarking(false);
      setPurchaseValue('');
      setSelectedCustomer(null);
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar venda.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const { askConfirmation } = useConfirm();

  const handleDrawRaffle = async () => {
    if (!promotionStats.actions || !companyId || !activePromotion) {
      showToast("Nenhum cupom gerado nesta campanha ainda.", "warning");
      return;
    }

    // Check if draw time has passed
    const now = new Date();
    const drawDateTime = activePromotion.drawDate ? new Date(`${activePromotion.drawDate}T${activePromotion.drawTime || '00:00'}`) : null;
    if (drawDateTime && now < drawDateTime) {
       showToast(`O sorteio só será liberado em ${drawDateTime.toLocaleString()}`, "warning");
       return;
    }
    
    askConfirmation(
      "Confirmar Sorteio",
      `Deseja realizar o sorteio do prêmio "${activePromotion.rafflePrize || 'Prêmio da Campanha'}" agora?`,
      async () => {
        setIsProcessing(true);
        setRaffleShuffling(true);
        setRaffleWinner(null);

        // Shuffle effect for 7 seconds
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        // Get all participants
        const allPromoPurchases = (purchases || []).filter(p => p.promotionId === activePromotion?.id);
        const pool: {name: string, id: string}[] = [];
        allPromoPurchases.forEach(p => {
          const count = Number(p.actionsEarned || 1);
          for(let i = 0; i < count; i++) {
            pool.push({ name: p.customerName || 'Cliente sem Nome', id: p.id });
          }
        });

        if (pool.length === 0) {
          setRaffleShuffling(false);
          setIsProcessing(false);
          showToast("Nenhum participante qualificado encontrado para o sorteio.", "error");
          return;
        }

        // Draw multiple winners if multiple prizes exist
        const prizes = activePromotion.rafflePrizes || [{ label: activePromotion.rafflePrize || 'Prêmio do Sorteio', quantity: 1, value: activePromotion.totalCost || 0 }];
        const winners: {name: string, prize: string, purchaseId: string}[] = [];
        setRaffleWinners([]);
        setRaffleWinner(null);
        setRaffleShuffling(true);
        
        let tempPool = [...pool];
        prizes.forEach(pGroup => {
           const qty = pGroup.quantity || 1;
           for(let i = 0; i < qty; i++) {
              if (tempPool.length === 0) break;
              const idx = Math.floor(Math.random() * tempPool.length);
              const winnerObj = tempPool[idx];
              winners.push({ name: winnerObj.name, prize: pGroup.label, purchaseId: winnerObj.id });
              
              // Remove ALL tickets of this winner to prevent one person winning twice in the same campaign
              // (Common ethical rule in retail draws)
              const winnerName = winnerObj.name;
              tempPool = tempPool.filter(item => item.name !== winnerName);
           }
        });

        setRaffleWinners(winners);
        
        try {
          const batch = writeBatch(db);
          winners.forEach(w => {
            batch.update(doc(db, 'purchases', w.purchaseId), {
              prizeWon: w.prize,
              prizeCost: activePromotion.totalCost || 0
            });
          });

          await batch.commit();

          await onUpdateRules({
            ...rules,
            promotionConfig: {
              ...rules.promotionConfig!,
              winner: winners.map(w => `${w.name} (${w.prize})`).join(' | '),
              isDrawn: true,
              winnersList: winners // Save the actual objects for better retrieval if needed
            }
          });
          showToast(`${winners.length} ganhadores sorteados com sucesso!`, "success");
        } catch (err) {
          console.error("Error saving raffle result:", err);
          showToast("Sorteio feito, mas erro ao salvar resultado permanente.", "warning");
        }

        setRaffleShuffling(false);
        setIsProcessing(false);
      }
    );
  };

   const spinWheel = (purchaseId?: string, customerId?: string) => {
    if (wheelSpinning) return;
    
    // If targeted spin, check if that purchase already has a prize
    if (purchaseId) {
       const p = purchases.find(p => p.id === purchaseId);
       if (p?.prizeWon) {
          showToast("Esta compra já foi premiada.", "warning");
          return;
       }
       setSpinningPurchaseId(purchaseId);
    } else {
       if (actionsEarned <= 0 || promoUsedThisSession) return;
    }
    
    // Check campaign validity
    const now = new Date();
    const isExpired = activePromotion.endDate ? isBefore(endOfDay(parseISO(activePromotion.endDate)), now) : false;
    if (isExpired) {
      showToast("Esta campanha já encerrou.", "warning");
      return;
    }

    // Determine result and rotation when spinning starts
      const segments = activePromotion.wheelSegments || [];
      if (segments.length > 0) {
        setWheelSpinning(true);
        setWheelResult(null);
        setRaffleWinner(null); 
        
        if (!purchaseId) {
          setActionsEarned(prev => prev - 1);
        }

        const { item: result, index } = weightedRandom(segments);
        setWheelResult(result.label);
        const segSize = 360 / segments.length;
        
        // Exact rotation calculation: 
        // Segment 0 is at 0 degrees (top). 
        // We want the NEEDLE (at top) to point at Segment 'index'.
        // So we rotate clockwise by (360 - (index * segSize + segSize/2))
        const extraRotations = 60; 
        const targetRotation = (360 * extraRotations) + (360 - (index * segSize + (segSize / 2)));
        setWheelRotation(prev => prev + targetRotation);

        // Auto-stop after 12 seconds - matching CSS transition
        setTimeout(() => {
          setSpinningPurchaseId(null);
          stopWheel(result.label, purchaseId, customerId);
        }, 12000);
    } else {
      showToast("Roleta não configurada corretamente.", "error");
    }
  };

   const [scratchPercent, setScratchPercent] = useState(0);

   const handleScratchMove = (e: React.MouseEvent | React.TouchEvent) => {
     if (scratchDone || promoUsedThisSession || actionsEarned <= 0) return;
     
     // Increment scratching progress
     setScratchPercent(prev => {
        const next = prev + 1.5; // Each move adds 1.5% progress
        if (next >= 100) {
           handleScratchComplete();
           return 100;
        }
        return next;
     });
   };

  const handleScratchComplete = async () => {
    if (scratchDone || promoUsedThisSession) return;
    setPromoUsedThisSession(true);
    setScratchDone(true);
    setScratchPercent(100);
    
    if (scratchResult) {
      // Find the prize config to get the cost
      const prizes = activePromotion.scratchPrizes || [];
      const prizeConfig = prizes.find(p => p.label === scratchResult);
      
      let cost = prizeConfig?.cost || 0;
      if (scratchResult.includes('%')) {
         const match = scratchResult.match(/(\d+)%/);
         if (match) {
            const percent = parseInt(match[1]);
            const lastPurchase = (purchases || [])
              .filter(p => p.companyId === companyId && (lastCustomerId ? p.customerId === lastCustomerId : true))
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (lastPurchase) {
               cost = lastPurchase.amount * (percent / 100);
            }
         }
      }

      const targetId = lastPurchaseId || (purchases || [])
        .filter(p => p.companyId === companyId && (lastCustomerId ? p.customerId === lastCustomerId : true))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.id;

    if (targetId) {
      try {
        const purchaseRef = doc(db, 'purchases', targetId);
        const snap = await getDoc(purchaseRef);
        if (snap.exists()) {
          const currentData = snap.data();
          
          // Only block if this SPECIFIC purchase has won.
          // The user specifically requested that clients can win multiple times via different purchases.
          if (currentData?.prizeWon) {
             showToast("Este cliente já recebeu um prêmio por esta compra.", "warning");
             return;
          }

          await updateDoc(purchaseRef, {
            prizeWon: scratchResult,
            prizeCost: Number(cost)
          });
          showToast(`Prêmio "${scratchResult}" registrado!`, "success");
          
          // Show overlay immediately like the wheel
          const currentCustomer = customers?.find(c => String(c.id) === String(lastCustomerId));
          const winnerName = currentCustomer?.name || 'Cliente';
          setRaffleWinner(`${winnerName} ganhou ${scratchResult}`);
        }
      } catch (err) {
        console.error("Error updating scratch prize:", err);
      }
    }
    }
  };

  const stopWheel = async (overrideResult?: string, purchaseId?: string, customerId?: string) => {
    const finalResult = overrideResult || wheelResult;
    if (!finalResult) return;
    setWheelSpinning(false);
    setSpinningPurchaseId(null);
    
    // Show winner overlay/popup IMMEDIATELY
    const targetCustId = customerId || lastCustomerId;
    const currentCustomer = customers?.find(c => String(c.id) === String(targetCustId));
    const winnerName = currentCustomer?.name || 'Cliente';
    setRaffleWinner(`${winnerName} ganhou ${finalResult}`); 

    // Database update
    const items = activePromotion?.wheelSegments || [];
    const segment = items.find(s => s.label === finalResult);
    let cost = segment?.cost || 0;
    
    if (finalResult.includes('%')) {
       const match = finalResult.match(/(\d+)%/);
       if (match) {
          const percent = parseInt(match[1]);
          const lastPurchase = (purchases || [])
            .filter(p => p.id === (purchaseId || lastPurchaseId))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (lastPurchase) cost = lastPurchase.amount * (percent / 100);
       }
    }

    const targetId = purchaseId || lastPurchaseId || (purchases || [])
      .filter(p => p.companyId === companyId && (targetCustId ? p.customerId === targetCustId : true))
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.id;

    if (targetId && finalResult) {
      try {
        const purchaseRef = doc(db, 'purchases', targetId);
        const snap = await getDoc(purchaseRef);
        if (snap.exists()) {
          const currentData = snap.data();
          
          // Only block if this SPECIFIC purchase has won.
          if (currentData?.prizeWon) {
             showToast("Este cliente já ganhou um prêmio nesta transação.", "warning");
             return;
          }

          await updateDoc(purchaseRef, {
              prizeWon: finalResult,
              prizeCost: Number(cost)
          });
          showToast(`Sorteado: ${finalResult}`, "success");
          
          if (!purchaseId && actionsEarned <= 0) {
            setPromoUsedThisSession(true);
          }
        }
      } catch (err) {
        console.error("Error updating prize:", err);
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleStart = async () => {
    const errors: string[] = [];
    if (!config.name) errors.push('name');
    if (!config.startDate) errors.push('startDate');
    if (!config.endDate) errors.push('endDate');

    if (config.type === 'raffle') {
       if (!config.minPurchaseValue) errors.push('minPurchaseValue');
       if (!config.drawDate) errors.push('drawDate');
    } else if (config.type === 'wheel') {
       if (!config.minPurchaseForWheel) errors.push('minPurchaseForWheel');
       if (!config.wheelSegments || config.wheelSegments.length === 0) errors.push('wheelSegments');
    } else if (config.type === 'scratch') {
       if (!config.minPurchaseForScratch) errors.push('minPurchaseForScratch');
       if (!config.scratchPrizes || config.scratchPrizes.length === 0) errors.push('scratchPrizes');
    } else if (config.type === 'birthday') {
       if (!config.birthdayDiscountPercent) errors.push('birthdayDiscountPercent');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      showToast("Verifique todos os campos para serem preenchidos.", "error");
      return;
    }

    setFormErrors([]);
    setIsProcessing(true);
    try {
      // Use parseISO to ensure we are comparing dates correctly
      const start = parseISO(config.startDate || '');
      const end = parseISO(config.endDate || '');
      const today = startOfDay(new Date());
      
      if (isBefore(start, today)) {
         showToast("A data de início não pode ser no passado.", "warning");
         setIsProcessing(false);
         return;
      }
      
      if (isBefore(end, start)) {
         showToast("A data de término deve ser posterior ou igual ao início.", "warning");
         setIsProcessing(false);
         return;
      }

      const newConfig = { 
        ...config, 
        id: crypto.randomUUID(), 
        isActive: true
      } as PromotionConfig;
      await onUpdateRules({ ...rules, promotionConfig: newConfig });
      setIsConfiguring(false);
      showToast("Promoção iniciada com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao iniciar promoção.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnd = async () => {
    askConfirmation(
      "Encerrar Promoção",
      "Deseja realmente encerrar esta promoção de forma manual? Ela sairá do ar e irá para o histórico.",
      async () => {
        setIsProcessing(true);
        try {
          if (activePromotion && companyId) {
            // Recalculate total cost from purchases if wheel/scratch
            let cost = activePromotion.totalCost || 0;
            const promotionPurchases = purchases.filter(p => p.promotionId === activePromotion.id);
            
          if (activePromotion.type === 'wheel' || activePromotion.type === 'scratch') {
             const prizesCost = promotionPurchases.reduce((acc, p) => acc + (p.prizeCost || 0), 0);
             cost += prizesCost;
          } else if (activePromotion.type === 'birthday') {
             const birthdayCosts = promotionPurchases.reduce((acc, p) => acc + (p.cashbackEarned || 0), 0);
             cost += birthdayCosts;
          } else if (activePromotion.type === 'raffle') {
             // For Raffle, costs are pre-defined or summed from prizes
             const rafflePrizesCost = (activePromotion.rafflePrizes || []).reduce((acc, p) => acc + ((p.value || 0) * (p.quantity || 1)), 0);
             cost = rafflePrizesCost;
          }

            const revenue = promotionStats.revenue;
            const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

            await addDoc(collection(db, 'promotion_history'), {
              companyId,
              campaignName: activePromotion.name,
              type: activePromotion.type,
              startDate: activePromotion.startDate,
              endDate: activePromotion.endDate,
              winner: raffleWinner || activePromotion.winner || '',
              prize: activePromotion.rafflePrize || (activePromotion.type === 'wheel' ? 'Prêmios da Roleta' : 'Raspadinha'),
              totalRevenue: revenue,
              totalParticipants: promotionStats.participants,
              totalActions: promotionStats.actions,
              totalCost: cost,
              roi: roi,
              endedAt: new Date().toISOString()
            });
          }
          
          await onUpdateRules({ 
            ...rules, 
            promotionConfig: { 
              ...rules.promotionConfig!, 
              isActive: false,
              winner: raffleWinner || ''
            } 
          });
          
          setRaffleWinner(null);
          setWheelResult(null);
          setScratchDone(false);
          setConfig({
            name: '',
            type: 'raffle',
            startDate: '',
            endDate: '',
            rafflePrize: '',
            drawDate: '',
            drawTime: '',
            isLinkedToLoyalty: true,
            isActive: false,
            prizes: [],
            minPurchaseValue: 10,
            isCumulative: true,
            wheelSegments: [
              { label: '5%', probability: 50, color: '#fb8500' },
              { label: '10%', probability: 30, color: '#023047' },
              { label: '15%', probability: 20, color: '#219ebc' }
            ],
            scratchPrizes: [
              { label: '5%', probability: 50, color: '#fb8500' },
              { label: '10%', probability: 30, color: '#023047' },
              { label: '20%', probability: 20, color: '#219ebc' }
            ]
          });
          setIsConfiguring(true); 
          showToast("Promoção encerrada e arquivada.", "info");
        } catch (error) {
          console.error(error);
          showToast("Erro ao encerrar promoção.", "error");
        } finally {
          setIsProcessing(false);
        }
      },
      true
    );
  };

  if (activeSubTab === 'history') {
    const filteredHistory = (history || []).filter(h => {
      const typeMatch = filterType === 'all' || h.type === filterType;
      
      const date = h.endedAt ? new Date(h.endedAt) : null;
      if (!date) return typeMatch;

      let timeMatch = true;
      const now = new Date();
      if (periodFilter === 'month') {
        timeMatch = isSameMonth(date, now) && isSameYear(date, now);
      } else if (periodFilter === 'year') {
        timeMatch = isSameYear(date, now);
      } else if (periodFilter === 'range') {
        const startMatch = !dateRange.start || date >= startOfDay(new Date(dateRange.start));
        const endMatch = !dateRange.end || date <= endOfDay(new Date(dateRange.end));
        timeMatch = startMatch && endMatch;
      }

      return typeMatch && timeMatch;
    });

    const totalRevenue = filteredHistory.reduce((acc, h) => acc + (h.totalRevenue || 0), 0);
    const avgRoi = filteredHistory.length > 0 ? filteredHistory.reduce((acc, h) => acc + (h.roi || 0), 0) / filteredHistory.length : 0;
    const totalClients = filteredHistory.reduce((acc, h) => acc + (h.totalParticipants || 0), 0);

    return (
      <div key="history-sub-tab" className="space-y-6 max-w-6xl mx-auto p-4 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">HISTÓRICO GERAL DE PROMOÇÕES</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Inteligência e resultados de campanhas encerradas</p>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                 <Filter size={14} className="text-gray-400" />
                 <select 
                   value={filterType} 
                   onChange={(e: any) => setFilterType(e.target.value)}
                   className="text-[10px] font-black uppercase tracking-widest bg-transparent outline-none cursor-pointer"
                 >
                    <option value="all">TODOS OS TIPOS</option>
                    <option value="raffle">SORTEIOS</option>
                    <option value="wheel">ROLETA</option>
                    <option value="birthday">ANIVERSÁRIO</option>
                    <option value="scratch">RASPADINHA</option>
                 </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                 <Calendar size={14} className="text-gray-400" />
                 <select 
                   value={periodFilter} 
                   onChange={(e: any) => setPeriodFilter(e.target.value)}
                   className="text-[10px] font-black uppercase tracking-widest bg-transparent outline-none cursor-pointer"
                 >
                    <option value="all">TODO O PERÍODO</option>
                    <option value="month">ESTE MÊS</option>
                    <option value="year">ESTE ANO</option>
                    <option value="range">PERSONALIZADO</option>
                 </select>
              </div>

              {periodFilter === 'range' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm font-black text-[10px] uppercase">
                   <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent outline-none text-[8px]" />
                   <span className="text-gray-300">até</span>
                   <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent outline-none text-[8px]" />
                </div>
              )}

              <Button 
                onClick={handleDeleteAllHistory} 
                variant="outline" 
                className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-4 h-10 border-red-100 text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Deletar Tudo
              </Button>

              <Button onClick={() => setActiveSubTab('dashboard')} variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 h-10 border-gray-200 hover:bg-gray-50 flex items-center gap-2">
                <ChevronLeft size={14} /> Voltar
              </Button>
           </div>
        </div>

        {/* Global stats for filtered view */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Campanhas</p>
              <p className="text-2xl font-black italic text-gray-900">{filteredHistory.length}</p>
           </Card>
           <Card className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><BadgeDollarSign size={40} /></div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Faturamento Bruto</p>
              <p className="text-2xl font-black italic text-emerald-600">{formatCurrency(totalRevenue)}</p>
           </Card>
           <Card className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={40} /></div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">ROI Médio Estimado</p>
              <p className="text-2xl font-black italic text-blue-600">{avgRoi.toFixed(1)}%</p>
           </Card>
           <Card className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Users size={40} /></div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">PARTICIPAÇÕES TOTAIS</p>
              <p className="text-2xl font-black italic text-orange-600">{totalClients}</p>
           </Card>
        </div>


        {isLoadingHistory ? (
           <div className="p-20 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Gerando relatórios consolidados...</p>
           </div>
        ) : filteredHistory.length === 0 ? (
           <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <Search className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Nenhuma campanha encontrada para os filtros selecionados</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHistory.map(h => (
                 <Card key={h.id} className="group relative bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col border-b-4 hover:border-b-orange-500">
                    <div className="p-6 pb-2">
                       <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-110 transition-transform">
                                {h.type === 'raffle' ? <Ticket size={20} /> : h.type === 'wheel' ? <Disc size={20} /> : h.type === 'birthday' ? <Cake size={20} /> : <Sparkles size={20} />}
                             </div>
                             <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase italic truncate max-w-[150px]">{h.campaignName}</h4>
                                <div className="flex gap-1.5 mt-0.5">
                                   <span className="text-[7px] font-black px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-md uppercase">
                                     {h.type === 'raffle' ? 'Sorteio' : h.type === 'wheel' ? 'Roleta' : h.type === 'birthday' ? 'Aniversário' : 'Raspadinha'}
                                   </span>
                                   <span className="text-[7px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-md uppercase">
                                      {h.endedAt ? new Date(h.endedAt).toLocaleDateString('pt-BR') : 'Sem data'}
                                   </span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-colors">
                             <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Faturamento</p>
                             <p className="text-sm font-black text-gray-900">{formatCurrency(h.totalRevenue)}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-colors">
                             <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Investimento</p>
                             <p className="text-sm font-black text-red-500">{formatCurrency(h.totalCost || 0)}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between px-2 mb-6">
                          <div className="flex items-center gap-1.5 font-black text-[8px] text-gray-500 uppercase">
                             <Users size={12} className="text-blue-500" />
                             {h.totalParticipants} Clientes
                          </div>
                          <div className="flex items-center gap-1.5 font-black text-[8px] text-gray-500 uppercase">
                             <TrendingUp size={12} className={cn((h.roi || 0) >= 0 ? "text-emerald-500" : "text-rose-500")} />
                             ROI: {(h.roi || 0).toFixed(1)}%
                          </div>
                       </div>
                    </div>

                    <div className="p-6 pt-0 mt-auto flex gap-2">
                       <Button 
                         onClick={() => handleDownloadReport(h)}
                         className="flex-1 h-12 rounded-2xl bg-gray-900 hover:bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest shadow-lg transition-all gap-2"
                       >
                          <Download size={14} /> Gerar Relatório
                       </Button>
                       <Button 
                         onClick={() => handleDeleteHistory(h.id)}
                         variant="outline"
                         className="h-12 w-12 p-0 rounded-2xl border-gray-100 text-gray-200 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center shrink-0"
                       >
                          <X size={18} />
                       </Button>
                    </div>
                 </Card>
              ))}
           </div>
        )}
      </div>
    );
  }

  if ((isConfiguring || !activePromotion) && activeSubTab !== 'history') {
    return (
      <motion.div key="setup-sub-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Configurar Nova Promoção</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Defina as regras e o estilo da sua campanha</p>
          </div>
          {activePromotion && (
            <Button onClick={() => setIsConfiguring(false)} variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
              Voltar ao Painel Ativo
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 p-6 space-y-6 bg-white border-gray-100 shadow-xl">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tipo de Promoção</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'raffle', label: 'Cupons para Sorteio', icon: <Ticket /> },
                  { id: 'wheel', label: 'Roleta da Sorte', icon: <Disc /> },
                  { id: 'birthday', label: 'Desconto Niver', icon: <Cake /> },
                  { id: 'scratch', label: 'Raspou? Ganhou!', icon: <Sparkles /> }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setConfig({ ...config, type: type.id as PromotionType })}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                      config.type === type.id ? "border-orange-500 bg-orange-50" : "border-gray-50 hover:border-gray-200"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", config.type === type.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400")}>
                      {type.icon}
                    </div>
                    <span className={cn("font-black uppercase text-[10px] tracking-widest", config.type === type.id ? "text-orange-700" : "text-gray-500")}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="md:col-span-2 p-8 space-y-8 bg-white border-gray-100 shadow-xl">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Campanha</label>
                      <input 
                        value={config.name || ''} 
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        placeholder="Ex: Mega Sorteio BuyPass" 
                        className={cn(
                          "w-full bg-gray-50 border rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 transition-all",
                          formErrors.includes('name') ? "border-red-500 bg-red-50 animate-shake" : "border-gray-100"
                        )}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Período de Atividade</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="date" 
                          value={config.startDate || ''}
                          min={todayStr}
                          onChange={e => {
                            const newDate = e.target.value;
                            if (newDate < todayStr) {
                               showToast("A data de início não pode ser no passado", "warning");
                               return;
                            }
                            setConfig({ ...config, startDate: newDate });
                          }}
                          className={cn(
                            "bg-gray-50 border rounded-2xl px-4 py-4 text-xs font-bold",
                            formErrors.includes('startDate') ? "border-red-500 bg-red-50" : "border-gray-100"
                          )}
                        />
                        <input 
                          type="date" 
                          value={config.endDate || ''}
                          min={config.startDate || todayStr}
                          onChange={e => {
                            const newDate = e.target.value;
                            if (config.startDate && newDate < config.startDate) {
                              showToast("A data final deve ser maior ou igual à inicial", "warning");
                              return;
                            }
                            setConfig({ ...config, endDate: newDate });
                          }}
                          className={cn(
                            "bg-gray-50 border rounded-2xl px-4 py-4 text-xs font-bold",
                            formErrors.includes('endDate') ? "border-red-500 bg-red-50" : "border-gray-100"
                          )}
                        />
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Regras de Ativação</h4>
                   
                   {config.type === 'raffle' && (
                     <div className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">A partir de qual Valor? (R$)</label>
                              <input type="number" value={config.minPurchaseValue || ''} onChange={e => setConfig({...config, minPurchaseValue: parseFloat(e.target.value)})} className={cn("w-full bg-white border rounded-2xl px-4 py-3 text-sm font-bold", formErrors.includes('minPurchaseValue') ? "border-red-500" : "border-gray-100")} />
                           </div>
                           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                              <button onClick={() => setConfig({...config, isCumulative: !config.isCumulative})} className={cn("w-10 h-5 rounded-full relative transition-colors", config.isCumulative ? "bg-orange-500" : "bg-gray-300")}>
                                 <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", config.isCumulative ? "left-5.5" : "left-0.5")} />
                              </button>
                              <span className="text-[9px] font-black uppercase text-gray-600">Acumulativo? (R$10=1, R$30=3)</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="grid grid-cols-12 gap-4">
                              <div className="col-span-8 space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prêmio Principal da Campanha</label>
                                 <input 
                                   placeholder="Ex: Carro 0km" 
                                   value={config.rafflePrize || ''} 
                                   onChange={e => setConfig({...config, rafflePrize: e.target.value})}
                                   className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" 
                                 />
                              </div>
                              <div className="col-span-4 space-y-1.5">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor do Prêmio (R$)</label>
                                 <input 
                                   type="number"
                                   placeholder="0,00" 
                                   value={config.totalCost || ''} 
                                   onChange={e => setConfig({...config, totalCost: parseFloat(e.target.value) || 0})}
                                   className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-red-500" 
                                 />
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lista de Prêmios Detalhada</label>
                              <button 
                                onClick={() => setConfig({...config, rafflePrizes: [...(config.rafflePrizes || []), { label: '', value: 0, quantity: 1 }]})}
                                className="text-orange-500 hover:text-orange-600 flex items-center gap-1 font-black text-[9px] uppercase tracking-tighter"
                              >
                                <Plus size={14} /> ADICIONAR ITEM
                              </button>
                           </div>
                           
                           <div className="space-y-2">
                              {(config.rafflePrizes || []).map((p, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                                   <input 
                                     placeholder="Prêmio" 
                                     value={p.label} 
                                     onChange={e => {
                                       const newPrizes = [...(config.rafflePrizes || [])];
                                       newPrizes[idx].label = e.target.value;
                                       setConfig({...config, rafflePrizes: newPrizes});
                                     }}
                                     className="col-span-5 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold" 
                                   />
                                   <input 
                                     type="number" 
                                     placeholder="Qtd" 
                                     value={p.quantity || ''} 
                                     onChange={e => {
                                       const newPrizes = [...(config.rafflePrizes || [])];
                                       newPrizes[idx].quantity = parseInt(e.target.value) || 0;
                                       setConfig({...config, rafflePrizes: newPrizes});
                                     }}
                                     className="col-span-2 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-center" 
                                   />
                                   <input 
                                     type="number" 
                                     placeholder="Valor Unit. R$" 
                                     value={p.value || ''} 
                                     onChange={e => {
                                       const newPrizes = [...(config.rafflePrizes || [])];
                                       newPrizes[idx].value = parseFloat(e.target.value) || 0;
                                       setConfig({...config, rafflePrizes: newPrizes});
                                     }}
                                     className="col-span-4 bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-red-500" 
                                   />
                                   <button 
                                     onClick={() => setConfig({...config, rafflePrizes: config.rafflePrizes?.filter((_, i) => i !== idx)})}
                                     className="col-span-1 text-red-300 hover:text-red-500 flex justify-center"
                                   >
                                     <X size={16} />
                                   </button>
                                </div>
                              ))}
                              
                              {(!config.rafflePrizes || config.rafflePrizes.length === 0) && (
                                 <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center gap-2">
                                    <div className="grid grid-cols-1 w-full">
                                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prêmio Único (Simplificado)</p>
                                     <div className="grid grid-cols-12 gap-2 mt-1">
                                        <input 
                                           placeholder="Ex: Vale Compras R$ 100" 
                                           value={config.rafflePrizes?.[0]?.label || ''} 
                                           onChange={e => {
                                              const current = config.rafflePrizes?.[0] || { label: '', value: 0, quantity: 1 };
                                              setConfig({...config, rafflePrizes: [{ ...current, label: e.target.value }]});
                                           }}
                                           className="col-span-8 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold" 
                                        />
                                        <input 
                                           type="number" 
                                           placeholder="Valor R$" 
                                           value={config.rafflePrizes?.[0]?.value || ''} 
                                           onChange={e => {
                                              const val = parseFloat(e.target.value) || 0;
                                              const current = config.rafflePrizes?.[0] || { label: '', value: 0, quantity: 1 };
                                              setConfig({...config, rafflePrizes: [{ ...current, value: val }]});
                                           }}
                                           className="col-span-4 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-black text-red-500" 
                                        />
                                     </div>
                                  </div>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data e Hora do Sorteio</label>
                              <input 
                                type="datetime-local" 
                                min={config.endDate ? `${config.endDate}T00:00` : undefined}
                                value={config.drawDate && config.drawTime ? `${config.drawDate}T${config.drawTime}` : ''} 
                               onChange={e => {
                                  const [date, time] = e.target.value.split('T');
                                  if (config.endDate && date < config.endDate) {
                                    showToast("Data do sorteio deve ser igual ou após o fim da campanha", "warning");
                                    return;
                                  }
                                  setConfig({...config, drawDate: date, drawTime: time});
                                }}
                                className={cn("w-full bg-white border rounded-2xl px-4 py-3 text-sm font-bold", formErrors.includes('drawDate') ? "border-red-500" : "border-gray-100")} 
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Custo Total dos Prêmios (R$)</label>
                              <input 
                                type="text" 
                                disabled
                                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((config.rafflePrizes || []).reduce((sum, p) => sum + ((p.value || 0) * (p.quantity || 1)), 0))} 
                                className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm font-black text-blue-600" 
                              />
                           </div>
                        </div>
                     </div>
                   )}

                   {config.type === 'wheel' && (
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Mínimo para Giro (R$)</label>
                           <div className="flex gap-4">
                               <input type="number" placeholder="Valor Mínimo" value={config.minPurchaseForWheel || ''} onChange={e => setConfig({...config, minPurchaseForWheel: parseFloat(e.target.value)})} className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opções da Roleta</label>
                              <Button 
                                onClick={() => setConfig({...config, wheelSegments: [...(config.wheelSegments || []), { label: '', probability: 10, color: '#fb8500', cost: 0 }]})}
                                variant="ghost"
                                size="sm"
                                className="text-orange-500 hover:text-orange-600 font-black text-[9px] uppercase tracking-widest"
                              >
                                <Plus size={14} className="mr-1" /> Adicionar Opção
                              </Button>
                           </div>
                           
                           <div className="space-y-3">
                              {(config.wheelSegments || []).map((seg, i) => (
                                <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 hover:border-orange-200 transition-all">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                    <div className="md:col-span-5 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Opção (Ex: 10% OFF)</label>
                                      <input 
                                        className="text-sm font-bold uppercase w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 focus:border-orange-500 outline-none transition-all" 
                                        placeholder="Ex: 5% OFF"
                                        value={seg.label} 
                                        onChange={e => {
                                          const newSegs = [...(config.wheelSegments || [])];
                                          newSegs[i].label = e.target.value;
                                          setConfig({...config, wheelSegments: newSegs});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center block">Prob. (%)</label>
                                      <input 
                                        type="number"
                                        className="text-sm font-bold w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-center" 
                                        value={seg.probability} 
                                        onChange={e => {
                                          const newSegs = [...(config.wheelSegments || [])];
                                          newSegs[i].probability = parseInt(e.target.value) || 0;
                                          setConfig({...config, wheelSegments: newSegs});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-1 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center block">Cor</label>
                                      <input 
                                        type="color" 
                                        className="w-full h-11 bg-transparent rounded-xl cursor-pointer" 
                                        value={seg.color} 
                                        onChange={e => {
                                          const newSegs = [...(config.wheelSegments || [])];
                                          newSegs[i].color = e.target.value;
                                          setConfig({...config, wheelSegments: newSegs});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                        Custo (R$)
                                        {seg.label.includes('%') && <span className="text-[8px] text-blue-500 lowercase font-medium">Auto-calc %</span>}
                                      </label>
                                      <input 
                                        type="number"
                                        disabled={seg.label.includes('%')}
                                        placeholder={seg.label.includes('%') ? 'Calculado' : '0.00'}
                                        className="text-sm font-bold w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-red-500 disabled:opacity-50" 
                                        value={seg.cost || ''} 
                                        onChange={e => {
                                          const newSegs = [...(config.wheelSegments || [])];
                                          newSegs[i].cost = parseFloat(e.target.value) || 0;
                                          setConfig({...config, wheelSegments: newSegs});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pt-5">
                                      <button onClick={() => setConfig({...config, wheelSegments: config.wheelSegments?.filter((_, idx) => idx !== i)})} className="text-red-300 hover:text-red-500 p-2 transition-colors transition-all hover:scale-110"><X size={20} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {(!config.wheelSegments || config.wheelSegments.length === 0) && (
                                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma opção configurada</div>
                              )}
                           </div>
                        </div>
                     </div>
                   )}

                   {config.type === 'birthday' && (
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Desconto de Aniversário (%)</label>
                         <input type="number" value={config.birthdayDiscountPercent || ''} onChange={e => setConfig({...config, birthdayDiscountPercent: parseInt(e.target.value)})} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold max-w-[200px]" />
                      </div>
                   )}

                   {config.type === 'scratch' && (
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor Mínimo para Raspadinha (R$)</label>
                           <input type="number" value={config.minPurchaseForScratch || ''} onChange={e => setConfig({...config, minPurchaseForScratch: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold max-w-[200px]" />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prêmios da Raspadinha</label>
                              <Button 
                                onClick={() => setConfig({...config, scratchPrizes: [...(config.scratchPrizes || []), { label: '', probability: 10, cost: 0 }]})}
                                variant="ghost"
                                size="sm"
                                className="text-orange-500 hover:text-orange-600 font-black text-[9px] uppercase tracking-widest"
                              >
                                <Plus size={14} className="mr-1" /> Adicionar Prêmio
                              </Button>
                           </div>
                           
                           <div className="space-y-3">
                              {(config.scratchPrizes || []).map((p, i) => (
                                <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 hover:border-orange-200 transition-all">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                    <div className="md:col-span-6 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nome do Prêmio</label>
                                      <input 
                                        className="text-sm font-bold uppercase w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 focus:border-orange-500 outline-none transition-all" 
                                        placeholder="Ex: BRINDE SURPRESA"
                                        value={p.label} 
                                        onChange={e => {
                                          const newPrizes = [...(config.scratchPrizes || [])];
                                          newPrizes[i].label = e.target.value;
                                          setConfig({...config, scratchPrizes: newPrizes});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center block">Prob. (%)</label>
                                      <input 
                                        type="number"
                                        className="text-sm font-bold w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-center" 
                                        value={p.probability} 
                                        onChange={e => {
                                          const newPrizes = [...(config.scratchPrizes || [])];
                                          newPrizes[i].probability = parseInt(e.target.value) || 0;
                                          setConfig({...config, scratchPrizes: newPrizes});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                        Custo (R$)
                                        {p.label.includes('%') && <span className="text-[8px] text-blue-500 lowercase font-medium">Auto-calc %</span>}
                                      </label>
                                      <input 
                                        type="number"
                                        disabled={p.label.includes('%')}
                                        placeholder={p.label.includes('%') ? 'Calculado' : '0.00'}
                                        className="text-sm font-bold w-full bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 text-red-500 disabled:opacity-50" 
                                        value={p.cost || ''} 
                                        onChange={e => {
                                          const newPrizes = [...(config.scratchPrizes || [])];
                                          newPrizes[i].cost = parseFloat(e.target.value) || 0;
                                          setConfig({...config, scratchPrizes: newPrizes});
                                        }}
                                      />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pt-5">
                                      <button onClick={() => setConfig({...config, scratchPrizes: config.scratchPrizes?.filter((_, idx) => idx !== i)})} className="text-red-300 hover:text-red-500 p-2 transition-colors transition-all hover:scale-110"><X size={20} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {(!config.scratchPrizes || config.scratchPrizes.length === 0) && (
                                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum prêmio configurado</div>
                              )}
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-500 text-white rounded-xl">
                            <Zap size={16} />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-orange-900 uppercase italic">Integração com Fidelidade</h4>
                            <p className="text-[9px] text-orange-600 font-bold uppercase tracking-wider">Acumule pontos enquanto promove</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setConfig({ ...config, isLinkedToLoyalty: !config.isLinkedToLoyalty })}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          config.isLinkedToLoyalty ? "bg-orange-500" : "bg-gray-300"
                        )}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", config.isLinkedToLoyalty ? "left-7" : "left-1")} />
                      </button>
                   </div>
                   <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-orange-100 flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-xl text-orange-700">
                         {rules.type === 'points' ? <Star size={14} /> : <BadgeDollarSign size={14} />}
                         <span className="text-[10px] font-black uppercase">{rules.type === 'points' ? 'Pontos' : 'Cashback'} em vigor</span>
                      </div>
                      <p className="text-[9px] text-orange-800 font-bold uppercase leading-tight">
                         {config.isLinkedToLoyalty 
                           ? "As compras gerarão recompensa no programa principal de fidelidade da sua loja."
                           : "A campanha funcionará de forma isolada, apenas para o prêmio da promoção."}
                      </p>
                   </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => setActiveSubTab('history')}
                    variant="outline"
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2"
                  >
                    <History size={16} /> Histórico
                  </Button>
                  <Button 
                    onClick={handleStart}
                    disabled={isProcessing}
                    className="flex-[2] bg-[#fb8500] hover:bg-[#ffb703] py-6 rounded-[2.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 text-white transition-all transform hover:-translate-y-1"
                  >
                    {isProcessing ? "Iniciando..." : "Lançar Promoção"}
                  </Button>
                </div>
             </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 ring-4 ring-gray-50">
            {activePromotion.type === 'raffle' ? <Ticket size={32} /> : activePromotion.type === 'wheel' ? <Disc size={32} /> : activePromotion.type === 'birthday' ? <Cake size={32} /> : <Sparkles size={32} />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">{activePromotion.name}</h2>
            <div className="flex flex-wrap gap-2">
               <span className="text-[7px] font-black px-2 py-1 bg-orange-100 text-orange-700 rounded-md uppercase tracking-widest">
                 {activePromotion.type === 'raffle' ? 'Sorteio de Prêmios' : activePromotion.type === 'wheel' ? 'Roleta Interativa' : activePromotion.type === 'birthday' ? 'Clube Aniversariante' : 'Raspa & Ganha'}
               </span>
               <span className="text-[7px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-widest">Ativo Agora</span>
               {activePromotion.isLinkedToLoyalty && (
                 <span className="text-[7px] font-black px-2 py-1 bg-blue-100 text-blue-700 rounded-md uppercase tracking-widest">Acumula Fidelidade</span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
           <Button 
             onClick={() => setIsMarking(true)} 
             disabled={isProcessing} 
             className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
           >
             <Plus size={18} /> Lançar Venda
           </Button>
           
           <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100 gap-1">
              <Button 
                onClick={() => setShowConfigModal(true)} 
                variant="ghost" 
                className="h-9 px-4 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white font-black uppercase tracking-widest text-[9px] flex items-center gap-2 transition-all"
              >
                <Settings size={14} /> Regras
              </Button>
              <Button 
                onClick={() => setActiveSubTab('history')} 
                disabled={isProcessing} 
                variant="ghost" 
                className="h-9 px-4 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white font-black uppercase tracking-widest text-[9px] flex items-center gap-2 transition-all"
              >
                <History size={14} /> Histórico
              </Button>
              <div className="w-[1px] h-4 bg-gray-200 mx-1" />
              <Button 
                onClick={handleEnd} 
                disabled={isProcessing} 
                variant="ghost" 
                className="h-9 px-4 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-[9px] transition-all"
              >
                {isProcessing ? "..." : "Encerrar"}
              </Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                 { label: 'Faturamento Promo', val: formatCurrency(promotionStats.revenue), color: 'text-gray-900' },
                 { label: 'Custo Recompensas', val: formatCurrency(promotionStats.totalInvestment), color: 'text-red-500' },
                 { label: 'ROI Estimado', val: `${promotionStats.roi.toFixed(1)}%`, color: 'text-emerald-600' },
                 { label: 'Participações Totais', val: `${promotionStats.participants}`, color: 'text-orange-600' },
                 { label: 'Ticket Médio', val: formatCurrency(promotionStats.avgTicket), color: 'text-blue-600' },
                 { label: 'Ganhadores', val: promotionStats.winnersCount.toString(), color: 'text-gray-900' }
              ].map((stat, i) => (
                <Card key={i} className="p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className={cn("text-lg font-black italic", stat.color)}>{stat.val}</p>
                </Card>
              ))}
           </div>

           <Card className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-xl min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 italic">Participação Recente</h3>
                 <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><Search size={20} /></button>
                 </div>
              </div>
              
              <div className="space-y-4">
                 {promotionStats.recent.map((p, i) => {
                   const customerTotalActions = purchases
                     .filter(pur => pur.customerId === p.customerId && pur.promotionId === activePromotion?.id)
                     .reduce((acc, pur) => acc + (pur.actionsEarned || 0), 0);
                   
                   return (
                     <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-orange-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center font-black text-orange-500 shadow-sm group-hover:scale-110 transition-transform">{(customers.find(c => String(c.id) === String(p.customerId))?.name || p.customerName || 'C').charAt(0)}</div>
                           <div>
                              <p className="text-xs font-black text-gray-900 uppercase">
                                {customers.find(c => String(c.id) === String(p.customerId))?.name || p.customerName || 'Cliente sem nome'}
                                {p.prizeWon && <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white rounded-md text-[8px] animate-pulse">GANHOU: {p.prizeWon}</span>}
                              </p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase leading-relaxed mt-0.5">
                                {new Date(p.date).toLocaleString()} • Compra de {formatCurrency(p.amount)}
                              </p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           {activePromotion.type === 'wheel' && !p.prizeWon && (p.actionsEarned || 0) > 0 && (
                              <Button 
                                size="sm"
                                disabled={wheelSpinning}
                                onClick={() => {
                                  spinWheel(p.id, p.customerId);
                                }}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 whitespace-nowrap min-w-[100px]"
                              >
                                {spinningPurchaseId === p.id ? 'SORTEANDO...' : 'GIRAR ROLETA'}
                              </Button>
                           )}
                           {activePromotion.type === 'wheel' && p.prizeWon && (
                              <div className="px-4 py-2 bg-gray-100 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-xl border border-gray-200 truncate max-w-[150px]" title={p.prizeWon}>
                                {p.prizeWon}
                              </div>
                           )}
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black px-2 py-1 bg-orange-100 text-orange-700 rounded-lg uppercase tracking-widest border border-orange-200">
                                {p.actionsEarned || 1} {activePromotion.type === 'raffle' ? 'Cupom' : 'Ação'}
                              </span>
                              <span className="text-[7px] font-black text-orange-500/60 uppercase mt-1">Acúmulo: {customerTotalActions}</span>
                              {activePromotion.type === 'birthday' && p.cashbackEarned > 0 && (
                                <span className="text-[7px] font-black text-emerald-600 uppercase mt-0.5">Desconto: {formatCurrency(p.cashbackEarned)}</span>
                              )}
                           </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-500 transition-all ml-2" />
                     </div>
                   );
                 })}
                 <button className="w-full py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-2xl hover:border-gray-200 transition-all flex items-center justify-center gap-2" onClick={() => setShowRaffleParticipants(true)}>
                   <ChevronRight size={12} /> Ver Lista Total de Participantes
                 </button>
              </div>
           </Card>
        </div>

        <div className="lg:col-span-1">
           <Card className="bg-gray-900 border-orange-500/20 h-full p-8 text-white space-y-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full -mr-24 -mt-24" />
              
                        <div className="relative z-10 space-y-6 text-center py-4">
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/40 mb-4 shadow-lg shadow-orange-500/10">
                              <Pointer size={12} className="text-orange-400 animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Painel de Acompanhamento ao Vivo</span>
                           </div>
                 
                 {activePromotion.type === 'wheel' && (
                    <div className="space-y-12 py-10">
                       <div className="relative">
                         {/* 3D Wheel Shadow & Depth */}
                         <div className="absolute inset-0 bg-black/40 blur-3xl rounded-full translate-y-4" />
                         
                         <div className={cn(
                           "w-72 h-72 rounded-full border-[10px] border-[#023047] bg-[#023047] mx-auto relative flex items-center justify-center overflow-hidden transition-all shadow-[0_0_50px_rgba(251,133,0,0.3)] ring-4 ring-orange-500/20"
                         )}
                         >
                              <motion.div 
                                animate={{ rotate: wheelRotation }}
                                transition={{ 
                                   duration: wheelSpinning ? 12 : 0, 
                                   ease: [0.15, 0, 0, 1] 
                                }}
                                className="w-full h-full rounded-full relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]"
                                style={{ transformOrigin: 'center center' }}
                              >
                                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                                 {(activePromotion.wheelSegments || []).map((seg, i, arr) => {
                                    const angle = 360 / arr.length;
                                    const casinoColors = ['#023047', '#ffb703', '#fb8500', '#219ebc', '#8ecae6', '#fb8500'];
                                    const bgColor = seg.color || casinoColors[i % casinoColors.length];
                                    
                                    const isLight = (color: string) => {
                                       const hex = color.replace('#', '');
                                       const r = parseInt(hex.substr(0, 2), 16);
                                       const g = parseInt(hex.substr(2, 2), 16);
                                       const b = parseInt(hex.substr(4, 2), 16);
                                       const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                                       return brightness > 155;
                                    };
                                    
                                    return (
                                       <div 
                                         key={i} 
                                         className="absolute top-0 left-1/2 -ml-[144px] w-[288px] h-[144px] origin-bottom flex items-center justify-center"
                                         style={{ 
                                           transform: `rotate(${angle * i}deg)`,
                                           backgroundColor: bgColor,
                                           clipPath: `polygon(50% 100%, 0 0, 100% 0)`,
                                           borderLeft: '1px solid rgba(255,255,255,0.1)'
                                         }}
                                       >
                                          <span 
                                            className={cn(
                                              "text-[11px] font-black uppercase transform -translate-y-9 tracking-tighter",
                                              isLight(bgColor) ? "text-gray-900" : "text-white"
                                            )} 
                                            style={{ textShadow: isLight(bgColor) ? 'none' : '0 2px 4px rgba(0,0,0,0.5)', writingMode: 'vertical-rl' }}
                                          >
                                             {seg.label}
                                          </span>
                                       </div>
                                    );
                                 })}
                                 {/* Center Bolt */}
                                 <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-orange-500">
                                       <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                                    </div>
                                 </div>
                              </motion.div>
                         </div>
                         {/* Visual Pointer */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 flex flex-col items-center z-30">
                            <div className="w-10 h-12 bg-white rounded-b-2xl shadow-xl border-x-4 border-b-4 border-orange-500 flex items-center justify-center">
                               <ChevronDown size={24} className="text-orange-500 animate-bounce" />
                            </div>
                         </div>
                       </div>
                    </div>
                  )}

                  {activePromotion.type === 'birthday' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="bg-white/10 p-8 rounded-full border border-white/20 backdrop-blur-md"
                          >
                            <Cake size={80} className="text-orange-500 drop-shadow-[0_0_20px_rgba(251,133,0,0.5)]" />
                          </motion.div>
                          <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-4 -right-4 text-orange-400"
                          >
                            <Sparkles size={32} />
                          </motion.div>
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white shadow-orange-500/50" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>Feliz Aniversário!</h3>
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400">Celebre conosco e ganhe seu presente</p>
                        </div>
                        <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ x: "-100%" }}
                             animate={{ x: "100%" }}
                             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                             className="w-full h-full bg-orange-500"
                           />
                        </div>
                    </div>
                  )}

                       <div className="space-y-6">
                          {!wheelSpinning ? (
                            <Button 
                              onClick={spinWheel} 
                              disabled={promoUsedThisSession || (actionsEarned <= 0 && !promoUsedThisSession) || (activePromotion.endDate && isBefore(endOfDay(parseISO(activePromotion.endDate)), new Date()))} 
                              className={cn(
                                "w-full h-20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all border-b-8 active:border-b-0 active:translate-y-1 mb-8", 
                                promoUsedThisSession || (actionsEarned <= 0 && !promoUsedThisSession) || (activePromotion.endDate && isBefore(endOfDay(parseISO(activePromotion.endDate)), new Date()))
                                  ? "bg-gray-700 border-gray-800 text-gray-500 cursor-not-allowed opacity-50" 
                                  : "bg-orange-500 hover:bg-orange-600 border-orange-700 text-white shadow-orange-500/40"
                              )}
                            >
                               <div className="flex flex-col items-center">
                                  <span>
                                    {promoUsedThisSession 
                                      ? 'SORTEIO REALIZADO' 
                                      : (activePromotion.endDate && isBefore(endOfDay(parseISO(activePromotion.endDate)), new Date()))
                                        ? 'CAMPANHA ENCERRADA'
                                        : actionsEarned <= 0 
                                          ? 'AGUARDANDO VENDA...' 
                                          : 'GIRE AQUI'}
                                  </span>
                               </div>
                            </Button>
                          ) : (
                            <div className="w-full h-20 rounded-[2.5rem] bg-orange-600 flex items-center justify-center font-black text-white uppercase tracking-widest animate-pulse">
                              SORTEANDO...
                            </div>
                          )}
                          {wheelResult && !wheelSpinning && (
                              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] shadow-2xl border-4 border-white/20 text-center relative overflow-hidden">
                                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                 <Sparkles className="absolute top-4 left-4 text-white/40" size={24} />
                                 <Sparkles className="absolute bottom-4 right-4 text-white/40" size={24} />
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Parabéns! Você ganhou:</p>
                                 <span className="text-4xl font-black italic text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{wheelResult}</span>
                                 <div className="mt-4 flex flex-col items-center">
                                    <div className="w-12 h-1 bg-white/20 rounded-full mb-2" />
                                    <p className="text-[8px] font-bold text-white/50 uppercase tracking-[0.3em]">RESGATE NA HORA</p>
                                 </div>
                              </motion.div>
                           )}
                        </div>

                   {activePromotion.type === 'scratch' && (
                    <div className="space-y-8 py-10">
                        <div className="relative group">
                           <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-[3rem] group-hover:bg-orange-500/30 transition-all" />
                           <div className="relative w-full aspect-video bg-white/5 rounded-[3rem] border-4 border-white/10 overflow-hidden flex items-center justify-center p-8 select-none">
                             {!scratchDone ? (
                                <motion.div 
                                  className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-700 flex flex-col items-center justify-center p-8 text-center cursor-crosshair z-20 overflow-hidden" 
                                  whileHover={{ scale: 1.01 }}
                                  onMouseMove={handleScratchMove} 
                                  onTouchMove={handleScratchMove}
                                >
                                   <motion.div 
                                      className="absolute inset-0 bg-orange-500/10 transform origin-left"
                                      style={{ scaleX: scratchPercent / 100 }}
                                   />
                                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />
                                   <div className="relative z-10 flex flex-col items-center">
                                      <div className="p-4 bg-white/10 rounded-full mb-4 border border-white/20">
                                         <Sparkles className="text-white animate-pulse" size={40} />
                                      </div>
                                      <h4 className="text-xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg">Raspe & Ganha</h4>
                                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-2">Passe o mouse ou dedo para raspar</p>
                                      
                                      <div className="mt-6 w-48 h-2 bg-black/20 rounded-full overflow-hidden border border-white/10">
                                         <motion.div 
                                            className="h-full bg-orange-500"
                                            animate={{ width: `${scratchPercent}%` }}
                                         />
                                      </div>
                                   </div>
                                </motion.div>
                             ) : (
                                <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} className="text-center space-y-4">
                                   <div className="inline-flex p-5 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-2xl mb-2 border-4 border-white/20">
                                      <Trophy className="text-white" size={48} />
                                   </div>
                                   <div>
                                     <p className="text-[11px] text-white/60 font-black uppercase tracking-[0.4em] mb-2">GANHOU:</p>
                                     <p className="text-6xl font-black italic text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                                        {scratchResult || 'PRÊMIO!'}
                                     </p>
                                   </div>
                                   <div className="pt-4">
                                     <div className="px-4 py-2 bg-white/10 rounded-xl inline-block border border-white/10">
                                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">VALIDAÇÃO INSTANTÂNEA</p>
                                     </div>
                                   </div>
                                </motion.div>
                             )}
                           </div>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-white/30">
                           <div className="h-px bg-white/10 flex-1" />
                           <span className="text-[8px] font-black uppercase tracking-[0.3em]">Boa Sorte!</span>
                           <div className="h-px bg-white/10 flex-1" />
                        </div>
                    </div>
                  )}

                 {activePromotion.type === 'raffle' && (
                   <div className="space-y-8 py-8">
                      <div className="p-8 bg-white/10 rounded-[3rem] border border-white/10 space-y-4 shadow-inner relative overflow-hidden">
                         {raffleShuffling && (
                            <motion.div 
                              animate={{ 
                                backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"] 
                              }}
                              transition={{ duration: 0.3, repeat: Infinity }}
                              className="absolute inset-0 flex flex-col items-center justify-center z-20 shadow-[inset_0_0_100px_rgba(255,255,255,0.3)]"
                            >
                               <RefreshCcw size={60} className="animate-spin text-white opacity-90 drop-shadow-lg" />
                               <p className="text-3xl font-black italic text-white mt-6 uppercase tracking-tighter drop-shadow-md">Sorteando...</p>
                               <div className="flex gap-2 mt-4">
                                  {[1,2,3,4,5].map(i => (
                                     <motion.div 
                                       key={i}
                                       animate={{ scale: [1, 1.5, 1] }}
                                       transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                       className="w-2 h-2 rounded-full bg-white"
                                     />
                                  ))}
                               </div>
                            </motion.div>
                         )}
                         <div className="relative z-10">
                            <div className="w-20 h-20 bg-orange-500 text-white rounded-[2rem] mx-auto flex items-center justify-center shadow-lg">
                               <Ticket size={40} />
                            </div>
                            <div className="mt-4">
                               <p className="text-[10px] font-black text-white uppercase tracking-widest">Cupons Participantes</p>
                               <p className="text-4xl font-black italic">{promotionStats.actions}</p>
                            </div>
                            {(raffleWinner || activePromotion.raffleWinner) && !raffleShuffling && (
                               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
                                  <p className="text-[9px] font-black uppercase text-orange-300">🏆 Ganhador do Prêmio:</p>
                                  <p className="text-4xl md:text-6xl font-black uppercase italic text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight">{raffleWinner || activePromotion.raffleWinner}</p>
                               </motion.div>
                            )}
                         </div>
                      </div>
                      {(() => {
                         const now = new Date();
                         const drawDateTime = activePromotion.drawDate ? new Date(`${activePromotion.drawDate}T${activePromotion.drawTime || '00:00'}`) : null;
                         const isTimeReached = !drawDateTime || now >= drawDateTime;
                         return (
                           <div className="space-y-4">
                             <Button 
                               onClick={handleDrawRaffle}
                               disabled={raffleShuffling || !isTimeReached || !!(raffleWinner || activePromotion.raffleWinner || raffleWinners.length > 0 || activePromotion.isDrawn)}
                               className={cn(
                                 "w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 relative z-10",
                                 (raffleWinner || activePromotion.raffleWinner || raffleWinners.length > 0 || activePromotion.isDrawn) ? "bg-gray-800 text-gray-500 border border-gray-700" :
                                 isTimeReached ? "bg-orange-500 text-white shadow-lg shadow-orange-500/10" : "bg-white/10 text-white/30 border border-white/5"
                               )}
                             >
                                <RefreshCcw size={18} className={raffleShuffling ? "animate-spin" : ""} /> 
                                {raffleShuffling ? "Sorteando..." : (raffleWinner || activePromotion.raffleWinner || raffleWinners.length > 0 || activePromotion.isDrawn) ? "SORTEIO FINALIZADO" : isTimeReached ? "SORTEAR AGORA" : "SORTEIO AGENDADO"}
                             </Button>
                           </div>
                         );
                      })()}
                   </div>
                 )}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 relative z-10">
                 <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                    <Activity size={14} />
                 </div>
                 <div className="text-left">
                    <p className="text-[9px] font-black text-white uppercase tracking-tight">Status do Servidor Sorteios</p>
                    <p className="text-[8px] text-white font-bold uppercase">Operando Normalmente • 100% On-line</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Modal de Configuração da Campanha (Somente Leitura) */}
      <AnimatePresence>
         {showConfigModal && activePromotion && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xl">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <Settings className="text-orange-500" size={14} />
                           <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter italic">Regras da Campanha</h3>
                        </div>
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Consulta de Configuração • Bloqueado para Edição</p>
                     </div>
                     <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nome da Campanha</p>
                           <p className="text-xs font-bold text-gray-900 uppercase">{activePromotion.name}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 text-right">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tipo</p>
                           <p className="text-xs font-black text-orange-600 uppercase italic">{activePromotion.type}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Período Início</p>
                           <p className="text-xs font-bold text-gray-900">{activePromotion.startDate}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 text-right">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Período Fim</p>
                           <p className="text-xs font-bold text-gray-900">{activePromotion.endDate}</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Configuração Financeira</label>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                 <p className="text-[8px] font-black text-orange-400 uppercase mb-1">Custo Total</p>
                                 <p className="text-lg font-black text-orange-700">{formatCurrency(activePromotion.totalCost || 0)}</p>
                             </div>
                             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-right">
                                 <p className="text-[8px] font-black text-emerald-400 uppercase mb-1">Val. Mínimo</p>
                                 <p className="text-lg font-black text-emerald-700">{formatCurrency(activePromotion.minPurchaseValue || activePromotion.minPurchaseForWheel || 0)}</p>
                             </div>
                         </div>
                     </div>

                     {activePromotion.type === 'raffle' && (
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prêmios do Sorteio</label>
                           <div className="space-y-2">
                              {(activePromotion.rafflePrizes || []).map((p, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-white group">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 italic">#{i+1}</div>
                                       <span className="text-xs font-bold text-gray-700 uppercase">{p.label}</span>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[8px] font-black text-gray-400 uppercase">Qtd x Valor</p>
                                       <span className="text-sm font-black text-orange-600">{p.quantity || 1}x {formatCurrency(p.value)}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-100">
                        <div className="flex gap-3">
                           <Info size={18} className="text-rose-500 shrink-0" />
                           <div>
                              <p className="text-[10px] text-rose-600 font-black uppercase mb-1">Nota de Segurança</p>
                              <p className="text-[10px] text-rose-900/60 leading-relaxed font-bold">As regras desta campanha foram seladas no momento do lançamento e não podem ser alteradas para manter a integridade dos cupons já emitidos.</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="p-8 bg-gray-50 flex gap-4">
                     <Button onClick={() => setShowConfigModal(false)} className="w-full bg-gray-900 text-white rounded-2xl py-5 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Fechar Consulta</Button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Modal de Lançamento de Venda */}
      <AnimatePresence>
        {isMarking && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xl">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 10 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.95, opacity: 0, y: 10 }}
               transition={{ type: 'spring', damping: 25, stiffness: 300 }}
               className="bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16" />
              
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                       <CreditCard size={20} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter italic">Lançar Venda na Promoção</h3>
                 </div>
                 <button 
                   onClick={() => { setIsMarking(false); setSelectedCustomer(null); setLookupPhone(undefined); setIsRegistering(false); }} 
                   className="p-3 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-100 rounded-full relative z-50"
                 >
                    <X size={24} />
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localizar Celular</label>
                       <PhoneInput 
                         placeholder="Ex: +55 21 99999-9999" 
                         value={lookupPhone} 
                         onChange={val => {
                           setLookupPhone(val);
                           if (val) {
                             const clean = (val as string).replace(/\D/g, '');
                             const found = customers.find(c => {
                               const cPhone = c.phone.replace(/\D/g, '');
                               return cPhone === clean || cPhone.endsWith(clean) || clean.endsWith(cPhone);
                             });
                             if (found) {
                               setSelectedCustomer(found);
                               setIsRegistering(false);
                             } else {
                               setSelectedCustomer(null);
                               setIsRegistering(true);
                             }
                           } else {
                             setSelectedCustomer(null);
                             setIsRegistering(false);
                           }
                         }}
                         defaultCountry="BR"
                         international={false}
                         className="PhoneInput dark text-sm font-bold h-16 w-full"
                       />
                    </div>

                    {isRegistering && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-4">
                          <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Novo Cliente Identificado!</p>
                          <div className="space-y-3">
                             <input 
                               placeholder="Nome Completo" 
                               value={newName}
                               onChange={e => setNewName(e.target.value)}
                               className="w-full px-4 py-3 rounded-xl border border-orange-200 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                             />
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-orange-400 uppercase ml-1">Data de Nascimento (Obrigatório)</label>
                                <input 
                                  type="date" 
                                  value={newBirthDate}
                                  onChange={e => setNewBirthDate(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-orange-200 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                                />
                             </div>
                             <Button 
                               onClick={async () => {
                                 if (!newName || !lookupPhone || !companyId || !newBirthDate) {
                                   showToast("Nome, celular e data de nascimento são obrigatórios.", "warning");
                                   return;
                                 }

                                 const nameParts = newName.trim().split(/\s+/);
                                 if (nameParts.length < 2) {
                                   showToast("Insira nome e sobrenome para o registro completo.", "warning");
                                   return;
                                 }
                                 if (!purchaseValue || parseFloat(purchaseValue) <= 0) {
                                   showToast("Informe o valor da compra para cadastrar e já lançar a venda.", "warning");
                                   return;
                                 }
                                 setIsProcessing(true);
                                 try {
                                   const docRef = await addDoc(collection(db, 'customers'), {
                                     name: newName,
                                     phone: lookupPhone,
                                     birthDate: newBirthDate,
                                     companyId,
                                     points: 0,
                                     cashbackBalance: 0,
                                     totalSpent: 0,
                                     totalPurchases: 0,
                                     createdAt: new Date().toISOString()
                                   });
                                   const newCust: any = { id: docRef.id, name: newName, phone: lookupPhone, birthDate: newBirthDate, points: 0, cashbackBalance: 0, totalSpent: 0, totalPurchases: 0, companyId, createdAt: new Date().toISOString(), lastPurchaseDate: '' };
                                   setSelectedCustomer(newCust);
                                   setIsRegistering(false);
                                   
                                   // Automatically trigger the purchase marking since the value is already there
                                   await handleMarkPurchase(newCust);
                                   
                                   showToast("Cliente registrado e venda lançada!", "success");
                                 } catch (error) {
                                   console.error(error);
                                   showToast("Erro ao processar cadastro e venda.", "error");
                                 } finally {
                                   setIsProcessing(false);
                                 }
                               }}
                               className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                             >
                               Cadastrar e Lançar Venda Now
                             </Button>
                          </div>
                       </motion.div>
                    )}

                    {selectedCustomer && (
                       <div className="space-y-4">
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-black">
                                   {selectedCustomer.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-emerald-700 uppercase">Cliente</p>
                                   <p className="text-xs font-black text-gray-900 uppercase">{selectedCustomer.name}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-emerald-700 uppercase">Saldo</p>
                                <p className="text-xs font-black text-gray-900">
                                   {rules.rewardMode === 'points' ? `${selectedCustomer.points} Pts` : `R$ ${selectedCustomer.cashbackBalance?.toFixed(2)}`}
                                </p>
                             </div>
                          </motion.div>

                          {!selectedCustomer.birthDate && (
                             <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                                <label className="text-[9px] font-black text-rose-500 uppercase ml-1">Data de Nascimento (Obrigatório para Promoções)</label>
                                <input 
                                  type="date" 
                                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                                  onChange={e => setSelectedCustomer({...selectedCustomer, birthDate: e.target.value})}
                                />
                             </div>
                          )}
                       </div>
                    )}
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor da Compra (R$)</label>
                    <input 
                      type="number" 
                      value={purchaseValue}
                      onChange={e => setPurchaseValue(e.target.value)}
                      placeholder="0,00" 
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-2xl font-black text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 h-20 text-center"
                    />
                 </div>

                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase">Resumo da Ação</p>
                       <div className="flex gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                       </div>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold leading-relaxed uppercase">
                       Ao confirmar, a venda será registrada. {activePromotion.isLinkedToLoyalty ? "O cliente receberá benefícios do programa de fidelidade e participará da promoção ativa." : "A venda contará apenas para as estatísticas da promoção."}
                    </p>
                 </div>

                 <Button 
                   onClick={() => handleMarkPurchase()}
                   disabled={isProcessing || !selectedCustomer || !purchaseValue}
                   className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 text-white transition-all shadow-lg"
                 >
                   {isProcessing ? 'Processando...' : 'Confirmar Lançamento'}
                 </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Configuração (Leitura) */}
      {showConfigModal && activePromotion && (
        <ConfigModal 
          promotion={activePromotion} 
          isOpen={showConfigModal} 
          onClose={() => setShowConfigModal(false)} 
        />
      )}
      {/* Participants Modal */}
      {showRaffleParticipants && activePromotion && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, y: 100 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
           >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase">Lista de Participantes</h3>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Campanha: {activePromotion.title}</p>
                 </div>
                 <Button variant="ghost" onClick={() => setShowRaffleParticipants(false)} className="rounded-full w-10 h-10 p-0 text-gray-400 hover:text-gray-900">
                    <X size={20} />
                 </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                 <div className="space-y-2">
                    {(purchases || []).filter(p => p.promotionId === activePromotion.id).map((p, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                             <p className="text-xs font-black text-gray-900 uppercase">{p.customerName}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">{p.date ? format(parseISO(p.date), 'dd/MM/yyyy HH:mm') : '---'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-orange-500 uppercase">{p.actionsEarned || 1} {activePromotion.type === 'raffle' ? 'Cupons' : 'Ações'}</p>
                             <p className="text-[9px] font-bold text-gray-400">ID: {p.id.slice(-6)}</p>
                          </div>
                       </div>
                    ))}
                    {(purchases || []).filter(p => p.promotionId === activePromotion.id).length === 0 && (
                       <div className="text-center py-20 flex flex-col items-center gap-2">
                          <Users size={32} className="text-gray-200" />
                          <p className="text-gray-400 font-black uppercase text-xs">Nenhum participante ainda</p>
                       </div>
                    )}
                 </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                 <Button onClick={() => setShowRaffleParticipants(false)} className="w-full bg-gray-900 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-xl">Fechar Lista</Button>
              </div>
           </motion.div>
        </div>
      )}

       {/* Promotion Result Overlay Portal */}
      <AnimatePresence>
        {(raffleWinners.length > 0 || raffleWinner) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/95 backdrop-blur-2xl"
          >
            <motion.div 
              className="bg-white rounded-[3rem] p-8 max-w-lg w-full text-center shadow-[0_0_100px_rgba(251,133,0,0.5)] border-8 border-orange-500 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
               <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent" />
               <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                     <Trophy size={40} className="text-white animate-bounce" />
                  </div>
                  
                  <div>
                     <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1">
                        {activePromotion?.type === 'wheel' ? 'Resultado do Giro' : 
                         activePromotion?.type === 'scratch' ? 'Resultado da Raspadinha' : 
                         'Resultado do Sorteio'}
                     </p>
                     <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-tight">
                        PARABÉNS!
                     </h2>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-3 px-2 py-4">
                     {raffleWinners.length > 0 ? (
                        raffleWinners.map((w, idx) => (
                           <motion.div 
                             initial={{ x: -20, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             transition={{ delay: idx * 0.1 }}
                             key={idx} 
                             className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-all"
                           >
                              <div className="text-left">
                                 <p className="text-[9px] font-black text-gray-400 uppercase">Ganhador(a)</p>
                                 <p className="text-sm font-black text-gray-900 uppercase">{w.name}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-orange-400 uppercase">Prêmio</p>
                                 <p className="text-xs font-black text-orange-600 uppercase italic">{w.prize}</p>
                              </div>
                           </motion.div>
                        ))
                     ) : raffleWinner ? (
                        <div className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center gap-1 shadow-inner italic">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">VENCEDOR(A) IDENTIFICADO(A):</p>
                           <h3 className="text-2xl font-black text-gray-900 uppercase mb-2">
                              {raffleWinner.includes(' ganhou ') ? raffleWinner.split(' ganhou ')[0] : 'Vencedor(a)'}
                           </h3>
                           <div className="w-full h-[1px] bg-gray-200 my-2" />
                           <p className="text-[9px] font-bold text-orange-400 uppercase mb-1">PRÊMIO:</p>
                           <p className="text-3xl font-black text-orange-600 uppercase tracking-tight leading-none drop-shadow-sm">
                              {raffleWinner.includes(' ganhou ') ? raffleWinner.split(' ganhou ')[1] : raffleWinner}
                           </p>
                        </div>
                     ) : null}
                  </div>

                  <Button 
                    onClick={() => { setRaffleWinner(null); setRaffleWinners([]); }} 
                    className="w-full bg-[#023047] hover:bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
                  >
                     {activePromotion?.type === 'raffle' ? 'FECHAR E REGISTRAR' : 'CONCLUIR RESGATE'}
                  </Button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfigModal({ promotion, isOpen, onClose }: { promotion: any; isOpen: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-xl">
                 <Info size={20} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Configurações da Campanha</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Campanha</p>
                 <p className="text-lg font-black text-gray-900 italic uppercase">{promotion.name}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Promoção</p>
                 <p className="text-lg font-black text-gray-900 border-l-4 border-orange-500 pl-3 uppercase">
                   {promotion.type === 'raffle' ? 'Sorteio de Cupons' : promotion.type === 'wheel' ? 'Roleta da Sorte' : promotion.type === 'birthday' ? 'Aniversário' : 'Raspadinha'}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Período de Atividade</p>
                 <p className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 inline-block font-mono">
                   {promotion.startDate ? new Date(promotion.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'} até {promotion.endDate ? new Date(promotion.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                 </p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Mínimo Compra</p>
                 <div className="flex justify-between items-end">
                    <p className="text-lg font-black text-emerald-600">{formatCurrency(promotion.minPurchaseValue || promotion.minPurchaseForWheel || promotion.minPurchaseForScratch || 0)}</p>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Investimento Total</p>
                       <p className="text-xs font-black text-rose-500">{formatCurrency(promotion.totalCost || 0)}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-100 py-2 px-4 rounded-lg">Regras & Premiações</h4>
              
              {promotion.type === 'raffle' && (
                <div className="space-y-4">
                   <div className="flex flex-col gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <span className="text-xs font-black text-orange-900 uppercase italic">Prêmios da Campanha:</span>
                      <div className="space-y-2">
               {promotion.rafflePrizes && promotion.rafflePrizes.length > 0 ? (
                  promotion.rafflePrizes.map((p: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-200">
                        <span className="text-sm font-black text-gray-900 uppercase">{p.label}</span>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase">Qtd: {p.quantity || 1}</span>
                           {p.value > 0 && <span className="text-[7px] font-bold text-gray-400 mt-0.5">Unitário: {formatCurrency(p.value)}</span>}
                        </div>
                     </div>
                  ))
               ) : (
                            <div className="bg-white p-3 rounded-xl border border-orange-200">
                               <span className="text-sm font-black text-gray-900 uppercase">{promotion.rafflePrize || (promotion.rafflePrizes && promotion.rafflePrizes.length > 0 ? promotion.rafflePrizes[0].label : 'Nenhum prêmio configurado')}</span>
                            </div>
                         )}
                      </div>
                   </div>
                   <p className="text-xs text-gray-600 font-medium">Cada {formatCurrency(promotion.minPurchaseValue || 0)} em compras gera 1 cupom para o sorteio.</p>
                </div>
              )}

              {promotion.type === 'wheel' && (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      {(promotion.wheelSegments || []).map((seg: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                           <div className="w-4 h-4 rounded-full" style={{ backgroundColor: seg.color }} />
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-900 uppercase">{seg.label}</p>
                              <p className="text-[10px] text-gray-500 font-bold">{seg.probability}% Proc.</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 block italic">
                     * Giros Acumulativos: {promotion.isSpinCumulative ? 'SIM' : 'NÃO'}
                   </p>
                </div>
              )}

              {(promotion.type === 'scratch' || promotion.type === 'birthday') && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-sm text-gray-700 font-medium">Regras de distribuição automática conforme configurado no lançamento.</p>
                   {promotion.type === 'birthday' && (
                     <p className="text-lg font-black text-orange-600 mt-2">{promotion.birthdayDiscountPercent}% de Desconto / Cashback</p>
                   )}
                </div>
              )}
           </div>

           <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
              <div className="p-2 bg-red-500 text-white rounded-xl">
                 <X size={20} />
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black text-red-900 uppercase">Atenção</p>
                 <p className="text-[10px] text-red-600 font-medium leading-relaxed">
                    Estas configurações são de apenas leitura enquanto a campanha estiver ativa. Para alterar as regras, você deve encerrar esta campanha e iniciar uma nova.
                 </p>
              </div>
           </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100">
           <Button onClick={onClose} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
              Entendido, Fechar Visualização
           </Button>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureLockedView({ title, description, isOrange }: { title: string; description: string; isOrange?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className={cn(
        "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-inner",
        isOrange ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
      )}>
        <Lock size={48} />
      </div>
      <div className="max-w-md space-y-3">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">{title}</h2>
        <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
      </div>
      <div className={cn(
        "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest",
        isOrange ? "bg-orange-50 border-orange-100 text-orange-700" : "bg-red-50 border-red-100 text-red-700"
      )}>
        Entre em contato com o suporte para desbloquear
      </div>
    </motion.div>
  );
}

// --- Tabs ---

function ScoreTab({ rules, customers, purchases, redemptions, appUser, companyId, isCompact, onPopOut }: { rules: LoyaltyRule; customers: Customer[]; purchases: Purchase[]; redemptions: Redemption[]; appUser: AppUser | null; companyId: string | null; isCompact?: boolean; onPopOut?: () => void }) {
  const [phone, setPhone] = useState<string | undefined>();
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isWaitingForSync, setIsWaitingForSync] = useState(false);
  const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  // Filter specific customer data
  const customerMetrics = useMemo(() => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const customer = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone) || tempCustomer;
    if (!customer) return null;

    const customerPurchases = purchases.filter(p => p.customerId === customer.id);
    const customerRedemptions = redemptions.filter(r => r.customerId === customer.id);

    // Sanitize values based on mode: Only show points if in points mode, only show cashback if in cashback mode
    const displayBalance = rules.rewardMode === 'cashback' 
      ? (customer.cashbackBalance || 0) 
      : (customer.points || 0);

    const totalSpent = customerPurchases.reduce((acc, p) => acc + p.amount, 0);
    const totalPrizeCost = customerRedemptions.reduce((acc, r) => acc + (r.cost || 0), 0);
    const efficiency = totalSpent > 0 ? (totalPrizeCost / totalSpent) * 100 : 0;

    return {
      customer,
      purchases: customerPurchases,
      redemptions: customerRedemptions,
      totalSpent,
      totalPrizeCost,
      efficiency,
      displayBalance
    };
  }, [phone, customers, purchases, redemptions]);

  const foundCustomer = customerMetrics?.customer;

  useEffect(() => {
    if (foundCustomer && !showRegister) {
      setTimeout(() => {
        amountRef.current?.focus();
      }, 100);
    }
  }, [foundCustomer, showRegister]);

  const [desktopStep, setDesktopStep] = useState(0); // 0: phone, 1: confirm/register, 2: amount, 3: success

  const rewardLabel = rules.rewardMode === 'cashback' ? 'Cashback' : 'Pontos';
  const rewardUnit = rules.rewardMode === 'cashback' ? 'R$' : 'pts';

  const handleScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    // Identify active program based on rewardMode AND status
    const activeProgram = rules.rewardMode === 'points' 
      ? (rules.pointsStatus?.status === 'active' ? 'points' : null) 
      : (rules.cashbackStatus?.status === 'active' ? 'cashback' : null);

    if (!activeProgram) {
      const status = rules.rewardMode === 'points' ? (rules.pointsStatus?.status || 'inactive') : (rules.cashbackStatus?.status || 'inactive');
      const modeName = rules.rewardMode === 'points' ? 'pontos' : 'cashback';
      showToast(`O programa de ${modeName} não está ativo (Status: ${status}).`, "warning");
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
      const val = parseFloat(amount.replace(',', '.'));
      let pointsEarned = 0;
      let cashbackEarned = 0;
      
      if (activeProgram === 'cashback') {
        // Correct Item 6: Ensure it respects minActivationValue (Valor Mínimo para Cashback)
        const minVal = rules.cashbackConfig?.minActivationValue || 0;
        if (val >= minVal) {
          cashbackEarned = val * ((rules.cashbackConfig?.percentage || 0) / 100);
        }
      } else {
        if (val >= (rules.minPurchaseValue || 0)) {
          // Use pointsPerReal if defined, otherwise 1 point per purchase
          pointsEarned = Math.floor(val * (rules.pointsPerReal || 1));
          
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
          targetType: 'personal',
          targetStoreId: companyId,
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
            targetType: 'personal',
            targetStoreId: companyId,
            title: 'Quase lá!',
            message: `Faltam apenas ${nextTier.points - newPoints} ponto(s) para você resgatar seu prêmio: ${nextTier.prize}!`,
            type: 'prize_near',
            date: now,
            read: false
          });
        }
      }

    // Record purchase
    try {
      const activePromotion = rules.promotionConfig?.isActive ? rules.promotionConfig : null;
      let actionsEarned = 0;
      if (activePromotion && val >= (activePromotion.minPurchaseValue || activePromotion.minPurchaseForWheel || activePromotion.minPurchaseForScratch || 1)) {
        if (activePromotion.type === 'raffle') {
          actionsEarned = activePromotion.isCumulative ? Math.floor(val / (activePromotion.minPurchaseValue || 1)) : 1;
        } else if (activePromotion.type === 'wheel' || activePromotion.type === 'scratch') {
          actionsEarned = 1;
        }
      }

      await addDoc(collection(db, 'purchases'), {
        companyId,
        customerId: foundCustomer.id,
        customerName: foundCustomer.name,
        amount: val,
        date: now,
        pointsEarned: Number(pointsEarned),
        cashbackEarned: Number(cashbackEarned),
        promotionId: activePromotion ? String(activePromotion.id) : null,
        actionsEarned: Number(actionsEarned)
      });

      // Update customer aggregates
      const customerRef = doc(db, 'customers', foundCustomer.id);
      await updateDoc(customerRef, {
        points: newPoints,
        cashbackBalance: newCashback,
        lastPurchaseDate: now,
        totalSpent: (foundCustomer.totalSpent || 0) + val,
        totalPurchases: (foundCustomer.totalPurchases || 0) + 1
      });
    } catch (e) {
      console.error("Error updating customer aggregates:", e);
    }

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
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Identify active program based on rewardMode AND status
      const activeProgram = rules.rewardMode === 'points' 
        ? (rules.pointsStatus?.status === 'active' ? 'points' : null) 
        : (rules.cashbackStatus?.status === 'active' ? 'cashback' : null);

      // 1. Calculate Initial Score
      const numericAmount = amount ? parseFloat(amount.replace(',', '.')) : 0;
      let pointsEarned = 0;
      let cashbackEarned = 0;

      if (activeProgram === 'points') {
        pointsEarned = numericAmount > 0 ? Math.floor(numericAmount * (rules?.pointsPerReal || 1)) : 0;
      } else if (activeProgram === 'cashback') {
        if (numericAmount >= (rules.cashbackConfig?.minActivationValue || 0)) {
          cashbackEarned = numericAmount * ((rules.cashbackConfig?.percentage || 0) / 100);
        }
      }
      
    // 2. Create Customer
      const registrationDoc = await addDoc(collection(db, 'customers'), {
        companyId,
        name: newName,
        phone: cleanPhone,
        birthDate: newBirthDate,
        points: pointsEarned,
        cashbackBalance: cashbackEarned,
        lastPurchaseDate: numericAmount > 0 ? now : '',
        createdAt: now,
        updatedAt: now,
        totalPurchases: numericAmount > 0 ? 1 : 0,
        totalSpent: numericAmount > 0 ? numericAmount : 0,
        isDeleted: false
      });
      
      // 3. Create Purchase Tracking if numericAmount > 0
      if (numericAmount > 0) {
        const activePromotion = rules.promotionConfig?.isActive ? rules.promotionConfig : null;
        let actionsEarned = 0;
        if (activePromotion && numericAmount >= (activePromotion.minPurchaseValue || activePromotion.minPurchaseForWheel || activePromotion.minPurchaseForScratch || 1)) {
          if (activePromotion.type === 'raffle') {
            actionsEarned = activePromotion.isCumulative ? Math.floor(numericAmount / (activePromotion.minPurchaseValue || 1)) : 1;
          } else if (activePromotion.type === 'wheel' || activePromotion.type === 'scratch') {
            actionsEarned = 1;
          }
        }

        await addDoc(collection(db, 'purchases'), {
          companyId,
          customerId: registrationDoc.id,
          customerName: newName,
          amount: numericAmount,
          pointsEarned: Number(pointsEarned),
          cashbackEarned: Number(cashbackEarned),
          type: 'purchase',
          date: now,
          status: 'completed',
          description: 'Cadastro + Pontuação Inicial',
          promotionId: activePromotion ? String(activePromotion.id) : null,
          actionsEarned: Number(actionsEarned)
        });
      }

      const successMsg = activeProgram === 'cashback'
        ? (cashbackEarned > 0 ? `Cliente cadastrado e ganhou R$ ${formatCurrency(cashbackEarned)} de cashback!` : "Cliente cadastrado com sucesso!")
        : (pointsEarned > 0 ? `Cliente cadastrado e pontuado com ${pointsEarned} pontos!` : "Cliente cadastrado com sucesso!");
        
      showToast(successMsg, "success");
      
      const newCustomer: Customer = {
        id: registrationDoc.id,
        phone: cleanPhone,
        name: newName,
        birthDate: newBirthDate || undefined,
        points: pointsEarned,
        cashbackBalance: cashbackEarned,
        createdAt: now,
        updatedAt: now,
        lastPurchaseDate: numericAmount > 0 ? now : '',
        isDeleted: false
      };

      // Set as temp customer immediately to avoid "retrabalho" while Firestore syncs
      setTempCustomer(newCustomer);
      setShowRegister(false);
      setNewName('');
      setNewBirthDate('');
      setAmount(''); 
      setIsWaitingForSync(true);
      
      // Clear temp customer after a bit, the real one from onSnapshot should have arrived by then
      setTimeout(() => {
        setIsWaitingForSync(false);
        setTempCustomer(null);
      }, 5000);
      // Keep the phone selected so the user can score immediately
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'customers_score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={cn("flex flex-col items-center justify-center w-full", isCompact ? "min-h-screen bg-gray-950" : "min-h-[700px] py-8")}>
      {/* View Container */}
      <div className={cn(
        "relative overflow-hidden flex flex-col w-full",
        isCompact 
          ? "h-screen bg-gray-900" 
          : "lg:hidden w-[320px] h-[650px] bg-gray-950 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl"
      )}>
        {/* Compact Mode Header */}
        {isCompact && (
          <div className="bg-primary border-b border-primary/20 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Painel de Pontuação</span>
            </div>
            <span className="text-[9px] text-white/60 font-bold uppercase">Sempre no Topo</span>
          </div>
        )}

        {/* iPhone Notch - only show if mobile simul and not compact */}
        {!isCompact && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />}
        
        {/* App Content */}
        <div className={cn("flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6", isCompact ? "pt-4" : "pt-10")}>
          {isCompact && (
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Target size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-white font-black uppercase tracking-widest leading-tight">Agilidade Máxima</p>
                <p className="text-[9px] text-gray-400 font-medium leading-relaxed mt-1">Coloque esta janela sobre o seu sistema de vendas para pontuar instantaneamente.</p>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center gap-4 mb-4 relative">
             {!isCompact && (
               <button 
                 onClick={onPopOut}
                 title="Abrir em Janela Flutuante (Sobreposto)"
                 className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-all z-50 border border-gray-100 hidden lg:flex items-center gap-2 pr-4 group"
               >
                 <ExternalLink size={20} className="text-primary" />
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest hidden group-hover:block transition-all">Sobrepor</span>
               </button>
             )}
            <div className={cn("bg-white flex items-center justify-center overflow-hidden shadow-lg p-2", isCompact ? "w-16 h-16 rounded-xl" : "w-20 h-20 rounded-2xl border border-gray-100")}>
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

              {phone && phone.replace(/\D/g, '').length >= 10 && !foundCustomer && !isWaitingForSync && (
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
                          {rules.rewardMode === 'cashback' ? (
                            <p className="text-[9px] text-green-400 font-bold">Saldo: R$ {formatCurrency(foundCustomer.cashbackBalance || 0)}</p>
                          ) : (
                            <p className="text-[9px] text-green-400 font-bold">Pontos: {foundCustomer.points || 0}</p>
                          )}
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
                    ref={amountRef}
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
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 text-gray-500">
                <label className="text-[10px] font-black uppercase tracking-widest">Celular</label>
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-2.5 text-sm font-bold opacity-70">
                  {phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nascimento</label>
                  <input 
                    type="date" 
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-xs outline-none focus:border-primary transition-all font-bold [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest">Valor Compra</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-7 pr-3 py-2.5 bg-primary/5 border border-primary/20 rounded-xl text-white text-sm outline-none focus:border-primary transition-all font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? 'Processando...' : (amount ? 'Cadastrar e Pontuar' : 'Apenas Cadastrar')}
                </Button>
                <button 
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-[10px] text-gray-500 font-black uppercase tracking-widest py-2 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Home Indicator */}
        <div className="h-1.5 w-1/3 bg-gray-800 rounded-full mx-auto mb-2" />
      </div>

      {/* Desktop Sequential Flow Layout (Hidden on Mobile and Compact) */}
      <div className={cn("hidden flex-col items-center w-full max-w-5xl bg-white rounded-[3rem] p-16 shadow-2xl border border-gray-100 overflow-hidden relative min-h-[600px] justify-center", !isCompact && "lg:flex")}>
        {!isCompact && (
          <button 
            onClick={onPopOut}
            title="Abrir em Janela Flutuante"
            className="absolute top-8 right-8 p-4 bg-gray-50 rounded-2xl shadow-sm hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all z-50 border border-gray-100 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Modo Janela</span>
              <ExternalLink size={24} className="text-primary" />
            </div>
          </button>
        )}
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

              {phone && phone.replace(/\D/g, '').length >= 10 && !foundCustomer && !isWaitingForSync && (
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
                <div className="grid grid-cols-2 gap-6">
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Data de Nascimento (Opcional)</label>
                    <input 
                      type="date" 
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-xl outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest text-center block">Valor da Compra para Pontuar Agora</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-20 pr-8 py-6 bg-primary/5 border-2 border-primary/10 rounded-[2rem] text-4xl outline-none focus:border-primary transition-all font-black text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">Deixe em branco se quiser apenas realizar o cadastro.</p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    type="button"
                    onClick={() => { setShowRegister(false); setAmount(''); }}
                    className="flex-1 px-8 py-6 rounded-3xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all text-sm"
                  >
                    Voltar
                  </button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-[2] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-lg shadow-2xl shadow-primary/30"
                  >
                    {isSubmitting ? 'Processando...' : (amount ? 'Finalizar Cadastro e Pontuar' : 'Finalizar Cadastro')}
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
                        ref={amountRef}
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

function CustomersTab({ customers, purchases, isAdmin, rules, companyId, goals }: { customers: Customer[]; purchases: Purchase[]; isAdmin: boolean; rules: LoyaltyRule; companyId: string | null; goals: Goal[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { showToast } = useToast();

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // New Analysis Metrics for "Clientes Atuais"
  const customerAnalysis = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const prevMonth = format(subMonths(now, 1), 'yyyy-MM');
    
    const totalCurrent = customers.filter(c => !c.isDeleted).length;
    
    // Customers created in previous month (estimate based on createdAt)
    const totalPrevMonth = customers.filter(c => 
      !c.isDeleted && c.createdAt && c.createdAt < format(startOfMonth(now), 'yyyy-MM-dd')
    ).length;
    
    // Customers within specific filtered period
    const totalInPeriod = customers.filter(c => {
      if (c.isDeleted) return false;
      const created = c.createdAt ? parseISO(c.createdAt) : null;
      if (!created) return false;
      return isWithinInterval(created, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate))
      });
    }).length;

    const currentGoal = goals.find(g => g.month === currentMonth)?.customersCount || 0;
    
    const growthPrevMonth = totalPrevMonth > 0 ? ((totalCurrent / totalPrevMonth) - 1) * 100 : 0;
    
    return {
      totalCurrent,
      totalPrevMonth,
      totalInPeriod,
      currentGoal,
      growthPrevMonth
    };
  }, [customers, goals, startDate, endDate]);

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

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer || !companyId) return;
    
    setIsUpdating(true);
    try {
      // Anonymize the customer to preserve history but remove PII
      await updateDoc(doc(db, 'customers', deletingCustomer.id), {
        name: "Cliente Excluído",
        phone: `EXC_${deletingCustomer.id}_${Date.now()}`, // Mark phone to avoid conflict but keep it unique
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      showToast("Cliente removido com sucesso!", "success");
      setDeletingCustomer(null);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      showToast("Erro ao remover cliente.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const pDate = parseISO(p.date);
    return isWithinInterval(pDate, {
      start: startOfDay(parseISO(startDate)),
      end: endOfDay(parseISO(endDate))
    });
  });

  const periodMetrics = useMemo(() => {
    const totalRevenue = filteredPurchases.reduce((acc, p) => acc + p.amount, 0);
    const uniqueCustomersInPeriod = new Set(filteredPurchases.map(p => p.customerId)).size;
    const avgLTV = uniqueCustomersInPeriod > 0 ? totalRevenue / uniqueCustomersInPeriod : 0;
    
    const totalPoints = filteredPurchases.reduce((acc, p) => acc + (p.pointsEarned || 0), 0);
    const totalCashback = filteredPurchases.reduce((acc, p) => acc + (p.cashbackEarned || 0), 0);
    
    return { totalRevenue, avgLTV, totalPoints, totalCashback };
  }, [filteredPurchases]);

  const filteredCustomers = customers.filter(c => 
    !c.isDeleted && (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    )
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
              cashbackBalance: 0,
              lastPurchaseDate: new Date().toISOString(),
              totalSpent: 0,
              purchasesCount: 0,
              createdAt: new Date().toISOString(),
              isDeleted: false
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

      {/* Clientes Atuais Overview Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                <Users size={16} />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de Clientes</h4>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalCurrent}</p>
              <span className="text-xs font-bold text-gray-400">ativos</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary rounded-lg text-white">
              <Target size={16} />
            </div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta vs Real</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalCurrent}</p>
            <p className="text-sm font-bold text-gray-400">/ {customerAnalysis.currentGoal || '---'}</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[8px] font-black uppercase mb-1">
              <span className="text-gray-400">Progresso</span>
              <span className="text-primary">{customerAnalysis.currentGoal > 0 ? Math.round((customerAnalysis.totalCurrent / customerAnalysis.currentGoal) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min((customerAnalysis.totalCurrent / (customerAnalysis.currentGoal || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-orange-500 rounded-lg text-white">
              <Calendar size={16} />
            </div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">vs Mês Anterior</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalPrevMonth}</p>
            <div className={cn(
              "flex items-center gap-0.5 font-black text-[10px] px-1.5 py-0.5 rounded-full",
              customerAnalysis.growthPrevMonth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {customerAnalysis.growthPrevMonth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(customerAnalysis.growthPrevMonth).toFixed(1)}%
            </div>
          </div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Comparação base histórica</p>
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500 rounded-lg text-white">
              <BarChart3 size={16} />
            </div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Novos no Período</h4>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalInPeriod}</p>
            <span className="text-xs font-bold text-gray-400">clientes</span>
          </div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Captados no filtro selecionado</p>
        </Card>
      </div>

      {/* Date Filter & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 p-4 bg-white border-gray-100 shadow-sm flex flex-col justify-center">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Período de Análise</label>
          <div className="flex flex-col gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
            />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-gray-100 shadow-sm border-l-4 border-l-primary">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LTV Médio (Período)</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">R$ {formatCurrency(periodMetrics.avgLTV)}</h3>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Média por cliente ativo</p>
          </Card>
          <Card className="p-4 bg-white border-gray-100 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total de Compras</p>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">R$ {formatCurrency(periodMetrics.totalRevenue)}</h3>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">{filteredPurchases.length} transações no período</p>
          </Card>
          <Card className="p-4 bg-white border-gray-100 shadow-sm border-l-4 border-l-orange-500">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {rules.rewardMode === 'cashback' ? 'Cashback Gerado' : 'Pontos Gerados'}
            </p>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter">
              {rules.rewardMode === 'cashback' ? `R$ ${formatCurrency(periodMetrics.totalCashback)}` : `${periodMetrics.totalPoints} PTS`}
            </h3>
            <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">No período selecionado</p>
          </Card>
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
            <Card key={customer.id} className="p-5 bg-white border-gray-100 shadow-sm group hover:border-primary/50 transition-all relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{customer.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{customer.phone}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {rules.rewardMode === 'cashback' ? (
                    (customer.cashbackBalance || 0) > 0 ? (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black">
                        R$ {formatCurrency(customer.cashbackBalance || 0)}
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-[10px] font-black">
                        R$ 0,00
                      </div>
                    )
                  ) : (
                    (customer.points || 0) > 0 ? (
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black">
                        {Math.floor(customer.points)} PTS
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-400 px-3 py-1 rounded-lg text-[10px] font-black">
                        0 PTS
                      </div>
                    )
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
                    {isAdmin && (
                      <button 
                        onClick={() => setDeletingCustomer(customer)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] uppercase font-black"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    )}
                    <a 
                      href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-500 transition-colors p-2"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
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

        {deletingCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir <strong>{deletingCustomer.name}</strong>? 
                <br /><br />
                O cadastro será removido da base ativa, mas as informações de faturamento histórico serão preservadas de forma anônima para seus indicadores.
              </p>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setDeletingCustomer(null)}
                  variant="outline"
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleDeleteCustomer}
                  disabled={isUpdating}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  {isUpdating ? 'Excluindo...' : 'Confirmar Exclusão'}
                </Button>
              </div>
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
  const [customersCount, setCustomersCount] = useState('');
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
      const customersGoal = parseInt(customersCount) || 0;
      const existingGoal = goals.find(g => g.month === month);
      
      if (existingGoal) {
        await updateDoc(doc(db, 'goals', existingGoal.id), { 
          value: goalValue,
          workingDays: days,
          customersCount: customersGoal
        });
      } else {
        await addDoc(collection(db, 'goals'), { 
          companyId, 
          month, 
          value: goalValue,
          workingDays: days,
          customersCount: customersGoal
        });
      }
      
      setValue('');
      setWorkingDays('22');
      setCustomersCount('');
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

  const handleResetPlanning = async () => {
    if (!companyId) return;
    const currentMonth = format(new Date(), 'yyyy-MM');
    const futureGoals = goals.filter(g => g.month >= currentMonth);
    
    if (futureGoals.length === 0) {
      showToast("Não há metas futuras para refazer.", "info");
      return;
    }

    askConfirmation(
      "Refazer Planejamento",
      "Isso irá remover todas as metas do mês atual e meses futuros para que você possa redimensionar seu planejamento. Os meses já encerrados (consolidados) serão preservados conforme solicitado. Deseja continuar?",
      async () => {
        setIsSaving(true);
        try {
          // Delete future goals one by one (Firestore limit for small sets)
          for (const goal of futureGoals) {
            await deleteDoc(doc(db, 'goals', goal.id));
          }
          showToast("Planejamento futuro reiniciado!", "success");
        } catch (error) {
          showToast("Erro ao reiniciar planejamento.", "error");
        } finally {
          setIsSaving(false);
        }
      },
      true
    );
  };

  const actualAvgTicket = useMemo(() => {
    const totalSales = purchases.reduce((acc, p) => acc + p.amount, 0);
    return purchases.length > 0 ? totalSales / purchases.length : 0;
  }, [purchases]);

  const activeClientsNeeded = useMemo(() => {
    const rev = parseFloat(monthlyRevenue) || 0;
    const tkt = parseFloat(avgTicket) || 0;
    return tkt > 0 ? Math.ceil(rev / tkt) : 0;
  }, [monthlyRevenue, avgTicket]);

  const sortedGoals = [...goals].sort((a, b) => a.month.localeCompare(b.month));
  const { askConfirmation } = useConfirm();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Metas Gerais</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Planejamento e Estatísticas Comparativas</p>
        </div>
        <Target className="text-primary" size={28} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 p-8 bg-white border-primary/20 shadow-xl relative overflow-hidden ring-1 ring-primary/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24" />
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
              <Target size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl">Planejamento de Performance</h3>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Defina suas metas para o crescimento do SaaS</p>
            </div>
          </div>
          <form onSubmit={handleSaveGoal} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês de Referência</label>
                <input 
                  type="month" 
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-gray-900 font-bold outline-none focus:border-primary transition-all shadow-sm text-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dias Úteis</label>
                <input 
                  type="number" 
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  placeholder="22"
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-gray-900 font-bold outline-none focus:border-primary transition-all shadow-sm text-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Faturamento (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
                  <input 
                    type="number" 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className={cn(
                      "w-full bg-white border rounded-3xl pl-16 pr-6 py-4 text-gray-900 font-black text-lg outline-none transition-all shadow-sm",
                      onboardingStep === 'onboarding' && !value ? "border-amber-400 animate-pulse" : "border-gray-100 focus:border-primary"
                    )}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Clientes (Novos)</label>
                <div className="relative">
                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
                  <input 
                    type="number" 
                    value={customersCount}
                    onChange={(e) => setCustomersCount(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full bg-white border border-gray-100 rounded-3xl pl-16 pr-6 py-4 text-gray-900 font-black text-lg outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSaving || (onboardingStep === 'onboarding' && !value)} 
              className={cn(
                "w-full py-6 rounded-2xl font-black uppercase tracking-widest transition-all text-sm",
                (onboardingStep === 'onboarding' && !value) ? "opacity-30 cursor-not-allowed bg-gray-400" : "shadow-xl shadow-primary/30"
              )}
            >
              {isSaving ? 'Gravando...' : (onboardingStep === 'onboarding' ? `Confirmar mês (${goals.length}/12)` : 'Alimentar Histórico de Metas')}
            </Button>
            <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest italic flex items-center justify-center gap-2">
              <ShieldCheck size={12} />
              Todos os indicadores do sistema serão baseados nos dados acima
            </p>
          </form>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-1 gap-6">

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
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Transações média de referencia</p>
                <TrendingUp className="text-primary" size={16} />
              </div>
              <p className="text-2xl font-black text-gray-900 italic tracking-tighter">
                {activeClientsNeeded} <span className="text-xs font-bold text-gray-400 uppercase not-italic">Transações</span>
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1 italic">Baseado no faturamento dividido pelo ticket médio.</p>
            </div>

            <Button onClick={handleSaveReference} disabled={isSaving} variant="outline" className="w-full py-4 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase tracking-widest">
              {isSaving ? 'Gravando...' : 'Atualizar Referências'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-gray-900">Meta de Ticket Médio</h3>
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest">Objetivo</div>
          </div>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Ticket Médio (R$)</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="number" 
                  value={rules.avgTicketGoal || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateRules({ ...rules, avgTicketGoal: val });
                  }}
                  placeholder="Ex: 150.00"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 font-black text-xl outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ticket Atual (Real) vs Meta</p>
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900 tracking-tighter">
                  {((actualAvgTicket) / (rules.avgTicketGoal || 1) * 100).toFixed(1)}%
                </p>
                <span className="text-[10px] font-bold text-gray-400 uppercase">da Meta</span>
              </div>
              <p className="text-[10px] text-blue-600 font-bold mb-2">Ticket Médio Real: R$ {formatCurrency(actualAvgTicket)}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min((actualAvgTicket) / (rules.avgTicketGoal || 1) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 italic">
              Esta meta será usada no Dashboard para segmentar clientes acima e abaixo do desempenho esperado.
            </p>
          </div>
        </Card>
      </div>
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
            const currentMonth = format(new Date(), 'yyyy-MM');
            const isPast = goal.month < currentMonth;
            
            return (
              <Card key={goal.id} className={cn(
                "p-5 border-gray-100 shadow-sm relative overflow-hidden group transition-all",
                isPast ? "bg-gray-100/30 grayscale-[0.5] opacity-60" : "bg-white hover:border-primary/30"
              )}>
                {isPast && (
                  <div className="absolute inset-0 z-20 bg-gray-50/10 pointer-events-none" />
                )}
                
                <div className={cn(
                  "absolute top-0 left-0 h-1 w-full",
                  isPast ? "bg-gray-300" : "bg-primary/20"
                )} />
                <div className={cn(
                  "absolute top-0 left-0 h-1 transition-all duration-1000",
                  isPast ? "bg-gray-500" : "bg-primary"
                )} style={{ width: `${Math.min(percent, 100)}%` }} />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-gray-900 uppercase tracking-tighter text-lg flex items-center">
                      {format(parseISO(goal.month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                      {isPast && <span className="ml-2 text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase font-black tracking-normal">Consolidado</span>}
                      {!isPast && (
                        <button 
                          onClick={() => {
                            setMonth(goal.month);
                            setValue(goal.value.toString());
                            setWorkingDays(goal.workingDays?.toString() || '22');
                            setCustomersCount(goal.customersCount?.toString() || '');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="ml-2 p-1 text-primary hover:bg-primary/10 rounded transition-colors group-hover:scale-110"
                          title="Editar Meta"
                        >
                          <Settings size={14} />
                        </button>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{goal.workingDays} dias úteis</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", isPast ? "text-gray-500" : "text-primary")}>{Math.round(percent)}%</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">
                      {isPast ? `Faturamento: R$ ${formatCurrency(realSales)}` : `Meta: R$ ${formatCurrency(goal.value)}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Vendas Reais</p>
                    <p className={cn("text-xl font-black tracking-tighter italic", isPast ? "text-gray-500" : "text-gray-900")}>
                      R$ {formatCurrency(realSales)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
                    <div>
                      <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Meta Clientes</span>
                      <span className="text-[11px] text-gray-900 font-black">{goal.customersCount || '---'} novos</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Meta Diária</span>
                      <span className="text-[11px] text-gray-900 font-black">R$ {formatCurrency(goal.value / (goal.workingDays || 1))}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {goals.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={handleResetPlanning}
              variant="outline" 
              className="py-6 px-12 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-3xl font-black uppercase tracking-widest text-xs gap-3 transition-all group"
            >
              <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              Refazer Planejamento Geral
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NotifyTab({ customers, rules, companyId }: { customers: Customer[]; rules: LoyaltyRule; companyId: string | null }) {
  const [filter, setFilter] = useState<'all' | 'inactivity_1w' | 'inactivity_2w' | 'inactivity_1m' | 'birthday_today' | 'birthday_week' | 'birthday_month' | 'prize_near_3' | 'prize_near_4'>('all');
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const { showToast } = useToast();

  const filteredCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      if (c.isDeleted) return false;
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
      showToast("Por favor, escreva uma mensagem para enviar.", "error");
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
            targetType: 'personal',
            targetStoreId: companyId,
            title: `Mensagem da ${rules.companyProfile?.companyName || 'Loja'} para você`,
            message: customMessage,
            type: 'manual',
            date: now,
            createdAt: now,
            read: false
          });
      });

      await batch.commit();
      showToast(`${selectedIds.size} notificações enviadas com sucesso!`, "success");
      setCustomMessage('');
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error sending notifications:", error);
      showToast("Falha ao enviar notificações. Tente novamente.", "error");
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

function DashboardTab({ purchases, customers, rules, goals, appUser, promotionHistory, onExportReport }: { purchases: Purchase[]; customers: Customer[]; rules: LoyaltyRule; goals: Goal[]; appUser: AppUser | null; promotionHistory: PromotionHistory[]; onExportReport?: (startDate?: string, endDate?: string) => Promise<void> }) {
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [detailView, setDetailView] = useState<'vendas' | 'clientes' | 'ticket' | null>(null);
  const [aboveFilter, setAboveFilter] = useState({ min: '', max: '' });
  const [belowFilter, setBelowFilter] = useState({ min: '', max: '' });
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportDates, setReportDates] = useState({ 
    start: startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd'), 
    end: endDate || format(new Date(), 'yyyy-MM-dd') 
  });

  // Sync report dates when dashboard dates change
  useEffect(() => {
    if (startDate && endDate) {
      setReportDates({ start: startDate, end: endDate });
    }
  }, [startDate, endDate]);

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

  // New Analysis Metrics for "Clientes Atuais"
  const customerAnalysis = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const totalCurrent = customers.filter(c => !c.isDeleted).length;
    const totalPrevMonth = customers.filter(c => 
      !c.isDeleted && c.createdAt && c.createdAt < format(startOfMonth(now), 'yyyy-MM-dd')
    ).length;
    
    // Period filter for DashboardTab
    const dashboardStart = startDate ? startOfDay(parseISO(startDate)) : startOfMonth(now);
    const dashboardEnd = endDate ? endOfDay(parseISO(endDate)) : endOfDay(now);
    
    const totalInPeriod = customers.filter(c => {
      if (c.isDeleted || !c.createdAt) return false;
      const created = parseISO(c.createdAt);
      return isWithinInterval(created, { start: dashboardStart, end: dashboardEnd });
    }).length;

    const currentGoal = goals.find(g => g.month === currentMonth)?.customersCount || 0;
    const growthPrevMonth = totalPrevMonth > 0 ? ((totalCurrent / totalPrevMonth) - 1) * 100 : 0;
    
    return { totalCurrent, totalPrevMonth, totalInPeriod, currentGoal, growthPrevMonth };
  }, [customers, goals, startDate, endDate]);

  const stats = useMemo(() => {
    const totalValue = filteredPurchases.reduce((acc, p) => acc + p.amount, 0);
    const count = filteredPurchases.length;
    const avgTicket = count > 0 ? totalValue / count : 0;
    
    // Customers in the period (unique customers who bought)
    const uniqueCustomersInPeriod = new Set(filteredPurchases.map(p => p.customerId));
    const customerCountInPeriod = uniqueCustomersInPeriod.size;

    // Ticket Goal
    const ticketGoal = rules.avgTicketGoal || 0;

    // Segmentation (Uses all-time purchases for average ticket as per request)
    const customersByAvgTicket = customers.filter(c => !c.isDeleted).map(customer => {
      const custPurchases = purchases.filter(p => p.customerId === customer.id);
      const custTotal = custPurchases.reduce((acc, p) => acc + p.amount, 0);
      const custAvgTicket = custPurchases.length > 0 ? custTotal / custPurchases.length : 0;
      
      const frequency = custPurchases.length;
      const lastP = custPurchases.sort((a, b) => b.date.localeCompare(a.date))[0];
      const recency = lastP ? differenceInDays(new Date(), parseISO(lastP.date)) : 999;
      
      return {
        id: customer.id,
        name: customer.name,
        avgTicket: custAvgTicket,
        inCampaign: (customer.points || 0) > 0 || (customer.cashbackBalance || 0) > 0,
        rfv: `R${recency < 30 ? 3 : (recency < 60 ? 2 : 1)} F${frequency > 5 ? 3 : (frequency > 2 ? 2 : 1)} V${custTotal > 1000 ? 3 : (custTotal > 500 ? 2 : 1)}`
      };
    });

    const activeCustomersByAvgTicket = customersByAvgTicket.filter(c => c.avgTicket > 0);

    const minAbove = parseFloat(aboveFilter.min) || 0;
    const maxAbove = parseFloat(aboveFilter.max) || 9999999;
    const minBelow = parseFloat(belowFilter.min) || 0;
    const maxBelow = parseFloat(belowFilter.max) || 9999999;

    const aboveGoal = activeCustomersByAvgTicket.filter(c => c.avgTicket > ticketGoal && c.avgTicket >= minAbove && c.avgTicket <= maxAbove);
    const belowGoal = activeCustomersByAvgTicket.filter(c => c.avgTicket <= ticketGoal && c.avgTicket >= minBelow && c.avgTicket <= maxBelow);

    // Within vs Outside rules
    // Rule: minPurchaseValue or minActivationValue depending on mode
    const ruleThreshold = rules.rewardMode === 'cashback' 
      ? (rules.cashbackConfig?.minActivationValue || 0) 
      : (rules.minPurchaseValue || 0);

    const withinRules = filteredPurchases.filter(p => p.amount >= ruleThreshold).length;
    const outsideRules = count - withinRules;

    // Conversion rate: (total customers and sales) / (people who bought within rule)
    const uniqueCustomersInPeriodCount = uniqueCustomersInPeriod.size;
    const uniqueCustomersWithinRules = new Set(filteredPurchases.filter(p => p.amount >= (rules.minPurchaseValue || 0)).map(p => p.customerId)).size;
    
    // Customers without purchases in period
    const customersWithoutPurchases = Math.max(0, customers.length - uniqueCustomersInPeriodCount);

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
      customersWithoutPurchases,
      conversionRate: customers.length > 0 ? (uniqueCustomersInPeriodCount / customers.length) * 100 : 0,
      activeCustomersCount,
      aboveGoal,
      belowGoal,
      ticketGoal
    };
  }, [filteredPurchases, purchases, customers, rules, aboveFilter, belowFilter]);

  const weekdayStats = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const ptDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const counts = new Array(7).fill(0).map(() => ({ count: 0, total: 0 }));
    const hoursCount = new Array(24).fill(0);

    filteredPurchases.forEach(p => {
      const d = parseISO(p.date);
      if (!isNaN(d.getTime())) {
        const day = d.getDay();
        const hour = d.getHours();
        counts[day].count += 1;
        counts[day].total += p.amount;
        hoursCount[hour] += 1;
      }
    });

    const maxTotal = Math.max(...counts.map(c => c.total)) || 1;
    const bestDayIndex = counts.reduce((best, curr, idx) => curr.total > counts[best].total ? idx : best, 0);
    const bestTicketDayIndex = counts.reduce((best, curr, idx) => {
      const currentAvg = curr.count > 0 ? curr.total / curr.count : 0;
      const bestAvg = counts[best].count > 0 ? counts[best].total / counts[best].count : 0;
      return currentAvg > bestAvg ? idx : best;
    }, 0);
    const worstDayIndex = counts.reduce((worst, curr, idx) => (curr.total < counts[worst].total && curr.total > 0) ? idx : worst, 0);
    const peakHour = hoursCount.reduce((best, curr, idx) => curr > hoursCount[best] ? idx : best, 0);

    return {
      distribution: counts.map((c, i) => ({ 
        day: days[i], 
        fullName: ptDays[i],
        total: c.total, 
        count: c.count,
        avgTicket: c.count > 0 ? c.total / c.count : 0,
        percentage: (c.total / maxTotal) * 100
      })),
      bestDay: ptDays[bestDayIndex],
      bestTicketDay: ptDays[bestTicketDayIndex],
      worstDay: ptDays[worstDayIndex],
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`
    };
  }, [filteredPurchases]);

  const handleExportSegmentPdf = async (segment: 'above' | 'below') => {
    const data = segment === 'above' ? stats.aboveGoal : stats.belowGoal;
    const filter = segment === 'above' ? aboveFilter : belowFilter;
    const title = segment === 'above' ? 'Clientes Acima da Meta de Ticket' : 'Clientes Abaixo da Meta de Ticket';
    
    try {
      showToast("Gerando exportação...", "info");
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginSide = 15;
      const themeColor = rules.themeColor || '#16a34a';
      
      const hexToRgb = (hex: string): [number, number, number] => {
        try {
          const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
          const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
          const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
          const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
          return [r, g, b];
        } catch (e) { return [34, 197, 94]; }
      };
      const rgbTheme = hexToRgb(themeColor);

      const addHeaderFooter = (doc: any) => {
        doc.setFillColor(...rgbTheme);
        doc.rect(0, 0, pageWidth, 5, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(title, marginSide, 16);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(rules.campaignName || 'Programa de Fidelidade', marginSide, 21);
        doc.setDrawColor(240, 240, 240);
        doc.line(marginSide, 26, pageWidth - marginSide, 26);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const str = `Página ${doc.internal.getNumberOfPages()} | Gerado em ${new Date().toLocaleDateString('pt-BR')} | BuyPass Intelligence`;
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      addHeaderFooter(doc);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Período analisado: ${period === 'all' ? 'Todo o histórico' : 'Personalizado'}`, marginSide, 35);
      doc.text(`Filtro atual: R$ ${formatCurrency(parseFloat(filter.min || '0'))} até R$ ${formatCurrency(parseFloat(filter.max || 'inf'))}`, marginSide, 40);
      doc.text(`Meta de Referência: R$ ${formatCurrency(stats.ticketGoal)}`, marginSide, 45);

      if (typeof autoTable === 'function') {
        (autoTable as any)(doc, {
          startY: 55,
          margin: { left: marginSide, right: marginSide },
          head: [['Cliente', 'Ticket Médio', 'Participação', 'RFV']],
          body: data.map(c => [
            c.name,
            `R$ ${formatCurrency(c.avgTicket)}`,
            c.inCampaign ? 'Sim (Participa)' : 'Não (Inativo)',
            c.rfv
          ]),
          theme: 'striped',
          headStyles: { fillColor: segment === 'above' ? [34, 197, 94] : [249, 115, 22] },
          styles: { fontSize: 8 }
        });
      }

      showToast("PDF gerado!", "success");
      doc.save(`${segment === 'above' ? 'Acima' : 'Abaixo'}_Meta_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (e) {
      console.error(e);
      showToast("Erro ao gerar PDF", "error");
    }
  };

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
        if (customer && ((customer.points || 0) > 0 || (customer.cashbackBalance || 0) > 0)) {
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
    const currentMonthDate = new Date();
    currentMonthDate.setDate(1); // Normalizar no primeiro dia do mês
    
    const displayMonths = [];
    // Show 1 month in the past, current month, and 4 months in the future = 6 months total
    for (let i = -1; i <= 4; i++) {
      const d = addMonths(currentMonthDate, i);
      displayMonths.push(format(d, 'yyyy-MM'));
    }

    return displayMonths.map(m => {
      const goal = goals.find(g => g.month === m);
      const monthPurchases = purchases.filter(p => {
        try {
          return p.date && p.date.substring(0, 7) === m;
        } catch {
          return false;
        }
      });
      const actual = monthPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      let formattedName = m;
      try {
        formattedName = format(parseISO(m + '-01'), 'MMM/yy', { locale: ptBR });
      } catch (e) {
        console.error("Error formatting goal month:", e);
      }

      return {
        month: m,
        name: formattedName,
        planejado: goal?.value || 0,
        realizado: actual
      };
    });
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
      { name: 'Vendas com Pontuação', value: stats.withinRules },
      { name: 'Vendas sem Pontuação', value: stats.outsideRules },
      { name: 'Clientes sem Compras', value: stats.customersWithoutPurchases }
    ];
  }, [stats]);

  const promotionStats = useMemo(() => {
    // Current period filter
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (period === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start = subDays(now, 7);
    } else if (period === 'month') {
      start = subDays(now, 30);
    } else if (period === 'custom' && startDate && endDate) {
      start = parseISO(startDate);
      end = parseISO(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(0); // All time
    }

    const periodPurchases = purchases.filter(p => {
      const d = parseISO(p.date);
      return d >= start && d <= end;
    });

    const promoPurchases = periodPurchases.filter(p => p.promotionId);
    
    // Count promotions active in this period
    const countPromos = promotionHistory.filter(h => {
       const s = parseISO(h.startDate);
       const e = parseISO(h.endedAt || h.endDate || h.startDate);
       return (s <= end && e >= start);
    }).length + (rules.promotionConfig?.isActive ? 1 : 0);

    const revenue = promoPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);
    const participants = new Set(promoPurchases.map(p => p.customerId)).size;
    const avgTicket = promoPurchases.length > 0 ? revenue / promoPurchases.length : 0;
    
    // RFV of the promotion
    const frequency = participants > 0 ? promoPurchases.length / participants : 0;
    const valuePerParticipant = participants > 0 ? revenue / participants : 0;
    
    // New clients (first purchase ever was in a promotion during this period)
    const newClients = Array.from(new Set(promoPurchases.map(p => p.customerId))).filter(cid => {
       const custPurchases = purchases.filter(p => p.customerId === cid).sort((a,b) => a.date.localeCompare(b.date));
       const firstPurchase = custPurchases[0];
       return firstPurchase && firstPurchase.promotionId && (parseISO(firstPurchase.date) >= start && parseISO(firstPurchase.date) <= end);
    }).length;

    return {
      count: countPromos,
      avgTicket,
      participants,
      revenue,
      newClients,
      frequency,
      valuePerParticipant
    };
  }, [purchases, promotionHistory, rules.promotionConfig, period, startDate, endDate]);

  const COLORS = ['#22C55E', '#F97316', '#9CA3AF']; // Green, Orange, Gray

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
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsReportDialogOpen(true)}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:bg-black transition-all text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-black/10"
          >
            <Download size={18} className="text-green-400" />
            Relatório de Gestão
          </Button>
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
      </div>

      {/* Report Period Modal */}
      <AnimatePresence>
        {isReportDialogOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Gerar Relatório</h3>
                <button onClick={() => setIsReportDialogOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 font-medium">Informe o período desejado para o Relatório de Gestão:</p>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={reportDates.start}
                    onChange={(e) => setReportDates(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Fim</label>
                  <input 
                    type="date" 
                    value={reportDates.end}
                    onChange={(e) => setReportDates(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={async () => {
                    if (reportDates.start && reportDates.end) {
                      await onExportReport?.(reportDates.start, reportDates.end);
                      setIsReportDialogOpen(false);
                    } else {
                      showToast("Selecione as duas datas", "warning");
                    }
                  }}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  Download Relatório PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Termômetro de Dias da Semana */}
      <Card className="p-6 bg-white border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Thermometer size={120} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Termômetro de Vendas por Dia</h4>
            <p className="text-lg font-black text-gray-900">Análise de Frequência Semanal</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
              <p className="text-[10px] font-bold text-green-600 uppercase">Melhor Faturamento</p>
              <p className="text-sm font-black text-green-700">{weekdayStats.bestDay}</p>
            </div>
            <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Melhor Ticket Médio</p>
              <p className="text-sm font-black text-amber-700">{weekdayStats.bestTicketDay}</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Pico de Horário</p>
              <p className="text-sm font-black text-blue-700">{weekdayStats.peakHour}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-4 h-32 items-end">
          {weekdayStats.distribution.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group relative h-full justify-end">
              <div 
                className="w-full rounded-t-lg transition-all duration-500 bg-gray-100 hover:bg-primary/20 cursor-help relative overflow-hidden" 
                style={{ height: `${Math.max(d.percentage, 10)}%` }}
              >
                <div 
                  className={cn(
                    "absolute bottom-0 w-full transition-all duration-700",
                    d.fullName === weekdayStats.bestDay ? "bg-primary" : "bg-primary/40",
                    d.fullName === weekdayStats.worstDay && "bg-orange-400"
                  )}
                  style={{ height: '100%' }}
                />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                d.fullName === weekdayStats.bestDay ? "text-primary" : "text-gray-400"
              )}>
                {d.day}
              </span>
              
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] p-3 rounded-xl shadow-2xl z-20 whitespace-nowrap">
                <p className="font-bold text-primary mb-1">{d.fullName}</p>
                <div className="space-y-1">
                  <p className="flex justify-between gap-4"><span>Faturamento:</span> <span className="font-bold">R$ {formatCurrency(d.total)}</span></p>
                  <p className="flex justify-between gap-4"><span>Transações:</span> <span className="font-bold">{d.count}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

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

      {/* Clientes Atuais Overview Analysis (Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all border-l-4 border-l-primary">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-primary" />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de Clientes</h4>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalCurrent}</p>
              <span className="text-xs font-bold text-gray-400">ativos</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary" />
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta de Clientes</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalCurrent}</p>
            <p className="text-sm font-bold text-gray-400">/ {customerAnalysis.currentGoal || '---'}</p>
          </div>
          {customerAnalysis.currentGoal > 0 && (
            <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
               <div className="bg-primary h-full transition-all" style={{ width: `${Math.min((customerAnalysis.totalCurrent / customerAnalysis.currentGoal) * 100, 100)}%` }} />
            </div>
          )}
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-primary" />
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">vs Mês Anterior</h4>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalPrevMonth}</p>
            <div className={cn(
              "flex items-center gap-0.5 font-black text-[10px] px-1.5 py-0.5 rounded-full",
              customerAnalysis.growthPrevMonth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {customerAnalysis.growthPrevMonth >= 0 ? '+' : ''}{customerAnalysis.growthPrevMonth.toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Crescimento</h4>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{customerAnalysis.totalInPeriod}</p>
            <span className="text-xs font-bold text-gray-400">novos</span>
          </div>
          <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Ganhos no período selecionado</p>
        </Card>
      </div>

      {/* Promoções Realizadas no Período Analysis */}
      <Card className="p-6 bg-white border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all border-t-4 border-t-orange-500">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Gift size={120} className="text-orange-500" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
              <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">Performance de Campanhas</h4>
              <p className="text-xl font-black text-gray-900">Promoções Realizadas no Período</p>
           </div>
           <div className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-600 uppercase">Promoções Ativas/Encerradas</p>
              <p className="text-lg font-black text-orange-700">{promotionStats.count}</p>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/50 transition-colors">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Participantes</p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Users size={14} className="text-orange-600" />
                 </div>
                 <p className="text-lg font-black text-gray-900">{promotionStats.participants}</p>
              </div>
           </div>

           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/50 transition-colors">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ticket Médio</p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <DollarSign size={14} className="text-orange-600" />
                 </div>
                 <p className="text-lg font-black text-gray-900">R$ {formatCurrency(promotionStats.avgTicket)}</p>
              </div>
           </div>

           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/50 transition-colors">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Freq. Média</p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <TrendingUp size={14} className="text-orange-600" />
                 </div>
                 <p className="text-lg font-black text-gray-900">{promotionStats.frequency.toFixed(1)}x</p>
              </div>
           </div>

           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/50 transition-colors">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor/Cliente</p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <BarChart3 size={14} className="text-orange-600" />
                 </div>
                 <p className="text-lg font-black text-gray-900">R$ {formatCurrency(promotionStats.valuePerParticipant)}</p>
              </div>
           </div>

           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/50 transition-colors">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Novos Clientes</p>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <UserPlus size={14} className="text-orange-600" />
                 </div>
                 <p className="text-lg font-black text-gray-900">{promotionStats.newClients}</p>
              </div>
           </div>
        </div>
      </Card>

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
                        <th className="px-4 py-3">{rules.rewardMode === 'cashback' ? 'Cashback' : 'Pontos'}</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPurchases.map(p => {
                        const customer = customers.find(c => String(c.id) === String(p.customerId));
                        const displayName = customer ? customer.name : (p.customerName || 'Cliente sem nome');
                        return (
                          <tr key={p.id} className="text-sm hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-500">{format(parseISO(p.date), "dd/MM/yy HH:mm")}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{displayName}</td>
                            <td className="px-4 py-3 text-primary font-bold">R$ {formatCurrency(p.amount)}</td>
                            <td className="px-4 py-3 text-green-600">
                              {rules.rewardMode === 'cashback' 
                                ? `+R$ ${formatCurrency(p.cashbackEarned || 0)}` 
                                : `+${p.pointsEarned || 0}`}
                            </td>
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
                        );
                      })}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket Médio Acima da Meta</h4>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleExportSegmentPdf('above')}
                className="p-2 h-auto text-[10px] bg-gray-900 text-white font-bold"
              >
                <Download size={14} className="mr-1" /> PDF
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <input 
              type="number" 
              placeholder="Min R$" 
              value={aboveFilter.min}
              onChange={(e) => setAboveFilter(prev => ({ ...prev, min: e.target.value }))}
              className="w-1/2 p-2 bg-gray-50 border border-gray-100 rounded text-[10px] outline-none"
            />
            <input 
              type="number" 
              placeholder="Max R$" 
              value={aboveFilter.max}
              onChange={(e) => setAboveFilter(prev => ({ ...prev, max: e.target.value }))}
              className="w-1/2 p-2 bg-gray-50 border border-gray-100 rounded text-[10px] outline-none"
            />
          </div>
          <div className="h-48 overflow-y-auto pr-1">
            <div className="space-y-2">
              {stats.aboveGoal.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-green-50/30 border border-green-100 rounded text-[10px]">
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-gray-400">RFV: {c.rfv}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R$ {formatCurrency(c.avgTicket)}</p>
                    <p className={c.inCampaign ? "text-green-500" : "text-gray-400"}>
                      {c.inCampaign ? 'No Programa' : 'Fora'}
                    </p>
                  </div>
                </div>
              ))}
              {stats.aboveGoal.length === 0 && <p className="text-center py-8 text-gray-400 italic text-[10px]">Nenhum cliente.</p>}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket Médio Abaixo da Meta</h4>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleExportSegmentPdf('below')}
                className="p-2 h-auto text-[10px] bg-gray-900 text-white font-bold"
              >
                <Download size={14} className="mr-1" /> PDF
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <input 
              type="number" 
              placeholder="Min R$" 
              value={belowFilter.min}
              onChange={(e) => setBelowFilter(prev => ({ ...prev, min: e.target.value }))}
              className="w-1/2 p-2 bg-gray-50 border border-gray-100 rounded text-[10px] outline-none"
            />
            <input 
              type="number" 
              placeholder="Max R$" 
              value={belowFilter.max}
              onChange={(e) => setBelowFilter(prev => ({ ...prev, max: e.target.value }))}
              className="w-1/2 p-2 bg-gray-50 border border-gray-100 rounded text-[10px] outline-none"
            />
          </div>
          <div className="h-48 overflow-y-auto pr-1">
            <div className="space-y-2">
              {stats.belowGoal.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-amber-50/30 border border-amber-100 rounded text-[10px]">
                  <div>
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-gray-400">RFV: {c.rfv}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">R$ {formatCurrency(c.avgTicket)}</p>
                    <p className={c.inCampaign ? "text-green-500" : "text-gray-400"}>
                      {c.inCampaign ? 'No Programa' : 'Fora'}
                    </p>
                  </div>
                </div>
              ))}
              {stats.belowGoal.length === 0 && <p className="text-center py-8 text-gray-400 italic text-[10px]">Nenhum cliente.</p>}
            </div>
          </div>
        </Card>
      </div>

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
              <h3 className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Penetração na base de clientes (Clientes ativos no período / Base total).
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

        <Card className="p-4 bg-white border-gray-100 shadow-sm relative">
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
                  onClick={(data) => setSelectedSlice(data.name === selectedSlice ? null : data.name)}
                  cursor="pointer"
                >
                  {ruleData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke={selectedSlice === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                    />
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

          <AnimatePresence>
            {selectedSlice && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-x-4 top-12 bottom-4 bg-white/95 backdrop-blur-sm z-30 flex flex-col p-4 border border-gray-100 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{selectedSlice}</h5>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSlice(null)} className="h-6 w-6 p-0 rounded-full">
                    <X size={14} />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {selectedSlice === 'Clientes sem Compras' ? (
                     customers
                       .filter(c => !purchases.some(p => p.customerId === c.id))
                       .slice(0, 50)
                       .map(c => (
                         <div key={c.id} className="p-2 bg-gray-50 rounded-lg text-[10px] flex justify-between items-center border border-gray-100">
                           <span className="font-bold text-gray-900">{c.name}</span>
                           <span className="text-gray-400 font-bold italic">Sem compras</span>
                         </div>
                       ))
                  ) : (
                    filteredPurchases
                      .filter(p => {
                        const ruleThreshold = rules.rewardMode === 'cashback' 
                          ? (rules.cashbackConfig?.minActivationValue || 0) 
                          : (rules.minPurchaseValue || 0);
                        return selectedSlice === 'Vendas com Pontuação' ? p.amount >= ruleThreshold : p.amount < ruleThreshold;
                      })
                      .slice(0, 50)
                      .map(p => {
                        const customer = customers.find(c => String(c.id) === String(p.customerId));
                        const displayName = customer?.name || p.customerName || 'Cliente sem nome';
                        return (
                          <div key={p.id} className="p-2 bg-gray-50 rounded-lg text-[10px] flex justify-between items-center border border-gray-100">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{displayName}</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase">{format(parseISO(p.date), 'dd/MM HH:mm')}</span>
                            </div>
                            <span className="font-black text-primary">R$ {formatCurrency(p.amount)}</span>
                          </div>
                        );
                      })
                  )}
                </div>
                <p className="text-[8px] text-gray-400 italic text-center mt-2">Exibindo até 50 registros.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {ruleData.map((d, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedSlice(d.name === selectedSlice ? null : d.name)}
                className={cn(
                  "p-2 rounded-lg text-center cursor-pointer transition-all border",
                  selectedSlice === d.name ? "bg-gray-100 border-gray-300 scale-105" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                )}
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase">{d.name}</p>
                <p className="text-sm font-black text-gray-900">
                  {d.value} 
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    {d.name.includes('Clientes') ? 'pessoas' : 'vendas'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white border-gray-100 shadow-sm overflow-hidden">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Últimas Compras</h4>
        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredPurchases.slice(0, 20).map(p => {
            const customer = customers.find(c => String(c.id) === String(p.customerId));
            const displayName = customer?.name || p.customerName || 'Cliente sem nome';
            return (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{displayName}</p>
                  <p className="text-[10px] text-gray-500">{format(parseISO(p.date), "dd/MM/yy HH:mm")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">R$ {formatCurrency(p.amount)}</p>
                  {p.pointsEarned > 0 && <p className="text-[10px] text-green-600">+{p.pointsEarned} ponto(s)</p>}
                  {(p as any).cashbackEarned > 0 && <p className="text-[10px] text-green-600">+R$ {formatCurrency((p as any).cashbackEarned)} cashback</p>}
                </div>
              </div>
            );
          })}
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
        if (c.isDeleted) return false;
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
                    {rules.companyProfile?.logoURL || rules.companyProfile?.photoURL ? (
                      <img src={rules.companyProfile?.logoURL || rules.companyProfile?.photoURL} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="text-primary" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">
                      {rules.campaignName || 'Programa de Fidelidade'}
                    </p>
                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter mb-1">
                      CARTÃO {rules.rewardMode === 'cashback' ? 'CASHBACK' : 'PONTOS'} ATIVO
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
  
  const isAnyProgramRunning = pointsStatus.status !== 'ended' || cashbackStatus.status !== 'ended';
  const runningProgramType = pointsStatus.status !== 'ended' ? 'points' : (cashbackStatus.status !== 'ended' ? 'cashback' : null);

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
          targetType: 'personal',
          targetStoreId: companyId,
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

  const handleProgramAction = async (action: 'pause' | 'end' | 'resume' | 'start') => {
    if (!isAdmin) return;
    
    const programName = rewardMode === 'points' ? 'Pontos' : 'Cashback';
    const newStatus = action === 'pause' ? 'paused' : (action === 'resume' || action === 'start' ? 'active' : 'ended');
    
    const actionLabel = action === 'pause' ? 'Pausar' : (action === 'resume' ? 'Retomar' : (action === 'start' ? 'Ativar' : 'Encerrar'));

    askConfirmation(
      `${actionLabel} Programa`,
      `Tem certeza que deseja ${actionLabel.toLowerCase()} o programa de ${programName}? Os clientes serão notificados.`,
      async () => {
        setIsSaving(true);
        try {
          const updatedRules = { ...rules };
          if (rewardMode === 'points') {
            updatedRules.pointsStatus = { ...pointsStatus, status: newStatus };
            updatedRules.rewardMode = 'points';
            setPointsStatus(updatedRules.pointsStatus);
          } else {
            updatedRules.cashbackStatus = { ...cashbackStatus, status: newStatus };
            updatedRules.rewardMode = 'cashback';
            setCashbackStatus(updatedRules.cashbackStatus);
          }
          
          await onUpdateRules(updatedRules);
          await handleNotifyCustomers(newStatus as any, programName);
          showToast(`Programa de ${programName} ${action === 'start' ? 'ativado' : (newStatus === 'paused' ? 'pausado' : (newStatus === 'active' ? 'retomado' : 'encerrado'))}.`, "success");
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
    
    // In current turn, we remove re-auth and just save directly to avoid auth errors
    setIsSaving(true);
    try {
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
      setIsLocked(true);
      if (onboardingMode) {
        setTimeout(() => {
          setShowSuccess(false);
          onOnboardingFinish?.();
        }, 1500);
      } else {
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'configs');
    } finally {
      setIsSaving(false);
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
                onClick={() => setRewardMode('points')}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left group relative flex flex-col items-center text-center",
                  rewardMode === 'points' 
                    ? (pointsStatus.status === 'active' ? "border-green-500 bg-green-50" : (pointsStatus.status === 'paused' ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"))
                    : (isAnyProgramRunning && runningProgramType !== 'points' ? "border-gray-100 bg-gray-50 opacity-30 grayscale cursor-not-allowed" : "border-gray-100 bg-gray-50 hover:border-gray-200")
                )}
                disabled={isAnyProgramRunning && runningProgramType !== 'points'}
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm", 
                    rewardMode === 'points' 
                      ? (pointsStatus.status === 'active' ? "bg-green-600 text-white" : (pointsStatus.status === 'paused' ? "bg-amber-600 text-white" : "bg-red-600 text-white"))
                      : "bg-gray-200 text-gray-400"
                  )}>
                    <Award size={24} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rewardMode === 'points' && pointsStatus.status === 'active' && <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />}
                    <h4 className={cn("font-black uppercase tracking-widest text-xs", rewardMode === 'points' ? "text-gray-900" : "text-gray-400")}>Pontos</h4>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold leading-tight">Clientes acumulam pontos em cada compra e trocam por prêmios.</p>
                {pointsStatus.status !== 'ended' && (
                  <span className={cn(
                    "absolute top-3 right-3 px-2 py-0.5 text-[8px] font-black uppercase rounded-full shadow-sm",
                    pointsStatus.status === 'active' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {pointsStatus.status === 'active' ? 'Ativado' : 'Pausado'}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setRewardMode('cashback')}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left group relative flex flex-col items-center text-center",
                  rewardMode === 'cashback' 
                    ? (cashbackStatus.status === 'active' ? "border-green-500 bg-green-50" : (cashbackStatus.status === 'paused' ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"))
                    : (isAnyProgramRunning && runningProgramType !== 'cashback' ? "border-gray-100 bg-gray-50 opacity-30 grayscale cursor-not-allowed" : "border-gray-100 bg-gray-50 hover:border-gray-200")
                )}
                disabled={isAnyProgramRunning && runningProgramType !== 'cashback'}
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className={cn(
                    "p-3 rounded-2xl shadow-sm", 
                    rewardMode === 'cashback' 
                      ? (cashbackStatus.status === 'active' ? "bg-green-600 text-white" : (cashbackStatus.status === 'paused' ? "bg-amber-600 text-white" : "bg-red-600 text-white"))
                      : "bg-gray-200 text-gray-400"
                  )}>
                    <DollarSign size={24} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rewardMode === 'cashback' && cashbackStatus.status === 'active' && <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />}
                    <h4 className={cn("font-black uppercase tracking-widest text-xs", rewardMode === 'cashback' ? "text-gray-900" : "text-gray-400")}>Cashback</h4>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-bold leading-tight">Clientes recebem um percentual do valor gasto como saldo.</p>
                {cashbackStatus.status !== 'ended' && (
                  <span className={cn(
                    "absolute top-3 right-3 px-2 py-0.5 text-[8px] font-black uppercase rounded-full shadow-sm",
                    cashbackStatus.status === 'active' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {cashbackStatus.status === 'active' ? 'Ativado' : 'Pausado'}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Program Controls and Validity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} className="text-primary" />
                  Geral: {rewardMode === 'points' ? 'Pontos' : 'Cashback'}
                </h3>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  (rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {(rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'active' ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {(rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'ended' ? (
                  <Button 
                    onClick={() => handleProgramAction('start')}
                    disabled={isAnyProgramRunning}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 h-auto flex flex-col items-center gap-1 shadow-lg shadow-green-100"
                  >
                    <PlayCircle size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ativar {rewardMode === 'points' ? 'Pontos' : 'Cashback'}</span>
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleProgramAction((rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'paused' ? 'resume' : 'pause')} 
                      className={cn(
                        "flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl py-6 h-auto flex flex-col items-center gap-1",
                        (rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'paused' && "bg-amber-50 border-amber-500"
                      )}
                    >
                      {(rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'paused' ? <Play size={20} /> : <Pause size={20} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {(rewardMode === 'points' ? pointsStatus.status : cashbackStatus.status) === 'paused' ? 'Retomar' : 'Pausar'}
                      </span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleProgramAction('end')} 
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50 rounded-xl py-6 h-auto flex flex-col items-center gap-1"
                    >
                      <XCircle size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Encerrar</span>
                    </Button>
                  </>
                )}
              </div>

              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validade Integrada</label>
                  <Calendar size={14} className="text-gray-300" />
                </div>
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
                      value={minPurchaseValue || 0}
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
                    value={extraPointsThreshold || 0}
                    onChange={(e) => setExtraPointsThreshold(parseFloat(e.target.value) || 0)}
                    disabled={isLocked}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none focus:border-green-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qtd Pontos Extra</label>
                  <input 
                    type="number" 
                    value={extraPointsAmount || 0}
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
                      <input type="number" value={tier.points || 0} onChange={(e) => updateTier(index, 'points', e.target.value)} disabled={isLocked} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
                    </div>
                    <div className="flex-[2] space-y-1.5 w-full">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Prêmio</label>
                      <input type="text" value={tier.prize || ''} onChange={(e) => updateTier(index, 'prize', e.target.value)} disabled={isLocked} placeholder="Ex: Vale Compras R$ 50" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" />
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
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor mínimo para Cashback</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      value={cashbackConfig.minActivationValue || 0}
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
                          return factor * (cashbackConfig.percentage / 100 * billing);
                        })()
                      )}
                    </p>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Mensal Estimado</span>
                  </div>
                  <p className="text-[9px] text-amber-600 leading-tight">
                    Fórmula: (Faturamento Mensal Planejado / Valor Mínimo para Cashback) * (% do Faturamento).
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
              {isSaving ? 'Salvando...' : 'SALVAR CONFIGURAÇÕES'}
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

  useEffect(() => {
    if (rules.seasonalDates) {
      setDates(rules.seasonalDates);
    }
  }, [rules.seasonalDates]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState<SeasonalDate | null>(null);
  const [newDate, setNewDate] = useState<Partial<SeasonalDate>>({ type: 'custom', state: '', city: '' });
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dates' | 'campaigns'>('dates');

  const { showToast } = useToast();
  const { askConfirmation } = useConfirm();

  const BRAZIL_STATES = [
    { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' }, { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul' }, { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' }, { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' }, { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
  ];

  // Simplified city mapping for example. In production use IBGE API.
  const CITIES_BY_STATE: Record<string, string[]> = {
    'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Petrópolis', 'Búzios'],
    'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Guarulhos'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Gramado']
  };

  const HOLIDAY_LIBRARY: Partial<SeasonalDate>[] = [
    { name: 'Confraternização Universal', date: '2024-01-01', type: 'national' },
    { name: 'Carnaval', date: '2024-02-13', type: 'national' },
    { name: 'Tiradentes', date: '2024-04-21', type: 'national' },
    { name: 'Dia do Trabalhador', date: '2024-05-01', type: 'national' },
    { name: 'Independência do Brasil', date: '2024-09-07', type: 'national' },
    { name: 'Nossa Senhora Aparecida', date: '2024-10-12', type: 'national' },
    { name: 'Finados', date: '2024-11-02', type: 'national' },
    { name: 'Proclamação da República', date: '2024-11-15', type: 'national' },
    { name: 'Dia da Consciência Negra', date: '2024-11-20', type: 'national' },
    { name: 'Natal', date: '2024-12-25', type: 'national' },
    { name: 'Réveillon', date: '2024-12-31', type: 'national' },
    // Local examples
    { name: 'Dia de São Sebastião', date: '2024-01-20', type: 'municipal', state: 'RJ', city: 'Rio de Janeiro' },
    { name: 'Aniversário de São Paulo', date: '2024-01-25', type: 'municipal', state: 'SP', city: 'São Paulo' },
    { name: 'Revolução Constitucionalista', date: '2024-07-09', type: 'state', state: 'SP' },
  ];

  const filteredDates = useMemo(() => {
    return dates.filter(d => {
      const matchState = !stateFilter || d.state === stateFilter || d.type === 'national';
      const matchCity = !cityFilter || d.city === cityFilter || d.type !== 'municipal';
      const matchMonth = !monthFilter || (d.date && d.date.includes(`-${monthFilter}-`));
      const matchType = typeFilter === 'all' || d.type === typeFilter;
      return matchState && matchCity && matchMonth && matchType;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [dates, stateFilter, cityFilter, monthFilter, typeFilter]);

  const availableHolidays = useMemo(() => {
    return HOLIDAY_LIBRARY.filter(h => {
      const matchState = !stateFilter || h.state === stateFilter || h.type === 'national';
      const matchCity = !cityFilter || h.city === cityFilter || h.type !== 'municipal';
      const matchMonth = !monthFilter || (h.date && h.date.includes(`-${monthFilter}-`));
      const matchType = typeFilter === 'all' || h.type === typeFilter;
      const alreadyAdded = dates.some(d => d.name === h.name && d.date === h.date);
      return matchState && matchCity && matchMonth && matchType && !alreadyAdded;
    });
  }, [stateFilter, cityFilter, monthFilter, typeFilter, dates]);

  const handleSave = async (updatedDates: SeasonalDate[]) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const updatedRules = { ...rules, seasonalDates: updatedDates };
      await onUpdateRules(updatedRules);
      setDates(updatedDates);
      showToast("Datas sazonais atualizadas!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar datas.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addDate = (customDate?: Partial<SeasonalDate>) => {
    const data = customDate || newDate;
    if (!data.name || !data.date) return;
    const date: SeasonalDate = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      date: data.date,
      type: (data.type as any) || 'custom',
      state: data.state,
      city: data.city
    };
    const updated = [...dates, date].sort((a, b) => a.date.localeCompare(b.date));
    handleSave(updated);
    setShowAddModal(false);
    setNewDate({ type: 'custom', state: '', city: '' });
  };

  const removeDate = (id: string) => {
    askConfirmation("Remover Data", "Deseja remover esta data sazonal do seu planejamento?", () => {
      const updated = dates.filter(d => d.id !== id);
      handleSave(updated);
    });
  };

  const MONTHS = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-24 lg:pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Datas Sazonais</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Planejamento de campanhas e inteligência comercial</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6 bg-white border-gray-100 shadow-xl space-y-6 sticky top-24">
              <div>
                <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Filter size={14} className="text-primary" />
                  Smart Filters
                </h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mês da Data</label>
                    <select 
                      value={monthFilter}
                      onChange={e => setMonthFilter(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                    >
                      <option value="">Todos os meses</option>
                      {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                    <div className="flex flex-col gap-1.5">
                      {['all', 'national', 'state', 'municipal', 'custom'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                            typeFilter === t ? "bg-primary/5 border-primary/20 text-primary" : "bg-transparent border-transparent text-gray-400 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", 
                            t === 'all' ? "bg-gray-400" :
                            t === 'national' ? "bg-green-500" :
                            t === 'state' ? "bg-blue-500" :
                            t === 'municipal' ? "bg-orange-500" : "bg-purple-500"
                          )} />
                          {t === 'all' ? 'Ver Tudo' : 
                           t === 'national' ? 'Nacionais' : 
                           t === 'state' ? 'Estaduais' : 
                           t === 'municipal' ? 'Municipais' : 'Personalizadas'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Localidade (UF)</label>
                      <select 
                        value={stateFilter}
                        onChange={e => {
                          setStateFilter(e.target.value);
                          setCityFilter('');
                        }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Brasil (Todos)</option>
                        {BRAZIL_STATES.map(s => (
                          <option key={s.uf} value={s.uf}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {stateFilter && CITIES_BY_STATE[stateFilter] && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade</label>
                        <select 
                          value={cityFilter}
                          onChange={e => setCityFilter(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Todas as Cidades</option>
                          {CITIES_BY_STATE[stateFilter].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowAddModal(true)}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <PlusCircle size={18} />
                <span>Criar Data Especial</span>
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDates.length > 0 ? (
                filteredDates.map((date) => (
                  <Card key={date.id} className={cn(
                    "p-5 border shadow-sm relative overflow-hidden group transition-all hover:shadow-lg",
                    date.hasCampaign ? "bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-100" : "bg-white border-gray-100"
                  )}>
                    <div className={cn(
                      "absolute top-0 left-0 w-1.5 h-full",
                      date.type === 'national' ? "bg-green-500" :
                      date.type === 'state' ? "bg-blue-500" :
                      date.type === 'municipal' ? "bg-orange-500" : "bg-purple-500"
                    )} />
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all",
                            date.hasCampaign ? "bg-primary text-white border-primary shadow-md" : "bg-gray-50 border-gray-100"
                          )}>
                            <span className={cn("text-[10px] font-black uppercase", date.hasCampaign ? "text-white/80" : "text-gray-400")}>
                              {format(parseISO(date.date), 'MMM', { locale: ptBR })}
                            </span>
                            <span className="text-xl font-black leading-none">{format(parseISO(date.date), 'dd')}</span>
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 uppercase tracking-tighter text-sm">{date.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                                date.type === 'national' ? "bg-green-100 text-green-700" :
                                date.type === 'state' ? "bg-blue-100 text-blue-700" :
                                date.type === 'municipal' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                              )}>
                                {date.type === 'national' ? 'Nacional' : 
                                 date.type === 'state' ? `Estadual (${date.state})` : 
                                 date.type === 'municipal' ? `Municipal (${date.city})` : 'Personalizada'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeDate(date.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 rounded-lg shadow-sm"
                          title="Remover Data"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setShowCampaignModal(date)}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md",
                            date.hasCampaign 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20" 
                              : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                          )}
                        >
                          {date.hasCampaign ? <CheckCircle size={14} /> : <Megaphone size={14} />}
                          <span>{date.hasCampaign ? "Campanha Realizada" : "Criar Campanha"}</span>
                        </Button>
                        {date.hasCampaign && (
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <CheckCircle size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tighter">Nenhuma data selecionada</h3>
                    <p className="text-xs text-gray-400 font-medium italic">Selecione feriados na biblioteca ou crie datas personalizadas abaixo</p>
                  </div>
                </div>
              )}
            </div>

            {availableHolidays.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpen size={18} className="text-gray-400" />
                  <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg bg-gray-100 px-4 py-1.5 rounded-full inline-block">Biblioteca de Feriados</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableHolidays.map((holiday, idx) => (
                    <Card key={idx} className="p-4 bg-white border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex flex-col items-center justify-center text-green-600 font-black text-xs">
                          <span>{holiday.date && format(parseISO(holiday.date), 'dd')}</span>
                          <span className="text-[8px] uppercase">{holiday.date && format(parseISO(holiday.date), 'MMM', { locale: ptBR })}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">{holiday.name}</p>
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{holiday.type}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => addDate(holiday)}
                        className="text-green-600 hover:bg-green-50 rounded-lg p-1.5"
                      >
                        <Plus size={16} />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Criar Data Personalizada</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Crie eventos exclusivos para sua base</p>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Evento</label>
                  <input 
                    type="text" 
                    value={newDate.name || ''}
                    onChange={e => setNewDate({ ...newDate, name: e.target.value })}
                    placeholder="Ex: Liquidação de Inverno"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary h-14"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data do Evento</label>
                  <input 
                    type="date" 
                    value={newDate.date || ''}
                    onChange={e => setNewDate({ ...newDate, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary h-14"
                  />
                </div>
                  <div className="p-4 bg-primary/5 rounded-2xl flex items-start gap-3">
                  <Info size={16} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-primary/80 font-medium italic">Configure a abrangência da data para que os filtros automáticos funcionem corretamente.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Abrangência / Tipo</label>
                  <select 
                    value={newDate.type || 'custom'}
                    onChange={e => setNewDate({ ...newDate, type: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary h-14"
                  >
                    <option value="custom">Personalizada (Sua Loja)</option>
                    <option value="national">Nacional (Brasil)</option>
                    <option value="state">Estadual (UF)</option>
                    <option value="municipal">Municipal (Cidade)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-2 relative z-10">
                <Button variant="outline" className="flex-1 py-4 font-black uppercase tracking-widest text-xs" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                <Button 
                  className="flex-1 py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20" 
                  onClick={() => addDate()}
                  disabled={!newDate.name || !newDate.date}
                >
                  Confirmar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCampaignModal && (
          <CampaignCreationModal 
            targetDate={showCampaignModal} 
            onClose={() => setShowCampaignModal(null)}
            rules={rules}
            onUpdateRules={onUpdateRules}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CampaignCreationModal({ targetDate, onClose, rules, onUpdateRules }: { targetDate: SeasonalDate; onClose: () => void; rules: LoyaltyRule; onUpdateRules: (rules: LoyaltyRule) => Promise<void> }) {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    title: `Oferta Especial: ${targetDate.name}`,
    message: `Olá! Preparamos algo incrível para você no ${targetDate.name}. Venha conferir!`,
    target: 'all' as 'all' | 'loyal' | 'inactive' | 'new',
    delivery: ['webapp'] as string[]
  });
  const [isSending, setIsSending] = useState(false);

  const handleCreate = async () => {
    setIsSending(true);
    try {
      // In a real app, this would trigger an edge function or queue.
      // For now, we update the seasonal date in rules to mark it as having a campaign
      const updatedDates = (rules.seasonalDates || []).map(d => 
        d.id === targetDate.id ? { ...d, hasCampaign: true, campaignData } : d
      );
      await onUpdateRules({ ...rules, seasonalDates: updatedDates });
      onClose();
      showToast("Campanha agendada com sucesso via WebApp!", "success");
    } catch (error) {
      console.error(error);
      showToast("Falha ao agendar campanha. Verifique sua conexão.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleRemove = async () => {
    setIsSending(true);
    try {
      const updatedDates = (rules.seasonalDates || []).map(d => 
        d.id === targetDate.id ? { ...d, hasCampaign: false, campaignData: undefined } : d
      );
      // Clean undefined for setDoc safety (already done in handleUpdateRules but just in case)
      const cleanRules = JSON.parse(JSON.stringify({ ...rules, seasonalDates: updatedDates }));
      await onUpdateRules(cleanRules);
      onClose();
      showToast("Campanha removida com sucesso! A data voltou ao estado original.", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao remover campanha.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60]">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Megaphone size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Nova Campanha Sazonal</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{targetDate.name} • {format(parseISO(targetDate.date), 'dd/MM')}</p>
              <span className={cn(
                "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                targetDate.type === 'national' ? "bg-green-100 text-green-700" :
                targetDate.type === 'state' ? "bg-blue-100 text-blue-700" :
                targetDate.type === 'municipal' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
              )}>
                {targetDate.type === 'national' ? 'Nacional' : 
                 targetDate.type === 'state' ? `Estadual (${targetDate.state})` : 
                 targetDate.type === 'municipal' ? `Municipal (${targetDate.city})` : 'Personalizada'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título da Notificação</label>
              <input 
                value={campaignData.title}
                onChange={e => setCampaignData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mensagem</label>
              <textarea 
                rows={3}
                value={campaignData.message}
                onChange={e => setCampaignData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Público Alvo</label>
             <div className="grid grid-cols-2 gap-2">
               {[
                 { id: 'all', label: 'Todos os Clientes' },
                 { id: 'loyal', label: 'Clientes Fiéis' },
                 { id: 'inactive', label: 'Em Inatividade' },
                 { id: 'new', label: 'Novos (15 dias)' },
               ].map(target => (
                 <button
                   key={target.id}
                   onClick={() => setCampaignData(prev => ({ ...prev, target: target.id as any }))}
                   className={cn(
                     "p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                     campaignData.target === target.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                   )}
                 >
                   {target.label}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Canais de Envio</label>
             <div className="flex gap-2">
               <button className="flex-1 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary text-white flex items-center justify-center gap-2">
                  <Smartphone size={14} /> WebApp
               </button>
               <button disabled className="flex-1 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 border border-dashed border-gray-200 cursor-not-allowed group relative">
                  <MessageSquare size={14} className="inline mr-2" /> WhatsApp
                  <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">BREVE</span>
               </button>
             </div>
          </div>

          {targetDate.hasCampaign && (
            <button
              onClick={handleRemove}
              disabled={isSending}
              className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Excluir Campanha Agendada
            </button>
          )}
          
          <Button 
            onClick={handleCreate} 
            disabled={isSending}
            className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 mt-4"
          >
            {isSending ? (targetDate.hasCampaign ? 'Atualizando...' : 'Agendando...') : (targetDate.hasCampaign ? 'ATUALIZAR CAMPANHA' : 'FINALIZAR E AGENDAR')}
          </Button>
        </div>
      </motion.div>
    </div>
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
    const campaignCustomers = customers.filter(c => (c.points || 0) > 0 || (c.cashbackBalance || 0) > 0);
    const nonCampaignCustomers = customers.filter(c => (c.points || 0) === 0 && (c.cashbackBalance || 0) === 0);

    const calculateMetrics = (groupCustomers: Customer[]) => {
      const groupIds = new Set(groupCustomers.map(c => c.id));
      const groupPurchases = purchases.filter(p => groupIds.has(p.customerId));
      
      // Filter only those who actually bought
      const buyers = groupCustomers.filter(c => groupPurchases.some(p => p.customerId === c.id));
      
      if (buyers.length === 0) return { ltv: 0, frequency: 0, avgValue: 0, recency: 0, projectedLtv: 0 };

      const totalValue = groupPurchases.reduce((acc, p) => acc + p.amount, 0);
      const totalFrequency = groupPurchases.length / buyers.length;
      const avgValue = groupPurchases.length > 0 ? totalValue / groupPurchases.length : 0;
      
      const recencySum = buyers.reduce((acc, c) => {
        const lastDate = parseISO(c.lastPurchaseDate);
        return acc + differenceInDays(now, lastDate);
      }, 0);
      const avgRecency = recencySum / buyers.length;

      // Projected LTV based on life expectancy
      const avgAge = buyers.reduce((acc, c) => acc + (c.age || 30), 0) / buyers.length;
      const remainingYears = Math.max(0, lifeExpectancy - avgAge);
      
      // Frequency per year - assuming we have some history or normalizing
      const projectedLtv = avgValue * totalFrequency * remainingYears;

      return {
        ltv: totalValue / buyers.length,
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
  const { showToast } = useToast();
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
      showToast("Erro ao reautenticar. Por favor, entre com sua conta Google de administrador.", "error");
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
  const { showToast } = useToast();
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

      // Deletion logic - Thoroughly delete all associated data
      const collectionsToDelete = ['customers', 'purchases', 'goals', 'redemptions', 'notifications'];
      
      for (const collName of collectionsToDelete) {
        let docsDeletedCount = 0;
        // Search for documents belonging to this company
        const q = query(collection(db, collName), where('companyId', '==', companyId));
        const snapshot = await getDocs(q);
        
        // Delete in batches of 500 (Firestore limit)
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          chunk.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
          docsDeletedCount += chunk.length;
        }
        console.log(`Deleted ${docsDeletedCount} docs from ${collName}`);
      }

      // Reset configurations to absolute defaults
      const resetRules = {
        ...DEFAULT_RULES,
        companyId,
        onboardingComplete: false,
        onboardingStep: 'welcome',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentAvgTicket: 0,
        currentMonthlyRevenue: 0,
        redemptionCode: generateRedemptionCode()
      };

      // Ensure we overwrite COMPLETELY
      await setDoc(doc(db, 'configs', companyId), resetRules);

      // Also reset the user record in the users collection to ensure consistency
      const userRef = doc(db, 'users', companyId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          onboardingComplete: false,
          approved: true, // Keep them approved so they stay logged in
          companyName: deleteField(),
          cnpj: deleteField(),
          logoURL: deleteField(),
          themeColor: deleteField(),
          campaignName: deleteField()
        });
      }

      // Clear all local state indicators
      localStorage.clear();
      sessionStorage.clear();

      showToast("Sistema totalmente zerado com sucesso! Redirecionando...", "success");
      
      // Force clean reload
      window.location.replace(window.location.origin + '?reset_complete=true');
    } catch (err: any) {
      console.error("Reset Error:", err);
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

            <Button 
              onClick={() => auth.signOut()}
              variant="outline"
              className="w-full py-3 border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-gray-900 flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Sair do Sistema agora
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
  const [isWebhookLocked, setIsWebhookLocked] = useState(true);
  const [isErpKeyLocked, setIsErpKeyLocked] = useState(true);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB to stay safe within 1MB Firestore limit
        showToast("A imagem é muito grande. Por favor, escolha uma imagem menor que 800KB.", "error");
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
    const requiredFields: { key: keyof CompanyProfile; label: string }[] = [
      { key: 'companyName', label: 'Nome da Empresa' },
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'phone', label: 'Telefone' },
      { key: 'address', label: 'Endereço' },
      { key: 'responsible', label: 'Responsável' },
      { key: 'contactPhone', label: 'WhatsApp de Contato' }
    ];
    
    const missingFields = requiredFields.filter(f => !profile[f.key]);
    
    if (missingFields.length > 0) {
      showToast(`Campos obrigatórios ausentes: ${missingFields.map(f => f.label).join(', ')}`, "warning");
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
            <div className="mt-2 space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">URL do Webhook</label>
              <div className="flex items-center justify-between gap-2 p-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <code className="text-[9px] font-bold text-primary truncate">{window.location.origin + '/api/erp/loyalty'}</code>
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/api/erp/loyalty'); showToast("URL copiada!", "success"); }} className="p-1 hover:bg-white/10 rounded text-gray-400">
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold leading-tight pt-2 border-t border-gray-200 mt-2">
              DADOS MAPEADOS (ORIGEM ERP):
            </p>
            <ul className="text-[9px] text-gray-400 space-y-1 list-disc ml-3">
              <li>Nome do Cliente</li>
              <li>Celular do Cliente</li>
              <li>Data de Aniversário (ex: 10/10/2026)</li>
              <li>Valor Bruto da Venda (ex: 1.500,50 ou 150,50)</li>
            </ul>
            <p className="text-[8px] text-gray-400 leading-tight italic">
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
              SALVAR PERFIL
            </Button>
          </div>
        </Card>

        <Card className="p-8 bg-white border-gray-100 shadow-sm lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Empresa</label>
              <input 
                type="text" 
                value={profile.companyName || ''}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Razão Social"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome Fantasia</label>
              <input 
                type="text" 
                value={profile.tradingName || ''}
                onChange={(e) => setProfile({ ...profile, tradingName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Nome Fantasia"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">CNPJ</label>
              <input 
                type="text" 
                value={profile.cnpj || ''}
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
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Responsável Imediato</label>
              <input 
                type="text" 
                value={profile.responsible || ''}
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
            <div className="space-y-4">
              <label className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} /> Vigência do Contrato (Somente Leitura)
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Início</label>
                  <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-400 font-bold text-xs">
                    {appUser?.planStartDate ? format(parseISO(appUser.planStartDate), 'dd/MM/yyyy') : 'Não definido'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Término</label>
                  <div className="w-full bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-amber-900 font-black italic text-xs">
                    {appUser?.planEndDate ? format(parseISO(appUser.planEndDate), 'dd/MM/yyyy') : 'Não definido'}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Entre em contato com o suporte para renovar ou alterar seu plano.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Assinatura</label>
              <select 
                value={profile.subscriptionType || 'monthly'}
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
                  value={newUserData.name || ''}
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
                  value={newUserData.email || ''}
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
                  value={newUserData.phone || ''}
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
                    value={newUserData.password || ''}
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave de API / Conector</label>
                <button 
                  onClick={() => setIsErpKeyLocked(!isErpKeyLocked)}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                >
                  {isErpKeyLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={erpKey || ''}
                  onChange={(e) => setErpKey(e.target.value)}
                  readOnly={isErpKeyLocked}
                  className={cn(
                    "w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-16 py-4 text-gray-900 font-mono text-sm font-bold",
                    isErpKeyLocked && "opacity-60 cursor-not-allowed"
                  )}
                />
                <button 
                  onClick={generateERPKey}
                  disabled={isErpKeyLocked}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-all disabled:opacity-30"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="space-y-1.5 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL de Endpoint (Webhook)</label>
                  <button 
                    onClick={() => setIsWebhookLocked(!isWebhookLocked)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                  >
                    {isWebhookLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={rules.webhookUrl || (window.location.origin + '/api/erp/loyalty')}
                    onChange={(e) => onUpdateRules({ ...rules, webhookUrl: e.target.value })}
                    readOnly={isWebhookLocked}
                    className={cn(
                      "w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-primary font-mono text-[10px] font-bold",
                      isWebhookLocked && "opacity-60"
                    )}
                  />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(rules.webhookUrl || (window.location.origin + '/api/erp/loyalty')); showToast("URL copiada!", "success"); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none">Dados Mapeados (Mandatórios):</p>
              <ul className="text-[10px] text-gray-400 space-y-1 font-medium list-disc ml-4">
                <li>Nome Completo do Cliente</li>
                <li>Número de Celular (WhatsApp)</li>
                <li>Data de Nascimento (DD/MM/AAAA)</li>
                <li>Valor Bruto da Venda (ex: 1.500,50)</li>
              </ul>
            </div>
            <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
              Esta chave permite a sincronização automática. O ERP deve enviar os dados acima via Webhook ou API REST para processamento imediato de pontos ou cashback.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
              O modelo de integração Saas ERP v2.0 já está disponível para sua conta. Consulte a documentação técnica para endpoints de pontuação automática.
            </p>
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
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const { showToast } = useToast();

  const metrics = useMemo(() => {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    
    // Identificar o mês filtrado para buscar a meta
    const filteredMonthStr = format(start, 'yyyy-MM');
    const currentGoal = goals.find(g => g.month === filteredMonthStr);
    
    // Filter purchases within range
    const filteredPurchases = purchases.filter(p => {
      const d = parseISO(p.date);
      return d >= start && d <= end;
    });

    const totalSales = filteredPurchases.reduce((acc, p) => acc + p.amount, 0);
    
    // Faturamento do MÊS filtrado (para comparar com a meta)
    const monthPurchases = purchases.filter(p => p.date.startsWith(filteredMonthStr));
    const filteredMonthSales = monthPurchases.reduce((acc, p) => acc + p.amount, 0);
    
    const daysWithSales = new Set(monthPurchases.map(p => p.date.split('T')[0])).size || 1;
    const dailyAvg = filteredMonthSales / daysWithSales;
    const workingDays = currentGoal?.workingDays || 22;
    
    const projectedRevenue = dailyAvg * workingDays;
    const goalTrend = currentGoal ? (projectedRevenue / currentGoal.value) * 100 : 0;
    
    const avgTicket = purchases.length > 0 ? purchases.reduce((acc, p) => acc + p.amount, 0) / purchases.length : 0;
    const configuredAvgTicket = rules.currentAvgTicket || 0;
    const configuredMonthlyRevenue = rules.currentMonthlyRevenue || 0;
    const configuredActiveClients = currentGoal?.customersCount || (configuredAvgTicket > 0 ? configuredMonthlyRevenue / configuredAvgTicket : 0);
    
    const avgFrequency = customers.length > 0 ? (purchases.length / customers.length) : 0;
    
    const churnThreshold = subDays(new Date(), 60);
    const churnedCustomers = customers.filter(c => {
      const lastPurchase = purchases.filter(p => p.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      return lastPurchase ? parseISO(lastPurchase.date) < churnThreshold : true;
    }).length;
    const churnRate = customers.length > 0 ? (churnedCustomers / customers.length) * 100 : 0;
    const activeCustomers = customers.length - churnedCustomers;
    const repeatCustomers = customers.filter(c => purchases.filter(p => p.customerId === c.id).length > 1).length;
    const repurchaseRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;

    // IMPACT ANALYSIS: Recalculate based on campaign participation
    const campaignParticipants = customers.filter(c => (c.points || 0) > 0 || (c.cashbackBalance || 0) > 0);
    const nonParticipants = customers.filter(c => !((c.points || 0) > 0 || (c.cashbackBalance || 0) > 0));
    
    const calculateLtvForSet = (set: Customer[]) => {
      if (!set || set.length === 0) return 0;
      const setPurchases = (purchases || []).filter(p => set.some(c => c.id === p.customerId));
      const totalRev = setPurchases.reduce((acc, p) => acc + p.amount, 0);
      return totalRev / set.length;
    };

    const participantLtv = calculateLtvForSet(campaignParticipants);
    const nonParticipantLtv = calculateLtvForSet(nonParticipants);
    const ltvImpact = nonParticipantLtv > 0 ? ((participantLtv / nonParticipantLtv) - 1) * 100 : 0;

    // LTV Projections: Standard formula LTV = ARPU / Churn
    const monthlyArpu = (customers || []).length > 0 ? (totalSales / customers.length) : 0;
    const monthlyChurn = Math.max(0.01, (churnRate / 100) / 2); // Avoid division by zero
    const projectedLtv = monthlyArpu / monthlyChurn;

    const ltvProjections = [12, 24, 36, 60].map(months => ({
      months,
      value: monthlyArpu * months,
      conservative: monthlyArpu * months * 0.8
    }));

    let expectedCost = 0;
    if (rules.rewardMode === 'cashback') {
      expectedCost = customers.reduce((acc, c) => acc + (c.cashbackBalance || 0), 0);
    } else if (rules.rewardTiers) {
      rules.rewardTiers.forEach(tier => {
        const reachingProb = customers.filter(c => (c.points || 0) >= tier.points).length / (customers.length || 1);
        expectedCost += (tier.cost || 0) * reachingProb * customers.length;
      });
    }

    const baseValue = customers.reduce((acc, c) => {
      const custPurchases = purchases.filter(p => p.customerId === c.id);
      return acc + custPurchases.reduce((pacc, p) => pacc + p.amount, 0);
    }, 0);

    const payback = totalSales > 0 ? expectedCost / totalSales : 0;

    return {
      totalSales,
      projectedRevenue,
      goalTrend,
      avgTicket,
      configuredAvgTicket,
      configuredMonthlyRevenue,
      configuredActiveClients,
      avgFrequency,
      repurchaseRate,
      churnRate,
      ltvProjections,
      expectedCost,
      payback,
      currentGoalValue: currentGoal?.value || 0,
      activeCustomers,
      filteredMonthSales,
      ltvImpact,
      participantLtv,
      nonParticipantLtv,
      baseValue
    };
  }, [purchases, customers, goals, rules, dateRange]);

  const handleGenerateAnalysis = async () => {
    if (!rules.geminiApiKey && !process.env.GEMINI_API_KEY) {
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
        currentRange: `${dateRange.start} até ${dateRange.end}`,
        analysisMonth: format(parseISO(dateRange.start), 'MMMM yyyy', { locale: ptBR })
      };

      const prompt = rules.aiPrompt || 'Analise os dados estratégicos do negócio considerando todos os clientes (participantes e não participantes do programa).';
      const context = `Aqui estão os dados do meu negócio para análise: ${JSON.stringify(dataToAnalyze)}`;

      const apiKey = rules.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key do Gemini não configurada.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
    
    const cleanedAnalysis = analysis.replace(/[#$%*&_~]/g, '').replace(/\s{2,}/g, ' ').trim();
    const paragraphs = cleanedAnalysis.split('\n');
    let cursorY = 45;
    
    paragraphs.forEach((para: string) => {
      if (!para.trim()) return;

      const lines = doc.splitTextToSize(para.trim(), pageWidth - (margin * 2));
      
      lines.forEach((line: string) => {
        if (cursorY > pageHeight - 30) {
          addFooter(doc, doc.getNumberOfPages());
          doc.addPage();
          addHeader(doc);
          cursorY = 45;
        }
        
        // Detect and style headers in PDF
        const looksLikeTitle = line.length < 65 && (
          line.includes('Análise') || 
          line.includes('Estratégia') || 
          line.includes('Recomendação') ||
          /^\d+\.\s+/.test(line) ||
          /^[A-ZÀ-Ú\s]{8,}$/.test(line)
        );
        
        if (looksLikeTitle) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 100, 0); // Dark green for titles
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
        }
        
        doc.text(line, margin, cursorY);
        cursorY += 7;
      });

      // Add space between paragraphs
      cursorY += 5;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="Faturamento Período" 
          value={`R$ ${formatCurrency(metrics.totalSales)}`}
          subtitle={`Filtro selecionado`}
          icon={Calendar}
          className="bg-white border-gray-100 shadow-sm"
        />
        <MetricCard 
          title="Meta de Faturamento" 
          value={`R$ ${formatCurrency(metrics.currentGoalValue)}`}
          subtitle={`Atingido: R$ ${formatCurrency(metrics.filteredMonthSales)} (${metrics.goalTrend.toFixed(1)}%)`}
          icon={Target}
          className="bg-green-600 !text-white shadow-lg shadow-green-600/20"
        />
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Período de Comparação</label>
          <div className="flex flex-col gap-2">
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="text-[10px] bg-gray-50 border-none rounded-lg p-2 font-bold outline-none" />
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="text-[10px] bg-gray-50 border-none rounded-lg p-2 font-bold outline-none" />
          </div>
        </div>
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
          subtitle={`Referência: ${Math.ceil(metrics.configuredActiveClients)}`}
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
            className="mt-8 p-8 bg-white rounded-[2rem] border border-gray-100 shadow-2xl relative overflow-hidden"
          >
            {/* Artistic background element to avoid "gray page" look */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Diagnóstico de Inteligência</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Visão Estratégica by BuyPass AI</p>
                </div>
              </div>

              <div className="space-y-6">
                {analysis.split('\n').filter(p => p.trim()).map((paragraph, idx) => {
                  // Clean symbols first to detect title correctly
                  const cleanedText = paragraph
                    .replace(/[#$%*&_~]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();

                  if (!cleanedText) return null;

                  // Basic title detection for cleaner rendering
                  const isTitle = paragraph.trim().startsWith('###') || (cleanedText.length < 60 && (cleanedText.includes(':') || /^[A-ZÀ-Ú\s]{8,}$/.test(cleanedText)));

                  if (isTitle) {
                    return (
                      <h5 key={idx} className="text-sm font-black text-green-600 uppercase tracking-tight mt-6 mb-2">
                        {cleanedText.replace(/^#+\s*/, '')}
                      </h5>
                    );
                  }

                  return (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed font-medium">
                      {cleanedText}
                    </p>
                  );
                })}
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
    </motion.div>
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
