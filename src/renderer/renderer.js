const { marked } = require('marked');
const { ipcRenderer } = require('electron');

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const resultPane = document.getElementById('result-pane');
const appRoot = document.getElementById('app-root');

// 当前模式：'split'（对比模式）、'source'（源代码模式）、'result'（结果模式）
let currentMode = 'split';

function renderMarkdown(text) {
  const rawHtml = marked.parse(text || '');
  // For桌面本地应用，简单场景下可以直接使用 marked 的输出
  preview.innerHTML = rawHtml;
  if (currentMode === 'result') {
    resultPane.innerHTML = rawHtml;
  }
}

// 设置模式
function setMode(mode) {
  currentMode = mode;
  appRoot.className = `app-root mode-${mode}`;
  
  if (mode === 'result') {
    // 切换到结果模式时，将当前markdown渲染到结果面板
    isUpdatingResultPane = true;
    const markdown = editor.value || '';
    resultPane.innerHTML = marked.parse(markdown);
    
    // 确保result-pane可以编辑
    resultPane.contentEditable = 'true';
    
    // 延迟聚焦，确保DOM已更新
    setTimeout(() => {
      resultPane.focus();
      // 将光标移动到末尾
      const range = document.createRange();
      range.selectNodeContents(resultPane);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      isUpdatingResultPane = false;
    }, 50);
  } else if (mode === 'source') {
    // 切换到源代码模式时，聚焦编辑器
    editor.focus();
  } else {
    // 对比模式
    renderMarkdown(editor.value);
  }
}

// 初始化默认模式
setMode('split');

editor.addEventListener('input', () => {
  if (currentMode !== 'result') {
    renderMarkdown(editor.value);
  }
});

// 简单的HTML到Markdown转换函数
function htmlToMarkdown(html) {
  if (!html) return '';
  
  // 创建一个临时div来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 递归转换节点
  function convertNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const tagName = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(convertNode).join('');
    
    switch (tagName) {
      case 'h1': return `# ${children}\n\n`;
      case 'h2': return `## ${children}\n\n`;
      case 'h3': return `### ${children}\n\n`;
      case 'h4': return `#### ${children}\n\n`;
      case 'h5': return `##### ${children}\n\n`;
      case 'h6': return `###### ${children}\n\n`;
      case 'p': return `${children}\n\n`;
      case 'strong':
      case 'b': return `**${children}**`;
      case 'em':
      case 'i': return `*${children}*`;
      case 'u': return `<u>${children}</u>`;
      case 'code': return node.parentNode.tagName === 'PRE' ? children : `\`${children}\``;
      case 'pre': return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case 'blockquote': return `> ${children.split('\n').join('\n> ')}\n\n`;
      case 'ul': return `${children}\n`;
      case 'ol': return `${children}\n`;
      case 'li': {
        const parent = node.parentNode;
        const isOrdered = parent.tagName === 'OL';
        const index = Array.from(parent.children).indexOf(node);
        const prefix = isOrdered ? `${index + 1}. ` : '- ';
        return `${prefix}${children}\n`;
      }
      case 'a': {
        const href = node.getAttribute('href') || '';
        return `[${children}](${href})`;
      }
      case 'img': {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        return `![${alt}](${src})`;
      }
      case 'hr': return '---\n\n';
      case 'br': return '\n';
      default: return children;
    }
  }
  
  return Array.from(tempDiv.childNodes).map(convertNode).join('').trim();
}

// 结果模式编辑事件处理
let resultEditTimeout = null;
let isUpdatingResultPane = false;

