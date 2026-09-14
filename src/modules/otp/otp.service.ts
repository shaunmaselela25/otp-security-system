import {
  generateOtp
} from "./otp.generator.js";

import {
  hashOtp,
  encryptOtp,
  decryptOtp
} from "./otp.crypto.js";

import type {
  OtpRepository
} from "./otp.repository.js";

import type {
  OtpRecord
} from "./otp.types.js";

import type {
  OtpConfig
} from "./otp.config.js";

export class OtpService {
  constructor(
    private readonly repository: OtpRepository,
    private readonly config: OtpConfig,
    private readonly now: () => Date = () => new Date()
  ) {}

  async requestOtp(
    email: string
  ): Promise<{
    otp: string;
    record: OtpRecord;
    resent: boolean;
  }> {

    const normalizedEmail =
      this.normalizeEmail(email);

    const currentTime =
      this.now();

    const latestOtp =
      await this.repository.findLatestOtp(
        normalizedEmail
      );

    /*
     * RESEND RULE
     *
     * If the latest OTP was created
     * within the resend window and
     * has not been consumed, resend it.
     */
    if (
      latestOtp &&
      !latestOtp.consumedAt &&
      this.isWithinResendWindow(
        latestOtp.createdAt,
        currentTime
      )
    ) {

      if (
        latestOtp.resendCount >=
        this.config.maxResends
      ) {
        throw new Error(
          "MAX_RESENDS_EXCEEDED"
        );
      }

      const newExpiry =
        this.addSeconds(
          currentTime,
          this.config.expirySeconds
        );

      const refreshed =
        await this.repository.refreshOtp(
          latestOtp.id,
          newExpiry,
          this.config.maxResends
        );

      return {
        otp: decryptOtp(
          latestOtp.encryptedOtp
        ),
        record: refreshed,
        resent: true
      };
    }

    /*
     * RATE LIMIT
     *
     * Count all requests made by this
     * email during the previous hour.
     */
    const oneHourAgo =
      this.subtractMinutes(
        currentTime,
        60
      );

    const requestCount =
      await this.repository
        .countRequestsSince(
          normalizedEmail,
          oneHourAgo
        );

    if (
      requestCount >=
      this.config.maxRequestsPerHour
    ) {
      throw new Error(
        "HOURLY_REQUEST_LIMIT_EXCEEDED"
      );
    }

    /*
     * Generate a new OTP.
     *
     * We may need to generate more than
     * once because the same OTP cannot be
     * sent to this user twice within 24h.
     */
    const twentyFourHoursAgo =
      this.subtractHours(
        currentTime,
        24
      );

    const recentHashes =
      await this.repository
        .findOtpHashesSince(
          normalizedEmail,
          twentyFourHoursAgo
        );

    const recentHashSet =
      new Set(recentHashes);

    let otp: string;
    let hash: string;

    do {
      otp = generateOtp();
      hash = hashOtp(otp);
    } while (
      recentHashSet.has(hash)
    );

    const encryptedOtp =
      encryptOtp(otp);

    const expiresAt =
      this.addSeconds(
        currentTime,
        this.config.expirySeconds
      );

    const record =
      await this.repository.createOtp({
        email: normalizedEmail,
        otpHash: hash,
        encryptedOtp,
        expiresAt
      });

    await this.repository.recordRequest(
      normalizedEmail
    );

    return {
      otp,
      record,
      resent: false
    };
  }

  async verifyOtp(
    email: string,
    suppliedOtp: string
  ): Promise<boolean> {

    const normalizedEmail =
      this.normalizeEmail(email);

    if (
      !/^\d{6}$/.test(suppliedOtp)
    ) {
      return false;
    }

    const otp =
      await this.repository.findLatestOtp(
        normalizedEmail
      );

    if (!otp) {
      return false;
    }

    if (otp.consumedAt) {
      return false;
    }

    const currentTime =
      this.now();

    if (
      currentTime >= otp.expiresAt
    ) {
      return false;
    }

    const suppliedHash =
      hashOtp(suppliedOtp);

    if (
      suppliedHash !== otp.otpHash
    ) {
      return false;
    }

    return this.repository.consumeOtp(
      otp.id
    );
  }

  private normalizeEmail(
    email: string
  ): string {

    return email
      .trim()
      .toLowerCase();
  }

  private isWithinResendWindow(
    createdAt: Date,
    now: Date
  ): boolean {

    const windowMs =
      this.config.resendWindowMinutes *
      60 *
      1000;

    return (
      now.getTime() -
      createdAt.getTime()
    ) <= windowMs;
  }

  private addSeconds(
    date: Date,
    seconds: number
  ): Date {

    return new Date(
      date.getTime() +
      seconds * 1000
    );
  }

  private subtractMinutes(
    date: Date,
    minutes: number
  ): Date {

    return new Date(
      date.getTime() -
      minutes * 60 * 1000
    );
  }

  private subtractHours(
    date: Date,
    hours: number
  ): Date {

    return new Date(
      date.getTime() -
      hours * 60 * 60 * 1000
    );
  }
}