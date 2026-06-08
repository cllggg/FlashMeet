"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductPrizeLua = void 0;
exports.deductPrizeLua = `-- Lua script for atomic prize deduction
-- KEYS[1] = prize stock key (lottery:pool:{pool_id}:prize:{prize_id}:stock)
-- ARGV[1] = amount to deduct (always 1)
-- Returns:
--   >= 0 : remaining stock after deduction (成功)
--   -1   : 库存为空
--   -2   : 库存 key 不存在（奖品未初始化）

local stock_str = redis.call('GET', KEYS[1])
if stock_str == false then
  return -2
end
local stock = tonumber(stock_str)
if stock == nil or stock <= 0 then
  return -1
end
local new_stock = redis.call('DECRBY', KEYS[1], 1)
return new_stock
`;
//# sourceMappingURL=index.js.map