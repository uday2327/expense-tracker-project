export function toPaise(amount: number) {
  return Math.round(amount * 100);
}

export function fromPaise(paise: number) {
  return Number((paise / 100).toFixed(2));
}

export function splitEvenly(totalAmount: number, memberCount: number) {
  const totalPaise = toPaise(totalAmount);
  const baseShare = Math.floor(totalPaise / memberCount);
  let remainder = totalPaise - baseShare * memberCount;

  return Array.from({ length: memberCount }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return fromPaise(baseShare + extra);
  });
}

export function sumMoney(amounts: number[]) {
  return fromPaise(amounts.reduce((total, amount) => total + toPaise(amount), 0));
}

