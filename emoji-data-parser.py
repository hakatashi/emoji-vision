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
                name = line.split('# ')[1].split()
                name.pop(0)
                name = ' '.join(name)
                emojis.append({
                    'name': name,
                    'codepoint': unicode_point,
                    'subgroup': latest_subgroup,
                    'group': latest_group,
                })

    with open('./data/emoji-groups.json', 'w') as f:
        f.write(json.dumps(emojis, separators=(',', ':')))

if __name__ == '__main__':
    main()
