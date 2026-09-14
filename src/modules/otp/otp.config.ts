export interface OtpConfig {
  maxRequestsPerHour: number;
  expirySeconds: number;
  resendWindowMinutes: number;
  maxResends: number;
}