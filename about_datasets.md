# データセットの概要

[emoji-collecter.js](https://github.com/InfovisHandsOn/A_D4/blob/master/emoji-collector.js)で取ってきた生データはこんな感じ．

geoタグの付いていないツイート

```shell
In [13]: pprint.pprint(js[0])
{'coordinates': None,
 'created_at': 'Tue Jun 06 06:30:00 +0000 2017',
 'emojis': [{'short_name': 'tired_face', 'unified': '1F62B'}],
 'entities_hashtags': [],
 'entities_urls': [],
 'geo': None,
 'id_str': '871977455724134400',
 'in_reply_to_status_id_str': None,
 'lang': 'en',
 'place': None,
 'retweeted_status_id_str': '871710739433652224',
 'source': '<a href="http://twitter.com/download/iphone" '
           'rel="nofollow">Twitter for iPhone</a>',
 'text': "RT @iveryy_: I pray to GOD my son ain't like none of you corny "
         'niggas 😫',
 'timestamp_ms': '1496730600659',
 'user_followers_count': 906,
 'user_friends_count': 362,
 'user_id_str': '68872363',
 'user_lang': 'en',
 'user_screen_name': 'jessx213',
 'user_statuses_count': 128183,
 'user_utc_offset': -14400}
```

geoタグ付きのツイート
```shell
In [12]: for x in js:
    ...:     if x['geo'] is not None:
    ...:         pprint.pprint(x)
    ...:
{'coordinates': {'coordinates': [55.15189319, 25.12818472], 'type': 'Point'},
 'created_at': 'Tue Jun 06 06:30:52 +0000 2017',
 'emojis': [{'short_name': 'heart_eyes', 'unified': '1F60D'},
            {'short_name': 'sunny', 'unified': '2600'}],
 'entities_hashtags': [{'indices': [6, 12], 'text': 'dubai'}],
 'entities_urls': [{'display_url': 'instagram.com/p/BU_PZYflRKHt…',
                    'expanded_url': 'https://www.instagram.com/p/BU_PZYflRKHt3MX5iRjC1nC6Jq5IcA1wHrJOpI0/',
                    'indices': [68, 91],
                    'url': 'https://t.co/zPY9SKJXgw'}],
 'geo': {'coordinates': [25.12818472, 55.15189319], 'type': 'Point'},
 'id_str': '871977673823793153',
 'in_reply_to_status_id_str': None,
 'lang': 'in',
 'place': {'attributes': {},
           'bounding_box': {'coordinates': [[[54.893973, 24.618253],
                                             [54.893973, 25.368672],
                                             [56.208372, 25.368672],
                                             [56.208372, 24.618253]]],
                            'type': 'Polygon'},
           'country': 'United Arab Emirates',
           'country_code': 'AE',
           'full_name': 'Dubai, United Arab Emirates',
           'id': '001907e868d06e24',
           'name': 'Dubai',
           'place_type': 'admin',
           'url': 'https://api.twitter.com/1.1/geo/id/001907e868d06e24.json'},
 'retweeted_status_id_str': None,
 'source': '<a href="http://instagram.com" rel="nofollow">Instagram</a>',
 'text': 'Adios #dubai 😍until next time 🛫🛬☀️ @ Anantara The Palm Dubai Resort '
         'https://t.co/zPY9SKJXgw',
 'timestamp_ms': '1496730652658',
 'user_followers_count': 4555,
 'user_friends_count': 2413,
 'user_id_str': '123782063',
 'user_lang': 'en',
 'user_screen_name': 'MrPaulNewman',
 'user_statuses_count': 23799,
 'user_utc_offset': 3600}
```

## GEOモード用データセット
とりあえず以下のフィールドを取っておけば良さそう．

-   `created_at`
-   `emojis`
-   `geo`
-	`text`
-   (`place`)

## LANGモード用データセット
[tweet object](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)いわく`["lang"]`はテキストから自動検出された言語

> Nullable. When present, indicates a BCP 47 language identifier corresponding to the machine-detected language of the Tweet text, or und if no language could be detected.

[user object](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object)いわく`["user"]["lang"]`はユーザーがインターフェースに設定している言語

> The BCP 47 code for the user’s self-declared user interface language. May or may not have anything to do with the content of their Tweets.

-	`created_at`
-	`emojis`
-	`text`
-	`lang`



## 各モード（GEO, LANG, DEVICE, HASH）用のデータセットの作り方

ツイートデータは`data/tweets`ディレクトリ下に置く．

特定のフィールドだけ抽出したJSONは`data/selected`ディレクトリ下に置く．

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
$ python geo-tweets.py
```

-	lang-tweets.json

```shell
$ find data/tweets -type f -name "*.json" | xargs jq '[.[] | {created_at, emojis, text, lang}]' | jq -s -c add > data/selected/lang-tweets.json
```

-	device-tweets.json

```shell
$ find data/tweets -type f -name "*.json" | xargs jq '[.[] | {created_at, emojis, text, lang}]' | jq -s -c add > data/selected/device-tweets.json
$ python parse_link.py
```

## 統計データセットの作り方

絵文字のカウントなどの統計データは`data/statistics`ディレクトリ下に置く．

`data`ディレクトリ下に[emoji-text.txt](http://unicode.org/Public/emoji/5.0/emoji-test.txt)を置いておく．

```shell
python statistics.py
```
