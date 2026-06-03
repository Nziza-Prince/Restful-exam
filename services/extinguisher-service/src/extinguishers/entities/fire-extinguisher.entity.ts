import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExtinguisherStatus } from './extinguisher-status.enum';

@Entity('fire_extinguishers')
@Index(['serialNumber'], { unique: true })
export class FireExtinguisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', length: 100 })
  serialNumber: string;

  @Column({ length: 100 })
  type: string;

  @Column({ length: 200, default: 'Unassigned facility area' })
  location: string;

  @Column({ length: 50, default: '5lbs' })
  size: string;

  @Column({ length: 50 })
  capacity: string;

  @Column({ name: 'installation_date', type: 'date', default: () => 'CURRENT_DATE' })
  installationDate: string;

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
