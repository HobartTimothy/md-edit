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
  'file-open',
  'file-save',
  'file-save-as',
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

function buildContextMenu() {
  const menu = document.createElement('div');
  menu.id = 'md-context-menu';
  menu.className = 'context-menu';
  menu.innerHTML = [
    '<div class="context-menu-row">',
    '  <div class="context-menu-btn" data-command="edit-cut">✂</div>',
    '  <div class="context-menu-btn" data-command="edit-copy">📄</div>',
    '  <div class="context-menu-btn" data-command="edit-paste">📋</div>',
    '  <div class="context-menu-btn" data-command="edit-delete">🗑</div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-btn" data-command="toggle-bold">B</div>',
    '  <div class="context-menu-btn" data-command="toggle-italic"><i>I</i></div>',
    '  <div class="context-menu-btn" data-command="toggle-inline-code">&lt;/&gt;</div>',
    '  <div class="context-menu-btn" data-command="format-link">🔗</div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-btn" data-command="paragraph-toggle-quote">“”</div>',
    '  <div class="context-menu-btn" data-command="toggle-ol">1.</div>',
    '  <div class="context-menu-btn" data-command="toggle-ul">•</div>',
    '  <div class="context-menu-btn" data-command="toggle-task-list">☑</div>',
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
    '      <div class="context-menu-item" data-command="toggle-paragraph"><span class="context-menu-item-label">段落</span><span class="context-menu-item-shortcut">Ctrl+0</span></div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<div class="context-menu-row">',
    '  <div class="context-menu-item has-submenu">',
    '    <span class="context-menu-item-label">插入</span>',
    '    <div class="context-submenu">',
    '      <div class="context-menu-item" data-command="format-image-insert"><span class="context-menu-item-label">图像</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-footnote"><span class="context-menu-item-label">脚注</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-link-ref"><span class="context-menu-item-label">链接引用</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-hr"><span class="context-menu-item-label">水平分割线</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-table"><span class="context-menu-item-label">表格</span></div>',
    '      <div class="context-menu-item" data-command="insert-code-block"><span class="context-menu-item-label">代码块</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-math-block"><span class="context-menu-item-label">公式块</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-toc"><span class="context-menu-item-label">内容目录</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-yaml-front-matter"><span class="context-menu-item-label">YAML Front Matter</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-above"><span class="context-menu-item-label">段落（上方）</span></div>',
    '      <div class="context-menu-item" data-command="paragraph-insert-below"><span class="context-menu-item-label">段落（下方）</span></div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.appendChild(menu);

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
