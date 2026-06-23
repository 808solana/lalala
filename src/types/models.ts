export interface ModelPricing {
  prompt: string;
  completion: string;
  image?: string;
  request?: string;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: ModelPricing;
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  created?: number;
}

/** The synthetic "auto" entry that always sits at the top of the model list */
export const OPENROUTER_AUTO: Model = {
  id: "openrouter/auto",
  name: "Auto (OpenRouter picks best model)",
  description:
    "OpenRouter automatically routes your request to the best available model.",
};
