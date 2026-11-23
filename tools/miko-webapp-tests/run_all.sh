#!/bin/bash
# 使い方: bash run_all.sh 久留米TXT 沖縄本体TXT 沖縄付属TXT
# 検証用TXTを分割し、久留米版・沖縄版それぞれで全シナリオを実行する。
set -e
D=$(cd "$(dirname "$0")" && pwd); W=$(mktemp -d)
mkdir -p "$W/krm" "$W/oki"
python3 -I "$D/split_bundle.py" "$1" "$W/krm"
python3 -I "$D/split_bundle.py" "$2" "$3" "$W/oki"
for t in scenarios split attend correct wish; do
  echo "##### $t 久留米"; node "$D/$t.js" "$W/krm" Code.gs,Payroll.gs
  echo "##### $t 沖縄";   node "$D/$t.js" "$W/oki" コード.gs,Payroll.gs
done
