import { Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { CreateUser, UpdateUser, User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateService } from './paginate.service';
import { PaginatedEntityList, PaginateParam } from './type';

export type UserFilterParam = Partial<Pick<User, 'username' | 'name' | 'bio'>>;

export type UserPaginateParam = PaginateParam<User> & UserFilterParam;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    protected readonly repo: Repository<User>,
    protected readonly paginate: PaginateService,
  ) {}

  async findAll(
    token: string | null,
    params?: UserPaginateParam,
  ): Promise<PaginatedEntityList<User>> {
    return this.paginate.paginate<User, UserPaginateParam>(
      this.repo,
      User,
      params,
      token,
      (p) => ({
        where: [
          { username: p.username ? Like(`%${p.username}%`) : undefined },
          { name: p.name ? Like(`%${p.name}%`) : undefined },
          { bio: p.bio ? Like(`%${p.bio}%`) : undefined },
        ],
      }),
    );
  }

  async findOne(id: number): Promise<User> {
    return this.repo.findOne({ where: { id } });
  }

  async create(user: CreateUser): Promise<User> {
    return this.repo.save(user);
  }

  async update(id: number, user: UpdateUser): Promise<void> {
    await this.repo.update(id, user);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
