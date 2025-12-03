/**
 * 主题模块
 * 负责处理主题切换和系统主题检测
 */
import storageManager from './storage.js'

class Theme {
  constructor() {
    this.htmlElement = document.documentElement
    this.currentTheme = 'system'
    this.mediaQuery = null
    this.init()
  }

  /**
   * 初始化主题系统
   */
  async init() {
    try {
      // 加载主题设置
      await this.loadThemeSettings()

      // 监听系统主题变化
      this.setupSystemThemeListener()

      // 应用主题
      this.applyTheme()
    } catch (error) {
      console.error('Theme initialization failed:', error)
    }
  }

  /**
   * 加载主题设置
   */
  async loadThemeSettings() {
    try {
      const themeSettings = await storageManager.getCategory('theme')
      this.currentTheme = themeSettings.mode || 'system'
    } catch (error) {
      console.error('Failed to load theme settings:', error)
      this.currentTheme = 'system'
    }
  }

  /**
   * 设置系统主题监听器
   */
  setupSystemThemeListener() {
    // 检测系统是否支持深色模式
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      // 监听系统主题变化
      this.mediaQuery.addEventListener('change', (e) => {
        if (this.currentTheme === 'system') {
          this.applyTheme()
        }
      })
    }
  }

  /**
   * 应用主题
   */
  applyTheme() {
    let effectiveTheme = this.currentTheme

    // 如果是跟随系统，则检测系统主题
    if (this.currentTheme === 'system') {
      effectiveTheme = this.getSystemTheme()
    }

    // 应用主题到HTML元素
    this.htmlElement.setAttribute('data-theme', effectiveTheme)
  }

  /**
   * 获取系统主题
   * @returns {string} 'light' 或 'dark'
   */
  getSystemTheme() {
    if (this.mediaQuery && this.mediaQuery.matches) {
      return 'dark'
    }
    return 'light'
  }

  /**
   * 设置主题
   * @param {string} theme - 主题模式 ('system', 'light', 'dark')
   */
  async setTheme(theme) {
    if (['system', 'light', 'dark'].includes(theme)) {
      this.currentTheme = theme
      this.applyTheme()

      // 保存设置
      try {
        await storageManager.updateCategory('theme', {
          mode: theme,
        })
      } catch (error) {
        console.error('Failed to save theme settings:', error)
      }
    }
  }

  /**
   * 获取当前主题
   * @returns {string} 当前主题模式
   */
  getCurrentTheme() {
    return this.currentTheme
  }

  /**
   * 获取有效主题（实际应用的主题）
   * @returns {string} 有效主题 ('light' 或 'dark')
   */
  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return this.getSystemTheme()
    }
    return this.currentTheme
  }

  /**
   * 切换到下一个主题
   * 按照系统 -> 浅色 -> 深色 -> 系统的顺序循环
   */
  async toggleTheme() {
    const themes = ['system', 'light', 'dark']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    await this.setTheme(themes[nextIndex])
  }

  /**
   * 监听主题变化
   * @param {Function} callback - 主题变化回调函数
   */
  onThemeChange(callback) {
    // 监听存储变化
    storageManager.onChanged((newSettings, oldSettings) => {
      if (
        newSettings &&
        newSettings.theme &&
        newSettings.theme.mode !== this.currentTheme
      ) {
        this.currentTheme = newSettings.theme.mode
        this.applyTheme()
        callback(this.getEffectiveTheme(), newSettings.theme.mode)
      }
    })
  }

  /**
   * 销毁主题实例
   */
  destroy() {
    if (this.mediaQuery) {
      // 移除事件监听器
      this.mediaQuery.removeEventListener('change', this.applyTheme)
    }
  }
}

export default Theme
