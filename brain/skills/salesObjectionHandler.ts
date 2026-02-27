/**
 * Sales Objection Handler skill — Price, timing, trust objection scripts.
 *
 * Based on Chris Voss (Never Split the Difference) applied to sales objections.
 * Provides tactical empathy responses for common objections in LatAm markets.
 * Owner: CRO agent.
 */

import type { LLMClient } from './callTranscription.js';

export interface ObjectionScript {
  objection: string;
  category: 'price' | 'timing' | 'trust' | 'need' | 'competition' | 'authority';
  tacticalResponse: string;
  vossLabel: string;
  mirrorQuestion: string;
  calibratedQuestion: string;
  reframe: string;
}

export interface ObjectionHandlerResult {
  situation: string;
  scripts: ObjectionScript[];
  generalPrinciples: string[];
  vossTechniques: string[];
  closingStrategies: string[];
  practiceScenarios: string[];
  actionSteps: string[];
}

export interface ObjectionOptions {
  product: string;
  price: number;
  currency?: string;
  specificObjection?: string;
  customerType?: string;
  industry?: string;
  language?: string;
}

const OBJECTION_SYSTEM =
  'You are a sales coach using Chris Voss tactical empathy techniques for Latin American businesses. ' +
  'Handle objections with labels, mirrors, calibrated questions, and "no"-oriented questions. ' +
  'Never be aggressive. Use "Parece que..." (labeling), mirroring, and "¿Cómo puedo...?" (calibrated). ' +
  'Teach the founder to handle price, timing, trust, need, and competition objections. ' +
  'Default language: Spanish.';

const OBJECTION_FORMAT =
  'Respond with JSON: { "situation": string, "scripts": [{ "objection": string, ' +
  '"category": "price"|"timing"|"trust"|"need"|"competition"|"authority", ' +
  '"tacticalResponse": string, "vossLabel": string, "mirrorQuestion": string, ' +
  '"calibratedQuestion": string, "reframe": string }], ' +
  '"generalPrinciples": [string], "vossTechniques": [string], "closingStrategies": [string], ' +
  '"practiceScenarios": [string], "actionSteps": [string] }';

export async function handleObjection(options: ObjectionOptions, llmClient?: LLMClient): Promise<ObjectionHandlerResult> {
  if (llmClient) {
    const prompt = `Sales objection handling for: ${options.product} (${options.currency ?? 'USD'} ${options.price})\n` +
      (options.specificObjection ? `Specific objection: "${options.specificObjection}"\n` : '') +
      (options.customerType ? `Customer type: ${options.customerType}\n` : '') +
      (options.industry ? `Industry: ${options.industry}\n` : '') +
      `\n${OBJECTION_FORMAT}`;
    const response = await llmClient.complete({ prompt, system: OBJECTION_SYSTEM, tier: 'haiku' });
    try { return JSON.parse(response.text) as ObjectionHandlerResult; } catch { /* fall through */ }
  }

  const price = options.price;
  const product = options.product;
  return {
    situation: `Vendiendo ${product} a ${options.currency ?? 'USD'} ${price}`,
    scripts: [
      { objection: '"Está muy caro"', category: 'price', tacticalResponse: `Parece que el precio te preocupa. ¿Qué presupuesto tenías en mente? Porque ${product} te ahorra [X] al mes...`, vossLabel: 'Parece que el precio no encaja con lo que esperabas.', mirrorQuestion: '¿Muy caro?', calibratedQuestion: '¿Cómo podríamos hacerlo funcionar con tu presupuesto?', reframe: `No es un gasto, es una inversión. Si ${product} te genera [resultado], se paga solo.` },
      { objection: '"Lo voy a pensar"', category: 'timing', tacticalResponse: 'Claro, tómate tu tiempo. ¿Hay algo que no te quedó claro o que te gustaría saber antes de decidir?', vossLabel: 'Parece que necesitas más información para sentirte seguro.', mirrorQuestion: '¿Pensarlo?', calibratedQuestion: '¿Qué tendría que pasar para que te sintieras cómodo con la decisión?', reframe: 'Entiendo. El riesgo de no actuar es seguir con el mismo problema. ¿Qué te cuesta cada mes que pasa sin [solución]?' },
      { objection: '"No confío / no te conozco"', category: 'trust', tacticalResponse: 'Es lógico. Nadie debería confiar en alguien que no conoce. Te cuento: [testimonio o caso real]...', vossLabel: 'Parece que quieres asegurarte de que es legítimo antes de avanzar.', mirrorQuestion: '¿No confías?', calibratedQuestion: '¿Qué necesitarías ver para sentir confianza?', reframe: 'Puedo darte [garantía/prueba gratis/referencia]. Sin riesgo para ti.' },
      { objection: '"Ya tengo otro proveedor"', category: 'competition', tacticalResponse: '¡Genial! ¿Estás 100% satisfecho con ellos? Porque muchos clientes nos eligen después de probar otros...', vossLabel: 'Parece que ya tienes una solución que funciona.', mirrorQuestion: '¿Otro proveedor?', calibratedQuestion: '¿Qué cambiarías de tu proveedor actual si pudieras?', reframe: 'No te pido que cambies. Solo que compares. Si tu proveedor actual es mejor, no pierdes nada.' },
      { objection: '"No lo necesito"', category: 'need', tacticalResponse: 'Puede que no. ¿Puedo hacerte una pregunta? ¿Cómo manejas [problema que resuelves] actualmente?', vossLabel: 'Parece que todo funciona bien como está.', mirrorQuestion: '¿No lo necesitas?', calibratedQuestion: '¿Cómo te afectaría si [problema] empeora?', reframe: 'Muchos de nuestros mejores clientes dijeron lo mismo. Hasta que probaron y vieron [resultado].' },
    ],
    generalPrinciples: [
      'Nunca discutas — etiqueta la emoción primero',
      'Deja que el cliente diga "no" — se siente en control',
      'Usa silencios de 3 segundos después de cada respuesta',
      'Repite las últimas 2-3 palabras (mirroring) para que sigan hablando',
      'El objetivo no es ganar — es entender qué necesitan',
    ],
    vossTechniques: [
      'Labeling: "Parece que..." — valida la emoción',
      'Mirroring: Repite sus últimas palabras como pregunta',
      'Calibrated Questions: "¿Cómo...?" "¿Qué...?" — sin "por qué"',
      'Accusation Audit: Anticipa objeciones antes de que las digan',
      'Late-night FM DJ voice: Tono calmado, pausado, seguro',
    ],
    closingStrategies: [
      'Cierre por resumen: Repite todo lo que dijeron que les gustó',
      'Cierre por escasez real: "Solo quedan [X] cupos/unidades"',
      'Cierre por facilidad: "Solo necesitas [1 paso simple]"',
      'Cierre por garantía: "Si no funciona, te devuelvo tu dinero"',
    ],
    practiceScenarios: [
      `Un cliente dice "${options.specificObjection || 'Está muy caro'}" — practica labeling + calibrated question`,
      'Un prospecto te deja en visto por 3 días — escribe tu follow-up',
      'Un cliente compara tu precio con un competidor más barato — reframe',
    ],
    actionSteps: [
      'Escribe las 5 objeciones más comunes que recibes',
      'Prepara un script de labeling para cada una',
      'Practica mirroring en tu próxima conversación de ventas',
      'Graba tus llamadas de ventas y escúchalas',
    ],
  };
}
