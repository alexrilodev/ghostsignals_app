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

  private takePhotoWeb(mode: 'camera' | 'gallery'): Promise<CapturedImage | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      if (mode === 'camera') {
        input.capture = 'environment';
      }

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
}
