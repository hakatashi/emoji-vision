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
        os.makedirs('data/statistics')
    except:
        pass

    for file in stat_files:
        emoji, ext = os.path.splitext(os.path.basename(file))
        if emoji not in stat_file_dict:
            stat_file_dict[emoji] = []
        stat_file_dict[emoji].append(file)

    for emoji, files in stat_file_dict.items():
        print("Processing {}.json...".format(emoji))

        out_stat = {}

        stats = []
        for file in files:
            with codecs.open(file, 'r', 'utf-8') as f:
                stats.append(json.load(f))

        print("Loaded {} stats".format(len(stats)))

        out_stat['lang'] = sum([Counter(stat['lang']) for stat in stats], Counter())
        out_stat['device'] = sum([Counter(stat['device']) for stat in stats], Counter())
        out_stat['hashtag'] = sum([Counter(stat['hashtag']) for stat in stats], Counter())
        out_stat['date'] = sum([Counter(stat['date']) for stat in stats], Counter())
        out_stat['count'] = sum([stat['count'] for stat in stats])
        out_stat['group'] = emoji_dict[emoji]['group']
        out_stat['subgroup'] = emoji_dict[emoji]['subgroup']
        out_stat['name'] = emoji_dict[emoji]['name']

        out_file = os.sep.join(['data', 'statistics', "{}.json".format(emoji)])
        with open(out_file, 'w') as f:
            f.write(json.dumps(out_stat, separators=(',', ':')))
