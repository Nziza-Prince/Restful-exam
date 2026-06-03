import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RenewalRequestStatus,
  RenewalRequestType,
} from './renewal.enums';

@Entity('renewal_requests')
export class RenewalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({
    name: 'request_type',
    type: 'enum',
    enum: RenewalRequestType,
  })
  requestType: RenewalRequestType;

  @Column({
    type: 'enum',
    enum: RenewalRequestStatus,
    default: RenewalRequestStatus.PENDING,
  })
  status: RenewalRequestStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
