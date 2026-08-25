/**
 * Network boundary (docs/ARCHITECTURE.md §3 — infrastructure layer, §14).
 *
 * The stores and UI talk only to these interfaces, exactly as they do for auth.
 * Today a plain HTTP probe stands in for reachability and a mock stands in for
 * room presence; when the RealtimeTransport lands (§18) both are replaced by
 * RTDB — `.info/connected` for the probe, `onDisconnect()` for presence — and
 * no screen changes.
 */

export interface ConnectivityProbe {
  /**
   * Resolves true when the backend is reachable.
   *
   * Must settle within `timeoutMs` and must never reject: a probe that throws
   * is indistinguishable from an outage to every caller, so it reports one.
   */
  reach(timeoutMs: number): Promise<boolean>;
}

export type PeerEventKind = 'lost' | 'returned' | 'left';

/** Something that happened to somebody else in the room. */
export interface PeerPresenceEvent {
  uid: string;
  displayName: string;
  kind: PeerEventKind;
  at: number;
}

export interface PresenceGateway {
  /** Room-wide presence changes for everyone except us. Returns an unsubscribe. */
  subscribe(onEvent: (event: PeerPresenceEvent) => void): () => void;
  /**
   * Announce our own state. Real implementations pair this with RTDB's
   * `onDisconnect()`, which is the only reliable way to publish "gone" from a
   * client that has already gone.
   */
  publish(online: boolean): void;
}

/**
 * Copy for each peer event used to live here as English literals; it moved to
 * `i18n/en(or tr)/connection.ts`'s `peerEvent` map once `PeerAlert.tsx` needed
 * to follow the app's language — this file stays pure data shapes only.
 */
