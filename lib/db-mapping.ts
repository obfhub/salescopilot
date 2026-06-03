import type { LeadSource, LeadStatus, PipelineStage, Temperature, MessageType } from "@/types";

export const stageToDb = (stage: PipelineStage) => (stage === "New Lead" ? "NewLead" : stage);
export const stageFromDb = (stage: string): PipelineStage => (stage === "NewLead" ? "New Lead" : (stage as PipelineStage));

export const sourceToDb = (source: LeadSource) => source;
export const sourceFromDb = (source: string) => source as LeadSource;

export const statusToDb = (status: LeadStatus) => status;
export const statusFromDb = (status: string) => status as LeadStatus;

export const temperatureToDb = (temperature: Temperature) => temperature;
export const temperatureFromDb = (temperature: string) => temperature as Temperature;

export const messageTypeToDb = (type: MessageType) => type;
export const messageTypeFromDb = (type: string) => type as MessageType;
