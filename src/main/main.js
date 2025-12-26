const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');

const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const TurndownService = require('turndown');

let mainWindow;
let preferencesWindow = null;
let fileToOpen = null;
let newMdPath = null;

function createWindow(filePath = null) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../pack/electron/icon/icon.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 等待窗口加载完成后打开文件
  mainWindow.webContents.once('did-finish-load', () => {
    if (filePath) {
      openFile(filePath);
    }
  });

  createAppMenu();
}

function openFile(filePath) {
  if (!mainWindow) return;
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow.webContents.send('file-opened', {
        path: filePath,
        content: content
      });
    }
  } catch (error) {
    console.error('打开文件失败:', error);
    dialog.showErrorBox('错误', `无法打开文件: ${error.message}`);
  }
}

function createNewMdFile(targetDir) {
  if (!mainWindow) return;
  
  try {
    // 生成新文件名
    let fileName = '新建 Markdown 文件.md';
    let filePath = path.join(targetDir, fileName);
    let counter = 1;
    
    // 如果文件已存在，添加数字后缀
    while (fs.existsSync(filePath)) {
      fileName = `新建 Markdown 文件 (${counter}).md`;
      filePath = path.join(targetDir, fileName);
      counter++;
    }
    
    // 创建新文件
    fs.writeFileSync(filePath, '', 'utf-8');
    
    // 打开新文件
    if (mainWindow) {
      mainWindow.webContents.send('file-opened', {
        path: filePath,
        content: ''
      });
      mainWindow.focus();
    }
  } catch (error) {
    console.error('创建文件失败:', error);
    dialog.showErrorBox('错误', `无法创建文件: ${error.message}`);
  }
}

// 从txt文件导入内容
async function importFromFile() {
  if (!mainWindow) return;
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要导入的txt文件',
      filters: [
        { name: '文本文件', extensions: ['txt'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];
    
    if (!fs.existsSync(filePath)) {
      dialog.showErrorBox('错误', '文件不存在');
      return;
    }

    // 尝试以 UTF-8 编码读取文件
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (encodingError) {
      // 如果 UTF-8 读取失败，尝试其他编码
      try {
        content = fs.readFileSync(filePath, 'latin1');
      } catch (error) {
        throw new Error('无法读取文件，可能是不支持的编码格式');
      }
    }

    // 发送导入的内容到渲染进程
    mainWindow.webContents.send('file-imported', {
      content: content,
      sourcePath: filePath
    });
  } catch (error) {
    console.error('导入文件失败:', error);
    dialog.showErrorBox('错误', `无法导入文件: ${error.message}`);
  }
}

// 从Word文档导入内容
async function importFromWord() {
  if (!mainWindow) return;
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要导入的Word文档',
      filters: [
        { name: 'Word文档', extensions: ['docx'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];
    
    if (!fs.existsSync(filePath)) {
      dialog.showErrorBox('错误', '文件不存在');
      return;
    }

    // 读取Word文档并转换为Markdown
    const buffer = fs.readFileSync(filePath);
    const result_mammoth = await mammoth.convertToMarkdown({ buffer: buffer });
    
    let content = result_mammoth.value;
    
    // 如果有警告信息，记录但不阻止导入
    if (result_mammoth.messages && result_mammoth.messages.length > 0) {
      console.warn('Word导入警告:', result_mammoth.messages);
    }

    // 发送导入的内容到渲染进程
    mainWindow.webContents.send('file-imported', {
      content: content,
      sourcePath: filePath
    });
  } catch (error) {
    console.error('导入Word文档失败:', error);
    dialog.showErrorBox('错误', `无法导入Word文档: ${error.message}`);
  }
}

// 从HTML文件导入内容
async function importFromHTML() {
  if (!mainWindow) return;
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要导入的HTML文件',
      filters: [
        { name: 'HTML文件', extensions: ['html', 'htm'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return;
    }

    const filePath = result.filePaths[0];
    
    if (!fs.existsSync(filePath)) {
      dialog.showErrorBox('错误', '文件不存在');
      return;
    }

    // 尝试以 UTF-8 编码读取文件
    let htmlContent;
    try {
      htmlContent = fs.readFileSync(filePath, 'utf-8');
    } catch (encodingError) {
      // 如果 UTF-8 读取失败，尝试其他编码
      try {
        htmlContent = fs.readFileSync(filePath, 'latin1');
      } catch (error) {
        throw new Error('无法读取文件，可能是不支持的编码格式');
      }
    }

    // 使用TurndownService将HTML转换为Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx', // 使用 # 风格的标题
      codeBlockStyle: 'fenced', // 使用 ``` 风格的代码块
      bulletListMarker: '-', // 使用 - 作为列表标记
      emDelimiter: '*', // 使用 * 作为斜体标记
      strongDelimiter: '**', // 使用 ** 作为粗体标记
      linkStyle: 'inlined', // 使用内联链接样式
      linkReferenceStyle: 'full' // 使用完整引用样式
    });

    // 配置TurndownService以保留更多格式
    turndownService.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: function (content) {
        return '~~' + content + '~~';
      }
    });

    turndownService.addRule('underline', {
      filter: 'u',
      replacement: function (content) {
        return '<u>' + content + '</u>';
      }
    });

    // 转换HTML为Markdown
    const markdownContent = turndownService.turndown(htmlContent);

    // 发送导入的内容到渲染进程
    mainWindow.webContents.send('file-imported', {
      content: markdownContent,
      sourcePath: filePath
    });
  } catch (error) {
    console.error('导入HTML文件失败:', error);
    dialog.showErrorBox('错误', `无法导入HTML文件: ${error.message}`);
  }
}

