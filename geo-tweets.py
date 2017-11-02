import subprocess
import os

TWEETS_DIR = './data/tweets'


def main():
    for year in os.listdir(TWEETS_DIR):

        year_path = os.path.join(TWEETS_DIR, year)
        for month in os.listdir(year_path):

            month_path = os.path.join(year_path, month)
            for day in os.listdir(month_path):

                day_path = os.path.join(month_path, day)
                for hour in os.listdir(day_path):

                    hour_path = os.path.join(day_path, hour)
                    subprocess.Popen(shell=True, )





if __name__ == '__main__':
    main()
