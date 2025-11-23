import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { UserRole, ProductState, ProductStatus, Transaction, User, InvoiceData } from './types';
import { blockchainInstance } from './services/blockchainService';
import { generateUID, sha256, generateFakeIPFSCID, hashCustomerId } from './services/cryptoService';
import { generateProductDescription, auditProductHistory } from './services/geminiService';
import { login, getAvailableCategories, addCategory } from './services/authService';
import { StatusBadge } from './components/StatusBadge';
import { Package, Truck, ShoppingCart, Hash, ArrowRight, Activity, Search, Send, Scan, Upload, CheckCircle, Image as ImageIcon, Store, CreditCard, Plus, LogIn, Lock, FileText, Download, Database, AlertTriangle, BadgeCheck, RefreshCcw, Wallet, History, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Sub-Components ---

// 0. Login / Auth View
const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [email, setEmail] = useState('mfg@chainguard.com'); // Default for demo
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const user = await login(email);
        setLoading(false);
        if (user) {
            onLogin(user);
        } else {
            setError('User not found. Try mfg@chainguard.com, warehouse@chainguard.com, or retail@chainguard.com');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="bg-blue-600 p-2 rounded-lg">
                         <Lock className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">ChainGuard Auth</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@chainguard.com"
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded border border-red-400/20">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        {loading ? 'Authenticating...' : <><LogIn size={18} /> Secure Login</>}
                    </button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                    <p className="text-slate-500 text-sm mb-4">Demo Credentials (PC A Roles):</p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs">
                        <button onClick={() => setEmail('mfg@chainguard.com')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300">Manufacturer</button>
                        <button onClick={() => setEmail('warehouse@chainguard.com')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300">Warehouse</button>
                        <button onClick={() => setEmail('retail@chainguard.com')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300">Retailer</button>
                        <button onClick={() => setEmail('admin@chainguard.com')} className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300">Admin</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. Manufacturer View (PC A Bot Functionality)
const ManufacturerView: React.FC<{ products: ProductState[], refresh: () => void, user: User }> = ({ products, refresh, user }) => {
  const [formData, setFormData] = useState({ name: '', category: '', batch: '', model: '', serial: '', expiry: '', warranty: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedUid, setGeneratedUid] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [runSimulation, setRunSimulation] = useState(false);
  
  // PC 2 Output State
  const [pc2Payload, setPc2Payload] = useState<string | null>(null);

  useEffect(() => {
      setCategories(getAvailableCategories());
  }, []);

  const handleAddCategory = () => {
      if (newCat && addCategory(newCat)) {
          setCategories(getAvailableCategories());
          setFormData({...formData, category: newCat});
          setNewCat('');
          setShowAddCat(false);
      }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runFullLifecycleSimulation = async (uid: string, productName: string, cat: string, batch: string) => {
      // Helper for delay
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const actorMfg = user.name;
      const actorWh = "Central Distribution Center";
      const actorRetail = "City Superstore";
      
      // 1. Warehouse Arrival
      await delay(800);
      await blockchainInstance.addTransaction({
          id: await sha256(uid + "arr_wh"), timestamp: Date.now(), type: 'STATUS_UPDATE',
          productUid: uid, actor: actorWh, status: ProductStatus.ARRIVED_WAREHOUSE, location: "Warehouse Dock 1"
      });

      // 2. Warehouse Departure
      await delay(800);
      await blockchainInstance.addTransaction({
          id: await sha256(uid + "dep_wh"), timestamp: Date.now(), type: 'STATUS_UPDATE',
          productUid: uid, actor: actorWh, status: ProductStatus.DEPARTED_WAREHOUSE, location: "Logistics Truck #44"
      });

      // 3. Retail Arrival (Stocked)
      await delay(800);
      await blockchainInstance.addTransaction({
          id: await sha256(uid + "arr_shop"), timestamp: Date.now(), type: 'STATUS_UPDATE',
          productUid: uid, actor: actorRetail, status: ProductStatus.ARRIVED_SHOP, location: "Store Backroom"
      });

      // 4. Available for Sale
      await delay(800);
      await blockchainInstance.addTransaction({
          id: await sha256(uid + "avail"), timestamp: Date.now(), type: 'STATUS_UPDATE',
          productUid: uid, actor: actorRetail, status: ProductStatus.AVAILABLE_FOR_SALE, location: "Shelf A1"
      });

      // 5. Sold to Customer (Generate Invoice)
      await delay(800);
      const custEmail = "demo_customer@email.com";
      const custHash = await hashCustomerId(custEmail);
      
      const inv: InvoiceData = {
          invoiceId: `INV-${Date.now()}`, productUid: uid, productName: productName, category: cat, batchNumber: batch,
          price: "199.99", currency: "USD", purchaseDate: new Date().toISOString(), shopName: actorRetail,
          shopLocation: "Main Street Branch", customerIdHash: custHash
      };
      await blockchainInstance.addTransaction({
          id: await sha256(uid + "sold"), timestamp: Date.now(), type: 'STATUS_UPDATE',
          productUid: uid, actor: actorRetail, status: ProductStatus.SOLD_TO_CUSTOMER, location: "POS Terminal 1",
          metadata: {
              name: productName, category: cat, batchNumber: batch, manufactureDate: "", manufacturer: "", 
              invoice: inv
          } // Simplified meta update
      });

      refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPc2Payload(null);
    
    const uid = generateUID();
    const desc = await generateProductDescription(formData.name, formData.category);
    let imgHash = "";
    let ipfsCid = "";
    
    if (imagePreview) {
        imgHash = await sha256(imagePreview);
        ipfsCid = await generateFakeIPFSCID(imagePreview);
    }

    const tx: Transaction = {
      id: await sha256(uid + Date.now()),
      timestamp: Date.now(),
      type: 'REGISTRATION',
      productUid: uid,
      actor: user.name,
      status: ProductStatus.PRODUCT_CREATED,
      metadata: {
        name: formData.name,
        category: formData.category,
        batchNumber: formData.batch,
        model: formData.model || undefined,
        serialNumber: formData.serial || undefined,
        manufactureDate: new Date().toISOString(),
        manufacturer: user.name,
        expiryDate: formData.expiry || undefined,
        warranty: formData.warranty || undefined,
        imageUrl: imagePreview || undefined,
        imageHash: imgHash,
        ipfsCid: ipfsCid,
        details: desc
      }
    };

    await blockchainInstance.addTransaction(tx);
    
    // Depart Manufacturer
    const tx2: Transaction = {
        id: await sha256(uid + Date.now() + "auto"),
        timestamp: Date.now() + 1000,
        type: 'STATUS_UPDATE',
        productUid: uid,
        actor: user.name,
        status: ProductStatus.DEPARTED_MANUFACTURER,
        location: "Factory Output",
        notes: "Auto-dispatch upon creation"
    };
    await blockchainInstance.addTransaction(tx2);

    // Run Full Simulation if toggled
    if (runSimulation) {
        await runFullLifecycleSimulation(uid, formData.name, formData.category, formData.batch);
    }

    setGeneratedUid(uid);
    
    // Generate PC 2 Output
    const payload = {
        "rpc_url": "https://rpc.chainguard-sim.net/v1",
        "contract_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        "contract_abi": [ "function registerProduct(string memory uid, string memory ipfsCid) public", "event ProductRegistered(string uid, address owner)" ],
        "product_id": uid,
        "metadata_cid": ipfsCid || "QmSimulatedHashForDemo...",
        "owner_address": "0xCustomerWalletAddressAfterSale"
    };
    setPc2Payload(JSON.stringify(payload, null, 2));

    setLoading(false);
    setFormData({ name: '', category: '', batch: '', model: '', serial: '', expiry: '', warranty: '' });
    setImageFile(null);
    setImagePreview(null);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
            <Package className="text-blue-400" /> PC A: Register & Simulate
          </h3>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                  <input required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. UltraBlend 3000" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Batch #</label>
                  <input required className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} placeholder="BATCH-001" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Model (Opt)</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. Ver 2.0" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Serial No. (Opt)</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" value={formData.serial} onChange={e => setFormData({...formData, serial: e.target.value})} placeholder="SN-123456" />
               </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:bg-slate-750 transition">
                <input type="file" id="prod-img" className="hidden" accept="image/*" onChange={handleImageChange} />
                <label htmlFor="prod-img" className="cursor-pointer flex flex-col items-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                    ) : (
                        <><Upload className="text-slate-500 mb-2" /><span className="text-slate-400 text-sm">Upload Product Image (IPFS)</span></>
                    )}
                </label>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-700">
                <input type="checkbox" id="simMode" checked={runSimulation} onChange={e => setRunSimulation(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="simMode" className="text-sm text-slate-300 cursor-pointer">
                    Simulate Full Lifecycle (Factory &rarr; Customer)
                </label>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded flex justify-center items-center gap-2 mt-2">
              {loading ? 'Processing Bot Action...' : 'Register & Execute Bot'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
            {/* Status Panel */}
            <div>
              {generatedUid ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center animate-pulse">
                   <div className="bg-green-500/20 p-4 rounded-full mb-4"><Hash className="text-green-400 w-8 h-8" /></div>
                   <h4 className="text-green-400 font-bold text-lg mb-2">PC A: Task Complete</h4>
                   <p className="text-slate-400 text-sm mb-4">Product lifecycle generated successfully.</p>
                   <code className="bg-slate-950 px-4 py-2 rounded text-green-300 font-mono text-sm break-all">{generatedUid}</code>
                </div>
              ) : (
                 <div className="bg-slate-800/50 border border-slate-700/50 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center h-full">
                   <Package className="text-slate-600 w-12 h-12 mb-2" />
                   <p className="text-slate-500">Blockchain Ledger Writer (PC A)</p>
                   <p className="text-xs text-slate-600 mt-2 max-w-xs">Waiting to generate supply chain data...</p>
                 </div>
              )}
            </div>

            {/* PC 2 Connection Payload Output */}
            {pc2Payload && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs relative group">
                    <div className="absolute top-2 right-2 bg-slate-800 text-slate-400 px-2 py-1 rounded text-[10px] uppercase tracking-wider">PC 2 Payload</div>
                    <pre className="text-blue-300 overflow-x-auto whitespace-pre-wrap break-all">
                        {pc2Payload}
                    </pre>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// 2. Logistics Scanner (Warehouse & Retailer)
const ScanInterface: React.FC<{ 
    role: UserRole, 
    products: ProductState[], 
    refresh: () => void,
    user: User
}> = ({ role, products, refresh, user }) => {
    const [activeTab, setActiveTab] = useState<'SCAN' | 'REFUNDS'>('SCAN');
    const [scanId, setScanId] = useState('');
    const [scannedProduct, setScannedProduct] = useState<ProductState | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState<{type: 'error'|'success', msg: string} | null>(null);
    
    // Retail POS State
    const [salePrice, setSalePrice] = useState('99.99');
    const [customerId, setCustomerId] = useState('');
    const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);

    const refundedProducts = products.filter(p => p.currentStatus === ProductStatus.REFUNDED);

    const handleScan = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const p = products.find(prod => prod.uid === scanId);
        if (!p) {
            setFeedback({type: 'error', msg: 'Product UID not found.'});
            setScannedProduct(null);
            return;
        }
        setScannedProduct(p);
        setFeedback(null);
        setGeneratedInvoice(null);
        setSalePrice('99.99'); // Reset defaults
        setCustomerId('');
    };

    const getNextAction = (currentStatus: ProductStatus): { label: string, nextStatus: ProductStatus, requiresInput?: boolean } | null => {
        if (role === UserRole.WAREHOUSE) {
            if (currentStatus === ProductStatus.DEPARTED_MANUFACTURER) 
                return { label: 'Scan Arrival @ Warehouse', nextStatus: ProductStatus.ARRIVED_WAREHOUSE };
            if (currentStatus === ProductStatus.ARRIVED_WAREHOUSE) 
                return { label: 'Scan Departure -> Shop', nextStatus: ProductStatus.DEPARTED_WAREHOUSE };
        }
        if (role === UserRole.RETAILER) {
            if (currentStatus === ProductStatus.DEPARTED_WAREHOUSE) 
                return { label: 'Scan Arrival (Stock Product)', nextStatus: ProductStatus.ARRIVED_SHOP }; // Arrived Shop = Stocked
            if (currentStatus === ProductStatus.ARRIVED_SHOP) 
                return { label: 'Mark Available for Sale', nextStatus: ProductStatus.AVAILABLE_FOR_SALE };
            if (currentStatus === ProductStatus.AVAILABLE_FOR_SALE) 
                return { label: 'Finalize Sale (POS)', nextStatus: ProductStatus.SOLD_TO_CUSTOMER, requiresInput: true };
        }
        return null;
    };

    const handleAction = async (nextStatus: ProductStatus) => {
        if (!scannedProduct) return;
        setActionLoading(true);

        const validation = blockchainInstance.validateTransition(scannedProduct, nextStatus, role);
        if (!validation.valid) {
            setFeedback({type: 'error', msg: validation.error || "Invalid Transition"});
            setActionLoading(false);
            return;
        }

        let invoice: InvoiceData | undefined;
        
        // Generate Invoice if selling
        if (nextStatus === ProductStatus.SOLD_TO_CUSTOMER) {
            if (!customerId) {
                 setFeedback({type: 'error', msg: "Customer ID is required for invoice."});
                 setActionLoading(false);
                 return;
            }
            
            invoice = {
                invoiceId: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                productUid: scannedProduct.uid,
                productName: scannedProduct.metadata.name,
                category: scannedProduct.metadata.category,
                batchNumber: scannedProduct.metadata.batchNumber,
                price: salePrice,
                currency: 'USD',
                purchaseDate: new Date().toISOString(),
                shopName: user.name,
                shopLocation: "Retail Location A",
                customerIdHash: await hashCustomerId(customerId)
            };
            setGeneratedInvoice(invoice);
        }

        const tx: Transaction = {
            id: await sha256(scannedProduct.uid + Date.now()),
            timestamp: Date.now(),
            type: 'STATUS_UPDATE',
            productUid: scannedProduct.uid,
            actor: user.name,
            status: nextStatus,
            location: role === UserRole.WAREHOUSE ? "Central Distribution Center" : user.name,
            notes: nextStatus === ProductStatus.SOLD_TO_CUSTOMER ? 'Product sold via POS system' : `Scanned by ${role}`,
            metadata: invoice ? {
                ...scannedProduct.metadata,
                invoice: invoice
            } : undefined
        };

        await blockchainInstance.addTransaction(tx);
        
        setFeedback({type: 'success', msg: `Status Updated: ${nextStatus}`});
        setScannedProduct({...scannedProduct, currentStatus: nextStatus, metadata: tx.metadata || scannedProduct.metadata});
        setActionLoading(false);
        refresh();
    };

    const downloadInvoice = () => {
        if (!generatedInvoice) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedInvoice, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `Invoice_${generatedInvoice.invoiceId}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const nextAction = scannedProduct ? getNextAction(scannedProduct.currentStatus) : null;

    return (
        <div className="space-y-6">
            {role === UserRole.RETAILER && (
                <div className="flex gap-4 mb-4 border-b border-slate-700 pb-4">
                    <button onClick={() => setActiveTab('SCAN')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'SCAN' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Scan & POS</button>
                    <button onClick={() => setActiveTab('REFUNDS')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'REFUNDS' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        Refunds Monitor
                        {refundedProducts.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{refundedProducts.length}</span>}
                    </button>
                </div>
            )}

            {activeTab === 'SCAN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 flex flex-col items-center text-center">
                        <div className="bg-blue-500/20 p-4 rounded-full mb-6">
                            <Scan className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Supply Chain Scanner</h3>
                        <p className="text-slate-400 text-sm mb-6">Authenticated as: {user.name} ({role})</p>
                        
                        <form onSubmit={handleScan} className="w-full max-w-sm relative">
                            <input 
                                value={scanId}
                                onChange={(e) => setScanId(e.target.value)}
                                placeholder="Scan Product Barcode / UID"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center text-white"
                            />
                            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-blue-400">
                                <ArrowRight size={20} />
                            </button>
                        </form>

                        {/* Simulated Quick Scan List */}
                        <div className="mt-8 w-full border-t border-slate-700 pt-4">
                            <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Ready to Scan (Queue)</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {products.filter(p => getNextAction(p.currentStatus)).slice(0, 4).map(p => (
                                    <button 
                                        key={p.uid}
                                        onClick={() => { setScanId(p.uid); setFeedback(null); setScannedProduct(null); setGeneratedInvoice(null); }}
                                        className="text-xs bg-slate-700 px-2 py-1 rounded hover:bg-slate-600 text-slate-300 font-mono"
                                    >
                                        {p.uid.substring(0,8)}...
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col">
                        <h3 className="font-semibold text-lg mb-4 text-white">Product Status</h3>
                        {feedback && (
                            <div className={`p-3 rounded-lg mb-4 text-sm ${feedback.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                {feedback.msg}
                            </div>
                        )}
                        
                        {scannedProduct ? (
                            <div className="flex-1 flex flex-col">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                                        {scannedProduct.metadata.imageUrl ? (
                                            <img src={scannedProduct.metadata.imageUrl} className="w-full h-full object-cover" alt="prod" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={24}/></div>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{scannedProduct.metadata.name}</h4>
                                        <div className="mb-2"><StatusBadge status={scannedProduct.currentStatus} /></div>
                                        <p className="text-xs text-slate-400 font-mono">{scannedProduct.uid}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-sm text-slate-300 space-y-2">
                                    <div className="flex justify-between"><span>Category:</span> <span className="text-white">{scannedProduct.metadata.category}</span></div>
                                    <div className="flex justify-between"><span>Batch:</span> <span className="text-white">{scannedProduct.metadata.batchNumber}</span></div>
                                    {scannedProduct.currentStatus === ProductStatus.SOLD_TO_CUSTOMER && (
                                        <div className="pt-2 mt-2 border-t border-slate-700">
                                            <div className="flex justify-between text-green-400 font-bold"><span>SOLD</span> <span>Verified</span></div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    {generatedInvoice ? (
                                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center">
                                            <FileText className="mx-auto text-green-400 mb-2" size={32} />
                                            <p className="text-green-300 font-bold mb-1">Invoice Generated</p>
                                            <p className="text-green-400/60 text-xs mb-3">Ref: {generatedInvoice.invoiceId}</p>
                                            <button 
                                                onClick={downloadInvoice}
                                                className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded flex items-center justify-center gap-2 w-full"
                                            >
                                                <Download size={16} /> Download Invoice (JSON)
                                            </button>
                                        </div>
                                    ) : nextAction ? (
                                        <div className="space-y-3">
                                            {nextAction.requiresInput && (
                                                <div className="bg-slate-900 p-4 rounded border border-slate-700 space-y-3">
                                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Point of Sale Details</div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 block mb-1">Sale Price ($)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                                            value={salePrice}
                                                            onChange={e => setSalePrice(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 block mb-1">Customer ID / Email (to hash)</label>
                                                        <input 
                                                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                                                            placeholder="customer@email.com"
                                                            value={customerId}
                                                            onChange={e => setCustomerId(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleAction(nextAction.nextStatus)}
                                                disabled={actionLoading}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/50 transition flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? 'Updating Chain...' : (
                                                    <>
                                                        {nextAction.requiresInput ? <CreditCard size={18} /> : <CheckCircle size={18} />} 
                                                        {nextAction.label}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-3 bg-slate-700/30 rounded text-slate-500 text-sm">
                                            No further actions available for your role.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                <Search size={48} className="mb-2 opacity-20" />
                                <p>Awaiting Scan...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'REFUNDS' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                     <div className="p-6 border-b border-slate-700">
                         <h3 className="text-xl font-bold text-white flex items-center gap-2"><RefreshCcw size={20} className="text-blue-400"/> Refunded Products Monitor</h3>
                         <p className="text-sm text-slate-400 mt-1">Live tracking of Phase 2 refund approvals.</p>
                     </div>
                     {refundedProducts.length === 0 ? (
                         <div className="p-12 text-center text-slate-500">No refund records found on blockchain.</div>
                     ) : (
                         <div className="overflow-x-auto">
                             <table className="w-full text-sm text-left text-slate-400">
                                 <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                     <tr>
                                         <th className="px-6 py-3">Product UID</th>
                                         <th className="px-6 py-3">Product Name</th>
                                         <th className="px-6 py-3">Customer Hash</th>
                                         <th className="px-6 py-3">Refund Date</th>
                                         <th className="px-6 py-3">Status</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {refundedProducts.map(p => (
                                         <tr key={p.uid} className="border-b border-slate-700/50 hover:bg-slate-750">
                                             <td className="px-6 py-4 font-mono text-blue-300">{p.uid.substring(0,12)}...</td>
                                             <td className="px-6 py-4 font-medium text-white">{p.metadata.name}</td>
                                             <td className="px-6 py-4 font-mono text-xs">{p.metadata.invoice?.customerIdHash.substring(0,10)}...</td>
                                             <td className="px-6 py-4">{new Date(p.history.find(h => h.status === ProductStatus.REFUNDED)?.timestamp || 0).toLocaleDateString()}</td>
                                             <td className="px-6 py-4"><span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold">REFUNDED</span></td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}
                </div>
            )}
        </div>
    );
}

// 3. Public / Customer View (Updated with My Orders & Refunds)
const PublicVerificationView: React.FC<{ products: ProductState[], refresh: () => void }> = ({ products, refresh }) => {
    const [activeTab, setActiveTab] = useState<'VERIFY' | 'ORDERS' | 'REFUND_FORM'>('VERIFY');
    
    // Auth for Orders
    const [customerEmail, setCustomerEmail] = useState('demo_customer@email.com');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [myOrders, setMyOrders] = useState<ProductState[]>([]);

    // Verification State
    const [searchUid, setSearchUid] = useState('');
    const [foundProduct, setFoundProduct] = useState<ProductState | null>(null);
    const [aiAudit, setAiAudit] = useState<string>('');

    // Refund Portal State
    const [refundUid, setRefundUid] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [refundStep, setRefundStep] = useState<number>(0); // 0: Input, 1: OCR/Processing, 2: Result
    const [refundResult, setRefundResult] = useState<{success: boolean, title: string, msg: string} | null>(null);

    // Sim Login
    const handleCustomerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const hash = await hashCustomerId(customerEmail);
        // Filter blockchain products for this customer hash
        const orders = products.filter(p => 
            p.currentStatus !== ProductStatus.PRODUCT_CREATED && // Basic check
            p.metadata.invoice?.customerIdHash === hash
        );
        setMyOrders(orders);
        setIsLoggedIn(true);
        setActiveTab('ORDERS');
    };

    const handleSearch = async () => {
        const p = products.find(prod => prod.uid === searchUid);
        setFoundProduct(p || null);
        setAiAudit('');
        if (p) {
            const audit = await auditProductHistory(p);
            setAiAudit(audit);
        }
    };

    const initiateRefund = (uid: string) => {
        setRefundUid(uid);
        setActiveTab('REFUND_FORM');
        setRefundStep(0);
        setRefundResult(null);
        setInvoiceFile(null);
    };

    const handleRefundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRefundStep(1);
        
        // Step 1: Simulate OCR Delay & Extraction
        await new Promise(res => setTimeout(res, 2000)); // Wait 2s
        
        // Step 2: Blockchain Lookup
        const product = products.find(p => p.uid === refundUid);
        
        // Step 3: Validation Logic
        if (!product) {
             setRefundResult({ success: false, title: "Refund Rejected", msg: "Product UID does not exist on the blockchain." });
             setRefundStep(2);
             return;
        }

        const eligibility = blockchainInstance.checkRefundEligibility(product);
        
        if (!eligibility.eligible) {
            setRefundResult({ success: false, title: "Refund Rejected", msg: eligibility.reason || "Eligibility verification failed." });
            setRefundStep(2);
            return;
        }

        // Step 4: Simulate OCR Matching (Check if file was uploaded)
        if (!invoiceFile) {
             setRefundResult({ success: false, title: "Validation Error", msg: "No invoice document detected." });
             setRefundStep(2);
             return;
        }
        
        // Step 5: Process Refund (Write to Blockchain)
        const tx: Transaction = {
            id: await sha256(refundUid + "refund"),
            timestamp: Date.now(),
            type: 'REFUND_DECISION',
            productUid: refundUid,
            actor: "System Automated Refund Processor",
            status: ProductStatus.REFUNDED,
            refundData: {
                requestId: `REQ-${Date.now()}`,
                timestamp: Date.now(),
                status: 'APPROVED',
                refundAmount: product.metadata.invoice?.price || "N/A"
            }
        };
        await blockchainInstance.addTransaction(tx);
        
        setRefundResult({ success: true, title: "Refund Approved", msg: "Funds will be returned to original payment method within 3-5 business days." });
        setRefundStep(2);
        refresh();
        
        // Refresh orders if logged in
        if (isLoggedIn) {
            // Re-fetch logic essentially
            const hash = await hashCustomerId(customerEmail);
            const orders = blockchainInstance.getAllProducts().filter(p => p.metadata.invoice?.customerIdHash === hash);
            setMyOrders(orders);
        }
    };

    const resetRefund = () => {
        setRefundStep(0);
        setRefundResult(null);
        setRefundUid('');
        setInvoiceFile(null);
    };

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Customer Services Portal</h2>
                {!isLoggedIn ? (
                    <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 mt-6">
                        <h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2"><Wallet size={20}/> My Orders & Wallet</h3>
                        <form onSubmit={handleCustomerLogin} className="flex gap-2">
                            <input 
                                type="email" 
                                required
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={customerEmail}
                                onChange={e => setCustomerEmail(e.target.value)}
                                placeholder="Enter email used at purchase..."
                            />
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">View</button>
                        </form>
                        <p className="text-xs text-slate-500 mt-2">Try: demo_customer@email.com</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center mt-4">
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => setActiveTab('VERIFY')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition ${activeTab === 'VERIFY' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Scan / Verify
                            </button>
                            <button 
                                onClick={() => setActiveTab('ORDERS')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition ${activeTab === 'ORDERS' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                My Orders ({myOrders.length})
                            </button>
                        </div>
                        <button onClick={() => { setIsLoggedIn(false); setMyOrders([]); }} className="text-xs text-slate-500 mt-2 underline">Sign Out of Wallet</button>
                    </div>
                )}
            </div>
            
            {activeTab === 'VERIFY' && (
                <div className="animate-fade-in">
                    <div className="max-w-xl mx-auto flex gap-2 mb-8">
                        <input 
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Enter Product UID..."
                            value={searchUid}
                            onChange={(e) => setSearchUid(e.target.value)}
                        />
                        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition">
                            Verify
                        </button>
                    </div>

                    {foundProduct && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Product Details Card */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <div className="w-full aspect-square bg-slate-900 rounded-lg mb-4 overflow-hidden border border-slate-700">
                                        {foundProduct.metadata.imageUrl ? (
                                            <img src={foundProduct.metadata.imageUrl} alt="prod" className="w-full h-full object-cover" />
                                        ) : <div className="flex items-center justify-center h-full text-slate-600"><ImageIcon size={48}/></div>}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{foundProduct.metadata.name}</h3>
                                    <div className="my-2"><StatusBadge status={foundProduct.currentStatus} /></div>
                                    
                                    <div className="space-y-2 text-sm text-slate-300 mt-4 border-t border-slate-700 pt-4">
                                        <div className="flex justify-between"><span>Category:</span> <span className="text-white">{foundProduct.metadata.category}</span></div>
                                        <div className="flex justify-between"><span>Batch:</span> <span className="text-white">{foundProduct.metadata.batchNumber}</span></div>
                                        {foundProduct.metadata.model && <div className="flex justify-between"><span>Model:</span> <span className="text-white">{foundProduct.metadata.model}</span></div>}
                                    </div>
                                    
                                    {foundProduct.currentStatus === ProductStatus.REFUNDED && (
                                        <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded text-red-300 text-xs font-bold text-center">
                                            This product has been refunded and is no longer active.
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2"><Activity size={14}/> AI Audit Log</h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">{aiAudit || 'Analyzing chain data...'}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                                    <Truck size={20} className="text-blue-400"/> Provenance Timeline
                                </h3>
                                <div className="relative border-l-2 border-slate-700 ml-3 space-y-8 pl-8 pb-4">
                                    {foundProduct.history.map((tx, idx) => (
                                        <div key={tx.id} className="relative">
                                            <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-2 ${idx === foundProduct.history.length-1 ? 'bg-blue-500 border-blue-500' : 'bg-slate-900 border-slate-600'}`}></div>
                                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-mono text-xs text-slate-500">{new Date(tx.timestamp).toLocaleString()}</span>
                                                    <StatusBadge status={tx.status} />
                                                </div>
                                                <p className="text-sm text-slate-300"><span className="text-slate-500">Actor:</span> {tx.actor}</p>
                                                <p className="text-sm text-slate-300"><span className="text-slate-500">Location:</span> {tx.location || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'ORDERS' && (
                <div className="animate-fade-in max-w-4xl mx-auto">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><History size={20}/> Order History</h3>
                    {myOrders.length === 0 ? (
                        <div className="bg-slate-800 p-8 rounded-xl text-center border border-slate-700 text-slate-500">
                            No orders found for <strong>{customerEmail}</strong>. <br/>
                            <span className="text-xs mt-2 block">Note: Ensure the email matches the one used at POS in the Retailer view.</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myOrders.map(order => (
                                <div key={order.uid} className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="w-24 h-24 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-600">
                                         {order.metadata.imageUrl ? (
                                            <img src={order.metadata.imageUrl} alt="prod" className="w-full h-full object-cover" />
                                        ) : <div className="flex items-center justify-center h-full text-slate-600"><ImageIcon size={24}/></div>}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="font-bold text-white text-lg">{order.metadata.name}</h4>
                                        <p className="text-sm text-slate-400 font-mono mb-2">{order.uid}</p>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                                            <StatusBadge status={order.currentStatus} />
                                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">Bought: {new Date(order.metadata.invoice?.purchaseDate || "").toLocaleDateString()}</span>
                                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">${order.metadata.invoice?.price}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {order.currentStatus === ProductStatus.SOLD_TO_CUSTOMER ? (
                                            <button 
                                                onClick={() => initiateRefund(order.uid)}
                                                className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
                                            >
                                                <AlertCircle size={16} /> Request Refund
                                            </button>
                                        ) : order.currentStatus === ProductStatus.REFUNDED ? (
                                            <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-bold border border-green-500/20 flex items-center gap-2">
                                                <CheckCircle size={16} /> Refund Approved
                                            </div>
                                        ) : (
                                            <span className="text-slate-500 text-xs">Processing</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'REFUND_FORM' && (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <button onClick={() => setActiveTab(isLoggedIn ? 'ORDERS' : 'VERIFY')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">&larr; Back</button>
                    {refundStep === 0 && (
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <RefreshCcw className="text-blue-400"/> Request a Refund
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Phase 2 Verification: We will check the blockchain ledger for this specific unit's history.
                            </p>
                            <form onSubmit={handleRefundSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Product UID</label>
                                    <input 
                                        readOnly
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed outline-none"
                                        value={refundUid}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Upload Purchase Invoice / Bill</label>
                                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:bg-slate-750 transition cursor-pointer relative">
                                        <input 
                                            type="file" 
                                            required 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                                        />
                                        <FileText className="mx-auto text-slate-500 mb-2" size={32}/>
                                        <p className="text-slate-400 text-sm">{invoiceFile ? invoiceFile.name : "Drag & Drop or Click to Upload PDF/Image"}</p>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition">
                                        Verify & Submit Claim
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {refundStep === 1 && (
                        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Verifying Claim...</h3>
                            <p className="text-slate-400 text-sm animate-pulse">
                                Scanning Invoice (OCR) &bull; Checking Blockchain Ledger &bull; Validating Supply Chain Path
                            </p>
                        </div>
                    )}

                    {refundStep === 2 && refundResult && (
                        <div className={`bg-slate-800 rounded-xl p-8 border ${refundResult.success ? 'border-green-500/30' : 'border-red-500/30'} shadow-xl text-center`}>
                            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${refundResult.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {refundResult.success ? <BadgeCheck size={32} /> : <AlertTriangle size={32} />}
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${refundResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                {refundResult.title}
                            </h3>
                            <p className="text-slate-300 mb-8 max-w-md mx-auto">{refundResult.msg}</p>
                            
                            <button 
                                onClick={resetRefund}
                                className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
                            >
                                Process Another Request
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// 4. Explorer (Admin) - No Changes Needed

// Main App Controller
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductState[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const allProducts = blockchainInstance.getAllProducts();
    setProducts(allProducts);
  }, [lastUpdate]);

  const refreshChain = () => {
    setLastUpdate(Date.now());
  };

  if (!user) {
      return (
          <div className="bg-slate-900 min-h-screen text-white relative">
               {/* Public Access Link for Customers */}
               <div className="absolute top-4 right-4 z-20">
                   <button 
                    onClick={() => setUser({id: 'public', name: 'Public User', email: '', role: UserRole.CUSTOMER})}
                    className="text-sm text-slate-400 hover:text-white underline"
                   >
                       Public Verification & Refund Portal &rarr;
                   </button>
               </div>
               <AuthView onLogin={setUser} />
          </div>
      );
  }

  return (
    <Layout currentUser={user} onLogout={() => setUser(null)}>
      {user.role === UserRole.MANUFACTURER && (
        <ManufacturerView products={products} refresh={refreshChain} user={user} />
      )}
      
      {(user.role === UserRole.WAREHOUSE || user.role === UserRole.RETAILER) && (
        <ScanInterface role={user.role} products={products} refresh={refreshChain} user={user} />
      )}

      {user.role === UserRole.CUSTOMER && (
        <PublicVerificationView products={products} refresh={refreshChain} />
      )}

      {/* Explorer view is reused via Layout if needed, or can be added explicitly */}
    </Layout>
  );
};

export default App;