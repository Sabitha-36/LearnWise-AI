
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  UserRound,
  Palette,
  Bell,
  BookOpen,
  ShieldCheck,
  CircleHelp,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Monitor,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  Info
} from "lucide-react";

import "./Settings.css";

const STORAGE_KEY = "learnwise_settings";

const defaultSettings = {
  theme: "light",
  compactMode: false,
  reduceMotion: false,
  studyReminders: true,
  emailNotifications: false,
  learningUpdates: true,
  explanationStyle: "simple",
  answerLength: "medium",
  difficulty: "beginner"
};

const settingSections = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Privacy & Security", icon: ShieldCheck },
  { id: "help", label: "Help & Support", icon: CircleHelp }
];

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  } catch (error) {
    console.error("Settings Loading Error:", error);
    return defaultSettings;
  }
}

function Settings({ user }) {
  const [activeSection, setActiveSection] = useState("account");
  const [settings, setSettings] = useState(getSavedSettings);
  const [savedMessage, setSavedMessage] = useState("");

  // Save preferences in the browser
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Settings Saving Error:", error);
    }
  }, [settings]);

  useEffect(() => {
  const root = document.documentElement;

  const applyAppearance = () => {
    const selectedTheme = settings.theme || "light";

    const actualTheme =
      selectedTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : selectedTheme;

    root.setAttribute("data-theme", actualTheme);

    root.classList.toggle(
      "compact-mode",
      Boolean(settings.compactMode)
    );

    root.classList.toggle(
      "reduce-motion",
      Boolean(settings.reduceMotion)
    );
  };

  applyAppearance();

  const mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  mediaQuery.addEventListener("change", applyAppearance);

  return () => {
    mediaQuery.removeEventListener("change", applyAppearance);
  };
}, [settings.theme, settings.compactMode, settings.reduceMotion]);


// Handle Study Reminder permission
async function handleStudyReminderChange(enabled) {
  if (enabled && !("Notification" in window)) {
    alert("Your browser does not support notifications.");
    return;
  }

  if (enabled && Notification.permission === "default") {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Please allow notifications in your browser settings.");
      return;
    }
  }

  if (enabled && Notification.permission === "denied") {
    alert(
      "Notifications are blocked. Please enable them in your browser settings."
    );
    return;
  }

  updateSetting("studyReminders", enabled);
}


  function updateSetting(key, value) {
    setSettings(previous => ({
      ...previous,
      [key]: value
    }));

    setSavedMessage("Your preference has been saved.");
    window.setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  }

  function resetSettings() {
    setSettings({ ...defaultSettings });
    setSavedMessage("Settings have been restored to default.");
  }


