import { scrypt, randomBytes } from 'crypto';

export class PasswordService {
  /**
   * Hashes a password using Node's native scrypt algorithm.
   */
  public static async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(16).toString('hex');
      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Compares a raw password against an existing hash.
   */
  public static async compare(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      if (!salt || !key) return resolve(false);

      scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }
}
