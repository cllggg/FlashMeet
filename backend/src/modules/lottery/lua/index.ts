import * as fs from 'fs';
import * as path from 'path';

const luaPath = path.join(__dirname, 'lua', 'deduct-prize.lua');
const deductPrizeLua = fs.readFileSync(luaPath, 'utf8');

export { deductPrizeLua };
