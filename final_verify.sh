#!/bin/bash
echo "=== 最终验证 ==="
echo ""

all_clean=true

echo "1. 检查 npm 包:"
if npm list -g 2>/dev/null | grep -q "codex-activator"; then
    echo "   ❌ npm 包仍存在"
    all_clean=false
else
    echo "   ✅ npm 包已卸载"
fi

echo ""
echo "2. 检查命令文件:"
if [ -f "/mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator.cmd" ] || \
   [ -f "/mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator.ps1" ]; then
    echo "   ❌ 命令文件仍存在"
    ls -la /mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator.* 2>/dev/null
    all_clean=false
else
    echo "   ✅ 命令文件已删除"
fi

echo ""
echo "3. 检查 WSL 脚本:"
scripts=$(ls ~/.local/bin/codex* ~/.local/bin/cdx 2>/dev/null | wc -l)
if [ $scripts -gt 0 ]; then
    echo "   ❌ WSL 脚本仍存在 ($scripts 个)"
    ls -la ~/.local/bin/codex* ~/.local/bin/cdx 2>/dev/null
    all_clean=false
else
    echo "   ✅ WSL 脚本已删除"
fi

echo ""
echo "4. 尝试运行命令:"
if codex-activator --help 2>&1 | grep -q "command not found\|无法将"; then
    echo "   ✅ 命令无法执行"
else
    echo "   ❌ 命令仍可执行"
    all_clean=false
fi

echo ""
echo "=== 结果 ==="
if $all_clean; then
    echo "🎉 完全卸载干净！"
else
    echo "⚠️  还有残留需要清理"
    echo ""
    echo "运行这个命令清理所有残留:"
    echo "rm -f ~/.local/bin/codex* ~/.local/bin/cdx 2>/dev/null; rm -f /mnt/d/AI/viecom/cx /mnt/d/AI/viecom/start-codex.sh 2>/dev/null"
fi
