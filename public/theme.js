export class ThemeManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || "energy-dashboard-theme";
    this.buttonId = options.buttonId || "themeToggle";
    this.defaultTheme = options.defaultTheme || "dark";
    this.onThemeChange = typeof options.onThemeChange === "function"
      ? options.onThemeChange
      : null;

    this.button = null;
    this.currentTheme = this.defaultTheme;
  }

  init() {
    this.button = document.getElementById(this.buttonId);

    const savedTheme = localStorage.getItem(this.storageKey) || this.defaultTheme;
    this.applyTheme(savedTheme);

    if (this.button) {
      this.button.addEventListener("click", () => {
        this.toggleTheme();
      });
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme === "light" ? "light" : "dark";

    if (this.currentTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    this.updateButtonLabel();
    localStorage.setItem(this.storageKey, this.currentTheme);

    if (this.onThemeChange) {
      this.onThemeChange(this.currentTheme);
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(nextTheme);
  }

  updateButtonLabel() {
    if (!this.button) return;

    this.button.textContent =
      this.currentTheme === "light" ? "☀️ Light" : "🌙 Dark";
  }

  isLight() {
    return this.currentTheme === "light";
  }

  isDark() {
    return this.currentTheme === "dark";
  }

  getTheme() {
    return this.currentTheme;
  }

  getChartColors() {
    const isLight = this.isLight();

    return {
      text: isLight ? "#1e293b" : "#f5f7ff",
      grid: isLight ? "rgba(30, 41, 59, 0.12)" : "rgba(255, 255, 255, 0.10)",
      line: isLight ? "#2563eb" : "#7dd3fc",
      fill: isLight ? "rgba(37, 99, 235, 0.12)" : "rgba(125, 211, 252, 0.12)",
    };
  }
}