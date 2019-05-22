export function trimRight(str: string): string {
  return str.replace(/\s+$/, "");
}

export function beginsWith(str: string, query: string): boolean {
  for (let i = 0; i < query.length; i++) {
    if (str[i] != query[i]) return false;
  }
  return true;
}
