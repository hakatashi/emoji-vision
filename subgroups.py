import json
import codecs

def main():
    with codecs.open('./data/emoji-test.txt', 'r', 'utf-8') as f:
        lines = f.readlines()

        latest_category = ''
        categories = {}
        for line in lines:
            if line.startswith('# subgroup:'):
                latest_category = line.split(': ')[1][:-1]
                categories[latest_category] = list()
            if line[0].isdigit():
                unicodes = [x for x in line.split(';')[0].split(' ') if x is not '']
                categories[latest_category].extend(unicodes)

    with open('./data/subgroups.txt', 'w') as f:
        f.write(json.dumps(categories))


if __name__ == '__main__':
    main()
