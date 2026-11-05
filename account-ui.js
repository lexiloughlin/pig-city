/**
 * Account System UI & Integration
 * 
 * Provides UI components and game integration for the account system
 */

const AccountUI = {
  
  // Initialize account UI
  init() {
    this.setupAccountButton();
    this.setupAutoSync();
    this.showAccountStatus();
  },

  // Setup account button in header
  setupAccountButton() {
    const header = document.querySelector('header');
    if (!header) return;

    // Create account button if it doesn't exist
    let accountBtn = document.getElementById('accountBtn');
    if (!accountBtn) {
      accountBtn = document.createElement('button');
      accountBtn.id = 'accountBtn';
      accountBtn.className = 'btn ghost';
      accountBtn.style.fontSize = '15px';
      accountBtn.style.padding = '5px 12px';
      accountBtn.textContent = '👤 Sign in';
      header.appendChild(accountBtn);
    }

    accountBtn.addEventListener('click', () => this.showAccountMenu());
    AccountSystem.render();
  },

  // Show account menu (sign in / sign out)
  async showAccountMenu() {
    const status = AccountSystem.getStatus();

    if (status === 'not-signed-in') {
      await this.showSignInDialog();
    } else {
      await this.showAccountPanel();
    }
  },

  // Show sign-in dialog
  async showSignInDialog() {
    const email = await window.pigTown.askText(
      'Enter your email to sign in or create an account',
      '',
      80
    );

    if (!email || !email.trim()) return;

    try {
      const result = await AccountSystem.signIn(email);
      window.pigTown.tellBox(result.message);
    } catch (e) {
      window.pigTown.tellBox(`Sign-in failed: ${e.message}`);
    }
  },

  // Show account info panel
  async showAccountPanel() {
    const user = AccountSystem.user;
    const saves = await AccountSystem.listSaves();
    const stats = await AccountSystem.getStats();

    let message = `📧 Signed in as: ${user.email}\n\n`;
    message += `Platform: ${AccountSystem.getPlatform()}\n`;
    message += `Last sync: ${this.timeAgo(AccountSystem.lastSync)}\n`;

    if (saves && saves.length > 0) {
      const save = saves[0];
      message += `\n🐹 Pigs: ${save.pig_count}\n`;
      message += `🏠 Buildings: ${save.building_count}\n`;
      message += `🪙 Coins: ${save.coin_total}\n`;
      message += `📱 Last played: ${this.timeAgo(new Date(save.last_played))}\n`;
    }

    message += `\nOptions:\n`;
    message += `• Sign out\n`;
    message += `• Sync now (${AccountSystem.isOnline ? 'online' : 'offline'})\n`;

    const choice = await window.pigTown.askYes(message, 'Sign out');
    if (choice) {
      await AccountSystem.logout();
      AccountSystem.render();
      window.pigTown.toast('👤 Signed out');
    }
  },

  // Setup auto-sync integration
  setupAutoSync() {
    // Hook into the main game save function
    const originalSave = window.save || (() => {});
    
    window.saveWithSync = async function() {
      originalSave();
      
      if (AccountSystem.user && AccountSystem.isOnline) {
        try {
          await AccountSystem.syncProgress();
          AccountUI.showSyncStatus('✅ Synced');
        } catch (e) {
          AccountUI.showSyncStatus('⚠️ Sync failed');
        }
      }
    };
  },

  // Show sync status toast
  showSyncStatus(message) {
    if (window.pigTown && window.pigTown.toast) {
      window.pigTown.toast(message);
    }
  },

  // Format time ago
  timeAgo(timestamp) {
    if (!timestamp) return 'never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  },

  // Show account status indicator
  showAccountStatus() {
    const statusEl = document.getElementById('accountStatus');
    if (!statusEl) return;

    setInterval(() => {
      const status = AccountSystem.getStatus();
      statusEl.textContent = status === 'signed-in' ? '🟢' : '⚪';
      statusEl.title = status === 'signed-in' 
        ? `Signed in as ${AccountSystem.user?.email}`
        : 'Not signed in';
    }, 1000);
  },

  // Load game from different platform
  async loadFromPlatform(platform) {
    if (!AccountSystem.user) {
      window.pigTown.tellBox('You must be signed in to load from other devices');
      return false;
    }

    try {
      const save = await AccountSystem.loadProgress(platform);
      if (!save) {
        window.pigTown.tellBox(`No save found for ${platform}`);
        return false;
      }

      const daysOld = Math.floor((Date.now() - new Date(save.last_played)) / 86400000);
      const confirm = await window.pigTown.askYes(
        `Load ${save.pig_count} pigs, ${save.building_count} buildings from ${platform} (saved ${daysOld} days ago)?`,
        'Load'
      );

      if (confirm) {
        window.pigTown.use(JSON.stringify(save.state));
        window.pigTown.toast(`🔄 Loaded game from ${platform}!`);
        return true;
      }
    } catch (e) {
      window.pigTown.tellBox(`Failed to load from ${platform}: ${e.message}`);
      return false;
    }
  },

  // Show all available saves
  async showSaveManager() {
    if (!AccountSystem.user) {
      window.pigTown.tellBox('You must be signed in to see your saves');
      return;
    }

    try {
      const saves = await AccountSystem.listSaves();
      
      if (saves.length === 0) {
        window.pigTown.tellBox('No saved games found');
        return;
      }

      let message = `📚 Your Saves (${saves.length}):\n\n`;
      saves.forEach((save, i) => {
        const date = new Date(save.last_played);
        message += `${i + 1}. ${save.platform.toUpperCase()}\n`;
        message += `   🐹 ${save.pig_count} pigs, 🏠 ${save.building_count} buildings\n`;
        message += `   🪙 ${save.coin_total} coins\n`;
        message += `   📅 ${date.toLocaleDateString()}\n\n`;
      });

      window.pigTown.tellBox(message);
    } catch (e) {
      window.pigTown.tellBox(`Error loading saves: ${e.message}`);
    }
  }
};

// Initialize UI when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.pigTown) AccountUI.init();
  });
} else {
  if (window.pigTown) AccountUI.init();
}
