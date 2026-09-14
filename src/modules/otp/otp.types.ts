export interface OtpRecord {
  id: string;
  email: string;
  otpHash: string;
  encryptedOtp: string;
  createdAt: Date;
  expiresAt: Date;
  resendCount: number;
  consumedAt: Date | null;
}

export interface OtpRequestRecord {
  id: string;
  email: string;
  createdAt: Date;
}

export interface CreateOtpInput {
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface OtpGenerationResult {
  otp: string;
  hash: string;
  encryptedOtp: string;
}

export type OtpVerificationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason:
        | "OTP_NOT_FOUND"
        | "OTP_EXPIRED"
        | "OTP_ALREADY_USED"
        | "INVALID_OTP";
    };