

import { Position, GameScenario, SpotType, RangeAction, BlindWarAction, BlindWarPosition, ScenarioTemplate } from './types';

export const POSITIONS: Position[] = ['UTG', 'EP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const GAME_SCENARIOS: GameScenario[] = ['CEv', 'Bounty CVD', 'Bounty CVN', 'Vanilla CVD', 'Vanilla CVN', 'Turbo', 'Hyper', 'Mistery', 'KO', 'NON KO', 'ALL', 'Ideal Frequencies'];
export const SPOT_TYPES: SpotType[] = ['Rfi', 'Facing 2bet', 'Blind War', 'HRC Enviroment', 'Stats Analysis'];
export const RANGE_ACTIONS: RangeAction[] = ['RFI', 'F2bet', 'F3bet', 'F4bet', 'F5bet', 'FCC', 'FSQZ'];
export const FACING_2BET_ACTIONS: RangeAction[] = ['RFI', 'F2bet'];
export const HRC_ACTIONS: RangeAction[] = ['RFI', 'F2bet', 'F3bet', 'F4bet', 'F5bet', 'FCC', 'FSQZ'];
export const BLIND_WAR_ACTIONS: BlindWarAction[] = ['vs. Limp', 'vs. raise', 'em Gap', 'vs. ISO', 'vs. 3bet'];
export const BLIND_WAR_POSITIONS: BlindWarPosition[] = ['SB', 'BB'];
export const STATS_ANALYSIS_SCENARIOS: GameScenario[] = ['KO', 'NON KO', 'ALL', 'Ideal Frequencies'];


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

export const JARGON_DEFINITIONS: Record<string, string> = {
    'Rfi': 'Raise First In: Quando você é o primeiro jogador a voluntariamente aumentar a aposta antes do flop.',
    'Facing 2bet': 'Enfrentando um Aumento: Como responder quando outro jogador já fez um "raise" (2-bet).',
    'Blind War': 'Guerra de Blinds: Ações que ocorrem quando apenas os jogadores nas posições de Small Blind e Big Blind estão na mão.',
    'HRC Enviroment': 'GTO Mastered: Cenários complexos, geralmente envolvendo múltiplos jogadores, para dominar a estratégia \'Game Theory Optimal\' (GTO).',
    'Stats Analysis': 'Análise de Stats: Um ambiente para importar e analisar seus dados de jogo, como gráficos de resultados, estatísticas de trackers, e outras informações de performance.',
    'Action/Response': 'Define a ação principal do cenário (ex: RFI) ou a resposta a uma ação anterior (ex: F2bet).',
    'First Raiser Position': 'A posição do jogador que fez o primeiro aumento na mão.',
    'Hero Position': 'Sua posição na mesa para este cenário.',
    '3bettor Position': 'A posição do jogador que fez o "re-raise" (3-bet) após o aumento inicial.',
    'Cold Caller Position': 'A posição de um jogador que paga o aumento inicial ("cold call").',
    'Aggressor Position': 'A posição do último agressor na mão, como o jogador que fez um 3-bet, 4-bet, etc.',
    'Modalidade': 'O tipo de jogo ou torneio, que afeta a estratégia. Ex: CEv (Chip EV), Bounty (com recompensas), etc.',
    'RP Mode': 'Rejam/Push Mode: Ativa cálculos específicos para situações de all-in (push) e re-shove (rejam) em torneios Bounty, calculando a "Drop Equity".',
};

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
    { name: "UTG RFI", spotType: 'Rfi', rangeAction: 'RFI', raiserPos: 'UTG' },
    { name: "BTN RFI", spotType: 'Rfi', rangeAction: 'RFI', raiserPos: 'BTN' },
    { name: "BB vs UTG F2bet", spotType: 'Facing 2bet', rangeAction: 'F2bet', raiserPos: 'UTG', heroPos: 'BB' },
    { name: "BB vs BTN F2bet", spotType: 'Facing 2bet', rangeAction: 'F2bet', raiserPos: 'BTN', heroPos: 'BB' },
    { name: "SB vs BB (vs. Limp)", spotType: 'Blind War', rangeAction: null, blindWarPosition: 'BB', blindWarAction: 'vs. Limp' },
    { name: "SB vs BB (vs. Raise)", spotType: 'Blind War', rangeAction: null, blindWarPosition: 'BB', blindWarAction: 'vs. raise' },
    { name: "HRC: F3bet BB vs BTN", spotType: 'HRC Enviroment', rangeAction: 'F3bet', raiserPos: 'BTN', heroPos: 'BB' },
];