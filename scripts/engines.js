/**
 * 搜索引擎管理模块
 * 负责管理搜索引擎的增删改查
 */
import storageManager from './storage.js'

class Engines {
  constructor() {
    this.engines = []
    this.defaultEngineId = 'google'
    this.init()
  }

  /**
   * 初始化搜索引擎管理器
   */
  async init() {
    try {
      await this.loadEngines()
    } catch (error) {
      console.error('Engines initialization failed:', error)
    }
  }

  /**
   * 加载搜索引擎列表
   */
  async loadEngines() {
    try {
      const enginesSettings = await storageManager.getCategory('engines')
      this.engines = enginesSettings.list || []
      this.defaultEngineId = enginesSettings.default || 'google'
    } catch (error) {
      console.error('Failed to load engines:', error)
      // 使用默认搜索引擎
      this.engines = [
        {
          id: 'google',
          name: 'Google',
          url: 'https://www.google.com/search?q=%s',
          icon: 'https://www.google.com/favicon.ico',
        },
        {
          id: 'bing',
          name: 'Bing',
          url: 'https://www.bing.com/search?q=%s',
          icon: 'https://www.bing.com/favicon.ico',
        },
        {
          id: 'baidu',
          name: '百度',
          url: 'https://www.baidu.com/s?wd=%s',
          icon: 'https://www.baidu.com/favicon.ico',
        },
        {
          id: 'duckduckgo',
          name: 'DuckDuckGo',
          url: 'https://duckduckgo.com/?q=%s',
          icon: 'https://duckduckgo.com/favicon.ico',
        },
      ]
      this.defaultEngineId = 'google'
    }
  }

  /**
   * 获取所有搜索引擎
   * @returns {Array} 搜索引擎列表
   */
  getEngines() {
    return [...this.engines]
  }

  /**
   * 根据ID获取搜索引擎
   * @param {string} engineId - 搜索引擎ID
   * @returns {Object|null} 搜索引擎对象
   */
  getEngine(engineId) {
    return this.engines.find((engine) => engine.id === engineId) || null
  }

  /**
   * 获取默认搜索引擎
   * @returns {Object|null} 默认搜索引擎对象
   */
  getDefaultEngine() {
    return this.getEngine(this.defaultEngineId)
  }

  /**
   * 获取默认搜索引擎ID
   * @returns {string} 默认搜索引擎ID
   */
  getDefaultEngineId() {
    return this.defaultEngineId
  }

  /**
   * 设置默认搜索引擎
   * @param {string} engineId - 搜索引擎ID
   */
  async setDefaultEngine(engineId) {
    const engine = this.getEngine(engineId)
    if (!engine) {
      throw new Error(`搜索引擎 ${engineId} 不存在`)
    }

    this.defaultEngineId = engineId

    try {
      await storageManager.updateCategory('engines', {
        default: engineId,
      })
    } catch (error) {
      console.error('Failed to set default engine:', error)
      throw error
    }
  }

  /**
   * 添加搜索引擎
   * @param {Object} engine - 搜索引擎对象
   * @returns {Object} 添加的搜索引擎对象
   */
  async addEngine(engine) {
    // 验证必需字段
    if (!engine.name || !engine.url) {
      throw new Error('搜索引擎名称和URL不能为空')
    }

    // 验证URL格式
    if (!engine.url.includes('%s')) {
      throw new Error('搜索URL必须包含 %s 作为关键词占位符')
    }

    // 生成唯一ID
    const id = engine.id || `custom_${Date.now()}`

    // 检查ID是否已存在
    if (this.getEngine(id)) {
      throw new Error('搜索引擎ID已存在')
    }

    const newEngine = {
      id,
      name: engine.name,
      url: engine.url,
      icon: engine.icon || 'assets/ui/search.svg',
    }

    this.engines.push(newEngine)

    try {
      await storageManager.updateCategory('engines', {
        list: this.engines,
      })

      return newEngine
    } catch (error) {
      // 回滚更改
      this.engines.pop()
      console.error('Failed to add engine:', error)
      throw error
    }
  }

