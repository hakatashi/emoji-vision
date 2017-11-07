import json
import os
import subprocess

import pandas as pd
from pandas.io.json import json_normalize
from joblib import Parallel, delayed

TWEETS_DIR = './data/tweets'
LANG_TWEETS_DIR = './data/selected/lang-tweets'


def process(month_path, lang_month_path, day):
    day_path = os.path.join(month_path, day)
    lang_output_path = os.path.join(lang_month_path, day + '.json')
    cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | {{created_at, emojis, text, lang}}]' | jq -s -c add""".format(day_path)
    print("$ {}".format(cmd))

    lang_tweets = subprocess.check_output(cmd, shell=True)
    lang_tweets = json.loads(lang_tweets)
    lang_stats = json_normalize(lang_tweets).groupby('lang')['emojis'].apply(list).apply(len)
    lang_stats = json.loads(lang_stats.to_json())

    with open(lang_output_path, 'w') as f:
        json.dump({'tweets': lang_tweets[::1000], 'stats': lang_stats}, f)


def main():
    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        lang_year_path = os.path.join(LANG_TWEETS_DIR, year)

        for month in os.listdir(year_path):
            month_path = os.path.join(year_path, month)
            lang_month_path = os.path.join(lang_year_path, month)

            try:
                os.makedirs(lang_month_path)
            except:
                pass

            Parallel(n_jobs=-1)(
                [delayed(process)(month_path, lang_month_path, day) for day in
                 os.listdir(month_path)])


if __name__ == '__main__':
    main()
