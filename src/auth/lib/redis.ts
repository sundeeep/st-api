import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true,
});

redis.on("error", (err) => console.error("❌ Redis Error:", err.message));
redis.on("ready", () => console.log("✅ Redis connected"));

// Connect on startup
redis.connect().catch((err) => {
  console.error("❌ Failed to connect to Redis:", err.message);
});

export default redis;
