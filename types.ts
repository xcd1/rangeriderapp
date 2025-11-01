

export type Position = 'UTG' | 'EP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type GameScenario = 'CEv' | 'Bounty CVD' | 'Bounty CVN' | 'Vanilla CVD' | 'Vanilla CVN' | 'Turbo' | 'Hyper' | 'Mistery' | 'KO' | 'NON KO' | 'ALL' | 'Ideal Frequencies';
export type SpotType = 'Blind War' | 'Facing 2bet' | 'HRC Enviroment' | 'Rfi' | 'Stats Analysis';
export type RangeAction = 'RFI' | 'F2bet' | 'F3bet' | 'F4bet' | 'F5bet' | 'FCC' | 'FSQZ';
export type BlindWarAction = 'vs. Limp' | 'vs. raise' | 'em Gap' | 'vs. ISO' | 'vs. 3bet';
export type BlindWarPosition = 'SB' | 'BB';

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Scenario {
  id: string;
  spotType: SpotType;
  manualTitle?: string | null;

  // Facing 2bet & HRC Enviroment specific
  rangeAction: RangeAction | null;
  raiserPos: Position | null;
  heroPos: Position | null;

  // Blind War specific
  blindWarPosition: BlindWarPosition | null;
  blindWarAction: BlindWarAction | null;

  // HRC Enviroment specific
  coldCallerPos: Position | null;
  aggressorPos: Position | null; // For 3bettor, 4bettor, etc.
  printSpotImage: string | null; // For HRC "Print Spot" image
  rpImage: string | null; // For HRC "RP" image
  tableViewImage: string | null;
  plusInfoImage: string | null;
  evImage: string | null;

  gameScenario: GameScenario | null;
  rpMode?: boolean;
  startingBounties?: number | null;
  startingStacks?: number | null;
  rangeImage: string | null; // base64 string
  frequenciesImage: string | null; // base64 string
  raiseSmallText: string;
  raiseBigText: string;
  callText: string;
  notes: string;
  createdAt: number;
  showFrequenciesInCompare?: boolean;
  showEvInCompare?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
}

export interface Notebook {
  id: string;
  name: string;
  scenarios: Scenario[];
  folderId?: string | null;
  createdAt: number;
  notes?: string;
  defaultSpot?: SpotType | 'notes' | 'performance' | null;
}

export interface ScenarioTemplate {
  name: string;
  spotType: SpotType;
  rangeAction: RangeAction | null;
  raiserPos?: Position | null;
  heroPos?: Position | null;
  blindWarPosition?: BlindWarPosition | null;
  blindWarAction?: BlindWarAction | null;
}