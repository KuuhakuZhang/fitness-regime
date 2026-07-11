# 循练

手机优先的健身计划与打卡 PWA，无需后端，数据保存在浏览器本机。

## 在线使用

访问：<https://kuuhakuzhang.github.io/fitness-regime/>

- iPhone / iPad：使用 Safari 打开，点击“分享” -> “添加到主屏幕”。
- Android：使用 Chrome 打开，点击菜单 -> “安装应用”或“添加到主屏幕”。

安装后可像普通 App 一样从桌面启动，并在首次加载后离线使用主要功能。

## 本地运行

使用项目内置的零依赖预览服务：

```powershell
node server.mjs
```

也可以部署到 GitHub Pages、Cloudflare Pages、Netlify 或任意支持 HTTPS 的静态托管。通过 HTTPS 访问后，浏览器可将应用添加到手机主屏幕。

## 当前功能

- 可从空白创建当日训练计划，不必限定在固定菜单
- 胸、中束 / 背、后束 / 肩部 / 腿部模板可一键套用并继续编辑
- 可自行填写运动项目、具体动作、组次、重量或备注
- 可选自由活动日与练后有氧记录
- 周进度、连续打卡、历史统计与 JSON 导出
- 减脂 / 增肌目标切换
- Mifflin-St Jeor 或 Katch-McArdle 基础代谢估算
- 每日热量和蛋白质、碳水、脂肪建议
- 离线缓存与 PWA 安装
