import { createHash } from 'crypto';

export function getMd5Checksum(string) {
  const md5Hash = createHash('md5');
  md5Hash.update(string);
  return md5Hash.digest('hex');
}
    