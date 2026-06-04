import { analyzeMessage } from "@/lib/analyze-message";
import type { Lead, LeadSource, LeadStatus, PipelineStage, Task } from "@/types";

const taskLabels = ["Call the client", "Send presentation", "Confirm pricing", "Schedule demo", "Follow up tomorrow"];

const tasks = (done: number[] = []): Task[] =>
  taskLabels.map((label, index) => ({
    id: `task-${index + 1}`,
    label,
    completed: done.includes(index)
  }));

const profiles: Array<{
  id: string;
  name: string;
  company: string;
  position: string;
  source: LeadSource;
  status: LeadStatus;
  pipelineStage: PipelineStage;
  interest: string;
  dealValue: number;
  lastMessage: string;
  done?: number[];
}> = [
  {
    id: "john-carter",
    name: "John Carter",
    company: "Northstar Retail",
    position: "Owner",
    source: "Website",
    status: "Qualified",
    pipelineStage: "Presentation",
    interest: "Sales automation",
    dealValue: 12800,
    lastMessage: "We need to automate sales requests quickly. Can you show me how this works for a small team?",
    done: [0, 1]
  },
  {
    id: "emily-johnson",
    name: "Emily Johnson",
    company: "BrightDesk Studio",
    position: "Operations Manager",
    source: "Telegram",
    status: "Contacted",
    pipelineStage: "Qualification",
    interest: "Telegram bot",
    dealValue: 9400,
    lastMessage: "We receive many Telegram requests. Do you support bot integration and routing to managers?"
  },
  {
    id: "daniel-brooks",
    name: "Daniel Brooks",
    company: "Brookline Fitness",
    position: "Founder",
    source: "Instagram",
    status: "Waiting",
    pipelineStage: "Proposal",
    interest: "Pricing",
    dealValue: 7600,
    lastMessage: "How much does it cost for three sales managers? Please send pricing today.",
    done: [1]
  },
  {
    id: "sophia-miller",
    name: "Sophia Miller",
    company: "ScaleBridge",
    position: "Revenue Lead",
    source: "Referral",
    status: "Qualified",
    pipelineStage: "Negotiation",
    interest: "Competitor comparison",
    dealValue: 18400,
    lastMessage: "We are comparing competitors and alternatives. What makes your sales AI better?"
  },
  {
    id: "michael-turner",
    name: "Michael Turner",
    company: "Turner Legal Group",
    position: "Managing Partner",
    source: "Facebook",
    status: "New",
    pipelineStage: "New Lead",
    interest: "Free trial",
    dealValue: 6200,
    lastMessage: "We are thinking about a free trial, but maybe later after internal review."
  },
  {
    id: "james-wilson",
    name: "James Wilson",
    company: "Wilson Logistics",
    position: "Sales Director",
    source: "Manual",
    status: "Contacted",
    pipelineStage: "Presentation",
    interest: "CRM integration",
    dealValue: 22600,
    lastMessage: "Can your product integrate with our CRM and show conversion analytics in one dashboard?",
    done: [0]
  },
  {
    id: "olivia-davis",
    name: "Olivia Davis",
    company: "Davis Home Services",
    position: "Head of Sales",
    source: "WhatsApp",
    status: "Qualified",
    pipelineStage: "Proposal",
    interest: "Multiple managers",
    dealValue: 15100,
    lastMessage: "We have multiple sales managers and need a better way to distribute leads quickly."
  },
  {
    id: "ethan-clark",
    name: "Ethan Clark",
    company: "Clark Academy",
    position: "Growth Manager",
    source: "Website",
    status: "Qualified",
    pipelineStage: "Proposal",
    interest: "Demo",
    dealValue: 11200,
    lastMessage: "Can we schedule a demo call this week? I want to show it to our director.",
    done: [0, 3]
  },
  {
    id: "ava-anderson",
    name: "Ava Anderson",
    company: "Anderson Interiors",
    position: "Owner",
    source: "Instagram",
    status: "Waiting",
    pipelineStage: "Negotiation",
    interest: "ROI concerns",
    dealValue: 8700,
    lastMessage: "It looks useful, but it feels expensive. Can you explain the ROI?"
  },
  {
    id: "ryan-scott",
    name: "Ryan Scott",
    company: "Scott Auto Group",
    position: "General Manager",
    source: "Telegram",
    status: "Contacted",
    pipelineStage: "Qualification",
    interest: "Lead processing",
    dealValue: 19700,
    lastMessage: "We want to automate lead processing from Telegram, WhatsApp, and website forms."
  },
  {
    id: "victoria-bennett",
    name: "Victoria Bennett",
    company: "Bennett SaaS Advisory",
    position: "VP Sales",
    source: "Referral",
    status: "Qualified",
    pipelineStage: "Presentation",
    interest: "Sales analytics",
    dealValue: 24300,
    lastMessage: "We need analytics, forecasting, and recommendations for managers across the pipeline."
  },
  {
    id: "andrew-cooper",
    name: "Andrew Cooper",
    company: "Cooper Distribution",
    position: "CEO",
    source: "Manual",
    status: "Won",
    pipelineStage: "Payment",
    interest: "Invoice",
    dealValue: 28600,
    lastMessage: "The proposal looks good. Send the invoice and contract so we can pay and start now.",
    done: [0, 1, 2, 3]
  }
];

export const pipelineStages: PipelineStage[] = [
  "New Lead",
  "Qualification",
  "Presentation",
  "Proposal",
  "Negotiation",
  "Payment",
  "Closed",
  "Lost"
];

export const leadSources: LeadSource[] = ["Telegram", "Instagram", "Website", "Facebook", "Referral", "Manual", "WhatsApp"];

export const demoLeads: Lead[] = profiles.map((profile, index) => {
  const analysis = analyzeMessage(profile.lastMessage);
  return {
    ...profile,
    email: `${profile.name.toLowerCase().replace(" ", ".")}@${profile.company.toLowerCase().replaceAll(" ", "").replaceAll(".", "")}.com`,
    phone: `+1 (415) 555-01${String(index).padStart(2, "0")}`,
    temperature: analysis.temperature,
    purchaseProbability: analysis.score,
    lastContactDate: `2026-05-${String(20 + (index % 10)).padStart(2, "0")}`,
    assignedManager: index % 2 === 0 ? "Sarah Mitchell" : "Alex Morgan",
    aiAnalysis: analysis,
    tasks: tasks(profile.done),
    notes: [
      {
        id: `note-${profile.id}`,
        text: analysis.score > 80 ? "Prioritize this lead today." : "Confirm decision process and timeline.",
        createdAt: "2026-05-30 10:15"
      }
    ],
    messageHistory: [
      {
        id: `m1-${profile.id}`,
        author: profile.name,
        time: "09:22",
        type: "customer",
        text: profile.lastMessage
      },
      {
        id: `m2-${profile.id}`,
        author: "AI Sales Copilot",
        time: "09:23",
        type: "ai",
        text: analysis.summary
      },
      {
        id: `m3-${profile.id}`,
        author: index % 2 === 0 ? "Sarah Mitchell" : "Alex Morgan",
        time: "09:31",
        type: "manager",
        text: analysis.replyOptions.professional
      }
    ]
  };
});
