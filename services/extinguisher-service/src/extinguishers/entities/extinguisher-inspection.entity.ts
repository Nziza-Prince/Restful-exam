import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InspectionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED_PENDING_ADMIN_REVIEW = 'COMPLETED_PENDING_ADMIN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_MAINTENANCE = 'REQUIRES_MAINTENANCE',
}

@Entity('extinguisher_inspections')
export class ExtinguisherInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy: string;

  @Column({ name: 'inspector_id', type: 'uuid', nullable: true })
  inspectorId: string | null;

  @Column({ type: 'varchar', length: 50, default: InspectionStatus.PENDING })
  status: InspectionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'report_condition', type: 'text', nullable: true })
  reportCondition: string | null;

  @Column({ name: 'report_notes', type: 'text', nullable: true })
  reportNotes: string | null;

  @Column({ name: 'actions_taken', type: 'text', nullable: true })
  actionsTaken: string | null;

  @Column({ name: 'inspection_result', type: 'varchar', length: 100, nullable: true })
  result: string | null;

  @Column({ name: 'inspection_date', type: 'date', nullable: true })
  inspectionDate: string | null;

  @Column({ name: 'admin_review_notes', type: 'text', nullable: true })
  adminReviewNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
