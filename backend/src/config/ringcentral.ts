import { SDK } from '@ringcentral/sdk';
import { env } from './env';

/** RingCentral SDK instance for OAuth and API calls. */
export function getRingCentralSDK() {
  if (!env.ringcentralClientId || !env.ringcentralClientSecret || !env.ringcentralCallbackUrl) {
    throw new Error('RingCentral OAuth is not configured. Set RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_CALLBACK_URL.');
  }
  const server = env.ringcentralServer.includes('devtest') ? SDK.server.sandbox : SDK.server.production;
  return new SDK({
    server,
    clientId: env.ringcentralClientId,
    clientSecret: env.ringcentralClientSecret,
    redirectUri: env.ringcentralCallbackUrl,
  });
}

export function isRingCentralConfigured(): boolean {
  return !!(env.ringcentralClientId && env.ringcentralClientSecret && env.ringcentralCallbackUrl);
}
