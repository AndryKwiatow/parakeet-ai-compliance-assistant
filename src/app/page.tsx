import { ChatInterface } from '@/components/chat/chat-interface';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        <ChatInterface />
      </div>
      <Toaster />
    </main>
  );
}
