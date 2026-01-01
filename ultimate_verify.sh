#!/bin/bash
echo "=== 终极验证 ==="
echo ""

echo "1. 检查所有可能位置的文件:"
found=0
locations=(
    # WSL 位置
    "$HOME/.local/bin/codex"
    "$HOME/.local/bin/cdx" 
    "$HOME/.local/bin/wsl-codex"
    "$HOME/.local/bin/wcodex"
    "$HOME/.local/bin/viecom-codex"
    
    # Windows 位置
    "/mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator"
    "/mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator.cmd"
    "/mnt/c/Users/jeffl/AppData/Roaming/npm/codex-activator.ps1"
    "/mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator"
    
    # 项目位置
    "/mnt/d/AI/viecom/cx"
    "/mnt/d/AI/viecom/start-codex.sh"
    "/mnt/d/AI/viecom/codex.sh"
)

for loc in "${locations[@]}"; do
    if [ -e "$loc" ]; then
        echo "   ❌ 发现残留: $loc"
        found=1
    fi
done

if [ $found -eq 0 ]; then
    echo "   ✅ 所有位置都干净"
fi

echo ""
echo "2. 检查命令是否存在:"
echo -n "   which codex-activator: "
if which codex-activator &>/dev/null; then
    echo "❌ 仍存在"
    which codex-activator
else
    echo "✅ 不存在"
fi

echo ""
echo "3. 尝试执行命令:"
if codex-activator --help 2>&1 | grep -q "command not found\|无法将"; then
    echo "   ✅ 命令无法执行"
else
    echo "   ❌ 命令仍可执行"
fi

echo ""
echo "4. 检查 npm 包:"
if npm list -g 2>/dev/null | grep -q "codex-activator"; then
    echo "   ❌ npm 包仍存在"
else
    echo "   ✅ npm 包已卸载"
fi

echo ""
echo "5. 检查 bashrc 配置:"
if grep -q "codex\|cdx" ~/.bashrc; then
    echo "   ❌ bashrc 中有残留配置"
    grep -n "codex\|cdx" ~/.bashrc
else
    echo "   ✅ bashrc 配置干净"
fi

echo ""
echo "=== 验证完成 ==="
