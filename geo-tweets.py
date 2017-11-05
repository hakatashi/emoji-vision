import codecs
import subprocess
import os

TWEETS_DIR = './data/tweets'
GEO_TWEETS_DIR = './data/selected/geo-tweets'


def main():
    try:
        os.makedirs(GEO_TWEETS_DIR)
    except:
        pass

    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        geo_year_path = os.path.join(GEO_TWEETS_DIR, year)

        try:
            os.makedirs(geo_year_path)
        except:
            pass

        for month in os.listdir(year_path):

            month_path = os.path.join(year_path, month)
            geo_month_path = os.path.join(geo_year_path, month)

            try:
                os.makedirs(geo_month_path)
            except:
                pass

            for day in os.listdir(month_path):
                day_path = os.path.join(month_path, day)
                geo_output_path = os.path.join(geo_month_path, day + '.json')
                # with codecs.open(geo_output_path, 'w') as f:
                cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {{geo, created_at, emojis, text}}]' | jq -s -c add > {}""".format(
                    day_path, geo_output_path)
                print("$ {}".format(cmd))
                subprocess.call(cmd, shell=True)


if __name__ == '__main__':
    main()
