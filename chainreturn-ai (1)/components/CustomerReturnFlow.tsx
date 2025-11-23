
import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, Loader2, ShieldCheck, RefreshCw, Search, ShoppingBag, ArrowRight, PackageX, AlertTriangle, Ban, Barcode, Truck, Cpu, FileText, ScanLine, Siren, Network, Fingerprint, Mail, Download, X, ExternalLink, Send, Bot, Link2, Terminal, Database } from 'lucide-react';
import { ReturnStep, AnalysisResult, Block, OrderDetails, ReceiptAnalysis, User, ExternalBot, BotOpinion, ProductPassport } from '../types';
import { analyzeReturnVideo, analyzeReceipt, consultExternalBot } from '../services/geminiService';
import { createReturnBlock } from '../services/blockchainService';
import { fetchOrderDetails, SUPPORTED_PLATFORMS } from '../services/ecommerceService';
import { fetchProductPassport } from '../services/supplyChainService';
import { evaluateReturnPolicy } from '../services/policyService';
import { analyzeFraudPatterns } from '../services/fraudService';
import { sendReturnStatusEmail, generateReturnEmail, EmailContent } from '../services/notificationService';
import { ToastType } from './Toast';
import SupplyChainVisualizer from './SupplyChainVisualizer';

interface CustomerReturnFlowProps {
  user: User;
  onBlockCreated: (block: Block) => void;
  lastBlockHash: string;
  blockHeight: number;
  showToast: (type: ToastType, title: string, message: string) => void;
  connectedBots: ExternalBot[];
}

