from glob import glob
from joblib import Parallel, delayed
from datetime import datetime
from collections import Counter
import os
import re
import json
import codecs
import operator

def calc_stat(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        tweets = json.load(f)

    stat = {}
    day_dict = {}

    for tweet in tweets:
        emojis = list(set([e['unified'] for e in tweet['emojis']]))

        timestamp = datetime.utcfromtimestamp(int(tweet['timestamp_ms']) / 1000)
        date = timestamp.date().isoformat()

        match = re.match(r"\A<.+?>(.+?)<.+?>\Z", tweet['source'])
        if match is None:
            device = None
        else:
            device = match.group(1)

        for emoji in emojis:
            if emoji not in stat:
                stat[emoji] = {
                    'lang': Counter(),
                    'device': Counter(),
                    'hashtag': Counter(),
                    'date': Counter(),
                    'count': 0,
                }

            stat[emoji]['lang'][tweet['lang']] += 1

            if device is not None:
                stat[emoji]['device'][device] += 1

            for hashtag in tweet['entities_hashtags']:
                stat[emoji]['hashtag'][hashtag['text']] += 1

            stat[emoji]['date'][date] += 1
            stat[emoji]['count'] += 1

    return stat

if __name__ == '__main__':
    with codecs.open('./data/emoji-groups.json', 'r', 'utf-8') as f:
        emoji_groups = json.load(f)

    emoji_dict = {}

    for emoji in emoji_groups:
        emoji_dict[emoji['codepoint']] = emoji

    days = glob('data/tweets/*/*/*')

    for day in days:
        print("Processing {} directory...".format(day))

        tweet_files = []
        for dirpath, dirnames, filenames in os.walk(day):
            tweet_files += [os.path.join(dirpath, f) for f in filenames if f.endswith('.json')]

        print("Found {} files".format(len(tweet_files)))

        stats = Parallel(n_jobs=-1, verbose=5)([delayed(calc_stat)(filename) for filename in tweet_files])

        print('Concatenating stats...')
        unistat = {}

        for stat in stats:
            for emoji, emoji_stat in stat.items():
                if emoji not in unistat:
                    unistat[emoji] = emoji_stat
                    continue
                for key in ['lang', 'device', 'hashtag', 'date']:
                    unistat[emoji][key] += emoji_stat[key]
                unistat[emoji]['count'] += emoji_stat['count']

        out_dir = os.sep.join(['data', 'temp', 'statistics', *os.path.normpath(day).split(os.sep)[-3:]])
        try:
            os.makedirs(out_dir)
        except:
            pass

        for emoji, emoji_stat in unistat.items():
            out_file = os.path.join(out_dir, "{}.json".format(emoji))
            with open(out_file, 'w') as f:
                f.write(json.dumps(emoji_stat, separators=(',', ':')))
