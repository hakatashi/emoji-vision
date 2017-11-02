# データセットの作り方

ツイートデータは`data/tweets`ディレクトリ下に置く．

特定のフィールドだけ抽出したJSONは`data/selected`ディレクトリ下に，絵文字のカウントなどの統計データは`data/statistics`ディレクトリ下に置く．

まとめると次のような階層構成になる．

```shell
data
├── emoji-test.txt
├── selected
│  └── geo-tweets.json
├── statistics
│  └── statistics.csv
└── tweets
   └── 2017
```

-	geo-tweets.json

```shell
find data/tweets -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {geo, created_at, emojis, text}]' |  jq -s -c add > data/selected/geo-tweets.json
```

-	lang-tweets.json

```shell
find data/ -type f -name

# 統計データの作り方
`data`ディレクトリ下に[emoji-text.txt](http://unicode.org/Public/emoji/5.0/emoji-test.txt)を置いておく．

```shell
python statistics.py
```
