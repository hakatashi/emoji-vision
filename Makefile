PYTHON = python3

data/geo-tweets.json: data/tweets
	find $< -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {geo, created_at, emojis, text}]' |  jq -s -c add > $@

data/selected/geo-tweets: data/tweets
    $(PYTHON) geo-tweets.py

data/selected/lang-tweets: data/tweets
    $(PYTHON) lang-tweets.py

data/selected/device-tweets: data/tweets
    $(PYTHON) device-tweets.py
    $(PYTHON) parse-link.py

data/selected/hash-tweets: data/tweets
    $(PYTHON) hash-tweets.py

data/emoji-test.txt:
	wget http://unicode.org/Public/emoji/5.0/emoji-test.txt -O $@

data/emoji_counts.json: data/geo-tweets.json
	$(PYTHON) emoji_count.py

data/statistics.csv: data/geo-tweets.json data/emoji-test.txt
	$(PYTHON) statistics.py
