import React, { useState, useMemo, useCallback } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  FileText, 
  Settings, 
  Bell, 
  UserCircle,
  X,
  Save,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle2,
  Download,
  Database,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { User, ImageRecord, AppNotification, ViewState, BU, BG, Status, Role } from './types';
import { MOCK_USERS, generateSeedRecords, BUS, BGS } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);
const getIsoDate = () => new Date().toISOString();

export default function App() {
  // Global State initialized with empty array to allow explicit seeding
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS['BU Contributor']);
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'init_1',
      message: 'Connected to SQL Server instance ul-es-s-sandbx-01-prj:europe-west1:sqlserverexpress2022',
      timestamp: getIsoDate(),
      read: false,
      type: 'info'
    },
    {
      id: 'init_2',
      message: 'Cloud Storage bucket gs://rd_artgallery mounted successfully.',
      timestamp: getIsoDate(),
      read: false,
      type: 'info'
    }
  ]);
  const [currentView, setCurrentView] = useState<ViewState>('library');
  
  // UI State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ImageRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Actions ---
  const addNotification = useCallback((message: string, type: 'info' | 'warning' | 'alert' = 'info') => {
    setNotifications(prev => [{
      id: generateId(),
      message,
      timestamp: getIsoDate(),
      read: false,
      type
    }, ...prev]);
  }, []);

  const handleSyncDatabase = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addNotification('Synchronized metadata with SQL Server [rd_artwork] and verified bucket assets.', 'info');
    }, 1200);
  };

  const handleSeedRecords = () => {
    setRecords(generateSeedRecords());
    addNotification('SQL Server: Seeded 10 fresh Unilever product records linked to gs://rd_artgallery.', 'info');
    alert("SQL Server Database Seeded!\n10 fresh Unilever product artwork records have been loaded successfully.");
  };

  const handleSaveRecord = (recordData: Partial<ImageRecord>) => {
    // Duplicate Check
    const isDuplicate = records.some(r => 
      r.custId === recordData.custId && r.id !== recordData.id && r.status !== 'Deleted'
    );

    if (isDuplicate) {
      const existing = records.find(r => r.custId === recordData.custId);
      alert(`Error: CUST ID "${recordData.custId}" already exists in SQL Server [rd_artwork].\nCreated by: ${existing?.createdBy} (${existing?.bu}). Duplicates are blocked by database constraint.`);
      return;
    }

    const simulatedStoragePath = recordData.hasImage 
      ? `gs://rd_artgallery/artwork/${recordData.custId}.png`
      : 'Pending Upload';

    if (recordData.id) {
      // Update existing
      setRecords(prev => prev.map(r => {
        if (r.id === recordData.id) {
          const updated = { ...r, ...recordData, modifiedBy: currentUser.name, modifiedAt: getIsoDate() };
          
          const changes = [];
          if (r.status !== updated.status) changes.push(`Status changed to ${updated.status}`);
          if (r.tabId !== updated.tabId) changes.push(`TAB ID updated to ${updated.tabId}`);
          if (r.title !== updated.title) changes.push(`Title updated`);
          if (r.imageUrl !== updated.imageUrl) changes.push(`New image uploaded to Cloud Storage`);
          
          if (changes.length > 0) {
             updated.history = [{
               id: generateId(),
               timestamp: getIsoDate(),
               user: currentUser.name,
               action: changes.join(', ')
             }, ...updated.history];
          }
          return updated as ImageRecord;
        }
        return r;
      }));
      addNotification(`SQL Server: Updated record ${recordData.custId}. Audit log written.`, 'info');
    } else {
      // Create new
      const newRecord: ImageRecord = {
        ...recordData,
        id: generateId(),
        status: 'Active',
        createdBy: currentUser.name,
        createdAt: getIsoDate(),
        modifiedBy: currentUser.name,
        modifiedAt: getIsoDate(),
        history: [{
          id: generateId(),
          timestamp: getIsoDate(),
          user: currentUser.name,
          action: `Created Record. Storage Path: ${simulatedStoragePath}`
        }]
      } as ImageRecord;
      setRecords(prev => [newRecord, ...prev]);
      addNotification(`SQL Server: Inserted record ${newRecord.custId}. Asset stored in gs://rd_artgallery.`, 'info');
    }
    setSelectedRecord(null);
    setIsEditing(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (currentUser.role !== 'System Admin') {
      alert("Only System Admin users can permanently delete records.");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this record from SQL Server? This action cannot be undone.")) {
      setRecords(prev => prev.map(r => r.id === id ? { 
        ...r, 
        status: 'Deleted', 
        modifiedBy: currentUser.name, 
        modifiedAt: getIsoDate(),
        history: [{ id: generateId(), timestamp: getIsoDate(), user: currentUser.name, action: 'Permanently Deleted from SQL Server' }, ...r.history]
      } : r));
      addNotification(`Record deleted by ${currentUser.name}. GMS/TAB Team notified.`, 'alert');
      setSelectedRecord(null);
    }
  };

  const handleArchiveRecord = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Archived',
      modifiedBy: currentUser.name,
      modifiedAt: getIsoDate(),
      history: [{ id: generateId(), timestamp: getIsoDate(), user: currentUser.name, action: 'Status changed to Archived' }, ...r.history]
    } : r));
    addNotification(`Record archived by ${currentUser.name}. GMS/TAB Team notified.`, 'warning');
    setSelectedRecord(null);
  };

  // --- Permissions Logic ---
  const canCreate = currentUser.role === 'System Admin' || currentUser.role === 'BU Contributor';
  
  const canEditField = (record: ImageRecord | null, field: keyof ImageRecord) => {
    if (currentUser.role === 'System Admin') return true;
    if (currentUser.role === 'GMS Integrator') return field === 'tabId';
    if (currentUser.role === 'BU Contributor') {
      if (field === 'tabId') return false;
      if (!record) return true; // Creating new
      return record.bu === currentUser.bu;
    }
    return false;
  };

  const canArchive = (record: ImageRecord) => {
    if (record.status !== 'Active') return false;
    if (currentUser.role === 'System Admin') return true;
    if (currentUser.role === 'BU Contributor') return record.bu === currentUser.bu;
    return false;
  };

  const canDelete = currentUser.role === 'System Admin';

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <div className="bg-blue-900 text-blue-50 px-4 py-2 text-sm flex items-center justify-between font-medium">
        <div className="flex items-center">
          <ShieldAlert className="w-4 h-4 mr-2 text-blue-300 flex-shrink-0" />
          <span>
            <strong>Governance Notice:</strong> This library tracks and governs image metadata. Final high-resolution assets are stored and controlled in TAB.
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-xs text-blue-200">
          <span className="flex items-center"><Database className="w-3.5 h-3.5 mr-1 text-green-400" /> SQL Server Connected</span>
          <span className="flex items-center"><HardDrive className="w-3.5 h-3.5 mr-1 text-green-400" /> Bucket Active</span>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className="bg-slate-800 text-slate-300 px-6 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-700">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-slate-200">SQL Server:</span>
          <span className="font-mono text-slate-400">ul-es-s-sandbx-01-prj:europe-west1:sqlserverexpress2022</span>
          <span className="text-slate-500">|</span>
          <span className="font-semibold text-slate-200">Database:</span>
          <span className="font-mono text-slate-400">rd_artwork</span>
          <span className="text-slate-500">|</span>
          <span className="font-semibold text-slate-200">User:</span>
          <span className="font-mono text-slate-400">sqlserver</span>
        </div>
        <div className="flex items-center space-x-3">
          <a 
            href="https://console.cloud.google.com/storage/browser/rd_artgallery" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center hover:underline"
          >
            <HardDrive className="w-3.5 h-3.5 mr-1" /> gs://rd_artgallery <ExternalLink className="w-3 h-3 ml-1" />
          </a>
          <button 
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="flex items-center text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded transition-colors"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Unilever.svg/1200px-Unilever.svg.png" 
            alt="Unilever Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-slate-800">R&D Artwork Image Gallery v2</h1>
            <p className="text-xs text-slate-500">Traceability &amp; Governance Layer</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Seed Button */}
          <button 
            onClick={handleSeedRecords}
            className="flex items-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-md transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
            Seed 10 Sample Records
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-sm flex justify-between items-center">
                  <span>Activity Log &amp; DB Transactions</span>
                  <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 text-center">No recent activity</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b border-slate-100 text-sm ${n.read ? 'opacity-60' : 'bg-blue-50/50'}`}>
                        <div className="flex items-start">
                          {n.type === 'alert' ? <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" /> :
                           n.type === 'warning' ? <ShieldAlert className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" /> :
                           <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />}
                          <div>
                            <p className="text-slate-800 font-medium">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
            <UserCircle className="w-8 h-8 text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Switcher</span>
              <select 
                className="text-sm font-semibold bg-transparent border-none focus:ring-0 p-0 cursor-pointer text-slate-800"
                value={currentUser.role}
                onChange={(e) => {
                  const role = e.target.value as Role;
                  setCurrentUser(MOCK_USERS[role]);
                  setCurrentView('library');
                }}
              >
                {Object.keys(MOCK_USERS).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {currentUser.role === 'BU Contributor' ? (
                <div className="flex space-x-1 text-xs text-slate-500">
                  <select 
                    className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                    value={currentUser.bu}
                    onChange={(e) => setCurrentUser({...currentUser, bu: e.target.value as BU})}
                  >
                    {BUS.map(bu => <option key={bu} value={bu}>BU: {bu}</option>)}
                  </select>
                  <span>•</span>
                  <select 
                    className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                    value={currentUser.bg}
                    onChange={(e) => setCurrentUser({...currentUser, bg: e.target.value as BG})}
                  >
                    {BGS.map(bg => <option key={bg} value={bg}>BG: {bg}</option>)}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-500">Global Access</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-slate-200 flex flex-col py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
          <NavItem icon={<Search />} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
          {canCreate && (
            <NavItem icon={<Upload />} label="Bulk Upload" active={currentView === 'bulk-upload'} onClick={() => setCurrentView('bulk-upload')} />
          )}
          <NavItem icon={<FileText />} label="Governance Reports" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
          
          {currentUser.role === 'System Admin' && (
            <>
              <div className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</div>
              <NavItem icon={<Settings />} label="Library Settings" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
            </>
          )}

          {/* Database Info Card in Sidebar */}
          <div className="mt-auto mx-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-center text-slate-700 font-semibold">
              <Database className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              <span>SQL Server Status</span>
            </div>
            <div className="text-slate-500 space-y-1 font-mono">
              <p className="truncate" title="ul-es-s-sandbx-01-prj:europe-west1:sqlserverexpress2022">Host: ...sqlserverexpress2022</p>
              <p>DB: rd_artwork</p>
              <p>User: sqlserver</p>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500">
              <span>Bucket:</span>
              <span className="font-mono text-blue-600">gs://rd_artgallery</span>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {currentView === 'library' && (
            <div className="space-y-6">
              {records.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-12">
                  <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">Database is Empty</h3>
                  <p className="text-sm text-slate-600 mt-2 mb-6">
                    The SQL Server database <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">rd_artwork</code> is currently empty. Click the button below to seed 10 fresh Unilever product artwork records linked to the Cloud Storage bucket.
                  </p>
                  <button 
                    onClick={handleSeedRecords}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center shadow-md transition-colors"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Seed 10 Sample Records
                  </button>
                </div>
              )}
              {records.length > 0 && (
                <LibraryView 
                  records={records} 
                  currentUser={currentUser} 
                  onRowClick={(record: any) => { setSelectedRecord(record); setIsEditing(false); }}
                  onCreateClick={() => { setSelectedRecord(null); setIsEditing(true); }}
                  canCreate={canCreate}
                />
              )}
            </div>
          )}
          {currentView === 'bulk-upload' && (
            <BulkUploadView 
              records={records}
              onUpload={(newRecords) => {
                setRecords(prev => [...newRecords, ...prev]);
                addNotification(`Bulk uploaded ${newRecords.length} records to SQL Server and gs://rd_artgallery`, 'info');
              }} 
            />
          )}
          {currentView === 'reports' && <ReportsView records={records} />}
          {currentView === 'admin' && <AdminSettingsView />}
        </main>
      </div>

      {/* Record Detail / Edit Modal */}
      {(selectedRecord || isEditing) && (
        <RecordModal 
          record={selectedRecord}
          isEditing={isEditing}
          currentUser={currentUser}
          onClose={() => { setSelectedRecord(null); setIsEditing(false); }}
          onSave={handleSaveRecord}
          onEdit={() => setIsEditing(true)}
          onArchive={() => selectedRecord && handleArchiveRecord(selectedRecord.id)}
          onDelete={() => selectedRecord && handleDeleteRecord(selectedRecord.id)}
          canEditField={canEditField}
          canArchive={selectedRecord ? canArchive(selectedRecord) : false}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center w-full px-6 py-3 text-sm font-medium transition-colors ${
        active ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className="w-5 h-5 mr-3 opacity-75">{icon}</span>
      {label}
    </button>
  );
}

function LibraryView({ records, currentUser, onRowClick, onCreateClick, canCreate }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [buFilter, setBuFilter] = useState<BU | 'All'>('All');
  const [bgFilter, setBgFilter] = useState<BG | 'All'>('All');
  const [imageFilter, setImageFilter] = useState<'All' | 'HasImage' | 'YetToUpload'>('All');

  const filteredRecords = useMemo(() => {
    return records.filter((r: ImageRecord) => {
      if (r.status === 'Deleted') return false;
      if (r.status !== statusFilter) return false;
      if (buFilter !== 'All' && r.bu !== buFilter) return false;
      if (bgFilter !== 'All' && r.bg !== bgFilter) return false;
      
      if (imageFilter === 'HasImage' && !r.hasImage) return false;
      if (imageFilter === 'YetToUpload' && r.hasImage) return false;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return r.title.toLowerCase().includes(term) || 
               r.custId.toLowerCase().includes(term) || 
               (r.tabId && r.tabId.toLowerCase().includes(term));
      }
      return true;
    });
  }, [records, searchTerm, statusFilter, buFilter, bgFilter, imageFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Image Library</h2>
          <p className="text-xs text-slate-500 mt-0.5">Querying SQL Server table <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">dbo.artwork_metadata</code></p>
        </div>
        {canCreate && (
          <button onClick={onCreateClick} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Title, CUST ID, TAB ID..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="Active">Status: Active</option>
            <option value="Archived">Status: Archived</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value as any)}
          >
            <option value="All">All BUs</option>
            {BUS.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={bgFilter}
            onChange={(e) => setBgFilter(e.target.value as any)}
          >
            <option value="All">All BGs</option>
            {BGS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={imageFilter}
            onChange={(e) => setImageFilter(e.target.value as any)}
          >
            <option value="All">All Images</option>
            <option value="HasImage">Has Image</option>
            <option value="YetToUpload">Yet to Upload</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Image (Bucket Asset)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IDs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BU / BG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Modified</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredRecords.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No records found matching criteria.</td></tr>
            ) : (
              filteredRecords.map((record: ImageRecord) => (
                <tr key={record.id} onClick={() => onRowClick(record)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group">
                      {record.hasImage ? (
                        <img src={record.imageUrl} alt="thumbnail" className="w-12 h-12 rounded object-cover border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-[8px] text-slate-400 font-semibold">
                          <ImageIcon className="w-4 h-4 mb-0.5 text-slate-300" />
                          Yet to Upload
                        </div>
                      )}
                      {record.hasImage && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          gs://
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{record.title}</div>
                    <div className="text-sm text-slate-500 truncate max-w-[200px]">{record.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-mono">{record.custId}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{record.tabId || <span className="italic text-slate-400">No TAB ID</span>}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {record.bu} / {record.bg}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{new Date(record.modifiedAt).toLocaleDateString()}</div>
                    <div className="text-xs">{record.modifiedBy}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordModal({ record, isEditing, currentUser, onClose, onSave, onEdit, onArchive, onDelete, canEditField, canArchive, canDelete }: any) {
  const [formData, setFormData] = useState<Partial<ImageRecord>>(record || {
    title: '', description: '', custId: '', tabId: '', bu: currentUser.role === 'BU Contributor' ? currentUser.bu : 'United Kingdom', bg: currentUser.role === 'BU Contributor' ? currentUser.bg : 'Beauty & Wellbeing (B&W)', hasImage: false, imageUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageUrl: reader.result as string,
          hasImage: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.custId || !formData.title) {
      alert("CUST ID and Title are required.");
      return;
    }
    onSave(formData);
  };

  const hasAnyEditRights = canEditField(record, 'title') || canEditField(record, 'tabId');
  const bucketPath = record ? `gs://rd_artgallery/artwork/${record.custId}.png` : '';

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isEditing ? (record ? 'Edit SQL Record' : 'New Image Record') : 'Record Details'}
            </h3>
            {record && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">SQL ID: {record.id}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && hasAnyEditRights && (
              <button onClick={onEdit} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                Edit
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          
          {/* Left Col: Form/Details */}
          <div className="flex-1 space-y-6">
            {record && !isEditing && (
               <div className="flex items-start space-x-4 mb-6">
                 <div className="relative">
                   {record.hasImage ? (
                     <>
                       <img src={record.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-sm" />
                       <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">
                         gs://
                       </span>
                     </>
                   ) : (
                     <div className="w-32 h-32 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 font-semibold">
                       <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                       Yet to Upload
                     </div>
                   )}
                 </div>
                 <div className="flex-1">
                   <h2 className="text-xl font-bold text-slate-900">{record.title}</h2>
                   <p className="text-slate-500 text-sm">{record.description}</p>
                   
                   <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
                     <div className="flex justify-between">
                       <span>Bucket URI:</span>
                       <a href="https://console.cloud.google.com/storage/browser/rd_artgallery" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                         {record.hasImage ? bucketPath : 'Pending Upload'} <ExternalLink className="w-3 h-3 ml-1" />
                       </a>
                     </div>
                     <div className="flex justify-between">
                       <span>SQL Table:</span>
                       <span>rd_artwork.dbo.artwork_metadata</span>
                     </div>
                   </div>

                   <div className="mt-3 flex space-x-2">
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'Active' ? 'bg-green-100 text-green-800' : record.status === 'Archived' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                       {record.status}
                     </span>
                     <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                       {record.bu} / {record.bg}
                     </span>
                   </div>
                 </div>
               </div>
            )}

            <form id="record-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CUST ID (PIT) *</label>
                  <input 
                    type="text" name="custId" value={formData.custId || ''} onChange={handleChange}
                    disabled={!isEditing || !canEditField(record, 'custId')}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder="e.g. PIT-UK-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">TAB ID</label>
                  <input 
                    type="text" name="tabId" value={formData.tabId || ''} onChange={handleChange}
                    disabled={!isEditing || !canEditField(record, 'tabId')}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder="Added by DRD/GMS"
                  />
                  {currentUser.role === 'BU Contributor' && isEditing && <p className="text-xs text-slate-400 mt-1">Only System Admin/GMS can edit TAB ID.</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BU / BG</label>
                  <select 
                    name="bu" value={formData.bu || ''} onChange={handleChange}
                    disabled={!isEditing || !canEditField(record, 'bu')}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {BUS.map(bu => <option key={bu} value={bu}>{bu}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Group (BG)</label>
                  <select 
                    name="bg" value={formData.bg || ''} onChange={handleChange}
                    disabled={!isEditing || !canEditField(record, 'bg')}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {BGS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input 
                  type="text" name="title" value={formData.title || ''} onChange={handleChange}
                  disabled={!isEditing || !canEditField(record, 'title')}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  name="description" value={formData.description || ''} onChange={handleChange} rows={3}
                  disabled={!isEditing || !canEditField(record, 'description')}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              
              {isEditing && (
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image from Local Desktop</label>
                   <input 
                     type="file" 
                     accept="image/*" 
                     onChange={handleImageUpload}
                     className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   />
                   {formData.hasImage && (
                     <div className="mt-2 flex items-center space-x-2">
                       <img src={formData.imageUrl} alt="Preview" className="w-16 h-12 object-cover rounded border" />
                       <span className="text-xs text-green-600 font-medium">Image loaded successfully</span>
                     </div>
                   )}
                </div>
              )}
            </form>
          </div>

          {/* Right Col: Audit & Actions */}
          {record && (
            <div className="w-full md:w-72 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
              <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Audit Trail</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {record.history.map((entry: any, i: number) => (
                  <div key={entry.id} className="relative pl-4 border-l-2 border-slate-200 pb-4 last:pb-0">
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                    <p className="text-xs font-semibold text-slate-900">{entry.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.user}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Governance Actions */}
              {!isEditing && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                  {canArchive && (
                    <button onClick={onArchive} className="w-full flex items-center justify-center px-4 py-2 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md text-sm font-medium transition-colors">
                      <Archive className="w-4 h-4 mr-2" /> Mark as Archived
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={onDelete} className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete
                    </button>
                  )}
                  {!canArchive && !canDelete && (
                    <p className="text-xs text-slate-500 text-center italic">No governance actions available for your role on this record.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" form="record-form" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center">
              <Save className="w-4 h-4 mr-2" /> Save to SQL Server
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BulkUploadView({ records, onUpload }: { records: ImageRecord[], onUpload: (newRecords: ImageRecord[]) => void }) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isProcessing, setIsUploading] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleDownloadTemplate = () => {
    const headers = ['CUST ID', 'Title', 'Description', 'BU', 'BG', 'TAB ID'];
    const sampleRow = ['PIT-UK-9999', 'Sample Product Label', 'High-res front label', 'United Kingdom', 'Personal Care (PC)', 'TAB-1234'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "artwork_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.split(','));
        const rows = lines.slice(1).filter(row => row.length >= 2 && row[0].trim() !== '');
        
        const parsed = rows.map(row => ({
          custId: row[0]?.trim(),
          title: row[1]?.trim(),
          description: row[2]?.trim() || '',
          bu: (row[3]?.trim() || 'United Kingdom') as BU,
          bg: (row[4]?.trim() || 'Personal Care (PC)') as BG,
          tabId: row[5]?.trim() || ''
        }));

        const errors: string[] = [];
        parsed.forEach(p => {
          const isDup = records.some(r => r.custId === p.custId);
          if (isDup) {
            const existing = records.find(r => r.custId === p.custId);
            errors.push(`Duplicate CUST ID "${p.custId}" detected. Already exists in BU: ${existing?.bu}, BG: ${existing?.bg}.`);
          }
        });

        setPreviewRows(parsed);
        setValidationErrors(errors);
      };
      reader.readAsText(file);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZipFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (validationErrors.length > 0) {
      alert("Please resolve validation errors before importing.");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newRecords: ImageRecord[] = previewRows.map(row => ({
        id: generateId(),
        title: row.title,
        description: row.description,
        custId: row.custId,
        tabId: row.tabId,
        bu: row.bu,
        bg: row.bg,
        status: 'Active',
        createdBy: 'Bulk Upload',
        createdAt: getIsoDate(),
        modifiedBy: 'Bulk Upload',
        modifiedAt: getIsoDate(),
        imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=400&q=80',
        hasImage: !!zipFile,
        history: [{ id: generateId(), timestamp: getIsoDate(), user: 'System', action: 'Imported via Bulk Upload' }]
      }));

      onUpload(newRecords);
      setIsUploading(false);
      setPreviewRows([]);
      setCsvFile(null);
      setZipFile(null);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Bulk Upload</h2>
        <p className="text-slate-500 mt-1">Import multiple image records via Excel template directly into SQL Server and Cloud Storage.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-start space-x-4 border-b pb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold">1</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-900">Download Template</h3>
            <p className="text-sm text-slate-500 mt-1 mb-3">Use the standard CSV template to ensure columns match the SQL Server schema.</p>
            <button onClick={handleDownloadTemplate} className="text-sm font-medium text-blue-600 hover:underline flex items-center">
              <Download className="w-4 h-4 mr-1" /> Download Template.csv
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold">2</span>
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Upload Data &amp; Images</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Upload CSV Metadata</p>
                <input type="file" accept=".csv" onChange={handleCsvChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {csvFile && <p className="text-xs text-green-600 mt-2 font-semibold">{csvFile.name}</p>}
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Upload Images (ZIP / Folder)</p>
                <input type="file" accept=".zip" onChange={handleZipChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {zipFile && <p className="text-xs text-green-600 mt-2 font-semibold">{zipFile.name}</p>}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md space-y-1">
                <h4 className="text-sm font-bold text-red-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" /> Validation Errors Detected
                </h4>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                  {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b text-xs font-bold text-slate-500 uppercase">Staging Preview</div>
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">CUST ID</th>
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">BU / BG</th>
                      <th className="px-4 py-2 text-left">TAB ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono font-semibold">{row.custId}</td>
                        <td className="px-4 py-2">{row.title}</td>
                        <td className="px-4 py-2">{row.bu} / {row.bg}</td>
                        <td className="px-4 py-2 font-mono">{row.tabId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleConfirmImport}
                disabled={isProcessing || previewRows.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center"
              >
                {isProcessing ? 'Processing SQL Transactions...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ records }: { records: ImageRecord[] }) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Archived'>('All');
  const [buFilter, setBuFilter] = useState<BU | 'All'>('All');
  const [bgFilter, setBgFilter] = useState<BG | 'All'>('All');
  const [imageFilter, setImageFilter] = useState<'All' | 'HasImage' | 'YetToUpload'>('All');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.status === 'Deleted') return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (buFilter !== 'All' && r.bu !== buFilter) return false;
      if (bgFilter !== 'All' && r.bg !== bgFilter) return false;
      if (imageFilter === 'HasImage' && !r.hasImage) return false;
      if (imageFilter === 'YetToUpload' && r.hasImage) return false;
      return true;
    });
  }, [records, statusFilter, buFilter, bgFilter, imageFilter]);

  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const active = filteredRecords.filter(r => r.status === 'Active').length;
    const archived = filteredRecords.filter(r => r.status === 'Archived').length;
    const yetToUpload = filteredRecords.filter(r => !r.hasImage).length;
    return { total, active, archived, yetToUpload };
  }, [filteredRecords]);

  const handleExport = () => {
    const headers = ['CUST ID', 'TAB ID', 'Title', 'BU', 'BG', 'Status', 'Created By', 'Created At', 'Bucket URI'];
    const rows = filteredRecords.map(r => [
      r.custId, r.tabId || '', `"${r.title}"`, r.bu, r.bg, r.status, r.createdBy, r.createdAt, r.hasImage ? `gs://rd_artgallery/artwork/${r.custId}.png` : 'Pending'
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "governance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Governance Reports &amp; Dashboard</h2>
          <p className="text-slate-500 mt-1">Exportable audit view of all library records from SQL Server.</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      {/* KPIs Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Records</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{kpis.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Active Assets</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{kpis.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Archived Assets</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{kpis.archived}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Yet to Upload Image</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{kpis.yetToUpload}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value as any)}
          >
            <option value="All">All BUs</option>
            {BUS.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={bgFilter}
            onChange={(e) => setBgFilter(e.target.value as any)}
          >
            <option value="All">All BGs</option>
            {BGS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select 
            className="border border-slate-300 rounded-md text-sm py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={imageFilter}
            onChange={(e) => setImageFilter(e.target.value as any)}
          >
            <option value="All">All Images</option>
            <option value="HasImage">Has Image</option>
            <option value="YetToUpload">Yet to Upload</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">CUST ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">TAB ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BU / BG</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bucket URI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-slate-900">{record.custId}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-slate-500">{record.tabId || '-'}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">{record.bu} / {record.bg}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    record.status === 'Archived' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-500">
                  {record.hasImage ? `gs://rd_artgallery/artwork/${record.custId}.png` : <span className="text-red-500 font-semibold">Yet to Upload</span>}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">{record.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettingsView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Library Settings (DRD Only)</h2>
        <p className="text-slate-500 mt-1">Master configuration, SQL Server schema, and Cloud Storage bucket settings.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-8">
        
        <section>
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2 mb-4">SQL Server Connection</h3>
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Instance:</span>
              <span className="text-slate-800 font-semibold">ul-es-s-sandbx-01-prj:europe-west1:sqlserverexpress2022</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Database:</span>
              <span className="text-slate-800 font-semibold">rd_artwork</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Username:</span>
              <span className="text-slate-800">sqlserver</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Password:</span>
              <span className="text-slate-800">••••••••••••</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2 mb-4">Cloud Storage Bucket</h3>
          <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Bucket Name:</span>
              <span className="text-slate-800 font-semibold">rd_artgallery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">URI:</span>
              <span className="text-blue-600">gs://rd_artgallery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Console Link:</span>
              <a href="https://console.cloud.google.com/storage/browser/rd_artgallery" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                Open Console <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2 mb-4">Metadata Schema</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
              <div><span className="font-medium text-sm">CUST ID</span> <span className="text-xs text-slate-500 ml-2">VARCHAR(50) (Primary Key)</span></div>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">System Field</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
              <div><span className="font-medium text-sm">TAB ID</span> <span className="text-xs text-slate-500 ml-2">VARCHAR(50) (Nullable)</span></div>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">System Field</span>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:underline flex items-center mt-2">
              <Plus className="w-4 h-4 mr-1" /> Add Custom Field
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-red-600 border-b border-slate-200 pb-2 mb-4">Danger Zone</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
            <div>
              <h4 className="font-medium text-red-900">Delete Library Structure</h4>
              <p className="text-sm text-red-700 mt-1 max-w-md">
                Permanently removes the entire SQL Server table structure and deletes bucket assets. This action is locked per governance policy.
              </p>
            </div>
            <button disabled className="bg-red-200 text-red-400 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed" title="Locked by Master Governance Config">
              Delete Library
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
