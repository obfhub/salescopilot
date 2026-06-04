export type LeadSource =
  | "Telegram"
  | "Instagram"
  | "Website"
  | "Facebook"
  | "Referral"
  | "Manual"
  | "WhatsApp";

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Won" | "Lost" | "Waiting";
export type PipelineStage =
  | "New Lead"
  | "Qualification"
  | "Presentation"
  | "Proposal"
  | "Negotiation"
  | "Payment"
  | "Closed"
  | "Lost";
export type Temperature = "Hot" | "Warm" | "Cold";
export type MessageType = "customer" | "manager" | "ai";

export type Message = {
  id: string;
  author: string;
  time: string;
  type: MessageType;
  text: string;
};

export type Task = {
  id: string;
  label: string;
  completed: boolean;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

export type AiAnalysis = {
  customerType: string;
  intent: string;
  interestLevel: string;
  urgency: "Low" | "Medium" | "High";
  budgetReadiness: string;
  mainNeed: string;
  painPoint: string;
  objection: string;
  lossRisk: string;
  recommendedStage: PipelineStage;
  nextBestAction: string;
  confidence: number;
  summary: string;
  reply: string;
  provider?: "mock" | "openai";
  opportunity?: string;
  replyOptions: {
    short?: string;
    professional: string;
    sales?: string;
    closing?: string;
    casual?: string;
    brief?: string;
  };
};

export type Lead = {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  pipelineStage: PipelineStage;
  interest: string;
  temperature: Temperature;
  purchaseProbability: number;
  dealValue: number;
  lastMessage: string;
  lastContactDate: string;
  assignedManager: string;
  messageHistory: Message[];
  aiAnalysis: AiAnalysis;
  tasks: Task[];
  notes: Note[];
};

export type Settings = {
  companyName: string;
  managerName: string;
  replyTone: "friendly" | "professional" | "confident" | "sales-focused";
  currency: string;
  language: string;
  telegramToken: string;
  supabaseUrl: string;
  claudeApiKey: string;
};
