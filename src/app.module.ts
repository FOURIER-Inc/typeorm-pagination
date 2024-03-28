import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './post.entity';
import { PaginateService } from './paginate.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite3',
      synchronize: true,
      logging: true,
      entities: [User, Post],
    }),
    TypeOrmModule.forFeature([User, Post]),
  ],
  controllers: [AppController, UserController, PostController],
  providers: [
    AppService,
    TokenService,
    PaginateService,
    UserService,
    PostService,
  ],
})
export class AppModule {}
