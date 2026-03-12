import React, { useState } from 'react';

export default function AppPreferencesPage() {
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="app-preferences-container">
      <h1>App Preferences</h1>

      <div className="preference-item">
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="preference-item">
        <label>Default Currency</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="INR">INR</option>
        </select>
      </div>

      <button className="btn-primary">Save Preferences</button>
    </div>
  );
}