resultPane.addEventListener('input', () => {
  if (currentMode !== 'result' || isUpdatingResultPane) return;
  
  // 防抖处理
  if (resultEditTimeout) {
    clearTimeout(resultEditTimeout);
  }
  
  resultEditTimeout = setTimeout(() => {
    try {
      // 保存当前光标位置
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
      
      const html = resultPane.innerHTML;
      const markdown = htmlToMarkdown(html);
      editor.value = markdown;
      
      // 重新渲染
      isUpdatingResultPane = true;
      resultPane.innerHTML = marked.parse(markdown);
      
      // 尝试恢复光标位置（简化处理）
      if (resultPane.firstChild) {
        const newRange = document.createRange();
        newRange.selectNodeContents(resultPane);
        newRange.collapse(false); // 移动到末尾
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      isUpdatingResultPane = false;
    } catch (error) {
      console.error('结果模式编辑错误:', error);
      isUpdatingResultPane = false;
    }
  }, 500);
});

// 结果模式粘贴事件处理（转换为纯文本）
resultPane.addEventListener('paste', (e) => {
  if (currentMode !== 'result') return;
  
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  
  // 插入纯文本
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// Basic formatting helpers
function surroundSelection(before, after = before) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const selected = value.slice(start, end);
  const newText = before + selected + after;
  editor.value = value.slice(0, start) + newText + value.slice(end);
  editor.focus();
  editor.selectionStart = start + before.length;
  editor.selectionEnd = start + before.length + selected.length;
  renderMarkdown(editor.value);
}

function toggleLinePrefix(prefix) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  const lines = selected.split('\n').map((line) => {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length);
    }
    return prefix + line;
  });

  const newSelected = lines.join('\n');
  editor.value = before + newSelected + after;
  editor.focus();
  editor.selectionStart = start;
  editor.selectionEnd = start + newSelected.length;
  renderMarkdown(editor.value);
}

function getCurrentLineRange() {
  const value = editor.value;
  const pos = editor.selectionStart;
  const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = value.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEnd };
}

function insertTextAtCursor(text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  editor.value = value.slice(0, start) + text + value.slice(end);
  const newPos = start + text.length;
  editor.focus();
  editor.selectionStart = editor.selectionEnd = newPos;
  renderMarkdown(editor.value);
}

function adjustHeadingLevel(delta) {
  const { lineStart, lineEnd } = getCurrentLineRange();
  const value = editor.value;
  const line = value.slice(lineStart, lineEnd);
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return;
  let level = match[1].length + delta;
  if (level < 1) level = 1;
  if (level > 6) level = 6;
  const newLine = `${'#'.repeat(level)} ${match[2]}`;
  editor.value = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
  editor.focus();
  editor.selectionStart = editor.selectionEnd = lineStart + newLine.length;
  renderMarkdown(editor.value);
}

function setTheme(theme) {
  const themes = ['github-theme', 'newsprint-theme', 'night-theme', 'pixyll-theme', 'whitey-theme'];
  themes.forEach((t) => document.body.classList.remove(t));
  const cls = `${theme}-theme`;
  document.body.classList.add(cls);
}

// 辅助函数：待实现功能提示
function notImplemented(featureName) {
  alert(`"${featureName}"功能待实现。`);
}

// 辅助函数：插入链接
function insertLink() {
  const url = window.prompt('输入链接地址：', 'https://');
  if (!url) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const selected = value.slice(start, end) || '链接文本';
  const md = `[${selected}](${url})`;
  editor.value = value.slice(0, start) + md + value.slice(end);
  editor.focus();
  editor.selectionStart = start;
  editor.selectionEnd = start + md.length;
  renderMarkdown(editor.value);
}

// 辅助函数：插入图片
function insertImage() {
  const url = window.prompt('输入图片地址：', 'https://');
  if (!url) return;
  const alt = window.prompt('输入图片说明（可选）：', '');
  const md = `![${alt || ''}](${url})`;
  insertTextAtCursor(md);
}

