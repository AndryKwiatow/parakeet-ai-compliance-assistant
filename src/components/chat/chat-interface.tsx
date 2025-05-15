'use client';

import { useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Upload, Send, Bot, User, Shield, FileText, Image, Download, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface UploadResponse {
  message: string;
  piiCount: number;
}


const testFiles = [
  {
    name: 'health_report.png',
    description: 'Sample health report with medical information',
    type: 'image/png',
    size: '2.4 MB'
  },
  {
    name: 'bank_form.pdf',
    description: 'Sample bank form with financial details',
    type: 'application/pdf',
    size: '1.8 MB'
  },
  {
    name: 'passport.jpg',
    description: 'Sample passport scan with personal information',
    type: 'image/jpeg',
    size: '3.1 MB'
  }
];

function WelcomeMessage() {
  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/test-files/${fileName}`);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <div className="bg-primary/5 p-6 rounded-full">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Welcome to Parakeet AI Compliance Assistant</h2>
        <p className="text-muted-foreground max-w-md">
          I can help you identify and protect sensitive information in your documents. Upload a PDF or image file to get started.
        </p>
      </div>

      {/* Test Files Section */}
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-2 text-left">
          <Download className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Test Files</h3>
        </div>
        <p className="text-sm text-muted-foreground text-left">
          Download these sample files to test the PII detection capabilities:
        </p>
        <div className="grid grid-cols-1 gap-3">
          {testFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file.type} • {file.size}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(file.name)}
                className="shrink-0 ml-4"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md w-full">
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm">PDF Documents</span>
        </div>
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="h-5 w-5 text-primary" />
          <span className="text-sm">Images (PNG, JPG, GIF)</span>
        </div>
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex items-start gap-4 bg-muted/50 ml-auto p-4 rounded-lg max-w-[80%]">
      <Avatar className="w-8 h-8">
        <Bot className="w-6 h-6" />
      </Avatar>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">AI Assistant</p>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing your request...</p>
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
      setErrorMessage(error.message);
      setShowError(true);
    },
    onResponse: (response) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'cost') {
                    const event = new CustomEvent('costUpdate', {
                      detail: data.data
                    });
                    window.dispatchEvent(event);
                  }
                } catch {
                  // Silently handle JSON parse errors
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error);
        }
      };

      processStream();
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;

    const file = acceptedFiles[0];

    if (file.size > Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE)) {
      setErrorMessage('File size exceeds the maximum limit of 10MB');
      setShowError(true);
      return;
    }

    const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload a PDF or image file.');
      setShowError(true);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText) as UploadResponse);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      const data = await uploadPromise;
      toast.success('File uploaded successfully');
      
      await append({
        role: 'user',
        content: `I've uploaded a file named "${file.name}" for PII analysis.`,
      });

      await append({
        role: 'assistant',
        content: `I've analyzed the file "${file.name}". ${data.message}`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload file. Please try again.');
      setShowError(true);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [append]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    disabled: isUploading || isLoading,
    noClick: true,
    noKeyboard: true
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
      <Card 
        {...getRootProps()} 
        className={`flex-1 flex flex-col relative transition-colors ${
          isDragActive ? 'bg-primary/5' : ''
        }`}
      >
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-primary">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Drop your file here</p>
              <p className="text-sm text-muted-foreground mt-2">
                Supported formats: PDF, PNG, JPG, GIF
              </p>
            </div>
          </div>
        )}
        <input {...getInputProps()} />
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <WelcomeMessage />
          ) : (
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 ${
                    message.role === 'assistant' 
                      ? 'bg-muted/50 ml-auto flex-row-reverse' 
                      : ''
                  } p-4 rounded-lg max-w-[80%] ${message.role === 'assistant' ? 'ml-auto' : 'mr-auto'}`}
                >
                  <Avatar className="w-8 h-8">
                    {message.role === 'assistant' ? (
                      <Bot className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </Avatar>
                  <div className={`flex-1 space-y-2 ${message.role === 'assistant' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {(isLoading || isUploading) && <LoadingMessage />}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              disabled={isUploading || isLoading}
              className="shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isUploading || isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isUploading || isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </form>
          {isUploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Uploading file... {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 