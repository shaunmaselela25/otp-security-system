import { supabase } from "../../database/supabase.js";
import type {
  OtpRecord
} from "./otp.types.js";
import type {
  OtpRepository
} from "./otp.repository.js";

function mapOtpRecord(
  row: any
): OtpRecord {
  return {
    id: row.id,
    email: row.email,
    otpHash: row.otp_hash,
    encryptedOtp: row.encrypted_otp,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    resendCount: row.resend_count,
    consumedAt: row.consumed_at
      ? new Date(row.consumed_at)
      : null
  };
}

export class SupabaseOtpRepository
  implements OtpRepository {

  async countRequestsSince(
    email: string,
    since: Date
  ): Promise<number> {

    const { count, error } =
      await supabase
        .from("otp_requests")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq("email", email)
        .gte(
          "created_at",
          since.toISOString()
        );

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async recordRequest(
    email: string
  ): Promise<void> {

    const { error } =
      await supabase
        .from("otp_requests")
        .insert({
          email
        });

    if (error) {
      throw error;
    }
  }

  async findLatestOtp(
    email: string
  ): Promise<OtpRecord | null> {

    const { data, error } =
      await supabase
        .from("otp_records")
        .select("*")
        .eq("email", email)
        .order("created_at", {
          ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data
      ? mapOtpRecord(data)
      : null;
  }

  async findOtpHashesSince(
    email: string,
    since: Date
  ): Promise<string[]> {

    const { data, error } =
      await supabase
        .from("otp_records")
        .select("otp_hash")
        .eq("email", email)
        .gte(
          "created_at",
          since.toISOString()
        );

    if (error) {
      throw error;
    }

    return data?.map(
      row => row.otp_hash
    ) ?? [];
  }

  async createOtp(input: {
    email: string;
    otpHash: string;
    encryptedOtp: string;
    expiresAt: Date;
  }): Promise<OtpRecord> {

    const { data, error } =
      await supabase
        .from("otp_records")
        .insert({
          email: input.email,
          otp_hash: input.otpHash,
          encrypted_otp:
            input.encryptedOtp,
          expires_at:
            input.expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    return mapOtpRecord(data);
  }

  async refreshOtp(
    id: string,
    expiresAt: Date,
    maxResends: number
  ): Promise<OtpRecord> {

    const { data, error } =
      await supabase.rpc(
        "refresh_otp",
        {
          p_id: id,
          p_expires_at:
            expiresAt.toISOString(),
          p_max_resends:
            maxResends
        }
      );

    if (error) {
      throw error;
    }

    return mapOtpRecord(data);
  }

  async consumeOtp(
    id: string
  ): Promise<boolean> {

    const { data, error } =
      await supabase.rpc(
        "consume_otp",
        {
          p_id: id
        }
      );

    if (error) {
      throw error;
    }

    return data === true;
  }
}