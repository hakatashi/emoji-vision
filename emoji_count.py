import json


def main():
    with open('data/out.json') as f:
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
