import json


def main():
    with open('./data/emoji-test.txt', 'r') as f:
        lines = f.readlines()

        latest_category = ''
        categories = {}
        for line in lines:
            if line.startswith('# subgroup:'):
                latest_category = line.split(': ')[1][:-1]
                categories[latest_category] = list()
            if line[0].isdigit():
                unicodes = line.split(';')[0].rstrip()
                categories[latest_category].append(unicodes)

    with open('./data/subgroups.txt', 'w') as f:
        f.write(json.dumps(categories))


if __name__ == '__main__':
    main()
        
