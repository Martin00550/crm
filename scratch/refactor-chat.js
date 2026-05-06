const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/api/chat/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Define interfaces at the top (after imports)
const interfaces = `
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface AIResponse {
  choices: {
    message: ChatMessage;
  }[];
}
`;

// Insert interfaces after imports
const lastImportIndex = content.lastIndexOf('import');
const firstLineAfterImports = content.indexOf('\n', lastImportIndex) + 1;
content = content.slice(0, firstLineAfterImports) + interfaces + content.slice(firstLineAfterImports);

// Replace any types in function signatures
content = content.replace(/callDashScope\(messages: any\[\], tools: any\[\]\): Promise<any>/g, 'callDashScope(messages: ChatMessage[], tools: any[]): Promise<AIResponse>');
content = content.replace(/callGemini\(messages: any\[\], tools: any\[\]\): Promise<any>/g, 'callGemini(messages: ChatMessage[], tools: any[]): Promise<AIResponse>');
content = content.replace(/callAI\(messages: any\[\], tools: any\[\]\): Promise<any>/g, 'callAI(messages: ChatMessage[], tools: any[]): Promise<AIResponse>');
content = content.replace(/executeTool\(toolName: string, args: any, agencyId: string, userId: string \| null\)/g, 'executeTool(toolName: string, args: any, agencyId: string, userId: string | null): Promise<any>');
content = content.replace(/const allMessages = \[systemMessage, ...messages.filter\(\(m: any\) => m.role !== 'system'\)\];/g, 'const allMessages: ChatMessage[] = [systemMessage as ChatMessage, ...messages.filter((m: any) => m.role !== "system")];');

fs.writeFileSync(filePath, content);
console.log('Successfully updated src/app/api/chat/route.ts');