function renderToggle(
  label,
  description,
  settingKey,
  customHandler = null
) {
  return (
    <div className="settings-option">
      <div className="settings-option-info">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={settings[settingKey]}
        aria-label={label}
        className={`settings-switch ${
          settings[settingKey] ? "switch-on" : ""
        }`}
        onClick={() => {
          const newValue = !settings[settingKey];

          if (customHandler) {
            customHandler(newValue);
          } else {
            updateSetting(settingKey, newValue);
          }
        }}
      >
        <span />
      </button>
    </div>
  );
}

  function renderSelect(label, description, settingKey, options) {
    return (
      <div className="settings-option settings-select-option">
        <div className="settings-option-info">
          <strong>{label}</strong>
          <p>{description}</p>
        </div>

        <select
          value={settings[settingKey]}
          onChange={event =>
            updateSetting(settingKey, event.target.value)
          }
          aria-label={label}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderSectionContent() {
    switch (activeSection) {
      case "account":
        return (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-panel-icon purple">
                <UserRound size={21} />
              </div>
              <div>
                <h2>Account Information</h2>
                <p>View your LearnWise AI account details.</p>
              </div>
            </div>

            <div className="settings-account-card">
              <div className="settings-account-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" />
                ) : user?.avatar ? (
                  <img
                    src={`http://localhost:5000/api/auth/avatars/${encodeURIComponent(user.avatar)}`}
                    alt="Profile"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>

              <div className="settings-account-details">
                <h3>{user?.name || "Student"}</h3>
                <p>{user?.email || "No email available"}</p>
                <span>Student Account</span>
              </div>

              <Link
                to="/student/profile"
                className="settings-edit-profile"
              >
                Edit Profile
                <ExternalLink size={14} />
              </Link>
            </div>

            <div className="settings-info-list">
              <div>
                <span>Full Name</span>
                <strong>{user?.name || "Not provided"}</strong>
              </div>

              <div>
                <span>Email Address</span>
                <strong>{user?.email || "Not provided"}</strong>
              </div>

              <div>
                <span>Course</span>
                <strong>{user?.course || "Not provided"}</strong>
              </div>

              <div>
                <span>College</span>
                <strong>{user?.college || "Not provided"}</strong>
              </div>
            </div>

            <div className="settings-note">
              <Info size={17} />
              <p>
                To update your personal or academic information,
                visit your My Profile page.
              </p>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-panel-icon pink">
                <Palette size={21} />
              </div>
              <div>
                <h2>Appearance</h2>
                <p>Choose how you prefer to view LearnWise AI.</p>
              </div>
            </div>

            <div className="settings-subheading">
              Interface Theme
            </div>

            <div className="settings-theme-options">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor }
              ].map(theme => {
                const ThemeIcon = theme.icon;

                return (
                  <button
                    type="button"
                    key={theme.value}
                    className={`settings-theme-card ${
                      settings.theme === theme.value
                        ? "theme-selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateSetting("theme", theme.value)
                    }
                  >
                    <ThemeIcon size={23} />
                    <span>{theme.label}</span>

                    {settings.theme === theme.value && (
                      <Check size={17} className="theme-check" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="settings-divider" />

            {renderToggle(
              "Compact Layout",
              "Use a more compact layout where supported.",
              "compactMode"
            )}

            {renderToggle(
              "Reduce Animations",
              "Reduce interface movement and animations where supported.",
              "reduceMotion"
            )}

            <div className="settings-note">
              <Info size={17} />
              <p>
                Your theme preference is saved. Applying dark mode
                throughout the application requires connecting the
                theme setting to the rest of the app's styles.
              </p>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-panel-icon orange">
                <Bell size={21} />
              </div>
              <div>
                <h2>Notifications</h2>
                <p>Choose which learning updates you want to receive.</p>
              </div>
            </div>

            <div className="settings-group-label">
              LEARNING REMINDERS
            </div>

            {renderToggle(
  "Study Reminders",
  "Receive reminders to stay consistent with your study schedule.",
  "studyReminders",
  handleStudyReminderChange
)}
            {renderToggle(
              "Learning Updates",
              "Keep track of learning activities and feature updates.",
              "learningUpdates"
            )}

            <div className="settings-divider" />

            <div className="settings-group-label">
              EMAIL PREFERENCES
            </div>

            {renderToggle(
              "Email Notifications",
              "Enable email notification preferences.",
              "emailNotifications"
            )}
            <button
              type="button"
              className="settings-reset-btn"
              onClick={() => {
                if (
                  settings.studyReminders &&
                  Notification.permission === "granted"
                ) {
                  new Notification("LearnWise AI", {
                    body: "It's time to continue your learning journey!"
                  });
                } else {
                  alert(
                    "Enable Study Reminders and allow browser notifications first."
                  );
                }
              }}
            >
              Test Study Reminder
            </button>
            <div className="settings-note">
              <Info size={17} />
              <p>
                These options currently save your preferences in
                this browser. Actual email and reminder delivery
                requires notification services to be connected.
              </p>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-panel-icon green">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h2>Privacy & Security</h2>
                <p>Information about your account and its security.</p>
              </div>
            </div>

            <div className="settings-security-item">
              <div className="settings-security-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <strong>Account Authentication</strong>
                <p>
                  Your account is managed through the LearnWise AI
                  authentication system.
                </p>
              </div>

              <span className="settings-status">Enabled</span>
            </div>

            <div className="settings-security-item">
              <div className="settings-security-icon">
                <UserRound size={20} />
              </div>

              <div>
                <strong>Profile Information</strong>
                <p>
                  Review and update the personal information
                  associated with your account.
                </p>
                <Link to="/student/profile">
                  Manage Profile <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div className="settings-security-item">
              <div className="settings-security-icon">
                <Monitor size={20} />
              </div>

              <div>
                <strong>Current Session</strong>
                <p>
                  You are currently signed in to LearnWise AI.
                </p>
              </div>

              <span className="settings-status">Active</span>
            </div>

            <div className="settings-note">
              <Info size={17} />
              <p>
                Password changes and account deletion are not
                configured on this page. They require dedicated
                backend functionality.
              </p>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <div className="settings-panel-icon purple">
                <CircleHelp size={21} />
              </div>
              <div>
                <h2>Help & Support</h2>
                <p>Find answers to common LearnWise AI questions.</p>
              </div>
            </div>

            <div className="settings-faq-list">
              <details>
                <summary>How do I update my profile?</summary>
                <p>
                  Open My Profile from the Navbar. You can update
                  your personal details and choose an avatar.
                </p>
              </details>

              <details>
                <summary>Where can I view my study progress?</summary>
                <p>
                  Visit the Progress section to view your saved
                  learning paths and completed study days.
                </p>
              </details>

              <details>
                <summary>How do I customise my learning experience?</summary>
                <p>
                  Open Learning Preferences in Settings to choose
                  your preferred explanation style, answer length
                  and difficulty level.
                </p>
              </details>

              <details>
                <summary>Are my settings saved?</summary>
                <p>
                  Your current preferences are stored in your
                  browser. They remain available in the same
                  browser unless its site data is cleared.
                </p>
              </details>
            </div>

            <div className="settings-support-card">
              <div className="settings-support-icon">
                <BookOpen size={23} />
              </div>
              <div>
                <h3>LearnWise AI</h3>
                <p>
                  Your personalised learning companion.
                </p>
                <span>Learn smarter, not harder.</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  const activeItem = settingSections.find(
    item => item.id === activeSection
  );

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">
            <SlidersHorizontal size={15} />
            PERSONALISE YOUR EXPERIENCE
          </span>

          <h1>Settings</h1>

          <p>
            Manage your account, preferences and learning experience.
          </p>
        </div>

        <button
          type="button"
          className="settings-reset-btn"
          onClick={resetSettings}
        >
          <RotateCcw size={16} />
          Reset Preferences
        </button>
      </header>

      {savedMessage && (
        <div className="settings-save-message">
          <Check size={16} />
          {savedMessage}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-menu">
          <span className="settings-menu-label">
            PREFERENCES
          </span>

          {settingSections.map(item => {
            const ItemIcon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={`settings-menu-item ${
                  activeSection === item.id ? "active" : ""
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <ItemIcon size={19} />
                <span>{item.label}</span>
                <ChevronRight size={16} className="settings-menu-arrow" />
              </button>
            );
          })}

          <div className="settings-menu-footer">
            <div className="settings-footer-icon">
              <BookOpen size={19} />
            </div>
            <p>Learn smarter, not harder.</p>
            <span>LearnWise AI</span>
          </div>
        </aside>

        <main className="settings-content">
          <div className="settings-content-top">
            <div>
              <span>SETTINGS / {activeItem?.label.toUpperCase()}</span>
              <h2>{activeItem?.label}</h2>
            </div>
          </div>

          {renderSectionContent()}
        </main>
      </div>
    </div>
  );
}

export default Settings;
