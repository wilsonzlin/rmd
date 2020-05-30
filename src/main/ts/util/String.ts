export function trimRight (str: string): string {
  return str.replace(/\s+$/, '');
}

export function matchesAt (str: string, offset: number, query: string): boolean {
  for (let i = 0; i < query.length; i++) {
    if (str[i + offset] != query[i]) {
      return false;
    }
  }
  return true;
}

export function countCharRepetitionsAt (str: string, offset: number, char: string): number {
  let count = 0;
  for (let i = offset; i < str.length; i++) {
    if (str[i] != char) {
      break;
    }
    count++;
  }
  return count;
}

export function beginsWith (str: string, query: string): boolean {
  return matchesAt(str, 0, query);
}
