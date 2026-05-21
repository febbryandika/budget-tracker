import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (url && !token) {
  throw new Error('UPSTASH_REDIS_REST_URL is set but UPSTASH_REDIS_REST_TOKEN is missing')
}

export const redis: Redis | null = url && token ? new Redis({ url, token }) : null
