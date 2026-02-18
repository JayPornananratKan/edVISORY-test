import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'integer', nullable: true })
  parent_id: number;

  @Column({ type: 'boolean', default: true })
  is_expense: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
