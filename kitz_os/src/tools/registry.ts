/**
 * OS Tool Registry — Central registry for all KITZ OS tools.
 */

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  execute: (args: Record<string, unknown>, traceId?: string) => Promise<unknown>;
}

export class OsToolRegistry {
  private tools = new Map<string, ToolSchema>();

  register(tool: ToolSchema): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolSchema | undefined {
    return this.tools.get(name);
  }

  list(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  count(): number {
    return this.tools.size;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  async invoke(name: string, args: Record<string, unknown>, traceId?: string): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) return { error: `Tool "${name}" not found` };
    try {
      return await tool.execute(args, traceId);
    } catch (err) {
      return { error: `Tool "${name}" failed: ${(err as Error).message}` };
    }
  }

  toOpenAITools(): Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return this.list().map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  async registerDefaults(): Promise<void> {
    const modules = await Promise.allSettled([
      import('./crmTools.js'),
      import('./storefrontTools.js'),
      import('./dashboardTools.js'),
      import('./emailTools.js'),
      import('./braindumpTools.js'),
      import('./docScanTools.js'),
      import('./factCheckTools.js'),
      import('./agentTools.js'),
      import('./outboundTools.js'),
      import('./calendarTools.js'),
      import('./artifactTools.js'),
      import('./lovableTools.js'),
      import('./paymentTools.js'),
      import('./voiceTools.js'),
      import('./mediaUnderstandingTools.js'),
      import('./memoryTools.js'),
      import('./webTools.js'),
      import('./sopTools.js'),
      import('./broadcastTools.js'),
      import('./llmTools.js'),
      import('./inventoryTools.js'),
      import('./n8nTools.js'),
      import('./toolFactoryTools.js'),
      import('./marketingTools.js'),
      import('./salesFunnelTools.js'),
      import('./dripCampaignTools.js'),
      import('./mailMergeTools.js'),
      import('./documentArchiveTools.js'),
      import('./contentEngine.js'),
      import('./invoiceQuoteTools.js'),
      import('./deckTools.js'),
      import('./emailBuilderTools.js'),
      import('./flyerPromoTools.js'),
      import('./websiteTools.js'),
      import('./ragPipelineTools.js'),
      import('./countryConfigTools.js'),
      import('./contentLoopTools.js'),
      import('./advisorTools.js'),
      import('./imageGenerationTools.js'),
      import('./pdfGenerationTools.js'),
      import('./voiceBrainDumpTools.js'),
      import('./videoCreationTools.js'),
      import('./browserAgentTools.js'),
      import('./contentCreationTools.js'),
      import('./officeAutomationTools.js'),
      import('./sentimentAnalysisTools.js'),
      import('./smartReplyTools.js'),
      import('./inboxTriageTools.js'),
      import('./customerOnboardingTools.js'),
      import('./orderFulfillmentTools.js'),
      import('./paymentCollectionTools.js'),
      import('./leadQualificationTools.js'),
      import('./directResponseMarketingTools.js'),
      import('./principlesAdvisorTools.js'),
      import('./negotiationAdvisorTools.js'),
      import('./growthMindsetTools.js'),
      import('./leanStartupTools.js'),
      import('./offersDesignerTools.js'),
      import('./funnelArchitectTools.js'),
      import('./strategicPlannerTools.js'),
      import('./powerDynamicsTools.js'),
      import('./relationshipBuilderTools.js'),
      import('./clarificationTools.js'),
      import('./bookkeepingAdvisorTools.js'),
      import('./pricingStrategistTools.js'),
      import('./copyStrategistTools.js'),
      import('./seoContentPlannerTools.js'),
      import('./emailSequenceBuilderTools.js'),
    ]);

    const getterNames = [
      'getAllCrmTools',
      'getAllStorefrontTools',
      'getAllDashboardTools',
      'getAllEmailTools',
      'getAllBraindumpTools',
      'getAllDocScanTools',
      'getAllFactCheckTools',
      'getAllAgentTools',
      'getAllOutboundTools',
      'getAllCalendarTools',
      'getAllArtifactTools',
      'getAllLovableTools',
      'getAllPaymentTools',
      'getAllVoiceTools',
      'getAllMediaUnderstandingTools',
      'getAllMemoryTools',
      'getAllWebTools',
      'getAllSOPTools',
      'getAllBroadcastTools',
      'getAllLlmTools',
      'getAllInventoryTools',
      'getAllN8nTools',
      'getAllToolFactoryTools',
      'getAllMarketingTools',
      'getAllSalesFunnelTools',
      'getAllDripCampaignTools',
      'getAllMailMergeTools',
      'getAllDocumentArchiveTools',
      'getAllContentEngineTools',
      'getAllInvoiceQuoteTools',
      'getAllDeckTools',
      'getAllEmailBuilderTools',
      'getAllFlyerPromoTools',
      'getAllWebsiteTools',
      'getAllRagPipelineTools',
      'getAllCountryConfigTools',
      'getAllContentLoopTools',
      'getAllAdvisorTools',
      'getAllImageGenerationTools',
      'getAllPdfGenerationTools',
      'getAllVoiceBrainDumpTools',
      'getAllVideoCreationTools',
      'getAllBrowserAgentTools',
      'getAllContentCreationTools',
      'getAllOfficeAutomationTools',
      'getAllSentimentAnalysisTools',
      'getAllSmartReplyTools',
      'getAllInboxTriageTools',
      'getAllCustomerOnboardingTools',
      'getAllOrderFulfillmentTools',
      'getAllPaymentCollectionTools',
      'getAllLeadQualificationTools',
      'getAllDirectResponseMarketingTools',
      'getAllPrinciplesAdvisorTools',
      'getAllNegotiationAdvisorTools',
      'getAllGrowthMindsetTools',
      'getAllLeanStartupTools',
      'getAllOffersDesignerTools',
      'getAllFunnelArchitectTools',
      'getAllStrategicPlannerTools',
      'getAllPowerDynamicsTools',
      'getAllRelationshipBuilderTools',
      'getAllClarificationTools',
      'getAllBookkeepingAdvisorTools',
      'getAllPricingStrategistTools',
      'getAllCopyStrategistTools',
      'getAllSeoContentPlannerTools',
      'getAllEmailSequenceBuilderTools',
    ];

    for (let i = 0; i < modules.length; i++) {
      const result = modules[i];
      if (result.status === 'fulfilled') {
        const getAll = (result.value as Record<string, () => ToolSchema[]>)[getterNames[i]];
        if (typeof getAll === 'function') {
          for (const tool of getAll()) {
            this.register(tool);
          }
        }
      } else {
        console.warn(`[registry] Failed to load ${getterNames[i]}: ${result.reason}`);
      }
    }
  }
}
