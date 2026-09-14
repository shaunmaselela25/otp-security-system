import { randomInt } from "node:crypto";

export function generateOtp(): string {
  const number = randomInt(0, 1_000_000);

  return number
    .toString()
    .padStart(6, "0");
}