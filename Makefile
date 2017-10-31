PYTHON = python3

data/geo-tweets.json: data/tweets
	find $< -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {geo, created_at, emojis, text}]' |  jq -s -c add > $@

data/emoji-test.txt:
	wget http://unicode.org/Public/emoji/5.0/emoji-test.txt -O $@

data/emoji_counts.json: data/geo-tweets.json
	$(PYTHON) emoji_count.py

data/statistics.csv: data/geo-tweets.json data/emoji-test.json
	$(PYTHON) statistics.py
