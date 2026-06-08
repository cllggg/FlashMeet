"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = void 0;
exports.isTransitionAllowed = isTransitionAllowed;
const event_status_enum_1 = require("./event-status.enum");
exports.ALLOWED_TRANSITIONS = {
    [event_status_enum_1.EventStatus.STANDBY]: [
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.CHECKIN]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.ICEBREAKER]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.LOTTERY_READY]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.LOTTERY_RUNNING,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.LOTTERY_RUNNING]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.GAME_SHAKE]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.GAME_MATCH,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.GAME_MATCH]: [
        event_status_enum_1.EventStatus.STANDBY,
        event_status_enum_1.EventStatus.CHECKIN,
        event_status_enum_1.EventStatus.ICEBREAKER,
        event_status_enum_1.EventStatus.LOTTERY_READY,
        event_status_enum_1.EventStatus.GAME_SHAKE,
        event_status_enum_1.EventStatus.ENDED,
    ],
    [event_status_enum_1.EventStatus.ENDED]: [event_status_enum_1.EventStatus.STANDBY],
};
function isTransitionAllowed(from, to) {
    if (from === to)
        return true;
    const allowed = exports.ALLOWED_TRANSITIONS[from] || [];
    return allowed.includes(to);
}
//# sourceMappingURL=state-transitions.js.map