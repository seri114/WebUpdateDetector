## 概要
Webを巡回して更新情報を取得、通知。

## エミュレータ使用方法
cd firebase
firebase emulators:start

## 全体設計
webpage -> write check homepage

gcp timer -> pub/sub(チェック) -> crawl -> if diff -> 通知

## DB設計
### Action
チェックタイムアウトの設定を検索
チェック時に前回と差分があるか確認
差分があれば、通知先に通知
