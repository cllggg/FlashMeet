import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { BlindChatService } from './chat.service';

@Controller('match/chat')
export class BlindChatController {
  constructor(private readonly chatService: BlindChatService) {}

  @Get(':match_id/messages')
  async getMessages(@Param('match_id') matchId: string) {
    return this.chatService.getMessages(matchId);
  }

  @Post(':match_id/send')
  async sendMessage(
    @Param('match_id') matchId: string,
    @Body() body: { sender_id: string; content: string },
  ) {
    return this.chatService.sendMessage(matchId, body.sender_id, body.content);
  }
}