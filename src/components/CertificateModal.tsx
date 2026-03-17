import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Linkedin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseTitle: string;
  recipientName: string;
  certificateUrl?: string;
}

type CertificateStatus = 'idle' | 'processing' | 'success' | 'error';

interface FitTextOptions {
 maxWidth: number;
  initialFontSize: number;
  minFontSize: number;
  fontName: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
  color: [number, number, number];
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
isOpen,
onClose,
onConfirm,
courseTitle,
recipientName,
certificateUrl
}) => {
  const [status, setStatus] = useState<CertificateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const processingTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const isProcessing = status === 'processing';
  const isDownloaded = status === 'success';
  const isError = status === 'error';

  const clearTimers = () => {
    if (processingTimeoutRef.current !== null) {
      window.clearTimeout(processingTimeoutRef.current);
     processingTimeoutRef.current = null;
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const resetState = () => {
    clearTimers();
    setStatus('idle');
    setErrorMessage('');
  };

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage('');
     return;
   }

    resetState();
  }, [isOpen]);

  useEffect(() => () => {
    clearTimers();
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
   resetState();
    onClose();
  };

 const handleLinkedInShare = () => {
    const text = `I just successfully completed the "${courseTitle}" course at BICMAS Academy! #Learning #ProfessionalDevelopment #BICMAS`;
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const formatCertificateDate = () =>
   new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());

  const sanitizeFileName = (value: string) => {
    const sanitized = value
     .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '_')
     .slice(0, 120);

   return sanitized || 'certificate';
  };

 const fitCenteredText = (
    doc: jsPDF,
    text: string,
   y: number,
   options: FitTextOptions
  ) => {
    const { maxWidth, initialFontSize, minFontSize, fontName, fontStyle, color } = options;
   let fontSize = initialFontSize;

    doc.setFont(fontName, fontStyle);
    doc.setFontSize(fontSize);

    let lines = doc.splitTextToSize(text, maxWidth) as string[];
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.text(lines, doc.internal.pageSize.getWidth() / 2, y, {
      align: 'center',
      baseline: 'middle'
    });
  };

  const generatePDF = (): boolean => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');

      doc.setDrawColor(37, 99, 235);
     doc.setLineWidth(1.5);
      doc.rect(10, 10, width - 20, height - 20);

     doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, width - 24, height - 24);

     doc.setTextColor(30, 41, 59);
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(36);
     doc.text('CERTIFICATE', width / 2, 50, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
     doc.setCharSpace(2);
      doc.text('OF COMPLETION', width / 2, 60, { align: 'center' });

     doc.setFontSize(16);
     doc.setTextColor(100, 116, 139);
     doc.setCharSpace(0);
      doc.text('This certificate is proudly presented to', width / 2, 85, { align: 'center' });

     fitCenteredText(doc, recipientName, 103, {
       maxWidth: width - 70,
        initialFontSize: 32,
        minFontSize: 20,
        fontName: 'times',
        fontStyle: 'italic',
        color: [30, 41, 59]
     });

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line((width / 2) - 40, 112, (width / 2) + 40, 112);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(100, 116, 139);
      doc.text('For successfully completing the course', width / 2, 130, { align: 'center' });

     fitCenteredText(doc, `"${courseTitle}"`, 145, {
        maxWidth: width - 90,
        initialFontSize: 22,
       minFontSize: 14,
        fontName: 'helvetica',
        fontStyle: 'bold',
        color: [37, 99, 235]
     });

      const date = formatCertificateDate();
     const bottomY = height - 40;

     doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Date: ${date}`, 50, bottomY + 5, { align: 'center' });
      doc.setLineWidth(0.5);
     doc.setDrawColor(30, 41, 59);
      doc.line(30, bottomY, 70, bottomY);

      doc.setFont('times', 'italic');
      doc.setFontSize(16);
      doc.text('Bicmas Director', width - 50, bottomY - 5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Program Director', width - 50, bottomY + 5, { align: 'center' });
      doc.line(width - 70, bottomY, width - 30, bottomY);

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(37, 99, 235);
      doc.circle(width / 2, bottomY, 12, 'FD');
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text('B', width / 2, bottomY + 2.5, { align: 'center' });

     doc.save(`${sanitizeFileName(courseTitle)}_Certificate.pdf`);
      return true;
   } catch (error) {
      console.error('PDF Generation failed', error);
      return false;
    }
  };

  const completeSuccess = () => {
   setStatus('success');
    setErrorMessage('');

   closeTimeoutRef.current = window.setTimeout(() => {
      resetState();
      onConfirm();
   }, 2000);
  };

  const handleDownload = () => {
    if (isProcessing) return;

    setStatus('processing');
    setErrorMessage('');

   processingTimeoutRef.current = window.setTimeout(() => {
      let wasSuccessful = false;

      if (certificateUrl && certificateUrl !== '#') {
        const downloadWindow = window.open(certificateUrl, '_blank', 'noopener,noreferrer');
        wasSuccessful = downloadWindow !== null;
      } else {
        wasSuccessful = generatePDF();
    }

     processingTimeoutRef.current = null;

     if (wasSuccessful) {
        completeSuccess();
        return;
      }

     setStatus('error');
      setErrorMessage('We could not generate your certificate right now. Please try again.');
    }, 1500);
  };

 const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
   if (event.key === 'Escape' && !isProcessing) {
      handleClose();
    }
  };

  return (
    <div
     className="fixed inset-0 z-100 flex items-center justify-center p-4"
     role="dialog"
     aria-modal="true"
     aria-labelledby="certificate-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
       onClick={isProcessing ? undefined : handleClose}
      />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
       <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 id="certificate-modal-title" className="font-semibold text-slate-800">
           Download Certificate
         </h3>
         {!isProcessing && (
            <button
              type="button"
             onClick={handleClose}
             className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close certificate modal"
            >
              <X size={20} />
            </button>
         )}
        </div>

        <div className="p-8 text-center">
         <div
           className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 transition-all duration-500 ${
             isDownloaded
                ? 'bg-green-50 text-green-600 ring-green-50/50'
               : isError
                 ? 'bg-red-50 text-red-600 ring-red-50/50'
                 : 'bg-blue-50 text-blue-600 ring-blue-50/50'
           }`}
         >
            {isProcessing ? (
              <Loader2 size={36} className="animate-spin" />
            ) : isDownloaded ? (
             <CheckCircle size={36} />
            ) : isError ? (
             <AlertCircle size={36} />
            ) : (
              <Download size={36} />
            )}
          </div>

         <h4 className="text-xl font-bold text-slate-900 mb-3">
           {isProcessing
              ? 'Generating Certificate...'
              : isDownloaded
               ? 'Download Complete!'
                : isError
                  ? 'Download Failed'
                  : 'Ready to Download?'}
          </h4>

         <p className="text-slate-500 mb-8 leading-relaxed">
           {isProcessing
              ? 'Please wait while we prepare your personalized PDF document.'
              : isDownloaded
               ? 'Your certificate has been downloaded successfully.'
                : isError
                  ? errorMessage
                  : (
                   <>
                     You are about to download the official certificate for <br />
                     <span className="font-semibold text-slate-800">"{courseTitle}"</span>
                   </>
                 )}
          </p>

          {!isDownloaded && !isProcessing && (
           <div className="space-y-3">
              <button
               type="button"
                onClick={handleDownload}
               className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
               {isError ? 'Try Again' : 'Confirm Download'}
              </button>

            <button
                type="button"
               onClick={handleLinkedInShare}
                className="w-full bg-[#0077b5] text-white py-3.5 rounded-xl font-semibold hover:bg-[#006396] transition-all hover:shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Linkedin size={20} fill="currentColor" />
                Share on LinkedIn
              </button>

              <button
                type="button"
                onClick={handleClose}
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