const CustomerReturnFlow: React.FC<CustomerReturnFlowProps> = ({ user, onBlockCreated, lastBlockHash, blockHeight, showToast, connectedBots }) => {
  const [step, setStep] = useState<ReturnStep>(ReturnStep.ORDER_LOOKUP);
  const [orderId, setOrderId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(SUPPORTED_PLATFORMS[0].id);
  const [isFetchingOrder, setIsFetchingOrder] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Manual Import State
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgeJson, setBridgeJson] = useState('');
  
  // Supply Chain State
  const [productPassport, setProductPassport] = useState<ProductPassport | null>(null);

  // Receipt State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptAnalysis, setReceiptAnalysis] = useState<ReceiptAnalysis | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [createdBlock, setCreatedBlock] = useState<Block | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Email Simulation State
  const [generatedEmail, setGeneratedEmail] = useState<EmailContent | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Multi-Agent State
  const [agentOpinions, setAgentOpinions] = useState<BotOpinion[]>([]);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);

  // Image fallback state
  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    if (orderDetails?.productImage) {
      setImgSrc(orderDetails.productImage);
    }
  }, [orderDetails]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFetchingOrder(true);
    setError(null);
    try {
      const details = await fetchOrderDetails(selectedPlatform, orderId);
      // OVERRIDE mock user data with Real Logged In User
      details.userEmail = user.email;
      details.userId = user.name;
      
      setOrderDetails(details);
      
      const passport = await fetchProductPassport(details.sku, details.productName);
      setProductPassport(passport);
      
      showToast('success', 'Order Found', `Synced ledger for ${details.productName}.`);
      setStep(ReturnStep.SUPPLY_CHAIN_SYNC); 
    } catch (err: any) {
      setError(err.message || "Could not find order.");
      setOrderDetails(null);
      showToast('error', 'Order Lookup Failed', err.message || "Could not locate this order ID.");
      setIsFetchingOrder(false);
    }
  };

  const handleBridgeImport = () => {
    try {
        const importedData = JSON.parse(bridgeJson);
        
        // Basic validation
        if (!importedData.productName || !importedData.orderId) {
            throw new Error("Invalid JSON: Missing productName or orderId");
        }

        // Map JSON to OrderDetails
        const details: OrderDetails = {
            platform: importedData.platform || selectedPlatform,
            orderId: importedData.orderId,
            productName: importedData.productName,
            category: importedData.category || 'Electronics',
            price: importedData.price || 0,
            purchaseDate: importedData.purchaseDate || new Date().toISOString(),
            productImage: importedData.productImage,
            sku: importedData.sku || "UNKNOWN-SKU",
            serialNumber: importedData.serialNumber,
            fulfillmentStatus: importedData.fulfillmentStatus || 'Delivered',
            userId: user.name,
            userEmail: user.email,
            userIp: "127.0.0.1",
            deviceId: "BRIDGE-IMPORT"
        };

        setOrderDetails(details);
        setOrderId(details.orderId);
        
        // Create a simulated passport from imported history if available
        if (importedData.history) {
             setProductPassport({
                 uniqueId: details.sku,
                 genesisHash: "IMPORTED_HASH",
                 manufactureDate: importedData.manufactureDate || new Date().toISOString(),
                 originFactory: importedData.originFactory || "Imported Node",
                 history: importedData.history
             });
        } else {
            // Fallback to generating one
             fetchProductPassport(details.sku, details.productName).then(p => setProductPassport(p));
        }

        setShowBridgeModal(false);
        showToast('success', 'Data Bridged', 'Successfully imported data from Manufacturing Node.');
        setStep(ReturnStep.SUPPLY_CHAIN_SYNC);

    } catch (e) {
        showToast('error', 'Import Failed', 'Invalid JSON format. Please check your input.');
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'image/avif') {
        showToast('error', 'Unsupported Format', 'AVIF images are not currently supported. Please use JPG, PNG, or WEBP.');
        return;
      }
      setReceiptFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processReceipt = async () => {
    if (!receiptFile || !receiptPreview || !orderDetails) return;
    setStep(ReturnStep.RECEIPT_ANALYZING);
    try {
      const base64Data = receiptPreview.split(',')[1];
      const result = await analyzeReceipt(base64Data, receiptFile.type, orderDetails.platform);
      setReceiptAnalysis(result);
      setOrderDetails(prev => prev ? { ...prev, receiptVerified: result.isValid } : null);
      
      if (result.isValid) showToast('success', 'Receipt Verified', `Valid proof of purchase from ${result.merchantName}.`);
      else showToast('warning', 'Receipt Unverified', 'Could not verify document.');
      setStep(ReturnStep.UPLOAD);
    } catch (err) {
      showToast('error', 'Analysis Failed', 'Error processing receipt.');
      setStep(ReturnStep.RECEIPT_UPLOAD);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'image/avif') {
        showToast('error', 'Unsupported Format', 'AVIF not supported.');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const startProcess = async () => {
    if (!file || !preview || !orderDetails) return;
    setStep(ReturnStep.ANALYZING);
    try {
      const base64Data = preview.split(',')[1]; 
      const aiResult = await analyzeReturnVideo(base64Data, file.type, orderDetails.productName, orderDetails.price, orderDetails.receiptVerified);

      setStep(ReturnStep.FRAUD_CHECK);
      const fraudReport = await analyzeFraudPatterns(orderDetails, aiResult);
      
      let tempAnalysis = { ...aiResult, fraudRisk: fraudReport, botConsensus: [] as BotOpinion[] };

      if (connectedBots.length > 0) {
        setStep(ReturnStep.MULTI_AGENT_CONSENSUS);
        const opinions: BotOpinion[] = [];
        for (let i = 0; i < connectedBots.length; i++) {
          setActiveAgentIndex(i);
          const bot = connectedBots[i];
          const opinion = await consultExternalBot(bot.name, bot.role, bot.systemInstruction, orderDetails, tempAnalysis);
          opinions.push(opinion);
          setAgentOpinions(prev => [...prev, opinion]);
        }
        tempAnalysis.botConsensus = opinions;
      }

      const policyDecision = evaluateReturnPolicy(orderDetails, tempAnalysis);
      if (tempAnalysis.botConsensus.some(op => op.status === 'DECLINED') && policyDecision.status === 'APPROVED') {
        policyDecision.status = 'MANUAL_REVIEW';
        policyDecision.reason = "External Agent raised objection.";
      }

      const finalResult: AnalysisResult = {
        ...tempAnalysis,
        policyStatus: policyDecision.status,
        policyReason: policyDecision.reason,
        estimatedRefund: policyDecision.status === 'APPROVED' ? aiResult.estimatedRefund : 0
      };

      setAnalysis(finalResult);
      setStep(ReturnStep.BLOCKCHAIN_SYNC);

      const newBlock = await createReturnBlock(lastBlockHash, finalResult, blockHeight + 1);
      newBlock.orderDetails = orderDetails;
      setCreatedBlock(newBlock);
      onBlockCreated(newBlock);

      const emailData = generateReturnEmail(newBlock);
      setGeneratedEmail(emailData);

      sendReturnStatusEmail(orderDetails.userEmail, newBlock).then(() => {
        showToast('info', 'Email Dispatched', `Smart contract sent to ${orderDetails.userEmail}`);
        setTimeout(() => setShowEmailModal(true), 2000);
      });

      if (policyDecision.status === 'APPROVED') showToast('success', 'Refund Processed', `₹${finalResult.estimatedRefund} released.`);
      else if (policyDecision.status === 'DECLINED') showToast('error', 'Return Declined', policyDecision.reason);
      else showToast('warning', 'Sent for Review', 'Manual verification required.');
      
      setStep(ReturnStep.COMPLETE);

    } catch (err) {
      console.error(err);
      showToast('error', 'System Error', 'Failed to process return.');
      setStep(ReturnStep.UPLOAD);
    }
  };

  const reset = () => {
    setStep(ReturnStep.ORDER_LOOKUP);
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setCreatedBlock(null);
    setOrderDetails(null);
    setProductPassport(null);
    setOrderId('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptAnalysis(null);
    setGeneratedEmail(null);
    setShowEmailModal(false);
    setAgentOpinions([]);
    setActiveAgentIndex(-1);
    setIsFetchingOrder(false);
    setBridgeJson('');
  };

  const downloadReceipt = () => {
    if (!generatedEmail) return;
    const element = document.createElement("a");
    const file = new Blob([generatedEmail.body], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `blockchain-receipt.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const openMailClient = () => {
    if (!generatedEmail) return;
    window.location.href = `mailto:${generatedEmail.to}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body.substring(0, 1500))}`;
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-10 h-10 text-green-400" />;
      case 'DECLINED': return <Ban className="w-10 h-10 text-red-400" />;
      case 'MANUAL_REVIEW': return <AlertTriangle className="w-10 h-10 text-yellow-400" />;
      default: return <CheckCircle className="w-10 h-10 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED': return 'text-green-400 border-green-500 bg-green-500/20';
      case 'DECLINED': return 'text-red-400 border-red-500 bg-red-500/20';
      case 'MANUAL_REVIEW': return 'text-yellow-400 border-yellow-500 bg-yellow-500/20';
      default: return 'text-slate-400 border-slate-500 bg-slate-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 relative">
      
      {/* Bridge Data Modal */}
      {showBridgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Database className="w-5 h-5 text-blue-400" /> Manual Ledger Bridge
               </h3>
               <button onClick={() => setShowBridgeModal(false)} className="text-slate-500 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
               Paste the JSON output from your Manufacturing PC (Phase 1 Bot) below to exactly match the product details.
            </p>
            <textarea 
               value={bridgeJson}
               onChange={(e) => setBridgeJson(e.target.value)}
               placeholder='{"productName": "Nike Air Max", "orderId": "NIKE-123", ...}'
               className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs font-mono text-green-400 focus:outline-none focus:border-blue-500 mb-4"
            />
            <button 
               onClick={handleBridgeImport}
               className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
            >
               Import Node Data
            </button>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailModal && generatedEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">C</div>
                  <div>
                     <h3 className="font-bold text-sm">ChainReturn Security &lt;noreply@chainreturn.ai&gt;</h3>
                     <p className="text-xs text-slate-500">to me ({user.email})</p>
                  </div>
               </div>
               <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
               </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar font-mono text-sm leading-relaxed whitespace-pre-wrap bg-white">
               <h2 className="text-lg font-bold mb-4 border-b pb-2">{generatedEmail.subject}</h2>
               {generatedEmail.body}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-2 items-center">
               <div className="flex gap-2">
                 <button onClick={openMailClient} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2">
                   <Send className="w-4 h-4" /> Open in Mail App
                 </button>
                 <button onClick={downloadReceipt} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2">
                   <Download className="w-4 h-4" /> Save as File
                 </button>
                 <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Close</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 mb-2">
          <span className={step === ReturnStep.ORDER_LOOKUP ? "text-blue-400 font-bold" : ""}>1. Order</span>
          <span className={step === ReturnStep.SUPPLY_CHAIN_SYNC ? "text-blue-400 font-bold" : ""}>2. Origin</span>
          <span className={step === ReturnStep.RECEIPT_UPLOAD || step === ReturnStep.RECEIPT_ANALYZING ? "text-blue-400 font-bold" : ""}>3. Bill</span>
          <span className={step === ReturnStep.UPLOAD ? "text-blue-400 font-bold" : ""}>4. Evidence</span>
          <span className={step === ReturnStep.ANALYZING ? "text-violet-400 font-bold" : ""}>5. AI</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out 
              ${step === ReturnStep.ORDER_LOOKUP ? 'w-[10%] bg-blue-500' : ''}
              ${step === ReturnStep.SUPPLY_CHAIN_SYNC ? 'w-[25%] bg-blue-500' : ''}
              ${step === ReturnStep.RECEIPT_UPLOAD ? 'w-[40%] bg-blue-500' : ''}
              ${step === ReturnStep.RECEIPT_ANALYZING ? 'w-[45%] bg-violet-500' : ''}
              ${step === ReturnStep.UPLOAD ? 'w-[60%] bg-blue-500' : ''}
              ${step === ReturnStep.ANALYZING ? 'w-[75%] bg-violet-500' : ''}
              ${step === ReturnStep.FRAUD_CHECK ? 'w-[80%] bg-orange-500' : ''}
              ${step === ReturnStep.MULTI_AGENT_CONSENSUS ? 'w-[85%] bg-pink-500' : ''}
              ${step === ReturnStep.BLOCKCHAIN_SYNC ? 'w-[90%] bg-emerald-500' : ''}
              ${step === ReturnStep.COMPLETE ? 'w-full bg-emerald-400' : ''}
            `}
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 min-h-[450px] flex flex-col justify-center relative overflow-hidden">
        
        {/* Step 1: Order Lookup */}
        {step === ReturnStep.ORDER_LOOKUP && (
          <div className="max-w-xl mx-auto w-full animate-fadeIn">
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-white">Find Your Order</h2>
                <p className="text-slate-400">Connect to your shopping platform to start the return.</p>
             </div>

             <form onSubmit={handleOrderLookup} className="space-y-6">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                   {SUPPORTED_PLATFORMS.map((p) => (
                     <button
                       key={p.id}
                       type="button"
                       onClick={() => setSelectedPlatform(p.id)}
                       className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                         ${selectedPlatform === p.id 
                           ? 'bg-slate-700 border-blue-500 shadow-lg shadow-blue-900/20' 
                           : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}
                     >
                       <div className={`w-3 h-3 rounded-full ${p.color}`} />
                       <span className="text-sm font-medium">{p.name}</span>
                     </button>
                   ))}
                 </div>

                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter Order ID from Phase 1 Bot (e.g., NIKE-001)"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-4 px-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Node Active</span>
                    </div>
                 </div>

                 {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                 <button
                    type="submit"
                    disabled={isFetchingOrder || !orderId}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                      ${orderId 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                 >
                    {isFetchingOrder ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" /> Syncing Ledger...
                        </>
                    ) : "Locate Order"}
                 </button>
                 
                 <div className="text-center pt-4 border-t border-slate-700/50">
                    <button 
                      type="button"
                      onClick={() => setShowBridgeModal(true)}
                      className="text-xs text-slate-400 hover:text-blue-400 flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                      <Link2 className="w-3 h-3" /> Import Data from Manufacturing Bot (JSON)
                    </button>
                 </div>
               </form>
          </div>
        )}

        {/* Step 1.5: Supply Chain Visualization */}
        {step === ReturnStep.SUPPLY_CHAIN_SYNC && productPassport && (
           <SupplyChainVisualizer 
              passport={productPassport} 
              onComplete={() => setStep(ReturnStep.RECEIPT_UPLOAD)} 
           />
        )}

        {/* Step 1.5: Receipt Upload */}
        {step === ReturnStep.RECEIPT_UPLOAD && (
           <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Upload Bill / Invoice</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Please upload the receipt for verification.
                </p>
              </div>

              <div 
                onClick={() => receiptInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-colors group relative"
              >
                {receiptPreview ? (
                   <div className="relative h-48 w-full max-w-xs mx-auto rounded-lg overflow-hidden shadow-lg border border-slate-500">
                      <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-cover opacity-80" />
                   </div>
                ) : (
                  <>
                    <p className="text-slate-300 font-medium group-hover:text-white">Click to upload Bill</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={receiptInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp, image/heic" 
                  onChange={handleReceiptChange} 
                />
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(ReturnStep.ORDER_LOOKUP)}
                    className="px-6 py-4 rounded-xl font-medium border border-slate-600 hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                     onClick={() => setStep(ReturnStep.UPLOAD)}
                     className="px-6 py-4 rounded-xl font-medium text-slate-400 hover:text-white"
                  >
                     Skip (Lost Receipt)
                  </button>
                  <button
                    disabled={!receiptFile}
                    onClick={processReceipt}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all
                      ${receiptFile 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                    Verify Bill
                  </button>
              </div>
           </div>
        )}

        {/* Receipt Analyzing */}
        {step === ReturnStep.RECEIPT_ANALYZING && (
           <div className="text-center space-y-8 relative z-10">
             <Loader2 className="w-16 h-16 text-violet-400 animate-spin mx-auto" />
             <div>
               <h2 className="text-2xl font-bold text-violet-400 mb-2">Scanning Receipt...</h2>
               <p className="text-slate-400">Extracting Date, Merchant, and Items.</p>
             </div>
           </div>
        )}

        {/* Step 2: Upload */}
        {step === ReturnStep.UPLOAD && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="flex items-center justify-center gap-3 mb-4">
               <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-500/30">
                 Item: {orderDetails?.productName.substring(0, 20)}...
               </span>
               {orderDetails?.receiptVerified ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Verified Bill
                  </span>
               ) : (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-mono border border-yellow-500/30 flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> No Bill
                  </span>
               )}
            </div>

            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
              <ScanLine className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Product Condition</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Upload a photo of the item.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-colors group relative"
            >
              {preview ? (
                 <div className="relative h-48 w-full max-w-xs mx-auto rounded-lg overflow-hidden shadow-lg border border-slate-500">
                    {file?.type.startsWith('video') ? (
                        <video src={preview} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                 </div>
              ) : (
                <>
                  <p className="text-slate-300 font-medium group-hover:text-white">Click to upload Product</p>
                  <p className="text-xs text-slate-500 mt-1">MP4, JPG, PNG</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp, image/heic, video/mp4, video/quicktime, video/webm" 
                onChange={handleFileChange} 
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
                <button 
                   onClick={() => setStep(ReturnStep.RECEIPT_UPLOAD)}
                   className="px-6 py-4 rounded-xl font-medium border border-slate-600 hover:bg-slate-800"
                >
                   Back
                </button>
                <button
                  disabled={!file}
                  onClick={startProcess}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all
                    ${file 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  Analyze & Refund
                </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Analysis */}
        {step === ReturnStep.ANALYZING && (
          <div className="text-center space-y-8 relative z-10">
            <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-pulse" />
               <ShieldCheck className="w-12 h-12 text-violet-400 absolute inset-0 m-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-violet-400 mb-2">Gemini AI Verification</h2>
              <p className="text-slate-400">Checking item...</p>
            </div>
          </div>
        )}

        {/* Step 3.5: Fraud Detection */}
        {step === ReturnStep.FRAUD_CHECK && (
          <div className="text-center space-y-8 relative z-10">
             <div className="relative w-32 h-32 mx-auto">
                <Siren className="w-12 h-12 text-orange-500 animate-pulse absolute inset-0 m-auto" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-orange-400 mb-2">Security Scanning</h2>
               <p className="text-slate-400">Validating History...</p>
             </div>
          </div>
        )}

        {/* Step 3.8: Multi-Agent Consensus */}
        {step === ReturnStep.MULTI_AGENT_CONSENSUS && (
          <div className="text-center space-y-8 relative z-10">
             <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <Bot className="w-16 h-16 text-pink-500" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-pink-400 mb-2">Multi-Agent Consensus</h2>
               <div className="space-y-2 max-w-sm mx-auto text-left">
                  {connectedBots.map((bot, idx) => (
                    <div key={bot.id} className={`p-3 rounded-lg border transition-all flex items-center justify-between
                      ${idx <= activeAgentIndex ? 'bg-slate-800 border-pink-500/50' : 'bg-slate-900/50 border-slate-700 opacity-50'}`}>
                       <span className="text-sm font-bold text-white flex items-center gap-2">
                         <Bot className="w-4 h-4" /> {bot.name}
                       </span>
                       {idx < activeAgentIndex ? (
                         <span className="text-xs text-green-400 font-mono">DONE</span>
                       ) : idx === activeAgentIndex ? (
                         <span className="text-xs text-pink-400 font-mono animate-pulse">PROCESSING...</span>
                       ) : (
                         <span className="text-xs text-slate-600 font-mono">WAITING</span>
                       )}
                    </div>
                  ))}
               </div>
             </div>
          </div>
        )}

        {/* Step 4: Blockchain Sync */}
        {step === ReturnStep.BLOCKCHAIN_SYNC && (
          <div className="text-center space-y-8">
             <div className="w-24 h-24 bg-emerald-900/20 rounded-xl mx-auto flex items-center justify-center relative border border-emerald-500/30">
               <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-emerald-400 mb-2">Executing Smart Contract</h2>
             </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === ReturnStep.COMPLETE && analysis && createdBlock && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4 justify-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border 
                  ${getStatusColor(analysis.policyStatus)}`}>
                {getStatusIcon(analysis.policyStatus)}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${analysis.policyStatus === 'APPROVED' ? 'text-white' : analysis.policyStatus === 'DECLINED' ? 'text-red-400' : 'text-yellow-400'}`}>
                   {analysis.policyStatus === 'APPROVED' ? 'Refund Processed' : analysis.policyStatus === 'DECLINED' ? 'Return Declined' : 'Manual Review'}
                </h2>
                <p className="text-slate-400 text-sm font-mono">
                   TXID: {createdBlock.hash.substring(0, 12)}...
                </p>
              </div>
            </div>
            
            {analysis.fraudRisk && analysis.fraudRisk.riskLevel !== 'LOW' && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-4 flex items-start gap-3">
                   <ShieldCheck className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                   <div>
                      <h4 className="font-bold text-red-400">Security Risk Detected ({analysis.fraudRisk.riskLevel})</h4>
                      <ul className="text-xs text-red-300 mt-1 list-disc pl-4">
                         {analysis.fraudRisk.detectedPatterns.map((pattern, i) => (
                            <li key={i}>{pattern}</li>
                         ))}
                      </ul>
                   </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="text-sm uppercase text-slate-400 font-bold mb-3">Verification Details</h3>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className={`font-bold ${analysis.policyStatus === 'APPROVED' ? 'text-green-400' : analysis.policyStatus === 'DECLINED' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {analysis.policyStatus}
                        </span>
                     </div>
                     <div className="p-2 bg-slate-900/50 rounded border border-slate-700 text-xs text-slate-300 mb-2">
                        Reason: {analysis.policyReason}
                     </div>
                     <div className="flex justify-between pt-2 border-t border-slate-700">
                        <span className="text-slate-400">AI Condition</span>
                        <span className="text-white font-medium">{analysis.condition}</span>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                  <h3 className="text-sm uppercase text-slate-400 font-bold mb-3">Ledger Action</h3>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Refund Value</span>
                        <span className="text-xl font-bold text-white">₹{analysis.estimatedRefund.toLocaleString()}</span>
                     </div>
                     <div className="bg-slate-900 rounded p-2 font-mono text-[10px] text-slate-500 break-all">
                        {createdBlock.hash}
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-full">
                     <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-white">Smart Contract Email Dispatched</h4>
                     <p className="text-xs text-blue-300">Sent to {user.email}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button 
                     onClick={openMailClient}
                     className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
                  >
                     <Send className="w-3 h-3" /> Open Real Mail
                  </button>
                  <button 
                     onClick={() => setShowEmailModal(true)}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
                  >
                     <ExternalLink className="w-3 h-3" /> View Preview
                  </button>
               </div>
            </div>

            <button onClick={reset} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl mt-4 transition-colors">
              Process Another Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReturnFlow;
