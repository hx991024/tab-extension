/**
 * 数据存储管理器
 * 封装 chrome.storage.local API，提供 Promise 化的接口
 */
class StorageManager {
  constructor() {
    this.storageKey = 'tabExtensionSettings'
    this.defaultSettings = {
      // 常规设置
      general: {
        searchWidth: 40, // 视口宽度百分比 (30-70)
        searchHeight: 7, // 视口高度百分比 (4-8)
        searchRadius: 30, // px 圆角半径 (0-30)
        searchOpacity: 0.8,
        openIn: 'new-tab', // 'new-tab' | 'current-tab'
        tabSwitch: true,
      },
      // 壁纸设置
      wallpaper: {
        imageUrl: 'assets/images/default.png', // 默认背景图片
        blur: 0,
        overlayOpacity: 0.3,
      },
      // 搜索引擎设置
      engines: {
        default: 'google',
        list: [
          {
            id: 'google',
            name: 'Google',
            url: 'https://www.google.com/search?q=%s',
            icon: 'assets/icons/google.ico',
          },
          {
            id: 'bing',
            name: 'Bing',
            url: 'https://www.bing.com/search?q=%s',
            icon: 'assets/icons/bing.ico',
          },
          {
            id: 'baidu',
            name: '百度',
            url: 'https://www.baidu.com/s?wd=%s',
            icon: 'assets/icons/baidu.ico',
          },
          {
            id: 'duckduckgo',
            name: 'DuckDuckGo',
            url: 'https://duckduckgo.com/?q=%s',
            icon: 'assets/icons/duckduckgo.ico',
          },
        ],
      },
      // 主题设置
      theme: {
        mode: 'system', // 'system' | 'light' | 'dark'
      },
    }
  }

  /**
   * 初始化存储
   * 如果没有存储数据，则使用默认设置
   */
  async init() {
    try {
      const data = await this.get()
      if (!data) {
        await this.set(this.defaultSettings)
        return this.defaultSettings
      }
      return this.mergeWithDefaults(data)
    } catch (error) {
      console.error('Storage initialization failed:', error)
      return this.defaultSettings
    }
  }

  /**
   * 获取所有设置
   * @returns {Promise<Object>} 设置对象
   */
  async get() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(result[this.storageKey])
        }
      })
    })
  }

  /**
   * 保存设置
   * @param {Object} settings - 要保存的设置对象
   * @returns {Promise<void>}
   */
  async set(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: settings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 获取特定类别的设置
   * @param {string} category - 设置类别 (general, wallpaper, engines, theme)
   * @returns {Promise<Object>} 类别设置对象
   */
  async getCategory(category) {
    try {
      const allSettings = await this.get()
      return allSettings
        ? allSettings[category]
        : this.defaultSettings[category]
    } catch (error) {
      console.error(`Failed to get category ${category}:`, error)
      return this.defaultSettings[category]
    }
  }

  /**
   * 更新特定类别的设置
   * @param {string} category - 设置类别
   * @param {Object} updates - 要更新的设置
   * @returns {Promise<void>}
   */
  async updateCategory(category, updates) {
    try {
      const allSettings = (await this.get()) || {}
      const updatedSettings = {
        ...allSettings,
        [category]: {
          ...allSettings[category],
          ...updates,
        },
      }
      await this.set(updatedSettings)
    } catch (error) {
      console.error(`Failed to update category ${category}:`, error)
      throw error
    }
  }

  /**
   * 将存储的数据与默认设置合并
   * 确保所有必要的字段都存在
   * @param {Object} data - 存储的数据
   * @returns {Object} 合并后的设置
   */
  mergeWithDefaults(data) {
    const merged = JSON.parse(JSON.stringify(this.defaultSettings))

    // 深度合并
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          target[key] = target[key] || {}
          deepMerge(target[key], source[key])
        } else {
          target[key] = source[key]
        }
      }
    }

    deepMerge(merged, data)
    return merged
  }

  /**
   * 清除所有设置
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([this.storageKey], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * 监听存储变化
   * @param {Function} callback - 变化回调函数
   */
  onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[this.storageKey]) {
        const { oldValue, newValue } = changes[this.storageKey]
        callback(newValue, oldValue)
      }
    })
  }
}

// 创建单例实例
const storageManager = new StorageManager()

export default storageManager
