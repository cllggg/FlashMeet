-- Lua script for atomic prize deduction
-- KEYS[1] = prize stock key (lottery:pool:{pool_id}:prize:{prize_id}:stock)
-- ARGV[1] = amount to deduct (always 1)
-- Returns: remaining stock (-1 means out of stock)

local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
if stock <= 0 then
  return -1
end
redis.call('DECRBY', KEYS[1], 1)
return stock - 1
