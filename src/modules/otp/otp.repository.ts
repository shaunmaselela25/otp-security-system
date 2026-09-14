import type {
  OtpRecord
} from "./otp.types.js";

export interface OtpRepository {
  countRequestsSince(
    email: string,
    since: Date
  ): Promise<number>;

  recordRequest(
    email: string
  ): Promise<void>;

  findLatestOtp(
    email: string
  ): Promise<OtpRecord | null>;

  findOtpHashesSince(
    email: string,
    since: Date
  ): Promise<string[]>;

  createOtp(input: {
    email: string;
    otpHash: string;
    encryptedOtp: string;
    expiresAt: Date;
  }): Promise<OtpRecord>;

  refreshOtp(
    id: string,
    expiresAt: Date,
    maxResends: number
  ): Promise<OtpRecord>;

  consumeOtp(
    id: string
  ): Promise<boolean>;
}