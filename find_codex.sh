#!/bin/bash
echo "=== 查找真正的 Codex 应用 ==="

# 在 Windows 中查找
echo "1. 在 Windows Program Files 中查找:"
find /mnt/c/Program\ Files -name "*codex*" -type f 2>/dev/null | head -10
find /mnt/c/Program\ Files\ \(x86\) -name "*codex*" -type f 2>/dev/null | head -10

echo ""
echo "2. 在 AppData 中查找:"
find /mnt/c/Users/jeffl/AppData -name "*codex*" -type f 2>/dev/null | head -10

echo ""
echo "3. 在桌面和开始菜单中查找:"
find /mnt/c/Users/jeffl/Desktop -name "*codex*" -type f 2>/dev/null
find /mnt/c/ProgramData/Microsoft/Windows/Start\ Menu -name "*codex*" -type f 2>/dev/null

echo ""
echo "4. 查看激活器安装了什么:"
ls -la /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/

echo ""
echo "5. 查看 package.json 了解详情:"
cat /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/package.json 2>/dev/null | python3 -m json.tool
