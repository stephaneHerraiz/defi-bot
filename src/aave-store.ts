import { DataSource } from 'typeorm';
import { AaveMarketStatusEntity } from './entity/aave-market-status.entity';
import { AaveMarketEntity } from './entity/aave-market.entity';
import { AccountEntity } from './entity/accounts.entity';
const config = require('config');

export const AaveDatasource = new DataSource({
    type: 'postgres',
    host: config.get('database.host'),
    port: config.get('database.port'),
    username: config.get('database.username'),
    password: config.get('database.password'),
    database: config.get('database.database'),
    synchronize: true,
    logging: false,
    entities: [AccountEntity, AaveMarketEntity,AaveMarketStatusEntity],
    subscribers: [],
    migrations: [],
});

export async function getLastMarketStatus(account: AccountEntity, market: AaveMarketEntity) {
    return AaveDatasource.getRepository(AaveMarketStatusEntity).findOne( { 
        where: {
            account : account,
            market : market,
        },
        order: {
            created_at: 'DESC',
        },
    });
}