// 命令映射对象
const commandHandlers = {
  // 文件菜单
  'file-new': () => {
    editor.value = '';
    editor.focus();
    renderMarkdown('');
  },
  'file-new-window': () => notImplemented('新建窗口'),
  'file-open': () => notImplemented('打开文件'),
  'file-open-folder': () => notImplemented('打开文件夹'),
  'file-quick-open': () => notImplemented('快速打开'),
  'file-save': () => notImplemented('保存文件'),
  'file-save-as': () => notImplemented('另存为'),
  'file-move-to': () => notImplemented('移动到'),
  'file-save-all': () => notImplemented('保存全部打开的文件'),
  'file-properties': () => notImplemented('文件属性'),
  'file-open-location': () => notImplemented('打开文件位置'),
  'file-show-sidebar': () => notImplemented('在侧边栏中显示'),
  'file-delete': () => notImplemented('删除文件'),
  'file-import-word': () => notImplemented('从 Word 导入'),
  'file-import-html': () => notImplemented('从 HTML 导入'),
  'file-export-pdf': () => notImplemented('导出为 PDF'),
  'file-export-html': () => notImplemented('导出为 HTML'),
  'file-export-html-plain': () => notImplemented('导出为 HTML (without styles)'),
  'file-export-image': () => notImplemented('导出为图像'),
  'file-export-docx': () => notImplemented('导出为 Word (.docx)'),
  'file-export-odt': () => notImplemented('导出为 OpenOffice'),
  'file-export-rtf': () => notImplemented('导出为 RTF'),
  'file-export-epub': () => notImplemented('导出为 Epub'),
  'file-export-latex': () => notImplemented('导出为 LaTeX'),
  'file-export-mediawiki': () => notImplemented('导出为 Media Wiki'),
  'file-export-rst': () => notImplemented('导出为 reStructuredText'),
  'file-export-textile': () => notImplemented('导出为 Textile'),
  'file-export-opml': () => notImplemented('导出为 OPML'),
  'file-export-last': () => notImplemented('使用上一次设置导出'),
  'file-export-overwrite': () => notImplemented('导出并覆盖上一次导出的文件'),
  'file-export-settings': () => notImplemented('导出设置'),
  'file-print': () => notImplemented('打印'),
  'file-preferences': () => notImplemented('偏好设置'),
  'file-close': () => {
    if (confirm('确定要关闭当前文件吗？')) {
      editor.value = '';
      renderMarkdown('');
    }
  },
  
  // 编辑菜单
  'edit-copy-image': () => notImplemented('拷贝图片'),
  'edit-copy-plain': () => notImplemented('复制为纯文本'),
  'edit-copy-md': () => notImplemented('复制为 Markdown'),
  'edit-copy-html': () => notImplemented('复制为 HTML 代码'),
  'edit-copy-rich': () => notImplemented('复制内容并保留格式'),
  'edit-paste-plain': () => notImplemented('粘贴为纯文本'),
  'edit-move-row-up': () => notImplemented('上移表行'),
  'edit-move-row-down': () => notImplemented('下移表行'),
  'edit-delete': () => notImplemented('删除'),
  'edit-delete-range-paragraph': () => notImplemented('删除本段'),
  'edit-delete-range-line': () => notImplemented('删除本行'),
  'edit-math-block': () => notImplemented('数学工具/公式块'),
  'edit-smart-punctuation': () => notImplemented('智能标点'),
  'edit-newline-n': () => notImplemented('换行符转换为 \\n'),
  'edit-newline-rn': () => notImplemented('换行符转换为 \\r\\n'),
  'edit-spaces-newlines': () => notImplemented('空格与换行'),
  'edit-spellcheck': () => notImplemented('拼写检查'),
  'edit-find': () => notImplemented('查找'),
  'edit-find-next': () => notImplemented('查找下一个'),
  'edit-replace': () => notImplemented('替换'),
  'edit-emoji': () => notImplemented('表情与符号'),
  
  // 格式菜单
  'toggle-underline': () => surroundSelection('<u>', '</u>'),
  'format-strike': () => surroundSelection('~~', '~~'),
  'format-comment': () => surroundSelection('<!-- ', ' -->'),
  'format-link': insertLink,
  'format-link-edit': () => notImplemented('编辑链接'),
  'format-link-remove': () => notImplemented('移除链接'),
  'format-image-insert': insertImage,
  'format-image-edit': () => notImplemented('编辑图片'),
  'format-clear-style': () => notImplemented('清除样式'),
  
  // 视图菜单 - 模式切换
  'view-mode-split': () => setMode('split'),
  'toggle-source-mode': () => setMode('source'),
  'toggle-result-mode': () => setMode('result'),
  'view-toggle-sidebar': () => notImplemented('显示 / 隐藏侧边栏'),
  'view-outline': () => notImplemented('大纲'),
  'view-documents': () => notImplemented('文档列表'),
  'view-file-tree': () => notImplemented('文件树'),
  'view-pane': () => notImplemented('窗格'),
  'view-focus-mode': () => notImplemented('专注模式'),
  'view-typewriter-mode': () => notImplemented('打字机模式'),
  'view-toggle-statusbar': () => notImplemented('显示状态栏'),
  'view-word-count': () => {
    const text = editor.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    alert(`字数：${words}\n字符数：${chars}`);
  },
  'view-switch-window': () => notImplemented('应用内窗口切换'),
  
  // 格式化命令
  'toggle-bold': () => surroundSelection('**', '**'),
  'toggle-italic': () => surroundSelection('*', '*'),
  'toggle-inline-code': () => surroundSelection('`', '`'),
  'insert-code-block': () => surroundSelection('\n```language\n', '\n```\n'),
  'toggle-heading-1': () => toggleLinePrefix('# '),
  'toggle-heading-2': () => toggleLinePrefix('## '),
  'toggle-heading-3': () => toggleLinePrefix('### '),
  'toggle-heading-4': () => toggleLinePrefix('#### '),
  'toggle-heading-5': () => toggleLinePrefix('##### '),
  'toggle-heading-6': () => toggleLinePrefix('###### '),
  'heading-promote': () => adjustHeadingLevel(-1),
  'heading-demote': () => adjustHeadingLevel(1),
  'toggle-paragraph': () => toggleLinePrefix(''),
  'toggle-ol': () => toggleLinePrefix('1. '),
  'toggle-ul': () => toggleLinePrefix('- '),
  'toggle-task-list': () => toggleLinePrefix('- [ ] '),
  'paragraph-insert-table': () => insertTextAtCursor('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n'),
  'paragraph-math-block': () => surroundSelection('\n$$\n', '\n$$\n'),
  'paragraph-toggle-quote': () => toggleLinePrefix('> '),
  'paragraph-insert-above': () => {
    const { lineStart } = getCurrentLineRange();
    const value = editor.value;
    editor.value = value.slice(0, lineStart) + '\n' + value.slice(lineStart);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = lineStart;
    renderMarkdown(editor.value);
  },
  'paragraph-insert-below': () => {
    const { lineEnd } = getCurrentLineRange();
    const value = editor.value;
    const insertPos = value.charAt(lineEnd) === '\n' ? lineEnd + 1 : lineEnd;
    editor.value = value.slice(0, insertPos) + '\n' + value.slice(insertPos);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = insertPos + 1;
    renderMarkdown(editor.value);
  },
  'paragraph-hr': () => insertTextAtCursor('\n\n---\n\n'),
  'paragraph-footnote': () => insertTextAtCursor('[^1]'),
  'paragraph-toc': () => insertTextAtCursor('\n\n<!-- TOC -->\n\n'),
  'paragraph-yaml-front-matter': () => {
    const value = editor.value;
    if (value.startsWith('---\n')) return;
    const yaml = '---\n' + 'title: \n' + 'date: \n' + '---\n\n';
    editor.value = yaml + value;
    editor.focus();
    editor.selectionStart = editor.selectionEnd = yaml.length;
    renderMarkdown(editor.value);
  },
  'paragraph-code-tools-run': () => notImplemented('代码工具'),
  'paragraph-task-toggle-state': () => notImplemented('任务状态'),
  'paragraph-list-indent': () => notImplemented('列表增加缩进'),
  'paragraph-list-outdent': () => notImplemented('列表减少缩进'),
  'paragraph-link-ref': () => insertTextAtCursor('[链接文本][ref]\n\n[ref]: https://example.com'),
  
  // 主题菜单
  'theme-github': () => setTheme('github'),
  'theme-newsprint': () => setTheme('newsprint'),
  'theme-night': () => setTheme('night'),
  'theme-pixyll': () => setTheme('pixyll'),
  'theme-whitey': () => setTheme('whitey'),
  
  // 帮助菜单
  'help-whats-new': () => notImplemented('最新内容'),
  'help-quick-start': () => notImplemented('快速上手'),
  'help-markdown-ref': () => notImplemented('Markdown 参考手册'),
  'help-pandoc': () => notImplemented('安装并使用 Pandoc'),
  'help-custom-themes': () => notImplemented('自定义主题'),
  'help-images': () => notImplemented('在编辑器中使用图片'),
  'help-data-recovery': () => notImplemented('数据恢复与版本控制'),
  'help-more-resources': () => notImplemented('更多资源'),
  'help-log': () => notImplemented('日志'),
  'help-changelog': () => notImplemented('更新日志'),
  'help-privacy': () => notImplemented('隐私条款'),
  'help-website': () => notImplemented('官方网站'),
  'help-check-updates': () => notImplemented('检查更新'),
  'help-about': () => alert('md-edit\n一个简易的 Markdown 文本编辑器。')
};

