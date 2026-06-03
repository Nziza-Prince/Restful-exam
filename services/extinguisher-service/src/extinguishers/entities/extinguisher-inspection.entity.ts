import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
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

  @Column({ type: 'enum', enum: InspectionStatus, default: InspectionStatus.SCHEDULED })
  status: InspectionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
