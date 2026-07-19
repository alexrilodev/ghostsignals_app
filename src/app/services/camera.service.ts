import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CapturedImage {
  base64String: string;
  webPath: string;
  format: string;
}

@Injectable({
  providedIn: 'root',
})
export class CameraService {

  async takePhoto(): Promise<CapturedImage | null> {
    if (Capacitor.isNativePlatform()) {
      return this.takePhotoNative(CameraSource.Camera);
    }
    return this.takePhotoWeb('camera');
  }

  async selectFromGallery(): Promise<CapturedImage | null> {
    if (Capacitor.isNativePlatform()) {
      return this.takePhotoNative(CameraSource.Photos);
    }
    return this.takePhotoWeb('gallery');
  }

  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    const permission = await Camera.checkPermissions();
    if (permission.camera === 'granted' && permission.photos === 'granted') {
      return true;
    }
    const requested = await Camera.requestPermissions();
    return requested.camera === 'granted' && requested.photos === 'granted';
  }

  private async takePhotoNative(source: CameraSource): Promise<CapturedImage | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source,
        width: 1024,
        height: 1024,
      });

      return {
        base64String: image.base64String || '',
        webPath: image.webPath || '',
        format: image.format || 'jpeg',
      };
    } catch (error: any) {
      if (error.message?.includes('User cancelled')) {
        return null;
      }
      throw error;
    }
  }

  private async takePhotoWeb(mode: 'camera' | 'gallery'): Promise<CapturedImage | null> {
    if (mode === 'camera') {
      return this.takePhotoWebCamera();
    }
    return this.takePhotoWebGallery();
  }

  private takePhotoWebGallery(): Promise<CapturedImage | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          const format = file.type.split('/')[1] || 'jpeg';
          resolve({
            base64String: base64,
            webPath: dataUrl,
            format,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  private async takePhotoWebCamera(): Promise<CapturedImage | null> {
    let stream: MediaStream | null = null;
    let overlayEl: HTMLDivElement | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } },
      });

      const result = await new Promise<CapturedImage | null>((resolve) => {
        overlayEl = document.createElement('div');
        overlayEl.innerHTML = `
          <style>
            .camera-preview-overlay {
              position: fixed; top: 0; left: 0; right: 0; bottom: 0;
              z-index: 99999; background: #000;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
            }
            .camera-preview-overlay video {
              width: 100%; height: 100%; object-fit: cover;
            }
            .camera-preview-overlay .camera-controls {
              position: absolute; bottom: 0; left: 0; right: 0;
              display: flex; justify-content: center; align-items: center; gap: 24px;
              padding: 24px 16px 40px;
              background: linear-gradient(transparent, rgba(0,0,0,0.6));
            }
            .camera-preview-overlay .btn-capture {
              width: 68px; height: 68px; border-radius: 50%;
              border: 4px solid #fff; background: rgba(255,255,255,0.3);
              cursor: pointer; position: relative;
              transition: background 0.15s;
            }
            .camera-preview-overlay .btn-capture:active { background: rgba(255,255,255,0.7); }
            .camera-preview-overlay .btn-capture::after {
              content: ''; position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px;
              border-radius: 50%; background: #fff;
            }
            .camera-preview-overlay .btn-cancel {
              width: 44px; height: 44px; border-radius: 50%;
              border: none; background: rgba(255,255,255,0.25);
              color: #fff; font-size: 22px; cursor: pointer;
              display: flex; align-items: center; justify-content: center;
            }
          </style>
          <div class="camera-preview-overlay">
            <video playsinline autoplay></video>
            <div class="camera-controls">
              <button class="btn-cancel" aria-label="Cancelar">✕</button>
              <button class="btn-capture" aria-label="Capturar"></button>
            </div>
          </div>
        `;

        const videoEl = overlayEl!.querySelector('video') as HTMLVideoElement;
        const btnCapture = overlayEl!.querySelector('.btn-capture') as HTMLButtonElement;
        const btnCancel = overlayEl!.querySelector('.btn-cancel') as HTMLButtonElement;

        videoEl.srcObject = stream!;
        videoEl.play();

        const cleanup = () => {
          if (overlayEl && overlayEl.parentNode) {
            overlayEl.parentNode.removeChild(overlayEl);
          }
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
          }
        };

        const capture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(videoEl, 0, 0);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = dataUrl.split(',')[1];

          cleanup();

          resolve({
            base64String: base64,
            webPath: dataUrl,
            format: 'jpeg',
          });
        };

        btnCapture.addEventListener('click', capture);
        btnCancel.addEventListener('click', () => {
          cleanup();
          resolve(null);
        });

        document.body.appendChild(overlayEl);
      });

      return result;
    } catch (error: any) {
      const el = document.querySelector('.camera-preview-overlay')?.parentElement;
      if (el) {
        el.removeChild(el);
      }
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        return null;
      }
      throw error;
    } finally {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    }
  }
}
