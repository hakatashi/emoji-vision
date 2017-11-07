from glob import glob
from joblib import Parallel, delayed
import os
import json
import codecs
import operator

def stat(filename):
    with codecs.open(filename, 'r', 'utf-8') as f:
        tweets = json.load(f)
    return len(tweets)

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

        stats = Parallel(n_jobs=-1, verbose=5)([delayed(stat)(filename) for filename in tweet_files])
        print(sum(stats))
