import React, { useEffect, useRef, useState } from 'react';
import { SlideTray, Button } from '@/ui-kit';
import { useSetAtom } from 'jotai';
import { recipientAddressAtom } from '@/atoms';
import { QRCode } from '@/assets/icons';
import { QrReader } from 'react-qr-reader';
import { BrowserQRCodeReader } from '@zxing/browser';
import { cn } from '@/helpers';

export const QRCodeScannerDialog: React.FC = () => {
  const slideTrayRef = useRef<{ closeWithAnimation: () => void }>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const setAddress = useSetAtom(recipientAddressAtom);
  const [isDragOver, setIsDragOver] = useState(false);

  const qrCodeReader = new BrowserQRCodeReader();

  const handleScan = (result: string | null) => {
    if (result) {
      console.log('QR Code Scanned:', result);
      setAddress(result);
      slideTrayRef.current?.closeWithAnimation();
      setIsScannerOpen(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    if (error.name === 'NotAllowedError') {
      console.log('Please grant camera permissions to use the QR scanner.');
      setPermissionDenied(true);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        const url = URL.createObjectURL(file);
        const result = await qrCodeReader.decodeFromImageUrl(url);
        handleScan(result.getText());
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error scanning file:', error);
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      try {
        const result = await qrCodeReader.decodeFromImageUrl(url);
        handleScan(result.getText());
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error scanning file:', error);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      console.log('Camera access granted.');
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    if (isScannerOpen && !permissionDenied) {
      requestCameraPermission();
    }
  }, [isScannerOpen]);

  const borderColor = isDragOver
    ? 'border-blue-pressed'
    : isScannerOpen && !permissionDenied
      ? 'border-blue'
      : 'border-neutral-3';

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
      onClose={() => setIsScannerOpen(false)}
    >
      <div className="flex flex-col items-center space-yt-4 yb-2">
        {/* Camera View & Drag/Drop Area */}
        <div
          className={`relative flex justify-center items-center bg-background-black rounded-lg w-[255px] h-[255px]`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Decorative Borders */}
          <div
            className={cn(
              `absolute top-[-0px] left-[-0px] w-[75px] h-[75px] border-t-4 border-l-4 ${borderColor} rounded-tl-[8px]`,
            )}
          />
          <div
            className={cn(
              `absolute top-[-0px] right-[-0px] w-[75px] h-[75px] border-t-4 border-r-4 ${borderColor} rounded-tr-[8px]`,
            )}
          />
          <div
            className={cn(
              `absolute bottom-[-0px] left-[-0px] w-[75px] h-[75px] border-b-4 border-l-4 ${borderColor} rounded-bl-[8px]`,
            )}
          />
          <div
            className={cn(
              `absolute bottom-[-0px] right-[-0px] w-[75px] h-[75px] border-b-4 border-r-4 ${borderColor} rounded-br-[8px]`,
            )}
          />

          {isScannerOpen ? (
            <QrReader
              onResult={(result, error) => {
                if (result) handleScan(result.getText());
                if (error) handleError(error);
              }}
              constraints={{ facingMode: 'environment' }}
              className="w-[96.8%] h-[100%]"
            />
          ) : (
            <p className="text-gray-dark text-center">Enable camera or add file</p>
          )}
        </div>

        {/* File Explorer Button */}
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            const fileInput = document.getElementById('qr-file-input') as HTMLInputElement;
            fileInput?.click();
          }}
          className="mt-3 px-4 py-1"
        >
          Use File
        </Button>

        {/* Hidden File Input */}
        <input
          id="qr-file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>
    </SlideTray>
  );
};
