import json
import subprocess
import os
import random

import pandas as pd
from pandas.io.json import json_normalize
from joblib import Parallel, delayed

TWEETS_DIR = os.getenv('TWEETS_DIR', './data/tweets')
HASH_TWEETS_DIR = os.getenv('HASH_TWEETS_DIR', './data/selected/hash-tweets')


def process(month_path, hash_month_path, day):
    day_path = os.path.join(month_path, day)
    hash_output_path = os.path.join(hash_month_path, day + '.json')
    cmd = ("find {} -type f -name '*.json'"
           " | xargs jq '[.[]"
           " | select(.entities_hashtags != [])"
           " | {{entities_hashtags, created_at, emojis, text}}]'"
           " | jq -s -c add").format(day_path)
    print("$ {}".format(cmd))

    hash_tweets = subprocess.check_output(cmd, shell=True)
    hash_tweets = json.loads(hash_tweets)
    hash_tweets = json_normalize(hash_tweets)
    hash_tweets['created_at'] = hash_tweets['created_at'].apply(pd.to_datetime)
    hash_tweets = pd.DataFrame(
        ((tup.created_at, tup.emojis, h['text'], tup.text)
         for tup in hash_tweets.itertuples()
         for h in tup.entities_hashtags),
        columns=['created_at', 'emojis', 'hashtag', 'text'])
    hash_tweets = hash_tweets.groupby(
        pd.Grouper(key='created_at', freq='H'))

    top_hashes = []
    top_hash_tweets = pd.DataFrame(
        columns=['created_at', 'emojis', 'hashtag', 'text'])
    for t, df in hash_tweets:
        stat = df.groupby('hashtag').size()
        stat = stat.sort_values(ascending=False)[:20]
        top_hashes.append({'created_at': t.timestamp(),
                           'hashtag': stat.to_dict()})

        top_hash_tweets = top_hash_tweets.append(
            df[df['hashtag'].apply(lambda x: x in stat)], ignore_index=True)

    top_hash_tweets = json.loads(
        top_hash_tweets.to_json(orient='records', force_ascii=False))
    sampled_top_hash_tweets = [top_hash_tweets[i] for i in sorted(random.sample(range(len(top_hash_tweets)), 1500))]
    with open(hash_output_path, 'w') as f:
        json.dump({'tweets': sampled_top_hash_tweets, 'stats': top_hashes},
                  f, ensure_ascii=False, separators=(',', ':'))


def main():
    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        hash_year_path = os.path.join(HASH_TWEETS_DIR, year)

        for month in os.listdir(year_path):
            month_path = os.path.join(year_path, month)
            hash_month_path = os.path.join(hash_year_path, month)

            try:
                os.makedirs(hash_month_path)
            except:
                pass

            Parallel(n_jobs=-1)(
                [delayed(process)(month_path, hash_month_path, day) for day in
                 os.listdir(month_path)])


if __name__ == '__main__':
    main()
