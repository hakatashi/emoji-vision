import json
import codecs

def main():
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
                emojis.append(latest_group + ',' + latest_subgroup + ',' + unicode_point)

    with open('./data/groups.csv', 'w') as f:
        f.write('# group, subgroup, unicode point\n')
        for emoji in emojis:
            f.write(emoji + '\n')


if __name__ == '__main__':
    main()
