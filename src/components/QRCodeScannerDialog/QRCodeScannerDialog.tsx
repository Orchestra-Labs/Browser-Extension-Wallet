import React, { useEffect, useRef, useState } from 'react';
import { SlideTray, Button } from '@/ui-kit';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useSetAtom } from 'jotai';
import { recipientAddressAtom } from '@/atoms';
import { QRCode } from '@/assets/icons';

export const QRCodeScannerDialog: React.FC = () => {
  const slideTrayRef = useRef<{ closeWithAnimation: () => void }>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const setAddress = useSetAtom(recipientAddressAtom);

  const handleScan = (data: string | null) => {
    if (data) {
      console.log('QR Code Scanned:', data);
      setAddress(data);
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
  };

  // TODO: change to search files
  const restartScanner = () => {
    setIsScannerOpen(false);
    setTimeout(() => setIsScannerOpen(true), 100);
  };

  useEffect(() => {
    console.log('isScannerOpen changed:', isScannerOpen);

    // TODO: request camera permissions
    if (isScannerOpen) {
      setTimeout(() => {
        const element = document.getElementById('qr-reader');
        if (element) {
          console.log('Initializing Html5QrcodeScanner on #qr-reader...');
          const qrScanner = new Html5QrcodeScanner(
            'qr-reader',
            {
              fps: 10,
              qrbox: { width: 255, height: 255 },
            },
            false,
          );

          qrScanner.render(
            decodedText => handleScan(decodedText),
            errorMessage => handleError(errorMessage),
          );

          return () => {
            console.log('Cleaning up Html5QrcodeScanner...');
            qrScanner.clear().catch(error => console.error('Failed to clear qrScanner', error));
          };
        } else {
          console.error('Element with id "qr-reader" not found at initialization time.');
        }
      }, 100);
    }
  }, [isScannerOpen]);

  return (
    <SlideTray
      ref={slideTrayRef}
      triggerComponent={
        <QRCode
          className="h-7 w-7 text-neutral-1 hover:bg-blue-hover hover:text-blue-dark cursor-pointer"
          width={20}
          onClick={() => setIsScannerOpen(true)}
        />
      }
      title="Scan Address"
      showBottomBorder
      onClose={() => {
        console.log('SlideTray closed');
        setIsScannerOpen(false);
      }}
    >
      {/* TODO: allow drag/drop */}
      <div className="flex flex-col items-center space-yt-4 yb-2">
        {isScannerOpen && (
          <div
            id="qr-reader"
            className="relative bg-background-black rounded-lg border border-blue"
            style={{ width: '255px', height: '255px' }}
          />
        )}

        <Button variant="transparentNeutral" size="small" onClick={restartScanner} className="mt-3">
          Restart Scanner
        </Button>
      </div>
    </SlideTray>
  );
};
