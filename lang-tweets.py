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
    cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | {{created_at, emojis, text, lang}}]' | jq -s -c add""".format(
        day_path)
    print("$ {}".format(cmd))

    lang_tweets = subprocess.check_output(cmd, shell=True)
    lang_tweets = json.loads(lang_tweets)
    lang_tweets_df = json_normalize(lang_tweets)
    lang_tweets_df = pd.DataFrame(
        ({'created_at': tup.created_at, 'lang': tup.lang} for tup in
         lang_tweets_df.itertuples())
    )
    lang_tweets_df['created_at'] = lang_tweets_df['created_at'].apply(
        pd.to_datetime)
    hour_grouper = pd.Grouper(key='created_at', freq='H')
    lang_tweets_hours = lang_tweets_df.groupby(hour_grouper)

    lang_stats = []
    for t, df in lang_tweets_hours:
        lang_stat = df.groupby('lang').size()
        lang_stat = lang_stat.sort_values(ascending=False)
        lang_stat = lang_stat[:20]
        lang_stat = json.loads(lang_stat.to_json())
        lang_stats.append({'created_at': t.timestamp(), 'lang_stat': lang_stat})

    with open(lang_output_path, 'w') as f:
        json.dump({'tweets': lang_tweets[::100], 'stats': lang_stats}, f)


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
