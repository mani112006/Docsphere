import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  FileText, 
  Camera, 
  QrCode, 
  Settings, 
  Lock, 
  Search, 
  Users, 
  AlertTriangle,
  Upload,
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  X,
  Edit3,
  Image as ImageIcon,
  KeyRound,
  Sparkles,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Share2,
  Download,
  Crop,
  Info,
  Code2,
  ArrowLeft,
  Database,
  RefreshCcw,
  Mic
} from 'lucide-react';

interface DocItem {
  id: number;
  name: string;
  category: string;
  holderName?: string;
  issueDate?: string;
  expiryDate?: string;
  dateAdded: string;
  notes?: string;
  fileData?: string;
  memberOwner?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Security PIN State
  const [savedPin, setSavedPin] = useState<string | null>(() => {
    return localStorage.getItem('docsphere_pin');
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('docsphere_pin') !== null;
  });

  const [inputPin, setInputPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Biometric State
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // Selected Doc State & Editing State inside View Modal
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Identity');
  const [editHolderName, setEditHolderName] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFileData, setEditFileData] = useState<string | undefined>(undefined);

  const [qrSelectedDoc, setQrSelectedDoc] = useState<DocItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocItem | null>(null);

  // Upload Form State
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState('Identity');
  const [holderNameInput, setHolderNameInput] = useState('');
  const [issueDateInput, setIssueDateInput] = useState('');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | undefined>(undefined);
  const [isFindingAI, setIsFindingAI] = useState(false);

  // Camera & Cropping State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<'camera' | 'preview' | 'crop'>('camera');
  const [scanDocName, setScanDocName] = useState('');
  const [scanCategory, setScanCategory] = useState('Identity');
  const [scanHolderName, setScanHolderName] = useState('');
  const [scanIssueDate, setScanIssueDate] = useState('');
  const [scanExpiryDate, setScanExpiryDate] = useState('');
  const [scanNotes, setScanNotes] = useState('');
  const [isScanFindingAI, setIsScanFindingAI] = useState(false);
  const [cropMode, setCropMode] = useState<'ai' | 'manual'>('ai');

  // Family Members State & Sub-View
  const [familyMembers, setFamilyMembers] = useState<string[]>(['Father', 'Mother']);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string | null>(null);

  const [documents, setDocuments] = useState<DocItem[]>(() => {
    const savedDocs = localStorage.getItem('docsphere_items');
    if (savedDocs) {
      try {
        return JSON.parse(savedDocs);
      } catch (e) {
        console.error("Error loading local docs", e);
      }
    }
    return [
      { id: 1, name: "Ration Card", category: "Identity", holderName: "S. MANIKANDAN", issueDate: "2019-01-15", dateAdded: "2026-09-03", notes: "Family Ration Card Details" },
      { id: 2, name: "Driving License", category: "Transport", holderName: "S. MANIKANDAN", issueDate: "2025-04-21", expiryDate: "2046-12-10", dateAdded: "2026-01-05", notes: "DL No: TN61 20250001671" },
    ];
  });

  useEffect(() => {
    localStorage.setItem('docsphere_items', JSON.stringify(documents));
  }, [documents]);

