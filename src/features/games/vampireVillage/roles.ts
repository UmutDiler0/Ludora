/**
 * Vampire Village roles.
 *
 * Decision D4 (docs/ARCHITECTURE.md §21): internal ids are spec archetypes,
 * player-facing names come from the Stitch designs. Renaming a role later is
 * a change to `name` here and nothing else — no component or state key moves.
 */

export type RoleId = 'vampire' | 'investigator' | 'protector' | 'villager';
export type Alignment = 'village' | 'vampires';
export type NightAbility = 'kill' | 'investigate' | 'protect' | null;

export interface RoleDef {
  id: RoleId;
  /** Player-facing name, from the designs. */
  name: string;
  alignment: Alignment;
  night: NightAbility;
  /** Copy shown on the Role Reveal screen. */
  blurb: string;
  isPremium: boolean;
}

export const ROLES: Record<RoleId, RoleDef> = {
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    alignment: 'vampires',
    night: 'kill',
    blurb:
      'Each night, you and your coven choose one villager to drain. By day, blend in — a careless word will see you exiled.',
    isPremium: false,
  },
  investigator: {
    id: 'investigator',
    name: 'Seer',
    alignment: 'village',
    night: 'investigate',
    blurb:
      'Each night, you can look into the soul of one player to reveal their true alignment. Guide the village with your visions, but stay hidden — the vampires are hunting for the truth.',
    isPremium: false,
  },
  protector: {
    id: 'protector',
    name: 'Bodyguard',
    alignment: 'village',
    night: 'protect',
    blurb:
      'Each night, you stand watch over one player. If the vampires come for them, they survive until dawn.',
    isPremium: false,
  },
  villager: {
    id: 'villager',
    name: 'Villager',
    alignment: 'village',
    night: null,
    blurb:
      'You have no special powers — only your judgement. Listen closely, argue well, and vote to exile the vampires before they take the village.',
    isPremium: false,
  },
};

/**
 * Turn order for the night. Presentation only — all night actions are
 * collected and resolved simultaneously at the end of the night, so
 * protection correctly cancels a kill regardless of who acted first.
 */
export const NIGHT_TURN_ORDER: readonly RoleId[] = ['vampire', 'investigator', 'protector'];

export const isNightActor = (role: RoleId): boolean => ROLES[role].night !== null;
