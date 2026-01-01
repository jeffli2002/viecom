#!/bin/bash
echo "=== 分析 codex-activator ==="
echo ""

# 查看 index.js 的前100行
echo "1. index.js 内容摘要:"
head -100 /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/index.js

echo ""
echo "2. 查找关键信息:"
echo "  查找 URL/网站:"
grep -i "http\|https\|url\|website\|api" /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/index.js | head -10

echo ""
echo "  查找启动命令:"
grep -i "start\|launch\|run\|exec\|spawn\|open\|browser" /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/index.js | head -10

echo ""
echo "  查找配置文件:"
grep -i "config\|\.json\|\.yaml\|\.toml" /mnt/c/Users/jeffl/AppData/Roaming/npm/node_modules/codex-activator/index.js | head -10
