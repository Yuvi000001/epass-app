// =====================================================================
// E-PASS — Shared UI helpers (toast, confirm dialog, formatting, badges)
// Built on top of Ionic's web components (ion-toast, ion-alert).
// =====================================================================

const UI = {
  async toast(message, color = 'dark') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2200;
    toast.color = color;
    toast.position = 'top';
    document.body.appendChild(toast);
    await toast.present();
  },

  /** Shows a remark + confirm dialog (used for approve/reject). Resolves { confirmed, remark }. */
  confirmWithRemark({ title, confirmText = 'Confirm', confirmColor = 'primary' }) {
    return new Promise((resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = title;
      alert.inputs = [{ name: 'remark', type: 'textarea', placeholder: 'Add a remark (optional)' }];
      alert.buttons = [
        { text: 'Cancel', role: 'cancel', handler: () => resolve({ confirmed: false, remark: '' }) },
        {
          text: confirmText,
          cssClass: confirmColor === 'danger' ? 'alert-danger-btn' : '',
          handler: (data) => resolve({ confirmed: true, remark: (data && data.remark) || '' }),
        },
      ];
      document.body.appendChild(alert);
      alert.present();
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  statusBadgeHtml(status) {
    const cls = status === 'Approved' ? 'status-approved' : status === 'Rejected' ? 'status-rejected' : 'status-pending';
    return `<span class="status-badge ${cls}">${status}</span>`;
  },

  statusColorVar(status) {
    if (status === 'Approved') return 'var(--bgi-success)';
    if (status === 'Rejected') return 'var(--bgi-danger)';
    return 'var(--bgi-warning)';
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  /**
   * Builds the HTML for a single leave-request card.
   * options: { showStudentName, clickableIfApproved, showFacultyActions, showHodActions }
   */
  leaveCardHtml(leave, options = {}) {
    const { showStudentName = false, clickableIfApproved = false, showFacultyActions = false, showHodActions = false } = options;
    const clickable = clickableIfApproved && leave.overall_status === 'Approved';

    let actionsHtml = '';
    if (showFacultyActions && leave.faculty_status === 'Pending') {
      actionsHtml = `
        <div class="leave-card-actions">
          <ion-button fill="outline" color="danger" size="small" class="action-reject" data-id="${leave.id}">Reject</ion-button>
          <ion-button color="success" size="small" class="action-approve" data-id="${leave.id}">Approve</ion-button>
        </div>`;
    } else if (showHodActions && leave.hod_status === 'Pending') {
      actionsHtml = `
        <div class="leave-card-actions">
          <ion-button fill="outline" color="danger" size="small" class="action-reject" data-id="${leave.id}">Reject</ion-button>
          <ion-button color="success" size="small" class="action-approve" data-id="${leave.id}">Approve</ion-button>
        </div>`;
    }

    return `
      <ion-card class="leave-card ${clickable ? 'leave-card-clickable' : ''}" ${clickable ? `data-leave-id="${leave.id}"` : ''} style="${clickable ? 'cursor:pointer;' : ''}">
        <div class="leave-card-header">
          <div class="leave-card-dates">${this.formatDate(leave.from_date)} - ${this.formatDate(leave.to_date)}</div>
          ${this.statusBadgeHtml(leave.overall_status)}
        </div>
        ${showStudentName && leave.student_name ? `<div class="leave-card-student">${this.escapeHtml(leave.student_name)} &nbsp;&bull;&nbsp; ${this.escapeHtml(leave.roll_number || '')}</div>` : ''}
        <div class="leave-card-reason">${this.escapeHtml(leave.reason)}</div>
        <div class="leave-card-meta">Applied on: ${this.formatDate(leave.applied_on)}</div>
        <div class="leave-card-statuses">
          <span>Faculty: <b style="color:${this.statusColorVar(leave.faculty_status)}">${leave.faculty_status}</b></span>
          <span>HOD: <b style="color:${this.statusColorVar(leave.hod_status)}">${leave.hod_status}</b></span>
        </div>
        ${actionsHtml}
      </ion-card>
    `;
  },

  /** Attaches delegated click handlers for approve/reject buttons + clickable cards inside a container. */
  attachLeaveCardHandlers(container, { onApprove, onReject, onCardClick } = {}) {
    if (onApprove) {
      container.querySelectorAll('.action-approve').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onApprove(Number(btn.dataset.id));
        });
      });
    }
    if (onReject) {
      container.querySelectorAll('.action-reject').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onReject(Number(btn.dataset.id));
        });
      });
    }
    if (onCardClick) {
      container.querySelectorAll('.leave-card-clickable').forEach((card) => {
        card.addEventListener('click', () => onCardClick(Number(card.dataset.leaveId)));
      });
    }
  },
};
