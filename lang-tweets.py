import codecs
import subprocess
import os

TWEETS_DIR = './data/tweets'
LANG_TWEETS_DIR = './data/selected/lang-tweets'


def main():
    try:
        os.mkdir(LANG_TWEETS_DIR)
    except:
        pass
    
    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        lang_year_path = os.path.join(LANG_TWEETS_DIR, year)

        try:
            os.mkdir(lang_year_path)
        except:
            pass

        for month in os.listdir(year_path):

            month_path = os.path.join(year_path, month)
            lang_month_path = os.path.join(lang_year_path, month)

            try:
                os.mkdir(lang_month_path)
            except:
                pass

            for day in os.listdir(month_path):
                day_path = os.path.join(month_path, day)
                lang_output_path = os.path.join(lang_month_path, day + '.json')
                # with codecs.open(lang_output_path, 'w') as f:
                cmd = """find {} -type f -name "*.json" | xargs jq '[.[] | {{created_at, emojis, text, lang}}]' | jq -s -c add > {}""".format(
                    day_path, lang_output_path)
                subprocess.call(cmd, shell=True)


if __name__ == '__main__':
    main()
