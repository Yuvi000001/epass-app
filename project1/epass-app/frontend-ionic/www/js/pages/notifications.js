// =====================================================================
// E-PASS — Notifications Screen
// =====================================================================

Pages['notifications'] = {
  render() {
    return `
      <ion-header><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="#" id="notif-back-btn"></ion-back-button></ion-buttons>
        <ion-title>Notifications</ion-title>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="notif-list"><div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div></div></ion-content>
    `;
  },

  async afterRender() {
    document.getElementById('notif-back-btn').addEventListener('click', (e) => { e.preventDefault(); Router.goBack(); });

    const list = document.getElementById('notif-list');
    try {
      const res = await Api.get('/notifications');
      const notifications = res.data || [];
      if (notifications.length === 0) {
        list.innerHTML = `<p class="empty-state">No notifications yet</p>`;
        return;
      }

      const iconFor = (type) => {
        if (type === 'FACULTY_APPROVED' || type === 'HOD_APPROVED') return 'checkmark-circle-outline';
        if (type === 'FACULTY_REJECTED' || type === 'HOD_REJECTED') return 'close-circle-outline';
        if (type === 'LEAVE_SUBMITTED') return 'send-outline';
        return 'notifications-outline';
      };

      list.innerHTML = notifications.map((n) => `
        <ion-card class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" style="cursor:pointer;">
          <ion-item lines="none">
            <ion-icon name="${iconFor(n.type)}" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3 style="font-weight:600;">${UI.escapeHtml(n.title)}</h3>
              <p>${UI.escapeHtml(n.message)}</p>
            </ion-label>
            <ion-note slot="end">${UI.formatDate(n.created_at)}</ion-note>
          </ion-item>
        </ion-card>
      `).join('');

      list.querySelectorAll('.notif-item').forEach((card) => {
        card.addEventListener('click', async () => {
          await Api.put(`/notifications/${card.dataset.id}/read`, {});
          card.classList.remove('unread');
        });
      });
    } catch (e) {
      list.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },
};
