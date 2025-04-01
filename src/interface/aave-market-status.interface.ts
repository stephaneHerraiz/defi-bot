import { AaveMarketEntity } from "../entity/aave-market.entity"
import { AccountEntity } from "../entity/accounts.entity"

export interface AaveMarketStatusInterface {

    healthFactor: number;

    totalBorrows: number

    liquidationThreshold: number

    account: AccountEntity
    
    market: AaveMarketEntity

}