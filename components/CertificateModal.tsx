import React, { useState } from 'react';
import { X, Download, Linkedin, Loader2, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle: string;
  recipientName: string;
  certificateUrl?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  courseTitle,
  recipientName,
  certificateUrl
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleLinkedInShare = () => {
    // Construct LinkedIn share URL
    const text = `I just successfully completed the "${courseTitle}" course at BICMAS Academy! #Learning #ProfessionalDevelopment #BICMAS`;
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

  const generatePDF = () => {
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, width, height, 'F');

        // Decorative Border (Double Line)
        doc.setDrawColor(37, 99, 235); // Blue-600
        doc.setLineWidth(1.5);
        doc.rect(10, 10, width - 20, height - 20);
        
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24);

        // Header
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.setFont("helvetica", "bold");
        doc.setFontSize(36);
        doc.text("CERTIFICATE", width / 2, 50, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setCharSpace(2);
        doc.text("OF COMPLETION", width / 2, 60, { align: "center" });

        // Content
        doc.setFontSize(16);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.setCharSpace(0);
        doc.text("This certificate is proudly presented to", width / 2, 85, { align: "center" });

        // Name
        doc.setFontSize(32);
        doc.setFont("times", "italic"); // Use standard font that looks a bit more formal
        doc.setTextColor(30, 41, 59);
        doc.text(recipientName, width / 2, 105, { align: "center" });

        // Separator
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line((width / 2) - 40, 112, (width / 2) + 40, 112);

        // Course Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.setTextColor(100, 116, 139);
        doc.text("For successfully completing the course", width / 2, 130, { align: "center" });

        // Course Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235);
        doc.text(`"${courseTitle}"`, width / 2, 145, { align: "center" });

        // Footer / Signatures
        const date = new Date().toLocaleDateString();
        const bottomY = height - 40;

        // Date
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(`Date: ${date}`, 50, bottomY + 5, { align: "center" });
        doc.setLineWidth(0.5);
        doc.setDrawColor(30, 41, 59);
        doc.line(30, bottomY, 70, bottomY);

        // Signature (Simulated)
        doc.setFont("times", "italic");
        doc.setFontSize(16);
        doc.text("Bicmas Director", width - 50, bottomY - 5, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Program Director", width - 50, bottomY + 5, { align: "center" });
        doc.line(width - 70, bottomY, width - 30, bottomY);

        // Badge/Logo placeholder (Circle)
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.setDrawColor(37, 99, 235);
        doc.circle(width / 2, bottomY, 12, 'FD');
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "bold");
        doc.text("B", width / 2, bottomY + 2.5, { align: "center" }); // Simple Logo

        doc.save(`${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (e) {
        console.error("PDF Generation failed", e);
        alert("There was an error generating your certificate. Please try again.");
    }
  };

  const handleDownload = () => {
    setIsProcessing(true);

    // Simulate processing delay for better UX
    setTimeout(() => {
        if (certificateUrl && certificateUrl !== '#') {
            window.open(certificateUrl, '_blank');
        } else {
            generatePDF();
        }
        
        setIsProcessing(false);
        setIsDownloaded(true);
        
        // Close modal after a brief success message, or let user close
        setTimeout(() => {
            onConfirm(); // This triggers the parent's close/reset logic
            setIsDownloaded(false); // Reset for next time
        }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={isProcessing ? undefined : onClose} 
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Download Certificate</h3>
          {!isProcessing && (
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8 text-center">
           <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 transition-all duration-500 ${
               isDownloaded ? 'bg-green-50 text-green-600 ring-green-50/50' : 'bg-blue-50 text-blue-600 ring-blue-50/50'
           }`}>
             {isProcessing ? (
                 <Loader2 size={36} className="animate-spin" />
             ) : isDownloaded ? (
                 <CheckCircle size={36} />
             ) : (
                 <Download size={36} />
             )}
           </div>
           
           <h4 className="text-xl font-bold text-slate-900 mb-3">
               {isProcessing ? 'Generating Certificate...' : isDownloaded ? 'Download Complete!' : 'Ready to Download?'}
           </h4>
           
           <p className="text-slate-500 mb-8 leading-relaxed">
             {isProcessing 
                ? 'Please wait while we prepare your personalized PDF document.' 
                : isDownloaded
                ? 'Your certificate has been downloaded successfully.'
                : <>You are about to download the official certificate for <br/><span className="font-semibold text-slate-800">"{courseTitle}"</span></>
             }
           </p>

           {!isDownloaded && !isProcessing && (
               <div className="space-y-3">
                <button 
                onClick={handleDownload}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                Confirm Download
                </button>
                
                <button 
                onClick={handleLinkedInShare}
                className="w-full bg-[#0077b5] text-white py-3.5 rounded-xl font-semibold hover:bg-[#006396] transition-all hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                <Linkedin size={20} fill="currentColor" />
                Share on LinkedIn
                </button>

                <button 
                onClick={onClose}
                className="w-full bg-white text-slate-600 border border-slate-200 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors mt-2"
                >
                Cancel
                </button>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};