import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePost, Post, UpdatePost } from './post.entity';
import { Like, Repository } from 'typeorm';
import { PaginateService } from './paginate.service';
import { PaginatedEntityList, PaginateParam } from './type';

export type PostFilterParam = Partial<Pick<Post, 'title' | 'content'>>;

export type PostPaginateParam = PaginateParam<Post> & PostFilterParam;

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    protected readonly repo: Repository<Post>,
    protected readonly paginate: PaginateService,
  ) {}

  async findAll(
    token: string | null,
    params?: PostPaginateParam,
  ): Promise<PaginatedEntityList<Post>> {
    return this.paginate.paginate<Post, PostPaginateParam>(
      this.repo,
      Post,
      params,
      token,
      (p) => ({
        where: [
          { title: p.title ? Like(`%${p.title}%`) : undefined },
          { content: p.content ? Like(`%${p.content}%`) : undefined },
        ],
      }),
    );
  }

  async findOne(slug: string): Promise<Post> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(post: CreatePost): Promise<Post> {
    return this.repo.save(post);
  }

  async update(slug: string, post: UpdatePost): Promise<void> {
    await this.repo.update(slug, post);
  }

  async remove(slug: string): Promise<void> {
    await this.repo.delete(slug);
  }
}
