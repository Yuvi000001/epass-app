// =====================================================================
// E-PASS — Guard Dashboard (scan / verify E-Pass at the gate)
// =====================================================================

Pages['guard-dashboard'] = {
  _activeTab: 'home',

  render() {
    this._activeTab = 'home';
    return `
      <ion-header>
        <ion-toolbar>
          <!-- LEFT: Original Logo + Page Title -->
          <ion-buttons slot="start" style="display:flex;align-items:center;gap:8px;">
            <img src="assets/images/logo.png" alt="Bansal Group of Institutes" style="height:30px;width:auto;margin-left:6px;" />
            <ion-title id="guard-dash-title" style="font-size:16px;padding:0;margin:0;font-weight:600;color:var(--bgi-text);">Guard Dashboard</ion-title>
          </ion-buttons>
          
          <!-- RIGHT: Logout -->
          <ion-buttons slot="end">
            <ion-button id="guard-logout-btn">
              <ion-icon name="log-out-outline" slot="icon-only" style="font-size:20px;"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content fullscreen class="ion-padding" style="--background:var(--bgi-bg);">
        <div style="max-width:500px;margin:0 auto;padding-top:10px;">
          <ion-card style="border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.08);margin:0 0 16px;">
            <div style="padding:16px;">
              <p style="font-weight:700;font-size:15px;margin:0 0 12px;color:var(--bgi-text);">
                <ion-icon name="scan-outline" style="font-size:20px;vertical-align:middle;margin-right:8px;color:var(--bgi-primary);"></ion-icon>
                Scan QR Code
              </p>
              
              <!-- QR Scanner Button -->
              <ion-button expand="block" id="scan-qr-btn" style="--border-radius:12px;height:48px;font-weight:600;--background:var(--bgi-primary);">
                <ion-icon name="camera-outline" slot="start" style="font-size:18px;"></ion-icon> Open Camera
              </ion-button>
              
              <p style="font-size:11px;color:var(--bgi-text-secondary);margin:10px 0 0;text-align:center;line-height:1.4;">
                Click "Open Camera" to scan QR code
              </p>
            </div>
          </ion-card>

          <div id="scan-result" style="margin-bottom:16px;"></div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px;">
            <p style="font-weight:700;font-size:14px;margin:0;color:var(--bgi-text);">Recent Scans</p>
            <ion-button size="small" fill="clear" id="refresh-scans-btn" style="font-size:12px;--padding-start:0;--padding-end:0;">
              <ion-icon name="refresh-outline" slot="icon-only" style="font-size:16px;"></ion-icon>
            </ion-button>
          </div>
          <div id="recent-scans" style="background:var(--bgi-surface);border-radius:12px;border:1px solid var(--bgi-border);padding:4px 0;">
            <div class="text-center" style="padding:20px;"><ion-spinner color="primary"></ion-spinner></div>
          </div>
        </div>
      </ion-content>
    `;
  },

  afterRender() {
    document.getElementById('guard-logout-btn').addEventListener('click', () => {
      Auth.logout();
      Router.reset('login');
    });
    document.getElementById('refresh-scans-btn')?.addEventListener('click', () => this._loadRecentScans());
    document.getElementById('scan-qr-btn')?.addEventListener('click', () => this._openQRScanner());
    
    this._loadRecentScans();
  },

  async _openQRScanner() {
    // Try Capacitor Barcode Scanner first
    if (typeof Capacitor !== 'undefined' && Capacitor.isPluginAvailable('BarcodeScanner')) {
      try {
        const result = await BarcodeScanner.scan();
        if (result.hasContent) {
          this._verify(result.content);
        }
        return;
      } catch (e) {
        console.log('Capacitor scanner failed, falling back to web scanner');
      }
    }
    
    // Fallback: Use HTML5 camera API
    this._openWebCameraScanner();
  },

  async _openWebCameraScanner() {
    // Create modal for camera scanner
    const modal = document.createElement('ion-modal');
    modal.cssText = '--height:100%;--width:100%;';
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title style="font-size:15px;">Scan QR Code</ion-title>
          <ion-buttons slot="end">
            <ion-button id="scanner-close-btn" style="font-size:13px;">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content style="--background:#000;">
        <div style="text-align:center;padding:10px 0;">
          <div id="scanner-container" style="position:relative;width:100%;max-width:500px;margin:0 auto;aspect-ratio:1;background:#0a0a0a;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:12px;">
            <video id="scanner-video" style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:65%;height:65%;border:2px solid rgba(255,255,255,0.6);border-radius:12px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.3);"></div>
            <div style="position:absolute;top:8%;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;background:rgba(0,0,0,0.6);padding:8px 20px;border-radius:20px;font-weight:500;">
              📷 Position QR in box
            </div>
            <div style="position:absolute;bottom:8%;left:50%;transform:translateX(-50%);display:flex;gap:12px;">
              <div style="width:8px;height:8px;background:#51cf66;border-radius:50%;animation:pulse 1.5s infinite;"></div>
              <span style="color:#fff;font-size:12px;opacity:0.8;">Scanning...</span>
            </div>
          </div>
          <p id="scanner-status" style="color:#aaa;margin-top:12px;font-size:13px;">Tap "Start Camera" to begin</p>
          <ion-button expand="block" id="start-camera-btn" style="margin:10px auto;max-width:300px;--border-radius:12px;height:44px;font-weight:600;">
            <ion-icon name="camera-outline" slot="start"></ion-icon> Start Camera
          </ion-button>
        </div>
      </ion-content>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      </style>
    `;
    document.body.appendChild(modal);
    await modal.present();
    
    modal.querySelector('#scanner-close-btn').addEventListener('click', () => modal.dismiss());
    
    let stream = null;
    let scanning = false;
    
    const startCamera = async () => {
      const status = modal.querySelector('#scanner-status');
      const startBtn = modal.querySelector('#start-camera-btn');
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';
      
      try {
        let constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 640 }
          } 
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          constraints = { video: { width: { ideal: 640 }, height: { ideal: 640 } } };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        const video = modal.querySelector('#scanner-video');
        video.srcObject = stream;
        await video.play();
        
        status.textContent = '✅ Camera started. Scanning...';
        status.style.color = '#51cf66';
        startBtn.textContent = '✅ Camera Active';
        startBtn.style.setProperty('--background', '#51cf66');
        
        scanning = true;
        this._startQRScanning(modal, stream, (qrData) => {
          scanning = false;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (qrData) {
            setTimeout(() => {
              modal.dismiss();
              this._verify(qrData);
            }, 500);
          }
        });
        
      } catch (e) {
        console.error('Camera error:', e);
        status.textContent = '❌ Cannot access camera. Please try again.';
        status.style.color = '#ff6b6b';
        startBtn.disabled = false;
        startBtn.textContent = 'Retry Camera';
        UI.toast('Camera not available.', 'warning');
      }
    };
    
    modal.querySelector('#start-camera-btn').addEventListener('click', startCamera);
    setTimeout(startCamera, 500);
    
    modal.addEventListener('ionModalDidDismiss', () => {
      scanning = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
  },

  _startQRScanning(modal, stream, onDetected) {
    const video = modal.querySelector('#scanner-video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let scanning = true;
    let frameCount = 0;
    
    const status = modal.querySelector('#scanner-status');
    
    const loadJsQR = () => {
      return new Promise((resolve) => {
        if (typeof jsQR !== 'undefined') {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };
    
    const scanLoop = async () => {
      if (!scanning) return;
      
      if (typeof jsQR === 'undefined') {
        await loadJsQR();
        if (typeof jsQR === 'undefined') {
          status.textContent = '⚠️ Loading QR library...';
          setTimeout(scanLoop, 100);
          return;
        }
      }
      
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          frameCount++;
          if (frameCount % 30 === 0) {
            status.textContent = '🔍 Scanning...';
          }
          
          if (code && code.data && code.data.length > 5) {
            scanning = false;
            status.textContent = '✅ QR Code detected!';
            status.style.color = '#51cf66';
            if (onDetected) onDetected(code.data);
            return;
          }
        } catch (e) {}
      }
      
      requestAnimationFrame(scanLoop);
    };
    
    scanLoop();
  },

  async _verify(passId) {
    if (!passId) return UI.toast('No QR code detected', 'danger');

    const resultDiv = document.getElementById('scan-result');
    resultDiv.innerHTML = `<div class="text-center" style="padding:20px;"><ion-spinner color="primary"></ion-spinner></div>`;
    
    try {
      const res = await Api.post('/guard/scan', { passId });
      const d = res.data;
      const validColor = d.isCurrentlyValid ? 'var(--bgi-success)' : 'var(--bgi-danger)';
      const validIcon = d.isCurrentlyValid ? 'checkmark-circle' : 'close-circle';
      const validLabel = d.isCurrentlyValid ? '✅ Valid — Currently within leave dates' : '❌ Outside valid leave dates';

      resultDiv.innerHTML = `
        <ion-card style="border-radius:16px;border-left:4px solid ${validColor};margin:0;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <div style="padding:16px;text-align:center;">
            <ion-icon name="${validIcon}" style="font-size:44px;color:${validColor};display:block;margin:0 auto 8px;"></ion-icon>
            <p style="font-weight:700;color:${validColor};margin:0 0 12px;font-size:14px;">${validLabel}</p>
            <div style="background:var(--bgi-bg);border-radius:10px;padding:12px;text-align:left;">
              <p style="font-weight:700;font-size:16px;margin:0 0 2px;">${UI.escapeHtml(d.studentName)}</p>
              <p style="color:var(--bgi-text-secondary);margin:0 0 8px;font-size:13px;">${UI.escapeHtml(d.rollNumber)} ${d.branch ? '&bull; ' + UI.escapeHtml(d.branch) : ''}</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:13px;">
                <span style="color:var(--bgi-text-secondary);"><b>Leave Type:</b></span>
                <span>${UI.escapeHtml(d.leaveType)}</span>
                <span style="color:var(--bgi-text-secondary);"><b>Valid:</b></span>
                <span>${UI.formatDate(d.validFrom)} - ${UI.formatDate(d.validTo)}</span>
              </div>
            </div>
          </div>
        </ion-card>
      `;
      this._loadRecentScans();
    } catch (e) {
      resultDiv.innerHTML = `
        <ion-card style="border-radius:16px;border-left:4px solid var(--bgi-danger);margin:0;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <div style="padding:16px;text-align:center;">
            <ion-icon name="close-circle" style="font-size:44px;color:var(--bgi-danger);display:block;margin:0 auto 8px;"></ion-icon>
            <p style="font-weight:700;color:var(--bgi-danger);margin:0;font-size:14px;">${UI.escapeHtml(e.message || 'Invalid pass')}</p>
          </div>
        </ion-card>
      `;
    }
  },

  async _loadRecentScans() {
    const list = document.getElementById('recent-scans');
    if (!list) return;
    
    try {
      const res = await Api.get('/guard/scans/recent');
      const scans = res.data || [];
      
      if (scans.length === 0) {
        list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--bgi-text-secondary);font-size:13px;">No scans yet</div>`;
        return;
      }
      
      list.innerHTML = scans.map((s) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--bgi-border);">
          <ion-icon name="${s.action === 'GATE_SCAN' ? 'checkmark-circle-outline' : 'close-circle-outline'}"
            style="font-size:18px;color:${s.action === 'GATE_SCAN' ? 'var(--bgi-success)' : 'var(--bgi-danger)'};flex-shrink:0;"></ion-icon>
          <div style="flex:1;min-width:0;">
            <p style="font-size:12px;font-weight:500;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.escapeHtml(s.details?.passId || '-')}</p>
            <p style="font-size:10px;color:var(--bgi-text-secondary);margin:2px 0 0;">${s.details?.studentName ? UI.escapeHtml(s.details.studentName) : ''}</p>
          </div>
          <ion-note style="font-size:10px;color:var(--bgi-text-secondary);flex-shrink:0;">${UI.formatDate(s.createdAt)}</ion-note>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--bgi-danger);font-size:13px;">${UI.escapeHtml(e.message)}</div>`;
    }
  },
};