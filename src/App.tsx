import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Terminal, 
  Settings, 
  Activity, 
  Database, 
  BarChart3, 
  ExternalLink, 
  ChevronRight,
  Search,
  MoreHorizontal,
  Cloud,
  Github,
  GitBranch,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Shield,
  Users,
  Lock,
  Play,
  Square,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { App, ConfigVar, Release, LogEntry, Addon, AddonCatalogItem, ActivityEvent } from './types';
import { LogsPage } from './components/LogsPage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Database, label: 'Add-ons', path: '/addons' },
    { icon: Terminal, label: 'CLI', path: '/cli' },
    { icon: Shield, label: 'Admin', path: '/admin' },
  ];

  return (
    <div classname="w-64 bg-[#1a1a1a] text-gray-400 flex flex-col h-screen border-r border-white/10">
      <div classname="p-6 flex items-center gap-2">
        <div classname="w-8 h-8 bg-[#79589F] rounded flex items-center justify-center text-white font-bold">B</div>
        <span classname="text-white font-semibold text-lg">Bera Host</span>
      </div>
      <nav classname="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <link key="{item.path}" to="{item.path}" classname="{cn(" "flex="" items-center="" gap-3="" px-3="" py-2="" rounded-md="" transition-colors",="" location.pathname="==" item.path="" ?="" "bg-white="" 10="" text-white"="" :="" "hover:bg-white="" 5="" hover:text-white"="" )}="">
            <item.icon size="{18}"/>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div classname="p-4 border-t border-white/10 text-xs">
        <p>© 2026 Bera Host PaaS</p>
      </div>
    </div>
  );
};

const TopBar = ({ title, actions }: { title: string, actions?: React.ReactNode }) => {
  return (
    <header classname="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 classname="text-xl font-semibold text-gray-800">{title}</h1>
      <div classname="flex items-center gap-4">
        {actions}
        <div classname="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div classname="w-8 h-8 rounded-full bg-[#79589F] flex items-center justify-center text-white text-xs font-bold">KV</div>
          <span classname="text-sm font-medium text-gray-700">kingvon.kenya@gmail.com</span>
        </div>
      </div>
    </header>
  );
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete", 
  variant = "danger" 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  confirmText?: string,
  variant?: "danger" | "primary"
}) => {
  return (
    <animatepresence>
      {isOpen && (
        <div classname="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial="{{" opacity:="" 0="" }}="" animate="{{" opacity:="" 1="" }}="" exit="{{" opacity:="" 0="" }}="" onclick="{onClose}" classname="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <motion.div initial="{{" opacity:="" 0,="" scale:="" 0.95,="" y:="" 20="" }}="" animate="{{" opacity:="" 1,="" scale:="" 1,="" y:="" 0="" }}="" exit="{{" opacity:="" 0,="" scale:="" 0.95,="" y:="" 20="" }}="" classname="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div classname="p-6">
              <div classname="flex items-center gap-4 mb-4">
                <div classname="{cn(" "w-12="" h-12="" rounded-full="" flex="" items-center="" justify-center",="" variant="==" "danger"="" ?="" "bg-red-100="" text-red-600"="" :="" "bg-blue-100="" text-blue-600"="" )}="">
                  <alertcircle size="{24}"/>
                </div>
                <h3 classname="text-xl font-bold text-gray-900">{title}</h3>
              </div>
              <p classname="text-gray-600 leading-relaxed">{message}</p>
            </div>
            <div classname="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button onclick="{onClose}" classname="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button onclick="{()" ==""> {
                  onConfirm();
                  onClose();
                }}
                className={cn(
                  "px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg",
                  variant === "danger" ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-[#79589F] hover:bg-[#6a4d8c] shadow-purple-200"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [apps, setApps] = useState<app[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppRegion, setNewAppRegion] = useState('us');

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      setApps(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAppName, region: newAppRegion }),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setNewAppName('');
      fetchApps();
    }
  };

  return (
    <div classname="flex-1 flex flex-col bg-[#F5F7F9]">
      <topbar title="Personal Apps" actions="{" <button="" onclick="{()" ==""> setShowCreateModal(true)}
            className="bg-[#79589F] hover:bg-[#6a4d8c] text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
          >
            <plus size="{18}"/>
            New
          </button>
        } 
      />
      
      <main classname="p-8 max-w-6xl mx-auto w-full">
        <div classname="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div classname="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div classname="relative w-64">
              <search classname="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size="{16}"/>
              <input type="text" placeholder="Search apps..." classname="w-full pl-10 pr-4 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"/>
            </div>
          </div>
          
          <div classname="divide-y divide-gray-100">
            {loading ? (
              <div classname="p-8 text-center text-gray-500">Loading apps...</div>
            ) : apps.length === 0 ? (
              <div classname="p-12 text-center">
                <cloud classname="mx-auto text-gray-300 mb-4" size="{48}"/>
                <h3 classname="text-lg font-medium text-gray-900">No apps yet</h3>
                <p classname="text-gray-500 mt-1">Create your first application to get started.</p>
              </div>
            ) : (
              apps.map((app) => (
                <link key="{app.id}" to="{`/apps/${app.id}`}" classname="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                  <div classname="flex items-center gap-4">
                    <div classname="{cn(" "w-10="" h-10="" rounded="" flex="" items-center="" justify-center="" text-white="" font-bold",="" app.status="==" 'running'="" ?="" "bg-emerald-500"="" :="" "bg-gray-400"="" )}="">
                      {app.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 classname="font-semibold text-gray-900 group-hover:text-[#79589F] transition-colors">{app.name}</h3>
                      <div classname="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span classname="uppercase">{app.region}</span>
                        <span>•</span>
                        <span>Last updated {format(new Date(app.updated_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <chevronright classname="text-gray-300 group-hover:text-gray-400" size="{20}"/>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div classname="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div classname="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div classname="p-6 border-b border-gray-100">
              <h2 classname="text-xl font-semibold">Create New App</h2>
            </div>
            <form onsubmit="{handleCreateApp}" classname="p-6 space-y-4">
              <div>
                <label classname="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                <input type="text" required="" value="{newAppName}" onchange="{(e)" ==""> setNewAppName(e.target.value)}
                  placeholder="my-awesome-app"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                />
              </div>
              <div>
                <label classname="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select value="{newAppRegion}" onchange="{(e)" ==""> setNewAppRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                >
                  <option value="us">United States (Virginia)</option>
                  <option value="eu">Europe (Ireland)</option>
                </select>
              </div>
              <div classname="flex justify-end gap-3 pt-4">
                <button type="button" onclick="{()" ==""> setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button type="submit" classname="bg-[#79589F] hover:bg-[#6a4d8c] text-white px-6 py-2 rounded font-medium transition-colors">
                  Create App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AppDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [app, setApp] = useState<app |="" null="">(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchApp = async () => {
    const res = await fetch(`/api/apps/${id}`);
    if (res.ok) {
      const data = await res.json();
      setApp(data);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  if (loading) return <div classname="p-8">Loading...</div>;
  if (!app) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'resources', label: 'Resources', icon: Database },
    { id: 'deploy', label: 'Deploy', icon: Cloud },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div classname="flex-1 flex flex-col bg-[#F5F7F9]">
      <header classname="bg-white border-b border-gray-200">
        <div classname="px-8 py-4 flex items-center justify-between">
          <div classname="flex items-center gap-4">
            <div classname="w-10 h-10 bg-[#79589F] rounded flex items-center justify-center text-white font-bold">
              {app.name[0].toUpperCase()}
            </div>
            <div>
              <div classname="flex items-center gap-2">
                <h1 classname="text-xl font-semibold text-gray-900">{app.name}</h1>
                <span classname="{cn(" "px-2="" py-0.5="" rounded-full="" text-[10px]="" font-bold="" uppercase="" tracking-wider",="" app.status="==" 'running'="" ?="" "bg-emerald-100="" text-emerald-700"="" :="" "bg-gray-100="" text-gray-600"="" )}="">
                  {app.status}
                </span>
              </div>
              <p classname="text-xs text-gray-500 mt-0.5">Personal • {app.region.toUpperCase()}</p>
            </div>
          </div>
          <div classname="flex items-center gap-3">
            <a href="{`https://berahost.up.railway.app/${app.id}`}" target="_blank" rel="noreferrer" classname="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              Open app <externallink size="{14}"/>
            </a>
            <button classname="p-2 border border-gray-300 rounded hover:bg-gray-50">
              <morehorizontal size="{18}"/>
            </button>
          </div>
        </div>
        <nav classname="px-8 flex gap-8">
          {tabs.map((tab) => (
            <button key="{tab.id}" onclick="{()" ==""> setActiveTab(tab.id)}
              className={cn(
                "py-3 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-[#79589F] text-[#79589F]" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon size="{16}"/>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main classname="flex-1 p-8 overflow-y-auto">
        <div classname="max-w-6xl mx-auto">
          {activeTab === 'overview' && <overviewtab app="{app}"/>}
          {activeTab === 'resources' && <resourcestab app="{app}"/>}
          {activeTab === 'deploy' && <deploytab app="{app}" ondeploy="{fetchApp}"/>}
          {activeTab === 'metrics' && <metricstab app="{app}"/>}
          {activeTab === 'activity' && <activitytab app="{app}"/>}
          {activeTab === 'settings' && <settingstab app="{app}" ondelete="{()" ==""> navigate('/')} />}
        </div>
      </main>
    </div>
  );
};

// --- Tab Components ---

const OverviewTab = ({ app }: { app: App }) => {
  return (
    <div classname="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div classname="md:col-span-2 space-y-6">
        <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Dyno formation</h3>
          <div classname="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100">
            <div classname="flex items-center gap-4">
              <div classname="bg-blue-100 text-blue-600 p-2 rounded">
                <cloud size="{20}"/>
              </div>
              <div>
                <p classname="font-medium text-gray-900">web</p>
                <p classname="text-xs text-gray-500">node index.js</p>
              </div>
            </div>
            <div classname="text-right">
              <p classname="font-semibold text-gray-900">1 x Free Dyno</p>
              <p classname="text-xs text-gray-500">Standard-1X</p>
            </div>
          </div>
        </div>

        <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Activity</h3>
          <activitytab app="{app}" compact=""/>
        </div>
      </div>

      <div classname="space-y-6">
        <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">App Info</h3>
          <div classname="space-y-4">
            <div>
              <p classname="text-xs text-gray-500">Framework</p>
              <p classname="text-sm font-medium">Node.js</p>
            </div>
            <div>
              <p classname="text-xs text-gray-500">Region</p>
              <p classname="text-sm font-medium uppercase">{app.region}</p>
            </div>
            <div>
              <p classname="text-xs text-gray-500">Stack</p>
              <p classname="text-sm font-medium">Bera-22</p>
            </div>
          </div>
        </div>
        
        <link to="{`/apps/${app.id}/logs`}" classname="block w-full text-center py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
          <terminal size="{18}"/>
          View Logs
        </Link>
      </div>
    </div>
  );
};

const ResourcesTab = ({ app }: { app: App }) => {
  const [addons, setAddons] = useState<addon[]>([]);
  const [catalog, setCatalog] = useState<addoncatalogitem[]>([]);
  const [showMarketplace, setShowMarketplace] = useState(false);

  const fetchData = async () => {
    const [addonsRes, catalogRes] = await Promise.all([
      fetch(`/api/apps/${app.id}/addons`),
      fetch('/api/addons/catalog')
    ]);
    setAddons(await addonsRes.json());
    setCatalog(await catalogRes.json());
  };

  useEffect(() => {
    fetchData();
  }, [app.id]);

  const handleProvision = async (addonId: string) => {
    await fetch(`/api/apps/${app.id}/addons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonId }),
    });
    setShowMarketplace(false);
    fetchData();
  };

  return (
    <div classname="space-y-6">
      <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 classname="font-semibold text-gray-900">Add-ons</h3>
          <button onclick="{()" ==""> setShowMarketplace(true)}
            className="text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium"
          >
            Find more add-ons
          </button>
        </div>
        
        {addons.length === 0 ? (
          <div classname="p-12 text-center">
            <database classname="mx-auto text-gray-300 mb-4" size="{48}"/>
            <p classname="text-gray-500">No add-ons provisioned for this app.</p>
            <button onclick="{()" ==""> setShowMarketplace(true)}
              className="mt-4 px-6 py-2 bg-gray-50 border border-gray-200 rounded font-medium hover:bg-gray-100 transition-colors"
            >
              Configure Add-ons
            </button>
          </div>
        ) : (
          <div classname="divide-y divide-gray-100">
            {addons.map((addon) => (
              <div key="{addon.id}" classname="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div classname="flex items-center gap-4">
                  <div classname="bg-purple-100 text-purple-600 p-2 rounded">
                    <database size="{20}"/>
                  </div>
                  <div>
                    <p classname="font-medium text-gray-900">{addon.name}</p>
                    <p classname="text-xs text-gray-500">{addon.plan} • {addon.status}</p>
                  </div>
                </div>
                <button classname="text-sm text-gray-400 hover:text-gray-600">Settings</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMarketplace && (
        <div classname="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div classname="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div classname="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 classname="text-xl font-semibold">Add-ons Marketplace</h2>
              <button onclick="{()" ==""> setShowMarketplace(false)} className="text-gray-400 hover:text-gray-600">
                <plus classname="rotate-45" size="{24}"/>
              </button>
            </div>
            <div classname="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {catalog.map((item) => (
                <div key="{item.id}" classname="p-4 border border-gray-200 rounded-lg hover:border-[#79589F] transition-colors group">
                  <div classname="flex items-start justify-between mb-3">
                    <div classname="bg-gray-100 p-2 rounded group-hover:bg-purple-50 transition-colors">
                      {item.icon === 'database' && <database size="{20}" classname="text-gray-600 group-hover:text-[#79589F]"/>}
                      {item.icon === 'zap' && <refreshcw size="{20}" classname="text-gray-600 group-hover:text-[#79589F]"/>}
                      {item.icon === 'terminal' && <terminal size="{20}" classname="text-gray-600 group-hover:text-[#79589F]"/>}
                    </div>
                    <button onclick="{()" ==""> handleProvision(item.id)}
                      className="text-xs font-bold text-[#79589F] uppercase hover:underline"
                    >
                      Install
                    </button>
                  </div>
                  <h4 classname="font-semibold text-gray-900">{item.name}</h4>
                  <p classname="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DeployTab = ({ app, onDeploy }: { app: App, onDeploy: () => void }) => {
  const [deployMethod, setDeployMethod] = useState<'git' | 'github' | 'url'>('url');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isDeploying, setIsDeploying] = useState(false);
  const [releases, setReleases] = useState<release[]>([]);
  const [buildLogs, setBuildLogs] = useState<logentry[]>([]);
  const logEndRef = useRef<htmldivelement>(null);

  const [lastLiveUrl, setLastLiveUrl] = useState<string |="" null="">(null);

  const fetchReleases = async () => {
    const res = await fetch(`/api/apps/${app.id}/releases`);
    const data = await res.json();
    setReleases(data);
  };

  useEffect(() => {
    fetchReleases();
  }, [app.id]);

  useEffect(() => {
    if (isDeploying && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [buildLogs, isDeploying]);

  const handleDeploy = async () => {
    setBuildLogs([]);
    setIsDeploying(true);
    
    // Setup WebSocket for build logs
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'log' && message.data.appId === app.id && message.data.source === 'build') {
        setBuildLogs(prev => [...prev, message.data]);
        if (message.data.content.includes("App is live")) {
          const urlMatch = message.data.content.match(/https:\/\/[^\s]+/);
          if (urlMatch) setLastLiveUrl(urlMatch[0]);
          setTimeout(() => {
            setIsDeploying(false);
            onDeploy();
            fetchReleases();
            socket.close();
          }, 2000);
        }
      }
    };

    const res = await fetch(`/api/apps/${app.id}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, branch }),
    });
    
    if (!res.ok) {
      setIsDeploying(false);
      socket.close();
    }
  };

  return (
    <div classname="space-y-8">
      <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-gray-100">
          <h3 classname="font-semibold text-gray-900">Deployment method</h3>
        </div>
        <div classname="flex border-b border-gray-100">
          <button onclick="{()" ==""> setDeployMethod('github')}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-2 border-r border-gray-100 transition-colors",
              deployMethod === 'github' ? "bg-gray-50" : "hover:bg-gray-50/50"
            )}
          >
            <github size="{24}" classname="{deployMethod" =="=" 'github'="" ?="" "text-gray-900"="" :="" "text-gray-400"}=""/>
            <span classname="{cn(&#34;text-sm" font-medium",="" deploymethod="==" 'github'="" ?="" "text-gray-900"="" :="" "text-gray-500")}="">GitHub</span>
          </button>
          <button onclick="{()" ==""> setDeployMethod('url')}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-2 border-r border-gray-100 transition-colors",
              deployMethod === 'url' ? "bg-gray-50" : "hover:bg-gray-50/50"
            )}
          >
            <cloud size="{24}" classname="{deployMethod" =="=" 'url'="" ?="" "text-gray-900"="" :="" "text-gray-400"}=""/>
            <span classname="{cn(&#34;text-sm" font-medium",="" deploymethod="==" 'url'="" ?="" "text-gray-900"="" :="" "text-gray-500")}="">Public Git URL</span>
          </button>
          <button onclick="{()" ==""> setDeployMethod('git')}
            className={cn(
              "flex-1 py-4 flex flex-col items-center gap-2 transition-colors",
              deployMethod === 'git' ? "bg-gray-50" : "hover:bg-gray-50/50"
            )}
          >
            <terminal size="{24}" classname="{deployMethod" =="=" 'git'="" ?="" "text-gray-900"="" :="" "text-gray-400"}=""/>
            <span classname="{cn(&#34;text-sm" font-medium",="" deploymethod="==" 'git'="" ?="" "text-gray-900"="" :="" "text-gray-500")}="">Bera Git</span>
          </button>
        </div>

        <div classname="p-8">
          {deployMethod === 'url' && (
            <div classname="max-w-2xl mx-auto space-y-6">
              <div classname="text-center">
                <h4 classname="text-lg font-medium text-gray-900">Deploy from Public Git URL</h4>
                <p classname="text-sm text-gray-500 mt-1">Paste any public HTTPS Git repository URL to deploy instantly.</p>
              </div>
              <div classname="space-y-4">
                <div>
                  <label classname="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                  <input type="text" value="{repoUrl}" onchange="{(e)" ==""> setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                  />
                </div>
                <div>
                  <label classname="block text-sm font-medium text-gray-700 mb-1">Branch (optional)</label>
                  <div classname="flex items-center gap-2">
                    <gitbranch size="{16}" classname="text-gray-400"/>
                    <input type="text" value="{branch}" onchange="{(e)" ==""> setBranch(e.target.value)}
                      placeholder="main"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                    />
                  </div>
                </div>
                <button onclick="{handleDeploy}" disabled="{isDeploying" ||="" !repourl}="" classname="w-full bg-[#79589F] hover:bg-[#6a4d8c] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  {isDeploying ? <refreshcw classname="animate-spin" size="{20}"/> : <upload size="{20}"/>}
                  {isDeploying ? "Deploying..." : "Deploy Branch"}
                </button>
              </div>

              <animatepresence>
                {lastLiveUrl && !isDeploying && (
                  <motion.div initial="{{" opacity:="" 0,="" y:="" 10="" }}="" animate="{{" opacity:="" 1,="" y:="" 0="" }}="" exit="{{" opacity:="" 0,="" y:="" 10="" }}="" classname="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                    <div classname="flex items-center gap-3">
                      <div classname="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <externallink size="{20}"/>
                      </div>
                      <div>
                        <h4 classname="text-sm font-semibold text-emerald-900">Deployment Successful!</h4>
                        <p classname="text-xs text-emerald-700">Your app is now live at the URL below.</p>
                      </div>
                    </div>
                    <a href="{lastLiveUrl}" target="_blank" rel="noreferrer" classname="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-colors">
                      Open App
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {isDeploying && (
                <div classname="mt-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
                  <div classname="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                    <div classname="flex items-center gap-2">
                      <div classname="w-3 h-3 rounded-full bg-red-500"/>
                      <div classname="w-3 h-3 rounded-full bg-yellow-500"/>
                      <div classname="w-3 h-3 rounded-full bg-green-500"/>
                    </div>
                    <span classname="text-xs text-gray-400 font-mono">build-log --app {app.name}</span>
                  </div>
                  <div classname="p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto space-y-1">
                    {buildLogs.length === 0 ? (
                      <div classname="text-gray-500 italic">Initializing build environment...</div>
                    ) : (
                      buildLogs.map((log, i) => (
                        <div key="{i}" classname="flex gap-2">
                          <span classname="text-gray-600 shrink-0">{i + 1}</span>
                          <span classname="break-all">{log.content}</span>
                        </div>
                      ))
                    )}
                    <div ref="{logEndRef}"/>
                  </div>
                </div>
              )}
            </div>
          )}

          {deployMethod === 'git' && (
            <div classname="max-w-2xl mx-auto space-y-4">
              <h4 classname="font-medium text-gray-900">Deploy with Bera Git</h4>
              <p classname="text-sm text-gray-500">Use the Bera CLI to push your code directly to our servers.</p>
              <div classname="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm space-y-2">
                <p>$ bera login</p>
                <p>$ bera git:remote -a {app.name}</p>
                <p>$ git push bera main</p>
              </div>
            </div>
          )}

          {deployMethod === 'github' && (
            <div classname="text-center py-8">
              <github size="{48}" classname="mx-auto text-gray-300 mb-4"/>
              <h4 classname="font-medium text-gray-900">Connect to GitHub</h4>
              <p classname="text-sm text-gray-500 mt-1">Authorize Bera Host to access your repositories.</p>
              <button classname="mt-6 px-6 py-2 bg-gray-900 text-white rounded font-medium hover:bg-black transition-colors flex items-center gap-2 mx-auto">
                <github size="{18}"/> Connect to GitHub
              </button>
            </div>
          )}
        </div>
      </div>

      <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-gray-100">
          <h3 classname="font-semibold text-gray-900">Build history</h3>
        </div>
        <div classname="divide-y divide-gray-100">
          {releases.length === 0 ? (
            <div classname="p-8 text-center text-gray-500">No builds yet.</div>
          ) : (
            releases.map((release) => (
              <div key="{release.id}" classname="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div classname="flex items-center gap-4">
                  <div classname="{cn(" "w-2="" h-2="" rounded-full",="" release.status="==" 'succeeded'="" ?="" "bg-emerald-500"="" :="" "bg-red-500"="" )}=""/>
                  <div>
                    <p classname="font-medium text-gray-900">v{release.version} - {release.description}</p>
                    <p classname="text-xs text-gray-500">{format(new Date(release.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <button classname="text-sm text-[#79589F] font-medium hover:underline">View build log</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const MetricsTab = ({ app }: { app: App }) => {
  // Mock data for charts
  const data = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    responseTime: Math.floor(Math.random() * 200) + 100,
    requests: Math.floor(Math.random() * 50) + 10,
    memory: Math.floor(Math.random() * 100) + 200,
  }));

  return (
    <div classname="space-y-8">
      <div classname="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Response Time (ms)</h3>
          <div classname="h-64">
            <responsivecontainer width="100%" height="100%">
              <areachart data="{data}">
                <defs>
                  <lineargradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopcolor="#79589F" stopopacity="{0.1}/">
                    <stop offset="95%" stopcolor="#79589F" stopopacity="{0}/">
                  </linearGradient>
                </defs>
                <cartesiangrid strokedasharray="3 3" vertical="{false}" stroke="#f0f0f0"/>
                <xaxis datakey="time" hide=""/>
                <yaxis hide=""/>
                <tooltip/>
                <area type="monotone" datakey="responseTime" stroke="#79589F" fillopacity="{1}" fill="url(#colorRes)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Throughput (req/s)</h3>
          <div classname="h-64">
            <responsivecontainer width="100%" height="100%">
              <linechart data="{data}">
                <cartesiangrid strokedasharray="3 3" vertical="{false}" stroke="#f0f0f0"/>
                <xaxis datakey="time" hide=""/>
                <yaxis hide=""/>
                <tooltip/>
                <line type="monotone" datakey="requests" stroke="#10b981" strokewidth="{2}" dot="{false}"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 classname="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Memory Usage (MB)</h3>
        <div classname="h-64">
          <responsivecontainer width="100%" height="100%">
            <areachart data="{data}">
              <cartesiangrid strokedasharray="3 3" vertical="{false}" stroke="#f0f0f0"/>
              <xaxis datakey="time" hide=""/>
              <yaxis hide=""/>
              <tooltip/>
              <area type="monotone" datakey="memory" stroke="#3b82f6" fill="#3b82f6" fillopacity="{0.1}"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ActivityTab = ({ app, compact }: { app: App, compact?: boolean }) => {
  const [events, setEvents] = useState<activityevent[]>([]);

  useEffect(() => {
    fetch(`/api/apps/${app.id}/activity`)
      .then(res => res.json())
      .then(setEvents);
  }, [app.id]);

  return (
    <div classname="space-y-4">
      {events.length === 0 ? (
        <p classname="text-sm text-gray-500 text-center py-4">No activity recorded yet.</p>
      ) : (
        events.map((event) => (
          <div key="{event.id}" classname="flex gap-4">
            <div classname="flex flex-col items-center">
              <div classname="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                {event.action.includes('deploy') ? <refreshcw size="{14}"/> : <database size="{14}"/>}
              </div>
              <div classname="flex-1 w-px bg-gray-200 my-1"/>
            </div>
            <div classname="pb-4">
              <div classname="flex items-center gap-2">
                <p classname="text-sm font-medium text-gray-900">
                  {event.description}
                </p>
                <span classname="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                  {event.action}
                </span>
              </div>
              <p classname="text-xs text-gray-500 mt-0.5">
                by {event.actor} • {format(new Date(event.timestamp), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const SettingsTab = ({ app, onDelete }: { app: App, onDelete: () => void }) => {
  const [configVars, setConfigVars] = useState<configvar[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showReleaseToast, setShowReleaseToast] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchConfig = async () => {
    const res = await fetch(`/api/apps/${app.id}/config`);
    const data = await res.json();
    setConfigVars(data);
  };

  useEffect(() => {
    fetchConfig();
  }, [app.id]);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    
    const res = await fetch(`/api/apps/${app.id}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey, value: newValue }),
    });
    
    if (res.ok) {
      setNewKey('');
      setNewValue('');
      fetchConfig();
      setShowReleaseToast(true);
      setTimeout(() => setShowReleaseToast(false), 5000);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    const res = await fetch(`/api/config/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchConfig();
      setShowReleaseToast(true);
      setTimeout(() => setShowReleaseToast(false), 5000);
    }
  };

  const handleDeleteApp = async () => {
    await fetch(`/api/apps/${app.id}`, { method: 'DELETE' });
    onDelete();
  };

  return (
    <div classname="space-y-8 relative">
      <animatepresence>
        {showReleaseToast && (
          <motion.div initial="{{" opacity:="" 0,="" y:="" 20="" }}="" animate="{{" opacity:="" 1,="" y:="" 0="" }}="" exit="{{" opacity:="" 0,="" y:="" 20="" }}="" classname="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 z-50 border border-white/10">
            <div classname="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            <div>
              <p classname="text-sm font-bold">New Release Created</p>
              <p classname="text-xs text-gray-400">Config var changes triggered a new release.</p>
            </div>
            <button onclick="{()" ==""> setShowReleaseToast(false)} className="ml-4 text-gray-500 hover:text-white">
              <x size="{16}"/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 classname="font-semibold text-gray-900">Config Vars</h3>
            <p classname="text-xs text-gray-500 mt-1">Environment variables for your application.</p>
          </div>
          <button onclick="{()" ==""> setIsRevealed(!isRevealed)}
            className="text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium flex items-center gap-2"
          >
            {isRevealed ? <eyeoff size="{16}"/> : <eye size="{16}"/>}
            {isRevealed ? 'Hide Config Vars' : 'Reveal Config Vars'}
          </button>
        </div>
        <div classname="overflow-x-auto">
          <table classname="w-full text-left border-collapse">
            <thead>
              <tr classname="bg-gray-50 border-b border-gray-100">
                <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Key</th>
                <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody classname="divide-y divide-gray-100">
              {configVars.map((v) => (
                <tr key="{v.id}" classname="group hover:bg-gray-50/50 transition-colors">
                  <td classname="px-6 py-4">
                    <span classname="font-mono text-sm font-semibold text-gray-700">{v.key}</span>
                  </td>
                  <td classname="px-6 py-4">
                    <div classname="flex items-center gap-2">
                      <input readonly="" type="{isRevealed" ?="" "text"="" :="" "password"}="" value="{v.value}" classname="flex-1 bg-transparent border-none p-0 text-sm font-mono text-gray-600 focus:ring-0"/>
                    </div>
                  </td>
                  <td classname="px-6 py-4 text-right">
                    <button onclick="{()" ==""> handleDeleteConfig(v.id)} 
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <trash2 size="{16}"/>
                    </button>
                  </td>
                </tr>
              ))}
              <tr classname="bg-gray-50/30">
                <td classname="px-6 py-4" colspan="{3}">
                  <form onsubmit="{handleAddConfig}" classname="flex gap-4">
                    <input placeholder="KEY (e.g. API_KEY)" value="{newKey}" onchange="{e" ==""> setNewKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 bg-white" 
                    />
                    <input placeholder="VALUE" value="{newValue}" onchange="{e" ==""> setNewValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 bg-white" 
                    />
                    <button type="submit" disabled="{!newKey" ||="" !newvalue}="" classname="bg-gray-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors">
                      Add
                    </button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-gray-100">
          <h3 classname="font-semibold text-gray-900">Domains</h3>
        </div>
        <div classname="p-6">
          <div classname="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
            <span classname="text-sm font-medium text-gray-700">berahost.up.railway.app/{app.id}</span>
            <span classname="text-xs text-gray-500 uppercase">Default</span>
          </div>
          <button classname="mt-4 text-[#79589F] hover:text-[#6a4d8c] text-sm font-medium">Add domain</button>
        </div>
      </section>

      <section classname="bg-red-50 rounded-lg border border-red-100 shadow-sm overflow-hidden">
        <div classname="p-6 border-b border-red-100">
          <h3 classname="font-semibold text-red-800">Danger Zone</h3>
        </div>
        <div classname="p-6 flex items-center justify-between">
          <div>
            <h4 classname="font-medium text-gray-900">Delete this app</h4>
            <p classname="text-sm text-gray-500">Once deleted, your app and all its data are gone forever.</p>
          </div>
          <button onclick="{()" ==""> setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Delete App
          </button>
        </div>
      </section>

      <confirmationmodal isopen="{showDeleteModal}" onclose="{()" ==""> setShowDeleteModal(false)}
        onConfirm={handleDeleteApp}
        title="Delete Application"
        message={`Are you sure you want to delete "${app.name}"? This action is permanent and will delete all associated data, including config vars, releases, and logs.`}
      />
    </div>
  );
};

const CLIPage = () => {
  return (
    <div classname="flex-1 flex flex-col bg-[#F5F7F9]">
      <topbar title="CLI Documentation"/>
      <main classname="p-8 max-w-4xl mx-auto w-full space-y-8">
        <section classname="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <h2 classname="text-2xl font-bold text-gray-900 mb-4">The Bera CLI</h2>
          <p classname="text-gray-600 mb-6">
            The Bera CLI is the primary tool for managing your applications from the command line. 
            It allows you to create apps, manage configuration, view logs, and scale your dynos.
          </p>
          
          <div classname="space-y-6">
            <div>
              <h3 classname="text-lg font-semibold mb-2">Installation</h3>
              <div classname="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                $ npm install -g bera-cli
              </div>
            </div>

            <div>
              <h3 classname="text-lg font-semibold mb-2">Basic Commands</h3>
              <div classname="space-y-4">
                <div classname="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span classname="font-mono text-sm font-bold text-[#79589F]">bera login</span>
                  <span classname="col-span-2 text-sm text-gray-600">Log in to your Bera Host account</span>
                </div>
                <div classname="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span classname="font-mono text-sm font-bold text-[#79589F]">bera create [name]</span>
                  <span classname="col-span-2 text-sm text-gray-600">Create a new application</span>
                </div>
                <div classname="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span classname="font-mono text-sm font-bold text-[#79589F]">bera logs --tail</span>
                  <span classname="col-span-2 text-sm text-gray-600">Stream real-time logs</span>
                </div>
                <div classname="grid grid-cols-3 gap-4 border-b border-gray-100 pb-2">
                  <span classname="font-mono text-sm font-bold text-[#79589F]">bera ps:scale web=2</span>
                  <span classname="col-span-2 text-sm text-gray-600">Scale your web dynos</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [email, setEmail] = useState('admin@berahost.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div classname="min-h-screen flex items-center justify-center bg-[#F5F7F9] p-4">
      <motion.div initial="{{" opacity:="" 0,="" y:="" 20="" }}="" animate="{{" opacity:="" 1,="" y:="" 0="" }}="" classname="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        <div classname="flex flex-col items-center mb-8">
          <div classname="w-12 h-12 bg-[#79589F] rounded-lg flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-200">
            <shield size="{24}"/>
          </div>
          <h2 classname="text-2xl font-bold text-gray-900">Admin Access</h2>
          <p classname="text-sm text-gray-500 mt-1 text-center">Enter your credentials to manage the platform</p>
        </div>

        <form onsubmit="{handleSubmit}" classname="space-y-4">
          {error && (
            <div classname="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <alertcircle size="{16}"/>
              {error}
            </div>
          )}
          
          <div>
            <label classname="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
            <div classname="relative">
              <users classname="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size="{16}"/>
              <input type="email" required="" value="{email}" onchange="{e" ==""> setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 transition-all"
                placeholder="admin@berahost.com"
              />
            </div>
          </div>

          <div>
            <label classname="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <div classname="relative">
              <lock classname="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size="{16}"/>
              <input type="password" required="" value="{password}" onchange="{e" ==""> setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled="{loading}" classname="w-full bg-[#79589F] hover:bg-[#6a4d8c] text-white py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loading ? <refreshcw classname="animate-spin" size="{18}"/> : <shield size="{18}"/>}
            {loading ? 'Authenticating...' : 'Sign In to Admin'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminPanel = () => {
  const [token, setToken] = useState<string |="" null="">(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<app[]>([]);
  const [catalog, setCatalog] = useState<addoncatalogitem[]>([]);
  const [activity, setActivity] = useState<activityevent[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleLogin = (newToken: string) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, appsRes, catalogRes, activityRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/apps', { headers }),
        fetch('/api/addons/catalog', { headers }),
        fetch('/api/admin/activity', { headers }),
        fetch('/api/admin/users', { headers })
      ]);

      if (statsRes.status === 401) return handleLogout();

      setStats(await statsRes.json());
      setApps(await appsRes.json());
      setCatalog(await catalogRes.json());
      setActivity(await activityRes.json());
      setUsers(await usersRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAppAction = async (appId: string, action: 'start' | 'stop' | 'delete') => {
    const performAction = async () => {
      const method = action === 'delete' ? 'DELETE' : 'POST';
      const url = `/api/admin/apps/${appId}${action === 'delete' ? '' : '/' + action}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) fetchData();
    };

    if (action === 'delete') {
      const app = apps.find(a => a.id === appId);
      setConfirmModal({
        isOpen: true,
        title: "Delete Application",
        message: `Are you sure you want to delete "${app?.name || appId}"? This action is permanent and will delete all associated data.`,
        onConfirm: performAction
      });
    } else {
      performAction();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to delete the user "${user?.email || userId}"? They will lose access to all their applications and data.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchData();
      }
    });
  };

  const [newAddon, setNewAddon] = useState({
    id: '',
    name: '',
    description: '',
    category: 'Data Store',
    icon: 'database'
  });

  const handleAddCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newAddon),
    });
    if (res.ok) {
      setNewAddon({ id: '', name: '', description: '', category: 'Data Store', icon: 'database' });
      fetchData();
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    const item = catalog.find(i => i.id === id);
    setConfirmModal({
      isOpen: true,
      title: "Remove from Catalog",
      message: `Are you sure you want to remove "${item?.name || id}" from the add-ons catalog?`,
      onConfirm: async () => {
        await fetch(`/api/admin/catalog/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
      }
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'apps', label: 'Applications', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'catalog', label: 'Catalog', icon: Database },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  if (!token) return <adminlogin onlogin="{handleLogin}"/>;

  return (
    <div classname="flex-1 flex flex-col bg-[#F5F7F9]">
      <topbar title="Admin Control Center" actions="{" <button="" onclick="{handleLogout}" classname="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
            <logout size="{16}"/> Logout
          </button>
        }
      />
      
      <div classname="bg-white border-b border-gray-200 px-8">
        <nav classname="flex gap-8">
          {tabs.map((tab) => (
            <button key="{tab.id}" onclick="{()" ==""> setActiveTab(tab.id)}
              className={cn(
                "py-4 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "border-[#79589F] text-[#79589F]" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon size="{16}"/>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main classname="flex-1 p-8 overflow-y-auto">
        <div classname="max-w-6xl mx-auto">
          {loading ? (
            <div classname="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
              <refreshcw classname="animate-spin text-[#79589F]" size="{32}"/>
              <p classname="text-sm font-medium">Synchronizing platform data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats && (
                <div classname="space-y-6">
                  <div classname="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <p classname="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Apps</p>
                      <p classname="text-3xl font-bold text-gray-900">{stats.totalApps}</p>
                    </div>
                    <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <p classname="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Running</p>
                      <p classname="text-3xl font-bold text-emerald-600">{stats.runningApps}</p>
                    </div>
                    <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <p classname="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Users</p>
                      <p classname="text-3xl font-bold text-orange-600">{stats.totalUsers}</p>
                    </div>
                    <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <p classname="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Releases</p>
                      <p classname="text-3xl font-bold text-[#79589F]">{stats.totalReleases}</p>
                    </div>
                    <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <p classname="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Add-ons</p>
                      <p classname="text-3xl font-bold text-blue-600">{stats.totalAddons}</p>
                    </div>
                  </div>

                  <div classname="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                    <h3 classname="font-semibold text-gray-900 mb-6">Platform Health</h3>
                    <div classname="space-y-4">
                      <div classname="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div classname="flex items-center gap-3">
                          <div classname="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                          <span classname="text-sm font-medium text-emerald-900">All systems operational</span>
                        </div>
                        <span classname="text-xs text-emerald-700">99.99% Uptime</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'apps' && (
                <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <table classname="w-full text-left border-collapse">
                    <thead>
                      <tr classname="bg-gray-50 border-b border-gray-100">
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">App Name</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Region</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody classname="divide-y divide-gray-100">
                      {apps.map((app) => (
                        <tr key="{app.id}" classname="hover:bg-gray-50 transition-colors">
                          <td classname="px-6 py-4">
                            <script type='text/javascript' nonce='Z6ZQymRd2AJv6uN5ykVqIA==' src='https://aistudio.google.com/9ru9eXZ24zNO1VPvM_Do5z2hESJqtQm8oZ555bskzEhhXww-fjIkhFh2cfuKeXI9f6IwaX7_lIvydv7fklajKIswvT-pUVXM8dFjiMZvnMJcftVoh1RTubZ5VWRpTIpTik5OYWzcd7ayxxoHduVi0u4jFl0pS0AF3x8Xg3OSq3mCgPnWlN-LIFhoKDSDj-srk75QGe49zbamw6MrGG9gl4x99bpikpILSAJD4NHR3k2H9HgqIWVTlf2fGpNTtgFhRn7X31TdCf0Ku0jtwdnkFeCipJdmX9YWbqhv_aWzlv12CnzdRxqirz6UU5vN69QIlBI8jHrGC34T_XUGzv9BvBWZAGz5UOZgmR-_KSIY91xDfWdts2OflixJNWdwhXjEIrns2YKSy4UBy732OdExz8v4DeRJk2UZ9jJHhuK2iH0V6xDMCDcLtAq4fXLHHGrVu8Ay1MKYKqHf3Z-oVyqG4XsnQubc-hkvsEtdN2L6RvvIjoxDXnXu-tV6m_9BkgHvlGmOpqFcKl8u5diT3oWZO_uG9TZWj39kuIVwYeOH-A3GqPJMRX7EQ3UkRMg_zNrGITEOeJ6dfvzgSsT4Q5vxdI3nhsLl_0nuE80UDTCr3uZo3phngg'></script><link to="{`/apps/${app.id}`}" classname="font-semibold text-[#79589F] hover:underline">{app.name}</Link>
                            <p classname="text-[10px] font-mono text-gray-400">{app.id}</p>
                          </td>
                          <td classname="px-6 py-4">
                            <span classname="{cn(" "px-2="" py-0.5="" rounded-full="" text-[10px]="" font-bold="" uppercase="" tracking-wider",="" app.status="==" 'running'="" ?="" "bg-emerald-100="" text-emerald-700"="" :="" "bg-gray-100="" text-gray-600"="" )}="">
                              {app.status}
                            </span>
                          </td>
                          <td classname="px-6 py-4 text-sm uppercase text-gray-600">{app.region}</td>
                          <td classname="px-6 py-4">
                            <div classname="flex items-center gap-2">
                              {app.status === 'running' ? (
                                <button onclick="{()" ==""> handleAppAction(app.id, 'stop')}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-all"
                                  title="Stop App"
                                >
                                  <square size="{16}"/>
                                </button>
                              ) : (
                                <button onclick="{()" ==""> handleAppAction(app.id, 'start')}
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                  title="Start App"
                                >
                                  <play size="{16}"/>
                                </button>
                              )}
                              <button onclick="{()" ==""> handleAppAction(app.id, 'delete')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                title="Delete App"
                              >
                                <trash2 size="{16}"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'users' && (
                <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <table classname="w-full text-left border-collapse">
                    <thead>
                      <tr classname="bg-gray-50 border-b border-gray-100">
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                        <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
                      </tr>
                    </thead>
                    <tbody classname="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key="{u.id}" classname="hover:bg-gray-50 transition-colors">
                          <td classname="px-6 py-4">
                            <p classname="text-sm font-medium text-gray-900">{u.email}</p>
                            <p classname="text-[10px] font-mono text-gray-400">{u.id}</p>
                          </td>
                          <td classname="px-6 py-4">
                            <span classname="{cn(" "px-2="" py-0.5="" rounded-full="" text-[10px]="" font-bold="" uppercase="" tracking-wider",="" u.role="==" 'admin'="" ?="" "bg-purple-100="" text-purple-700"="" :="" "bg-blue-100="" text-blue-700"="" )}="">
                              {u.role}
                            </span>
                          </td>
                          <td classname="px-6 py-4 text-sm text-gray-500">
                            {format(new Date(u.created_at), 'MMM d, yyyy')}
                          </td>
                          <td classname="px-6 py-4 text-right">
                            <button onclick="{()" ==""> handleDeleteUser(u.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <trash2 size="{16}"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'catalog' && (
                <div classname="space-y-6">
                  <div classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 classname="font-semibold text-gray-900 mb-4">Add New Catalog Item</h3>
                    <form onsubmit="{handleAddCatalog}" classname="grid grid-cols-2 gap-4">
                      <input placeholder="ID (e.g. bera-mysql)" value="{newAddon.id}" onchange="{e" ==""> setNewAddon({...newAddon, id: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                      />
                      <input placeholder="Name" value="{newAddon.name}" onchange="{e" ==""> setNewAddon({...newAddon, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                      />
                      <input placeholder="Description" value="{newAddon.description}" onchange="{e" ==""> setNewAddon({...newAddon, description: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20 col-span-2"
                      />
                      <select value="{newAddon.category}" onchange="{e" ==""> setNewAddon({...newAddon, category: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                      >
                        <option>Data Store</option>
                        <option>Caching</option>
                        <option>Logging</option>
                        <option>Monitoring</option>
                      </select>
                      <select value="{newAddon.icon}" onchange="{e" ==""> setNewAddon({...newAddon, icon: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#79589F]/20"
                      >
                        <option value="database">Database Icon</option>
                        <option value="zap">Zap Icon</option>
                        <option value="terminal">Terminal Icon</option>
                      </select>
                      <button classname="bg-[#79589F] text-white px-6 py-2 rounded font-medium hover:bg-[#6a4d8c] transition-colors col-span-2">
                        Add to Catalog
                      </button>
                    </form>
                  </div>

                  <div classname="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table classname="w-full text-left border-collapse">
                      <thead>
                        <tr classname="bg-gray-50 border-b border-gray-100">
                          <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                          <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                          <th classname="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
                        </tr>
                      </thead>
                      <tbody classname="divide-y divide-gray-100">
                        {catalog.map((item) => (
                          <tr key="{item.id}" classname="hover:bg-gray-50 transition-colors">
                            <td classname="px-6 py-4">
                              <div classname="flex items-center gap-3">
                                <div classname="w-8 h-8 bg-purple-50 rounded flex items-center justify-center text-[#79589F]">
                                  {item.icon === 'database' && <database size="{16}"/>}
                                  {item.icon === 'zap' && <refreshcw size="{16}"/>}
                                  {item.icon === 'terminal' && <terminal size="{16}"/>}
                                </div>
                                <span classname="font-semibold text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td classname="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                            <td classname="px-6 py-4 font-mono text-xs text-gray-500">{item.id}</td>
                            <td classname="px-6 py-4 text-right">
                              <button onclick="{()" ==""> handleDeleteCatalog(item.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <trash2 size="{16}"/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div classname="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <div classname="space-y-6">
                    {activity.map((event) => (
                      <div key="{event.id}" classname="flex gap-4">
                        <div classname="flex flex-col items-center">
                          <div classname="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            {event.action.includes('deploy') ? <refreshcw size="{18}"/> : <database size="{18}"/>}
                          </div>
                          <div classname="flex-1 w-px bg-gray-200 my-1"/>
                        </div>
                        <div classname="pb-6">
                          <div classname="flex items-center gap-3">
                            <span classname="text-sm font-bold text-[#79589F]">{event.app_name}</span>
                            <span classname="text-gray-300">/</span>
                            <p classname="text-sm font-medium text-gray-900">{event.description}</p>
                            <span classname="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                              {event.action}
                            </span>
                          </div>
                          <p classname="text-xs text-gray-500 mt-1">
                            by {event.actor} • {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <confirmationmodal isopen="{confirmModal.isOpen}" onclose="{()" ==""> setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

const AddonsPage = () => {
  const [catalog, setCatalog] = useState<addoncatalogitem[]>([]);

  useEffect(() => {
    fetch('/api/addons/catalog').then(res => res.json()).then(setCatalog);
  }, []);

  return (
    <div classname="flex-1 flex flex-col bg-[#F5F7F9]">
      <topbar title="Add-ons Marketplace"/>
      <main classname="p-8 max-w-6xl mx-auto w-full">
        <div classname="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalog.map(item => (
            <div key="{item.id}" classname="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div classname="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-[#79589F] mb-4">
                {item.icon === 'database' && <database size="{24}"/>}
                {item.icon === 'zap' && <refreshcw size="{24}"/>}
                {item.icon === 'terminal' && <terminal size="{24}"/>}
              </div>
              <h3 classname="text-lg font-bold text-gray-900">{item.name}</h3>
              <p classname="text-sm text-gray-500 mt-2 mb-4">{item.description}</p>
              <div classname="flex items-center justify-between pt-4 border-t border-gray-100">
                <span classname="text-xs font-bold text-gray-400 uppercase">{item.category}</span>
                <button classname="text-sm font-bold text-[#79589F] hover:underline">Learn more</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <router>
      <div classname="flex h-screen bg-[#F5F7F9]">
        <routes>
          <route path="/apps/:id/logs" element="{&lt;LogsPage"/>} />
          <route path="*" element="{" <="">
              <sidebar/>
              <div classname="flex-1 flex flex-col overflow-hidden">
                <routes>
                  <route path="/" element="{&lt;Dashboard"/>} />
                  <route path="/apps/:id" element="{&lt;AppDetail"/>} />
                  <route path="/addons" element="{&lt;AddonsPage"/>} />
                  <route path="/cli" element="{&lt;CLIPage"/>} />
                  <route path="/admin" element="{&lt;AdminPanel"/>} />
                </Routes>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}
