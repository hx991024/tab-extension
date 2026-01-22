/**
 * 设置面板模块
 * 负责设置面板的UI交互和设置管理
 */
import storageManager from './storage.js'

class Settings {
  constructor() {
    this.settingsToggle = document.getElementById('settings-toggle')
    this.settingsDrawer = document.getElementById('settings-drawer')
    this.settingsClose = document.getElementById('settings-close')
    this.navLinks = document.querySelectorAll('.nav-link')
    this.tabContents = document.querySelectorAll('.tab-content')
    this.currentTab = 'general'

    // 防抖定时器
    this.searchWidthDebounce = null
    this.searchHeightDebounce = null
    this.searchRadiusDebounce = null
    this.searchOpacityDebounce = null
    this.wallpaperBlurDebounce = null
    this.wallpaperOverlayOpacityDebounce = null

    // 设置元素
    this.searchWidth = document.getElementById('search-width')
    this.searchWidthValue = document.getElementById('search-width-value')
    this.searchHeight = document.getElementById('search-height')
    this.searchHeightValue = document.getElementById('search-height-value')
    this.searchRadius = document.getElementById('search-radius')
    this.searchRadiusValue = document.getElementById('search-radius-value')
    this.searchOpacity = document.getElementById('search-opacity')
    this.searchOpacityValue = document.getElementById('search-opacity-value')
    this.openIn = document.getElementById('open-in')
    this.tabSwitch = document.getElementById('tab-switch')
    this.resetSettings = document.getElementById('reset-settings')

    // 壁纸设置元素
    this.wallpaperUpload = document.getElementById('wallpaper-upload')
    this.wallpaperReset = document.getElementById('wallpaper-reset')
    this.wallpaperBlur = document.getElementById('wallpaper-blur')
    this.wallpaperBlurValue = document.getElementById('wallpaper-blur-value')
    this.wallpaperOverlayOpacity = document.getElementById(
      'wallpaper-overlay-opacity',
    )
    this.wallpaperOverlayOpacityValue = document.getElementById(
      'wallpaper-overlay-opacity-value',
    )

    // 搜索引擎设置元素
    this.defaultEngine = document.getElementById('default-engine')
    this.enginesList = document.getElementById('engines-list')
    this.addEngineBtn = document.getElementById('add-engine')

    // 主题设置元素
    this.themeRadios = document.querySelectorAll('input[name="theme"]')

    // 模态框元素
    this.engineModal = document.getElementById('engine-modal')
    this.engineModalClose = document.getElementById('engine-modal-close')
    this.saveEngineBtn = document.getElementById('save-engine')
    this.cancelEngineBtn = document.getElementById('cancel-engine')
    this.engineName = document.getElementById('engine-name')
    this.engineUrl = document.getElementById('engine-url')
    this.engineIcon = document.getElementById('engine-icon')

    this.engines = []
    this.editingEngine = null

    this.init()
  }

