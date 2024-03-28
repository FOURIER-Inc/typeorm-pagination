import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostPaginateParam, PostService } from './post.service';
import { CreatePost, Post as PostEntity, UpdatePost } from './post.entity';
import { PaginatedEntityList } from './type';

@Controller('posts')
export class PostController {
  constructor(protected readonly postService: PostService) {}

  @Get('/')
  async index(
    @Query() query: PostPaginateParam & { token?: string },
  ): Promise<PaginatedEntityList<PostEntity>> {
    return await this.postService.findAll(query.token ?? null, query);
  }

  @Post('/')
  create(@Body() body: CreatePost): Promise<PostEntity> {
    return this.postService.create(body);
  }

  @Get('/:slug')
  show(@Param('slug') slug: string): Promise<PostEntity> {
    return this.postService.findOne(slug);
  }

  @Put('/:slug')
  async update(
    @Param('slug') slug: string,
    @Body() body: UpdatePost,
  ): Promise<void> {
    await this.postService.update(slug, body);
  }

  @Delete('/:slug')
  async delete(@Param('slug') slug: string): Promise<void> {
    await this.postService.remove(slug);
  }
}
