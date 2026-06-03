import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExtinguisherStatus } from './extinguisher-status.enum';

@Entity('fire_extinguishers')
export class FireExtinguisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', length: 100 })
  serialNumber: string;

  @Column({ length: 100 })
  type: string;

  @Column({ length: 50 })
  capacity: string;

  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: string;

  @Column({
    type: 'enum',
    enum: ExtinguisherStatus,
    default: ExtinguisherStatus.ACTIVE,
  })
  status: ExtinguisherStatus;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
