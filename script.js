// MediaPipe 眼鏡試戴應用程式
class GlassesApp {
    constructor() {
        this.webcam = document.getElementById('webcam');
        this.canvas = document.getElementById('output');
        this.threeCanvas = document.getElementById('threejs-canvas');
        this.debugCanvas = document.getElementById('debug-overlay');
        this.ctx = this.canvas.getContext('2d');
        this.debugCtx = this.debugCanvas.getContext('2d');
        this.statusElement = document.getElementById('status');
        this.fpsElement = document.getElementById('fps');
        
        this.camera = null;
        this.faceDetection = null;
        this.isRunning = false;
        this.currentGlasses = 'classic';
        this.debugMode = false;
        
        // Three.js 3D 渲染
        this.threeScene = null;
        this.threeCamera = null;
        this.threeRenderer = null;
        this.glassesModels = {};
        this.currentGlassesObject = null;
        
        // FPS 計算
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        
        this.initializeMediaPipe();
        this.loadGlassesImages();
        this.initializeThreeJS();
    }
    
    // 初始化 Three.js 3D 渲染器
    initializeThreeJS() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js 尚未載入，無法初始化 3D 渲染');
            this.updateStatus('Three.js 載入失敗，請檢查網路連線或重新整理頁面', 'error');
            return;
        }
        
        try {
            // 創建場景
            this.threeScene = new THREE.Scene();
            
            // 創建攝影機 - 使用正交投影以避免透視失真
            this.threeCamera = new THREE.OrthographicCamera(
                -2,  // left
                2,   // right  
                1.5, // top
                -1.5,// bottom
                0.01,// near
                100  // far
            );
            this.threeCamera.position.set(0, 0, 1); // 攝影機位置
            
            // 創建渲染器 - 使用獨立的3D canvas
            this.threeRenderer = new THREE.WebGLRenderer({
                canvas: this.threeCanvas,
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true
            });
            this.threeRenderer.setSize(this.threeCanvas.width, this.threeCanvas.height);
            this.threeRenderer.setClearColor(0x000000, 0); // 透明背景
            
            // 添加燈光 - 調整光照設定
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 增加環境光
            this.threeScene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
            directionalLight.position.set(0, 1, 1); // 調整光線方向
            this.threeScene.add(directionalLight);
            
            // 添加正面補光
            const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
            frontLight.position.set(0, 0, 1);
            this.threeScene.add(frontLight);
            
            // 載入 3D 眼鏡模型
            this.load3DGlassesModels();
            
            console.log('Three.js 初始化完成');
        } catch (error) {
            console.error('Three.js 初始化失敗:', error);
        }
    }
    
    // 載入 3D 眼鏡模型
    load3DGlassesModels() {
        // 直接創建簡單的3D眼鏡模型，不使用GLTF載入器
        this.create3DGlassesModel('3d-classic', 0x333333);
        this.create3DGlassesModel('3d-modern', 0x1a1a1a);
    }
    
    // 創建 3D 眼鏡模型
    create3DGlassesModel(type, color) {
        const group = new THREE.Group();
        
        // 材質
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const lensMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1
        });
        
        // 增大眼鏡尺寸
        const lensRadius = 0.15;        // 鏡片半徑
        const frameThickness = 0.015;   // 鏡框厚度
        const eyeDistance = 0.32;       // 兩眼距離
        
        // 左鏡框
        const leftFrameGeometry = new THREE.TorusGeometry(lensRadius, frameThickness, 8, 16);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(-eyeDistance/2, 0, 0);
        group.add(leftFrame);
        
        // 左鏡片
        const leftLensGeometry = new THREE.CircleGeometry(lensRadius - frameThickness, 16);
        const leftLens = new THREE.Mesh(leftLensGeometry, lensMaterial);
        leftLens.position.set(-eyeDistance/2, 0, 0.005);
        group.add(leftLens);
        
        // 右鏡框
        const rightFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        rightFrame.position.set(eyeDistance/2, 0, 0);
        group.add(rightFrame);
        
        // 右鏡片
        const rightLens = new THREE.Mesh(leftLensGeometry, lensMaterial);
        rightLens.position.set(eyeDistance/2, 0, 0.005);
        group.add(rightLens);
        
        // 鼻樑 - 調整大小和位置
        const bridgeGeometry = new THREE.CylinderGeometry(0.008, 0.008, eyeDistance * 0.4, 8);
        const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, -lensRadius * 0.3, 0); // 向下移動到鏡片底部
        group.add(bridge);
        
        // 左鏡腳 - 調整長度和角度
        const templeLength = 0.6;
        const templeGeometry = new THREE.CylinderGeometry(0.006, 0.006, templeLength, 8);
        const leftTemple = new THREE.Mesh(templeGeometry, frameMaterial);
        leftTemple.rotation.z = Math.PI / 8;  // 減少角度
        leftTemple.position.set(-eyeDistance/2 - lensRadius + 0.05, 0, -templeLength/3);
        group.add(leftTemple);
        
        // 右鏡腳
        const rightTemple = new THREE.Mesh(templeGeometry, frameMaterial);
        rightTemple.rotation.z = -Math.PI / 8;
        rightTemple.position.set(eyeDistance/2 + lensRadius - 0.05, 0, -templeLength/3);
        group.add(rightTemple);
        
        // 為不同類型添加特殊效果
        if (type === '3d-modern') {
            // 現代眼鏡添加一些反光效果
            const reflectionMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.3
            });
            
            const reflectionSize = lensRadius * 0.6;
            const leftReflection = new THREE.Mesh(
                new THREE.CircleGeometry(reflectionSize, 16),
                reflectionMaterial
            );
            leftReflection.position.set(-eyeDistance/2, lensRadius * 0.3, 0.01);
            group.add(leftReflection);
            
            const rightReflection = new THREE.Mesh(
                new THREE.CircleGeometry(reflectionSize, 16),
                reflectionMaterial
            );
            rightReflection.position.set(eyeDistance/2, lensRadius * 0.3, 0.01);
            group.add(rightReflection);
        }
        
        group.visible = false;
        this.glassesModels[type] = group;
        this.threeScene.add(group);
        
        console.log(`創建了 3D 模型: ${type}`);
    }
    
    // 初始化 MediaPipe
    async initializeMediaPipe() {
        try {
            this.faceDetection = new FaceDetection({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
                }
            });
            
            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5,
            });
            
            this.faceDetection.onResults((results) => {
                this.onResults(results);
            });
            
            this.updateStatus('MediaPipe 初始化完成', 'success');
        } catch (error) {
            console.error('MediaPipe 初始化錯誤:', error);
            this.updateStatus('MediaPipe 初始化失敗', 'error');
        }
    }
    
    // 載入眼鏡圖片
    loadGlassesImages() {
        this.glassesImages = {};
        const glassesTypes = ['classic', 'sunglasses', 'round', 'cat-eye', 'sport', 'square'];
        const svgFilenameMap = {
            classic: 'classic-glasses.svg',
            sunglasses: 'sunglasses.svg',
            round: 'round-glasses.svg',
            'cat-eye': 'cat-eye-glasses.svg',
            sport: 'sport-glasses.svg',
            square: 'square-glasses.svg'
        };
        
        glassesTypes.forEach(type => {
            // 首先嘗試載入 SVG 檔案
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // 如果有 SVG 檔案就使用，否則使用 Canvas 繪製
            const svgPath = `assets/glasses/${svgFilenameMap[type]}`;
            
            img.onload = () => {
                console.log(`${type} 眼鏡圖片載入完成`);
            };
            
            img.onerror = () => {
                console.log(`SVG 載入失敗，使用 Canvas 繪製 ${type}`);
                // 如果 SVG 載入失敗，使用 Canvas 繪製
                img.src = this.createGlassesImage(type);
            };
            
            // 先嘗試載入 SVG
            img.src = svgPath;
            this.glassesImages[type] = img;
        });
    }
    
    // 創建眼鏡圖片 (使用 Canvas 繪製)
    createGlassesImage(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // 根據類型繪製不同的眼鏡
        switch (type) {
            case 'classic':
                this.drawClassicGlasses(ctx, canvas.width, canvas.height);
                break;
            case 'sunglasses':
                this.drawSunglasses(ctx, canvas.width, canvas.height);
                break;
            case 'round':
                this.drawRoundGlasses(ctx, canvas.width, canvas.height);
                break;
            case 'cat-eye':
                this.drawCatEyeGlasses(ctx, canvas.width, canvas.height);
                break;
            case 'sport':
                this.drawSportGlasses(ctx, canvas.width, canvas.height);
                break;
            case 'square':
                this.drawSquareGlasses(ctx, canvas.width, canvas.height);
                break;
        }
        
        return canvas.toDataURL();
    }
    
    // 繪製經典眼鏡
    drawClassicGlasses(ctx, width, height) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // 左鏡片
        ctx.beginPath();
        ctx.roundRect(20, 25, 80, 50, 8);
        ctx.fill();
        ctx.stroke();
        
        // 右鏡片
        ctx.beginPath();
        ctx.roundRect(200, 25, 80, 50, 8);
        ctx.fill();
        ctx.stroke();
        
        // 鼻樑
        ctx.beginPath();
        ctx.moveTo(100, 45);
        ctx.lineTo(200, 45);
        ctx.stroke();
        
        // 鏡腳 (簡化版)
        ctx.beginPath();
        ctx.moveTo(20, 35);
        ctx.lineTo(5, 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(280, 35);
        ctx.lineTo(295, 30);
        ctx.stroke();
    }
    
    // 繪製太陽眼鏡
    drawSunglasses(ctx, width, height) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        
        // 左鏡片
        ctx.beginPath();
        ctx.roundRect(20, 25, 80, 50, 8);
        ctx.fill();
        ctx.stroke();
        
        // 右鏡片
        ctx.beginPath();
        ctx.roundRect(200, 25, 80, 50, 8);
        ctx.fill();
        ctx.stroke();
        
        // 鼻樑
        ctx.beginPath();
        ctx.moveTo(100, 45);
        ctx.lineTo(200, 45);
        ctx.stroke();
        
        // 鏡腳
        ctx.beginPath();
        ctx.moveTo(20, 35);
        ctx.lineTo(5, 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(280, 35);
        ctx.lineTo(295, 30);
        ctx.stroke();
    }
    
    // 繪製圓形眼鏡
    drawRoundGlasses(ctx, width, height) {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // 左鏡片 (圓形)
        ctx.beginPath();
        ctx.arc(60, 50, 35, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 右鏡片 (圓形)
        ctx.beginPath();
        ctx.arc(240, 50, 35, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 鼻樑
        ctx.beginPath();
        ctx.moveTo(95, 45);
        ctx.lineTo(205, 45);
        ctx.stroke();
        
        // 鏡腳
        ctx.beginPath();
        ctx.moveTo(25, 40);
        ctx.lineTo(10, 35);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(275, 40);
        ctx.lineTo(290, 35);
        ctx.stroke();
    }
    
    // 繪製貓眼眼鏡
    drawCatEyeGlasses(ctx, width, height) {
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // 左鏡片 (貓眼形狀)
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.quadraticCurveTo(50, 25, 100, 30);
        ctx.quadraticCurveTo(130, 35, 130, 50);
        ctx.quadraticCurveTo(130, 65, 100, 70);
        ctx.quadraticCurveTo(50, 75, 20, 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 右鏡片 (貓眼形狀)
        ctx.beginPath();
        ctx.moveTo(170, 50);
        ctx.quadraticCurveTo(200, 25, 250, 30);
        ctx.quadraticCurveTo(280, 35, 280, 50);
        ctx.quadraticCurveTo(280, 65, 250, 70);
        ctx.quadraticCurveTo(200, 75, 170, 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 鼻樑
        ctx.beginPath();
        ctx.moveTo(130, 50);
        ctx.lineTo(170, 50);
        ctx.stroke();
        
        // 裝飾
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.arc(30, 40, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(270, 40, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 繪製運動眼鏡
    drawSportGlasses(ctx, width, height) {
        ctx.strokeStyle = '#003366';
        ctx.lineWidth = 4;
        
        // 創建漸層
        const gradient = ctx.createLinearGradient(0, 25, 0, 75);
        gradient.addColorStop(0, 'rgba(0, 102, 204, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 68, 153, 0.9)');
        ctx.fillStyle = gradient;
        
        // 一體式鏡片
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.quadraticCurveTo(40, 25, 100, 30);
        ctx.quadraticCurveTo(150, 20, 200, 30);
        ctx.quadraticCurveTo(260, 25, 280, 50);
        ctx.quadraticCurveTo(280, 70, 260, 75);
        ctx.quadraticCurveTo(200, 80, 150, 80);
        ctx.quadraticCurveTo(100, 80, 40, 75);
        ctx.quadraticCurveTo(20, 70, 20, 50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 反光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(80, 45, 25, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(220, 45, 25, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 繪製方形粗框眼鏡
    drawSquareGlasses(ctx, width, height) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.fillStyle = 'rgba(240, 240, 240, 0.05)';
        
        // 左鏡片
        ctx.beginPath();
        ctx.roundRect(25, 30, 100, 50, 5);
        ctx.fill();
        ctx.stroke();
        
        // 右鏡片
        ctx.beginPath();
        ctx.roundRect(175, 30, 100, 50, 5);
        ctx.fill();
        ctx.stroke();
        
        // 粗鼻樑
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(125, 50, 50, 8, 4);
        ctx.fill();
        
        // 粗鏡腳
        ctx.beginPath();
        ctx.roundRect(15, 47, 25, 6, 3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(260, 47, 25, 6, 3);
        ctx.fill();
    }
    
    // 開始攝影機
    async startCamera() {
        try {
            this.updateStatus('正在開啟攝影機...', '');
            document.getElementById('startBtn').disabled = true;
            
            this.camera = new Camera(this.webcam, {
                onFrame: async () => {
                    if (this.faceDetection && this.isRunning) {
                        await this.faceDetection.send({image: this.webcam});
                    }
                },
                width: 640,
                height: 480
            });
            
            await this.camera.start();
            this.isRunning = true;
            
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            this.updateStatus('攝影機已開啟，正在檢測人臉...', 'success');
            
        } catch (error) {
            console.error('攝影機開啟錯誤:', error);
            this.updateStatus('無法開啟攝影機，請檢查權限設定', 'error');
            document.getElementById('startBtn').disabled = false;
        }
    }
    
    // 停止攝影機
    stopCamera() {
        this.isRunning = false;
        
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        
        // 清除 canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        this.updateStatus('攝影機已停止', '');
    }
    
    // 處理檢測結果
    onResults(results) {
        this.calculateFPS();
        
        // 檢查是否使用3D模型
        const is3D = this.currentGlasses.startsWith('3d-');
        
        if (is3D) {
            // 使用 Three.js 渲染 3D 模型
            this.render3DGlasses(results);
        } else {
            // 顯示2D canvas，隱藏3D canvas和除錯覆蓋層
            this.canvas.style.display = 'block';
            this.threeCanvas.style.display = 'none';
            this.debugCanvas.style.display = 'none';
            
            // 清除 canvas 用於 2D 渲染
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 繪製檢測到的人臉和2D眼鏡
            if (results.detections && results.detections.length > 0) {
                let successCount = 0;
                results.detections.forEach((detection, index) => {
                    try {
                        this.drawGlasses(detection);
                        successCount++;
                        
                        // 除錯模式：繪製人臉框架和關鍵點
                        if (this.debugMode) {
                            this.drawFaceBox(detection);
                            this.drawKeypoints(detection);
                        }
                    } catch (error) {
                        console.warn(`繪製第 ${index + 1} 個人臉失敗:`, error);
                    }
                });
                
                if (successCount > 0) {
                    if (this.debugMode) {
                        this.updateStatus(`2D 眼鏡已套用 (除錯模式開啟)`, 'success');
                    } else {
                        this.updateStatus(`成功檢測並繪製 ${successCount} 張人臉`, 'success');
                    }
                } else {
                    this.updateStatus(`檢測到 ${results.detections.length} 張人臉，但繪製失敗`, 'error');
                }
            } else {
                this.updateStatus('未檢測到人臉，請確保臉部在畫面中', '');
            }
        }
    }
    
    // 渲染 3D 眼鏡
    render3DGlasses(results) {
        // 顯示3D canvas，隱藏2D canvas
        this.threeCanvas.style.display = 'block';
        this.canvas.style.display = 'none';
        
        // 清除3D場景中的所有眼鏡
        Object.values(this.glassesModels).forEach(model => {
            if (model) model.visible = false;
        });
        
        if (results.detections && results.detections.length > 0) {
            // 只處理第一個檢測到的人臉
            const detection = results.detections[0];
            const model = this.glassesModels[this.currentGlasses];
            
            if (model) {
                // 計算3D眼鏡位置
                const position = this.calculate3DGlassesPosition(detection);
                if (position) {
                    model.visible = true;
                    model.position.copy(position.position);
                    model.rotation.copy(position.rotation);
                    model.scale.copy(position.scale);
                    
                    // 除錯模式：使用統一的2D除錯方法
                    if (this.debugMode) {
                        this.draw3DDebugOverlay(detection);
                        this.updateStatus(`3D 眼鏡已套用 (除錯模式開啟)`, 'success');
                    } else {
                        // 非除錯模式下隱藏除錯覆蓋層
                        this.debugCanvas.style.display = 'none';
                        this.updateStatus(`3D 眼鏡已套用`, 'success');
                    }
                } else {
                    this.updateStatus('無法定位3D眼鏡位置', 'error');
                }
            } else {
                this.updateStatus('3D 模型載入中...', '');
            }
        } else {
            this.updateStatus('未檢測到人臉，請確保臉部在畫面中', '');
        }
        
        // 渲染3D場景
        if (this.threeRenderer && this.threeScene && this.threeCamera) {
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        }
    }
    
    // 在3D模式下使用2D的除錯繪製方法
    draw3DDebugOverlay(detection) {
        // 顯示除錯覆蓋層
        this.debugCanvas.style.display = 'block';
        
        // 清除除錯canvas
        this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        
        // 暫時儲存原始canvas和context，以便重用2D方法
        const originalCanvas = this.canvas;
        const originalCtx = this.ctx;
        
        // 暫時替換為除錯canvas的context
        this.canvas = this.debugCanvas;
        this.ctx = this.debugCtx;
        
        // 直接調用2D的除錯方法
        this.drawFaceBox(detection);
        this.drawKeypoints(detection);
        
        // 恢復原始canvas和context
        this.canvas = originalCanvas;
        this.ctx = originalCtx;
    }
    
    // 計算 3D 眼鏡位置
    calculate3DGlassesPosition(detection) {
        // 處理不同版本的 MediaPipe API 結構
        let keypoints;
        if (detection.locationData && detection.locationData.relativeKeypoints) {
            keypoints = detection.locationData.relativeKeypoints;
        } else if (detection.keypoints) {
            keypoints = detection.keypoints;
        } else if (detection.landmarks) {
            keypoints = detection.landmarks;
        }
        
        if (!keypoints || keypoints.length < 6) return null;
        
        const rightEye = keypoints[0];
        const leftEye = keypoints[1];
        const nose = keypoints[2];
        
        if (!rightEye || !leftEye) return null;
        
        // 使用與2D眼鏡完全相同的座標計算邏輯
        const canvasWidth = this.threeCanvas.width;
        const canvasHeight = this.threeCanvas.height;
        
        // 考慮鏡像效果翻轉座標（與2D完全相同）
        const rightEyeX = (1 - rightEye.x) * canvasWidth;
        const rightEyeY = rightEye.y * canvasHeight;
        const leftEyeX = (1 - leftEye.x) * canvasWidth;
        const leftEyeY = leftEye.y * canvasHeight;
        
        // 計算眼鏡中心位置（像素座標）
        const centerX = (rightEyeX + leftEyeX) / 2;
        const centerY = (rightEyeY + leftEyeY) / 2;
        
        // 計算眼間距離（像素）
        const eyeDistancePixels = Math.sqrt(
            Math.pow(leftEyeX - rightEyeX, 2) + 
            Math.pow(leftEyeY - rightEyeY, 2)
        );
        
        // 將像素座標直接線性映射到Three.js世界座標
        // 建立一個1:1的映射關係，確保與2D版本位置完全一致
        const worldX = (centerX - canvasWidth/2) * (4.0 / canvasWidth);   // 標準化到[-2,2]範圍
        const worldY = -(centerY - canvasHeight/2) * (3.0 / canvasHeight); // 標準化到[-1.5,1.5]範圍，Y軸翻轉
        const worldZ = 0; // 眼鏡位於Z=0平面
        
        // 根據眼間距離計算縮放（與2D邏輯相同）
        const referenceEyeDistance = 100; // 參考像素距離
        const scaleRatio = eyeDistancePixels / referenceEyeDistance;
        const glassesScale = Math.max(0.5, Math.min(2.0, scaleRatio));
        
        // 計算旋轉角度（與2D邏輯相同）
        const rotationZ = -Math.atan2(leftEyeY - rightEyeY, leftEyeX - rightEyeX);
        
        return {
            position: new THREE.Vector3(worldX, worldY, worldZ),
            rotation: new THREE.Euler(0, 0, rotationZ),
            scale: new THREE.Vector3(glassesScale, glassesScale, glassesScale)
        };
    }
    
    // 繪製眼鏡
    drawGlasses(detection) {
        // 處理不同版本的 MediaPipe API 結構
        let keypoints;
        if (detection.locationData && detection.locationData.relativeKeypoints) {
            keypoints = detection.locationData.relativeKeypoints;
        } else if (detection.keypoints) {
            keypoints = detection.keypoints;
        } else if (detection.landmarks) {
            keypoints = detection.landmarks;
        } else {
            console.log('Detection structure:', detection);
            return;
        }
        
        if (!keypoints || keypoints.length < 6) {
            console.log('Insufficient keypoints:', keypoints?.length);
            return;
        }
        
        // MediaPipe 人臉關鍵點：
        // 0: 右眼, 1: 左眼, 2: 鼻尖, 3: 嘴中心, 4: 右耳, 5: 左耳
        const rightEye = keypoints[0];
        const leftEye = keypoints[1];
        const nose = keypoints[2];
        
        if (!rightEye || !leftEye) {
            console.log('Missing eye keypoints, trying fallback method');
            // 使用邊界框估算眼睛位置的後備方案
            this.drawGlassesFallback(detection);
            return;
        }
        
        // 轉換為 canvas 座標（考慮鏡像效果）
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 因為視訊是鏡像顯示，需要翻轉 X 座標
        const rightEyeX = (1 - rightEye.x) * canvasWidth;  // 翻轉 X 座標
        const rightEyeY = rightEye.y * canvasHeight;
        const leftEyeX = (1 - leftEye.x) * canvasWidth;    // 翻轉 X 座標
        const leftEyeY = leftEye.y * canvasHeight;
        
        // 計算眼鏡位置和大小
        const eyeDistance = Math.sqrt(
            Math.pow(leftEyeX - rightEyeX, 2) + 
            Math.pow(leftEyeY - rightEyeY, 2)
        );
        
        const glassesWidth = eyeDistance * 2.2;
        const glassesHeight = glassesWidth * 0.33;
        
        // 眼鏡中心點
        const centerX = (rightEyeX + leftEyeX) / 2;
        const centerY = (rightEyeY + leftEyeY) / 2 - eyeDistance * 0.1;
        
        // 計算旋轉角度
        const angle = Math.atan2(leftEyeY - rightEyeY, leftEyeX - rightEyeX);
        
        // 繪製眼鏡
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(angle);
        
        const glassesImg = this.glassesImages[this.currentGlasses];
        if (glassesImg && glassesImg.complete) {
            this.ctx.drawImage(
                glassesImg,
                -glassesWidth / 2,
                -glassesHeight / 2,
                glassesWidth,
                glassesHeight
            );
        }
        
        this.ctx.restore();
    }
    
    // 後備眼鏡繪製方法（當關鍵點不可用時）
    drawGlassesFallback(detection) {
        // 處理不同版本的 MediaPipe API 結構
        let box;
        if (detection.locationData && detection.locationData.relativeBoundingBox) {
            box = detection.locationData.relativeBoundingBox;
        } else if (detection.boundingBox) {
            box = detection.boundingBox;
        } else {
            console.log('No bounding box available for fallback');
            return;
        }
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 使用邊界框估算眼鏡位置（考慮鏡像效果）
        const faceX = (1 - box.xMin - box.width) * canvasWidth;  // 翻轉 X 座標
        const faceY = box.yMin * canvasHeight;
        const faceWidth = box.width * canvasWidth;
        const faceHeight = box.height * canvasHeight;
        
        // 估算眼鏡位置（基於一般人臉比例）
        const glassesWidth = faceWidth * 0.8;
        const glassesHeight = glassesWidth * 0.33;
        const centerX = faceX + faceWidth * 0.5;
        const centerY = faceY + faceHeight * 0.35; // 眼睛大約在臉部上方 35% 的位置
        
        // 繪製眼鏡（無旋轉）
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        const glassesImg = this.glassesImages[this.currentGlasses];
        if (glassesImg && glassesImg.complete) {
            this.ctx.drawImage(
                glassesImg,
                -glassesWidth / 2,
                -glassesHeight / 2,
                glassesWidth,
                glassesHeight
            );
        }
        
        this.ctx.restore();
    }
    
    // 繪製人臉框架（調試用）
    drawFaceBox(detection) {
        // 處理不同版本的 MediaPipe API 結構
        let box;
        if (detection.locationData && detection.locationData.relativeBoundingBox) {
            box = detection.locationData.relativeBoundingBox;
        } else if (detection.boundingBox) {
            box = detection.boundingBox;
        } else {
            return;
        }
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // 考慮鏡像效果翻轉座標
        const x = (1 - box.xMin - box.width) * canvasWidth;  // 翻轉 X 座標
        const y = box.yMin * canvasHeight;
        const width = box.width * canvasWidth;
        const height = box.height * canvasHeight;
        
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    // 繪製關鍵點（調試用）
    drawKeypoints(detection) {
        // 處理不同版本的 MediaPipe API 結構
        let keypoints;
        if (detection.locationData && detection.locationData.relativeKeypoints) {
            keypoints = detection.locationData.relativeKeypoints;
        } else if (detection.keypoints) {
            keypoints = detection.keypoints;
        } else if (detection.landmarks) {
            keypoints = detection.landmarks;
        }
        
        if (!keypoints) return;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        this.ctx.fillStyle = '#FF0000';
        keypoints.forEach((point, index) => {
            if (point && point.x !== undefined && point.y !== undefined) {
                // 考慮鏡像效果翻轉座標
                const x = (1 - point.x) * canvasWidth;  // 翻轉 X 座標
                const y = point.y * canvasHeight;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // 標記點編號
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(index.toString(), x + 5, y - 5);
                this.ctx.fillStyle = '#FF0000';
            }
        });
    }
    
    // 計算 FPS
    calculateFPS() {
        const now = performance.now();
        this.frameCount++;
        
        if (now - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
            this.fpsElement.textContent = `FPS: ${this.fps}`;
            this.frameCount = 0;
            this.lastTime = now;
        }
    }
    
    // 更新狀態顯示
    updateStatus(message, type = '') {
        this.statusElement.textContent = message;
        this.statusElement.className = `status ${type}`;
    }
    
    // 切換眼鏡樣式
    changeGlasses(type) {
        this.currentGlasses = type;
    }
}

// Canvas roundRect polyfill (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// 全域變數和函數
let app;

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    app = new GlassesApp();
});

// 控制函數
function startCamera() {
    if (app) {
        app.startCamera();
    }
}

function stopCamera() {
    if (app) {
        app.stopCamera();
    }
}

function changeGlasses() {
    const select = document.getElementById('glassesSelect');
    if (app && select) {
        app.changeGlasses(select.value);
    }
}

function toggleDebug() {
    const checkbox = document.getElementById('debugMode');
    if (app && checkbox) {
        app.debugMode = checkbox.checked;
    }
}

// 錯誤處理
window.addEventListener('error', (event) => {
    console.error('應用程式錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 拒絕:', event.reason);
});