import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";

interface GymScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const GymScanner = ({ onScan, onClose, isOpen }: GymScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "gym-scanner-reader";

  useEffect(() => {
    if (isOpen) {
      const startScanner = async () => {
        try {
          setError(null);
          const scanner = new Html5Qrcode(containerId);
          scannerRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              onScan(decodedText);
              stopScanner();
            },
            (errorMessage) => {
              // Ignore common scan errors like "not found"
              if (!errorMessage.includes("NotFound")) {
                console.warn("Scan Error:", errorMessage);
              }
            }
          );
          setIsScanning(true);
        } catch (err: any) {
          console.error("Scanner Start Error:", err);
          setError(err?.message || "Could not start camera. Please check permissions.");
        }
      };

      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Scanner Stop Error:", err);
      }
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-fade-in">
      <div className="p-6 flex items-center justify-between border-b border-border">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Scan QR Code</h3>
          <p className="text-xs text-muted-foreground font-body">Point your camera at the gym's attendance code</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-[320px] aspect-square overflow-hidden rounded-3xl border-2 border-lavender/30 shadow-2xl bg-black/40">
          <div id={containerId} className="w-full h-full" />
          
          {/* Scanning frame overlay */}
          <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
            <div className="w-full h-full relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-lavender rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-lavender rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-lavender rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-lavender rounded-br-lg" />
              
              {isScanning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-lavender/50 shadow-[0_0_15px_rgba(139,123,255,0.8)] animate-scanner-line" />
              )}
            </div>
          </div>

          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-8 h-8 border-4 border-lavender/30 border-t-lavender rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background/80">
              <Camera className="w-12 h-12 text-destructive/50 mb-4" />
              <p className="text-sm font-body text-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-lavender text-white rounded-lg text-xs font-body"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center max-w-xs">
          <p className="text-sm text-muted-foreground font-body">
            Keep the QR code within the frame to scan it automatically.
          </p>
        </div>
      </div>

      <div className="p-10 flex justify-center">
        <button
          onClick={onClose}
          className="px-10 py-4 bg-muted text-foreground font-body font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-muted/80 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GymScanner;
