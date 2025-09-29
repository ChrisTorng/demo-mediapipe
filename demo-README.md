# MediaPipe 虛擬眼鏡試戴示範

一個使用 Google MediaPipe 的即時虛擬眼鏡試戴網站！

## 🚀 快速開始

1. **啟動服務器**：
   ```bash
   python3 -m http.server 8080
   ```
   或使用 npm：
   ```bash
   npm start
   ```

2. **開啟瀏覽器**：
   前往 http://localhost:8080

3. **允許攝影機權限並開始體驗**！

## ✨ 主要特色

- 🎯 **即時人臉檢測** - 使用 MediaPipe Face Detection
- 🕶️ **多種眼鏡樣式** - 6種2D平面 + 2種3D立體眼鏡
- 🎨 **雙重渲染技術** - Canvas 2D 和 Three.js WebGL
- 📐 **立體視覺效果** - 真實的3D眼鏡模型
- 📱 **響應式設計** - 支援桌面和手機
- ⚡ **高效能處理** - 顯示即時 FPS
- 🎨 **美觀介面** - 現代化設計

## 🛠️ 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: Google MediaPipe Face Detection
- **圖像處理**: Canvas API
- **視訊**: WebRTC Camera API

## 📁 專案結構

```
demo-mediapipe/
├── index.html          # 主頁面
├── style.css           # 樣式表  
├── script.js           # 核心邏輯
├── package.json        # 專案配置
└── README.md           # 說明文件
```

## 🎮 使用方法

1. 點擊「開啟攝影機」按鈕
2. 允許瀏覽器存取攝影機
3. 確保臉部完整在畫面中
4. 選擇不同眼鏡樣式試戴
5. 享受即時 AR 體驗！

## 🔧 自訂開發

### 添加新眼鏡樣式

1. 在 `script.js` 的 `loadGlassesImages()` 新增樣式
2. 實作對應的繪圖函數
3. 在 HTML 下拉選單添加選項

### 調整檢測參數

```javascript
this.faceDetection.setOptions({
    model: 'short',                 // 'short' 或 'full'
    minDetectionConfidence: 0.5,    // 0.0 - 1.0
});
```

## 📋 系統需求

### 瀏覽器支援
- Chrome 88+ ✅
- Firefox 85+ ✅  
- Safari 14+ ✅
- Edge 88+ ✅

### 硬體需求
- 網路攝影機 📹
- 現代CPU (支援即時影像處理) 💻

## 🐛 問題排除

| 問題 | 解決方案 |
|------|----------|
| 攝影機無法開啟 | 檢查瀏覽器權限設定 |
| 檢測不準確 | 確保光線充足，臉部正面朝向 |
| 效能問題 | 關閉其他應用程式，使用支援硬體加速的瀏覽器 |

## 📚 學習資源

- [MediaPipe 官方文檔](https://mediapipe.dev/)
- [Face Detection 指南](https://google.github.io/mediapipe/solutions/face_detection.html)
- [Canvas API 參考](https://developer.mozilla.org/docs/Web/API/Canvas_API)

## 📄 授權

MIT License - 歡迎學習與修改！

---

**享受您的 AR 眼鏡試戴體驗！** 🕶️✨