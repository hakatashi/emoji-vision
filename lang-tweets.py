import json
import os
import random
import subprocess

import pandas as pd
from pandas.io.json import json_normalize
from joblib import Parallel, delayed

TWEETS_DIR = './data/tweets'
LANG_TWEETS_DIR = './data/selected/lang-tweets'


def process(month_path, lang_month_path, day):
    day_path = os.path.join(month_path, day)
    cmd = ("find {} -type f -name '*.json'"
           " | xargs jq '[.[]"
           " | {{created_at, emojis, lang, text}}]'"
           " | jq -s -c add").format(day_path)
    print("$ {}".format(cmd))

    lang_tweets = subprocess.check_output(cmd, shell=True)
    lang_tweets = json.loads(lang_tweets)
    lang_tweets = json_normalize(lang_tweets)
    lang_tweets['created_at'] \
        = lang_tweets['created_at'].apply(pd.to_datetime)
    lang_tweets = lang_tweets.groupby(
        pd.Grouper(key='created_at', freq='4H'))

    top_langs = []
    top_lang_tweets = pd.DataFrame(
        columns=['created_at', 'emojis', 'lang', 'text'])
    for t, df in lang_tweets:
        stat = df.groupby('lang').size()
        stat = stat.sort_values(ascending=False)[:20]
        top_langs.append({'created_at': t.timestamp(),
                          'lang': stat.to_dict()})

        top_lang_tweets = top_lang_tweets.append(
            df[df['lang'].apply(lambda x: x in stat)], ignore_index=True)

    top_lang_tweets = json.loads(
        top_lang_tweets.to_json(orient='records', force_ascii=False))
    sampled_top_lang_tweets = [top_lang_tweets[i] for i in sorted(
        random.sample(range(len(top_lang_tweets)), 1500))]

    lang_output_path = os.path.join(lang_month_path, day + '.json')
    with open(lang_output_path, 'w') as f:
        json.dump({'tweets': sampled_top_lang_tweets, 'stats': top_langs},
                  f, ensure_ascii=False, separators=(',', ':'))


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
