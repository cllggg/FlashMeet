"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostAssistantModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const checkin_entity_1 = require("../checkin/entities/checkin.entity");
const event_entity_1 = require("../event/entities/event.entity");
const event_module_1 = require("../event/event.module");
const host_assistant_controller_1 = require("./host-assistant.controller");
const host_assistant_service_1 = require("./host-assistant.service");
let HostAssistantModule = class HostAssistantModule {
};
exports.HostAssistantModule = HostAssistantModule;
exports.HostAssistantModule = HostAssistantModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([checkin_entity_1.CheckIn, event_entity_1.Event]), event_module_1.EventModule],
        controllers: [host_assistant_controller_1.HostAssistantController],
        providers: [host_assistant_service_1.HostAssistantService],
        exports: [host_assistant_service_1.HostAssistantService],
    })
], HostAssistantModule);
//# sourceMappingURL=host-assistant.module.js.map