function createAppMenu() {
  const template = [
    {
      label: '文件(F)',
      submenu: [
        { label: '新建', accelerator: 'Ctrl+N', click: () => sendToRenderer('file-new') },
        { label: '新建窗口', accelerator: 'Ctrl+Shift+N', click: () => sendToRenderer('file-new-window') },
        { type: 'separator' },
        { label: '打开...', accelerator: 'Ctrl+O', click: () => sendToRenderer('file-open') },
        { label: '打开文件夹...', click: () => sendToRenderer('file-open-folder') },
        { type: 'separator' },
        { label: '快速打开...', accelerator: 'Ctrl+P', click: () => sendToRenderer('file-quick-open') },
        {
          label: '打开最近文件',
          submenu: [
            { label: '（暂无最近文件）', enabled: false }
          ]
        },
        { type: 'separator' },
        { label: '保存', accelerator: 'Ctrl+S', click: () => sendToRenderer('file-save') },
        { label: '另存为...', accelerator: 'Ctrl+Shift+S', click: () => sendToRenderer('file-save-as') },
        { label: '移动到...', click: () => sendToRenderer('file-move-to') },
        { label: '保存全部打开的文件...', click: () => sendToRenderer('file-save-all') },
        { type: 'separator' },
        { label: '属性...', click: () => sendToRenderer('file-properties') },
        { label: '打开文件位置...', click: () => sendToRenderer('file-open-location') },
        { label: '在侧边栏中显示', click: () => sendToRenderer('file-show-sidebar') },
        { label: '删除...', click: () => sendToRenderer('file-delete') },
        { type: 'separator' },
        {
          label: '导入...',
          submenu: [
            { label: '从txt中导入...', click: () => importFromFile() },
            { label: '从 Word 导入...', click: () => importFromWord() },
            { label: '从 HTML 导入...', click: () => importFromHTML() }
          ]
        },
        {
          label: '导出',
          submenu: [
            { label: 'PDF', click: () => sendToRenderer('file-export-pdf') },
            { label: 'HTML', click: () => sendToRenderer('file-export-html') },
            { label: 'HTML (without styles)', click: () => sendToRenderer('file-export-html-plain') },
            { label: '图像', click: () => sendToRenderer('file-export-image') },
            { type: 'separator' },
            { label: 'Word (.docx)', click: () => sendToRenderer('file-export-docx') },
            { label: 'OpenOffice', click: () => sendToRenderer('file-export-odt') },
            { label: 'RTF', click: () => sendToRenderer('file-export-rtf') },
            { label: 'Epub', click: () => sendToRenderer('file-export-epub') },
            { label: 'LaTeX', click: () => sendToRenderer('file-export-latex') },
            { label: 'Media Wiki', click: () => sendToRenderer('file-export-mediawiki') },
            { label: 'reStructuredText', click: () => sendToRenderer('file-export-rst') },
            { label: 'Textile', click: () => sendToRenderer('file-export-textile') },
            { label: 'OPML', click: () => sendToRenderer('file-export-opml') },
            { type: 'separator' },
            { label: '使用上一次设置导出', accelerator: 'Ctrl+Shift+E', click: () => sendToRenderer('file-export-last') },
            { label: '导出并覆盖上一次导出的文件', click: () => sendToRenderer('file-export-overwrite') },
            { label: '导出设置...', click: () => sendToRenderer('file-export-settings') }
          ]
        },
        { label: '打印...', accelerator: 'Alt+Shift+P', click: () => sendToRenderer('file-print') },
        { type: 'separator' },
        { label: '偏好设置...', accelerator: 'Ctrl+,', click: () => createPreferencesWindow() },
        { type: 'separator' },
        { label: '关闭', accelerator: 'Ctrl+W', click: () => sendToRenderer('file-close') }
      ]
    },
    {
      label: '编辑(E)',
      submenu: [
      { role: 'undo', label: '撤销', accelerator: 'Ctrl+Z' },
      { role: 'redo', label: '重做', accelerator: 'Ctrl+Y' },
      { type: 'separator' },
      { role: 'cut', label: '剪切', accelerator: 'Ctrl+X' },
      { role: 'copy', label: '复制', accelerator: 'Ctrl+C' },
      { label: '拷贝图片', click: () => sendToRenderer('edit-copy-image') },
      { role: 'paste', label: '粘贴', accelerator: 'Ctrl+V' },
      { type: 'separator' },
      { label: '复制为纯文本', click: () => sendToRenderer('edit-copy-plain') },
      { label: '复制为 Markdown', accelerator: 'Ctrl+Shift+C', click: () => sendToRenderer('edit-copy-md') },
      { label: '复制为 HTML 代码', click: () => sendToRenderer('edit-copy-html') },
      { label: '复制内容并保留格式', click: () => sendToRenderer('edit-copy-rich') },
      { type: 'separator' },
      { label: '粘贴为纯文本', accelerator: 'Ctrl+Shift+V', click: () => sendToRenderer('edit-paste-plain') },
      { type: 'separator' },
      {
        label: '选择',
        submenu: [{ role: 'selectAll', label: '全选' }]
      },
      { label: '上移表行', accelerator: 'Alt+Up', click: () => sendToRenderer('edit-move-row-up') },
      { label: '下移表行', accelerator: 'Alt+Down', click: () => sendToRenderer('edit-move-row-down') },
      { type: 'separator' },
      { label: '删除', click: () => sendToRenderer('edit-delete') },
      {
        label: '删除范围',
        submenu: [
          { label: '删除本段', click: () => sendToRenderer('edit-delete-range-paragraph') },
          { label: '删除本行', click: () => sendToRenderer('edit-delete-range-line') }
        ]
      },
      { type: 'separator' },
      {
        label: '数学工具',
        submenu: [{ label: '公式块', click: () => sendToRenderer('edit-math-block') }]
      },
      { type: 'separator' },
      { label: '智能标点', type: 'checkbox', checked: false, click: () => sendToRenderer('edit-smart-punctuation') },
      {
        label: '换行符',
        submenu: [
          { label: '转换为 \\n', click: () => sendToRenderer('edit-newline-n') },
          { label: '转换为 \\r\\n', click: () => sendToRenderer('edit-newline-rn') }
        ]
      },
      { label: '空格与换行', click: () => sendToRenderer('edit-spaces-newlines') },
      { label: '拼写检查...', click: () => sendToRenderer('edit-spellcheck') },
      { type: 'separator' },
      {
        label: '查找和替换',
        submenu: [
          { label: '查找', accelerator: 'Ctrl+F', click: () => sendToRenderer('edit-find') },
          { label: '查找下一个', accelerator: 'F3', click: () => sendToRenderer('edit-find-next') },
          { label: '替换', accelerator: 'Ctrl+H', click: () => sendToRenderer('edit-replace') }
        ]
      },
      { label: '表情与符号', accelerator: 'Super+.', click: () => sendToRenderer('edit-emoji') }
      ]
    },
    {
      label: '段落(P)',
      submenu: [
        {
          label: '一级标题',
          accelerator: 'Ctrl+1',
          click: () => sendToRenderer('toggle-heading-1')
        },
        {
          label: '二级标题',
          accelerator: 'Ctrl+2',
          click: () => sendToRenderer('toggle-heading-2')
        },
        {
          label: '三级标题',
          accelerator: 'Ctrl+3',
          click: () => sendToRenderer('toggle-heading-3')
        },
        {
          label: '四级标题',
          accelerator: 'Ctrl+4',
          click: () => sendToRenderer('toggle-heading-4')
        },
        {
          label: '五级标题',
          accelerator: 'Ctrl+5',
          click: () => sendToRenderer('toggle-heading-5')
        },
        {
          label: '六级标题',
          accelerator: 'Ctrl+6',
          click: () => sendToRenderer('toggle-heading-6')
        },
        { type: 'separator' },
        {
          label: '段落',
          accelerator: 'Ctrl+0',
          click: () => sendToRenderer('toggle-paragraph')
        },
        {
          label: '提升标题级别',
          accelerator: 'Ctrl+=',
          click: () => sendToRenderer('heading-promote')
        },
        {
          label: '降低标题级别',
          accelerator: 'Ctrl+-',
          click: () => sendToRenderer('heading-demote')
        },
        { type: 'separator' },
        {
          label: '有序列表',
          accelerator: 'Ctrl+Shift+[',
          click: () => sendToRenderer('toggle-ol')
        },
        {
          label: '无序列表',
          accelerator: 'Ctrl+Shift+]',
          click: () => sendToRenderer('toggle-ul')
        },
        {
          label: '任务列表',
          accelerator: 'Ctrl+Shift+X',
          click: () => sendToRenderer('toggle-task-list')
        },
        { type: 'separator' },
        {
          label: '表格',
          click: () => sendToRenderer('paragraph-insert-table')
        },
        {
          label: '公式块',
          accelerator: 'Ctrl+Shift+M',
          click: () => sendToRenderer('paragraph-math-block')
        },
        {
          label: '代码块',
          accelerator: 'Ctrl+Shift+K',
          click: () => sendToRenderer('insert-code-block')
        },
        {
          label: '代码工具',
          submenu: [
            { label: '运行代码（占位）', click: () => sendToRenderer('paragraph-code-tools-run') }
          ]
        },
        { type: 'separator' },
        {
          label: '引用',
          accelerator: 'Ctrl+Shift+Q',
          click: () => sendToRenderer('paragraph-toggle-quote')
        },
        { type: 'separator' },
        {
          label: '任务状态',
          submenu: [
            { label: '切换完成状态', click: () => sendToRenderer('paragraph-task-toggle-state') }
          ]
        },
        {
          label: '列表缩进',
          submenu: [
            { label: '增加缩进', click: () => sendToRenderer('paragraph-list-indent') },
            { label: '减少缩进', click: () => sendToRenderer('paragraph-list-outdent') }
          ]
        },
        { type: 'separator' },
        {
          label: '在上方插入段落',
          click: () => sendToRenderer('paragraph-insert-above')
        },
        {
          label: '在下方插入段落',
          click: () => sendToRenderer('paragraph-insert-below')
        },
        { type: 'separator' },
        {
          label: '链接引用',
          click: () => sendToRenderer('paragraph-link-ref')
        },
        {
          label: '脚注',
          click: () => sendToRenderer('paragraph-footnote')
        },
        { type: 'separator' },
        {
          label: '水平分割线',
          click: () => sendToRenderer('paragraph-hr')
        },
        {
          label: '内容目录',
          click: () => sendToRenderer('paragraph-toc')
        },
        {
          label: 'YAML Front Matter',
          click: () => sendToRenderer('paragraph-yaml-front-matter')
        }
      ]
    },
    {
      label: '格式(O)',
      submenu: [
        { label: '加粗', accelerator: 'Ctrl+B', click: () => sendToRenderer('toggle-bold') },
        { label: '斜体', accelerator: 'Ctrl+I', click: () => sendToRenderer('toggle-italic') },
        { label: '下划线', accelerator: 'Ctrl+U', click: () => sendToRenderer('toggle-underline') },
        {
          label: '代码',
          accelerator: 'Ctrl+Shift+`',
          click: () => sendToRenderer('toggle-inline-code')
        },
        {
          label: '删除线',
          accelerator: 'Alt+Shift+5',
          click: () => sendToRenderer('format-strike')
        },
        {
          label: '注释',
          click: () => sendToRenderer('format-comment')
        },
        { type: 'separator' },
        {
          label: '超链接',
          accelerator: 'Ctrl+K',
          click: () => sendToRenderer('format-link')
        },
        {
          label: '链接操作',
          submenu: [
            { label: '编辑链接', click: () => sendToRenderer('format-link-edit') },
            { label: '移除链接', click: () => sendToRenderer('format-link-remove') }
          ]
        },
        {
          label: '图像',
          submenu: [
            { label: '插入图片', click: () => sendToRenderer('format-image-insert') },
            { label: '编辑图片', click: () => sendToRenderer('format-image-edit') }
          ]
        },
        { type: 'separator' },
        {
          label: '清除样式',
          accelerator: 'Ctrl+\\',
          click: () => sendToRenderer('format-clear-style')
        }
      ]
    },
    {
      label: '视图(V)',
      submenu: [
        {
          label: '编辑模式',
          submenu: [
            {
              label: '对比模式',
              type: 'radio',
              checked: true,
              click: () => sendToRenderer('view-mode-split')
            },
            {
              label: '源代码模式',
              type: 'radio',
              accelerator: 'Ctrl+/',
              click: () => sendToRenderer('toggle-source-mode')
            },
            {
              label: '结果模式',
              type: 'radio',
              click: () => sendToRenderer('toggle-result-mode')
            }
          ]
        },
        { type: 'separator' },
        {
          label: '显示 / 隐藏侧边栏',
          accelerator: 'Ctrl+Shift+L',
          click: () => sendToRenderer('view-toggle-sidebar')
        },
        {
          label: '大纲',
          accelerator: 'Ctrl+Shift+1',
          click: () => sendToRenderer('view-outline')
        },
        {
          label: '文档列表',
          accelerator: 'Ctrl+Shift+2',
          click: () => sendToRenderer('view-documents')
        },
        {
          label: '文件树',
          accelerator: 'Ctrl+Shift+3',
          click: () => sendToRenderer('view-file-tree')
        },
        {
          label: '窗格',
          accelerator: 'Ctrl+Shift+F',
          click: () => sendToRenderer('view-pane')
        },
        { type: 'separator' },
        {
          label: '专注模式',
          accelerator: 'F8',
          click: () => sendToRenderer('view-focus-mode')
        },
        {
          label: '打字机模式',
          accelerator: 'F9',
          click: () => sendToRenderer('view-typewriter-mode')
        },
        { type: 'separator' },
        {
          label: '显示状态栏',
          type: 'checkbox',
          checked: true,
          click: () => sendToRenderer('view-toggle-statusbar')
        },
        {
          label: '字数统计窗口',
          click: () => sendToRenderer('view-word-count')
        },
        { type: 'separator' },
        {
          label: '切换全屏',
          role: 'togglefullscreen',
          accelerator: 'F11'
        },
        {
          label: '保持窗口在最前端',
          type: 'checkbox',
          click: (menuItem) => {
            if (mainWindow) {
              mainWindow.setAlwaysOnTop(menuItem.checked);
            }
          }
        },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小', accelerator: 'Ctrl+Shift+9' },
        { role: 'zoomIn', label: '放大', accelerator: 'Ctrl+Shift+=' },
        { role: 'zoomOut', label: '缩小', accelerator: 'Ctrl+Shift+-' },
        { type: 'separator' },
        {
          label: '应用内窗口切换',
          accelerator: 'Ctrl+Tab',
          click: () => sendToRenderer('view-switch-window')
        },
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具', accelerator: 'Shift+F12' }
      ]
    },
    {
      label: '主题(T)',
      submenu: [
        { label: 'Github', type: 'radio', checked: true, click: () => sendToRenderer('theme-github') },
        { label: 'Newsprint', type: 'radio', click: () => sendToRenderer('theme-newsprint') },
        { label: 'Night', type: 'radio', click: () => sendToRenderer('theme-night') },
        { label: 'Pixyll', type: 'radio', click: () => sendToRenderer('theme-pixyll') },
        { label: 'Whitey', type: 'radio', click: () => sendToRenderer('theme-whitey') }
      ]
    },
    {
      label: '帮助(H)',
      submenu: [
        { label: '更新日志', click: () => sendToRenderer('help-changelog') },
        { label: '隐私条款', click: () => sendToRenderer('help-privacy') },
        { label: '官方网站', click: () => sendToRenderer('help-website') },
      {
        label: '反馈',
        click: () => {
          shell.openExternal('https://github.com/HobartTimothy/md-edit/issues');
        }
      },
        { type: 'separator' },
        { label: '检查更新...', click: () => sendToRenderer('help-check-updates') },
        { label: '关于', click: () => sendToRenderer('help-about') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function sendToRenderer(channel, payload) {
  mainWindow?.webContents.send(channel, payload);
}

// 创建偏好设置窗口
function createPreferencesWindow() {
  // 如果窗口已存在，则聚焦
  if (preferencesWindow) {
    preferencesWindow.focus();
    return;
  }

  preferencesWindow = new BrowserWindow({
    width: 900,
    height: 600,
    parent: mainWindow,
    modal: false,
    icon: path.join(__dirname, '../../pack/electron/icon/icon.jpg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: '偏好设置',
    resizable: true,
    minimizable: true,
    maximizable: true
  });

  preferencesWindow.loadFile(path.join(__dirname, '../preferences/preferences.html'));

  preferencesWindow.on('closed', () => {
    preferencesWindow = null;
  });

  // 移除菜单栏
  preferencesWindow.setMenuBarVisibility(false);
}

// IPC 事件处理
ipcMain.on('open-themes-folder', () => {
  // 打开主题文件夹（这里可以根据实际需求实现）
  const themesPath = path.join(app.getPath('userData'), 'themes');
  if (!fs.existsSync(themesPath)) {
    fs.mkdirSync(themesPath, { recursive: true });
  }
  shell.openPath(themesPath);
});

ipcMain.on('open-themes-website', () => {
  shell.openExternal('https://theme.typora.io/');
});

ipcMain.on('save-settings', (event, settings) => {
  // 保存设置到配置文件
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存设置失败:', error);
  }
});

ipcMain.on('get-settings', (event) => {
  // 从配置文件读取设置
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      event.returnValue = settings;
    } else {
      event.returnValue = {};
    }
  } catch (error) {
    console.error('读取设置失败:', error);
    event.returnValue = {};
  }
});

ipcMain.on('open-preferences', () => {
  createPreferencesWindow();
});

// 导出为PDF
ipcMain.handle('export-pdf', async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: '导出为 PDF',
      defaultPath: data.defaultFilename + '.pdf',
      filters: [
        { name: 'PDF文件', extensions: ['pdf'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    // 创建一个隐藏的窗口用于生成PDF
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // 创建完整的HTML文档
    const fullHtml = createStyledHtml(data.html, data.title);

    // 加载HTML内容
    await pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));

    // 等待页面完全加载
    await new Promise(resolve => setTimeout(resolve, 500));

    // 生成PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      marginsType: 0,
      pageSize: 'A4'
    });

    // 保存PDF
    fs.writeFileSync(filePath, pdfData);
    pdfWindow.close();

    return { success: true, path: filePath };
  } catch (error) {
    console.error('导出PDF失败:', error);
    return { success: false, error: error.message };
  }
});

