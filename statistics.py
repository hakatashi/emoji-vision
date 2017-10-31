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

    with codecs.open('./data/emoji-test.txt', 'r', 'utf-8') as f:
        lines = f.readlines()

        emojis = []
        for line in lines:
            if line.startswith('# group:'):
                latest_group = line.split(': ')[1][:-1]
            if line.startswith('# subgroup:'):
                latest_subgroup = line.split(': ')[1][:-1]
            if line[0].isdigit():
                unicode_point = '-'.join(line.split(';')[0].rstrip().split())
                name = line.split()[-1]
                if unicode_point in counts.keys():
                    count = counts[unicode_point]
                    emojis.append(name + ',' + str(count) + ',' + unicode_point + ',' + latest_subgroup + ',' + latest_group)

    with open('./data/statistics.csv', 'w') as f:
        f.write('name,count,unified,subgroup,group\n')
        for emoji in emojis:
            f.write(emoji + '\n')


if __name__ == '__main__':
    main()
