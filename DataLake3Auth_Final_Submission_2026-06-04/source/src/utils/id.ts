let counter = 0;

export function createId(prefix = 'id'): string {
  counter = (counter + 1) % 0xffff;
  const time = Date.now().toString(36);
  const sequence = counter.toString(36).padStart(3, '0');
  const random =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10);

  return `${prefix}_${time}_${sequence}_${random}`;
}
