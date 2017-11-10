from glob import glob
from collections import Counter
import os
import json
import codecs

if __name__ == '__main__':
    stat_files = glob('data/statistics/slim/*.json')
    ranking = []

    for file in stat_files:
        print("Processing {}...".format(file))

        emoji, ext = os.path.splitext(os.path.basename(file))

        with codecs.open(file, 'r', 'utf-8') as f:
            stat = json.load(f)

        ranking.append({
            'name': emoji,
            'count': stat['count'],
        })

    ranking.sort(key=lambda rank: rank['count'], reverse=True)

    with open('data/ranking.json', 'w') as f:
        f.write(json.dumps(ranking, indent=4))
