import request from './request';

export const authApi = {
  wechatLogin: (code: string) =>
    request({ url: '/auth/wechat', method: 'POST', data: { code } }),
};

export const eventApi = {
  create: (data: any) =>
    request({ url: '/event', method: 'POST', data }),
  getOne: (eventId: string) =>
    request({ url: `/event/${eventId}` }),
  getCurrentState: (eventId: string) =>
    request({ url: `/event/${eventId}/current_state` }),
  getAllowedTransitions: (eventId: string) =>
    request({ url: `/event/${eventId}/allowed_transitions` }),
  update: (eventId: string, data: any) =>
    request({ url: `/event/${eventId}`, method: 'PATCH', data }),
  publish: (eventId: string) =>
    request({ url: `/event/${eventId}/publish`, method: 'POST' }),
  changeScene: (eventId: string, targetState: string) =>
    request({ url: `/event/${eventId}/change_scene`, method: 'POST', data: { target_state: targetState } }),
  shake: (eventId: string, count: number) =>
    request({ url: `/event/${eventId}/shake`, method: 'POST', data: { count } }),
  shakeSession: (eventId: string) =>
    request({ url: `/screen/event/${eventId}/shake-session` }),
  getMyEvents: () =>
    request({ url: '/event/host/my' }),
  getPresence: (eventId: string) =>
    request({ url: `/event/${eventId}/presence` }),
  // v2.0 体验流
  getStream: (eventId: string) =>
    request({ url: `/event/${eventId}/stream` }),
  // v2.0 Host Assistant：服务端建议（与本地规则等价但便于接 AI）
  getSuggestions: (eventId: string) =>
    request({ url: `/event/${eventId}/suggestions` }),
};

export const checkinApi = {
  checkIn: (eventId: string, localTags?: string[], displayId?: string) =>
    request({
      url: '/checkin',
      method: 'POST',
      data: {
        event_id: eventId,
        local_tags: localTags,
        display_id: displayId,
      },
    }),
  guestCheckIn: (
    eventId: string,
    name: string,
    phone: string,
    extras?: { displayId?: string; avatarUrl?: string; userToken?: string },
  ) =>
    request({
      url: '/checkin/guest',
      method: 'POST',
      data: {
        event_id: eventId,
        name,
        phone,
        display_id: extras?.displayId,
        avatar_url: extras?.avatarUrl,
        // 强身份：让服务端用 user_token 召回同一用户（跨设备、跨活动、跨浏览器也能命中）
        user_token: extras?.userToken,
        local_tags: [],
      },
    }),
  /**
   * 扫码静默召回
   * - X-Device-Token / X-User-Token 已由 request 层自动注入（来自 localStorage）
   * - 返回 found=true → 前端直接进入"已签到"视图
   * - 返回 found=false 但带 user/phone/name → 前端预填表单
   * - 返回体里如有 user_token → 前端必须 saveUserToken
   */
  resolve: (eventId: string, extra?: { phone?: string; userToken?: string }) =>
    request({
      url: '/checkin/resolve',
      method: 'POST',
      data: {
        event_id: eventId,
        // 显式回传：覆盖 header 在某些代理下被剥除的场景
        user_token: extra?.userToken,
        phone: extra?.phone,
      },
    }),
  getCheckins: (eventId: string) =>
    request({ url: `/checkin/event/${eventId}` }),
  getCount: (eventId: string) =>
    request({ url: `/checkin/event/${eventId}/count` }),
  updateTags: (eventId: string, tags: string[]) =>
    request({ url: `/checkin/event/${eventId}/tags`, method: 'PATCH', data: { tags } }),
};

export const lotteryApi = {
  createPool: (data: any) =>
    request({ url: '/lottery/pool', method: 'POST', data }),
  draw: (eventId: string, poolId: string, requestId?: string, count?: number, prePickedUserIds?: string[]) =>
    request({ url: '/lottery/draw', method: 'POST', data: { event_id: eventId, pool_id: poolId, request_id: requestId, count, pre_picked_user_ids: prePickedUserIds } }),
  getPools: (eventId: string) =>
    request({ url: `/lottery/${eventId}/pools` }),
  getWinners: (eventId: string) =>
    request({ url: `/lottery/${eventId}/winners` }),
};

export const icebreakerApi = {
  create: (data: any) =>
    request({ url: '/icebreaker/question', method: 'POST', data }),
  publish: (questionId: string) =>
    request({ url: `/icebreaker/question/${questionId}/publish`, method: 'POST' }),
  close: (eventId: string) =>
    request({ url: `/icebreaker/event/${eventId}/close`, method: 'POST' }),
  answer: (data: { event_id: string; question_id: string; option_key: string }) =>
    request({ url: '/icebreaker/answer', method: 'POST', data }),
  /** Guest 答题（扫码用户无 JWT，通过 X-Device-Token / X-User-Token 自动注入） */
  answerGuest: (data: { event_id: string; question_id: string; option_key: string }) =>
    request({ url: '/icebreaker/answer/guest', method: 'POST', data }),
  list: (eventId: string) =>
    request({ url: `/icebreaker/event/${eventId}/questions` }),
  getCurrent: (eventId: string) =>
    request({ url: `/icebreaker/event/${eventId}/current` }),
};

export const matchApi = {
  getMatches: (eventId: string) =>
    request({ url: `/match/event/${eventId}` }),
  generate: (eventId: string) =>
    request({ url: `/match/event/${eventId}/generate`, method: 'POST' }),
  accept: (eventId: string, user_id: string) =>
    request({ url: `/match/event/${eventId}/accept`, method: 'POST', data: { user_id } }),
  reject: (eventId: string, user_id: string) =>
    request({ url: `/match/event/${eventId}/reject`, method: 'POST', data: { user_id } }),
  getMessages: (matchId: string) =>
    request({ url: `/match/chat/${matchId}/messages` }),
  sendMessage: (matchId: string, sender_id: string, content: string) =>
    request({ url: `/match/chat/${matchId}/send`, method: 'POST', data: { sender_id, content } }),
  getTopMatches: (eventId: string, userId: string) =>
    request({ url: `/match/event/${eventId}/top?user_id=${userId}` }),
};
