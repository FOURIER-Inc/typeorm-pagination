import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityTarget,
  Equal,
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  ObjectLiteral,
  Repository,
} from 'typeorm';

import { TokenService } from './token.service.js';
import {
  Entity,
  EntityKey,
  PaginatedEntityList,
  InitialTokenData,
  PaginateParam,
  TokenData,
  isTokenData,
} from './type';
import { removeEmpty } from './remove-empty';
import * as console from 'console';

export type FilterType<T extends ObjectLiteral> = Omit<
  FindManyOptions<T>,
  'skip' | 'take' | 'order'
>;

@Injectable()
export class PaginateService {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly tokenService: TokenService,
  ) {}

  async paginate<
    T extends ObjectLiteral,
    P extends PaginateParam<Entity<T>> | undefined,
  >(
    repository: Repository<T>,
    entity: EntityTarget<T>,
    params: P,
    token: string | null,
    filterMaker?: (params: P) => FilterType<T>,
  ): Promise<PaginatedEntityList<T>> {
    const tokenData = this.getTokenData<P>(entity, params, token);

    const filter = this.makeFilterFindOptions<T, P>(
      filterMaker,
      params,
      tokenData,
    );

    const options = this.makeFindManyOptions(entity, filter, {
      ...tokenData,
      size: tokenData.size + 1,
    } as InitialTokenData<T> | TokenData<T, P>);

    const entities = await repository.find(options);

    let next: T | undefined = undefined;
    if (entities.length > tokenData.size) {
      next = entities.pop();
    }

    const nextPageToken = next
      ? this.makeToken<T, P>(entity, params, tokenData, next)
      : null;

    return {
      entities,
      nextPageToken,
    };
  }

  protected getTokenData<P>(
    entity: EntityTarget<ObjectLiteral>,
    paginate: PaginateParam<Entity>,
    token: string | null,
  ): InitialTokenData<ObjectLiteral> | TokenData<ObjectLiteral, P> {
    const defaultParam: InitialTokenData<ObjectLiteral> = {
      size: 100,
      direction: 'asc',
      sortBy: this.guessPrimaryColumn(entity),
      cursorBy: this.guessPrimaryColumn(entity),
    };

    if (token) {
      try {
        return this.tokenService.decode(token);
      } catch (e) {
        console.error(e);
        return defaultParam;
      }
    }

    return {
      size: paginate.size ?? defaultParam.size,
      direction: paginate.direction ?? defaultParam.direction,
      sortBy: paginate.sortBy ?? defaultParam.sortBy,
      cursorBy: this.getUniqueSortColumn(
        entity,
        paginate.sortBy ?? defaultParam.sortBy,
      ),
    } as InitialTokenData<ObjectLiteral>;
  }

  protected makeFindManyOptions<T extends ObjectLiteral, P>(
    entity: EntityTarget<T>,
    filterOption: FilterType<T>,
    tokenData: InitialTokenData<T> | TokenData<T, P>,
  ): FindManyOptions<T> {
    const where = isTokenData(tokenData)
      ? this.makePaginationFindOptions<T>(
          tokenData.direction,
          tokenData.cursorBy,
          tokenData.cursorValue,
          tokenData.sortBy,
          tokenData.sortValue,
        )
      : [];

    let mergedWhere: FindOptionsWhere<T>[] | FindOptionsWhere<T> | undefined =
      this.mergeFilterAndPaginateWhere(filterOption.where ?? {}, where);

    if (Array.isArray(mergedWhere) && mergedWhere.length === 0) {
      mergedWhere = undefined;
    }

    return {
      ...filterOption,
      take: tokenData.size ?? undefined,
      where: mergedWhere,
      order: this.makeFindOrderOption<T>(
        entity,
        tokenData.sortBy,
        tokenData.cursorBy,
        tokenData.direction,
      ),
    } as FindManyOptions<T>;
  }

  protected makePaginationFindOptions<T extends ObjectLiteral>(
    dir: 'asc' | 'desc',
    cursorBy: EntityKey<T>,
    cursorValue: any,
    sortBy: EntityKey<T>,
    sortValue: any,
  ): FindOptionsWhere<T>[] {
    const op = (value: any) =>
      dir === 'asc' ? MoreThanOrEqual(value) : LessThanOrEqual(value);

    return [
      {
        [sortBy]: op(sortValue),
      },
      {
        [sortBy]: Equal(sortValue),
        [cursorBy]: op(cursorValue),
      },
    ] as FindOptionsWhere<T>[];
  }

  protected mergeFilterAndPaginateWhere<T>(
    filter: FindOptionsWhere<T>[] | FindOptionsWhere<T>,
    paginate: FindOptionsWhere<T>[],
  ): FindOptionsWhere<T>[] | FindOptionsWhere<T> {
    if (!Array.isArray(filter)) {
      return paginate.map((p) => ({ ...filter, ...p }));
    }

    const removedEmpty = filter
      .map(removeEmpty)
      .filter(
        (w): w is FindOptionsWhere<T> =>
          w !== undefined && Object.keys(w).length > 0,
      );

    if (paginate.length === 0 && removedEmpty.length === 0) {
      return [];
    }

    if (paginate.length === 0) {
      return removedEmpty;
    }

    if (removedEmpty.length === 0) {
      return paginate;
    }

    if (removedEmpty.length === 1) {
      return paginate.map((p) => ({ ...removedEmpty[0], ...p }));
    }

    return removedEmpty
      .map((w) => paginate.map((p) => ({ ...w, ...p })))
      .flat();
  }

  protected makeFindOrderOption<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    sortBy: EntityKey<T>,
    cursorBy: EntityKey<T>,
    direction: 'asc' | 'desc',
  ): FindOptionsOrder<T> {
    if (!this.checkColumnExists(entity, sortBy)) {
      return {};
    }

    return {
      [sortBy]: direction,
      [cursorBy]: direction,
    } as FindOptionsOrder<T>;
  }

  protected makeToken<T extends ObjectLiteral, P>(
    entity: EntityTarget<T>,
    params: P,
    tokenData: InitialTokenData<T>,
    nextEntity: T,
  ): string {
    const column = this.getUniqueSortColumn(entity, tokenData.sortBy);
    const cursorValue = nextEntity[column as keyof T];
    const sortValue = nextEntity[tokenData.sortBy as keyof T];

    return this.tokenService.encode({
      size: tokenData.size,
      direction: tokenData.direction,
      sortBy: tokenData.sortBy,
      cursorBy: column,
      cursorValue: cursorValue,
      sortValue: sortValue,
      filterParams: params,
    });
  }

  protected makeFilterFindOptions<T extends ObjectLiteral, P>(
    filterMaker: ((params: P) => FilterType<T>) | undefined,
    filterParams: P,
    tokenData: InitialTokenData<T> | TokenData<T, P>,
  ): FilterType<T> {
    if (isTokenData(tokenData)) {
      if (filterMaker) {
        return filterMaker(tokenData.filterParams);
      }
    } else {
      if (filterMaker) {
        return filterMaker(filterParams);
      }
    }

    return {};
  }

  protected getUniqueSortColumn(
    entity: EntityTarget<ObjectLiteral>,
    sortBy: EntityKey<Entity>,
  ): EntityKey<Entity> {
    const isUniqueSortableColumn =
      this.isUniqueColumn(entity, sortBy) &&
      this.isNotNullColumn(entity, sortBy);

    return isUniqueSortableColumn ? sortBy : this.guessPrimaryColumn(entity);
  }

  protected isUniqueColumn(
    entity: EntityTarget<ObjectLiteral>,
    column: EntityKey<ObjectLiteral>,
  ): boolean {
    const meta = this.dataSource.getMetadata(entity);

    if (this.guessPrimaryColumn(entity) === column) return true;

    return meta.indices.some((i) => {
      return i.columns.map((c) => c.propertyName).includes(column);
    });
  }

  protected isNotNullColumn(
    entity: EntityTarget<ObjectLiteral>,
    column: EntityKey<Entity>,
  ): boolean {
    const meta = this.dataSource.getMetadata(entity);

    return meta.columns.some((c) => c.propertyName === column && !c.isNullable);
  }

  protected guessPrimaryColumn(
    entity: EntityTarget<ObjectLiteral>,
  ): EntityKey<Entity> {
    const meta = this.dataSource.getMetadata(entity);

    const columns = meta.primaryColumns;
    if (columns.length > 1) {
      throw new Error(
        `${this.constructor.name} supports only one primary column. but ${meta.targetName} has multiple primary columns.`,
      );
    }

    return columns[0].propertyName as EntityKey<Entity>;
  }

  protected checkColumnExists(
    entity: EntityTarget<ObjectLiteral>,
    column: EntityKey<Entity>,
  ): boolean {
    const meta = this.dataSource.getMetadata(entity);
    return meta.columns.some((c) => c.propertyName === column);
  }
}