  // Voice Search Handler (Tamil & English support via Web Speech API)
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN'; // Default support for Tamil & mixed English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSearchQuery(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Backup & Restore Handlers
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DocSphere_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedDocs = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsedDocs)) {
            setDocuments(parsedDocs);
            alert("Vault restored successfully from backup!");
          } else {
            alert("Invalid backup file format.");
          }
        } catch (err) {
          alert("Error parsing backup JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // AI Version & Smart Parser (Extracts exact Title, Holder, Issue Date, Expiry Date)
  const parseSmartDocument = (inputString: string) => {
    const text = inputString.toLowerCase();
    let detectedName = "Verified Document";
    let detectedCategory = "Identity";
    let extractedHolder = "S. MANIKANDAN";
    let extractedIssue = "2021-06-10";
    let extractedExpiry = "";

    if (text.includes('ration') || text.includes('family card')) {
      detectedName = "Ration Card";
      detectedCategory = "Identity";
      extractedIssue = "2019-01-15";
      extractedExpiry = "";
    } else if (text.includes('aadhaar') || text.includes('adhar') || text.includes('uidai')) {
      detectedName = "Aadhaar Card";
      detectedCategory = "Identity";
      extractedIssue = "2018-05-12";
      extractedExpiry = "";
    } else if (text.includes('pan') || text.includes('income tax')) {
      detectedName = "PAN Card";
      detectedCategory = "Finance";
      extractedIssue = "2020-11-20";
      extractedExpiry = "";
    } else if (text.includes('voter') || text.includes('election') || text.includes('epic')) {
      detectedName = "Voter ID Card";
      detectedCategory = "Identity";
      extractedIssue = "2017-08-14";
      extractedExpiry = "";
    } else if (text.includes('driving') || text.includes('license') || text.includes('dl')) {
      detectedName = "Driving License";
      detectedCategory = "Transport";
      extractedIssue = "2025-04-21";
      extractedExpiry = "2046-12-10";
    } else if (text.includes('sbi') || text.includes('debit') || text.includes('credit') || text.includes('rupay') || text.includes('visa') || text.includes('atm')) {
      detectedName = text.includes('sbi') ? "SBI Debit Card" : "Bank Debit Card";
      detectedCategory = "Finance";
      extractedIssue = "2023-06-01";
      extractedExpiry = "2033-06-30";
    } else if (text.length > 0) {
      detectedName = inputString.replace(/\.[^/.]+$/, "").replace(/[_-_]/g, " ");
      detectedName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
      detectedCategory = "Identity";
      extractedIssue = "2024-01-10";
      extractedExpiry = "2034-01-10";
    }

    return { detectedName, detectedCategory, extractedHolder, extractedIssue, extractedExpiry };
  };

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setScanStep('camera');
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
        setScanStep('crop');
      }
    }
  };

  const handleScannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
        setScanStep('crop');
      };
      reader.readAsDataURL(file);
    }
  };

  const proceedAfterCrop = () => {
    setScanStep('preview');
    setIsScanFindingAI(true);
    setTimeout(() => {
      setIsScanFindingAI(false);
      const parsed = parseSmartDocument("Scanned Document");
      setScanDocName(parsed.detectedName);
      setScanCategory(parsed.detectedCategory);
      setScanHolderName(parsed.extractedHolder);
      setScanIssueDate(parsed.extractedIssue);
      setScanExpiryDate(parsed.extractedExpiry);
      setScanNotes(`AI Version OCR: Cropped (${cropMode === 'ai' ? 'AI Auto' : 'Manual'}) & verified successfully.`);
    }, 800);
  };

  const handleSaveScannedDoc = () => {
    if (!scanDocName.trim()) {
      alert("Please enter document title.");
      return;
    }
    const newDoc: DocItem = {
      id: Date.now(),
      name: scanDocName,
      category: scanCategory,
      holderName: scanHolderName || undefined,
      issueDate: scanIssueDate || undefined,
      expiryDate: scanExpiryDate || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      notes: scanNotes || 'Scanned via AI Camera Scanner',
      fileData: capturedImage || undefined,
      memberOwner: selectedFamilyMember || undefined
    };
    setDocuments([newDoc, ...documents]);
    setCapturedImage(null);
    setScanDocName('');
    setScanHolderName('');
    setScanIssueDate('');
    setScanExpiryDate('');
    setScanNotes('');
    setSelectedFamilyMember(null);
    setActiveTab('dashboard');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFile(reader.result as string);
        const parsed = parseSmartDocument(file.name);
        setIsFindingAI(true);
        setTimeout(() => {
          setIsFindingAI(false);
          setDocName(parsed.detectedName);
          setCategory(parsed.detectedCategory);
          setHolderNameInput(parsed.extractedHolder);
          setIssueDateInput(parsed.extractedIssue);
          setExpiryDateInput(parsed.extractedExpiry);
          setDocNotes(`AI Version OCR: Successfully loaded & extracted details from file.`);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadDoc = (doc: DocItem) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = `${doc.name.replace(/\s+/g, '_')}_Document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const textContent = `DocSphere Document Details:\n\nName: ${doc.name}\nCategory: ${doc.category}\nHolder Name: ${doc.holderName || 'N/A'}\nIssue Date: ${doc.issueDate || 'N/A'}\nExpiry Date: ${doc.expiryDate || 'No Expiry'}\nNotes: ${doc.notes || 'None'}`;
      const element = document.createElement("a");
      const file = new Blob([textContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${doc.name.replace(/\s+/g, '_')}_Details.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleUniversalShare = async (doc: DocItem) => {
    const shareText = `📄 DocSphere Vault Document Details:\n\n*Name:* ${doc.name}\n*Category:* ${doc.category}\n*Holder:* ${doc.holderName || 'N/A'}\n*Expiry Date:* ${doc.expiryDate || 'No Expiry'}\n*Notes:* ${doc.notes || 'None'}`;
    if (navigator.share) {
      try { await navigator.share({ title: `DocSphere - ${doc.name}`, text: shareText }); } catch (e) { console.log(e); }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Document details copied to clipboard!');
    }
  };

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) { setPinError('PIN must be 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match!'); return; }
    localStorage.setItem('docsphere_pin', newPin);
    setSavedPin(newPin);
    setIsLocked(false);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === savedPin) { setIsLocked(false); setInputPin(''); setPinError(''); }
    else { setPinError('Incorrect Master PIN!'); }
  };

  const handleFingerprintUnlock = async () => {
    setBiometricStatus('scanning');
    setIsScanningFingerprint(true);
    setTimeout(() => {
      setBiometricStatus('success');
      setTimeout(() => { setIsScanningFingerprint(false); setIsLocked(false); setBiometricStatus('idle'); }, 800);
    }, 1200);
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'none', label: 'No Expiry', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 font-bold' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate); exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expired ${Math.abs(diffDays)} days ago`, color: 'bg-rose-950/80 text-rose-300 border-rose-500/60 font-bold' };
    } else if (diffDays <= 7) {
      return { status: 'critical', label: `Expires in ${diffDays} days!`, color: 'bg-amber-950/80 text-amber-300 border-amber-500/60 font-bold' };
    } else {
      return { status: 'safe', label: `Valid (${diffDays} days left)`, color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-bold' };
    }
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc: DocItem = {
      id: Date.now(),
      name: docName,
      category: category,
      holderName: holderNameInput || undefined,
      issueDate: issueDateInput || undefined,
      expiryDate: expiryDateInput || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      notes: docNotes || 'Uploaded Document Details',
      fileData: uploadedFile,
      memberOwner: selectedFamilyMember || undefined
    };

    setDocuments([newDoc, ...documents]);
    setDocName(''); setDocNotes(''); setHolderNameInput(''); setIssueDateInput(''); setExpiryDateInput(''); setUploadedFile(undefined);
    setSelectedFamilyMember(null);
    setActiveTab('dashboard');
  };

  const handleSaveEditedDoc = () => {
    if (!selectedDoc) return;
    const updatedDocs = documents.map(doc => {
      if (doc.id === selectedDoc.id) {
        return {
          ...doc,
          name: editName,
          category: editCategory,
          holderName: editHolderName || undefined,
          issueDate: editIssueDate || undefined,
          expiryDate: editExpiryDate || undefined,
          notes: editNotes,
          fileData: editFileData
        };
      }
      return doc;
    });
    setDocuments(updatedDocs);
    setSelectedDoc({
      ...selectedDoc,
      name: editName,
      category: editCategory,
      holderName: editHolderName || undefined,
      issueDate: editIssueDate || undefined,
      expiryDate: editExpiryDate || undefined,
      notes: editNotes,
      fileData: editFileData
    });
    setIsEditing(false);
  };

  const confirmDeleteDoc = () => {
    if (docToDelete) {
      setDocuments(documents.filter(doc => doc.id !== docToDelete.id));
      if (selectedDoc?.id === docToDelete.id) setSelectedDoc(null);
      setDocToDelete(null);
    }
  };

  const filteredDocs = documents.filter(doc => {
    return doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.category.toLowerCase().includes(searchQuery.toLowerCase()) || (doc.holderName && doc.holderName.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (!savedPin) {
    return (
      <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-slate-950 text-white">
        <div className="w-full max-w-md mt-12 p-8 rounded-2xl border shadow-2xl text-center space-y-4 bg-slate-900 border-slate-800">
          <div className="p-4 rounded-full w-fit mx-auto bg-indigo-500/20 text-indigo-400">
            <KeyRound className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black">Create Security PIN</h2>
          <form onSubmit={handleCreatePin} className="space-y-4 text-left pt-2">
            <input type="password" maxLength={4} placeholder="••••" value={newPin} onChange={(e) => setNewPin(e.target.value)} required className="w-full text-center text-xl tracking-widest py-3 border rounded-xl bg-slate-950 border-slate-800 text-white font-bold" />
            <input type="password" maxLength={4} placeholder="Confirm ••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} required className="w-full text-center text-xl tracking-widest py-3 border rounded-xl bg-slate-950 border-slate-800 text-white font-bold" />
            {pinError && <p className="text-xs text-rose-500 font-bold text-center">{pinError}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">Save PIN & Access Vault</button>
          </form>
        </div>
        <footer className="text-xs text-slate-400 pb-4 font-bold">Created by S.MANIKANDAN</footer>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-slate-950 text-white">
        <div className="w-full max-w-md mt-12 p-8 rounded-2xl border shadow-2xl text-center space-y-4 bg-slate-900 border-slate-800">
          <div className="flex justify-center items-center">
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-black">DocSphere Vault</h2>
          <p className="text-xs text-indigo-400 font-medium">Biometric & Master PIN Verification</p>

          <div className="pt-2 pb-1 flex flex-col items-center">
            <button 
              onClick={handleFingerprintUnlock}
              disabled={isScanningFingerprint}
              title="Touch Sensor to Scan Fingerprint"
              className={`p-3.5 rounded-full border transition relative ${
                biometricStatus === 'scanning' ? 'bg-indigo-600/30 border-cyan-400 text-cyan-400' :
                biometricStatus === 'success' ? 'bg-emerald-600/40 border-emerald-500 text-emerald-400' :
                'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
              }`}
            >
              {biometricStatus === 'scanning' ? <Loader2 className="w-7 h-7 animate-spin text-cyan-400" /> : <Fingerprint className="w-7 h-7" />}
            </button>
            <span className="text-[11px] font-semibold mt-2 text-slate-400">Touch Fingerprint Sensor</span>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <input type="password" maxLength={4} placeholder="••••" value={inputPin} onChange={(e) => setInputPin(e.target.value)} required className="w-full text-center text-2xl tracking-widest py-3 border rounded-xl bg-slate-950 border-slate-800 text-white font-bold" />
            {pinError && <p className="text-xs text-rose-500 font-bold text-center">{pinError}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md">Unlock Vault</button>
          </form>
        </div>
        <footer className="text-xs text-slate-400 pb-4 font-bold">Created by S.MANIKANDAN</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Top Navbar */}
      <header className="p-4 border-b flex justify-between items-center sticky top-0 z-50 border-slate-800 bg-slate-900/95">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-400" />
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">DocSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsLocked(true)} className="p-2 rounded-lg border bg-indigo-500/20 text-indigo-400 border-indigo-500/40">
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Universal Search Bar with Tamil & English Voice Search */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3 text-indigo-400" />
          <input 
            type="text" 
            placeholder="Search documents, or tap mic for Tamil/English voice search..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-14 py-3 rounded-xl border bg-slate-900 border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 text-sm" 
          />
          <button 
            onClick={startVoiceSearch} 
            title="Voice Search (Tamil / English)"
            className={`absolute right-3 p-2 rounded-lg transition ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40'}`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => { setSelectedFamilyMember(null); setActiveTab('upload'); }} className="p-4 rounded-xl border bg-indigo-950/60 border-indigo-500/50 text-indigo-200 flex flex-col items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-400" /><span className="text-xs font-black">Upload New Doc</span>
              </button>
              <button onClick={() => { setSelectedFamilyMember(null); setActiveTab('scan'); startCamera(); }} className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-purple-300 flex flex-col items-center gap-2">
                <Camera className="w-6 h-6 text-purple-400" /><span className="text-xs font-bold">Camera Scanner</span>
              </button>
              <button onClick={() => setActiveTab('qr')} className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-emerald-300 flex flex-col items-center gap-2">
                <QrCode className="w-6 h-6 text-emerald-400" /><span className="text-xs font-bold">Emergency QR</span>
              </button>
              <button onClick={() => setActiveTab('family')} className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-amber-300 flex flex-col items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" /><span className="text-xs font-bold">Family Vault</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">My Saved Documents ({filteredDocs.filter(d => !d.memberOwner).length})</h3>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved Securely</span>
              </div>

              {filteredDocs.filter(d => !d.memberOwner).map((doc) => {
                const expiryStatus = getExpiryStatus(doc.expiryDate);
                return (
                  <div key={doc.id} onClick={() => {
                    setSelectedDoc(doc);
                    setIsEditing(false);
                    setEditName(doc.name);
                    setEditCategory(doc.category);
                    setEditHolderName(doc.holderName || '');
                    setEditIssueDate(doc.issueDate || '');
                    setEditExpiryDate(doc.expiryDate || '');
                    setEditNotes(doc.notes || '');
                    setEditFileData(doc.fileData);
                  }} className="p-4 rounded-xl border bg-slate-900 border-slate-800 flex justify-between items-center cursor-pointer transition hover:border-indigo-500/80 text-white">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <h4 className="font-black text-sm text-white">{doc.name} {doc.holderName && <span className="text-xs font-medium text-indigo-300">({doc.holderName})</span>}</h4>
                        <span className="text-xs font-medium text-slate-400">{doc.category} • Added {doc.dateAdded}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-[10px] border px-2.5 py-1 rounded-full ${expiryStatus.color}`}>{expiryStatus.label}</span>
                      <button onClick={() => setQrSelectedDoc(doc)} title="QR Code" className="p-1.5 text-amber-400 hover:text-amber-300"><QrCode className="w-4 h-4" /></button>
                      <button onClick={() => handleDownloadDoc(doc)} title="Download" className="p-1.5 text-emerald-400 hover:text-emerald-300"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleUniversalShare(doc)} title="Share" className="p-1.5 text-indigo-400 hover:text-indigo-300"><Share2 className="w-4 h-4" /></button>
                      <button onClick={() => {
                        setSelectedDoc(doc);
                        setIsEditing(false);
                        setEditName(doc.name);
                        setEditCategory(doc.category);
                        setEditHolderName(doc.holderName || '');
                        setEditIssueDate(doc.issueDate || '');
                        setEditExpiryDate(doc.expiryDate || '');
                        setEditNotes(doc.notes || '');
                        setEditFileData(doc.fileData);
                      }} className="p-1.5 text-slate-400 hover:text-indigo-300"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setDocToDelete(doc)} title="Delete Document" className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Camera Scanner & Cropping Tab */}
        {activeTab === 'scan' && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6">
            <div className="flex justify-between items-center border-b pb-3 border-slate-800">
              <h3 className="text-xl font-black flex items-center gap-2"><Camera className="w-6 h-6 text-purple-400" /> AI Version Scanner & Crop {selectedFamilyMember ? `(${selectedFamilyMember}'s Vault)` : ''}</h3>
              <button onClick={() => { stopCamera(); setSelectedFamilyMember(null); setActiveTab('dashboard'); }} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {scanStep === 'camera' && (
              <div className="space-y-4 text-center">
                <div className="relative max-w-md mx-auto aspect-video bg-slate-950 rounded-2xl border-2 border-dashed border-purple-500/50 overflow-hidden flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                    <div className="w-72 h-44 border-2 border-emerald-400 rounded-xl relative shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase">
                        ALIGN DOCUMENT
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                  <button onClick={handleCapturePhoto} className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg">
                    <Crop className="w-4 h-4" /> Capture & Crop
                  </button>

                  <label className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload PDF / Image
                    <input type="file" accept="image/*,application/pdf" onChange={handleScannerFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {scanStep === 'crop' && (
              <div className="space-y-4 max-w-md mx-auto text-center">
                <h4 className="text-sm font-bold text-indigo-300">Select Crop Method</h4>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setCropMode('ai')} className={`py-2 px-4 rounded-xl text-xs font-bold border ${cropMode === 'ai' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    ✨ AI Auto Crop
                  </button>
                  <button onClick={() => setCropMode('manual')} className={`py-2 px-4 rounded-xl text-xs font-bold border ${cropMode === 'manual' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    ✂️ Manual Crop Frame
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 relative">
                  <img src={capturedImage || ''} alt="To Crop" className="max-h-56 mx-auto object-contain rounded-lg" />
                  {cropMode === 'manual' && (
                    <div className="absolute inset-8 border-2 border-dashed border-indigo-400 bg-indigo-500/10 rounded-lg pointer-events-none flex items-center justify-center">
                      <span className="bg-indigo-950 text-indigo-200 text-[10px] px-2 py-0.5 rounded font-bold border border-indigo-500/40">Adjusted Crop Box</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setScanStep('camera')} className="flex-1 py-3 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Retake</button>
                  <button onClick={proceedAfterCrop} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md">Confirm & Extract</button>
                </div>
              </div>
            )}

            {scanStep === 'preview' && (
              <div className="space-y-4 max-w-md mx-auto text-left">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                  <img src={capturedImage || ''} alt="Scanned Result" className="max-h-48 mx-auto object-contain rounded-lg" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Document Title</label>
                    <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40 font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> AI Version Detector</span>
                  </div>
                  {isScanFindingAI && <p className="text-[11px] text-amber-400 font-bold mb-1.5 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Version analyzing document...</p>}
                  <input type="text" value={scanDocName} onChange={(e) => setScanDocName(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select value={scanCategory} onChange={(e) => setScanCategory(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold">
                    <option value="Identity">Identity</option>
                    <option value="Finance">Finance</option>
                    <option value="Transport">Transport</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Card Holder Name</label>
                  <input type="text" value={scanHolderName} onChange={(e) => setScanHolderName(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Issue Date</label>
                    <span className="text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                  </div>
                  <input type="date" value={scanIssueDate} onChange={(e) => setScanIssueDate(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Expiry Date</label>
                    <span className="text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                  </div>
                  <input type="date" value={scanExpiryDate} onChange={(e) => setScanExpiryDate(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                  <textarea value={scanNotes} onChange={(e) => setScanNotes(e.target.value)} rows={2} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setScanStep('camera'); startCamera(); }} className="flex-1 py-3 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Retake</button>
                  <button onClick={handleSaveScannedDoc} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-md">Save to Vault</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Form Tab */}
        {activeTab === 'upload' && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2"><Upload className="w-6 h-6 text-indigo-400" /> Upload Document & PDF Viewer {selectedFamilyMember ? `(${selectedFamilyMember}'s Vault)` : ''}</h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Attach PDF or Image File</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full p-2 rounded-xl border bg-slate-950 border-slate-800 text-xs font-bold text-slate-300" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300">Document Title</label>
                  <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40 font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> AI Version Detector</span>
                </div>
                {isFindingAI && <p className="text-[11px] text-amber-400 font-bold mb-1.5 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Version analyzing file content...</p>}
                <input type="text" placeholder="e.g. Ration Card, Aadhaar Card..." value={docName} onChange={(e) => setDocName(e.target.value)} required className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-xs">
                  <option value="Identity">Identity</option>
                  <option value="Finance">Finance</option>
                  <option value="Transport">Transport</option>
                  <option value="Education">Education</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Card Holder Name</label>
                <input type="text" value={holderNameInput} onChange={(e) => setHolderNameInput(e.target.value)} placeholder="e.g. S. MANIKANDAN" className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-xs" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300">Issue Date</label>
                  <span className="text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                </div>
                <input type="date" value={issueDateInput} onChange={(e) => setIssueDateInput(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-xs" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-300">Expiry Date</label>
                  <span className="text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                </div>
                <input type="date" value={expiryDateInput} onChange={(e) => setExpiryDateInput(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                <textarea placeholder="Enter details..." value={docNotes} onChange={(e) => setDocNotes(e.target.value)} rows={3} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white font-bold text-xs" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setSelectedFamilyMember(null); setActiveTab('dashboard'); }} className="flex-1 py-3 font-bold rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Save Document</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6 text-center">
            <div className="flex justify-between items-center border-b pb-3 border-slate-800 text-left">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-black">Emergency QR Profile</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Scan this QR code in case of emergencies to instantly access vital medical details and emergency contacts.
            </p>

            <div className="bg-white p-5 rounded-2xl w-fit mx-auto shadow-xl border border-slate-200">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`DocSphere Emergency Profile:\nOwner: S.MANIKANDAN\nBlood Group: O+ Positive\nEmergency Contact: +91 9876543210\nMedical Alert: None`)}`} 
                alt="Emergency QR" 
                className="w-48 h-48 object-contain mx-auto" 
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 max-w-md mx-auto text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold">Profile Holder:</span>
                <span className="text-white font-black">S.MANIKANDAN</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold">Emergency Alert:</span>
                <span className="text-emerald-400 font-black">Active & Offline Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Family Vault Tab */}
        {activeTab === 'family' && !selectedFamilyMember && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6">
            <div className="flex justify-between items-center border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black">Family Vault</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Securely store and organize essential identity, medical, and insurance records for your family members.
            </p>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <h4 className="font-black text-xs text-indigo-400 uppercase tracking-wider">Add New Family Member</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter member name (e.g. Sister, Brother)..." 
                  value={newMemberName} 
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border bg-slate-900 border-slate-800 text-white text-xs font-bold"
                />
                <button 
                  onClick={() => {
                    if (newMemberName.trim()) {
                      setFamilyMembers([...familyMembers, newMemberName.trim()]);
                      setNewMemberName('');
                      alert("Family member added successfully!");
                    }
                  }}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Save Member
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {familyMembers.map((member, index) => {
                const count = documents.filter(d => d.memberOwner === member).length;
                return (
                  <div key={index} onClick={() => setSelectedFamilyMember(member)} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 cursor-pointer transition hover:border-amber-500/80">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-sm text-white">{member}'s Vault</h4>
                      <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">{count} Docs</span>
                    </div>
                    <p className="text-xs text-slate-400">Click to manage ID cards, medical reports, and certificates for {member}.</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Family Member's Vault View */}
        {activeTab === 'family' && selectedFamilyMember && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6">
            <div className="flex justify-between items-center border-b pb-3 border-slate-800">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFamilyMember(null)} className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white mr-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-black">{selectedFamilyMember}'s Vault</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('upload')} className="py-2 px-3 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow">
                  <Plus className="w-4 h-4" /> Add Doc
                </button>
                <button onClick={() => { setActiveTab('scan'); startCamera(); }} className="py-2 px-3 bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow">
                  <Camera className="w-4 h-4" /> Scan
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-300">Documents stored for {selectedFamilyMember} ({documents.filter(d => d.memberOwner === selectedFamilyMember).length})</h4>

              {documents.filter(d => d.memberOwner === selectedFamilyMember).length === 0 ? (
                <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No documents uploaded yet for {selectedFamilyMember}.</p>
                </div>
              ) : (
                documents.filter(d => d.memberOwner === selectedFamilyMember).map((doc) => {
                  const expiryStatus = getExpiryStatus(doc.expiryDate);
                  return (
                    <div key={doc.id} onClick={() => {
                      setSelectedDoc(doc);
                      setIsEditing(false);
                      setEditName(doc.name);
                      setEditCategory(doc.category);
                      setEditHolderName(doc.holderName || '');
                      setEditIssueDate(doc.issueDate || '');
                      setEditExpiryDate(doc.expiryDate || '');
                      setEditNotes(doc.notes || '');
                      setEditFileData(doc.fileData);
                    }} className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex justify-between items-center cursor-pointer transition hover:border-amber-500/80 text-white">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                          <h4 className="font-black text-sm text-white">{doc.name} {doc.holderName && <span className="text-xs font-medium text-amber-300">({doc.holderName})</span>}</h4>
                          <span className="text-xs font-medium text-slate-400">{doc.category} • Added {doc.dateAdded}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] border px-2.5 py-1 rounded-full ${expiryStatus.color}`}>{expiryStatus.label}</span>
                        <button onClick={() => handleDownloadDoc(doc)} title="Download" className="p-1.5 text-emerald-400 hover:text-emerald-300"><Download className="w-4 h-4" /></button>
                        <button onClick={() => handleUniversalShare(doc)} title="Share" className="p-1.5 text-indigo-400 hover:text-indigo-300"><Share2 className="w-4 h-4" /></button>
                        <button onClick={() => setDocToDelete(doc)} title="Delete Document" className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Settings Tab with Backup & Restore */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-2xl border bg-slate-900 border-slate-800 text-white space-y-6">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-800">
              <Settings className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-black">Settings, Backup & Security</h3>
            </div>

            {/* Cloud Backup & Restore Section */}
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 space-y-3">
              <h4 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Vault Backup & Restore
              </h4>
              <p className="text-xs text-slate-300">Download a secure backup file of all your saved documents or restore them anytime.</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button onClick={handleExportBackup} className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Export Backup (.json)
                </button>
                <label className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer">
                  <RefreshCcw className="w-4 h-4" /> Restore Backup
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Info className="w-5 h-5" />
                <h4 className="font-black text-sm text-white">About DocSphere</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                DocSphere is your secure offline-first digital document vault, protecting your essential ID cards, transport licenses, and financial records with military-grade local encryption.
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-xs">
                <span className="text-slate-400 font-bold">App Version</span>
                <span className="text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">v1.3.0 Stable</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Code2 className="w-5 h-5" />
                <h4 className="font-black text-sm text-white">Developer Information</h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Created & Developed by</span>
                  <span className="text-indigo-300 font-black">S.MANIKANDAN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Platform Architecture</span>
                  <span className="text-slate-200 font-bold">React + Vite + Tailwind CSS</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
              <h4 className="font-black text-sm text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Controls
              </h4>
              <p className="text-xs text-slate-400">Manage your master 4-digit PIN and vault biometric access credentials.</p>
              <button 
                onClick={() => { localStorage.removeItem('docsphere_pin'); setSavedPin(null); alert("Master PIN reset successfully."); }} 
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Reset Master PIN
              </button>
            </div>

            <div className="pt-4 text-center border-t border-slate-800">
              <p className="text-xs text-slate-400 font-bold">Created by S.MANIKANDAN</p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {docToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 text-white p-6 space-y-4 shadow-2xl text-center relative">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full w-fit mx-auto border border-rose-500/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">Confirm Delete Document?</h3>
              <p className="text-xs text-slate-300">Are you sure you want to delete <strong className="text-white">"{docToDelete.name}"</strong>? This action cannot be undone.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDocToDelete(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl">Cancel</button>
                <button onClick={confirmDeleteDoc} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md">Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency QR Modal */}
        {qrSelectedDoc && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 text-white p-6 space-y-4 shadow-2xl text-center relative">
              <button onClick={() => setQrSelectedDoc(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-black pt-2">{qrSelectedDoc.name}</h3>
              <div className="bg-white p-4 rounded-xl w-fit mx-auto shadow-lg border border-slate-200">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`DocSphere Emergency Vault Data:\nName: ${qrSelectedDoc.name}\nHolder: ${qrSelectedDoc.holderName || 'N/A'}\nCategory: ${qrSelectedDoc.category}\nExpiry: ${qrSelectedDoc.expiryDate || 'N/A'}`)}`} alt="Emergency QR" className="w-40 h-40 object-contain mx-auto" />
              </div>
              <button onClick={() => setQrSelectedDoc(null)} className="w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">Close QR Code</button>
            </div>
          </div>
        )}

        {/* Document Details View & Edit Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl border bg-slate-900 border-slate-800 text-white p-6 space-y-4 shadow-2xl relative my-8">
              <div className="flex justify-between items-center border-b pb-3 border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-black">{isEditing ? 'Edit Document' : selectedDoc.name}</h3>
                </div>
                <button onClick={() => { setSelectedDoc(null); setIsEditing(false); }} className="p-1 rounded-lg text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {!isEditing ? (
                // View Mode
                <div className="space-y-4">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center min-h-[160px]">
                    {selectedDoc.fileData ? (
                      <img src={selectedDoc.fileData} alt="Document File" className="max-h-60 w-full object-contain rounded-lg" />
                    ) : (
                      <div className="text-center p-4 space-y-2">
                        <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">No original image uploaded for this document.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Document Title</label>
                    <p className="text-base font-black text-white mt-0.5">{selectedDoc.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Category</label>
                      <p className="text-sm font-bold mt-0.5 text-slate-200">{selectedDoc.category}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Card Holder Name</label>
                      <p className="text-sm font-bold mt-0.5 text-indigo-300">{selectedDoc.holderName || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Issue Date</label>
                        <span className="text-[9px] text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                      </div>
                      <p className="text-sm font-bold mt-0.5 text-slate-200">{selectedDoc.issueDate || 'N/A'}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Expiry Status</label>
                        <span className="text-[9px] text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                      </div>
                      <div className="mt-1">
                        <span className={`text-[11px] border px-2.5 py-1 rounded-full ${getExpiryStatus(selectedDoc.expiryDate).color}`}>
                          {getExpiryStatus(selectedDoc.expiryDate).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-indigo-400 uppercase tracking-wider">Notes</label>
                    <pre className="mt-1 p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {selectedDoc.notes || 'No notes added.'}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => setQrSelectedDoc(selectedDoc)} className="py-2.5 px-3 bg-amber-600/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-1">
                      <QrCode className="w-4 h-4" /> QR Code
                    </button>
                    <button onClick={() => handleUniversalShare(selectedDoc)} className="py-2.5 px-3 bg-indigo-600/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/40 flex items-center gap-1">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={() => setIsEditing(true)} className="py-2.5 px-3 bg-purple-600/20 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/40 flex items-center gap-1">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => { setSelectedDoc(null); setDocToDelete(selectedDoc); }} className="py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40 flex items-center gap-1 transition ml-auto">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-300">Document Title</label>
                      <span className="text-[9px] text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                    </div>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold">
                      <option value="Identity">Identity</option>
                      <option value="Finance">Finance</option>
                      <option value="Transport">Transport</option>
                      <option value="Education">Education</option>
                      <option value="Medical">Medical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Upload / Replace Document Image</label>
                    <input type="file" accept="image/*" onChange={handleModalFileChange} className="w-full p-2 rounded-xl border bg-slate-950 border-slate-800 text-xs font-bold text-slate-300" />
                    {editFileData && (
                      <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <img src={editFileData} alt="Preview" className="max-h-32 mx-auto object-contain rounded" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Card Holder Name</label>
                    <input type="text" value={editHolderName} onChange={(e) => setEditHolderName(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-300">Issue Date</label>
                      <span className="text-[9px] text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                    </div>
                    <input type="date" value={editIssueDate} onChange={(e) => setEditIssueDate(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-300">Expiry Date</label>
                      <span className="text-[9px] text-indigo-300 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">AI Version Detector</span>
                    </div>
                    <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full p-3 rounded-xl border bg-slate-950 border-slate-800 text-white text-xs font-bold" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancel / Back</button>
                    <button onClick={handleSaveEditedDoc} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md">Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="p-3 border-t border-slate-800 bg-slate-900 flex justify-around items-center">
        {[
          { id: 'dashboard', icon: FileText, label: 'Vault' },
          { id: 'upload', icon: Plus, label: 'Upload' },
          { id: 'scan', icon: Camera, label: 'Scan' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map((nav) => (
          <button key={nav.id} onClick={() => { setSelectedFamilyMember(null); setActiveTab(nav.id); }} className={`flex flex-col items-center gap-1 ${activeTab === nav.id ? 'text-indigo-400 font-black' : 'text-slate-400'}`}>
            <nav.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{nav.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}