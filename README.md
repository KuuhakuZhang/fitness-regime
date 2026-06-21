# 循练

手机优先的健身计划与打卡 PWA，无需后端，数据保存在浏览器本机。

## 本地运行

使用项目内置的零依赖预览服务：

```powershell
node server.mjs
```

也可以部署到 GitHub Pages、Cloudflare Pages、Netlify 或任意支持 HTTPS 的静态托管。通过 HTTPS 访问后，浏览器可将应用添加到手机主屏幕。

## 当前功能

- 每周 3 次三分化参考训练 + 1 次灵活活动
- 热身、力量、有氧逐项记录
- 周进度、连续打卡、历史统计与 JSON 导出
- 减脂 / 增肌目标切换
- Mifflin-St Jeor 或 Katch-McArdle 基础代谢估算
- 每日热量和蛋白质、碳水、脂肪建议
- 离线缓存与 PWA 安装

> 训练模板是可编辑的通用参考，并非任何教练发布的官方逐字课表。
