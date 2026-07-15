import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

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
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
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

  async selectFromGallery(): Promise<CapturedImage | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
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

  async checkPermissions(): Promise<boolean> {
    const permission = await Camera.checkPermissions();
    if (permission.camera === 'granted' && permission.photos === 'granted') {
      return true;
    }

    const requested = await Camera.requestPermissions();
    return requested.camera === 'granted' && requested.photos === 'granted';
  }
}
