// =====================================================================
// E-PASS — Approved Pass screen (QR code + Download/Share PDF)
// Uses the "qrcodejs" library (loaded via CDN in index.html) to render
// the QR code client-side from the pass ID.
// =====================================================================

Pages['epass'] = {
  render() {
    return `
      <ion-header><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="#" id="epass-back-btn"></ion-back-button></ion-buttons>
        <ion-title>Approved Pass</ion-title>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="epass-body"><div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div></div></ion-content>
    `;
  },

  async afterRender({ leaveRequestId }) {
    document.getElementById('epass-back-btn').addEventListener('click', (e) => { e.preventDefault(); Router.goBack(); });

    const body = document.getElementById('epass-body');
    try {
      const res = await Api.get(`/epass/${leaveRequestId}`);
      const epass = res.data;

      body.innerHTML = `
        <div class="epass-status-icon"><ion-icon name="checkmark"></ion-icon></div>
        <div class="epass-status-title">Leave Approved</div>
        <div class="epass-status-dates">${UI.formatDate(epass.valid_from)} - ${UI.formatDate(epass.valid_to)}</div>

        <ion-card class="epass-qr-card">
          <div id="epass-qr-canvas"></div>
          <div class="epass-pass-id">${UI.escapeHtml(epass.pass_id)}</div>
        </ion-card>

        <div style="display:flex;gap:12px;margin-top:24px;">
          <ion-button fill="outline" style="flex:1;" id="epass-share-btn">
            <ion-icon name="share-social-outline" slot="start"></ion-icon> Share
          </ion-button>
          <ion-button style="flex:1.4;" id="epass-download-btn">
            <ion-icon name="download-outline" slot="start"></ion-icon> Download PDF
          </ion-button>
        </div>
      `;

      // Render QR code client-side from the pass ID (qrcodejs CDN library)
      // eslint-disable-next-line no-undef
      new QRCode(document.getElementById('epass-qr-canvas'), {
        text: epass.pass_id,
        width: 180,
        height: 180,
        colorDark: '#0A4DAD',
        colorLight: '#ffffff',
      });

      document.getElementById('epass-download-btn').addEventListener('click', () => {
        window.open(epass.pdf_url, '_blank');
      });

      document.getElementById('epass-share-btn').addEventListener('click', async () => {
        // Use Capacitor's Share plugin if running inside the native app shell,
        // otherwise fall back to the Web Share API / clipboard copy.
        if (window.Capacitor?.Plugins?.Share) {
          await window.Capacitor.Plugins.Share.share({
            title: 'My E-Pass',
            text: 'Here is my approved E-Pass from BGI',
            url: epass.pdf_url,
          });
        } else if (navigator.share) {
          await navigator.share({ title: 'My E-Pass', url: epass.pdf_url });
        } else {
          await navigator.clipboard.writeText(epass.pdf_url);
          await UI.toast('Pass link copied to clipboard');
        }
      });
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },
};
