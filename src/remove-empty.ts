import { FindOperator } from 'typeorm';

export function removeEmpty(obj: unknown): any {
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] instanceof FindOperator) {
      newObj[key] = obj[key];
    } else if (obj[key] === Object(obj[key])) {
      const n = removeEmpty(obj[key]);
      if (n !== undefined) newObj[key] = n;
    } else if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });

  return Object.keys(newObj).length > 0 ? newObj : undefined;
}
