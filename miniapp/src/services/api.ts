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
  update: (eventId: string, data: any) =>
    request({ url: `/event/${eventId}`, method: 'PATCH', data }),
  publish: (eventId: string) =>
    request({ url: `/event/${eventId}/publish`, method: 'POST' }),
  changeScene: (eventId: string, targetState: string) =>
    request({ url: `/event/${eventId}/change_scene`, method: 'POST', data: { target_state: targetState } }),
  shake: (eventId: string, count: number) =>
    request({ url: `/event/${eventId}/shake`, method: 'POST', data: { count } }),
  getMyEvents: () =>
    request({ url: '/event/host/my' }),
};

export const checkinApi = {
  checkIn: (eventId: string, localTags?: string[]) =>
    request({ url: '/checkin', method: 'POST', data: { event_id: eventId, local_tags: localTags } }),
  getCheckins: (eventId: string) =>
    request({ url: `/checkin/event/${eventId}` }),
  updateTags: (eventId: string, tags: string[]) =>
    request({ url: `/checkin/event/${eventId}/tags`, method: 'PUT', data: { tags } }),
};

export const lotteryApi = {
  createPool: (data: any) =>
    request({ url: '/lottery/pool', method: 'POST', data }),
  draw: (eventId: string, poolId: string, requestId?: string) =>
    request({ url: '/lottery/draw', method: 'POST', data: { event_id: eventId, pool_id: poolId, request_id: requestId } }),
  getPools: (eventId: string) =>
    request({ url: `/lottery/${eventId}/pools` }),
  getWinners: (eventId: string) =>
    request({ url: `/lottery/${eventId}/winners` }),
};
