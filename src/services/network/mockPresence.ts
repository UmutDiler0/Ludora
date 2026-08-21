import type { PeerPresenceEvent, PresenceGateway } from './types';

/**
 * Stand-in for room presence until the realtime transport lands (§18).
 *
 * It carries no traffic of its own — there is no server to hear from — so on a
 * real device it stays silent rather than inventing outages nobody had. What it
 * does provide is the exact surface RTDB will: a subscription that fans events
 * out to every listener, and a `publish` that the store already calls at the
 * right moments.
 *
 * `emit` is the seam. Tests drive it directly, and a dev-only affordance in the
 * game header uses it so the peer pop-up can be seen working before there is
 * anyone else to disconnect.
 */
export function createMockPresence(): PresenceGateway & {
  emit(event: PeerPresenceEvent): void;
  /** What we last told the room about ourselves. Asserted in tests. */
  readonly published: boolean | null;
} {
  const listeners = new Set<(event: PeerPresenceEvent) => void>();
  let published: boolean | null = null;

  return {
    subscribe(onEvent) {
      listeners.add(onEvent);
      return () => {
        listeners.delete(onEvent);
      };
    },

    publish(online) {
      published = online;
    },

    emit(event) {
      // Copied before iterating: a listener that unsubscribes on its first
      // event would otherwise mutate the set mid-loop.
      for (const listener of [...listeners]) listener(event);
    },

    get published() {
      return published;
    },
  };
}

/** The app-wide instance. Swapped for the RTDB gateway in one place, later. */
export const presenceGateway = createMockPresence();
