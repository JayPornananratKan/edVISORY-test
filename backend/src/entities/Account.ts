import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  account_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bank_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  account_number: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.00 })
  initial_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.00 })
  current_balance: number;

  @Column({ type: 'varchar', length: 3, default: 'THB' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
