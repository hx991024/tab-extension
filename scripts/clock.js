/**
 * 时钟模块
 * 负责显示和更新当前时间与日期
 */
class Clock {
  constructor() {
    this.timeElement = document.getElementById('time')
    this.dateElement = document.getElementById('date')
    this.timer = null
    this.init()
  }

  /**
   * 初始化时钟
   */
  init() {
    this.updateTime()
    this.startTimer()
  }

  /**
   * 开始定时器
   */
  startTimer() {
    // 每秒更新一次时间
    this.timer = setInterval(() => {
      this.updateTime()
    }, 1000)
  }

  /**
   * 停止定时器
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * 更新时间和日期显示
   */
  updateTime() {
    const now = new Date()

    // 更新时间 (HH:mm:ss)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timeString = `${hours}:${minutes}:${seconds}`

    // 更新日期 (YYYY年MM月DD日 星期X)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdays = [
      '星期日',
      '星期一',
      '星期二',
      '星期三',
      '星期四',
      '星期五',
      '星期六',
    ]
    const weekday = weekdays[now.getDay()]
    const dateString = `${year}年${month}月${day}日 ${weekday}`

    // 更新DOM
    if (this.timeElement) {
      this.timeElement.textContent = timeString
    }

    if (this.dateElement) {
      this.dateElement.textContent = dateString
    }
  }

  /**
   * 销毁时钟实例
   */
  destroy() {
    this.stopTimer()
  }
}

export default Clock
