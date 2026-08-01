// @ts-nocheck — matches conventions of vendored bot code; see AGENTS.md
import React from 'react';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { api_base } from '@/external/bot-skeleton';
import { Localize } from '@deriv-com/translations';
import './analysis-tool.scss';

const SYMBOLS = [
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
];

const TICK_COUNT = 1000;
const REFRESH_INTERVAL_MS = 10000;

type TDigitStats = {
    counts: number[];
    percentages: number[];
    even_pct: number;
    odd_pct: number;
    total: number;
};

const getEmptyStats = (): TDigitStats => ({
    counts: new Array(10).fill(0),
    percentages: new Array(10).fill(0),
    even_pct: 0,
    odd_pct: 0,
    total: 0,
});

const AnalysisTool = observer(() => {
    const [symbol, setSymbol] = React.useState(SYMBOLS[4].value);
    const [barrier, setBarrier] = React.useState(5);
    const [stats, setStats] = React.useState<TDigitStats>(getEmptyStats());
    const [is_loading, setIsLoading] = React.useState(false);
    const [last_updated, setLastUpdated] = React.useState<Date | null>(null);

    const fetchStats = React.useCallback(async () => {
        if (!api_base?.api) return;
        setIsLoading(true);
        try {
            const response = await api_base.api.send({
                ticks_history: symbol,
                end: 'latest',
                count: TICK_COUNT,
                style: 'ticks',
            });

            const prices: number[] = response?.history?.prices || [];
            const pip_size: number = typeof response?.pip_size === 'number' ? response.pip_size : 2;

            const counts = new Array(10).fill(0);
            let even_count = 0;
            let odd_count = 0;

            prices.forEach(price => {
                const formatted = Number(price).toFixed(pip_size);
                const last_char = formatted.charAt(formatted.length - 1);
                const digit = Number(last_char);
                if (!Number.isNaN(digit)) {
                    counts[digit] += 1;
                    if (digit % 2 === 0) even_count += 1;
                    else odd_count += 1;
                }
            });

            const total = prices.length;
            const percentages = counts.map(c => (total > 0 ? (c / total) * 100 : 0));

            setStats({
                counts,
                percentages,
                even_pct: total > 0 ? (even_count / total) * 100 : 0,
                odd_pct: total > 0 ? (odd_count / total) * 100 : 0,
                total,
            });
            setLastUpdated(new Date());
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[AnalysisTool] Failed to fetch tick stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, [symbol]);

    React.useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const over_pct = stats.percentages
        .filter((_, digit) => digit > barrier)
        .reduce((sum, pct) => sum + pct, 0);
    const under_pct = stats.percentages
        .filter((_, digit) => digit < barrier)
        .reduce((sum, pct) => sum + pct, 0);

    const max_pct = Math.max(...stats.percentages, 1);

    return (
        <div className='analysis-tool'>
            <div className='analysis-tool__header'>
                <Text size='s' weight='bold'>
                    <Localize i18n_default_text='Analysis Tool' />
                </Text>
                <Text size='xs' color='less-prominent'>
                    <Localize
                        i18n_default_text='Last digit stats over the most recent {{count}} ticks'
                        values={{ count: stats.total || TICK_COUNT }}
                    />
                </Text>
            </div>

            <div className='analysis-tool__controls'>
                <select
                    className='analysis-tool__symbol-select'
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                >
                    {SYMBOLS.map(s => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <select
                    className='analysis-tool__barrier-select'
                    value={barrier}
                    onChange={e => setBarrier(Number(e.target.value))}
                >
                    {Array.from({ length: 10 }, (_, i) => i).map(d => (
                        <option key={d} value={d}>
                            {d}
                        </option>
                    ))}
                </select>
                {is_loading && (
                    <Text size='xxs' color='less-prominent'>
                        <Localize i18n_default_text='Updating...' />
                    </Text>
                )}
            </div>

            <div className='analysis-tool__digits'>
                {stats.percentages.map((pct, digit) => (
                    <div key={digit} className='analysis-tool__digit-column'>
                        <div className='analysis-tool__digit-bar-track'>
                            <div
                                className='analysis-tool__digit-bar'
                                style={{ height: `${(pct / max_pct) * 100}%` }}
                            />
                        </div>
                        <Text size='xxs' className='analysis-tool__digit-pct'>
                            {pct.toFixed(1)}%
                        </Text>
                        <Text size='xs' weight='bold' className='analysis-tool__digit-label'>
                            {digit}
                        </Text>
                    </div>
                ))}
            </div>

            <div className='analysis-tool__summary'>
                <div className='analysis-tool__summary-item'>
                    <Text size='xs' color='less-prominent'>
                        <Localize i18n_default_text='Even' />
                    </Text>
                    <Text size='s' weight='bold'>
                        {stats.even_pct.toFixed(1)}%
                    </Text>
                </div>
                <div className='analysis-tool__summary-item'>
                    <Text size='xs' color='less-prominent'>
                        <Localize i18n_default_text='Odd' />
                    </Text>
                    <Text size='s' weight='bold'>
                        {stats.odd_pct.toFixed(1)}%
                    </Text>
                </div>
                <div className='analysis-tool__summary-item'>
                    <Text size='xs' color='less-prominent'>
                        <Localize i18n_default_text='Over {{barrier}}' values={{ barrier }} />
                    </Text>
                    <Text size='s' weight='bold'>
                        {over_pct.toFixed(1)}%
                    </Text>
                </div>
                <div className='analysis-tool__summary-item'>
                    <Text size='xs' color='less-prominent'>
                        <Localize i18n_default_text='Under {{barrier}}' values={{ barrier }} />
                    </Text>
                    <Text size='s' weight='bold'>
                        {under_pct.toFixed(1)}%
                    </Text>
                </div>
            </div>

            {last_updated && (
                <Text size='xxs' color='less-prominent' className='analysis-tool__updated'>
                    <Localize
                        i18n_default_text='Last updated {{time}}'
                        values={{ time: last_updated.toLocaleTimeString() }}
                    />
                </Text>
            )}
        </div>
    );
});

export default AnalysisTool;
