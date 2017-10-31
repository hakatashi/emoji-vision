PYTHON = python3

data/geo-tweets.json: data/2017
	bash compose-geo-tweets.sh > $@
