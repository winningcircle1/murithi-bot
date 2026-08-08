// @ts-nocheck — matches conventions of vendored bot code; see AGENTS.md
import React from 'react';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import Button from '@/components/shared_ui/button';
import { getActiveLoginId } from '@/external/deriv-core';
import { Localize, localize } from '@deriv-com/translations';
import './copy-trading.scss';

// This project has no backend of its own -- submitted tokens are written
// directly to a Supabase table locked down with row-level security so the
// public site can INSERT but never SELECT/UPDATE/DELETE rows back out.
// A separate, trusted copy-trading service (built independently) reads from
// this same table using a privileged key to actually execute copy trades.
const SUPABASE_URL = 'https://jopgrvkdxyvnjaqgtymx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_T70y05qzVZK36nzWVne1mg_zP54M0p4';

type TSubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

const CopyTrading = observer(() => {
    const [api_token, setApiToken] = React.useState('');
    const [status, setStatus] = React.useState<TSubmitStatus>('idle');
    const [error_message, setErrorMessage] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed_token = api_token.trim();

        if (!trimmed_token) {
            setStatus('error');
            setErrorMessage(localize('Please enter your API token.'));
            return;
        }

        setStatus('submitting');
        setErrorMessage('');

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/copy_trading_tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                    Prefer: 'return=minimal',
                },
                body: JSON.stringify({
                    submitted_by_loginid: getActiveLoginId() ?? null,
                    api_token: trimmed_token,
                }),
            });

            if (!response.ok) {
                throw new Error(`Submission failed with status ${response.status}`);
            }

            setStatus('success');
            setApiToken('');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[CopyTrading] Failed to submit token:', err);
            setStatus('error');
            setErrorMessage(localize('Something went wrong. Please try again.'));
        }
    };

    return (
        <div className='copy-trading'>
            <div className='copy-trading__container'>
                <Text as='h2' size='m' weight='bold' className='copy-trading__title'>
                    <Localize i18n_default_text='Copy Trading' />
                </Text>
                <Text as='p' size='xs' color='less-prominent' className='copy-trading__description'>
                    <Localize i18n_default_text='Add your Deriv API token to have trades mirrored to your account automatically, scaled to your account balance.' />
                </Text>

                <form className='copy-trading__form' onSubmit={handleSubmit}>
                    <label className='copy-trading__label' htmlFor='copy-trading-token-input'>
                        <Localize i18n_default_text='API Token' />
                    </label>
                    <input
                        id='copy-trading-token-input'
                        type='password'
                        className='copy-trading__input'
                        placeholder={localize('Enter your API token')}
                        value={api_token}
                        onChange={e => setApiToken(e.target.value)}
                        disabled={status === 'submitting'}
                        autoComplete='off'
                    />

                    <Button
                        type='submit'
                        className='copy-trading__submit-button'
                        text={localize('Save token')}
                        is_loading={status === 'submitting'}
                        disabled={status === 'submitting'}
                        primary
                        large
                    />

                    {status === 'success' && (
                        <Text as='p' size='xs' className='copy-trading__status copy-trading__status--success'>
                            <Localize i18n_default_text='Your token was saved successfully.' />
                        </Text>
                    )}
                    {status === 'error' && (
                        <Text as='p' size='xs' className='copy-trading__status copy-trading__status--error'>
                            {error_message}
                        </Text>
                    )}
                </form>
            </div>
        </div>
    );
});

export default CopyTrading;
