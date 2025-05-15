# Parakeet AI Compliance Assistant

An AI-powered compliance assistant that helps organizations manage supplier risk and detect Personally Identifiable Information (PII) in documents.

## Features

- **Supplier Risk Analysis**: Analyze and monitor supplier risk scores, categories, and trends
- **PII Detection**: Identify and handle sensitive information in documents
- **Cost Tracking**: Real-time tracking of AI model usage costs
- **Interactive Chat Interface**: User-friendly chat interface for both supplier risk and PII analysis
- **File Upload Support**: Process and analyze uploaded documents
- **Real-time Streaming**: Immediate AI responses with streaming updates

## Architecture

### Core Components

1. **Chat Interface (`src/components/chat/chat-interface.tsx`)**
   - Handles user interactions and message display
   - Manages file uploads and processing
   - Implements real-time streaming of AI responses
   - Provides loading states and progress indicators

2. **Cost Tracking (`src/lib/cost-tracker.ts`)**
   - Singleton pattern for centralized cost management
   - Tracks usage across different AI models
   - Supports multiple operation types (chat, supplier-risk, upload)
   - Persists cost data in localStorage
   - Provides cost analytics by model and operation

3. **API Routes**
   - `/api/chat/route.ts`: Handles PII detection and compliance queries
   - `/api/supplier-risk/chat/route.ts`: Manages supplier risk analysis
   - `/api/upload/route.ts`: Processes document uploads

4. **Data Models**
   - Supplier data structure with risk metrics
   - Chat message interface
   - Cost tracking types and interfaces

### Design Decisions

1. **Streaming Architecture**
   - Uses OpenAI's streaming API for real-time responses
   - Implements custom TransformStream for cost tracking
   - Separates cost information from chat content

2. **Cost Management**
   - Centralized cost tracking with singleton pattern
   - Model-specific cost configurations
   - Persistent storage for cost history
   - Real-time cost updates in UI

3. **UI/UX**
   - Collapsible cost display
   - Loading indicators for all operations
   - Structured message formatting
   - Responsive design

## Setup Instructions

1. **Prerequisites**
   ```bash
   Node.js >= 18.0.0
   npm >= 9.0.0
   ```

2. **Environment Setup**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/parakeet-ai-compliance-assistant.git
   cd parakeet-ai-compliance-assistant

   # Install dependencies
   npm install

   # Create .env.local file
   cp .env.example .env.local
   ```

3. **Environment Variables**
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Development**
   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build

   # Start production server
   npm start
   ```

## Usage

1. **Supplier Risk Analysis**
   - Navigate to `/supplier-risk`
   - Ask questions about supplier risk scores, categories, or trends
   - View structured responses with risk metrics

2. **PII Detection**
   - Use the chat interface to analyze documents
   - Upload files for automated PII detection
   - Receive guidance on handling sensitive information

3. **Cost Monitoring**
   - View real-time cost updates in the collapsible cost display
   - Track costs by model and operation type
   - Monitor total usage costs

## Cost Structure

The application uses various OpenAI models with different pricing:

- GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
- GPT-4 Vision: $0.01/1K input tokens (including images), $0.03/1K output tokens
- Other models available with different pricing tiers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
