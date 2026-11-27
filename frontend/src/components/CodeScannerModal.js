import React, { useEffect, useId, useRef, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

const MODE_META = {
  barcode: {
    title: 'Scan Product Barcode',
    subtitle: 'Point your camera at the product barcode to capture it automatically.',
    photoLabel: 'Take Photo / Upload Barcode',
  },
  qr_code: {
    title: 'Scan Product QR Code',
    subtitle: 'Point your camera at the product QR code to capture it automatically.',
    photoLabel: 'Take Photo / Upload QR Code',
  },
  all: {
    title: 'Scan Barcode or QR Code',
    subtitle: 'Point your camera at a barcode or QR code to add the product to checkout.',
    photoLabel: 'Take Photo / Upload Code',
  },
};

function getFormatsForMode(formatsEnum, mode) {
  if (!formatsEnum) return undefined;
  const barcodeFormats = [
    formatsEnum.EAN_13,
    formatsEnum.EAN_8,
    formatsEnum.UPC_A,
    formatsEnum.UPC_E,
    formatsEnum.CODE_128,
    formatsEnum.CODE_39,
    formatsEnum.CODE_93,
    formatsEnum.ITF,
    formatsEnum.CODABAR,
    formatsEnum.UPC_EAN_EXTENSION,
  ].filter((f) => f !== undefined);

  if (mode === 'barcode') return barcodeFormats;
  if (mode === 'qr_code') return [formatsEnum.QR_CODE].filter((f) => f !== undefined);
  return [formatsEnum.QR_CODE, ...barcodeFormats, formatsEnum.DATA_MATRIX].filter((f) => f !== undefined);
}

function getQrBoxForMode(mode) {
  return (viewfinderWidth, viewfinderHeight) => {
    if (mode === 'barcode') {
      return {
        width: Math.max(160, Math.min(Math.floor(viewfinderWidth * 0.85), 320)),
        height: Math.max(80, Math.min(Math.floor(viewfinderHeight * 0.45), 140)),
      };
    }
    const edge = Math.max(150, Math.min(Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72), 250));
    return { width: edge, height: edge };
  };
}

