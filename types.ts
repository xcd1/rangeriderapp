
export type Position = 'UTG' | 'EP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type GameScenario = 'CEv' | 'Bounty CVD' | 'Bounty CVN' | 'Vanilla CVD' | 'Vanilla CVN';
export type SpotType = 'Blind War' | 'Facing 2bet';
export type RangeAction = 'RFI' | 'F2bet';

export interface Scenario {
  id: string;
  spotType: SpotType;
  rangeAction: RangeAction | null;
  raiserPos: Position | null;
  heroPos: Position | null;
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
