export function toPaise(amount) {
  return Math.round(Number(amount) * 100);
}

export function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

export function sumMoney(amounts) {
  return fromPaise(amounts.reduce((total, amount) => total + toPaise(amount), 0));
}

export function splitEvenly(totalAmount, memberCount) {
  const totalPaise = toPaise(totalAmount);
  const baseShare = Math.floor(totalPaise / memberCount);
  let remainder = totalPaise - baseShare * memberCount;

  return Array.from({ length: memberCount }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return fromPaise(baseShare + extra);
  });
}

