import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUser, UpdateUser, User } from './user.entity';

import { EntityKey, PaginatedEntityList } from './type';

@Controller('users')
export class UserController {
  constructor(protected readonly userService: UserService) {}

  @Get('/')
  async index(
    @Query('size', new ParseIntPipe({ optional: true }))
    size: number | undefined,
    @Query('sortBy') sortBy: EntityKey<User> | undefined,
    @Query('direction') direction: 'asc' | 'desc' | undefined,
    @Query('token') token: string | undefined,
    @Query('username') username: string | undefined,
    @Query('name') name: string | undefined,
    @Query('bio') bio: string | undefined,
  ): Promise<PaginatedEntityList<User>> {
    return await this.userService.findAll(token ?? null, {
      size,
      sortBy,
      direction,
      username,
      name,
      bio,
    });
  }

  @Post('/')
  create(@Body() body: CreateUser): Promise<User> {
    return this.userService.create(body);
  }

  @Get('/:id')
  show(@Param('id') id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put('/:id')
  async update(
    @Param('id') id: number,
    @Body() body: UpdateUser,
  ): Promise<void> {
    await this.userService.update(id, body);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<void> {
    await this.userService.remove(id);
  }
}
