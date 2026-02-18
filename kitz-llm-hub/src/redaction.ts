export const redact=(input:string)=>input.replace(/(sk-[a-zA-Z0-9]+)/g,'[REDACTED_KEY]').replace(/\b\d{12,16}\b/g,'[REDACTED_PII]');
