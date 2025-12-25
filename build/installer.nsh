!macro customInstall
  ; 注册文件关联
  WriteRegStr HKCR ".md" "" "md-edit.md"
  WriteRegStr HKCR "md-edit.md" "" "Markdown 文件"
  WriteRegStr HKCR "md-edit.md\DefaultIcon" "" "$INSTDIR\${PRODUCT_FILENAME}.exe,0"
  WriteRegStr HKCR "md-edit.md\shell\open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" "%1"'
  
  ; 添加右键菜单 - 使用 md-edit 打开
  WriteRegStr HKCR "*\shell\md-edit-open" "" "使用 md-edit 打开"
  WriteRegStr HKCR "*\shell\md-edit-open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" "%1"'
  
  ; 添加 .md 文件右键菜单 - 使用 md-edit 打开
  WriteRegStr HKCR ".md\shell\md-edit-open" "" "使用 md-edit 打开"
  WriteRegStr HKCR ".md\shell\md-edit-open\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" "%1"'
  
  ; 添加右键菜单 - 新建 Markdown 文件（在文件夹背景）
  WriteRegStr HKCR "Directory\Background\shell\md-edit-new" "" "新建 Markdown 文件"
  WriteRegStr HKCR "Directory\Background\shell\md-edit-new\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" --new-md "%V"'
  
  ; 添加文件夹右键菜单 - 新建 Markdown 文件
  WriteRegStr HKCR "Directory\shell\md-edit-new" "" "新建 Markdown 文件"
  WriteRegStr HKCR "Directory\shell\md-edit-new\command" "" '"$INSTDIR\${PRODUCT_FILENAME}.exe" --new-md "%1"'
  
  ; 刷新 Shell
  System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

!macro customUninstall
  ; 删除文件关联
  DeleteRegKey HKCR ".md"
  DeleteRegKey HKCR "md-edit.md"
  
  ; 删除右键菜单
  DeleteRegKey HKCR "*\shell\md-edit-open"
  DeleteRegKey HKCR ".md\shell\md-edit-open"
  DeleteRegKey HKCR "Directory\Background\shell\md-edit-new"
  DeleteRegKey HKCR "Directory\shell\md-edit-new"
  
  ; 刷新 Shell
  System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

