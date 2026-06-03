import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CaseStatus } from '../enums/case-status.enum';

@Entity('compliance_cases')
export class ComplianceCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({ name: 'case_status', type: 'enum', enum: CaseStatus, default: CaseStatus.OPEN })
  caseStatus: CaseStatus;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
