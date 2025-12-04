/**
 * 主入口文件
 * 负责初始化和协调所有模块
 */
import Clock from './clock.js'
import Search from './search.js'
import Theme from './theme.js'
import Wallpaper from './wallpaper.js'
import Settings from './settings.js'
import storageManager from './storage.js'

/**
 * 应用主类
 */
class App {
  constructor() {
    this.clock = null
    this.search = null
    this.theme = null
    this.wallpaper = null
    this.settings = null
    this.isInitialized = false
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 显示加载状态
      this.showLoadingState()

      // 初始化存储
      await storageManager.init()

      // 初始化各个模块
      await this.initModules()

      // 绑定模块间事件
      this.bindModuleEvents()

      // 应用初始设置
      await this.applyInitialSettings()

      // 隐藏加载状态
      this.hideLoadingState()

      this.isInitialized = true
      console.log('应用初始化完成')
    } catch (error) {
      console.error('应用初始化失败:', error)
      this.showErrorState(error.message)
    }
  }

  /**
   * 显示加载状态
   */
  showLoadingState() {
    // 可以在这里添加加载指示器
    document.body.classList.add('loading')
  }

  /**
   * 隐藏加载状态
   */
  hideLoadingState() {
    document.body.classList.remove('loading')
  }

  /**
   * 显示错误状态
   * @param {string} message - 错误消息
   */
  showErrorState(message) {
    // 可以在这里添加错误提示
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-message'
    errorDiv.textContent = `初始化失败: ${message}`
    document.body.appendChild(errorDiv)
  }

  /**
   * 初始化各个模块
   */
  async initModules() {
    // 初始化主题（优先级最高，因为其他模块可能依赖主题）
    this.theme = new Theme()

    // 初始化壁纸
    this.wallpaper = new Wallpaper()

    // 初始化时钟
    this.clock = new Clock()

    // 初始化搜索
    this.search = new Search()

    // 初始化设置面板
    this.settings = new Settings()
  }

  /**
   * 应用初始设置
   * 从存储加载设置并应用到UI
   */
  async applyInitialSettings() {
    try {
      const generalSettings = await storageManager.getCategory('general')

      // 应用搜索框宽度
      if (generalSettings.searchWidth !== undefined) {
        this.updateSearchWidth(generalSettings.searchWidth)
      }

      // 应用搜索框高度（会同时调整图标和字体大小）
      if (generalSettings.searchHeight !== undefined) {
        this.updateSearchHeight(generalSettings.searchHeight)
      }

      // 应用搜索框圆角
      if (generalSettings.searchRadius !== undefined) {
        this.updateSearchRadius(generalSettings.searchRadius)
      }

      // 应用搜索框透明度
      if (generalSettings.searchOpacity !== undefined) {
        this.updateSearchOpacity(generalSettings.searchOpacity)
      }
    } catch (error) {
      console.error('Failed to apply initial settings:', error)
    }
  }

  /**
   * 绑定模块间事件
   */
  bindModuleEvents() {
    // 监听设置面板的变化，更新其他模块

    // 搜索框宽度变化
    document.addEventListener('searchWidthChanged', (e) => {
      this.updateSearchWidth(e.detail)
    })

    // 搜索框高度变化
    document.addEventListener('searchHeightChanged', (e) => {
      this.updateSearchHeight(e.detail)
    })

    // 搜索框圆角变化
    document.addEventListener('searchRadiusChanged', (e) => {
      this.updateSearchRadius(e.detail)
    })

    // 搜索框透明度变化
    document.addEventListener('searchOpacityChanged', (e) => {
      this.updateSearchOpacity(e.detail)
    })

    // 搜索打开方式变化
    document.addEventListener('openInChanged', (e) => {
      this.updateOpenIn(e.detail)
    })

    // Tab键切换设置变化
    document.addEventListener('tabSwitchChanged', (e) => {
      this.updateTabSwitch(e.detail)
    })

    // 壁纸上传
    document.addEventListener('wallpaperUpload', async (e) => {
      try {
        await this.wallpaper.uploadWallpaper(e.detail)
      } catch (error) {
        console.error('壁纸上传失败:', error)
        alert('壁纸上传失败: ' + error.message)
      }
    })

    // 壁纸重置
    document.addEventListener('wallpaperReset', async () => {
      try {
        await this.wallpaper.resetSettings()
      } catch (error) {
        console.error('壁纸重置失败:', error)
        alert('壁纸重置失败: ' + error.message)
      }
    })

    // 壁纸模糊变化
    document.addEventListener('wallpaperBlurChanged', (e) => {
      this.wallpaper.setBlur(e.detail)
    })

    // 壁纸遮罩透明度变化
    document.addEventListener('wallpaperOverlayOpacityChanged', (e) => {
      this.wallpaper.setOverlayOpacity(e.detail)
    })

    // 默认搜索引擎变化
    document.addEventListener('defaultEngineChanged', (e) => {
      this.search.setEngine(e.detail)
    })

    // 搜索引擎列表更新
    document.addEventListener('enginesUpdated', (e) => {
      this.search.updateEngines(e.detail)
    })

    // 主题变化
    document.addEventListener('themeChanged', (e) => {
      this.theme.setTheme(e.detail)
    })

    // 监听存储变化（来自其他标签页）
    storageManager.onChanged((newSettings, oldSettings) => {
      this.handleStorageChange(newSettings, oldSettings)
    })
  }

  /**
   * 更新搜索框宽度
   * @param {number} width - 宽度值
   */
  updateSearchWidth(width) {
    const searchContainer = document.getElementById('search-container')
    if (searchContainer) {
      searchContainer.style.width = `${width}px`
    }
  }

  /**
   * 更新搜索框高度
   * @param {number} height - 高度值
   */
  updateSearchHeight(height) {
    const searchContainer = document.getElementById('search-container')
    const searchEngineIcon = document.getElementById('search-engine-icon')
    const searchInput = document.getElementById('search-input')

    if (searchContainer) {
      searchContainer.style.height = `${height}px`

      // 根据高度按比例调整图标大小 (默认比例: 20/50 = 0.4)
      const iconSize = Math.round(height * 0.4)
      if (searchEngineIcon) {
        searchEngineIcon.style.width = `${iconSize}px`
        searchEngineIcon.style.height = `${iconSize}px`
        // 调整图标边距 (默认比例: 15/50 = 0.3)
        const iconMargin = Math.round(height * 0.3)
        searchEngineIcon.style.margin = `0 ${iconMargin}px`
      }

      // 根据高度按比例调整字体大小 (默认比例: 16/50 = 0.32)
      const fontSize = Math.round(height * 0.32)
      if (searchInput) {
        searchInput.style.fontSize = `${fontSize}px`
      }
    }
  }

  /**
   * 更新搜索框圆角
   * @param {number} radius - 圆角值
   */
  updateSearchRadius(radius) {
    const searchContainer = document.getElementById('search-container')
    if (searchContainer) {
      searchContainer.style.borderRadius = `${radius}px`
    }
  }

  /**
   * 更新搜索框透明度
   * @param {number} opacity - 透明度值
   */
  updateSearchOpacity(opacity) {
    const searchContainer = document.getElementById('search-container')
    if (searchContainer) {
      searchContainer.style.opacity = opacity
    }
  }

  /**
   * 更新搜索打开方式
   * @param {string} openIn - 打开方式
   */
  updateOpenIn(openIn) {
    if (this.search) {
      this.search.updateSettings({ openIn })
    }
  }

  /**
   * 更新Tab键切换设置
   * @param {boolean} enabled - 是否启用
   */
  updateTabSwitch(enabled) {
    if (this.search) {
      this.search.updateSettings({ tabSwitch: enabled })
    }
  }

  /**
   * 处理存储变化
   * @param {Object} newSettings - 新设置
   * @param {Object} oldSettings - 旧设置
   */
  handleStorageChange(newSettings, oldSettings) {
    if (!newSettings) return

    // 处理常规设置变化
    if (newSettings.general) {
      const general = newSettings.general

      if (general.searchWidth !== undefined) {
        this.updateSearchWidth(general.searchWidth)
      }

      if (general.searchHeight !== undefined) {
        this.updateSearchHeight(general.searchHeight)
      }

      if (general.searchRadius !== undefined) {
        this.updateSearchRadius(general.searchRadius)
      }

      if (general.searchOpacity !== undefined) {
        this.updateSearchOpacity(general.searchOpacity)
      }

      if (general.openIn !== undefined) {
        this.updateOpenIn(general.openIn)
      }

      if (general.tabSwitch !== undefined) {
        this.updateTabSwitch(general.tabSwitch)
      }
    }

    // 处理壁纸设置变化
    if (newSettings.wallpaper) {
      // 壁纸模块会自动处理自己的变化
    }

    // 处理搜索引擎设置变化
    if (newSettings.engines) {
      if (this.search) {
        this.search.updateEngines(newSettings.engines.list || [])
        if (newSettings.engines.default) {
          this.search.setEngine(newSettings.engines.default)
        }
      }
    }

    // 处理主题设置变化
    if (newSettings.theme && newSettings.theme.mode) {
      if (this.theme) {
        this.theme.setTheme(newSettings.theme.mode)
      }
    }
  }

  /**
   * 销毁应用
   */
  destroy() {
    if (this.clock) {
      this.clock.destroy()
    }

    if (this.theme) {
      this.theme.destroy()
    }

    // 移除事件监听器
    document.removeEventListener('searchWidthChanged', this.updateSearchWidth)
    document.removeEventListener(
      'searchOpacityChanged',
      this.updateSearchOpacity,
    )
    document.removeEventListener('openInChanged', this.updateOpenIn)
    document.removeEventListener('tabSwitchChanged', this.updateTabSwitch)
  }
}

// 创建应用实例并初始化
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App()
  await app.init()

  // 将应用实例暴露到全局，便于调试
  window.tabExtensionApp = app
})

// 处理页面卸载
window.addEventListener('beforeunload', () => {
  if (window.tabExtensionApp) {
    window.tabExtensionApp.destroy()
  }
})
