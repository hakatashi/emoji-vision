import json
import subprocess
import os
import random

import pandas as pd
from joblib import Parallel, delayed
from pandas.io.json import json_normalize

TWEETS_DIR = './data/tweets'
DEVICE_TWEETS_DIR = './data/selected/device-tweets'


def process(month_path, device_month_path, day):
    day_path = os.path.join(month_path, day)
    cmd = ("find {} -type f -name '*.json'"
           " | xargs jq '[.[]"
           " | {{created_at, emojis, text, source}}]'"
           " | jq -s -c add").format(day_path)
    print("$ {}".format(cmd))

    device_tweets = subprocess.check_output(cmd, shell=True)
    device_tweets = json.loads(device_tweets)
    device_tweets = json_normalize(device_tweets)
    device_tweets['created_at'] \
        = device_tweets['created_at'].apply(pd.to_datetime)

    device_tweets = device_tweets.groupby(
        pd.Grouper(key='created_at', freq='4H'))

    top_sources = []
    top_source_tweets = pd.DataFrame(
        columns=['created_at', 'emojis', 'source', 'text'])
    for t, df in device_tweets:
        stat = df.groupby('source').size()
        stat = stat.sort_values(ascending=False)[:20]
        top_sources.append({'created_at': t.timestamp(),
                            'source': stat.to_dict()})

        top_source_tweets = top_source_tweets.append(
            df[df['source'].apply(lambda x: x in stat)], ignore_index=True)

    top_source_tweets = json.loads(
        top_source_tweets.to_json(orient='records', force_ascii=False))
    sampled_top_source_tweets = [top_source_tweets[i] for i in sorted(
        random.sample(range(len(top_source_tweets)), 1500))]

    device_output_path = os.path.join(device_month_path, day + '.json')
    with open(device_output_path, 'w') as f:
        json.dump({'tweets': sampled_top_source_tweets, 'stats': top_sources},
                  f, ensure_ascii=False, separators=(',', ':'))


def main():
    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        device_year_path = os.path.join(DEVICE_TWEETS_DIR, year)

        for month in os.listdir(year_path):
            month_path = os.path.join(year_path, month)
            device_month_path = os.path.join(device_year_path, month)

            try:
                os.makedirs(device_month_path)
            except:
                pass

            Parallel(n_jobs=-1)(
                [delayed(process)(month_path, device_month_path, day) for day in
                 os.listdir(month_path)])


if __name__ == '__main__':
    main()
