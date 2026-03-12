import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

export default function ProfileSettingsPage() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  return (
    <div className="profile-settings-container">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h1>User Profile</h1>
            <div className="profile-info">
              <p><strong>Name:</strong> User Name</p>
              <p><strong>Email:</strong> user@example.com</p>
              <button className="btn-secondary">Edit Profile</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h1>Settings</h1>
            <div className="settings-options">
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Email Notifications
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  Push Notifications
                </label>
              </div>
              <button 
                className="btn-danger"
                onClick={() => signOut()}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
