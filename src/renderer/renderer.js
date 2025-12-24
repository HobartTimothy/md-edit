const { marked } = require('marked');
const { ipcRenderer } = require('electron');

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

function renderMarkdown(text) {
  const rawHtml = marked.parse(text || '');
  // For桌面本地应用，简单场景下可以直接使用 marked 的输出
  preview.innerHTML = rawHtml;
}

editor.addEventListener('input', () => {
  renderMarkdown(editor.value);
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

function handleMenuCommand(channel) {
  switch (channel) {
    // 文件菜单
    case 'file-new':
      editor.value = '';
      editor.focus();
      renderMarkdown('');
      break;
    case 'file-new-window':
      alert('“新建窗口”功能待实现。');
      break;
    case 'file-open':
      alert('“打开文件”功能待实现。');
      break;
    case 'file-open-folder':
      alert('“打开文件夹”功能待实现。');
      break;
    case 'file-quick-open':
      alert('“快速打开”功能待实现。');
      break;
    case 'file-save':
      alert('“保存文件”功能待实现。');
      break;
    case 'file-save-as':
      alert('“另存为”功能待实现。');
      break;
    case 'file-move-to':
      alert('“移动到”功能待实现。');
      break;
    case 'file-save-all':
      alert('“保存全部打开的文件”功能待实现。');
      break;
    case 'file-properties':
      alert('“文件属性”功能待实现。');
      break;
    case 'file-open-location':
      alert('“打开文件位置”功能待实现。');
      break;
    case 'file-show-sidebar':
      alert('“在侧边栏中显示”功能待实现。');
      break;
    case 'file-delete':
      alert('“删除文件”功能待实现。');
      break;
    case 'file-import-word':
      alert('“从 Word 导入”功能待实现。');
      break;
    case 'file-import-html':
      alert('“从 HTML 导入”功能待实现。');
      break;
    case 'file-export-pdf':
      alert('“导出为 PDF”功能待实现。');
      break;
    case 'file-export-html':
      alert('“导出为 HTML”功能待实现。');
      break;
    case 'file-export-html-plain':
      alert('“导出为 HTML (without styles)”功能待实现。');
      break;
    case 'file-export-image':
      alert('“导出为图像”功能待实现。');
      break;
    case 'file-export-docx':
      alert('“导出为 Word (.docx)”功能待实现。');
      break;
    case 'file-export-odt':
      alert('“导出为 OpenOffice”功能待实现。');
      break;
    case 'file-export-rtf':
      alert('“导出为 RTF”功能待实现。');
      break;
    case 'file-export-epub':
      alert('“导出为 Epub”功能待实现。');
      break;
    case 'file-export-latex':
      alert('“导出为 LaTeX”功能待实现。');
      break;
    case 'file-export-mediawiki':
      alert('“导出为 Media Wiki”功能待实现。');
      break;
    case 'file-export-rst':
      alert('“导出为 reStructuredText”功能待实现。');
      break;
    case 'file-export-textile':
      alert('“导出为 Textile”功能待实现。');
      break;
    case 'file-export-opml':
      alert('“导出为 OPML”功能待实现。');
      break;
    case 'file-export-last':
      alert('“使用上一次设置导出”功能待实现。');
      break;
    case 'file-export-overwrite':
      alert('“导出并覆盖上一次导出的文件”功能待实现。');
      break;
    case 'file-export-settings':
      alert('“导出设置”功能待实现。');
      break;
    case 'file-print':
      alert('“打印”功能待实现。');
      break;
    case 'file-preferences':
      alert('“偏好设置”功能待实现。');
      break;
    case 'file-close':
      if (confirm('确定要关闭当前文件吗？')) {
        editor.value = '';
        renderMarkdown('');
      }
      break;
    // 编辑菜单
    case 'edit-copy-image':
      alert('“拷贝图片”功能待实现。');
      break;
    case 'edit-copy-plain':
      alert('“复制为纯文本”功能待实现。');
      break;
    case 'edit-copy-md':
      alert('“复制为 Markdown”功能待实现。');
      break;
    case 'edit-copy-html':
      alert('“复制为 HTML 代码”功能待实现。');
      break;
    case 'edit-copy-rich':
      alert('“复制内容并保留格式”功能待实现。');
      break;
    case 'edit-paste-plain':
      alert('“粘贴为纯文本”功能待实现。');
      break;
    case 'edit-move-row-up':
      alert('“上移表行”功能待实现。');
      break;
    case 'edit-move-row-down':
      alert('“下移表行”功能待实现。');
      break;
    case 'edit-delete':
      alert('“删除”功能待实现。');
      break;
    case 'edit-delete-range-paragraph':
      alert('“删除本段”功能待实现。');
      break;
    case 'edit-delete-range-line':
      alert('“删除本行”功能待实现。');
      break;
    case 'edit-math-block':
      alert('“数学工具/公式块”功能待实现。');
      break;
    case 'edit-smart-punctuation':
      alert('“智能标点”功能待实现。');
      break;
    case 'edit-newline-n':
      alert('“换行符转换为 \\n”功能待实现。');
      break;
    case 'edit-newline-rn':
      alert('“换行符转换为 \\r\\n”功能待实现。');
      break;
    case 'edit-spaces-newlines':
      alert('“空格与换行”功能待实现。');
      break;
    case 'edit-spellcheck':
      alert('“拼写检查”功能待实现。');
      break;
    case 'edit-find':
      alert('“查找”功能待实现。');
      break;
    case 'edit-find-next':
      alert('“查找下一个”功能待实现。');
      break;
    case 'edit-replace':
      alert('“替换”功能待实现。');
      break;
    case 'edit-emoji':
      alert('“表情与符号”功能待实现。');
      break;
    case 'toggle-underline':
      surroundSelection('<u>', '</u>');
      break;
    case 'format-strike':
      surroundSelection('~~', '~~');
      break;
    case 'format-comment':
      surroundSelection('<!-- ', ' -->');
      break;
    case 'format-link': {
      const url = window.prompt('输入链接地址：', 'https://');
      if (!url) break;
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
      break;
    }
    case 'format-link-edit':
      alert('“编辑链接”功能待实现。');
      break;
    case 'format-link-remove':
      alert('“移除链接”功能待实现。');
      break;
    case 'format-image-insert': {
      const url = window.prompt('输入图片地址：', 'https://');
      if (!url) break;
      const alt = window.prompt('输入图片说明（可选）：', '');
      const md = `![${alt || ''}](${url})`;
      insertTextAtCursor(md);
      break;
    }
    case 'format-image-edit':
      alert('“编辑图片”功能待实现。');
      break;
    case 'format-clear-style':
      alert('“清除样式”功能待实现。');
      break;
    case 'toggle-source-mode':
      alert('“源代码模式”功能待实现。');
      break;
    case 'view-toggle-sidebar':
      alert('“显示 / 隐藏侧边栏”功能待实现。');
      break;
    case 'view-outline':
      alert('“大纲”功能待实现。');
      break;
    case 'view-documents':
      alert('“文档列表”功能待实现。');
      break;
    case 'view-file-tree':
      alert('“文件树”功能待实现。');
      break;
    case 'view-pane':
      alert('“窗格”功能待实现。');
      break;
    case 'view-focus-mode':
      alert('“专注模式”功能待实现。');
      break;
    case 'view-typewriter-mode':
      alert('“打字机模式”功能待实现。');
      break;
    case 'view-toggle-statusbar':
      alert('“显示状态栏”功能待实现。');
      break;
    case 'view-word-count': {
      const text = editor.value || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      alert(`字数：${words}\n字符数：${chars}`);
      break;
    }
    case 'view-switch-window':
      alert('“应用内窗口切换”功能待实现。');
      break;
    case 'toggle-bold':
      surroundSelection('**', '**');
      break;
    case 'toggle-italic':
      surroundSelection('*', '*');
      break;
    case 'toggle-inline-code':
      surroundSelection('`', '`');
      break;
    case 'insert-code-block':
      surroundSelection('\n```language\n', '\n```\n');
      break;
    case 'toggle-heading-4':
      toggleLinePrefix('#### ');
      break;
    case 'toggle-heading-5':
      toggleLinePrefix('##### ');
      break;
    case 'toggle-heading-6':
      toggleLinePrefix('###### ');
      break;
    case 'heading-promote':
      adjustHeadingLevel(-1);
      break;
    case 'heading-demote':
      adjustHeadingLevel(1);
      break;
    case 'toggle-heading-1':
      toggleLinePrefix('# ');
      break;
    case 'toggle-heading-2':
      toggleLinePrefix('## ');
      break;
    case 'toggle-heading-3':
      toggleLinePrefix('### ');
      break;
    case 'toggle-ol':
      toggleLinePrefix('1. ');
      break;
    case 'toggle-ul':
      toggleLinePrefix('- ');
      break;
    case 'toggle-task-list':
      toggleLinePrefix('- [ ] ');
      break;
    case 'paragraph-insert-table':
      insertTextAtCursor('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n');
      break;
    case 'paragraph-math-block':
      surroundSelection('\n$$\n', '\n$$\n');
      break;
    case 'paragraph-toggle-quote':
      toggleLinePrefix('> ');
      break;
    case 'paragraph-insert-above': {
      const { lineStart } = getCurrentLineRange();
      const value = editor.value;
      editor.value = value.slice(0, lineStart) + '\n' + value.slice(lineStart);
      editor.focus();
      editor.selectionStart = editor.selectionEnd = lineStart;
      renderMarkdown(editor.value);
      break;
    }
    case 'paragraph-insert-below': {
      const { lineEnd } = getCurrentLineRange();
      const value = editor.value;
      const insertPos = value.charAt(lineEnd) === '\n' ? lineEnd + 1 : lineEnd;
      editor.value = value.slice(0, insertPos) + '\n' + value.slice(insertPos);
      editor.focus();
      editor.selectionStart = editor.selectionEnd = insertPos + 1;
      renderMarkdown(editor.value);
      break;
    }
    case 'paragraph-hr':
      insertTextAtCursor('\n\n---\n\n');
      break;
    case 'paragraph-footnote':
      insertTextAtCursor('[^1]');
      break;
    case 'paragraph-toc':
      insertTextAtCursor('\n\n<!-- TOC -->\n\n');
      break;
    case 'paragraph-yaml-front-matter': {
      const value = editor.value;
      if (value.startsWith('---\n')) break;
      const yaml = '---\n' + 'title: \n' + 'date: \n' + '---\n\n';
      editor.value = yaml + value;
      editor.focus();
      editor.selectionStart = editor.selectionEnd = yaml.length;
      renderMarkdown(editor.value);
      break;
    }
    case 'paragraph-code-tools-run':
      alert('“代码工具”功能待实现。');
      break;
    case 'paragraph-task-toggle-state':
      alert('“任务状态”功能待实现。');
      break;
    case 'paragraph-list-indent':
      alert('“列表增加缩进”功能待实现。');
      break;
    case 'paragraph-list-outdent':
      alert('“列表减少缩进”功能待实现。');
      break;
    case 'paragraph-link-ref':
      insertTextAtCursor('[链接文本][ref]\n\n[ref]: https://example.com');
      break;
    case 'theme-github':
      setTheme('github');
      break;
    case 'theme-newsprint':
      setTheme('newsprint');
      break;
    case 'theme-night':
      setTheme('night');
      break;
    case 'theme-pixyll':
      setTheme('pixyll');
      break;
    case 'theme-whitey':
      setTheme('whitey');
      break;
    case 'help-whats-new':
      alert('“最新内容”功能待实现。');
      break;
    case 'help-quick-start':
      alert('“快速上手”功能待实现。');
      break;
    case 'help-markdown-ref':
      alert('“Markdown 参考手册”功能待实现。');
      break;
    case 'help-pandoc':
      alert('“安装并使用 Pandoc”功能待实现。');
      break;
    case 'help-custom-themes':
      alert('“自定义主题”功能待实现。');
      break;
    case 'help-images':
      alert('“在编辑器中使用图片”功能待实现。');
      break;
    case 'help-data-recovery':
      alert('“数据恢复与版本控制”功能待实现。');
      break;
    case 'help-more-resources':
      alert('“更多资源”功能待实现。');
      break;
    case 'help-log':
      alert('“日志”查看功能待实现。');
      break;
    case 'help-changelog':
      alert('“更新日志”功能待实现。');
      break;
    case 'help-privacy':
      alert('“隐私条款”功能待实现。');
      break;
    case 'help-website':
      alert('“官方网站”功能待实现。');
      break;
    case 'help-check-updates':
      alert('“检查更新”功能待实现。');
      break;
    case 'help-about':
      alert('md-edit\n一个简易的 Markdown 文本编辑器。');
      break;
    default:
      break;
  }
}

// 监听主进程发送的菜单命令
const channels = [
  'file-new',
  'file-new-window',
  'file-open',
  'file-open-folder',
  'file-quick-open',
  'file-save',
  'file-save-as',
  'file-move-to',
  'file-save-all',
  'file-properties',
  'file-open-location',
  'file-show-sidebar',
  'file-delete',
  'file-import-word',
  'file-import-html',
  'file-export-pdf',
  'file-export-html',
  'file-export-html-plain',
  'file-export-image',
  'file-export-docx',
  'file-export-odt',
  'file-export-rtf',
  'file-export-epub',
  'file-export-latex',
  'file-export-mediawiki',
  'file-export-rst',
  'file-export-textile',
  'file-export-opml',
  'file-export-last',
  'file-export-overwrite',
  'file-export-settings',
  'file-print',
  'file-preferences',
  'file-close',
  'edit-copy-image',
  'edit-copy-plain',
  'edit-copy-md',
  'edit-copy-html',
  'edit-copy-rich',
  'edit-paste-plain',
  'edit-move-row-up',
  'edit-move-row-down',
  'edit-delete',
  'edit-delete-range-paragraph',
  'edit-delete-range-line',
  'edit-math-block',
  'edit-smart-punctuation',
  'edit-newline-n',
  'edit-newline-rn',
  'edit-spaces-newlines',
  'edit-spellcheck',
  'edit-find',
  'edit-find-next',
  'edit-replace',
  'edit-emoji',
  'toggle-underline',
  'format-strike',
  'format-comment',
  'format-link',
  'format-link-edit',
  'format-link-remove',
  'format-image-insert',
  'format-image-edit',
  'format-clear-style',
  'view-toggle-sidebar',
  'view-outline',
  'view-documents',
  'view-file-tree',
  'view-pane',
  'view-focus-mode',
  'view-typewriter-mode',
  'view-toggle-statusbar',
  'view-word-count',
  'view-switch-window',
  'toggle-heading-4',
  'toggle-heading-5',
  'toggle-heading-6',
  'heading-promote',
  'heading-demote',
  'paragraph-insert-table',
  'paragraph-math-block',
  'paragraph-toggle-quote',
  'paragraph-insert-above',
  'paragraph-insert-below',
  'paragraph-hr',
  'paragraph-footnote',
  'paragraph-toc',
  'paragraph-yaml-front-matter',
  'paragraph-code-tools-run',
  'paragraph-task-toggle-state',
  'paragraph-list-indent',
  'paragraph-list-outdent',
  'paragraph-link-ref',
  'toggle-heading-1',
  'toggle-heading-2',
  'toggle-heading-3',
  'toggle-paragraph',
  'toggle-ol',
  'toggle-ul',
  'toggle-task-list',
  'toggle-bold',
  'toggle-italic',
  'toggle-underline',
  'toggle-inline-code',
  'insert-code-block',
  'toggle-source-mode',
  'reset-zoom',
  'theme-github',
  'theme-newsprint',
  'theme-night',
  'theme-pixyll',
  'theme-whitey',
  'help-whats-new',
  'help-quick-start',
  'help-markdown-ref',
  'help-pandoc',
  'help-custom-themes',
  'help-images',
  'help-data-recovery',
  'help-more-resources',
  'help-log',
  'help-changelog',
  'help-privacy',
  'help-website',
  'help-check-updates',
  'help-about'
];

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
