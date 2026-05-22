import { Controller, Get, Param, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { Event } from '../event/entities/event.entity';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

@Controller()
export class PublicController {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  @Get('e/:event_id')
  async checkinPage(@Param('event_id') eventId: string, @Res() res: Response) {
    const event = await this.eventRepo.findOne({ where: { event_id: eventId } });
    const title = event?.title || '聚闪耀';
    const state = event?.current_state || 'STATUS_STANDBY';
    const location = event?.location || '';

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${escapeHtml(title)} - 聚闪耀签到</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a2e 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .card {
      text-align: center; padding: 32px 28px; max-width: 400px; width: 92%;
      background: rgba(255,255,255,0.05); border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .logo { font-size: 36px; font-weight: bold; color: #667eea; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: bold; margin-bottom: 6px; word-break: break-all; }
    .subtitle { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
    .form-group { text-align: left; margin-bottom: 14px; }
    .form-label { display: block; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 6px; padding-left: 4px; }
    .form-input {
      width: 100%; padding: 12px 16px; font-size: 15px; border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px; background: rgba(255,255,255,0.06); color: white;
      outline: none; transition: border-color 0.2s;
    }
    .form-input:focus { border-color: #667eea; }
    .form-input::placeholder { color: rgba(255,255,255,0.25); }
    .avatar-preview { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px;
      background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
      font-size: 32px; color: rgba(255,255,255,0.3); overflow: hidden; }
    .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
    .btn {
      display: block; width: 100%; padding: 16px; font-size: 18px; font-weight: bold;
      border: none; border-radius: 44px; cursor: pointer; margin-bottom: 10px;
      color: white; transition: opacity 0.2s;
    }
    .btn:active { opacity: 0.8; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .btn-secondary { background: rgba(255,255,255,0.08); font-size: 14px; }
    .btn:disabled { opacity: 0.5; pointer-events: none; }
    .error-msg { color: #ff7043; font-size: 13px; margin-top: 4px; text-align: left; padding-left: 4px; }
    .success-msg { 
      margin-top: 16px; padding: 14px; border-radius: 12px;
      background: rgba(102,126,234,0.2); color: #aabbff; font-size: 15px; line-height: 1.6;
    }
    .already-msg {
      margin-top: 16px; padding: 14px; border-radius: 12px;
      background: rgba(255,183,77,0.15); color: #ffb74d; font-size: 15px; line-height: 1.6;
    }
    .avatar-row { display: flex; gap: 10px; align-items: flex-start; }
    .avatar-row .form-group:first-child { flex: 1; }
    .avatar-file-btn {
      display: inline-block; padding: 10px 18px; font-size: 14px;
      border: 1px dashed rgba(255,255,255,0.25); border-radius: 12px;
      background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6);
      cursor: pointer; text-align: center; margin-top: 6px;
    }
    .avatar-file-btn:active { background: rgba(255,255,255,0.1); }
    #avatarFileInput { display: none; }
    .avatar-switch { font-size: 12px; color: rgba(255,255,255,0.35); cursor: pointer; margin-top: 8px; }
    .avatar-switch:hover { color: rgba(255,255,255,0.6); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">聚闪耀</div>
    <div class="title">${escapeHtml(title)}</div>
    <div class="subtitle">${location ? escapeHtml(location) + ' · ' : ''}输入信息签到上墙</div>

    <!-- Avatar preview -->
    <div class="avatar-preview" id="avatarPreview">?</div>

    <div class="form-group" style="text-align:center">
      <label class="form-label" style="text-align:center">点击选择头像</label>
      <label class="avatar-file-btn" for="avatarFileInput">从相册选取照片</label>
      <input type="file" id="avatarFileInput" accept="image/*" onchange="onAvatarFilePicked(this)">
      <div class="avatar-switch" onclick="toggleUrlMode()">或者粘贴头像URL</div>
      <input class="form-input" id="avatarInput" type="url" 
             placeholder="粘贴头像URL" 
             oninput="updateAvatarPreview()"
             style="display:none;margin-top:6px;">
    </div>

    <div class="form-group">
      <label class="form-label">姓名</label>
      <input class="form-input" id="nameInput" type="text" 
             placeholder="请输入您的姓名" maxlength="20">
      <div class="error-msg" id="nameError"></div>
    </div>

    <div class="form-group">
      <label class="form-label">手机号</label>
      <input class="form-input" id="phoneInput" type="tel" 
             placeholder="请输入手机号（同一手机号仅可签到一次）" maxlength="11">
      <div class="error-msg" id="phoneError"></div>
    </div>

    <button class="btn btn-primary" id="checkinBtn" onclick="doCheckin()">签到上墙</button>
    <button class="btn btn-secondary" onclick="copyEventId()">复制聚会 ID</button>
    <div id="result"></div>
  </div>
  <script>
    const eventId = '${escapeJs(eventId)}';
    let avatarBase64 = '';

    function onAvatarFilePicked(input) {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('图片不能超过 10MB');
        input.value = '';
        return;
      }
      const img = new Image();
      img.onload = function() {
        const maxSize = 400;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        avatarBase64 = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById('avatarPreview').innerHTML = '<img src="' + avatarBase64 + '" alt="">';
      };
      img.src = URL.createObjectURL(file);
    }

    function toggleUrlMode() {
      const urlInput = document.getElementById('avatarInput');
      const isVisible = urlInput.style.display !== 'none';
      if (isVisible) {
        urlInput.style.display = 'none';
        urlInput.value = '';
        avatarBase64 = '';
        updateAvatarPreview();
      } else {
        urlInput.style.display = 'block';
      }
    }

    function updateAvatarPreview() {
      const url = document.getElementById('avatarInput').value.trim();
      const preview = document.getElementById('avatarPreview');
      if (url) {
        preview.innerHTML = '<img src="' + url + '" alt="" onerror="this.parentElement.innerHTML=\\'?\\'">';
      } else {
        preview.innerHTML = '?';
      }
    }

    function validate() {
      let valid = true;
      const name = document.getElementById('nameInput').value.trim();
      const phone = document.getElementById('phoneInput').value.trim();

      document.getElementById('nameError').textContent = '';
      document.getElementById('phoneError').textContent = '';

      if (!name) {
        document.getElementById('nameError').textContent = '请输入姓名';
        valid = false;
      }
      if (!phone) {
        document.getElementById('phoneError').textContent = '请输入手机号';
        valid = false;
      } else if (!/^1[3-9]\\d{9}$/.test(phone)) {
        document.getElementById('phoneError').textContent = '手机号格式不正确';
        valid = false;
      }
      return valid;
    }

    async function doCheckin() {
      if (!validate()) return;

      const btn = document.getElementById('checkinBtn');
      const result = document.getElementById('result');
      const name = document.getElementById('nameInput').value.trim();
      const phone = document.getElementById('phoneInput').value.trim();
      const avatarUrl = avatarBase64 || document.getElementById('avatarInput').value.trim();

      btn.disabled = true;
      btn.textContent = '签到中...';

      try {
        const apiBase = window.location.origin + '/api';
        const resp = await fetch(apiBase + '/checkin/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId, name, phone, avatar_url: avatarUrl || undefined, local_tags: [] })
        });

        const data = await resp.json();

        if (resp.ok) {
          if (data.isNew) {
            result.innerHTML = '<div class="success-msg">签到成功！<br>你的头像已飞入大屏</div>';
            btn.textContent = '已签到';
            btn.style.background = 'rgba(102,126,234,0.3)';
          } else {
            result.innerHTML = '<div class="already-msg">你已经签到过了，<br>无需重复签到</div>';
            btn.textContent = '已签到';
            btn.style.background = 'rgba(255,183,77,0.2)';
          }
        } else {
          throw new Error(data.message || '签到失败');
        }
      } catch (e) {
        result.innerHTML = '<div style="color:#ff7043;margin-top:16px;font-size:14px;">' + (e.message || '签到失败，请重试') + '</div>';
        btn.disabled = false;
        btn.textContent = '签到上墙';
      }
    }

    function copyEventId() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(eventId).then(function() {
          alert('聚会 ID 已复制');
        });
      } else {
        prompt('聚会 ID:', eventId);
      }
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}