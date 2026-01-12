// Pattern types

export type StepAction =
  | "NOTIFY"
  | "VALIDATE"
  | "TRANSFORM"
  | "WEBHOOK"
  | "CONDITION"
  | "DELAY";

export interface PatternStep {
  id: string;
  name: string;
  description: string | null;
  action: StepAction;
  config: Record<string, unknown>;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  patternId: string;
}

export interface Pattern {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  steps: PatternStep[];
}

export interface PatternTestResult {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  duration: number | null;
  createdAt: Date;
  patternId: string;
}

// API Request/Response types

export interface CreatePatternRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePatternRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateStepRequest {
  name: string;
  description?: string;
  action: StepAction;
  config: Record<string, unknown>;
  sortOrder?: number;
  isEnabled?: boolean;
}

export interface UpdateStepRequest {
  name?: string;
  description?: string;
  action?: StepAction;
  config?: Record<string, unknown>;
  sortOrder?: number;
  isEnabled?: boolean;
}

export interface ReorderStepsRequest {
  stepIds: string[];
}

export interface RunTestRequest {
  input?: Record<string, unknown>;
}
