import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export class Post {
  @PrimaryColumn({
    type: 'text',
  })
  slug!: string;

  @Column({
    type: 'text',
  })
  title!: string;

  @Column({
    type: 'text',
  })
  content!: string;

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

export type CreatePost = Pick<Post, 'slug' | 'title' | 'content'>;

export type UpdatePost = Pick<Post, 'title' | 'content'>;
