/** Canonical port map for all Kitz services (mirrors docker-compose.yml). */

export const PORTS = {
  gateway: 4000,
  llmHub: 4010,
  payments: 3005,
  whatsappConnector: 3006,
  emailConnector: 3007,
  notificationsQueue: 3008,
  services: 3010,
  adminServices: 3011,
  kitzOs: 3012,
  commsApi: 3013,
  logsApi: 3014,
  workspace: 3001,
} as const;

export type ServiceName = keyof typeof PORTS;

/** Build a base URL for a service (defaults to localhost). */
export function serviceUrl(name: ServiceName, host = 'localhost'): string {
  return `http://${host}:${PORTS[name]}`;
}