// 导出为HTML
ipcMain.handle('export-html', async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: '导出为 HTML',
      defaultPath: data.defaultFilename + '.html',
      filters: [
        { name: 'HTML文件', extensions: ['html', 'htm'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const htmlContent = data.withStyles 
      ? createStyledHtml(data.html, data.title)
      : createPlainHtml(data.html, data.title);
    
    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('导出HTML失败:', error);
    return { success: false, error: error.message };
  }
});

// 导出为图像
ipcMain.handle('export-image', async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: '导出为图像',
      defaultPath: data.defaultFilename + '.png',
      filters: [
        { name: 'PNG图像', extensions: ['png'] },
        { name: 'JPEG图像', extensions: ['jpg', 'jpeg'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const image = await mainWindow.webContents.capturePage();
    const buffer = filePath.toLowerCase().endsWith('.png') 
      ? image.toPNG() 
      : image.toJPEG(90);
    
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('导出图像失败:', error);
    return { success: false, error: error.message };
  }
});

// 导出为Markdown
ipcMain.handle('export-markdown', async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: '导出为 Markdown',
      defaultPath: data.defaultFilename + '.md',
      filters: [
        { name: 'Markdown文件', extensions: ['md', 'markdown'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    fs.writeFileSync(filePath, data.content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('导出Markdown失败:', error);
    return { success: false, error: error.message };
  }
});

// 创建带样式的HTML
function createStyledHtml(content, title = '未命名') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        h4 { font-size: 1em; }
        h5 { font-size: 0.875em; }
        h6 { font-size: 0.85em; color: #666; }
        p { margin-bottom: 16px; }
        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            color: #666;
            margin: 16px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        table th {
            background: #f6f8fa;
            font-weight: 600;
        }
        ul, ol {
            padding-left: 2em;
            margin: 16px 0;
        }
        li {
            margin: 4px 0;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 24px 0;
        }
    </style>
</head>
<body>
${content}
</body>
</html>`;
}

// 创建纯HTML
function createPlainHtml(content, title = '未命名') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body>
${content}
</body>
</html>`;
}

// 处理命令行参数
function handleCommandLineArgs() {
  const args = process.argv.slice(1);
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--new-md' && i + 1 < args.length) {
      newMdPath = args[i + 1];
      break;
    } else if (args[i] && !args[i].startsWith('--') && !args[i].includes('electron')) {
      // 检查是否是文件路径
      const potentialPath = path.resolve(args[i]);
      if (fs.existsSync(potentialPath) && path.extname(potentialPath).toLowerCase() === '.md') {
        fileToOpen = potentialPath;
        break;
      }
    }
  }
}

// 处理 Windows 文件关联（当用户双击 .md 文件时）
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  fileToOpen = filePath;
  
  if (mainWindow) {
    openFile(filePath);
  } else {
    createWindow(filePath);
  }
});

app.on('ready', () => {
  handleCommandLineArgs();
  createWindow(fileToOpen);
  
  // 如果需要在指定目录创建新文件，在窗口加载完成后执行
  if (newMdPath && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      createNewMdFile(newMdPath);
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 处理第二个实例启动（Windows 文件关联）
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 处理第二个实例的命令行参数
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // 检查是否有文件路径参数
      const filePath = commandLine.find(arg => 
        !arg.startsWith('--') && 
        !arg.includes('electron') && 
        path.extname(arg).toLowerCase() === '.md' &&
        fs.existsSync(arg)
      );
      
      if (filePath) {
        openFile(filePath);
      }
    }
  });
}