
import { Position, GameScenario, SpotType, RangeAction, BlindWarAction, BlindWarPosition } from './types';

export const POSITIONS: Position[] = ['UTG', 'EP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const GAME_SCENARIOS: GameScenario[] = ['CEv', 'Bounty CVD', 'Bounty CVN', 'Vanilla CVD', 'Vanilla CVN'];
export const SPOT_TYPES: SpotType[] = ['Blind War', 'Facing 2bet'];
export const RANGE_ACTIONS: RangeAction[] = ['RFI', 'F2bet'];
export const BLIND_WAR_ACTIONS: BlindWarAction[] = ['vs. Limp', 'vs. raise', 'vs. ISO', 'vs. 3bet'];
export const BLIND_WAR_POSITIONS: BlindWarPosition[] = ['SB', 'BB'];


export const POSITION_ORDER: Record<Position, number> = {
    UTG: 0,
    EP: 1,
    LJ: 2,
    HJ: 3,
    CO: 4,
    BTN: 5,
    SB: 6,
    BB: 7
};