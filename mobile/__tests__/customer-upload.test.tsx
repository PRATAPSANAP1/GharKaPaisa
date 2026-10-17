/**
 * Unit Tests for Customer Upload Screen
 * Tests file picker, validation, and upload functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CustomerUploadScreen from '../app/(public)/customer-upload';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { uploadCustomerDocument } from '../services/application.service';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
  },
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
  isCancel: jest.fn(() => false),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

// Mock application service
jest.mock('../services/application.service', () => ({
  uploadCustomerDocument: jest.fn(),
}));

describe('CustomerUploadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<CustomerUploadScreen />);
    expect(getByText('Document Upload Desk')).toBeTruthy();
  });

  it('validates token input before upload', async () => {
    const { getByText } = render(<CustomerUploadScreen />);
    const uploadButton = getByText('Upload Document');
    
    fireEvent.press(uploadButton);
    
    await waitFor(() => {
      // Should show alert for missing token
      expect(uploadCustomerDocument).not.toHaveBeenCalled();
    });
  });

  it('validates file selection before upload', async () => {
    const { getByText, getByPlaceholderText } = render(<CustomerUploadScreen />);
    
    // Enter token
    const tokenInput = getByPlaceholderText('e.g. APP100293 or token_xyz');
    fireEvent.changeText(tokenInput, 'APP123456');
    
    // Try upload without file
    const uploadButton = getByText('Upload Document');
    fireEvent.press(uploadButton);
    
    await waitFor(() => {
      expect(uploadCustomerDocument).not.toHaveBeenCalled();
    });
  });

  it('picks document successfully', async () => {
    const mockFile = {
      uri: 'file://test.pdf',
      name: 'test.pdf',
      size: 1024 * 1024, // 1MB
      mimeType: 'application/pdf',
    };

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ size: 1024 * 1024 });

    const { getByText } = render(<CustomerUploadScreen />);
    const pickerBox = getByText('Tap to Choose File (PDF, JPG, PNG)');
    
    fireEvent.press(pickerBox);
    
    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
    });
  });

  it('rejects files larger than 10MB', async () => {
    const mockFile = {
      uri: 'file://test.pdf',
      name: 'test.pdf',
      size: 11 * 1024 * 1024, // 11MB
      mimeType: 'application/pdf',
    };

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ size: 11 * 1024 * 1024 });

    const { getByText } = render(<CustomerUploadScreen />);
    const pickerBox = getByText('Tap to Choose File (PDF, JPG, PNG)');
    
    fireEvent.press(pickerBox);
    
    await waitFor(() => {
      // Should show alert for file too large
      expect(uploadCustomerDocument).not.toHaveBeenCalled();
    });
  });

  it('uploads document successfully', async () => {
    const mockFile = {
      uri: 'file://test.pdf',
      name: 'test.pdf',
      size: 1024 * 1024,
      mimeType: 'application/pdf',
    };

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(mockFile);
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ size: 1024 * 1024 });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64data');
    (uploadCustomerDocument as jest.Mock).mockResolvedValue({ success: true });

    const { getByText, getByPlaceholderText } = render(<CustomerUploadScreen />);
    
    // Enter token
    const tokenInput = getByPlaceholderText('e.g. APP100293 or token_xyz');
    fireEvent.changeText(tokenInput, 'APP123456');
    
    // Pick file
    const pickerBox = getByText('Tap to Choose File (PDF, JPG, PNG)');
    fireEvent.press(pickerBox);
    
    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
    });
    
    // Upload
    const uploadButton = getByText('Upload Document');
    fireEvent.press(uploadButton);
    
    await waitFor(() => {
      expect(uploadCustomerDocument).toHaveBeenCalledWith(
        'APP123456',
        expect.objectContaining({
          document_type: 'PAN_CARD',
          file_name: 'test.pdf',
          file_data: 'base64data',
          file_size: 1024 * 1024,
        })
      );
    });
  });
});
