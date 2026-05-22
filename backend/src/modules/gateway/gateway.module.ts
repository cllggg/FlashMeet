import { Module, forwardRef } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { EventModule } from '../event/event.module';

@Module({
  imports: [forwardRef(() => EventModule)],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class GatewayModule {}
