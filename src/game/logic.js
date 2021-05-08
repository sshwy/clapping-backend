const { Move } = require('../vars');
const Player = require('./player');

/**
 * @param {{move: number, target: string}} move
 */
const isThorns = move =>
  (mv => mv === Move.THORNS_I || mv === Move.THORNS_II || mv === Move.THORNS_III)(move.move);

const eps = 0.01;

/**
 * Calculate effect from player A to player B
 * 
 * @param {Player} pA
 * @param {{move: number, target: string}} moveA
 * @param {Player} pB
 * @param {{move: number, target: string}} moveB
 * @return {number} 
 */
const calcEffect = (pA, moveA, pB, moveB) => {
  switch (moveA.move) { // AOE
    case Move.SWEEP_I:
      return 1 - eps;
    case Move.SWEEP_II:
      return 2 - eps;
    case Move.SWEEP_III:
      return 3 - eps;
    case Move.LIGHTNING_STORM:
      if (moveB.move == Move.LIGHTNING_ARRESTER) return 0;
      else return 4 - eps;
  }
  if (moveA.target === pB.getId()) { // Attack
    switch (moveA.move) {
      case Move.SHOOT:
        return 1;
      case Move.SLASH:
        return 2;
      case Move.LIGHTNING_STRIKE:
        if (moveB.move == Move.LIGHTNING_ARRESTER) return 0;
        else return 3;
      case Move.EARTHQUAKE:
        return 4;
    }
  }
  if (isThorns(moveA) && !isThorns(moveB)) { // Thorns
    const atk = calcEffect(pB, moveB, pA, moveA);
    switch (moveA.move) {
      case Move.THORNS_I:
        if (atk <= 1) return atk * 2;
        else return 0;
      case Move.THORNS_II:
        if (atk <= 2) return atk * 2;
        else return 0;
      case Move.THORNS_III:
        if (atk <= 3) return atk * 2;
        else return 0;
    }
  }
  return 0;
};

module.exports = {
  calcEffect,
  eps,
}