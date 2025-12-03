/**
 * 壁纸模块
 * 负责处理壁纸上传、显示和效果调整
 */
import storageManager from './storage.js'

class Wallpaper {
  constructor() {
    this.wallpaperContainer = document.getElementById('wallpaper-container')
    this.wallpaperOverlay = document.getElementById('wallpaper-overlay')
    this.currentSettings = {
      imageUrl: null,
      blur: 0,
      overlayOpacity: 0.3,
    }
    this.init()
  }

  /**
   * 初始化壁纸系统
   */
  async init() {
    try {
      // 加载壁纸设置
      await this.loadWallpaperSettings()

      // 应用壁纸
      this.applyWallpaper()
    } catch (error) {
      console.error('Wallpaper initialization failed:', error)
    }
  }

  /**
   * 加载壁纸设置
   */
  async loadWallpaperSettings() {
    try {
      const wallpaperSettings = await storageManager.getCategory('wallpaper')
      this.currentSettings = {
        ...this.currentSettings,
        ...wallpaperSettings,
      }
    } catch (error) {
      console.error('Failed to load wallpaper settings:', error)
    }
  }

  /**
   * 应用壁纸
   */
  applyWallpaper() {
    // 应用壁纸图片
    if (this.currentSettings.imageUrl) {
      this.wallpaperContainer.style.backgroundImage = `url(${this.currentSettings.imageUrl})`
    } else {
      this.wallpaperContainer.style.backgroundImage = 'none'
    }

    // 应用模糊效果
    this.applyBlur()

    // 应用遮罩透明度
    this.applyOverlayOpacity()
  }

  /**
   * 应用模糊效果
   */
  applyBlur() {
    const blurValue = this.currentSettings.blur || 0
    this.wallpaperContainer.style.filter = `blur(${blurValue}px)`
  }

  /**
   * 应用遮罩透明度
   */
  applyOverlayOpacity() {
    const opacity = this.currentSettings.overlayOpacity || 0.3
    this.wallpaperOverlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`
  }

  /**
   * 上传壁纸
   * @param {File} file - 图片文件
   * @returns {Promise<string>} Base64 字符串
   */
  uploadWallpaper(file) {
    return new Promise((resolve, reject) => {
      // 检查文件类型
      if (!file.type.match('image.*')) {
        reject(new Error('请选择图片文件'))
        return
      }

      // 检查文件大小 (限制为5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('图片文件大小不能超过5MB'))
        return
      }

      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const imageUrl = e.target.result
          await this.setWallpaper(imageUrl)
          resolve(imageUrl)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * 设置壁纸
   * @param {string} imageUrl - Base64 图片URL
   */
  async setWallpaper(imageUrl) {
    this.currentSettings.imageUrl = imageUrl
    this.applyWallpaper()

    // 保存设置
    try {
      await storageManager.updateCategory('wallpaper', {
        imageUrl: imageUrl,
      })
    } catch (error) {
      console.error('Failed to save wallpaper:', error)
      throw error
    }
  }

  /**
   * 移除壁纸
   */
  async removeWallpaper() {
    this.currentSettings.imageUrl = null
    this.applyWallpaper()

    // 保存设置
    try {
      await storageManager.updateCategory('wallpaper', {
        imageUrl: null,
      })
    } catch (error) {
      console.error('Failed to remove wallpaper:', error)
      throw error
    }
  }

  /**
   * 设置模糊强度
   * @param {number} blur - 模糊强度 (0-20)
   */
  async setBlur(blur) {
    this.currentSettings.blur = blur
    this.applyBlur()

    // 保存设置
    try {
      await storageManager.updateCategory('wallpaper', {
        blur: blur,
      })
    } catch (error) {
      console.error('Failed to save blur settings:', error)
      throw error
    }
  }

  /**
   * 设置遮罩透明度
   * @param {number} opacity - 透明度 (0-0.8)
   */
  async setOverlayOpacity(opacity) {
    this.currentSettings.overlayOpacity = opacity
    this.applyOverlayOpacity()

    // 保存设置
    try {
      await storageManager.updateCategory('wallpaper', {
        overlayOpacity: opacity,
      })
    } catch (error) {
      console.error('Failed to save overlay opacity settings:', error)
      throw error
    }
  }

  /**
   * 获取当前壁纸设置
   * @returns {Object} 壁纸设置对象
   */
  getSettings() {
    return { ...this.currentSettings }
  }

  /**
   * 重置壁纸设置
   */
  async resetSettings() {
    this.currentSettings = {
      imageUrl: null,
      blur: 0,
      overlayOpacity: 0.3,
    }
    this.applyWallpaper()

    // 保存设置
    try {
      await storageManager.updateCategory('wallpaper', this.currentSettings)
    } catch (error) {
      console.error('Failed to reset wallpaper settings:', error)
      throw error
    }
  }

  /**
   * 监听壁纸设置变化
   * @param {Function} callback - 设置变化回调函数
   */
  onSettingsChange(callback) {
    storageManager.onChanged((newSettings, oldSettings) => {
      if (newSettings && newSettings.wallpaper) {
        const oldWallpaper = oldSettings ? oldSettings.wallpaper : {}
        const newWallpaper = newSettings.wallpaper

        // 检查是否有变化
        if (JSON.stringify(oldWallpaper) !== JSON.stringify(newWallpaper)) {
          this.currentSettings = {
            ...this.currentSettings,
            ...newWallpaper,
          }
          this.applyWallpaper()
          callback(this.currentSettings, oldWallpaper)
        }
      }
    })
  }
}

export default Wallpaper
