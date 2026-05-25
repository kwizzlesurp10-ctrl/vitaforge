export type BillingMode = 'monthly' | 'annual';

export type RegistryComponentId =
  | 'vf-floating-scan'
  | 'vf-protocol-card'
  | 'vf-inline-banner';

export type VariantStatus = 'staging' | 'active' | 'retired';

export interface ExtensionSettings {
  llmProxyUrl?: string;
  otlpEndpoint?: string;
  stagingEnabled: boolean;
  telemetryEnabled: boolean;
  designLoopEnabled: boolean;
  maxVariantsPerPrompt: number;
}

export interface DesignPromptRequest {
  prompt: string;
  componentId: RegistryComponentId;
  selector?: string;
  url?: string;
  userIntent?: string;
}

export interface ComponentVariant {
  id: string;
  componentId: RegistryComponentId;
  prompt: string;
  status: VariantStatus;
  weight: number;
  createdAt: string;
  html: string;
  css?: string;
  rationale: string;
  safetyNotes: string[];
}

export interface InjectionCommand {
  type: 'VF_APPLY_VARIANT';
  variant: ComponentVariant;
  selector?: string;
}

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, string | number | boolean | undefined>;
}

export interface OutcomeEvent {
  variantId: string;
  componentId: RegistryComponentId;
  outcome: 'view' | 'click' | 'dismiss' | 'conversion' | 'error';
  value?: number;
  url: string;
}

export interface OodaLoopResult {
  observation: string;
  orientation: string;
  decision: string;
  action: 'generate_variant' | 'promote_variant' | 'retire_variant' | 'hold';
  confidence: number;
}
