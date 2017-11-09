import json
import subprocess
import os

import pandas as pd
from pandas.io.json import json_normalize
from joblib import Parallel, delayed

TWEETS_DIR = os.getenv('TWEETS_DIR', './data/tweets')
HASH_TWEETS_DIR = os.getenv('HASH_TWEETS_DIR', './data/selected/hash-tweets')


def process(month_path, hash_month_path, day):
    day_path = os.path.join(month_path, day)
    hash_output_path = os.path.join(hash_month_path, day + '.json')
    cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | select(.entities_hashtags != []) | {{entities_hashtags, created_at, emojis, text}}]' | jq -s -c add""".format(day_path)
    print("$ {}".format(cmd))
    subprocess.call(cmd, shell=True)
    
    hash_tweets = subprocess.check_output(cmd, shell=True)
    hash_tweets = json.loads(hash_tweets)
    hash_group = json_normalize(hash_tweets).groupby(pd.Grouper(key='created_at', freq='H'))
    hash_stats = []
    for t, df in hash_group:
        hash_stat = df.groupby('hash')['emojis'].apply(list).apply(len)
        hash_stat = json.loads(hash_stat.to_json())
        print(t, t.timestamp())
        hash_stats.append({t.timestamp(): hash_stat})

    with open(hash_output_path, 'w') as f:
        json.dump({'tweets': hash_tweets[::1000], 'stats': hash_stats}, f)
    
    


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

            Parallel(n_jobs=-1)([delayed(process)(month_path, hash_month_path, day) for day in os.listdir(month_path)])


if __name__ == '__main__':
    main()
