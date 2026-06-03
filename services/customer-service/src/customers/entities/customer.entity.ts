import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'national_id', length: 50 })
  nationalId: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @Column({ name: 'invitation_token_hash', type: 'varchar', length: 64, nullable: true })
  invitationTokenHash: string | null;

  @Column({ name: 'invitation_expires_at', type: 'timestamptz', nullable: true })
  invitationExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