export default function CodeScannerModal({ isOpen, mode = 'barcode', onScan, onClose }) {
  const reactId = useId();
  const regionId = `code-scanner-region-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [status, setStatus] = useState('starting'); // 'starting' | 'scanning' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [manualCameraId, setManualCameraId] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const meta = MODE_META[mode] || MODE_META.barcode;

  useEffect(() => {
    if (!isOpen) {
      setManualCameraId(null);
      setCameraIndex(0);
      setErrorMsg(null);
      return undefined;
    }

    let cancelled = false;
    handledRef.current = false;
    setStatus('starting');
    setErrorMsg(null);

    const stopInstance = async (instance) => {
      if (!instance) return;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch {
        // Ignore stop errors if stream already ended
      }
      try {
        instance.clear();
      } catch {
        // Ignore clear errors if DOM already unmounted
      }
    };

    const startScanner = async () => {
      try {
        const mod = await import('html5-qrcode');
        if (cancelled) return;

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod;
        const formatsToSupport = getFormatsForMode(Html5QrcodeSupportedFormats, mode);

        const instance = new Html5Qrcode(regionId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = instance;

        const scanConfig = {
          fps: 12,
          qrbox: getQrBoxForMode(mode),
          aspectRatio: mode === 'barcode' ? 1.6 : 1.0,
        };

        const handleDecoded = (decodedText) => {
          if (cancelled || handledRef.current) return;
          const clean = String(decodedText || '').trim();
          if (!clean) return;
          handledRef.current = true;
          stopInstance(instance).finally(() => {
            if (!cancelled) {
              onScanRef.current?.(clean);
            }
          });
        };

        const targetConstraint = manualCameraId || { facingMode: 'environment' };

        try {
          await instance.start(targetConstraint, scanConfig, handleDecoded, () => {});
        } catch (primaryErr) {
          if (cancelled) return;
          if (!manualCameraId && typeof Html5Qrcode.getCameras === 'function') {
            const list = await Html5Qrcode.getCameras();
            if (cancelled) return;
            if (Array.isArray(list) && list.length > 0) {
              setCameras(list);
              const rearIdx = list.findIndex((c) => /back|rear|environment/i.test(c.label || ''));
              const chosenIdx = rearIdx >= 0 ? rearIdx : 0;
              setCameraIndex(chosenIdx);
              await instance.start(list[chosenIdx].id, scanConfig, handleDecoded, () => {});
            } else {
              throw primaryErr;
            }
          } else {
            throw primaryErr;
          }
        }

        if (!cancelled && typeof Html5Qrcode.getCameras === 'function') {
          Html5Qrcode.getCameras()
            .then((list) => {
              if (!cancelled && Array.isArray(list)) setCameras(list);
            })
            .catch(() => {});
        }

        if (!cancelled) {
          setStatus('scanning');
        }
      } catch (err) {
        if (cancelled) return;
        const rawMsg = err?.message || String(err || '');
        const isInsecureContext = typeof window !== 'undefined' && window.isSecureContext === false;
        let friendly = 'Could not access the camera on this device.';
        if (isInsecureContext) {
          friendly = 'Live camera streaming requires HTTPS on mobile browsers. Use "Take Photo / Upload" below to scan directly from your camera.';
        } else if (/NotAllowedError|Permission/i.test(rawMsg)) {
          friendly = 'Camera permission was denied. Allow camera access in your browser settings or use the photo scan option below.';
        } else if (/NotFoundError|no camera|Requested device not found/i.test(rawMsg)) {
          friendly = 'No camera was detected on this device. You can still upload or capture a photo below.';
        }
        setErrorMsg(friendly);
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      scannerRef.current = null;
      stopInstance(inst);
    };
  }, [isOpen, mode, manualCameraId, regionId]);

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const nextIdx = (cameraIndex + 1) % cameras.length;
    setCameraIndex(nextIdx);
    setManualCameraId(cameras[nextIdx].id);
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoLoading(true);
    setErrorMsg(null);
    try {
      const mod = await import('html5-qrcode');
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod;
      const formatsToSupport = getFormatsForMode(Html5QrcodeSupportedFormats, mode);
      let tempScanner = scannerRef.current;
      if (!tempScanner || tempScanner.isScanning) {
        tempScanner = new Html5Qrcode(`${regionId}-file`, {
          formatsToSupport,
          verbose: false,
        });
      }
      const decodedText = await tempScanner.scanFile(file, false);
      const clean = String(decodedText || '').trim();
      if (clean) {
        handledRef.current = true;
        onScanRef.current?.(clean);
      } else {
        setErrorMsg(`No ${mode === 'qr_code' ? 'QR code' : mode === 'barcode' ? 'barcode' : 'code'} detected in that image. Try a clearer photo.`);
      }
    } catch {
      setErrorMsg(`Could not detect a ${mode === 'qr_code' ? 'QR code' : mode === 'barcode' ? 'barcode' : 'code'} in that image. Please hold steady and try again.`);
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={meta.title}
      size="md"
      maxWidth="520px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={photoLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              📷 {meta.photoLabel}
            </Button>
            {cameras.length > 1 && (
              <Button type="button" variant="secondary" size="sm" onClick={handleSwitchCamera}>
                🔄 Switch Camera
              </Button>
            )}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: '#64748b' }}>
          {meta.subtitle}
        </p>

        <div
          style={{
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1.5px solid #e2e8f0',
            background: '#0f172a',
            minHeight: status === 'error' ? 110 : 270,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div id={regionId} style={{ width: '100%' }} />
          <div id={`${regionId}-file`} style={{ display: 'none' }} />

          {status === 'starting' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#e2e8f0', fontSize: 13.5, background: 'rgba(15, 23, 42, 0.85)' }}>
              <span>Starting camera…</span>
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '20px 18px', textAlign: 'center', color: '#f8fafc', fontSize: 13.5, lineHeight: 1.55 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📷</div>
              <div>{errorMsg}</div>
            </div>
          )}
        </div>

        {status !== 'error' && errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
            {errorMsg}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoCapture}
        />
      </div>
    </Modal>
  );
}
