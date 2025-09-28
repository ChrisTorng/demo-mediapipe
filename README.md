# MediaPipe 虛擬眼鏡試戴示範

這是一個使用 Google MediaPipe 進行即時人臉檢測並疊加虛擬眼鏡的前端示範網站。

## 功能特色

- 🎯 **即時人臉檢測**：使用 MediaPipe Face Detection 進行高精度人臉檢測
- 🕶️ **虛擬眼鏡疊加**：支援多種眼鏡樣式（經典、太陽眼鏡、圓形）
- 📱 **響應式設計**：支援桌面和行動裝置
- ⚡ **高效能**：即時處理，顯示 FPS 資訊
- 🎨 **美觀界面**：現代化設計與流暢動畫

## 技術特點

- **純前端實現**：無需後端伺服器
- **MediaPipe整合**：使用官方 CDN 版本
- **Canvas繪圖**：自定義眼鏡圖形繪製
- **WebRTC攝影機**：即時視訊串流處理
- **ES6+語法**：現代 JavaScript 開發

## 檔案結構

```
demo-mediapipe/
├── index.html          # 主頁面
├── style.css           # 樣式表
├── script.js           # 主要邏輯
└── README.md           # 說明文件
```

## 使用方法

1. **開啟網站**
   ```bash
   # 使用任何 HTTP 伺服器開啟，例如：
   python3 -m http.server 8000
   # 或
   npx serve .
   ```

2. **允許攝影機權限**
   - 點擊「開啟攝影機」按鈕
   - 瀏覽器會要求攝影機權限，請允許存取

3. **體驗功能**
   - 確保臉部完整出現在畫面中
   - 選擇不同的眼鏡樣式
   - 觀察即時的眼鏡疊加效果

## 系統需求

### 瀏覽器支援
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### 硬體需求
- 網路攝影機
- 適中的CPU效能（用於即時影像處理）

## 眼鏡樣式

目前支援三種眼鏡樣式：

1. **經典眼鏡**：傳統矩形鏡框
2. **太陽眼鏡**：深色鏡片設計
3. **圓形眼鏡**：復古圓形鏡框

## 技術實現細節

### MediaPipe 設定
```javascript
this.faceDetection = new FaceDetection({
    model: 'short',                    // 使用短程模型（較快）
    minDetectionConfidence: 0.5,       // 最小檢測信心度
});
```

### 關鍵點對應
- 0: 右眼
- 1: 左眼  
- 2: 鼻尖
- 3: 嘴中心
- 4: 右耳
- 5: 左耳

### 眼鏡定位算法
1. 取得左右眼座標
2. 計算眼間距離
3. 確定眼鏡中心點
4. 計算旋轉角度
5. 調整眼鏡大小比例

## 效能優化

- **模型選擇**：使用 'short' 模型平衡準確度與速度
- **Canvas優化**：僅在有檢測結果時重繪
- **FPS監控**：即時顯示處理幀率
- **圖像預載**：眼鏡圖片預先載入

## 自定義開發

### 添加新眼鏡樣式
1. 在 `loadGlassesImages()` 中添加新類型
2. 在 `createGlassesImage()` 中添加對應的 case
3. 實現對應的繪製函數
4. 在 HTML select 中添加選項

### 調整檢測參數
```javascript
// 在 initializeMediaPipe() 中修改
this.faceDetection.setOptions({
    model: 'short',                     // 'short' 或 'full'
    minDetectionConfidence: 0.5,        // 0.0 - 1.0
});
```

## 問題排除

### 攝影機無法開啟
- 確認瀏覽器有攝影機權限
- 檢查其他應用程式是否佔用攝影機
- 嘗試重新整理頁面

### 檢測不準確
- 確保光線充足
- 保持臉部正面朝向攝影機
- 調整 `minDetectionConfidence` 參數

### 效能問題
- 關閉其他佔用CPU的應用程式
- 嘗試降低視訊解析度
- 使用支援硬體加速的瀏覽器

## 授權資訊

本專案為教學示範目的，基於 MIT 授權。

MediaPipe 版權歸 Google LLC 所有。

## 參考資源

- [MediaPipe 官方文件](https://mediapipe.dev/)
- [Face Detection Guide](https://google.github.io/mediapipe/solutions/face_detection.html)
- [Canvas API 文件](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)