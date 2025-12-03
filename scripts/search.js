/**
 * 搜索模块
 * 负责处理搜索功能、搜索引擎切换和Tab键轮播
 */
import storageManager from './storage.js'

class Search {
  constructor() {
    this.searchInput = document.getElementById('search-input')
    this.searchContainer = document.getElementById('search-container')
    this.searchEngineIcon = document.getElementById('search-engine-icon')
    this.engines = []
    this.currentEngineIndex = 0
    this.tabSwitchEnabled = true
    this.openIn = 'new-tab'
    this.init()
  }

  /**
   * 初始化搜索功能
   */
  async init() {
    try {
      // 加载搜索引擎设置
      await this.loadEngineSettings()

      // 绑定事件
      this.bindEvents()

      // 更新搜索引擎图标
      this.updateEngineIcon()
    } catch (error) {
      console.error('Search initialization failed:', error)
    }
  }

  /**
   * 加载搜索引擎设置
   */
  async loadEngineSettings() {
    try {
      const enginesSettings = await storageManager.getCategory('engines')
      this.engines = enginesSettings.list || []
      const defaultEngineId = enginesSettings.default || 'google'

      // 找到默认搜索引擎的索引
      this.currentEngineIndex = this.engines.findIndex(
        (engine) => engine.id === defaultEngineId,
      )
      if (this.currentEngineIndex === -1) {
        this.currentEngineIndex = 0 // 如果没找到，使用第一个
      }

      // 加载常规设置
      const generalSettings = await storageManager.getCategory('general')
      this.tabSwitchEnabled = generalSettings.tabSwitch !== false // 默认为true
      this.openIn = generalSettings.openIn || 'new-tab'
    } catch (error) {
      console.error('Failed to load engine settings:', error)
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 搜索输入框事件
    if (this.searchInput) {
      // Enter键搜索
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.performSearch()
        } else if (e.key === 'Tab' && this.tabSwitchEnabled) {
          e.preventDefault()
          this.switchEngine()
        }
      })

      // 输入框获得焦点时高亮
      this.searchInput.addEventListener('focus', () => {
        this.searchContainer.classList.add('focused')
      })

      // 输入框失去焦点时取消高亮
      this.searchInput.addEventListener('blur', () => {
        this.searchContainer.classList.remove('focused')
      })
    }
  }

  /**
   * 执行搜索
   */
  performSearch() {
    const query = this.searchInput.value.trim()
    if (!query) return

    const currentEngine = this.engines[this.currentEngineIndex]
    if (!currentEngine) return

    // 构建搜索URL
    const searchUrl = currentEngine.url.replace('%s', encodeURIComponent(query))

    // 根据设置决定打开方式
    if (this.openIn === 'current-tab') {
      window.location.href = searchUrl
    } else {
      window.open(searchUrl, '_blank')
    }
  }

  /**
   * 切换搜索引擎
   */
  switchEngine() {
    if (!this.tabSwitchEnabled || this.engines.length === 0) return

    // 切换到下一个搜索引擎
    this.currentEngineIndex =
      (this.currentEngineIndex + 1) % this.engines.length

    // 更新图标
    this.updateEngineIcon()

    // 保存当前搜索引擎为默认
    this.saveDefaultEngine()
  }

  /**
   * 更新搜索引擎图标
   */
  updateEngineIcon() {
    if (!this.searchEngineIcon || this.engines.length === 0) return

    const currentEngine = this.engines[this.currentEngineIndex]
    if (currentEngine && currentEngine.icon) {
      this.searchEngineIcon.src = currentEngine.icon
      this.searchEngineIcon.alt = currentEngine.name
    }
  }

  /**
   * 保存默认搜索引擎
   */
  async saveDefaultEngine() {
    try {
      const currentEngine = this.engines[this.currentEngineIndex]
      if (currentEngine) {
        await storageManager.updateCategory('engines', {
          default: currentEngine.id,
        })
      }
    } catch (error) {
      console.error('Failed to save default engine:', error)
    }
  }

  /**
   * 设置搜索引擎
   * @param {string} engineId - 搜索引擎ID
   */
  async setEngine(engineId) {
    const index = this.engines.findIndex((engine) => engine.id === engineId)
    if (index !== -1) {
      this.currentEngineIndex = index
      this.updateEngineIcon()
      await this.saveDefaultEngine()
    }
  }

  /**
   * 更新设置
   * @param {Object} settings - 设置对象
   */
  async updateSettings(settings) {
    if (settings.tabSwitch !== undefined) {
      this.tabSwitchEnabled = settings.tabSwitch
    }

    if (settings.openIn !== undefined) {
      this.openIn = settings.openIn
    }
  }

  /**
   * 更新搜索引擎列表
   * @param {Array} engines - 搜索引擎列表
   */
  updateEngines(engines) {
    this.engines = engines

    // 确保当前索引有效
    if (this.currentEngineIndex >= this.engines.length) {
      this.currentEngineIndex = 0
    }

    this.updateEngineIcon()
  }

  /**
   * 获取当前搜索引擎
   * @returns {Object} 当前搜索引擎对象
   */
  getCurrentEngine() {
    return this.engines[this.currentEngineIndex] || null
  }
}

export default Search
