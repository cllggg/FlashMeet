"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STREAM_TIMELINE = void 0;
const event_status_enum_1 = require("../../common/enums/event-status.enum");
exports.STREAM_TIMELINE = [
    event_status_enum_1.EventStatus.STANDBY,
    event_status_enum_1.EventStatus.CHECKIN,
    event_status_enum_1.EventStatus.ICEBREAKER,
    event_status_enum_1.EventStatus.LOTTERY_READY,
    event_status_enum_1.EventStatus.LOTTERY_RUNNING,
    event_status_enum_1.EventStatus.GAME_SHAKE,
    event_status_enum_1.EventStatus.GAME_MATCH,
    event_status_enum_1.EventStatus.ENDED,
];
//# sourceMappingURL=experience-stream.types.js.map