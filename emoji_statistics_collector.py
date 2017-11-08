from glob import glob
from collections import Counter
import os
import json
import codecs

if __name__ == '__main__':
    with codecs.open('./data/emoji-groups.json', 'r', 'utf-8') as f:
        emoji_groups = json.load(f)

    emoji_dict = {}

    for emoji in emoji_groups:
        emoji_dict[emoji['codepoint']] = emoji

    stat_files = glob('data/temp/statistics/**/*.json', recursive=True)
    stat_file_dict = {}

    try:
        os.makedirs('data/statistics/full')
    except:
        pass

    try:
        os.makedirs('data/statistics/slim')
    except:
        pass

    for file in stat_files:
        emoji, ext = os.path.splitext(os.path.basename(file))
        if emoji not in stat_file_dict:
            stat_file_dict[emoji] = []
        stat_file_dict[emoji].append(file)

    for emoji, files in stat_file_dict.items():
        print("Processing {}.json...".format(emoji))

        stats = []
        for file in files:
            with codecs.open(file, 'r', 'utf-8') as f:
                stats.append(json.load(f))

        print("Loaded {} stats".format(len(stats)))

        full_stat = {}
        for key in ['lang', 'device', 'hashtag', 'date']:
            full_stat[key] = sum([Counter(stat[key]) for stat in stats], Counter())
        full_stat['count'] = sum([stat['count'] for stat in stats])
        full_stat['group'] = emoji_dict[emoji]['group']
        full_stat['subgroup'] = emoji_dict[emoji]['subgroup']
        full_stat['name'] = emoji_dict[emoji]['name']

        out_file = os.path.join('data', 'statistics', 'full', "{}.json".format(emoji))
        with open(out_file, 'w') as f:
            f.write(json.dumps(full_stat, separators=(',', ':')))

        slim_stat = {}
        slim_stat['lang'] = {
            'total': sum(full_stat['lang'].values()),
            'entries': full_stat['lang'].most_common(),
        }
        slim_stat['date'] = {
            'total': sum(full_stat['date'].values()),
            'entries': list(full_stat['date'].items()),
        }
        for key in ['device', 'hashtag']:
            slim_stat[key] = {
                'total': sum(full_stat[key].values()),
                'entries': full_stat[key].most_common(100),
            }
        slim_stat['count'] = full_stat['count']
        slim_stat['group'] = emoji_dict[emoji]['group']
        slim_stat['subgroup'] = emoji_dict[emoji]['subgroup']
        slim_stat['name'] = emoji_dict[emoji]['name']

        out_file = os.sep.join(['data', 'statistics', 'slim', "{}.json".format(emoji)])
        with open(out_file, 'w') as f:
            f.write(json.dumps(slim_stat, separators=(',', ':')))
