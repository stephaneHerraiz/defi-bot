import { AaveUtils, AaveMarkets } from "./aave-utils";
import { EmbedBuilder, WebhookClient } from 'discord.js';
import "reflect-metadata"
import { AaveDatasource, getLastMarketStatus } from './aave-store'; 
import { AccountEntity } from './entity/accounts.entity';
import { AaveMarketEntity } from './entity/aave-market.entity';
import { AaveMarketStatusEntity } from './entity/aave-market-status.entity';
const config = require('config');

(async () => {
  let accounts: AccountEntity[] = [];
  if (config.has('accounts')) {
    accounts = config.get('accounts');
  } else {
    console.error(('No accounts found in config file'));
    return;
  }
  
  let aaveAlertThreshold = 2;
  if (config.has('aave.alert-threshold')) {
    aaveAlertThreshold = config.get('aave.alert-threshold');
  } else {
    console.error('No alert threshold found in config file');
    return;
  }

  let webhookClient: WebhookClient;
  if (config.has('discord-webhook')) {
    webhookClient = new WebhookClient({ url: config.get('discord-webhook') });
  } else {
    console.error('No discord webhook found in config file');
    return;
  }

  await AaveDatasource.initialize();
  const accountRepository = AaveDatasource.getRepository(AccountEntity);
  accounts.forEach(async (account) => {
    accountRepository.upsert(account, ['address']);
  });
  
  const marketRepository = AaveDatasource.getRepository(AaveMarketEntity);
  AaveMarkets.forEach(async (market) => {
    marketRepository.upsert(market, ['chain']);
  });

  let sendAlert = false;

  for(const account of accounts) {
    console.log(`Retreiving AAVE markets from "${account.label}" account`);
    const embed = new EmbedBuilder()
    .setTitle(`AAVE summary - ${account.label}`)
    .setAuthor({ name: 'AAVE bot', iconURL: 'https://i.imgur.com/wsRom3G.png'})
    .setColor(0xFF0000)
    .setTimestamp()
    for(const market of AaveMarkets) {
      const aaveUtils = new AaveUtils(market.chain);
      await aaveUtils.fetchContractData(account);
      const marketStatus = aaveUtils.getMarketStatus();
      const lastMarketStatus = await getLastMarketStatus(account, market);
      if (  marketStatus.healthFactor > -1 &&
            marketStatus.healthFactor < aaveAlertThreshold &&
            (!lastMarketStatus || lastMarketStatus.healthFactor > aaveAlertThreshold)) {
        sendAlert = true;
        embed.addFields({ name: 'Chain', value: market.chain});
        embed.addFields({ name: 'Health Factor', value: `${marketStatus.healthFactor.toFixed(2).toString()}`, inline: true });
        embed.addFields({ name: 'Total borrow', value: `${marketStatus.totalBorrows.toFixed(2)}$`, inline: true });
        embed.addFields({ name: 'Liquidation threshold', value: marketStatus.liquidationThreshold.toFixed(2), inline: true });
        aaveUtils.getReserves().forEach((reserve: { totalBorrowsUSD: string; underlyingAsset: string; totalBorrows: string; }) => {
          if (Number(reserve.totalBorrowsUSD)> 0) {
            let asset = aaveUtils.getTokenByUnderLyingAddress(reserve.underlyingAsset);
            if (asset) {
              embed.addFields({ name: asset.name, value: `${parseFloat(reserve.totalBorrows).toFixed(2).toString()} (${parseFloat(reserve.totalBorrowsUSD).toFixed(2).toString()}$)`});
            }
          }
        });
        embed.addFields({ name: '\u200B', value: '\u200B' });
      }
      
      if (marketStatus.healthFactor > -1) {
        const marketStatusRepo = AaveDatasource.getRepository(AaveMarketStatusEntity);
        marketStatusRepo.save(marketStatus);
      }
    }
    if (sendAlert) {
      webhookClient.send({
        username: 'aave-bot',
        avatarURL: 'https://i.imgur.com/AfFp7pu.png',
        embeds: [embed],
      });
    }
  };

})();