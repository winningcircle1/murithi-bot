type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
    FREE_BOTS: 4,
    MANUAL_TRADING: 5,
    ANALYSIS_TOOL: 6,
    COPY_TRADING: 7,
    DIGIT_CIRCLES: 8,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-tutorials',
    'id-free-bots',
    'id-manual-trading',
    'id-analysis-tool',
    'id-copy-trading',
    'id-digit-circles',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
