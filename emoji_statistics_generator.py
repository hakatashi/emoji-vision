from glob import glob
from datetime import datetime
from joblib import Parallel, delayed
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

        device = re.match(r"\A<.+?>(.+?)<.+?>\Z", tweet['source']).group(1)

        for emoji in emojis:
            if emoji not in stat:
                stat[emoji] = {
                    'lang': {},
                    'device': {},
                    'hashtag': {},
                    'date': {},
                }

            if tweet['lang'] not in stat[emoji]['lang']:
                stat[emoji]['lang'][tweet['lang']] = 0

            stat[emoji]['lang'][tweet['lang']] += 1

            if device not in stat[emoji]['device']:
                stat[emoji]['device'][device] = 0

            stat[emoji]['device'][device] += 1

            for hashtag in tweet['entities_hashtags']:
                if hashtag['text'] not in stat[emoji]['hashtag']:
                    stat[emoji]['hashtag'][hashtag['text']] = 0

                stat[emoji]['hashtag'][hashtag['text']] += 1

            if date not in stat[emoji]['date']:
                stat[emoji]['date'][date] = 0

            stat[emoji]['date'][date] += 1

    return stat

if __name__ == '__main__':
    with codecs.open('./data/emoji-groups.json', 'r', 'utf-8') as f:
        emoji_groups = json.load(f)

    emoji_dict = {}

    for emoji in emoji_groups:
        emoji_dict[emoji['codepoint']] = emoji

    months = glob('data/tweets/*/*')

    for month in months:
        print("Processing {} directory...".format(month))

        tweet_files = []
        for dirpath, dirnames, filenames in os.walk(month):
            tweet_files += [os.path.join(dirpath, f) for f in filenames if f.endswith('.json')]

        print("Found {} files".format(len(tweet_files)))

        stats = Parallel(n_jobs=-1, verbose=5)([delayed(calc_stat)(filename) for filename in tweet_files[0:2]])
