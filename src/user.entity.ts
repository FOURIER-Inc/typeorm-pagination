import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn({
    type: 'integer',
  })
  id!: number;

  @Column({
    type: 'text',
  })
  username!: string;

  @Column({
    type: 'text',
  })
  name!: string;

  @Column({
    type: 'text',
  })
  bio!: string;

  @CreateDateColumn({
    type: 'datetime',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    name: 'updated_at',
  })
  updatedAt!: Date;
}

export type CreateUser = Pick<User, 'name' | 'bio'>;

export type UpdateUser = Pick<User, 'name' | 'bio'>;
