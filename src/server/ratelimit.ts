import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const basicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Used for single image uploads and other image endpoints open to non plus user
export const singleImageRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// Used for plus locked down endpoints like task instructions or completion images
export const multiImageRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "30 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export const supportRequestRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "60 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
