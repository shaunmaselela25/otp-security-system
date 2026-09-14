import "dotenv/config";

const toNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: toNumber(process.env.PORT, 3000),
    otp: {
        maxRequestsPerHour: toNumber(process.env.OTP_MAX_REQUESTS_PER_HOUR, 3),
        expirySeconds: toNumber(process.env.OTP_EXPIRY_SECONDS, 30),
        resendWindowMinutes: toNumber(process.env.OTP_RESEND_WINDOW_MINUTES, 5),
        maxResends: toNumber(process.env.OTP_MAX_RESENDS, 3),
    },
    supabase: {
        url: process.env.SUPABASE_URL ?? "",
        anonKey: process.env.SUPABASE_ANON_KEY ?? "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
};

