
export type Position = 'UTG' | 'EP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type GameScenario = 'CEv' | 'Bounty CVD' | 'Bounty CVN' | 'Vanilla CVD' | 'Vanilla CVN';
export type SpotType = 'Blind War' | 'Facing 2bet';
export type RangeAction = 'RFI' | 'F2bet';
export type BlindWarAction = 'vs. Limp' | 'vs. raise' | 'vs. ISO' | 'vs. 3bet';
export type BlindWarPosition = 'SB' | 'BB';

export interface Scenario {
  id: string;
  spotType: SpotType;

  // Facing 2bet specific
  rangeAction: RangeAction | null;
  raiserPos: Position | null;
  heroPos: Position | null;

  // Blind War specific
  blindWarPosition: BlindWarPosition | null;
  blindWarAction: BlindWarAction | null;

  gameScenario: GameScenario | null;
  rangeImage: string | null; // base64 string
  frequenciesImage: string | null; // base64 string
  raiseSmallText: string;
  raiseBigText: string;
  callText: string;
  notes: string;
}

export interface Notebook {
  id: string;
  name: string;
  scenarios: Scenario[];
}