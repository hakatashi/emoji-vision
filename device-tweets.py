import json
import subprocess
import os

import pandas as pd
from joblib import Parallel, delayed
from pandas.io.json import json_normalize

TWEETS_DIR = './data/tweets'
DEVICE_TWEETS_DIR = './data/selected/device-tweets'


def process(month_path, device_month_path, day):
    day_path = os.path.join(month_path, day)
    device_output_path = os.path.join(device_month_path, day + '.json')
    cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | {{created_at, emojis, text, source}}]' | jq -s -c add""".format(
        day_path)
    print("$ {}".format(cmd))

    device_tweets = subprocess.check_output(cmd, shell=True)
    device_tweets = json.loads(device_tweets)
    device_tweets_df = json_normalize(device_tweets)
    device_tweets_df = pd.DataFrame(
        ({'created_at': tup.created_at, 'source': tup.source} for tup in
         device_tweets_df.itertuples())
    )
    device_tweets_df['created_at'] = device_tweets_df['created_at'].apply(
        pd.to_datetime)
    hour_grouper = pd.Grouper(key='created_at', freq='H')
    device_tweets_hours = device_tweets_df.groupby(hour_grouper)

    device_stats = []
    for t, df in device_tweets_hours:
        device_stat = df.groupby('source').size()
        device_stat = device_stat.sort_values(ascending=False)
        device_stat = device_stat[:20]
        device_stat = json.loads(device_stat.to_json())
        device_stats.append(
            {'created_at': t.timestamp(), 'source': device_stat})

    with open(device_output_path, 'w') as f:
        json.dump({'tweets': device_tweets[::100], 'stats': device_stats}, f)


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
