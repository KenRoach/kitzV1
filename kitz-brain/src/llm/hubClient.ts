export type LLMTaskType = 'drafting' | 'summarizing' | 'search';

const llmHubUrl = process.env.LLM_HUB_URL || 'http://localhost:4010';

export const llmHubClient = {
  async complete(taskType: LLMTaskType, prompt: string, traceId: string) {
    const response = await fetch(`${llmHubUrl}/complete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-trace-id': traceId,
        'x-org-id': 'demo-org',
        authorization: 'Bearer brain-service-token'
      },
      body: JSON.stringify({ taskType, prompt })
    });

    return response.json();
  }
};
