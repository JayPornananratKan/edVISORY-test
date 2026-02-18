import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('transaction_attachments')
export class TransactionAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  transaction_id: number;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  file_hash: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploaded_at: Date;
}