  /**
   * 更新搜索引擎
   * @param {string} engineId - 搜索引擎ID
   * @param {Object} updates - 更新数据
   * @returns {Object} 更新后的搜索引擎对象
   */
  async updateEngine(engineId, updates) {
    const index = this.engines.findIndex((engine) => engine.id === engineId)
    if (index === -1) {
      throw new Error(`搜索引擎 ${engineId} 不存在`)
    }

    // 验证URL格式（如果更新了URL）
    if (updates.url && !updates.url.includes('%s')) {
      throw new Error('搜索URL必须包含 %s 作为关键词占位符')
    }

    const oldEngine = this.engines[index]
    const updatedEngine = {
      ...oldEngine,
      ...updates,
    }

    this.engines[index] = updatedEngine

    try {
      await storageManager.updateCategory('engines', {
        list: this.engines,
      })

      return updatedEngine
    } catch (error) {
      // 回滚更改
      this.engines[index] = oldEngine
      console.error('Failed to update engine:', error)
      throw error
    }
  }

  /**
   * 删除搜索引擎
   * @param {string} engineId - 搜索引擎ID
   * @returns {Object} 被删除的搜索引擎对象
   */
  async deleteEngine(engineId) {
    const index = this.engines.findIndex((engine) => engine.id === engineId)
    if (index === -1) {
      throw new Error(`搜索引擎 ${engineId} 不存在`)
    }

    const deletedEngine = this.engines[index]
    this.engines.splice(index, 1)

    // 如果删除的是默认搜索引擎，则设置新的默认搜索引擎
    if (this.defaultEngineId === engineId && this.engines.length > 0) {
      this.defaultEngineId = this.engines[0].id
    }

    try {
      await storageManager.updateCategory('engines', {
        list: this.engines,
        default: this.defaultEngineId,
      })

      return deletedEngine
    } catch (error) {
      // 回滚更改
      this.engines.splice(index, 0, deletedEngine)
      console.error('Failed to delete engine:', error)
      throw error
    }
  }

  /**
   * 重新排序搜索引擎
   * @param {Array} engineIds - 按新顺序排列的搜索引擎ID数组
   */
  async reorderEngines(engineIds) {
    // 验证所有ID都存在
    const newEngines = []
    for (const id of engineIds) {
      const engine = this.getEngine(id)
      if (!engine) {
        throw new Error(`搜索引擎 ${id} 不存在`)
      }
      newEngines.push(engine)
    }

    // 检查是否有遗漏的搜索引擎
    if (newEngines.length !== this.engines.length) {
      throw new Error('排序列表包含的搜索引擎数量与当前列表不匹配')
    }

    const oldEngines = [...this.engines]
    this.engines = newEngines

    try {
      await storageManager.updateCategory('engines', {
        list: this.engines,
      })
    } catch (error) {
      // 回滚更改
      this.engines = oldEngines
      console.error('Failed to reorder engines:', error)
      throw error
    }
  }

  /**
   * 重置为默认搜索引擎
   */
  async resetToDefaults() {
    const defaultEngines = [
      {
        id: 'google',
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
        icon: 'https://www.google.com/favicon.ico',
      },
      {
        id: 'bing',
        name: 'Bing',
        url: 'https://www.bing.com/search?q=%s',
        icon: 'https://www.bing.com/favicon.ico',
      },
      {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com/s?wd=%s',
        icon: 'https://www.baidu.com/favicon.ico',
      },
      {
        id: 'duckduckgo',
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=%s',
        icon: 'https://duckduckgo.com/favicon.ico',
      },
    ]

    const oldEngines = [...this.engines]
    const oldDefaultEngineId = this.defaultEngineId

    this.engines = defaultEngines
    this.defaultEngineId = 'google'

    try {
      await storageManager.updateCategory('engines', {
        list: this.engines,
        default: this.defaultEngineId,
      })
    } catch (error) {
      // 回滚更改
      this.engines = oldEngines
      this.defaultEngineId = oldDefaultEngineId
      console.error('Failed to reset engines:', error)
      throw error
    }
  }

  /**
   * 搜索引擎验证
   * @param {Object} engine - 搜索引擎对象
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validateEngine(engine) {
    const errors = []

    if (
      !engine.name ||
      typeof engine.name !== 'string' ||
      engine.name.trim() === ''
    ) {
      errors.push('搜索引擎名称不能为空')
    }

    if (
      !engine.url ||
      typeof engine.url !== 'string' ||
      engine.url.trim() === ''
    ) {
      errors.push('搜索引擎URL不能为空')
    } else if (!engine.url.includes('%s')) {
      errors.push('搜索URL必须包含 %s 作为关键词占位符')
    }

    if (engine.icon && typeof engine.icon !== 'string') {
      errors.push('搜索引擎图标必须是有效的URL字符串')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export default Engines
