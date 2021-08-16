import React from 'react';
import { DashboardTile } from '@dailykit/ui';
import { useTranslation } from 'react-i18next';
import { useTabs } from '../../../../shared/providers';
import { StyledHome, StyledCardList } from './styled'
import { Banner } from '../../../../shared/components'

const address = 'apps.developer.views.home.';

const Home = () => {
    const { addTab } = useTabs();
    const { t } = useTranslation();

    return (
            <>
                <StyledHome>
                {/* <Banner id="developer-app-home-top" /> */}
                {/* <h1>{t(address.concat('developer app'))}</h1> */}
                <h1>Developer</h1>
                    <StyledCardList>
                        
                        <DashboardTile
                            // title={t(address.concat('webhook'))}
                            title="Webhook"
                            conf="Add Webhooks"
                            onClick={() => addTab('Webhook', '/developer/webhook')}
                        />
                    </StyledCardList>
                    {/* <Banner id="developer-app-home-bottom" />    */}
                </StyledHome>
            </>
    )
}

export default Home;