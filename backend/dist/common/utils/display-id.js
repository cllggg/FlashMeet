"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDisplayId = generateDisplayId;
exports.isValidDisplayIdFormat = isValidDisplayIdFormat;
const DIGIT_LEN = 4;
const MAX_RETRY = 5;
function sanitizeName(name) {
    const fallback = 'Star';
    if (!name)
        return fallback;
    const cleaned = name.trim().replace(/[\s#]+/g, '');
    if (!cleaned)
        return fallback;
    const sliced = Array.from(cleaned).slice(0, 4).join('');
    return sliced || fallback;
}
function genOne(name) {
    const n = sanitizeName(name);
    const digits = Math.floor(Math.random() * 10_000)
        .toString()
        .padStart(DIGIT_LEN, '0');
    return `${n}#${digits}`;
}
function generateDisplayId(name, existing) {
    for (let i = 0; i < MAX_RETRY; i++) {
        const candidate = genOne(name);
        if (!existing.has(candidate))
            return candidate;
    }
    const ts = Date.now() % 10_000;
    const n = sanitizeName(name);
    return `${n}#${ts.toString().padStart(DIGIT_LEN, '0')}`;
}
function isValidDisplayIdFormat(id) {
    if (!id)
        return false;
    if (id.length > 32)
        return false;
    const idx = id.indexOf('#');
    if (idx < 1 || idx > 16)
        return false;
    const tail = id.slice(idx + 1);
    return /^\d{4}$/.test(tail);
}
//# sourceMappingURL=display-id.js.map