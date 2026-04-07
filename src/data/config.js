/**
 * Tuning constants — Operations Highway MVP
 */
export const CONFIG = {
  // Lanes: world X positions (center = 0)
  LANES: [-3.2, 0, 3.2],
  LANE_INDEX: { LEFT: 0, CENTER: 1, RIGHT: 2 },

  // Movement
  BASE_SPEED: 14,
  /** Units per second²-ish scaling for forward speed over time */
  SPEED_RAMP: 0.08,
  /** Max multiplier on base speed from ramp + boosts */
  MAX_SPEED_MULT: 2.4,
  LANE_LERP: 8,

  // Player hitbox (forgiving, slightly smaller than mesh)
  PLAYER_HALF_WIDTH: 0.55,
  PLAYER_HALF_DEPTH: 0.9,
  PLAYER_Y: 0.6,

  // Spawning (Z is forward; obstacles start negative, move +Z)
  SPAWN_Z: -95,
  DESPAWN_Z: 12,
  /** Minimum gap along Z between obstacle rows */
  MIN_OBSTACLE_GAP: 9,
  /** Base interval (seconds) — lowered after warmup */
  OBSTACLE_SPAWN_BASE: 2.1,
  OBSTACLE_SPAWN_MIN: 0.85,
  PICKUP_SPAWN_BASE: 2.8,
  PICKUP_SPAWN_MIN: 1.35,
  /** First ~25s: easier spawns */
  WARMUP_SECONDS: 28,

  // Difficulty
  SPAWN_ACCEL: 0.012,
  /** Chance to block all 3 lanes in one row (kept low) */
  FULL_WALL_CHANCE: 0.06,

  // Stability
  STARTING_STABILITY: 100,
  DAMAGE: {
    CONFIG_DRIFT: 20,
    PATCH_FAILURE: 25,
    TICKET_FLOOD: 15,
    ALERT_STORM: 18,
    MANUAL_TOIL: 12,
  },
  REMEDIATION_WRONG_PENALTY: 5,
  REMEDIATION_RESTORE: 10,

  // Scoring (per second / tick feel)
  SCORE_PER_SECOND: 12,
  SCORE_PER_UNIT_DISTANCE: 0.35,
  PICKUP_SCORE: {
    PLAYBOOK: 100,
    COLLECTION: 150,
  },
  BOOST_QUIZ_CORRECT: 250,
  BOOST_QUIZ_WRONG: 25,
  REMEDIATION_CORRECT_STREAK: 1,

  // Boost token quiz
  BOOST_SLOW_SCALE: 0.35,
  BOOST_DURATION: 5,
  /** Speed multiplier during boost */
  BOOST_SPEED_MULT: 1.55,

  // Crash recovery quiz
  RECOVERY_SLOW_SCALE: 0.2,

  // Automation Flow (streak of 3 correct)
  STREAK_FOR_FLOW: 3,
  FLOW_DURATION: 8,
  FLOW_SCORE_MULT: 1.2,
  /** Pickup pull strength toward player X */
  FLOW_MAGNET: 2.8,

  // UI
  STATUS_MESSAGE_MS: 2200,
  QUIZ_EXPLANATION_MS: 1000,
};

export const OBSTACLE_TYPES = [
  "CONFIG_DRIFT",
  "PATCH_FAILURE",
  "TICKET_FLOOD",
  "ALERT_STORM",
  "MANUAL_TOIL",
];

export const PICKUP_TYPES = [
  "PLAYBOOK",
  "CERTIFIED_COLLECTION",
  "POLICY_SHIELD",
  "BOOST_TOKEN",
];
