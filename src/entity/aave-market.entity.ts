import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class AaveMarketEntity {

    @PrimaryColumn()
    chain!: string;

    @Column()
    rpcProviver!: string;

    constructor(market: any) {
        this.chain = market.chain;
        this.rpcProviver = market.rpcProviver;
    }

}