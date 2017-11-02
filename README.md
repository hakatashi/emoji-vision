# A_D4
紺野瑛介, 高橋光輝


-   how to get geo-tweets.json

```shell
find data -type f -name "*.json" | xargs jq '[.[] | select(.geo != null) | {geo, created_at, emojis, text}]' |  jq -s -c add > geo-tweets.json
```
