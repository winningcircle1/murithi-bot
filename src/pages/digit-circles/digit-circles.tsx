// @ts-nocheck — matches conventions of vendored bot code; see AGENTS.md
import React from 'react';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { api_base } from '@/external/bot-skeleton';
import { Localize } from '@deriv-com/translations';
import './digit-circles.scss';

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

// How many of the most recent ticks to keep visible -- older ones drop off
// the front as new ones stream in, like a sliding window.
const CIRCLE_COUNT = 40;

type TColorMode = 'odd_even' | 'over_under';

type TDigitEntry = {
    digit: number;
    id: number;
};

const DigitCircles = observer(() => {
    const [symbol, setSymbol] = React.useState(SYMBOLS[4].value);
    const [barrier, setBarrier] = React.useState(5);
    const [color_mode, setColorMode] = React.useState<TColorMode>('odd_even');
    const [digits, setDigits] = React.useState<TDigitEntry[]>([]);
    const pip_size_ref = React.useRef(2);
    const next_id_ref = React.useRef(0);
    const stream_ref = React.useRef<HTMLDivElement | null>(null);

    const extractDigit = React.useCallback((quote: number) => {
        const formatted = Number(quote).toFixed(pip_size_ref.current);
        return Number(formatted.charAt(formatted.length - 1));
    }, []);

    const pushDigit = React.useCallback((digit: number) => {
        setDigits(prev => {
            const next = [...prev, { digit, id: next_id_ref.current++ }];
            return next.length > CIRCLE_COUNT ? next.slice(next.length - CIRCLE_COUNT) : next;
        });
    }, []);

    // Subscribe to live ticks for the selected symbol, seeded with recent
    // history so the stream isn't empty on first load. Re-runs whenever the
    // symbol changes, cleanly tearing down the previous subscription first.
    React.useEffect(() => {
        if (!api_base?.api) return undefined;

        let is_cancelled = false;
        setDigits([]);

        const subscription = api_base.api.onMessage().subscribe(({ data }) => {
            if (is_cancelled) return;
            if (data.msg_type === 'tick' && data.tick?.symbol === symbol) {
                pushDigit(extractDigit(data.tick.quote));
            }
        });

        api_base.api
            .send({
                ticks_history: symbol,
                end: 'latest',
                count: CIRCLE_COUNT,
                style: 'ticks',
                subscribe: 1,
            })
            .then(response => {
                if (is_cancelled) return;
                const pip_size = typeof response?.pip_size === 'number' ? response.pip_size : 2;
                pip_size_ref.current = pip_size;
                const prices: number[] = response?.history?.prices || [];
                const seeded = prices.map(price => ({
                    digit: extractDigit(price),
                    id: next_id_ref.current++,
                }));
                setDigits(seeded.slice(-CIRCLE_COUNT));
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error('[DigitCircles] Failed to start tick subscription:', error);
            });

        return () => {
            is_cancelled = true;
            subscription.unsubscribe();
            api_base.api.forgetAll('ticks').catch(() => {});
        };
        // extractDigit/pushDigit are stable (useCallback with empty/stable deps)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    // Keep the stream scrolled to the newest circle as they arrive.
    React.useEffect(() => {
        if (stream_ref.current) {
            stream_ref.current.scrollLeft = stream_ref.current.scrollWidth;
        }
    }, [digits]);

    const getCircleClass = (digit: number) => {
        if (color_mode === 'odd_even') {
            return digit % 2 === 0 ? 'digit-circles__circle--even' : 'digit-circles__circle--odd';
        }
        if (digit > barrier) return 'digit-circles__circle--over';
        if (digit < barrier) return 'digit-circles__circle--under';
        return 'digit-circles__circle--equal';
    };

    return (
        <div className='digit-circles'>
            <div className='digit-circles__header'>
                <Text as='h2' size='s' weight='bold' className='digit-circles__title'>
                    <Localize i18n_default_text='Digit Circles' />
                </Text>
                <Text as='p' size='xs' color='less-prominent' className='digit-circles__description'>
                    <Localize
                        i18n_default_text='Live last-digit stream, most recent {{count}} ticks'
                        values={{ count: CIRCLE_COUNT }}
                    />
                </Text>
            </div>

            <div className='digit-circles__controls'>
                <select
                    className='digit-circles__select'
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                >
                    {SYMBOLS.map(s => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>

                <div className='digit-circles__mode-toggle'>
                    <button
                        type='button'
                        className={`digit-circles__mode-button ${
                            color_mode === 'odd_even' ? 'digit-circles__mode-button--active' : ''
                        }`}
                        onClick={() => setColorMode('odd_even')}
                    >
                        <Localize i18n_default_text='Odd / Even' />
                    </button>
                    <button
                        type='button'
                        className={`digit-circles__mode-button ${
                            color_mode === 'over_under' ? 'digit-circles__mode-button--active' : ''
                        }`}
                        onClick={() => setColorMode('over_under')}
                    >
                        <Localize i18n_default_text='Over / Under' />
                    </button>
                </div>

                {color_mode === 'over_under' && (
                    <select
                        className='digit-circles__select'
                        value={barrier}
                        onChange={e => setBarrier(Number(e.target.value))}
                    >
                        {Array.from({ length: 10 }, (_, i) => i).map(d => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className='digit-circles__stream' ref={stream_ref}>
                {digits.length === 0 && (
                    <Text size='xs' color='less-prominent' className='digit-circles__waiting'>
                        <Localize i18n_default_text='Waiting for ticks...' />
                    </Text>
                )}
                {digits.map((entry, index) => (
                    <div
                        key={entry.id}
                        className={`digit-circles__circle ${getCircleClass(entry.digit)} ${
                            index === digits.length - 1 ? 'digit-circles__circle--latest' : ''
                        }`}
                    >
                        {entry.digit}
                    </div>
                ))}
            </div>
        </div>
    );
});

export default DigitCircles;
