import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('maintenance_logs')
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({ name: 'actions_taken', type: 'text' })
  actionsTaken: string;

  @Column({ name: 'action_date', type: 'date' })
  actionDate: string;

  @Column({ name: 'conditions_noted', type: 'text' })
  conditionsNoted: string;

  @Column({ name: 'logged_by', type: 'uuid' })
  loggedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
