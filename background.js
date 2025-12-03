/**
 * 后台服务脚本 (Service Worker)
 * Manifest V3 扩展的后台脚本
 */

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装:', details.reason)

  if (details.reason === 'install') {
    // 首次安装时的处理
    console.log('首次安装扩展')
  } else if (details.reason === 'update') {
    // 扩展更新时的处理
    console.log('扩展已更新')
  }
})

// 扩展启动时的处理
chrome.runtime.onStartup.addListener(() => {
  console.log('扩展已启动')
})

// 处理扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 这里可以添加点击扩展图标时的处理逻辑
  // 例如打开新标签页或显示选项页面
  console.log('扩展图标被点击')
})

// 注意：在 Manifest V3 中，不能直接使用 background.html
// 所有后台逻辑都需要在这个 Service Worker 中处理

// 可以在这里添加其他后台任务，例如：
// - 定期任务
// - 网络请求监听
// - 消息传递
// - 存储管理