function handleMenuCommand(channel) {
  const handler = commandHandlers[channel];
  if (handler) {
    handler();
  }
}

// 监听主进程发送的菜单命令 - 从 commandHandlers 自动生成 channels 列表
const channels = Object.keys(commandHandlers);

channels.forEach((ch) => {
  ipcRenderer.on(ch, () => handleMenuCommand(ch));
});

// Initial render
renderMarkdown('');

// ---------- 右键上下文菜单 ----------

let currentOpenSubmenu = null; // 跟踪当前打开的子菜单

function buildContextMenu() {
  const menu = document.createElement('div');
  menu.id = 'md-context-menu';
  menu.className = 'context-menu';
  menu.innerHTML = [
    '<div class="context-menu-row context-menu-icons">',
    '  <div class="context-menu-btn" data-command="edit-cut" title="剪切">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10.97 4.323a1.75 1.75 0 0 0-2.47-2.47L4.75 5.5a.75.75 0 0 0 0 1.06l3.75 3.75a1.75 1.75 0 0 0 2.47-2.47L8.06 6.5l2.91-2.177Zm-1.94 3.354L6.5 5.94 3.59 8.118a1.75 1.75 0 1 0 2.47 2.47L8.06 8.5l.97-.823Z"/></svg>',
    '  </div>',
    '  <div class="context-menu-btn" data-command="edit-copy" title="复制">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25v-7.5Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25v-7.5Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25h-7.5Z"/></svg>',
    '  </div>',
    '  <div class="context-menu-btn" data-command="edit-paste" title="粘贴">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>',
    '  </div>',
    '  <div class="context-menu-btn" data-command="edit-delete" title="删除">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.184 6.378a.25.25 0 0 0 .25.225h5.14a.25.25 0 0 0 .25-.225l.184-6.378a.75.75 0 0 1 1.492.086l-.184 6.378A1.75 1.75 0 0 1 10.27 15H5.23a1.75 1.75 0 0 1-1.742-1.951l.184-6.378a.75.75 0 1 1 1.492-.086ZM6.5 4.75V3h3v1.75a.75.75 0 0 1-1.5 0Z"/></svg>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-item has-submenu">',
    '    <span class="context-menu-item-label">复制 / 粘贴为...</span>',
    '    <div class="context-submenu">',
    '      <div class="context-menu-item" data-command="edit-copy-plain"><span class="context-menu-item-label">复制为纯文本</span></div>',
    '      <div class="context-menu-item" data-command="edit-copy-md"><span class="context-menu-item-label">复制为 Markdown</span></div>',
    '      <div class="context-menu-item" data-command="edit-copy-html"><span class="context-menu-item-label">复制为 HTML 代码</span></div>',
    '      <div class="context-menu-item" data-command="edit-paste-plain"><span class="context-menu-item-label">粘贴为纯文本</span></div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row context-menu-icons">',
    '  <div class="context-menu-btn" data-command="toggle-bold" title="加粗"><strong>B</strong></div>',
    '  <div class="context-menu-btn" data-command="toggle-italic" title="斜体"><em>I</em></div>',
    '  <div class="context-menu-btn" data-command="toggle-inline-code" title="代码">&lt;/&gt;</div>',
    '  <div class="context-menu-btn" data-command="format-link" title="超链接">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83-2.83Z"/></svg>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row context-menu-icons">',
    '  <div class="context-menu-btn" data-command="paragraph-toggle-quote" title="引用">""</div>',
    '  <div class="context-menu-btn" data-command="toggle-ul" title="无序列表">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm3.75-1.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Zm0 5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>',
    '  </div>',
    '  <div class="context-menu-btn" data-command="toggle-ol" title="有序列表">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2.003 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Z"/></svg>',
    '  </div>',
    '  <div class="context-menu-btn" data-command="toggle-task-list" title="任务列表">',
    '    <svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-item has-submenu">',
    '    <span class="context-menu-item-label">段落</span>',
    '    <div class="context-submenu">',
    '      <div class="context-menu-item" data-command="toggle-heading-1"><span class="context-menu-item-label">一级标题</span><span class="context-menu-item-shortcut">Ctrl+1</span></div>',
    '      <div class="context-menu-item" data-command="toggle-heading-2"><span class="context-menu-item-label">二级标题</span><span class="context-menu-item-shortcut">Ctrl+2</span></div>',
    '      <div class="context-menu-item" data-command="toggle-heading-3"><span class="context-menu-item-label">三级标题</span><span class="context-menu-item-shortcut">Ctrl+3</span></div>',
    '      <div class="context-menu-item" data-command="toggle-heading-4"><span class="context-menu-item-label">四级标题</span><span class="context-menu-item-shortcut">Ctrl+4</span></div>',
    '      <div class="context-menu-item" data-command="toggle-heading-5"><span class="context-menu-item-label">五级标题</span><span class="context-menu-item-shortcut">Ctrl+5</span></div>',
    '      <div class="context-menu-item" data-command="toggle-heading-6"><span class="context-menu-item-label">六级标题</span><span class="context-menu-item-shortcut">Ctrl+6</span></div>',
    '      <div class="context-menu-separator"></div>',
    '      <div class="context-menu-item" data-command="toggle-paragraph"><span class="context-menu-item-label">段落</span><span class="context-menu-item-shortcut">Ctrl+0</span></div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-item has-submenu">',
    '    <span class="context-menu-item-label">插入</span>',
    '    <div class="context-submenu">',
    '      <div class="context-menu-item" data-command="format-image-insert"><span class="context-menu-item-label">图像</span><span class="context-menu-item-shortcut">Ctrl+Shift+I</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-footnote"><span class="context-menu-item-label">脚注</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-link-ref"><span class="context-menu-item-label">链接引用</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-hr"><span class="context-menu-item-label">水平分割线</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-table"><span class="context-menu-item-label">表格</span><span class="context-menu-item-shortcut">Ctrl+T</span></div>',
    '      <div class="context-menu-item" data-command="insert-code-block"><span class="context-menu-item-label">代码块</span><span class="context-menu-item-shortcut">Ctrl+Shift+K</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-math-block"><span class="context-menu-item-label">公式块</span><span class="context-menu-item-shortcut">Ctrl+Shift+M</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-toc"><span class="context-menu-item-label">内容目录</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-yaml-front-matter"><span class="context-menu-item-label">YAML Front Matter</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-above"><span class="context-menu-item-label">段落（上方）</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-below"><span class="context-menu-item-label">段落（下方）</span></div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.appendChild(menu);

  // 处理子菜单hover显示 - 确保一次只展开一个子菜单
  let hideTimeout = null;
  
  // 关闭所有子菜单的函数
  function closeAllSubmenus(except = null) {
    const allSubmenus = menu.querySelectorAll('.context-submenu');
    allSubmenus.forEach(sub => {
      if (sub !== except) {
        sub.style.display = 'none';
      }
    });
  }

  const submenuItems = menu.querySelectorAll('.has-submenu');
  submenuItems.forEach(item => {
    const submenu = item.querySelector('.context-submenu');
    if (!submenu) return;

    item.addEventListener('mouseenter', () => {
      // 清除之前的隐藏定时器
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      
      // 如果当前已经有打开的子菜单且不是当前这个，先关闭它
      if (currentOpenSubmenu && currentOpenSubmenu !== submenu) {
        currentOpenSubmenu.style.display = 'none';
      }
      
      // 打开当前子菜单
      submenu.style.display = 'block';
      currentOpenSubmenu = submenu;
      
      // 调整子菜单位置，确保不超出屏幕
      setTimeout(() => {
        const rect = item.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();
        if (rect.right + submenuRect.width > window.innerWidth) {
          submenu.style.left = 'auto';
          submenu.style.right = '100%';
          submenu.style.marginRight = '4px';
          submenu.style.marginLeft = '0';
        } else {
          submenu.style.left = '100%';
          submenu.style.right = 'auto';
          submenu.style.marginLeft = '4px';
          submenu.style.marginRight = '0';
        }
      }, 0);
    });

    item.addEventListener('mouseleave', (e) => {
      // 检查鼠标是否移动到子菜单
      const relatedTarget = e.relatedTarget;
      if (relatedTarget && (submenu.contains(relatedTarget) || submenu === relatedTarget)) {
        return; // 鼠标移动到子菜单，不隐藏
      }
      hideTimeout = setTimeout(() => {
        submenu.style.display = 'none';
        if (currentOpenSubmenu === submenu) {
          currentOpenSubmenu = null;
        }
      }, 150);
    });

    // 子菜单hover时保持显示
    submenu.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      submenu.style.display = 'block';
      currentOpenSubmenu = submenu;
    });

    submenu.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        submenu.style.display = 'none';
        if (currentOpenSubmenu === submenu) {
          currentOpenSubmenu = null;
        }
      }, 150);
    });
  });

  menu.addEventListener('click', (e) => {
    const target = e.target.closest('[data-command]');
    if (!target) return;
    const cmd = target.getAttribute('data-command');
    if (cmd === 'edit-cut') {
      document.execCommand('cut');
    } else if (cmd === 'edit-copy') {
      document.execCommand('copy');
    } else if (cmd === 'edit-paste') {
      document.execCommand('paste');
    } else {
      handleMenuCommand(cmd);
    }
    hideContextMenu();
  });

  return menu;
}

function showContextMenu(x, y) {
  const menu = document.getElementById('md-context-menu') || buildContextMenu();
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.classList.add('visible');
}

function hideContextMenu() {
  const menu = document.getElementById('md-context-menu');
  if (menu) {
    menu.classList.remove('visible');
    // 隐藏所有子菜单
    const submenus = menu.querySelectorAll('.context-submenu');
    submenus.forEach(submenu => {
      submenu.style.display = 'none';
    });
    // 重置当前打开的子菜单
    currentOpenSubmenu = null;
  }
}

editor.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});

document.addEventListener('click', (e) => {
  const menu = document.getElementById('md-context-menu');
  if (!menu) return;
  if (!menu.contains(e.target)) {
    hideContextMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideContextMenu();
  }
});
