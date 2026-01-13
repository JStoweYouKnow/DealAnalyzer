import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Downloads a file from a blob and saves it to the device, then opens the share dialog
 */
export async function downloadAndShareFile(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  try {
    // Convert blob to base64
    const base64 = await blobToBase64(blob);

    // Determine file extension from mime type
    const extension = mimeType === 'application/pdf' ? 'pdf' : 'csv';
    const fullFileName = fileName.endsWith(`.${extension}`) ? fileName : `${fileName}.${extension}`;

    // Create file URI - sanitize filename
    const sanitizedFileName = fullFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUri = `${FileSystem.documentDirectory}${sanitizedFileName}`;

    // Write file to device
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share/open the file
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Save ${sanitizedFileName}`,
        UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
      });
    } else {
      // Fallback: show alert with file location
      Alert.alert(
        'File Downloaded',
        `File saved to: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert(
      'Download Failed',
      error instanceof Error ? error.message : 'Failed to download file',
      [{ text: 'OK' }]
    );
    throw error;
  }
}

/**
 * Converts a Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1] || reader.result;
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads a PDF report
 */
export async function downloadPDF(blob: Blob, fileName: string = 'property-analysis'): Promise<void> {
  return downloadAndShareFile(blob, fileName, 'application/pdf');
}

/**
 * Downloads a CSV report
 */
export async function downloadCSV(blob: Blob, fileName: string = 'property-analysis'): Promise<void> {
  return downloadAndShareFile(blob, fileName, 'text/csv');
}

