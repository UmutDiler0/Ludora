import type { ConnectivityProbe } from './types';

/**
 * Reachability by HTTP.
 *
 * ⚠️ This answers "does this device have working internet", which is a
 * *proxy* for the real question, "can we reach Ludora's backend". They differ:
 * a captive portal, or our own server being down, both look connected here.
 * That gap closes when §18's transport lands and this is replaced by RTDB's
 * `.info/connected`, which is the authoritative answer.
 *
 * The endpoint is a 204-no-content probe, so a success costs no payload.
 */
const HEALTH_URL = 'https://clients3.google.com/generate_204';

export const httpProbe: ConnectivityProbe = {
  async reach(timeoutMs) {
    // `AbortController` rather than Promise.race: racing leaves the request
    // running in the background, and a pile of those is how a flapping
    // connection turns into a battery complaint.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      // 204 is the expected answer; any 2xx still proves we reached a server.
      return response.status === 204 || response.ok;
    } catch {
      // Includes the abort, DNS failure, and offline radio. All are outages.
      return false;
    } finally {
      clearTimeout(timer);
    }
  },
};
