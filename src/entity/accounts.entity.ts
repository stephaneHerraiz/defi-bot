import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { AccountInterface } from "../interface/account.interface"

@Entity()
export class AccountEntity {
    @PrimaryColumn()
    address!: string

    @Column()
    label!: string

    constructor (account: AccountInterface) {
        if(account === undefined) return;
        this.address = account.address;
        this.label = account.label;
    }
}