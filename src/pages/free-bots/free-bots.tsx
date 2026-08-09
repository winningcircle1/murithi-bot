// @ts-nocheck — matches conventions of vendored bot code; see AGENTS.md
import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@/components/shared_ui/button/button';
import Text from '@/components/shared_ui/text';
import { save_types } from '@/external/bot-skeleton/constants/save-type';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import {
    TradeTypesAccumulatorBreakOutIcon,
    TradeTypesDigitsDiffersIcon,
    TradeTypesDigitsEvenIcon,
    TradeTypesDigitsMatchesIcon,
    TradeTypesDigitsOddIcon,
    TradeTypesDigitsOverIcon,
    TradeTypesDigitsUnderIcon,
    TradeTypesHighsAndLowsHigherIcon,
    TradeTypesHighsAndLowsLowerIcon,
    TradeTypesMultipliersDownIcon,
    TradeTypesMultipliersUpIcon,
    TradeTypesTurboLongIcon,
    TradeTypesTurboShortIcon,
    TradeTypesUpsAndDownsFallIcon,
    TradeTypesUpsAndDownsRiseIcon,
} from '@deriv/quill-icons/TradeTypes';
import { StandaloneSearchRegularIcon } from '@deriv/quill-icons/Standalone';
import { Localize, localize } from '@deriv-com/translations';
import { FREE_BOTS } from './bots-manifest';
import './free-bots.scss';

// A varied set of trade-type badge icons -- purely decorative here, cycled
// deterministically per card (by index) so each bot gets a distinct icon and
// the same bot always shows the same one, rather than reusing one repeated
// icon for all 20 strategies.
const CARD_ICONS = [
    TradeTypesDigitsOverIcon,
    TradeTypesDigitsUnderIcon,
    TradeTypesDigitsEvenIcon,
    TradeTypesDigitsOddIcon,
    TradeTypesDigitsMatchesIcon,
    TradeTypesDigitsDiffersIcon,
    TradeTypesHighsAndLowsHigherIcon,
    TradeTypesHighsAndLowsLowerIcon,
    TradeTypesUpsAndDownsRiseIcon,
    TradeTypesUpsAndDownsFallIcon,
    TradeTypesMultipliersUpIcon,
    TradeTypesMultipliersDownIcon,
    TradeTypesTurboLongIcon,
    TradeTypesTurboShortIcon,
    TradeTypesAccumulatorBreakOutIcon,
];

const FreeBots = observer(() => {
    const { load_modal, dashboard } = useStore();
    const { loadStrategyToBuilder } = load_modal;
    const { setActiveTab } = dashboard;
    const [loading_id, setLoadingId] = React.useState<string | null>(null);
    const [error_id, setErrorId] = React.useState<string | null>(null);
    const [search_term, setSearchTerm] = React.useState('');

    const handleLoad = async (bot: { id: string; name: string; file: string }) => {
        setErrorId(null);
        setLoadingId(bot.id);
        try {
            const response = await fetch(bot.file);
            if (!response.ok) throw new Error('Failed to fetch strategy file');
            const xml = await response.text();

            await loadStrategyToBuilder(
                {
                    id: bot.id,
                    name: bot.name,
                    save_type: save_types.LOCAL,
                    timestamp: Date.now(),
                    xml,
                },
                true
            );

            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[FreeBots] Failed to load strategy:', error);
            setErrorId(bot.id);
        } finally {
            setLoadingId(null);
        }
    };

    const filtered_bots = React.useMemo(() => {
        const query = search_term.trim().toLowerCase();
        if (!query) return FREE_BOTS;
        return FREE_BOTS.filter(bot => bot.name.toLowerCase().includes(query));
    }, [search_term]);

    return (
        <div className='free-bots'>
            <div className='free-bots__search'>
                <StandaloneSearchRegularIcon
                    height='18px'
                    width='18px'
                    fill='var(--text-less-prominent)'
                    className='free-bots__search-icon'
                />
                <input
                    type='text'
                    className='free-bots__search-input'
                    placeholder={localize('Search strategies...')}
                    value={search_term}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filtered_bots.length === 0 ? (
                <Text size='xs' color='less-prominent' className='free-bots__empty'>
                    <Localize i18n_default_text='No strategies match your search.' />
                </Text>
            ) : (
                <div className='free-bots__grid'>
                    {filtered_bots.map((bot, index) => {
                        const CardIcon = CARD_ICONS[index % CARD_ICONS.length];
                        return (
                            <div key={bot.id} className='free-bots__card'>
                                <div className='free-bots__card-icon'>
                                    <CardIcon iconSize='sm' />
                                </div>
                                <Text size='xs' weight='bold' className='free-bots__card-name'>
                                    {bot.name}
                                </Text>
                                <Button
                                    secondary
                                    is_loading={loading_id === bot.id}
                                    onClick={() => handleLoad(bot)}
                                    text={localize('Load')}
                                    className='free-bots__card-button'
                                />
                                {error_id === bot.id && (
                                    <Text size='xxs' color='loss-danger' className='free-bots__card-error'>
                                        <Localize i18n_default_text='Could not load this bot. Try again.' />
                                    </Text>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default FreeBots;
