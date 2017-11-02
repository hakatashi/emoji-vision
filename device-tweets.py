import codecs
import subprocess
import os

TWEETS_DIR = './data/tweets'
DEVICE_TWEETS_DIR = './data/selected/device-tweets'


def main():
    try:
        os.mkdir(DEVICE_TWEETS_DIR)
    except:
        pass

    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        device_year_path = os.path.join(DEVICE_TWEETS_DIR, year)

        try:
            os.mkdir(device_year_path)
        except:
            pass

        for month in os.listdir(year_path):

            month_path = os.path.join(year_path, month)
            device_month_path = os.path.join(device_year_path, month)

            try:
                os.mkdir(device_month_path)
            except:
                pass

            for day in os.listdir(month_path):
                day_path = os.path.join(month_path, day)
                device_output_path = os.path.join(device_month_path, day + '.json')
                # with codecs.open(device_output_path, 'w') as f:
                cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | {{created_at, emojis, text, source}}]' | jq -s -c add > {}""".format(
                    day_path, device_output_path)
                subprocess.call(cmd, shell=True)


if __name__ == '__main__':
    main()
