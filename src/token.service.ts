import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { Entity, TokenData } from './type';

@Injectable()
export class TokenService {
  // crypto.randomBytes(32).toString('base64')
  private readonly key = Buffer.from(
    'MjJLJ+R1uAie4PVY4Y4DbWb2X/FNSBSyrdDQIsymtT8=',
    'base64',
  );
  // crypto.randomBytes(16).toString('base64')
  private readonly iv = Buffer.from('JgFk9UdYVmz9oCFdAe1CmQ==', 'base64');
  private readonly method = 'aes-256-cbc' as const;
  private readonly encoding: crypto.Encoding = 'base64' as const;

  encode(param: TokenData<Entity, any>): string {
    const cipher = crypto.createCipheriv(this.method, this.key, this.iv);

    const encrypted = cipher.update(JSON.stringify(param));
    const concat = Buffer.concat([encrypted, cipher.final()]);

    const token = concat.toString(this.encoding);

    console.log('encoded token', { param, token });

    return token;
  }

  decode<T extends Entity, U>(token: string): TokenData<T, U> {
    const decipher = crypto.createDecipheriv(this.method, this.key, this.iv);

    const decrypted = decipher.update(token, this.encoding);
    const concat = Buffer.concat([decrypted, decipher.final()]);

    const data = JSON.parse(concat.toString()) as TokenData<T, U>;

    console.log('decoded token', { token, data });

    return data;
  }
}
