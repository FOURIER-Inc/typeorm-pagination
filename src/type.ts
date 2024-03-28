import { EntityTarget, ObjectLiteral } from 'typeorm';

export type Entity<T extends ObjectLiteral = ObjectLiteral> = EntityTarget<T> &
  T;

export type EntityKey<T extends ObjectLiteral> = Extract<keyof T, string>;

export type PaginatedEntityList<T extends ObjectLiteral> = {
  entities: T[];
  nextPageToken: string | null;
};

export type PaginateParam<T extends ObjectLiteral> = Partial<{
  size?: number;
  sortBy: EntityKey<T>;
  direction: 'asc' | 'desc';
}>;

export type InitialTokenData<T extends ObjectLiteral> = {
  size: number;
  sortBy: EntityKey<T>;
  direction: 'asc' | 'desc';
  cursorBy: EntityKey<T>;
};

export type TokenData<T extends ObjectLiteral, U> = InitialTokenData<T> & {
  sortValue: any;
  cursorValue: any;
  filterParams: U;
};

export function isTokenData<T extends ObjectLiteral, U>(
  data: TokenData<T, U> | InitialTokenData<T>,
): data is TokenData<T, U> {
  return Object.hasOwn(data, 'sortValue');
}
