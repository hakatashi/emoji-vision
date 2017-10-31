import json
import codecs

def main():
    with codecs.open('data/geo-tweets.json', 'r', 'utf-8') as f:
        tweets = json.load(f)
        counts = {}
        for tweet in tweets:
            for emoji in tweet['emojis']:
                if emoji['unified'] not in counts:
                    counts[emoji['unified']] = 0
                counts[emoji['unified']] += 1

    with open('data/emoji_counts.json', 'w') as f:
        counts = json.dumps(counts)
        f.write(counts)


if __name__ == '__main__':
    main()