  /**
   * 初始化设置面板
   */
  async init() {
    try {
      // 加载设置
      await this.loadSettings()

      // 绑定事件
      this.bindEvents()

      // 渲染搜索引擎列表
      this.renderEnginesList()
    } catch (error) {
      console.error('Settings initialization failed:', error)
    }
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      // 加载常规设置
      const generalSettings = await storageManager.getCategory('general')
      this.searchWidth.value = generalSettings.searchWidth || 40
      this.searchWidthValue.textContent = `${this.searchWidth.value}%`
      this.searchHeight.value = generalSettings.searchHeight || 6
      this.searchHeightValue.textContent = `${this.searchHeight.value}%`
      this.searchRadius.value = generalSettings.searchRadius || 30
      this.searchRadiusValue.textContent = `${this.searchRadius.value}px`
      this.searchOpacity.value = generalSettings.searchOpacity || 0.8
      this.searchOpacityValue.textContent = this.searchOpacity.value
      this.openIn.value = generalSettings.openIn || 'new-tab'
      this.tabSwitch.checked = generalSettings.tabSwitch !== false

      // 加载壁纸设置
      const wallpaperSettings = await storageManager.getCategory('wallpaper')
      this.wallpaperBlur.value = wallpaperSettings.blur || 0
      this.wallpaperBlurValue.textContent = `${this.wallpaperBlur.value}px`
      this.wallpaperOverlayOpacity.value =
        wallpaperSettings.overlayOpacity || 0.3
      this.wallpaperOverlayOpacityValue.textContent =
        this.wallpaperOverlayOpacity.value

      // 加载搜索引擎设置
      const enginesSettings = await storageManager.getCategory('engines')
      this.engines = [...enginesSettings.list]
      this.defaultEngine.value = enginesSettings.default || 'google'

      // 加载主题设置
      const themeSettings = await storageManager.getCategory('theme')
      const themeMode = themeSettings.mode || 'system'
      document.querySelector(
        `input[name="theme"][value="${themeMode}"]`,
      ).checked = true
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 设置面板开关
    this.settingsToggle.addEventListener('click', () => this.openSettings())
    this.settingsClose.addEventListener('click', () => this.closeSettings())

    // 点击面板外部关闭
    document.addEventListener('click', (e) => {
      if (
        this.settingsDrawer.classList.contains('open') &&
        !this.settingsDrawer.contains(e.target) &&
        !this.settingsToggle.contains(e.target)
      ) {
        this.closeSettings()
      }
    })

    // 标签页切换
    this.navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const tab = link.getAttribute('data-tab')
        this.switchTab(tab)
      })
    })

    // 常规设置事件
    this.searchWidth.addEventListener('input', (e) => {
      const value = e.target.value
      this.searchWidthValue.textContent = `${value}%`

      // 使用防抖减少更新频率
      if (this.searchWidthDebounce) {
        clearTimeout(this.searchWidthDebounce)
      }
      this.searchWidthDebounce = setTimeout(() => {
        this.updateSearchWidth(value)
      }, 300)
    })

    this.searchHeight.addEventListener('input', (e) => {
      const value = e.target.value
      this.searchHeightValue.textContent = `${value}%`

      // 使用防抖减少更新频率
      if (this.searchHeightDebounce) {
        clearTimeout(this.searchHeightDebounce)
      }
      this.searchHeightDebounce = setTimeout(() => {
        this.updateSearchHeight(value)
      }, 300)
    })

    this.searchRadius.addEventListener('input', (e) => {
      const value = e.target.value
      this.searchRadiusValue.textContent = `${value}px`

      // 使用防抖减少更新频率
      if (this.searchRadiusDebounce) {
        clearTimeout(this.searchRadiusDebounce)
      }
      this.searchRadiusDebounce = setTimeout(() => {
        this.updateSearchRadius(value)
      }, 300)
    })

    this.searchOpacity.addEventListener('input', (e) => {
      const value = e.target.value
      this.searchOpacityValue.textContent = value

      // 使用防抖减少更新频率
      if (this.searchOpacityDebounce) {
        clearTimeout(this.searchOpacityDebounce)
      }
      this.searchOpacityDebounce = setTimeout(() => {
        this.updateSearchOpacity(value)
      }, 300)
    })

    this.openIn.addEventListener('change', (e) => {
      this.updateOpenIn(e.target.value)
    })

    this.tabSwitch.addEventListener('change', (e) => {
      this.updateTabSwitch(e.target.checked)
    })

    this.resetSettings.addEventListener('click', () => {
      this.handleResetSettings()
    })

    // 壁纸设置事件
    this.wallpaperUpload.addEventListener('change', (e) => {
      this.handleWallpaperUpload(e)
    })

    this.wallpaperReset.addEventListener('click', () => {
      this.handleWallpaperReset()
    })

    this.wallpaperBlur.addEventListener('input', (e) => {
      const value = e.target.value
      this.wallpaperBlurValue.textContent = `${value}px`

      // 使用防抖减少更新频率
      if (this.wallpaperBlurDebounce) {
        clearTimeout(this.wallpaperBlurDebounce)
      }
      this.wallpaperBlurDebounce = setTimeout(() => {
        this.updateWallpaperBlur(value)
      }, 300)
    })

    this.wallpaperOverlayOpacity.addEventListener('input', (e) => {
      const value = e.target.value
      this.wallpaperOverlayOpacityValue.textContent = value

      // 使用防抖减少更新频率
      if (this.wallpaperOverlayOpacityDebounce) {
        clearTimeout(this.wallpaperOverlayOpacityDebounce)
      }
      this.wallpaperOverlayOpacityDebounce = setTimeout(() => {
        this.updateWallpaperOverlayOpacity(value)
      }, 300)
    })

    // 搜索引擎设置事件
    this.defaultEngine.addEventListener('change', (e) => {
      this.updateDefaultEngine(e.target.value)
    })

    this.addEngineBtn.addEventListener('click', () => {
      this.openEngineModal()
    })

    // 主题设置事件
    this.themeRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.updateTheme(e.target.value)
        }
      })
    })

    // 模态框事件
    this.engineModalClose.addEventListener('click', () => {
      this.closeEngineModal()
    })

    this.saveEngineBtn.addEventListener('click', () => {
      this.saveEngine()
    })

    this.cancelEngineBtn.addEventListener('click', () => {
      this.closeEngineModal()
    })

    // 点击模态框外部关闭
    this.engineModal.addEventListener('click', (e) => {
      if (e.target === this.engineModal) {
        this.closeEngineModal()
      }
    })
  }

  /**
   * 打开设置面板
   */
  openSettings() {
    this.settingsDrawer.classList.add('open')
  }

  /**
   * 关闭设置面板
   */
  closeSettings() {
    this.settingsDrawer.classList.remove('open')
  }

  /**
   * 切换标签页
   * @param {string} tab - 标签页名称
   */
  switchTab(tab) {
    // 更新导航链接
    this.navLinks.forEach((link) => {
      link.classList.remove('active')
      if (link.getAttribute('data-tab') === tab) {
        link.classList.add('active')
      }
    })

    // 更新标签页内容
    this.tabContents.forEach((content) => {
      content.classList.remove('active')
      if (content.id === `${tab}-tab`) {
        content.classList.add('active')
      }
    })

    this.currentTab = tab
  }

  /**
   * 更新搜索框宽度
   * @param {string} width - 宽度值 (百分比)
   */
  async updateSearchWidth(width) {
    try {
      await storageManager.updateCategory('general', {
        searchWidth: parseFloat(width),
      })
      this.emit('searchWidthChanged', parseFloat(width))
    } catch (error) {
      console.error('Failed to update search width:', error)
    }
  }

  /**
   * 更新搜索框高度
   * @param {string} height - 高度值 (百分比)
   */
  async updateSearchHeight(height) {
    try {
      await storageManager.updateCategory('general', {
        searchHeight: parseFloat(height),
      })
      this.emit('searchHeightChanged', parseFloat(height))
    } catch (error) {
      console.error('Failed to update search height:', error)
    }
  }

  /**
   * 更新搜索框圆角
   * @param {string} radius - 圆角值
   */
  async updateSearchRadius(radius) {
    try {
      await storageManager.updateCategory('general', {
        searchRadius: parseInt(radius),
      })
      this.emit('searchRadiusChanged', parseInt(radius))
    } catch (error) {
      console.error('Failed to update search radius:', error)
    }
  }

  /**
   * 更新搜索框透明度
   * @param {string} opacity - 透明度值
   */
  async updateSearchOpacity(opacity) {
    try {
      await storageManager.updateCategory('general', {
        searchOpacity: parseFloat(opacity),
      })
      this.emit('searchOpacityChanged', parseFloat(opacity))
    } catch (error) {
      console.error('Failed to update search opacity:', error)
    }
  }

  /**
   * 更新搜索打开方式
   * @param {string} openIn - 打开方式
   */
  async updateOpenIn(openIn) {
    try {
      await storageManager.updateCategory('general', { openIn })
      this.emit('openInChanged', openIn)
    } catch (error) {
      console.error('Failed to update open in setting:', error)
    }
  }

  /**
   * 更新Tab键切换设置
   * @param {boolean} enabled - 是否启用
   */
  async updateTabSwitch(enabled) {
    try {
      await storageManager.updateCategory('general', { tabSwitch: enabled })
      this.emit('tabSwitchChanged', enabled)
    } catch (error) {
      console.error('Failed to update tab switch setting:', error)
    }
  }

  /**
   * 处理壁纸上传
   * @param {Event} e - 文件选择事件
   */
  async handleWallpaperUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    try {
      this.emit('wallpaperUpload', file)
    } catch (error) {
      console.error('Failed to upload wallpaper:', error)
      alert('上传壁纸失败: ' + error.message)
    }

    // 清空文件输入，允许重复选择同一文件
    e.target.value = ''
  }

  /**
   * 处理壁纸重置
   */
  async handleWallpaperReset() {
    if (!confirm('确定要重置为默认壁纸吗？')) {
      return
    }

    try {
      // 触发壁纸重置事件
      this.emit('wallpaperReset')
    } catch (error) {
      console.error('Failed to reset wallpaper:', error)
      alert('重置壁纸失败: ' + error.message)
    }
  }

  /**
   * 更新壁纸模糊
   * @param {string} blur - 模糊值
   */
  async updateWallpaperBlur(blur) {
    try {
      await storageManager.updateCategory('wallpaper', { blur: parseInt(blur) })
      this.emit('wallpaperBlurChanged', parseInt(blur))
    } catch (error) {
      console.error('Failed to update wallpaper blur:', error)
    }
  }

  /**
   * 更新壁纸遮罩透明度
   * @param {string} opacity - 透明度值
   */
  async updateWallpaperOverlayOpacity(opacity) {
    try {
      await storageManager.updateCategory('wallpaper', {
        overlayOpacity: parseFloat(opacity),
      })
      this.emit('wallpaperOverlayOpacityChanged', parseFloat(opacity))
    } catch (error) {
      console.error('Failed to update wallpaper overlay opacity:', error)
    }
  }

  /**
   * 更新默认搜索引擎
   * @param {string} engineId - 搜索引擎ID
   */
  async updateDefaultEngine(engineId) {
    try {
      await storageManager.updateCategory('engines', { default: engineId })
      this.emit('defaultEngineChanged', engineId)
    } catch (error) {
      console.error('Failed to update default engine:', error)
    }
  }

  /**
   * 渲染搜索引擎列表
   */
  renderEnginesList() {
    this.enginesList.innerHTML = ''

    this.engines.forEach((engine) => {
      const engineItem = document.createElement('div')
      engineItem.className = 'engine-item'

      engineItem.innerHTML = `
                <img src="${engine.icon}" alt="${engine.name}" class="engine-icon">
                <span class="engine-name">${engine.name}</span>
                <div class="engine-actions">
                    <button class="edit-btn" data-id="${engine.id}">编辑</button>
                    <button class="delete-btn" data-id="${engine.id}">删除</button>
                </div>
            `

      // 绑定编辑和删除事件
      const editBtn = engineItem.querySelector('.edit-btn')
      const deleteBtn = engineItem.querySelector('.delete-btn')

      editBtn.addEventListener('click', () => {
        this.editEngine(engine.id)
      })

      deleteBtn.addEventListener('click', () => {
        this.deleteEngine(engine.id)
      })

      this.enginesList.appendChild(engineItem)
    })

    // 更新默认搜索引擎下拉框
    this.updateDefaultEngineOptions()
  }

  /**
   * 更新默认搜索引擎下拉框选项
   */
  updateDefaultEngineOptions() {
    this.defaultEngine.innerHTML = ''

    this.engines.forEach((engine) => {
      const option = document.createElement('option')
      option.value = engine.id
      option.textContent = engine.name
      this.defaultEngine.appendChild(option)
    })
  }

  /**
   * 打开搜索引擎模态框
   * @param {Object} engine - 要编辑的搜索引擎（可选）
   */
  openEngineModal(engine = null) {
    this.editingEngine = engine

    if (engine) {
      this.engineName.value = engine.name
      this.engineUrl.value = engine.url
      this.engineIcon.value = engine.icon
    } else {
      this.engineName.value = ''
      this.engineUrl.value = ''
      this.engineIcon.value = ''
    }

    this.engineModal.style.display = 'flex'
  }

  /**
   * 关闭搜索引擎模态框
   */
  closeEngineModal() {
    this.engineModal.style.display = 'none'
    this.editingEngine = null
  }

  /**
   * 保存搜索引擎
   */
  async saveEngine() {
    const name = this.engineName.value.trim()
    const url = this.engineUrl.value.trim()
    const icon = this.engineIcon.value.trim()

    if (!name || !url) {
      alert('请填写搜索引擎名称和URL')
      return
    }

    if (!url.includes('%s')) {
      alert('搜索URL必须包含 %s 作为关键词占位符')
      return
    }

    try {
      if (this.editingEngine) {
        // 编辑现有搜索引擎
        const index = this.engines.findIndex(
          (e) => e.id === this.editingEngine.id,
        )
        if (index !== -1) {
          this.engines[index] = {
            ...this.engines[index],
            name,
            url,
            icon: icon || this.engines[index].icon,
          }
        }
      } else {
        // 添加新搜索引擎
        const newEngine = {
          id: `custom_${Date.now()}`,
          name,
          url,
          icon: icon || 'assets/ui/search.svg',
        }
        this.engines.push(newEngine)
      }

      // 保存到存储
      await storageManager.updateCategory('engines', { list: this.engines })

      // 重新渲染列表
      this.renderEnginesList()

      // 关闭模态框
      this.closeEngineModal()

      // 触发事件
      this.emit('enginesUpdated', this.engines)
    } catch (error) {
      console.error('Failed to save engine:', error)
      alert('保存搜索引擎失败')
    }
  }

  /**
   * 编辑搜索引擎
   * @param {string} engineId - 搜索引擎ID
   */
  editEngine(engineId) {
    const engine = this.engines.find((e) => e.id === engineId)
    if (engine) {
      this.openEngineModal(engine)
    }
  }

  /**
   * 删除搜索引擎
   * @param {string} engineId - 搜索引擎ID
   */
  async deleteEngine(engineId) {
    if (!confirm('确定要删除这个搜索引擎吗？')) {
      return
    }

    try {
      this.engines = this.engines.filter((e) => e.id !== engineId)

      // 保存到存储
      await storageManager.updateCategory('engines', { list: this.engines })

      // 重新渲染列表
      this.renderEnginesList()

      // 触发事件
      this.emit('enginesUpdated', this.engines)
    } catch (error) {
      console.error('Failed to delete engine:', error)
      alert('删除搜索引擎失败')
    }
  }

  /**
   * 更新主题
   * @param {string} theme - 主题模式
   */
  async updateTheme(theme) {
    try {
      await storageManager.updateCategory('theme', { mode: theme })
      this.emit('themeChanged', theme)
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  /**
   * 处理重置设置
   */
  async handleResetSettings() {
    if (!confirm('确定要重置所有常规设置为默认值吗？')) {
      return
    }

    try {
      // 重置为默认值
      const defaultGeneral = {
        searchWidth: 40,
        searchHeight: 6,
        searchRadius: 30,
        searchOpacity: 0.8,
        openIn: 'new-tab',
        tabSwitch: true,
      }

      await storageManager.updateCategory('general', defaultGeneral)

      // 更新UI
      this.searchWidth.value = defaultGeneral.searchWidth
      this.searchWidthValue.textContent = `${defaultGeneral.searchWidth}%`
      this.searchHeight.value = defaultGeneral.searchHeight
      this.searchHeightValue.textContent = `${defaultGeneral.searchHeight}%`
      this.searchRadius.value = defaultGeneral.searchRadius
      this.searchRadiusValue.textContent = `${defaultGeneral.searchRadius}px`
      this.searchOpacity.value = defaultGeneral.searchOpacity
      this.searchOpacityValue.textContent = defaultGeneral.searchOpacity
      this.openIn.value = defaultGeneral.openIn
      this.tabSwitch.checked = defaultGeneral.tabSwitch

      // 触发事件
      this.emit('searchWidthChanged', defaultGeneral.searchWidth)
      this.emit('searchHeightChanged', defaultGeneral.searchHeight)
      this.emit('searchRadiusChanged', defaultGeneral.searchRadius)
      this.emit('searchOpacityChanged', defaultGeneral.searchOpacity)
      this.emit('openInChanged', defaultGeneral.openIn)
      this.emit('tabSwitchChanged', defaultGeneral.tabSwitch)

      alert('设置已重置为默认值')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      alert('重置设置失败')
    }
  }

  /**
   * 事件发射器
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data })
    document.dispatchEvent(customEvent)
  }
}

export default Settings
